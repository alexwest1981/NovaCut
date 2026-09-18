# Bundled fonts

`geist-latin.woff2` and `geist-mono-latin.woff2` are the latin subsets of
**Geist** and **Geist Mono** (variable, woff2), licensed under the SIL Open Font
License 1.1 — see `OFL.txt`. Bundled rather than fetched because the app ships
as a flatpak: a UI that silently changes typeface depending on the machine's
installed fonts is not a design system.

Regenerate (only when a subset or weight range changes):

    UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'
    curl -s -H "User-Agent: $UA" \
      'https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=Geist+Mono:wght@400..600&display=swap' \
      -o /tmp/geist.css      # then pick the blocks whose unicode-range is U+0000-00FF
