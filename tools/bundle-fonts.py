#!/usr/bin/env python3
"""Bundle the caption/title fonts that the Text Studio offers.

The curated list lives in src/js/fonts.js. Read it from there rather than
duplicating it here, so adding a family to the app and running this script is
the whole procedure.

    python3 tools/bundle-fonts.py [--check]

Downloads the latin subset of every family/weight Google Fonts serves for the
curated list, writes src/assets/fonts/templates/*.woff2 and regenerates
src/styles/fonts-templates.css. --check only verifies that what is on disk
still matches the curated list (used by the test suite; no network).

Deliberate ceiling: latin subset only (covers English and the Swedish å ä ö).
Add "latin-ext" to SUBSETS if captions in other languages start looking wrong.
"""
from __future__ import annotations

import hashlib
import json
import pathlib
import re
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONTS_JS = ROOT / 'src/js/fonts.js'
OUT_DIR = ROOT / 'src/assets/fonts/templates'
CSS_OUT = ROOT / 'src/styles/fonts-templates.css'
SUBSETS = ('latin',)
SYSTEM_ONLY = ('Modern Sans-serif',)  # offered in the UI, but it is the user's own font
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'


def curated() -> list[tuple[str, list[str]]]:
    """[(family, [weights])] in the order src/js/fonts.js declares them."""
    src = FONTS_JS.read_text()
    out = []
    for name, body in re.findall(r"\{\s*name: '([^']+)',(.*?)\n\s*\}", src, re.S):
        if name in SYSTEM_ONLY:
            continue
        weights = re.search(r'weights: \[([^\]]+)\]', body)
        out.append((name, [w.strip().strip("'") for w in weights.group(1).split(',')] if weights else ['400']))
    if not out:
        raise SystemExit('no curated fonts found in src/js/fonts.js — did the shape change?')
    return out


def slug(text: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


def fetch_css(families: list[tuple[str, list[str]]]) -> str:
    parts = []
    for name, weights in families:
        spec = name.replace(' ', '+')
        parts.append(f'family={spec}:wght@{";".join(weights)}' if weights != ['400'] else f'family={spec}')
    url = 'https://fonts.googleapis.com/css2?' + '&'.join(parts) + '&display=swap'
    request = urllib.request.Request(url, headers={'User-Agent': UA})
    return urllib.request.urlopen(request, timeout=60).read().decode()


def latin_faces(css: str) -> list[dict]:
    faces = []
    for subset, body in re.findall(r'/\*\s*([\w-]+)\s*\*/\s*@font-face\s*\{(.*?)\}', css, re.S):
        if subset not in SUBSETS:
            continue
        faces.append({
            'family': re.search(r"font-family:\s*'([^']+)'", body).group(1),
            'weight': re.search(r'font-weight:\s*([\d ]+);', body).group(1).strip(),
            'style': re.search(r'font-style:\s*(\w+);', body).group(1),
            'range': re.search(r'unicode-range:\s*([^;]+);', body).group(1),
            'src': re.search(r'url\((https://[^)]+\.woff2)\)', body).group(1),
        })
    return faces


def download(faces: list[dict]) -> tuple[dict, int]:
    """Write one file per unique font binary; several weights of a variable family
    arrive as the same URL, so they collapse into one @font-face with a range."""
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for stale in OUT_DIR.glob('*.woff2'):
        stale.unlink()
    by_src: dict[str, dict] = {}
    for face in sorted(faces, key=lambda f: (f['family'], f['weight'])):
        entry = by_src.setdefault(face['src'], {'family': face['family'], 'style': face['style'],
                                                'range': face['range'], 'weights': []})
        entry['weights'].append(face['weight'])
    total = 0
    for src, entry in by_src.items():
        weights = sorted({int(w) for w in entry['weights']})
        name = f"{slug(entry['family'])}-{'-'.join(str(w) for w in weights)}.woff2"
        data = urllib.request.urlopen(urllib.request.Request(src, headers={'User-Agent': UA}), timeout=60).read()
        (OUT_DIR / name).write_bytes(data)
        total += len(data)
        entry['file'] = name
        entry['label'] = ' '.join(str(w) for w in weights)
        entry['sha256'] = hashlib.sha256(data).hexdigest()[:16]
        entry['bytes'] = len(data)
    return by_src, total


HEADER = """/* ==========================================================================
   Bundled caption / title fonts
   --------------------------------------------------------------------------
   The families the Text Studio offers (the curated list is in src/js/fonts.js).
   They used to be requested from fonts.googleapis.com on every launch; they
   ship with the app now, so titles and captions render identically with no
   network at all.

   {count} files, {kb} kB, latin subset — enough for English and the Swedish
   å ä ö. Licences: src/assets/fonts/templates/LICENSES.md.
   Regenerate: python3 tools/bundle-fonts.py

   GENERATED FILE — do not edit by hand.
   ========================================================================== */

"""


def render_css(entries: dict, total: int) -> str:
    rules = []
    for entry in sorted(entries.values(), key=lambda e: e['family']):
        weight = entry['label'] if ' ' not in entry['label'] else entry['label'].replace(' ', ' ')
        rules.append(f"""@font-face {{
    font-family: '{entry['family']}';
    font-style: {entry['style']};
    font-weight: {weight};
    font-display: swap;
    src: url('../assets/fonts/templates/{entry['file']}') format('woff2');
    unicode-range: {entry['range']};
}}""")
    return HEADER.format(count=len(entries), kb=round(total / 1024)) + '\n'.join(rules) + '\n'


def check_offline() -> int:
    """No network: does the checked-in CSS cover the curated list?"""
    families = [name for name, _ in curated()]
    if not CSS_OUT.exists():
        print(f'FAIL {CSS_OUT.relative_to(ROOT)} saknas — kör tools/bundle-fonts.py')
        return 1
    css = CSS_OUT.read_text()
    declared = set(re.findall(r"font-family: '([^']+)'", css))
    problems = []
    for family in families:
        if family not in declared:
            problems.append(f'{family}: ingen @font-face')
    for match in re.findall(r"url\('\.\./([^']+)'\)", css):
        if not (ROOT / 'src' / match).exists():
            problems.append(f'{match}: filen saknas')
    files = sorted(OUT_DIR.glob('*.woff2'))
    total = sum(f.stat().st_size for f in files)
    for problem in problems:
        print('FAIL', problem)
    print(f'{len(families)} familjer i listan, {len(files)} filer på disk, {total / 1024:.0f} kB')
    return 1 if problems else 0


def main() -> int:
    if '--check' in sys.argv:
        return check_offline()
    families = curated()
    print(f'{len(families)} familjer, {sum(len(w) for _, w in families)} vikter')
    entries, total = download(latin_faces(fetch_css(families)))
    CSS_OUT.write_text(render_css(entries, total))
    print(f'{len(entries)} filer, {total / 1024:.0f} kB -> {CSS_OUT.relative_to(ROOT)}')
    return check_offline()


if __name__ == '__main__':
    raise SystemExit(main())
