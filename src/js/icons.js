// Icon helper for the chrome icon set (sprite at the top of index.html).
// Anything that swaps a button's glyph at runtime must go through this, or the
// emoji come back the moment the button changes state.
window.ncIcon = (name, options = {}) =>
    `<svg class="nc-icon${options.solid ? ' nc-icon-solid' : ''}" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${name}"/></svg>`;
