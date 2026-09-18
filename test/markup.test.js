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
    // A regex-replacement bug leaked fragments like `\1` straight into the page
    // (the user read one as "/1" in the tab strip). The markup has no legitimate
    // use for a backslash, so none may exist.
    assert.deepEqual(html.match(/\\/g) || [], [], 'backslash (regex-fragment) i markup');
});

test('emoji survive only where they are content art', () => {
    // Chrome is icon-sprite only. The exceptions are the sticker/effect
    // catalogues (.fx-icon), the preset names (.style-name) and one sample
    // headline inside an <input value>. Everything else is a missing icon.
    const lines = html.split('\n');
    const offenders = [];
    for (const [index, line] of lines.entries()) {
        for (const [glyph] of line.matchAll(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}]/gu)) {
            const context = line.slice(0, line.indexOf(glyph));
            const allowed = /class="[^"]*(fx-icon|style-name)[^"]*"/.test(context)
                || /<input[^>]*value="[^"]*$/.test(context);
            if (!allowed) offenders.push(`${index + 1}:${glyph}`);
        }
    }
    assert.deepEqual(offenders, [], `emoji utanför innehållet: ${offenders.join(' ')}`);
});

test('no glyph stands in for an icon inside a button', () => {
    // Any character outside plain ASCII-printable + letters/numbers/punctuation
    // inside a button: dingbats, arrows, tick marks, box-drawing stand-ins.
    const stray = [...html.matchAll(/<button[^>]*>(?:(?!<\/button>).)*?([^\p{L}\p{N}\p{P}\s\x20-\x7E])(?:(?!<\/button>).)*?<\/button>/gsu)]
        .map((m) => m[1]);
    assert.deepEqual(stray, [], `glyf kvar i knappar: ${[...new Set(stray)].join(' ')}`);
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

// JS-built chrome is the same contract as the static markup. Files whose emoji
// are a *preset's* own thumbnail (a PIP layout, an allocation chip) are listed
// here with the reason, so adding one elsewhere still fails the build.
const CONTENT_THUMBNAIL_FILES = {
    'inspector.js': 'PIP/allocation preset thumbnails (each preset carries its own glyph)',
};

test('no emoji left in buttons built by the renderer', () => {
    const dir = join(root, 'src/js');
    const offenders = [];
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
        if (CONTENT_THUMBNAIL_FILES[file]) continue;
        const text = readFileSync(join(dir, file), 'utf8');
        const buttons = text.matchAll(/<button[^>]*>(?:(?!<\/button>).)*?<\/button>/gs);
        for (const button of buttons) {
            const glyphs = [...new Set(button[0].match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{25A0}-\u{25FF}\u{2190}-\u{21FF}]/gu) || [])];
            if (glyphs.length && !button[0].includes('nc-emoji-ok')) {
                offenders.push(`${file}: ${glyphs.join('')}`);
            }
        }
    }
    assert.deepEqual(offenders, [], `emoji i JS-byggda knappar: ${offenders.join(', ')}`);
});
