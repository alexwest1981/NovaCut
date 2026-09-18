#!/usr/bin/env python3
"""Contrast gate for the NovaCut palettes.

Reads the two palettes out of src/styles/tokens.css and checks the text
foregrounds against the surfaces they are actually painted on. Exits non-zero
if a pair drops below its WCAG AA threshold, so a token tweak that ruins
legibility fails loudly instead of being noticed by eye three weeks later.

    python3 tools/contrast-check.py
"""
import pathlib
import re
import sys

TOKENS = pathlib.Path(__file__).resolve().parent.parent / 'src/styles/tokens.css'

# (foreground, background, minimum ratio). 4.5 is WCAG AA for body text,
# 3.0 is AA for large text / UI borders.
PAIRS = [
    ('--fg', '--bg-app', 4.5),
    ('--fg', '--bg-panel', 4.5),
    ('--fg', '--bg-raised', 4.5),
    ('--fg-dim', '--bg-panel', 4.5),
    ('--fg-dim', '--bg-raised', 4.5),
    ('--fg-mute', '--bg-panel', 4.5),
    ('--accent', '--bg-panel', 3.0),
    ('--accent', '--bg-raised', 3.0),
    ('--danger', '--bg-panel', 4.5),
    ('--warn', '--bg-panel', 4.5),
    ('--info', '--bg-panel', 4.5),
]


def parse_palettes(text):
    """{theme: {token: '#rrggbb'}} for every block that looks like a palette."""
    palettes, current = {}, None
    for raw in text.splitlines():
        line = raw.split('/*')[0]
        match = re.search(r":root\[data-theme='(\w+)'\]\s*,?\s*\{?\s*$", line.strip())
        if match:
            current = match.group(1)
            palettes.setdefault(current, {})
        elif line.strip() == ':root,' or line.strip() == ':root {':
            current = current or 'pro'
            palettes.setdefault('pro', {})
        elif '}' in line:
            current = None
        if current and (found := re.match(r'\s*(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;', line)):
            palettes[current][found.group(1)] = found.group(2)
    return {name: values for name, values in palettes.items() if len(values) > 5}


def luminance(hex_colour):
    channels = [int(hex_colour[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    channels = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]


def mix_with(fg_colour, other, percent):
    """color-mix(in srgb, fg_colour percent%, other) — sRGB lerp, alpha 1."""
    a = [int(fg_colour[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(other[i:i + 2], 16) for i in (1, 3, 5)]
    return '#%02x%02x%02x' % tuple(
        round(a[i] * percent / 100 + b[i] * (1 - percent / 100)) for i in range(3))


def ratio(fg, bg):
    a, b = luminance(fg), luminance(bg)
    lo, hi = min(a, b), max(a, b)
    return (hi + 0.05) / (lo + 0.05)


# Derived pairs: text painted as a 50/50 mix of a clip colour and the text
# colour (see .track-badge in timeline.css). The clip tokens themselves are
# mid-tone fills and would not pass as text on their own.
MIXED_PAIRS = [(f'--clip-{name}', '--fg', '--bg-panel', 4.5, 50)
               for name in ('video', 'overlay', 'audio', 'text', 'effect')]


def main():
    palettes = parse_palettes(TOKENS.read_text())
    failures = []
    for theme, tokens in sorted(palettes.items()):
        for fg_name, bg_name, minimum in PAIRS:
            fg, bg = tokens.get(fg_name), tokens.get(bg_name)
            if not (fg and bg):
                failures.append(f'{theme}: {fg_name} eller {bg_name} saknas')
                continue
            got = ratio(fg, bg)
            flag = 'ok  ' if got >= minimum else 'FEL '
            print(f'{flag}{theme:8} {fg_name:10} på {bg_name:10} {got:5.2f}:1  (krav {minimum})')
            if got < minimum:
                failures.append(f'{theme}: {fg_name} på {bg_name} = {got:.2f}:1, krav {minimum}')
        for clip_name, fg_name, bg_name, minimum, percent in MIXED_PAIRS:
            mixed = mix_with(tokens[clip_name], tokens[fg_name], percent)
            got = ratio(mixed, tokens[bg_name])
            flag = 'ok  ' if got >= minimum else 'FEL '
            print(f'{flag}{theme:8} {clip_name:16} blandad {percent}% med {fg_name} = {mixed} '
                  f'{got:5.2f}:1  (krav {minimum})')
            if got < minimum:
                failures.append(f'{theme}: {clip_name}-text = {got:.2f}:1, krav {minimum}')
    if failures:
        print('\n'.join([''] + failures))
        return 1
    print('\nalla par klarar WCAG AA')
    return 0


if __name__ == '__main__':
    sys.exit(main())
