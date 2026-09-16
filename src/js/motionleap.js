/**
 * NovaCut - Motionleap Cinemagraph & Photo Flow Animation Engine
 * Animates still images, AI backgrounds, and video freezes with seamless dual-phase WebGL flow advection.
 */
class NovaCutMotionleap {
    constructor(engine, timeline) {
        this.engine = engine;
        this.timeline = timeline;

        this.activeClipId = null;
        this.activeTool = 'path'; // 'path' | 'freeze' | 'unfreeze' | 'anchor'
        this.brushRadius = 40;
        this.isDrawing = false;
        this.currentStroke = null;
        this.mousePosInClip = { x: 0, y: 0 };
        this.isMouseOverClip = false;

        // WebGL Setup
        this.glCanvas = document.createElement('canvas');
        this.glCanvas.width = 1280;
        this.glCanvas.height = 720;
        this.initWebGL();

        // 2D Flow & Mask rasterizer canvas
        this.flowCanvas = document.createElement('canvas');
        this.flowCanvas.width = 512;
        this.flowCanvas.height = 512;
        this.flowCtx = this.flowCanvas.getContext('2d');

        this.cachedImageSource = null;
        this.cachedFlowVersion = -1;
    }

    initWebGL() {
        const gl = this.glCanvas.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha: false });
        if (!gl) {
            console.warn('[Motionleap] WebGL not available, falling back to 2D.');
            this.gl = null;
            return;
        }
        this.gl = gl;

        const vsSource = `
            attribute vec2 a_position;
            varying vec2 v_uv;
            void main() {
                v_uv = (a_position + 1.0) * 0.5;
                v_uv.y = 1.0 - v_uv.y; // Flip Y for WebGL texture orientation
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;

        // Seamless dual-phase cyclic flow advection shader
        const fsSource = `
            precision highp float;
            varying vec2 v_uv;
            uniform sampler2D u_image;
            uniform sampler2D u_flowMap; // RG = vector (-1..1), B = freeze mask (1.0 = frozen), A = speed
            uniform float u_time;
            uniform float u_speed;
            uniform float u_distortion;

            void main() {
                vec4 flowData = texture2D(u_flowMap, v_uv);
                
                // Freeze mask in Blue channel: 1.0 = 100% frozen
                float freeze = flowData.b;
                vec2 rawVector = (flowData.rg * 2.0 - 1.0);
                vec2 flow = rawVector * (1.0 - freeze);
                float flowLen = length(flow);

                if (flowLen < 0.002) {
                    gl_FragColor = texture2D(u_image, v_uv);
                    return;
                }

                // Dual phase advection: two waves 180 degrees out of phase
                float cycleSpeed = u_speed * 0.35;
                float t1 = fract(u_time * cycleSpeed);
                float t2 = fract(u_time * cycleSpeed + 0.5);

                vec2 offset = flow * (u_distortion * 0.045);
                vec2 uv1 = clamp(v_uv - offset * t1, 0.0, 1.0);
                vec2 uv2 = clamp(v_uv - offset * t2, 0.0, 1.0);

                // Triangular weighting window for seamless cross-fade
                float w1 = 1.0 - abs(t1 * 2.0 - 1.0);
                float w2 = 1.0 - abs(t2 * 2.0 - 1.0);

                // Smooth blending
                w1 = smoothstep(0.0, 1.0, w1);
                w2 = smoothstep(0.0, 1.0, w2);

                vec4 col1 = texture2D(u_image, uv1);
                vec4 col2 = texture2D(u_image, uv2);

                vec4 blended = (col1 * w1 + col2 * w2) / max(0.0001, (w1 + w2));
                gl_FragColor = blended;
            }
        `;

        const compileShader = (type, src) => {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, src);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('[Motionleap] Shader compile error:', gl.getShaderInfoLog(shader));
                return null;
            }
            return shader;
        };

        const vs = compileShader(gl.VERTEX_SHADER, vsSource);
        const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('[Motionleap] Program link error:', gl.getProgramInfoLog(this.program));
            return;
        }

        // Fullscreen quad buffer
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
            -1,  1,
             1, -1,
             1,  1,
        ]), gl.STATIC_DRAW);

        this.posAttrib = gl.getAttribLocation(this.program, 'a_position');
        this.uImageLoc = gl.getUniformLocation(this.program, 'u_image');
        this.uFlowMapLoc = gl.getUniformLocation(this.program, 'u_flowMap');
        this.uTimeLoc = gl.getUniformLocation(this.program, 'u_time');
        this.uSpeedLoc = gl.getUniformLocation(this.program, 'u_speed');
        this.uDistortionLoc = gl.getUniformLocation(this.program, 'u_distortion');

        // Create WebGL textures
        this.imageTexture = gl.createTexture();
        this.flowTexture = gl.createTexture();
    }

    setupTexture(texture, source, isCanvas = false) {
        const gl = this.gl;
        if (!gl) return;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        if (isCanvas) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        }
    }

    /**
     * Rasterizes user flow paths, anchors, and freeze brush into 2D flow canvas texture
     */
    updateFlowMapTexture(cinemagraph) {
        const ctx = this.flowCtx;
        const w = this.flowCanvas.width;
        const h = this.flowCanvas.height;

        // Base color: R=128 (0 vector X), G=128 (0 vector Y), B=0 (not frozen), A=255
        ctx.fillStyle = 'rgb(128, 128, 0)';
        ctx.fillRect(0, 0, w, h);

        const paths = cinemagraph.paths || [];
        const anchors = cinemagraph.anchors || [];

        // 1. Draw Flow Paths with smooth directional falloff
        paths.forEach(p => {
            const x1 = p.x1 * w;
            const y1 = p.y1 * h;
            const x2 = p.x2 * w;
            const y2 = p.y2 * h;

            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.hypot(dx, dy);
            if (len < 2) return;

            const nx = dx / len;
            const ny = dy / len;

            // Encode vector [-1..1] into RGB [0..255]
            const r = Math.round((nx * 0.5 + 0.5) * 255);
            const g = Math.round((ny * 0.5 + 0.5) * 255);

            // Draw line with soft gradient expansion
            const radius = Math.max(25, (p.radius || 45));
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineWidth = radius * 2;
            ctx.strokeStyle = `rgb(${r}, ${g}, 0)`;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            // Soft radial glow at head & tail
            const grad = ctx.createRadialGradient(x2, y2, 0, x2, y2, radius * 1.5);
            grad.addColorStop(0, `rgb(${r}, ${g}, 0)`);
            grad.addColorStop(1, 'rgba(128, 128, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x2, y2, radius * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // 2. Draw Freeze Mask (from offscreen mask canvas if present)
        if (cinemagraph.maskCanvas) {
            ctx.save();
            // Use lighter composite to add to Blue channel
            ctx.globalCompositeOperation = 'lighter';
            ctx.drawImage(cinemagraph.maskCanvas, 0, 0, w, h);
            ctx.restore();
        }

        // 3. Draw Anchor Pins (radial freeze lock, B = 255)
        anchors.forEach(a => {
            const ax = a.x * w;
            const ay = a.y * h;
            const rad = (a.radius || 35);

            ctx.save();
            const grad = ctx.createRadialGradient(ax, ay, 0, ax, ay, rad);
            grad.addColorStop(0, 'rgb(128, 128, 255)');
            grad.addColorStop(0.7, 'rgb(128, 128, 200)');
            grad.addColorStop(1, 'rgba(128, 128, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(ax, ay, rad, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Upload to WebGL flow texture
        this.setupTexture(this.flowTexture, this.flowCanvas, true);
    }

    /**
     * Renders a single cinemagraph frame via WebGL
     */
    renderFrame(mediaEl, cinemagraph, localTime, width, height) {
        if (!this.gl || !cinemagraph || !cinemagraph.enabled) {
            return null;
        }

        const gl = this.gl;
        const targetW = Math.min(1920, Math.round(width));
        const targetH = Math.min(1080, Math.round(height));

        if (this.glCanvas.width !== targetW || this.glCanvas.height !== targetH) {
            this.glCanvas.width = targetW;
            this.glCanvas.height = targetH;
        }

        gl.viewport(0, 0, targetW, targetH);
        gl.useProgram(this.program);

        // Update image texture if changed
        if (this.cachedImageSource !== mediaEl) {
            this.cachedImageSource = mediaEl;
            this.setupTexture(this.imageTexture, mediaEl, false);
        }

        // Update flow map texture if version changed
        const currentVersion = cinemagraph._version || 0;
        if (this.cachedFlowVersion !== currentVersion) {
            this.cachedFlowVersion = currentVersion;
            this.updateFlowMapTexture(cinemagraph);
        }

        // Bind image texture (unit 0)
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
        gl.uniform1i(this.uImageLoc, 0);

        // Bind flow map texture (unit 1)
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.flowTexture);
        gl.uniform1i(this.uFlowMapLoc, 1);

        // Uniforms
        gl.uniform1f(this.uTimeLoc, localTime);
        gl.uniform1f(this.uSpeedLoc, cinemagraph.speed || 1.0);
        gl.uniform1f(this.uDistortionLoc, cinemagraph.scale || 1.0);

        // Render Quad
        gl.enableVertexAttribArray(this.posAttrib);
        gl.vertexAttribPointer(this.posAttrib, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        return this.glCanvas;
    }

    /**
     * Overlay Gizmo: Visualizes flow arrows, freeze mask, anchors, and brush on the preview canvas
     */
    renderOverlayGizmo(ctx, width, height) {
        if (!this.activeClipId || !this.timeline) return;
        const clip = this.timeline.clips.find(c => c.id === this.activeClipId);
        if (!clip || !clip.cinemagraph || !clip.cinemagraph.enabled) return;

        const cin = clip.cinemagraph;
        const cw = width;
        const ch = height;

        ctx.save();

        // 1. Draw Subtle Translucent Freeze Mask Overlay (tinted red like in Motionleap/Pixaloop)
        if (cin.maskCanvas) {
            ctx.save();
            ctx.globalAlpha = 0.35;
            ctx.drawImage(cin.maskCanvas, 0, 0, cw, ch);
            ctx.restore();
        }

        // 2. Draw Anchor Pins
        (cin.anchors || []).forEach(a => {
            const ax = a.x * cw;
            const ay = a.y * ch;

            ctx.save();
            // Outer halo
            ctx.beginPath();
            ctx.arc(ax, ay, 14, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
            ctx.fill();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Center Pin icon / dot
            ctx.beginPath();
            ctx.arc(ax, ay, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.restore();
        });

        // 3. Draw Flow Paths as glowing animated directional arrows
        const paths = cin.paths || [];
        const timeNow = performance.now() / 1000;

        paths.forEach((p, idx) => {
            const x1 = p.x1 * cw;
            const y1 = p.y1 * ch;
            const x2 = p.x2 * cw;
            const y2 = p.y2 * ch;

            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.hypot(dx, dy);
            if (len < 5) return;

            const angle = Math.atan2(dy, dx);

            ctx.save();
            // Arrow Line with pulsating animated dash
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = '#00f2fe';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.shadowColor = '#00f2fe';
            ctx.shadowBlur = 10;
            ctx.setLineDash([8, 6]);
            ctx.lineDashOffset = -timeNow * 30; // Flow animation along the arrow!
            ctx.stroke();

            // Arrowhead
            ctx.setLineDash([]);
            const headLen = 16;
            ctx.fillStyle = '#00f2fe';
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fill();

            // Tail circle
            ctx.beginPath();
            ctx.arc(x1, y1, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            ctx.restore();
        });

        // 4. Draw Current Drawing Arrow Preview
        if (this.isDrawing && this.activeTool === 'path' && this.currentStroke) {
            const x1 = this.currentStroke.x1 * cw;
            const y1 = this.currentStroke.y1 * ch;
            const x2 = this.mousePosInClip.x * cw;
            const y2 = this.mousePosInClip.y * ch;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(x2, y2, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#ffd700';
            ctx.fill();
            ctx.restore();
        }

        // 5. Draw Brush Circle Cursor for Freeze/Unfreeze
        if ((this.activeTool === 'freeze' || this.activeTool === 'unfreeze') && this.isMouseOverClip) {
            const mx = this.mousePosInClip.x * cw;
            const my = this.mousePosInClip.y * ch;

            ctx.save();
            ctx.beginPath();
            ctx.arc(mx, my, this.brushRadius, 0, Math.PI * 2);
            ctx.strokeStyle = this.activeTool === 'freeze' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.9)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    }

    /**
     * Mouse pointer event handlers from preview monitor
     */
    handleMouseDown(clip, normX, normY) {
        if (!clip.cinemagraph) {
            clip.cinemagraph = { enabled: true, speed: 1.0, scale: 1.0, paths: [], anchors: [], _version: 1 };
        }
        const cin = clip.cinemagraph;

        this.isDrawing = true;
        this.mousePosInClip = { x: normX, y: normY };

        if (this.activeTool === 'path') {
            this.currentStroke = { x1: normX, y1: normY, x2: normX, y2: normY };
        } else if (this.activeTool === 'anchor') {
            cin.anchors = cin.anchors || [];
            cin.anchors.push({ x: normX, y: normY, radius: 35 });
            cin._version = (cin._version || 0) + 1;
            this.engine.render();
        } else if (this.activeTool === 'freeze' || this.activeTool === 'unfreeze') {
            this.paintFreezeMask(clip, normX, normY, this.activeTool === 'freeze');
        }
    }

    handleMouseMove(clip, normX, normY) {
        this.mousePosInClip = { x: normX, y: normY };
        this.isMouseOverClip = normX >= 0 && normX <= 1 && normY >= 0 && normY <= 1;

        if (!this.isDrawing) {
            if (this.activeTool === 'freeze' || this.activeTool === 'unfreeze') {
                this.engine.render(); // Redraw brush cursor
            }
            return;
        }

        if (this.activeTool === 'path' && this.currentStroke) {
            this.currentStroke.x2 = normX;
            this.currentStroke.y2 = normY;
            this.engine.render();
        } else if (this.activeTool === 'freeze' || this.activeTool === 'unfreeze') {
            this.paintFreezeMask(clip, normX, normY, this.activeTool === 'freeze');
        }
    }

    handleMouseUp(clip) {
        if (!this.isDrawing) return;
        this.isDrawing = false;

        const cin = clip.cinemagraph;
        if (!cin) return;

        if (this.activeTool === 'path' && this.currentStroke) {
            const dx = this.currentStroke.x2 - this.currentStroke.x1;
            const dy = this.currentStroke.y2 - this.currentStroke.y1;
            const dist = Math.hypot(dx, dy);

            // Ignore tiny accidental clicks
            if (dist > 0.02) {
                cin.paths = cin.paths || [];
                cin.paths.push({
                    x1: this.currentStroke.x1,
                    y1: this.currentStroke.y1,
                    x2: this.currentStroke.x2,
                    y2: this.currentStroke.y2,
                    radius: 45
                });
                cin._version = (cin._version || 0) + 1;
            }
            this.currentStroke = null;
            this.engine.render();
        }
    }

    paintFreezeMask(clip, normX, normY, isFreezing) {
        const cin = clip.cinemagraph;
        if (!cin.maskCanvas) {
            cin.maskCanvas = document.createElement('canvas');
            cin.maskCanvas.width = 512;
            cin.maskCanvas.height = 512;
        }

        const mctx = cin.maskCanvas.getContext('2d');
        const mx = normX * cin.maskCanvas.width;
        const my = normY * cin.maskCanvas.height;
        const rad = (this.brushRadius / 1920) * cin.maskCanvas.width * 2;

        mctx.save();
        if (isFreezing) {
            // Paint red/blue freeze lock
            const grad = mctx.createRadialGradient(mx, my, 0, mx, my, rad);
            grad.addColorStop(0, 'rgba(239, 68, 68, 1.0)');
            grad.addColorStop(0.7, 'rgba(239, 68, 68, 0.8)');
            grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            mctx.fillStyle = grad;
            mctx.beginPath();
            mctx.arc(mx, my, rad, 0, Math.PI * 2);
            mctx.fill();
        } else {
            // Erase
            mctx.globalCompositeOperation = 'destination-out';
            const grad = mctx.createRadialGradient(mx, my, 0, mx, my, rad);
            grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            mctx.fillStyle = grad;
            mctx.beginPath();
            mctx.arc(mx, my, rad, 0, Math.PI * 2);
            mctx.fill();
        }
        mctx.restore();

        cin._version = (cin._version || 0) + 1;
        this.engine.render();
    }

    /**
     * Apply ready-made presets
     */
    applyPreset(clip, presetId) {
        if (!clip.cinemagraph) {
            clip.cinemagraph = { enabled: true, speed: 1.0, scale: 1.0, paths: [], anchors: [], _version: 1 };
        }
        const cin = clip.cinemagraph;
        cin.enabled = true;
        cin.paths = [];
        cin.anchors = [];

        if (presetId === 'waterfall') {
            cin.speed = 1.6;
            cin.scale = 1.4;
            cin.paths.push({ x1: 0.5, y1: 0.25, x2: 0.5, y2: 0.75, radius: 60 });
            cin.paths.push({ x1: 0.42, y1: 0.3, x2: 0.42, y2: 0.7, radius: 50 });
            cin.paths.push({ x1: 0.58, y1: 0.3, x2: 0.58, y2: 0.7, radius: 50 });
            cin.anchors.push({ x: 0.25, y: 0.5, radius: 45 });
            cin.anchors.push({ x: 0.75, y: 0.5, radius: 45 });
        } else if (presetId === 'river') {
            cin.speed = 0.9;
            cin.scale = 1.1;
            cin.paths.push({ x1: 0.2, y1: 0.65, x2: 0.8, y2: 0.65, radius: 65 });
            cin.anchors.push({ x: 0.5, y: 0.35, radius: 60 });
        } else if (presetId === 'clouds') {
            cin.speed = 0.4;
            cin.scale = 0.8;
            cin.paths.push({ x1: 0.2, y1: 0.2, x2: 0.8, y2: 0.25, radius: 80 });
            cin.anchors.push({ x: 0.5, y: 0.75, radius: 80 });
        } else if (presetId === 'smoke') {
            cin.speed = 1.2;
            cin.scale = 1.2;
            cin.paths.push({ x1: 0.5, y1: 0.75, x2: 0.5, y2: 0.25, radius: 50 });
            cin.paths.push({ x1: 0.48, y1: 0.6, x2: 0.44, y2: 0.3, radius: 40 });
            cin.paths.push({ x1: 0.52, y1: 0.6, x2: 0.56, y2: 0.3, radius: 40 });
        } else if (presetId === 'nebula') {
            cin.speed = 0.7;
            cin.scale = 1.3;
            cin.paths.push({ x1: 0.35, y1: 0.35, x2: 0.65, y2: 0.35, radius: 55 });
            cin.paths.push({ x1: 0.65, y1: 0.35, x2: 0.65, y2: 0.65, radius: 55 });
            cin.paths.push({ x1: 0.65, y1: 0.65, x2: 0.35, y2: 0.65, radius: 55 });
            cin.paths.push({ x1: 0.35, y1: 0.65, x2: 0.35, y2: 0.35, radius: 55 });
        }

        cin._version = (cin._version || 0) + 1;
        this.engine.render();
    }

    clearAll(clip) {
        if (!clip.cinemagraph) return;
        clip.cinemagraph.paths = [];
        clip.cinemagraph.anchors = [];
        clip.cinemagraph.maskCanvas = null;
        clip.cinemagraph._version = (clip.cinemagraph._version || 0) + 1;
        this.engine.render();
    }
}

window.NovaCutMotionleap = NovaCutMotionleap;
