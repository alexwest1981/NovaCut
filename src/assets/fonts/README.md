# Bundled fonts

Two sets, both shipped with the app. Nothing in here is fetched at runtime.

## `./` — the interface font

`geist-latin.woff2` and `geist-mono-latin.woff2` are the latin subsets of
**Geist** and **Geist Mono** (variable, woff2), licensed under the SIL Open Font
License 1.1 — see `OFL.txt`. Bundled rather than fetched because the app ships
as a flatpak: a UI that silently changes typeface depending on the machine's
installed fonts is not a design system. Declared in `../../styles/tokens.css`.

## `./templates/` — the caption and title fonts

The sixteen families the Text Studio offers (the curated list with descriptions
is in `../../js/fonts.js`): Anton, Bangers, Bebas Neue, Caveat, Cinzel, Inter,
Lobster, Montserrat, Orbitron, Oswald, Pacifico, Permanent Marker, Playfair
Display, Poppins, Press Start 2P, Righteous. Latin subsets, 21 files, 391 kB.
Declared in `../../styles/fonts-templates.css`, licences in
`templates/LICENSES.md`.

They used to be requested from `fonts.googleapis.com` on every launch; that
request is gone, so titles and captions render identically with no network.
Offline editing and export were never *broken* by the request — Chromium would
fall back to a system face — but the text you designed could come out looking
like a different font on a machine with no route to Google.

## Regenerating

    python3 tools/bundle-fonts.py           # fetch + rewrite files, CSS and licences
    python3 tools/bundle-fonts.py --check    # offline: does the disk still match src/js/fonts.js

`npm test` runs the `--check`, so adding a family to `fonts.js` without running
the generator fails the build rather than shipping an unstyled font.
