// Builds the bundled VFX overlay loops in src/assets/overlays.
//
// Model, and it is measured, not assumed: every layer is BLACK plus the light it
// adds, and layers are composited with blend=all_mode=addition. Two traps this
// avoids, both observed on ffmpeg 7.1:
//   * an opaque layer erases everything below it with overlay() — a moving glow
//     then looks frozen because only the topmost layer survives each frame;
//   * drawbox cannot create alpha, so "transparent background" layers render as
//     nothing once composited.
// Mattes (letterbox bars) are the exception: they are alpha layers drawn with
// geq and overlaid last, because a matte has to cover, not add.
//
// Usage: node scripts/generate_overlays.js [--force]
//   --force  rebuild files that already exist (recipes changed: use it)

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'src', 'assets', 'overlays');
const W = 1280;
const H = 720;
const FPS = 24;
const DURATION = 6;

const BASE = `color=c=black:s=${W}x${H}:d=${DURATION}:r=${FPS},format=rgb24`;
const BLACK = `color=c=black:s=${W}x${H}:d=${DURATION}:r=${FPS}`;

/** Tint a greyscale mask: one random decision per pixel, then colour it. */
const tint = (rgb) => `format=rgb24,colorchannelmixer=rr=${(rgb[0] / 255).toFixed(3)}:gg=${(rgb[1] / 255).toFixed(3)}:bb=${(rgb[2] / 255).toFixed(3)}`;

/** Film grain: uniform noise, everywhere, every frame. */
const grain = (strength = 12) =>
    `nullsrc=s=${W}x${H}:d=${DURATION}:r=${FPS},format=gray,geq=lum='${strength}*random(1)',format=rgb24`;

/** Dust specks: sparse bright points that appear and vanish (like real dust). */
const specks = ({ density = 0.0008, alpha = 235, color = [255, 255, 255], seed = 2, soft = 0 } = {}) =>
    `nullsrc=s=${W}x${H}:d=${DURATION}:r=${FPS},format=gray,geq=lum='if(lt(random(${seed}),${density}),${alpha},0)',${tint(color)}`
    + (soft ? `,boxblur=${soft}:1` : '');

/** Scratches: a few narrow columns, constant down their length. Needs a 2x tall
 *  field for drift: cropping a full-height source cannot move (measured). */
const streaks = ({ width = 6, density = 0.02, alpha = 200, color = [255, 255, 255], blur = 0, seed = 4, drift = 0 } = {}) =>
    `nullsrc=s=${width}x${H * 2}:d=${DURATION}:r=${FPS},format=gray,geq=lum='if(lt(random(${seed}),${density}),${alpha},0)'`
    + `,scale=${W}:${H * 2}:flags=neighbor,${tint(color)}`
    + (blur ? `,boxblur=${blur}:1` : '')
    + (drift ? `,crop=${W}:${H}:0:'mod(t*${drift},${H})'` : `,crop=${W}:${H}:0:0`);

/** Particles that drift vertically instead of flickering in place. */
const drifting = ({ speed = 30, density = 0.0004, alpha = 220, color = [255, 255, 255], soft = 2, seed = 6 } = {}) =>
    `nullsrc=s=${W}x${H * 2}:d=${DURATION}:r=${FPS},format=gray,geq=lum='if(lt(random(${seed}),${density}),${alpha},0)'`
    + `,crop=${W}:${H}:0:'mod(t*${speed},${H})',${tint(color)}`
    + (soft ? `,boxblur=${soft}:1` : '');

/** A soft moving glow: a blurred box whose position follows a time expression.
 *  x must go through mod(): a bare `t` expression in x makes drawbox draw
 *  nothing at all (measured), while mod(t*..., N) works. */
const glow = ({ color = 'orange@0.34', size = 520, x = 'mod(t*500,2400)', y = '80+40*sin(t)', blur = 45 } = {}) =>
    `${BLACK},format=rgb24,drawbox=x='${x}':y='${y}':w=${size}:h=${size}:color=${color}:t=fill,boxblur=${blur}:2`;

/** A horizontal band sweeping down the frame — the VHS/tracking signature. */
const band = ({ color = 'white@0.22', height = 26, speed = 150, offset = 0, thickness = 0 } = {}) =>
    `${BLACK},format=rgb24,drawbox=x=0:y='mod(t*${speed}+${offset},${H})':w=${W}:h=${height}:color=${color}:t=fill`
    + (thickness ? `,boxblur=${thickness}:1` : '');

/** Drawn lines (scanlines, grid, OSD frame): only the strokes show. */
const lines = (expr) => `${BLACK},format=rgb24,${expr}`;

