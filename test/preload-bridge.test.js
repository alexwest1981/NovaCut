// Prov för bryggan mellan renderaren och huvudprocessen.
//
// Bakgrund: preload.js exponerade fyra ytor (exportFFmpeg, saveTempExport,
// saveDirectExport, transcodeExport) som ingen i renderaren anropade, och
// main.js hade kvar 281 rader handlers för dem — bland annat en hårdkodad
// `const hasNvenc = true` trots att appen har en riktig NVENC-detektor.
// Proven nedan håller bryggan i båda riktningarna.
//
//     npm test

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const preload = fs.readFileSync(path.join(ROOT, 'src/preload.js'), 'utf8');
const main = fs.readFileSync(path.join(ROOT, 'src/main.js'), 'utf8');

function rendererSources() {
    const out = [];
    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (/\.(js|html)$/.test(entry.name)) out.push(fs.readFileSync(full, 'utf8'));
        }
    };
    walk(path.join(ROOT, 'src'));
    return out.filter((text) => !text.includes('contextBridge.exposeInMainWorld'));
}

test('every channel the bridge invokes has a handler in main', () => {
    const channels = [...preload.matchAll(/ipcRenderer\.invoke\('([^']+)'/g)].map((m) => m[1]);
    assert.ok(channels.length > 20, `bryggan ska bära appens ytor, hittade ${channels.length}`);
    for (const channel of channels) {
        assert.ok(
            main.includes(`ipcMain.handle('${channel}'`),
            `${channel} anropas från preload men har ingen handler i main.js`
        );
    }
});

test('no exposed bridge call is unused by the renderer', () => {
    const api = [...preload.matchAll(/^\s{4}(\w+):/gm)].map((m) => m[1]);
    assert.ok(api.length > 20, `hittade bara ${api.length} ytor i preload`);
    const renderer = rendererSources().join('\n');
    for (const name of api) {
        assert.ok(
            renderer.includes(`novaCut.${name}`),
            `${name} exponeras i preload men anropas aldrig (renderaren använder novaCut.<namn>)`
        );
    }
});
