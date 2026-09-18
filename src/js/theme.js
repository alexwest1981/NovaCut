// Theme switch: Pro (neutral chrome, the default) and Creator (lighter, warmer).
// The palette is applied in <head> before the first paint; this file only drives
// the header control and remembers the choice.
(() => {
    const KEY = 'novacut_theme';
    const root = document.documentElement;
    const buttons = [...document.querySelectorAll('[data-theme-choice]')];
    const valid = (theme) => (theme === 'creator' ? 'creator' : 'pro');

    function apply(theme) {
        const chosen = valid(theme);
        root.dataset.theme = chosen;
        localStorage.setItem(KEY, chosen);
        for (const button of buttons) {
            const on = button.dataset.themeChoice === chosen;
            button.classList.toggle('is-active', on);
            button.setAttribute('aria-pressed', String(on));
        }
    }

    for (const button of buttons) {
        button.addEventListener('click', () => apply(button.dataset.themeChoice));
    }

    apply(root.dataset.theme || localStorage.getItem(KEY));
})();