/** Falling columns of light: the code-rain look, continuous rather than dashes. */
const rain = ({ columns = 14, color = 'lime@0.45', width = 22, speed = 200, length = 180, seed = 21 } = {}) =>
    `${BLACK},format=rgb24,` + Array.from({ length: columns }, (_, i) => {
        const x = Math.round((i + 0.5) * (W / columns));
        const w = width + (i % 3) * 6;
        const h = length + (i % 4) * 40;
        const v = speed + ((seed * (i + 3)) % 140) - 60;
        const phase = (i * 53) % H;
        const c = color.replace(/[\d.]+$/, (a) => (Number(a) * (0.55 + (i % 5) * 0.12)).toFixed(2));
        return `drawbox=x=${x}:y='mod(${phase}+t*${v},${H})':w=${w}:h=${h}:color=${c}:t=fill`;
    }).join(',');

/** Soft round orbs (bokeh): a small blurred box each, drifting sideways. */
const orbs = (list) =>
    `${BLACK},format=rgb24,` + list.map((o) => `drawbox=x='mod(${o.x}+t*${o.speed},${W + 400})':y=${o.y}:w=${o.size}:h=${o.size}:color=${o.color}:t=fill`)
        .join(',') + ',boxblur=22:2';

/** A thin vertical scratch that travels sideways and flickers: 1-2 px wide, so it
 *  reads as a scratch instead of a wide band. */
const scratch = ({ x = 400, speed = 700, width = 2, color = 'white@0.55', blur = 1 } = {}) =>
    `${BLACK},format=rgb24,drawbox=x='mod(${x}+t*${speed},${W})':y=0:w=${width}:h=${H}:color=${color}:t=fill:enable='gt(sin(3.7*t),0.1)'`
    + (blur ? `,boxblur=${blur}:0` : '');

/** A matte for MULTIPLY blending: white where the picture shows, black where the
 *  bars are. (Black bars under screen blending add nothing, so they have to be
 *  painted as "keep this pixel / kill this pixel" instead.) */
const matte = (bars) =>
    `color=c=white:s=${W}x${H}:d=${DURATION}:r=${FPS},format=rgb24,`
    + bars.map((b) => `drawbox=x=${b[0]}:y=${b[1]}:w=${b[2]}:h=${b[3]}:color=black@1:t=fill`).join(',');

// --- the overlays the marketplace references, by that exact filename ---------

