import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

test('every curated family has a bundled file and a @font-face rule', () => {
    // Delegates to the generator's own --check so the list in src/js/fonts.js is
    // the single source of truth; no network here.
    const out = execFileSync('python3', ['tools/bundle-fonts.py', '--check'], { cwd: root, encoding: 'utf8' });
    assert.match(out, /familjer i listan/);
    assert.ok(!/FAIL/.test(out), out);
});

test('nothing loads fonts over the network', () => {
    const files = [];
    const walk = (dir) => readdirSync(join(root, dir), { withFileTypes: true }).forEach((e) => {
        const rel = join(dir, e.name);
        if (e.isDirectory()) walk(rel);
        else if (/\.(js|html|css|mjs)$/.test(e.name)) files.push(rel);
    });
    walk('src');
    const offenders = files.filter((f) => /https?:\/\/fonts\.(googleapis|gstatic)\.com/.test(read(f)));
    assert.deepEqual(offenders, [], 'typsnitt hämtas över nätet igen');
});

test('the bundled font stylesheet is linked where the fonts are declared', () => {
    assert.match(read('src/index.html'), /href="styles\/fonts-templates\.css"/);
    const css = read('src/styles/fonts-templates.css');
    const declared = [...css.matchAll(/font-family: '([^']+)'/g)].map((m) => m[1]);
    assert.ok(declared.length >= 16, `bara ${declared.length} familjer i stilmallen`);
    for (const family of new Set(declared)) {
        assert.ok(css.includes(`url('../assets/fonts/templates/`), family);
    }
});

test('the bundled font files are present and not empty', () => {
    const dir = join(root, 'src/assets/fonts/templates');
    const files = readdirSync(dir).filter((f) => f.endsWith('.woff2'));
    assert.ok(files.length >= 16, `bara ${files.length} woff2-filer`);
    for (const f of files) {
        const size = readFileSync(join(dir, f)).length;
        assert.ok(size > 4096, `${f} är misstänkt liten (${size} byte)`);
    }
    assert.ok(existsSync(join(dir, 'LICENSES.md')), 'LICENSES.md saknas');
});
