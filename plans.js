/* ==========================================================================
   Organik · selector de planes por segmento
   ========================================================================== */
(() => {
    'use strict';

    const T = window.I18N || { es: {}, en: {} };
    const text = (key) => (T[document.documentElement.lang] || T.es || {})[key] || key;

    /* ---- Planes por segmento: minimarkets / proveedores ---- */
    const tabs = [...document.querySelectorAll('.segments__tab')];
    tabs.forEach((tab) => tab.addEventListener('click', () => {
        tabs.forEach((t) => {
            const on = t === tab;
            t.classList.toggle('is-on', on);
            t.setAttribute('aria-selected', String(on));
            document.getElementById('plans-' + t.dataset.segment).hidden = !on;
        });
    }));
})();