const overlays = [
    {
        file: '35mm_real_film_grain_loop.mp4',
        layers: [grain(13), specks({ density: 0.00012, alpha: 200, seed: 5 })]
    },
    {
        // dust + two thin travelling scratches + two speck fields: never a pattern
        file: '16mm_vintage_dust_scratches.mp4',
        layers: [
            grain(11),
            scratch({ x: 180, speed: 640, width: 2, color: 'white@0.5' }),
            scratch({ x: 900, speed: 430, width: 1, color: 'white@0.35', blur: 0 }),
            scratch({ x: 620, speed: 900, width: 3, color: 'white@0.22' }),
            specks({ density: 0.0008, alpha: 235, seed: 2 }),
            specks({ density: 0.00025, alpha: 255, seed: 7, soft: 1 })
        ]
    },
    {
        file: '8mm_retro_film_burn.mp4',
        layers: [
            grain(14),
            glow({ color: 'orange@0.34', size: 620, x: 'mod(t*500,2400)', y: '80+60*sin(0.7*t)', blur: 45 }),
            glow({ color: 'red@0.26', size: 300, x: 'mod(1600+t*300,2200)', y: '380+80*sin(1.1*t)', blur: 35 })
        ]
    },
    {
        file: 'golden_light_leaks_overlay.mp4',
        layers: [
            grain(9),
            glow({ color: 'gold@0.28', size: 640, x: 'mod(1500+t*140,2400)', y: '60+40*sin(0.5*t)', blur: 55 }),
            glow({ color: 'orange@0.20', size: 380, x: 'mod(t*220,2100)', y: '400+50*cos(0.6*t)', blur: 45 })
        ]
    },
    {
        file: 'prism_rainbow_flare_overlay.mp4',
        layers: [
            grain(9),
            glow({ color: 'cyan@0.30', size: 420, x: 'mod(120+t*180,2200)', y: '160+70*sin(t)', blur: 40 }),
            glow({ color: 'magenta@0.30', size: 420, x: 'mod(520+t*180,2200)', y: '260+70*cos(t)', blur: 40 }),
            glow({ color: 'gold@0.24', size: 300, x: 'mod(920+t*180,2200)', y: '200+60*sin(1.3*t)', blur: 35 })
        ]
    },
    {
        file: 'blue_anamorphic_streak_flare.mp4',
        layers: [
            grain(8),
            glow({ color: 'deepskyblue@0.36', size: 240, x: 'mod(t*420,1900)', y: '240', blur: 30 }),
            band({ color: 'deepskyblue@0.28', height: 18, speed: 0, offset: 340, thickness: 14 })
        ]
    },
    {
        // embers drift UP: the crop window moves down, so the content moves up
        file: 'floating_fire_embers.mp4',
        layers: [
            grain(8),
            drifting({ speed: 26, density: 0.00030, alpha: 235, color: [255, 150, 60], soft: 1, seed: 3 }),
            drifting({ speed: 44, density: 0.00015, alpha: 255, color: [255, 210, 140], soft: 0, seed: 8 })
        ]
    },
    {
        file: 'rolling_smoke_fog_loop.mp4',
        layers: [
            glow({ color: 'white@0.22', size: 900, x: 'mod(t*180,2200)', y: '120+30*sin(0.4*t)', blur: 70 }),
            glow({ color: 'white@0.16', size: 700, x: 'mod(1200+t*140,2200)', y: '260+40*cos(0.5*t)', blur: 70 }),
            grain(7)
        ]
    },
    {
        file: 'rain_drops_glass_overlay.mp4',
        layers: [
            grain(8),
            streaks({ width: 5, density: 0.014, alpha: 200, blur: 1, drift: 120 }),
            specks({ density: 0.00035, alpha: 230, seed: 11, soft: 2 })
        ]
    },
    {
        file: 'snow_blizzard_particles.mp4',
        layers: [
            grain(6),
            drifting({ speed: 52, density: 0.00110, alpha: 190, soft: 0, seed: 12 }),
            drifting({ speed: 26, density: 0.00060, alpha: 120, soft: 2, seed: 13 })
        ]
    },
    {
        file: 'golden_bokeh_particles.mp4',
        layers: [
            grain(7),
            orbs([
                { x: 60, speed: 26, y: 120, size: 150, color: 'wheat@0.40' },
                { x: 380, speed: 18, y: 300, size: 90, color: 'gold@0.34' },
                { x: 700, speed: 34, y: 90, size: 190, color: 'moccasin@0.28' },
                { x: 980, speed: 22, y: 420, size: 120, color: 'wheat@0.36' },
                { x: 1240, speed: 40, y: 240, size: 70, color: 'gold@0.30' },
                { x: 240, speed: 30, y: 520, size: 110, color: 'moccasin@0.32' },
                { x: 860, speed: 16, y: 560, size: 160, color: 'wheat@0.26' }
            ])
        ]
    },
    {
        file: 'vhs_tracking_glitch_overlay.mp4',
        layers: [
            grain(18),
            band({ color: 'white@0.30', height: 30, speed: 210, thickness: 8 }),
            band({ color: 'white@0.18', height: 70, speed: 120, offset: 260, thickness: 12 }),
            band({ color: 'red@0.18', height: 14, speed: 170, offset: 90, thickness: 4 })
        ]
    },
    {
        file: 'crt_scanlines_tv_overlay.mp4',
        // scanlines ARE horizontal lines: a dense 4px grid plus a slow bright roll
        layers: [
            lines(`drawgrid=w=${W}:h=3:t=1:c=white@0.26`),
            grain(10),
            band({ color: 'white@0.08', height: 120, speed: 60, thickness: 20 })
        ]
    },
    {
        file: 'matrix_green_code_rain.mp4',
        layers: [
            grain(10),
            rain({ columns: 14, color: 'lime@0.45', width: 22, speed: 200, length: 180 }),
            rain({ columns: 22, color: 'palegreen@0.28', width: 12, speed: 330, length: 110, seed: 33 })
        ]
    },
    {
        // horizontal RGB-split bands, the classic glitch: bands, not vertical bars
        file: 'cyber_rgb_glitch_overlay.mp4',
        layers: [
            grain(16),
            band({ color: 'magenta@0.55', height: 8, speed: 300, offset: 40, thickness: 2 }),
            band({ color: 'cyan@0.55', height: 6, speed: 240, offset: 400, thickness: 2 }),
            band({ color: 'white@0.30', height: 18, speed: 180, offset: 220, thickness: 4 })
        ]
    },
    {
        file: 'cctv_security_camera_osd.mp4',
        // an OSD is a drawing, not an effect: frame + a blinking REC dot
        layers: [
            lines(`drawbox=x=40:y=40:w=${W - 80}:h=${H - 80}:color=white@0.28:t=3`),
            lines(`drawbox=x=56:y=56:w=22:h=22:color=red@0.9:t=fill:enable='gt(sin(2*t),0)'`),
            grain(6)
        ]
    },
    {
        file: 'dslr_viewfinder_overlay.mp4',
        layers: [
            lines(`drawbox=x=610:y=350:w=60:h=20:color=white@0.5:t=1,drawbox=x=630:y=330:w=20:h=60:color=white@0.5:t=1`),
            lines(`drawbox=x=440:y=250:w=400:h=220:color=white@0.18:t=1`),
            grain(6)
        ]
    },
    {
        file: 'cinema_239_letterbox_matte.mp4',
        layers: [],
        matte: [[0, 0, W, 132], [0, H - 132, W, 132]]
    },
    {
        file: 'super8_rounded_frame_overlay.mp4',
        layers: [],
        matte: [[0, 0, 96, H], [W - 96, 0, 96, H], [0, 0, W, 56], [0, H - 56, W, 56]]
    },
    {
        file: 'retro_80s_laser_grid.mp4',
        // the one overlay that really is a grid: make it move instead of sit there
        layers: [
            grain(9),
            lines(`drawgrid=w=80:h=40:t=1:c=magenta@0.55,crop=${W}:${H}:0:'mod(t*60,${H})'`),
            lines(`drawgrid=w=160:h=80:t=1:c=cyan@0.45,crop=${W}:${H}:0:'mod(t*30,${H})'`)
        ]
    }
];

