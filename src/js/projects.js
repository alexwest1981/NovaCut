/**
 * NovaCut - Project Management & Welcome Hub
 */
class NovaCutProjects {
    constructor(engine, timeline) {
        this.engine = engine;
        this.timeline = timeline;

        this.projects = [];
        this.currentProjectId = 'demo-starter';
        this.selectedRatio = '16:9';

        this.modalEl = document.getElementById('welcomeModal');
        this.gridEl = document.getElementById('welcomeProjectsGrid');
        this.searchEl = document.getElementById('welcomeProjectSearch');

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadProjectList();
        this.showWelcome();
    }

    setupEventListeners() {
        // Top Header Home button to open Welcome / Projects Hub anytime
        const btnHome = document.getElementById('btnHomeProjects');
        if (btnHome) {
            btnHome.addEventListener('click', () => {
                this.saveCurrentProject(false);
                this.loadProjectList();
                this.showWelcome();
            });
        }

        // Top Header Save button
        const btnSave = document.getElementById('btnSaveProject');
        if (btnSave) {
            btnSave.addEventListener('click', () => this.saveCurrentProject(true));
        }

        // Global Ctrl+S shortcut to save project
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                this.saveCurrentProject(true);
            }
        });

        // Welcome Screen Actions
        const btnNew = document.getElementById('btnWelcomeNewProject');
        if (btnNew) {
            btnNew.addEventListener('click', () => {
                const title = `Projekt ${this.projects.length + 1}`;
                this.createNewProject(this.selectedRatio, title);
            });
        }

        // Ratio chips in welcome screen
        document.querySelectorAll('.ratio-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.ratio-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.selectedRatio = chip.dataset.ratio || '16:9';
            });
        });

        // Open local .novacut file dialog
        const btnOpenFile = document.getElementById('btnWelcomeOpenFile');
        if (btnOpenFile) {
            btnOpenFile.addEventListener('click', async () => {
                if (window.novaCut && typeof window.novaCut.openProjectFile === 'function') {
                    const data = await window.novaCut.openProjectFile();
                    if (data && !data.error) {
                        await this.loadProjectData(data);
                    }
                }
            });
        }

        // Close Welcome Screen button (jump directly to editor)
        const btnClose = document.getElementById('btnWelcomeClose');
        if (btnClose) {
            btnClose.addEventListener('click', () => this.hideWelcome());
        }

        // Search in project list
        if (this.searchEl) {
            this.searchEl.addEventListener('input', (e) => {
                this.renderProjects(e.target.value);
            });
        }

        // Auto-save project title changes
        const titleInput = document.getElementById('projectTitle');
        if (titleInput) {
            titleInput.addEventListener('change', () => {
                this.saveCurrentProject(false);
            });
        }
    }

    showWelcome() {
        if (this.modalEl) {
            this.modalEl.classList.add('active');
            if (this.searchEl) this.searchEl.value = '';
            this.renderProjects();
        }
    }

    hideWelcome() {
        if (this.modalEl) {
            this.modalEl.classList.remove('active');
        }
    }

    async loadProjectList() {
        if (window.novaCut && typeof window.novaCut.listProjects === 'function') {
            try {
                this.projects = await window.novaCut.listProjects();
            } catch (err) {
                console.warn('Could not load projects via IPC, fallback to local storage:', err);
                this.projects = this.getLocalProjects();
            }
        } else {
            this.projects = this.getLocalProjects();
        }
    }

    getLocalProjects() {
        try {
            const raw = localStorage.getItem('novacut_projects');
            return raw ? JSON.parse(raw) : [
                {
                    id: 'demo-starter',
                    title: 'NovaCut Välkomstvideo',
                    aspectRatio: '16:9',
                    duration: 8.0,
                    clipCount: 3,
                    updatedAt: new Date().toISOString()
                }
            ];
        } catch {
            return [];
        }
    }

    saveLocalProjects(list) {
        try {
            localStorage.setItem('novacut_projects', JSON.stringify(list));
        } catch (e) {
            console.warn('Local storage save error:', e);
        }
    }

    renderProjects(query = '') {
        if (!this.gridEl) return;
        this.gridEl.innerHTML = '';

        const q = query.toLowerCase().trim();
        const filtered = this.projects.filter(p => {
            return !q || (p.title && p.title.toLowerCase().includes(q));
        });

        if (filtered.length === 0) {
            this.gridEl.innerHTML = `
                <div class="welcome-empty-state">
                    <div style="font-size: 32px; margin-bottom: 8px;">📂</div>
                    <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">Inga projekt hittades</div>
                    <div style="font-size: 11px; color: var(--text-muted);">Klicka på "+ Nytt Projekt" till vänster för att starta från grunden.</div>
                </div>
            `;
            return;
        }

        filtered.forEach(proj => {
            const card = document.createElement('div');
            card.className = 'project-card';
            if (proj.id === this.currentProjectId) {
                card.classList.add('current-active');
            }

            const isPortrait = proj.aspectRatio === '9:16';
            const isSquare = proj.aspectRatio === '1:1';
            const dateStr = this.formatDate(proj.updatedAt);

            card.innerHTML = `
                <div class="project-thumb-preview ${isPortrait ? 'ratio-9-16' : (isSquare ? 'ratio-1-1' : 'ratio-16-9')}">
                    <div class="thumb-glow"></div>
                    <span class="thumb-badge">${proj.aspectRatio || '16:9'}</span>
                    <span class="thumb-play">▶</span>
                </div>
                <div class="project-meta">
                    <div class="project-card-title-row">
                        <span class="project-card-title" title="${proj.title}">${proj.title || 'Namnlöst Projekt'}</span>
                    </div>
                    <div class="project-card-sub">
                        <span>${proj.clipCount || 0} klipp</span>
                        <span>•</span>
                        <span>${(proj.duration || 8.0).toFixed(0)}s</span>
                        <span>•</span>
                        <span>${dateStr}</span>
                    </div>
                    <div class="project-card-actions">
                        <button class="btn-open-project" title="Öppna och fortsätt redigera">Öppna projekt ▶</button>
                        <button class="btn-delete-project" title="Ta bort projekt">🗑️</button>
                    </div>
                </div>
            `;

            // Open project handler
            card.querySelector('.btn-open-project').addEventListener('click', (e) => {
                e.stopPropagation();
                this.openProject(proj.id);
            });
            card.addEventListener('click', () => {
                this.openProject(proj.id);
            });

            // Delete project handler
            card.querySelector('.btn-delete-project').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteProject(proj.id, proj.title);
            });

            this.gridEl.appendChild(card);
        });
    }

    async openProject(projectId) {
        let projectData = null;

        if (window.novaCut && typeof window.novaCut.loadProject === 'function') {
            try {
                projectData = await window.novaCut.loadProject(projectId);
            } catch (err) {
                console.warn('IPC load failed, attempting localStorage:', err);
            }
        }

        if (!projectData) {
            try {
                const raw = localStorage.getItem(`novacut_proj_${projectId}`);
                if (raw) projectData = JSON.parse(raw);
            } catch (e) {
                console.warn('LocalStorage load error:', e);
            }
        }

        // Fallback for demo-starter if missing
        if (!projectData && projectId === 'demo-starter') {
            projectData = {
                id: 'demo-starter',
                title: 'NovaCut Välkomstvideo',
                aspectRatio: '16:9',
                duration: 8.0,
                clips: [
                    {
                        id: 'clip-video-sample',
                        trackId: 'video',
                        title: 'Syntetisk Bakgrundsvideo',
                        type: 'video',
                        startTime: 0,
                        duration: 8.0,
                        scale: 1.0
                    },
                    {
                        id: 'clip-text-sample',
                        trackId: 'text',
                        title: 'NovaCut Välkommen',
                        type: 'text',
                        text: 'NovaCut Video Editor',
                        startTime: 1.0,
                        duration: 5.0,
                        fontSize: 72,
                        color: '#00d482'
                    },
                    {
                        id: 'clip-fx-sample',
                        trackId: 'effect',
                        title: 'Cyberpunk Neon',
                        type: 'effect',
                        startTime: 2.0,
                        duration: 4.5,
                        cssFilter: 'contrast(130%) saturate(150%) hue-rotate(160deg)',
                        params: { intensity: 1.2 }
                    }
                ]
            };
        }

        if (projectData) {
            await this.loadProjectData(projectData);
        } else {
            alert('Kunde inte läsa projektdata.');
        }
    }

    async loadProjectData(projectData) {
        this.currentProjectId = projectData.id || `project-${Date.now()}`;

        // 1. Set Title
        const titleEl = document.getElementById('projectTitle');
        if (titleEl) {
            titleEl.value = projectData.title || 'Mitt Projekt';
        }

        // 2. Set Aspect Ratio
        const ratio = projectData.aspectRatio || '16:9';
        this.engine.setAspectRatio(ratio);

        // 3. Clear existing clips from timeline
        this.timeline.deselectAll();
        document.querySelectorAll('.timeline-clip').forEach(el => el.remove());
        this.timeline.clips = [];

        // 4. Load Clips
        if (Array.isArray(projectData.clips)) {
            projectData.clips.forEach(clipData => {
                this.timeline.addClip(clipData);
            });
        }

        // 5. Update timeline and render
        this.timeline.recalculateProjectDuration();
        this.timeline.renderAllClips();
        this.engine.seek(0);
        this.engine.render();

        this.hideWelcome();
        this.showToast(`Projekt "${projectData.title || 'Projekt'}" öppnat!`);
    }

    createNewProject(aspectRatio = '16:9', title = 'Nytt Projekt') {
        const newId = `proj-${Date.now()}`;
        this.currentProjectId = newId;

        // 1. Set Title Input
        const titleEl = document.getElementById('projectTitle');
        if (titleEl) titleEl.value = title;

        // 2. Set Ratio
        this.engine.setAspectRatio(aspectRatio);

        // 3. Clear Timeline completely (clean scratch slate)
        this.timeline.deselectAll();
        document.querySelectorAll('.timeline-clip').forEach(el => el.remove());
        this.timeline.clips = [];
        this.engine.duration = 10.0;
        this.timeline.updateTimelineWidth();
        this.timeline.drawRuler();
        this.engine.seek(0);
        this.engine.render();

        // 4. Save initial blank project to list
        this.saveCurrentProject(false);

        this.hideWelcome();
        this.showToast(`Nytt tomt projekt (${aspectRatio}) skapat!`);
    }

    async saveCurrentProject(showNotification = true) {
        const titleEl = document.getElementById('projectTitle');
        const title = titleEl ? titleEl.value.trim() : 'Mitt Projekt';
        const ratio = this.engine.aspectRatio || '16:9';

        const projectData = {
            id: this.currentProjectId || `proj-${Date.now()}`,
            title: title || 'Namnlöst Projekt',
            aspectRatio: ratio,
            duration: this.engine.duration || 10.0,
            clips: this.timeline.clips.map(c => ({ ...c })),
            updatedAt: new Date().toISOString()
        };

        let saved = false;
        if (window.novaCut && typeof window.novaCut.saveProject === 'function') {
            try {
                const res = await window.novaCut.saveProject(projectData);
                if (res && res.success) saved = true;
            } catch (err) {
                console.warn('IPC project save failed:', err);
            }
        }

        // Also update local storage fallback
        try {
            localStorage.setItem(`novacut_proj_${projectData.id}`, JSON.stringify(projectData));
            const list = this.getLocalProjects();
            const existingIdx = list.findIndex(p => p.id === projectData.id);
            const meta = {
                id: projectData.id,
                title: projectData.title,
                aspectRatio: projectData.aspectRatio,
                duration: projectData.duration,
                clipCount: projectData.clips.length,
                updatedAt: projectData.updatedAt
            };
            if (existingIdx !== -1) {
                list[existingIdx] = meta;
            } else {
                list.unshift(meta);
            }
            this.saveLocalProjects(list);
            saved = true;
        } catch (e) {
            console.warn('Local storage error:', e);
        }

        if (showNotification && saved) {
            this.showToast(`✔ Projektet "${title}" är sparat!`);
        }
    }

    async deleteProject(projectId, projectTitle = 'Projekt') {
        if (!confirm(`Är du säker på att du vill ta bort projektet "${projectTitle}"?`)) {
            return;
        }

        if (window.novaCut && typeof window.novaCut.deleteProject === 'function') {
            try {
                await window.novaCut.deleteProject(projectId);
            } catch (err) {
                console.warn('IPC delete error:', err);
            }
        }

        // Local storage delete
        try {
            localStorage.removeItem(`novacut_proj_${projectId}`);
            let list = this.getLocalProjects();
            list = list.filter(p => p.id !== projectId);
            this.saveLocalProjects(list);
        } catch (e) {
            console.warn('Local storage delete error:', e);
        }

        await this.loadProjectList();
        this.renderProjects(this.searchEl ? this.searchEl.value : '');
        this.showToast(`Projekt "${projectTitle}" borttaget.`);
    }

    formatDate(isoString) {
        if (!isoString) return 'Nyligen';
        try {
            const date = new Date(isoString);
            const now = new Date();
            const diffMs = now - date;
            const diffMin = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMin / 60);

            if (diffMin < 2) return 'Just nu';
            if (diffMin < 60) return `${diffMin} min sen`;
            if (diffHours < 24 && date.getDate() === now.getDate()) {
                const hours = date.getHours().toString().padStart(2, '0');
                const mins = date.getMinutes().toString().padStart(2, '0');
                return `Idag ${hours}:${mins}`;
            }

            const day = date.getDate();
            const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
            const mon = months[date.getMonth()];
            return `${day} ${mon}`;
        } catch {
            return 'Nyligen';
        }
    }

    showToast(message) {
        let toast = document.getElementById('novaCutToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'novaCutToast';
            toast.className = 'novacut-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('visible');
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            toast.classList.remove('visible');
        }, 2600);
    }
}

window.NovaCutProjects = NovaCutProjects;
