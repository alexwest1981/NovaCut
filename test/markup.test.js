// Guards for the design system's two fragile invariants: the icon sprite must be
// closed (a <use> without its <symbol> renders nothing, and a half-applied
// replacement leaves the icon *name* as visible text), and the token layer must
// have exactly one owner (two `:root` blocks and the theme switch silently stops
// working — the later file wins and one palette is unreachable).
//
// Both bugs were shipped for real before this file existed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'src/index.html'), 'utf8');
const styles = join(root, 'src/styles');
const css = Object.fromEntries(
    readdirSync(styles).filter((f) => f.endsWith('.css'))
        .map((f) => [f, readFileSync(join(styles, f), 'utf8')]),
);

test('every icon reference resolves to a symbol in the sprite', () => {
    const used = new Set([...html.matchAll(/<use href="#(i-[\w-]+)"/g)].map((m) => m[1]));
    const defined = new Set([...html.matchAll(/<symbol id="(i-[\w-]+)"/g)].map((m) => m[1]));
    const dangling = [...used].filter((name) => !defined.has(name));
    assert.deepEqual(dangling, [], `ikoner utan symbol: ${dangling.join(', ')}`);
});

test('no half-applied icon replacement is left in the markup', () => {
    // A regex-replacement bug that shipped: the icon's name ended up as text
    // next to the svg, and a backreference ended up as `\1title="…"`.
    const strayText = [...html.matchAll(/<\/svg>\s*(i-[\w-]+)<\/svg>/g)].map((m) => m[1]);
    assert.deepEqual(strayText, [], `ikonnamn kvar som text: ${strayText.join(', ')}`);
    assert.deepEqual(html.match(/\\\d[A-Za-z-]+=/g) || [], [], 'literal backreference i markup');
});

test('the chrome sprite is the only emoji left out of the catalogs', () => {
    // Chrome = header, tabs, toolbars, buttons. Emoji inside the sticker /
    // transition / effect catalogues are content art and are expected to stay.
    const chromeEmoji = [...html.matchAll(/<button[^>]*>(?:(?!<\/button>).)*?([^\p{L}\p{N}\p{P}\s\x20-\x7E])(?:(?!<\/button>).)*?<\/button>/gsu)]
        .map((m) => m[1]);
    assert.deepEqual(chromeEmoji, [], `emoji kvar i knappar: ${[...new Set(chromeEmoji)].join(' ')}`);
});

test('the token layer has one owner', () => {
    assert.ok(css['tokens.css'], 'tokens.css saknas');
    assert.match(css['tokens.css'], /data-theme='creator'/, 'Creator-paletten saknas');
    for (const [name, text] of Object.entries(css)) {
        if (name === 'tokens.css') continue;
        const redefines = [...text.matchAll(/^\s*--(bg-main|accent|text-primary|border-color|clip-video|font-main)\s*:/gm)];
        assert.deepEqual(redefines, [], `${name} definierar om tokens (temat slutar fungera)`);
    }
});

test('type sizes stay on the scale', () => {
    // 9px and 9.5px were a third of the old stylesheet and are below the floor.
    for (const [name, text] of Object.entries(css)) {
        const stray = [...text.matchAll(/font-size:\s*(9|9\.5)px/g)].map((m) => m[0]);
        assert.deepEqual(stray, [], `${name} har text under 10px`);
    }
});