/** base + additive light layers, then the matte last (it covers, so it goes on top) */
function build(item) {
    const layers = item.layers || [];
    const inputs = ['-f', 'lavfi', '-i', BASE];
    layers.forEach((layer) => inputs.push('-f', 'lavfi', '-i', layer));

    const chain = ['[0]format=rgb24[b0]'];
    let previous = 'b0';
    layers.forEach((_, i) => {
        // every blend input is forced to rgb24: blend otherwise negotiates down to
        // gray as soon as one layer is grey (grain), which drained all colour
        chain.push(`[${i + 1}]format=rgb24[l${i + 1}]`);
        const next = `b${i + 1}`;
        chain.push(`[${previous}][l${i + 1}]blend=all_mode=addition[${next}]`);
        previous = next;
    });
    if (item.matte) {
        inputs.push('-f', 'lavfi', '-i', matte(item.matte));
        chain.push(`[${previous}][${layers.length + 1}]overlay=format=auto[b${layers.length + 1}]`);
        previous = `b${layers.length + 1}`;
    }
    // NOT format=yuv420p: on this build that filter passes rgb24 planes through
    // without the RGB->YUV matrix conversion, so finished files came out magenta.
    // An explicit same-size scale runs swscale and converts correctly.
    chain.push(`[${previous}]scale=${W}:${H}[out]`);
    return { inputs, filter: chain.join(';') };
}

function main() {
    const force = process.argv.includes('--force');
    fs.mkdirSync(OUT_DIR, { recursive: true });

    let built = 0;
    let kept = 0;
    let failed = 0;

    for (const item of overlays) {
        const out = path.join(OUT_DIR, item.file);
        if (!force && fs.existsSync(out) && fs.statSync(out).size > 1000) {
            console.log(`[keep]  ${item.file}`);
            kept++;
            continue;
        }
        const { inputs, filter } = build(item);
        const args = [
            '-y', ...inputs,
            '-filter_complex', filter, '-map', '[out]',
            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart', out
        ];
        try {
            execFileSync('ffmpeg', args, { stdio: 'pipe' });
            const kb = (fs.statSync(out).size / 1024).toFixed(0);
            console.log(`[built] ${item.file} (${kb} kB)`);
            built++;
        } catch (error) {
            const log = (error.stderr || Buffer.from('')).toString().split('\n').filter(Boolean).slice(-4).join(' | ');
            console.error(`[error] ${item.file}: ${log}`);
            failed++;
        }
    }

    console.log(`Done: ${built} built, ${kept} kept${failed ? `, ${failed} failed` : ''}.`);
    if (failed) process.exitCode = 1;
    // the check: a silent black overlay is the bug this script exists to avoid
    const empty = fs.readdirSync(OUT_DIR)
        .filter((f) => f.endsWith('.mp4'))
        .filter((f) => fs.statSync(path.join(OUT_DIR, f)).size < 2000);
    if (empty.length) {
        console.error(`Too small to contain anything: ${empty.join(', ')}`);
        process.exitCode = 1;
    }
}

main();
