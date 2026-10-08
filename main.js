/* ==========================================================================
   Organik · comportamiento + coreografía de movimiento
   JavaScript nativo (sin librerías): Web Animations API, IntersectionObserver,
   requestAnimationFrame y transiciones CSS.
   Si el usuario pide menos movimiento, todo queda visible y estático.
   ========================================================================== */
(() => {
    'use strict';

    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => [...c.querySelectorAll(s)];
    const T = window.I18N || { es: {}, en: {} };
    const root = document.documentElement;
    const body = document.body;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const motion = !reduced && typeof Element.prototype.animate === 'function';
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

    root.classList.add(motion ? 'm' : 'no-motion');

    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const easeOutExpo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
    const easeInOutQuart = t => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2);
    const EXPO = 'cubic-bezier(.16,1,.3,1)';
    const nextFrame = fn => requestAnimationFrame(() => requestAnimationFrame(fn));

    const store = {
        get(k) { try { return localStorage.getItem(k); } catch { return null; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } }
    };

    let lang = store.get('organik-lang-v2');
    if (lang !== 'es' && lang !== 'en') lang = 'en';
    let menuOpen = false;

    /* Interpolación por rAF: tween(ms, easing, cb(progresoSuavizado, progreso)) -> Promise */
    function tween(ms, ease, cb) {
        return new Promise(resolve => {
            const t0 = performance.now();
            const step = now => {
                const p = clamp((now - t0) / ms);
                cb(ease(p), p);
                p < 1 ? requestAnimationFrame(step) : resolve();
            };
            requestAnimationFrame(step);
        });
    }

    /* ---------------------------------------------------------------- utils */
    function splitWords(el, cls = 'wi', mask = true) {
        const tpl = document.createElement('div');
        tpl.innerHTML = el.innerHTML;
        el.textContent = '';
        const out = [];
        const walk = (src, dst) => {
            src.childNodes.forEach(n => {
                if (n.nodeType === 3) {
                    n.textContent.split(/(\s+)/).forEach(tok => {
                        if (!tok) return;
                        if (/^\s+$/.test(tok)) { dst.appendChild(document.createTextNode(' ')); return; }
                        const inner = document.createElement('span');
                        inner.className = cls;
                        inner.style.setProperty('--i', out.length);
                        inner.textContent = tok;
                        if (mask) {
                            const w = document.createElement('span');
                            w.className = 'w';
                            w.appendChild(inner);
                            dst.appendChild(w);
                        } else dst.appendChild(inner);
                        out.push(inner);
                    });
                } else if (n.nodeType === 1) {
                    const c = n.cloneNode(false);
                    dst.appendChild(c);
                    walk(n, c);
                }
            });
        };
        walk(tpl, el);
        return out;
    }

    function fmt(v, dec, sep) {
        const n = dec ? v.toFixed(dec) : Math.round(v);
        return sep ? Number(n).toLocaleString('en-US') : String(n);
    }

    function countUp(el, { delay = 0, duration = 2000 } = {}) {
        const to = parseFloat(el.dataset.count);
        const dec = +(el.dataset.dec || 0);
        const sep = el.hasAttribute('data-sep');
        if (!motion) { el.textContent = fmt(to, dec, sep); return; }
        setTimeout(() => tween(duration, easeOutExpo, p => { el.textContent = fmt(to * p, dec, sep); }), delay);
    }

    const GLYPHS = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    function scramble(el, finalText, ms = 1000) {
        if (!motion) { el.textContent = finalText; return; }
        const chars = [...finalText];
        tween(ms, t => t, p => {
            el.textContent = chars.map((c, i) => (c === '/' || c === '-' || p > (i + 1) / chars.length)
                ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]).join('');
        }).then(() => { el.textContent = finalText; });
    }

    /* Marca el elemento como visible / no visible */
    function onVisible(el, flag = '_vis') {
        new IntersectionObserver(([e]) => { el[flag] = e.isIntersecting; }, { threshold: 0.15 }).observe(el);
    }

    /* Ejecuta cb una sola vez cuando el elemento llega a la zona visible.
       Se evalúa en el bucle de scroll, así que si el usuario salta de golpe
       (barra de scroll, anclas) los elementos que quedaron atrás igual se revelan. */
    const pending = [];
    let cardIdx = 0;
    function once(el, cb, ratio = 0.1) { pending.push({ el, cb, ratio }); }
    function checkPending() {
        if (!pending.length) return;
        const vh = innerHeight;
        const fired = [];
        for (let i = pending.length - 1; i >= 0; i--) {
            if (pending[i].el.getBoundingClientRect().top < vh * (1 - pending[i].ratio)) fired.unshift(pending.splice(i, 1)[0]);
        }
        cardIdx = 0;
        fired.forEach(p => p.cb(p.el));
    }

    /* ---------------------------------------------- bucle de scroll (rAF) */
    const scrollFns = [];
    let ticking = false;
    let lastY = scrollY;
    let dir = 1;
    function queueUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { ticking = false; scrollFns.forEach(fn => fn()); });
    }
    scrollFns.push(checkPending);
    addEventListener('scroll', queueUpdate, { passive: true });
    addEventListener('resize', queueUpdate);

    /* ------------------------------------------------------------------ i18n */
    const splitDone = new WeakSet();

    function prepSplit(el, animateIn) {
        splitWords(el);
        if (!motion || !animateIn) return;
        el.classList.remove('is-in');
        nextFrame(() => el.classList.add('is-in'));
    }

    const scrubEls = [];
    function buildScrubText() {
        scrubEls.length = 0;
        $$('.scrub-text').forEach(el => {
            const words = splitWords(el, 'sw', false);
            if (!motion) { words.forEach(w => { w.style.opacity = 1; }); return; }
            scrubEls.push({ el, words });
        });
        queueUpdate();
    }

    function applyLang(l, { animate = false } = {}) {
        lang = l;
        store.set('organik-lang-v2', l);
        root.lang = l;
        const dict = T[l] || {};
        $$('[data-i18n]').forEach(el => {
            const val = dict[el.dataset.i18n];
            if (val === undefined) return;
            if (el.hasAttribute('data-split')) {
                el.innerHTML = val;
                el.setAttribute('aria-label', el.textContent);
                prepSplit(el, animate || splitDone.has(el));
                splitDone.add(el);
            } else if (val.includes('<')) el.innerHTML = val;
            else el.textContent = val;
        });
        const btn = $('#lang-toggle');
        if (btn) {
            btn.dataset.lang = l;
            $$('[data-l]', btn).forEach(o => o.setAttribute('aria-pressed', o.dataset.l === l));
        }
        if (body.dataset.page === 'home' && dict.meta_title) {
            document.title = dict.meta_title;
            $('meta[name="description"]')?.setAttribute('content', dict.meta_desc);
            $('meta[property="og:title"]')?.setAttribute('content', dict.meta_title);
        }
        if (animate) {
            buildScrubText();
            if (motion) $('main').animate([{ opacity: 0.5 }, { opacity: 1 }], { duration: 700, easing: 'ease-out' });
        }
    }

    /* ----------------------------------------------------------- navegación */
    function initNav() {
        const wrap = $('#navbar');
        const links = $$('.nav__links a');
        const pill = $('.nav__pill');
        const burger = $('#burger');
        const menu = $('#menu');

        let activeLink = null;
        const movePill = (a) => {
            if (!pill) return;
            if (!a) { pill.style.opacity = 0; return; }
            pill.style.opacity = 1;
            pill.style.transform = `translateX(${a.offsetLeft}px) scaleX(${a.offsetWidth / 100})`;
        };
        links.forEach(a => {
            a.addEventListener('pointerenter', () => movePill(a));
            a.addEventListener('pointerleave', () => movePill(activeLink));
        });
        const setActive = (id) => {
            activeLink = links.find(a => a.dataset.nav === id) || null;
            links.forEach(a => a.classList.toggle('is-active', a === activeLink));
            movePill(activeLink);
        };
        const navIds = links.map(a => a.dataset.nav).filter(Boolean);
        if (navIds.length) {
            const io = new IntersectionObserver(entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) setActive(e.target.id);
                    else if (activeLink && activeLink.dataset.nav === e.target.id) setActive(null);
                });
            }, { rootMargin: '-50% 0px -50% 0px' });
            navIds.forEach(id => { const s = document.getElementById(id); if (s) io.observe(s); });
        }
        addEventListener('resize', () => movePill(activeLink));

        // sólido + ocultar al bajar
        scrollFns.push(() => {
            const y = scrollY;
            if (Math.abs(y - lastY) > 2) dir = y > lastY ? 1 : -1;
            lastY = y;
            wrap.classList.toggle('is-solid', y > 40);
            wrap.classList.toggle('is-hidden', motion && dir === 1 && y > 700 && !menuOpen);
        });

        // menú móvil
        if (!burger || !menu) return;
        menu.inert = true;
        const setMenu = (open) => {
            menuOpen = open;
            burger.setAttribute('aria-expanded', open);
            menu.classList.toggle('is-open', open);
            menu.setAttribute('aria-hidden', !open);
            menu.inert = !open;
            body.style.overflow = open ? 'hidden' : '';
        };
        burger.addEventListener('click', () => setMenu(!menuOpen));
        addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) setMenu(false); });
        $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
        matchMedia('(min-width: 1025px)').addEventListener('change', e => { if (e.matches && menuOpen) setMenu(false); });
    }

    /* ------------------------------------------------ scroll suave / anclas */
    /* Distancia entre el borde superior de la pantalla y el inicio del contenido de la sección destino
       (debe coincidir con scroll-padding-top en styles.css). */
    const ANCHOR_OFFSET = 112;
    let scrollAnim = 0;
    function smoothScrollTo(y, ms = 1500) {
        const from = scrollY;
        const to = Math.max(0, Math.min(y, document.documentElement.scrollHeight - innerHeight));
        const id = ++scrollAnim;
        if (!motion) { scrollTo(0, to); return; }
        const cancel = () => { scrollAnim++; };
        addEventListener('wheel', cancel, { once: true, passive: true });
        addEventListener('touchstart', cancel, { once: true, passive: true });
        tween(ms, easeInOutQuart, p => { if (id === scrollAnim) scrollTo(0, from + (to - from) * p); });
    }

    /* Posición (en la página) donde empieza el contenido de la sección, sin contar su padding superior. */
    function contentTop(el) {
        const section = el.matches('section') ? el : el.querySelector('section') || el;
        return el.getBoundingClientRect().top + scrollY + parseFloat(getComputedStyle(section).paddingTop);
    }

    function initScroll() {
        $$('a[href^="#"], a[href*="index.html#"]').forEach(a => {
            a.addEventListener('click', e => {
                const href = a.getAttribute('href');
                const id = href.slice(href.indexOf('#'));
                if (id === '#') return;
                if (!href.startsWith('#') && !$('#hero')) return; // estamos en otra página: navegar normal
                const target = id === '#hero' ? 0 : $(id);
                if (target === null) return;
                e.preventDefault();
                smoothScrollTo(target === 0 ? 0 : contentTop(target) - ANCHOR_OFFSET);
            });
        });
        const bar = $('#progress');
        if (bar) scrollFns.push(() => {
            const max = document.documentElement.scrollHeight - innerHeight;
            bar.style.transform = `scaleX(${max > 0 ? clamp(scrollY / max) : 0})`;
        });
    }

    /* --------------------------------------------------------------- cursor */
    function initCursor() {
        if (!motion || !finePointer) return;
        root.classList.add('has-cursor');
        const c = document.createElement('div');
        c.className = 'cursor';
        c.innerHTML = '<div class="cursor__ring"><span></span></div><div class="cursor__dot"></div>';
        body.appendChild(c);
        const ring = $('.cursor__ring', c), dot = $('.cursor__dot', c), label = $('span', ring);
        let mx = -100, my = -100, rx = -100, ry = -100;
        addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
        const loop = () => {
            rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
            ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
            dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
            requestAnimationFrame(loop);
        };
        loop();
        addEventListener('pointerdown', () => c.classList.add('is-down'));
        addEventListener('pointerup', () => c.classList.remove('is-down'));
        document.addEventListener('pointerover', e => {
            const t = e.target;
            const play = t.closest && t.closest('[data-video]');
            const link = t.closest && t.closest('a, button, label, input, .role');
            c.classList.toggle('is-play', !!play && !t.closest('.play'));
            c.classList.toggle('is-link', !!link || !!play);
            if (play) label.textContent = (T[lang] || {}).cursor_play || 'Ver';
        });
        root.addEventListener('pointerleave', () => { c.style.opacity = 0; });
        root.addEventListener('pointerenter', () => { c.style.opacity = 1; });
    }

    /* ----------------------------------------------- magnético / tilt / spot */
    function initPointerFx() {
        if (!motion || !finePointer) return;
        $$('.magnetic').forEach(el => {
            el.addEventListener('pointermove', e => {
                const r = el.getBoundingClientRect();
                const x = (e.clientX - (r.left + r.width / 2)) * 0.28;
                const y = (e.clientY - (r.top + r.height / 2)) * 0.4;
                el.style.transform = `translate3d(${x}px,${y}px,0)`;
                el.style.setProperty('--bx', ((e.clientX - r.left) / r.width * 100) + '%');
            });
            el.addEventListener('pointerleave', () => { el.style.transform = ''; });
        });

        $$('.tilt').forEach(el => {
            const max = el.id === 'mockup' ? 9 : 6;
            el.addEventListener('pointermove', e => {
                const r = el.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
                el.style.setProperty('--mx', px * 100 + '%');
                el.style.setProperty('--my', py * 100 + '%');
                el.style.setProperty('--ry', ((px - 0.5) * max * 2).toFixed(2) + 'deg');
                el.style.setProperty('--rx', (-(py - 0.5) * max * 2).toFixed(2) + 'deg');
            });
            el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
        });

        $$('.spot').forEach(el => {
            el.addEventListener('pointermove', e => {
                const r = el.getBoundingClientRect();
                el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
                el.style.setProperty('--my', (e.clientY - r.top) + 'px');
            });
        });
    }

    /* ----------------------------------------------------------------- hero */
    const BARS = [.34, .5, .42, .68, .55, .8, .62, .92, .7, .58, .78, .64, .86, .74];
    function initHero() {
        const hero = $('#hero');
        if (!hero) return;
        const chart = $$('#chart i');
        const setBars = arr => chart.forEach((b, i) => b.style.setProperty('--s', arr[i]));

        if (!motion) {
            setBars(BARS);
            $$('[data-count]', hero).forEach(el => countUp(el));
            hero.classList.add('is-in');
            return;
        }
        setBars(chart.map(() => 0.06));
        $$('[data-hero="in"]', hero).forEach((el, i) => el.style.setProperty('--i', i));

        window.__heroIntro = () => {
            hero.classList.add('is-in');
            $('[data-split]', hero).classList.add('is-in');
            setTimeout(() => setBars(BARS), 700);
            $$('[data-count]', hero).forEach((el, i) => countUp(el, { delay: 700 + i * 80, duration: 2200 }));
            const s = $('[data-scramble]', hero);
            if (s) setTimeout(() => scramble(s, s.dataset.scramble, 1300), 700);
        };

        // barras en vivo
        onVisible(hero);
        setInterval(() => {
            if (!hero._vis || document.hidden) return;
            setBars(BARS.map(v => clamp(v + (Math.random() - 0.5) * 0.34, 0.18, 1)));
        }, 2200);

        // parallax por ratón
        if (finePointer) {
            const items = $$('[data-depth]', hero);
            hero.addEventListener('pointermove', e => {
                const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
                items.forEach(el => {
                    const d = parseFloat(el.dataset.depth) * 2;
                    el.style.setProperty('--px', (nx * d).toFixed(1) + 'px');
                    el.style.setProperty('--py', (ny * d).toFixed(1) + 'px');
                });
            });
        }

        // salida del hero al hacer scroll
        const copy = $('.hero__copy', hero), vis = $('.hero__visual', hero), grid = $('.aurora__grid', hero);
        scrollFns.push(() => {
            const h = hero.offsetHeight;
            if (scrollY > h) return;
            const p = clamp(scrollY / h);
            copy.style.translate = `0 ${(-p * 0.12 * copy.offsetHeight).toFixed(1)}px`;
            copy.style.opacity = (1 - p * 0.8).toFixed(3);
            vis.style.translate = `0 ${(p * 0.1 * vis.offsetHeight).toFixed(1)}px`;
            grid.style.translate = `0 ${(p * 0.18 * grid.offsetHeight).toFixed(1)}px`;
        });
    }

    /* ----------------------------------------------------------- preloader */
    async function initPreloader() {
        const pre = $('#preloader');
        if (!pre) return;
        const done = () => { pre.remove(); body.classList.remove('is-loading'); };
        if (!motion) { done(); return; }
        let seen = false;
        try { seen = sessionStorage.getItem('organik-seen') === '1'; sessionStorage.setItem('organik-seen', '1'); } catch { /* ignore */ }
        body.classList.add('is-loading');
        const count = $('#preloader-count');
        await tween(seen ? 700 : 1800, t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2), p => {
            count.textContent = String(Math.round(p * 100)).padStart(3, '0');
        });
        await $('.preloader__inner').animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.85)', opacity: 0 }], { duration: 500, easing: 'cubic-bezier(.55,0,1,.45)', fill: 'forwards' }).finished;
        setTimeout(() => { if (window.__heroIntro) window.__heroIntro(); }, 450);
        await pre.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], { duration: 1200, easing: 'cubic-bezier(.87,0,.13,1)', fill: 'forwards' }).finished;
        done();
    }

    /* ---------------------------------------------------------- revelados */
    function initReveals() {
        // contadores en secciones (no hero)
        $$('[data-count]').filter(el => !el.closest('#hero')).forEach(el => {
            if (!motion) countUp(el);
            else once(el, () => countUp(el, { duration: 1600 }));
        });

        if (!motion) { $$('.legal__block').forEach(b => b.classList.add('is-in')); return; }

        // genérico: .reveal / titulares / bloques legales / pie / vídeo-info
        $$('.reveal, .legal__block, .footer__word, .video-card').forEach(el => once(el, t => t.classList.add('is-in'), 0.08));
        $$('[data-split]').filter(el => !el.closest('#hero') && !el.closest('.legal') && !el.closest('.nf'))
            .forEach(el => once(el, t => t.classList.add('is-in'), 0.12));

        // tarjetas con escalonado por lote
        $$('.reveal-card').forEach(el => once(el, t => { t.style.setProperty('--d', (cardIdx++ * 0.14) + 's'); t.classList.add('is-in'); }, 0.08));

        $$('.footer__word span').forEach((s, i) => s.style.setProperty('--i', i));

        // titular legal / 404 (no tienen preloader)
        if (!$('#preloader')) {
            const t = $('.legal [data-split], .nf [data-split]');
            if (t) setTimeout(() => t.classList.add('is-in'), 200);
        }

        // vídeo: máscara que se abre con el scroll + parallax opuesto
        const cards = $$('.video-card');
        const par = $$('[data-parallax]');
        scrollFns.push(() => {
            const vh = innerHeight;
            cards.forEach(card => {
                const r = card.getBoundingClientRect();
                if (r.bottom < -200 || r.top > vh + 200) return;
                const p = clamp((vh * 0.98 - r.top) / (vh * 0.56));
                const k = 1 - p;
                const bez = $('.bezel', card);
                bez.style.clipPath = `inset(${(16 * k).toFixed(2)}% ${(10 * k).toFixed(2)}% ${(16 * k).toFixed(2)}% ${(10 * k).toFixed(2)}% round 2rem)`;
                bez.style.scale = (0.9 + 0.1 * p).toFixed(3);
                const q = clamp((vh - r.top) / (vh + r.height));
                $('.vid__art', card).style.scale = (1.35 - 0.35 * q).toFixed(3);
            });
            par.forEach(el => {
                const r = el.getBoundingClientRect();
                if (r.bottom < -200 || r.top > vh + 200) return;
                const q = clamp((vh - r.top) / (vh + r.height));
                el.style.translate = `0 ${((q - 0.5) * 2 * parseFloat(el.dataset.parallax)).toFixed(1)}px`;
            });
        });
    }

    /* ---------------------------------------- texto que se ilumina (scrub) */
    function initScrub() {
        scrollFns.push(() => {
            const vh = innerHeight;
            scrubEls.forEach(({ el, words }) => {
                const r = el.getBoundingClientRect();
                if (r.bottom < -100 || r.top > vh + 100) return;
                const p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.34));
                const n = words.length;
                words.forEach((w, i) => { w.style.opacity = (0.16 + 0.84 * clamp(p * (n + 6) - i)).toFixed(2); });
            });
        });
    }

    /* ------------------------------------------------------------- marquee */
    function initMarquee() {
        const row = $('.marquee__row');
        if (!row || !motion) return;
        const track = $('.marquee__track', row);
        row.appendChild(track.cloneNode(true));
        let width = track.offsetWidth, x = 0, vel = 0, last = performance.now(), prevY = scrollY;
        const measure = () => { width = track.offsetWidth; };
        addEventListener('resize', measure);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
        const frame = now => {
            const dt = Math.min(64, now - last) / 1000;
            last = now;
            const v = (scrollY - prevY) / Math.max(dt, 0.001);
            prevY = scrollY;
            vel += (v - vel) * 0.1;
            const speed = 60 * (1 + clamp(vel / 450, -10, 10));
            x -= speed * dt;
            if (width) x = ((x % width) - width) % width;
            row.style.transform = `translate3d(${x.toFixed(2)}px,0,0) skewX(${clamp(-vel / 300, -8, 8).toFixed(2)}deg)`;
            requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
    }

    /* -------------------------------------------- micro-visualizaciones UI */
    function initViz() {
        // 1. filas de inventario
        const rows = $('.viz-rows');
        if (rows) {
            const fill = () => $$('.row span', rows).forEach((s, i) => setTimeout(() => s.style.setProperty('--p', 1), motion ? i * 160 : 0));
            motion ? once(rows, fill, 0.12) : fill();
        }

        // 2. anillo de vencimiento
        const ring = $('.ring-fg');
        const ringN = $('[data-ring]');
        if (ring) {
            const run = () => {
                ring.style.strokeDashoffset = 28;
                if (ringN && motion) tween(1800, easeOutExpo, p => { ringN.textContent = Math.round(14 * p); });
            };
            motion ? once(ring, run, 0.12) : run();
        }

        // 3. lotes
        const batch = $('[data-batch]');
        if (batch && motion) {
            onVisible(batch);
            const codes = ['L-2041-A', 'L-2042-B', 'L-2047-C', 'L-2051-A', 'L-2063-B'];
            let i = 0;
            setInterval(() => { if (batch._vis && !document.hidden) { i = (i + 1) % codes.length; scramble(batch, codes[i], 700); } }, 3200);
        }

        // 4. alertas: pila que rota
        const viz = $('.viz-alerts');
        if (viz && motion) {
            onVisible(viz);
            const notes = $$('.note', viz);
            const order = [0, 1, 2];
            setInterval(() => {
                if (!viz._vis || document.hidden) return;
                const leaving = notes[order.shift()];
                order.push(notes.indexOf(leaving));
                leaving.className = 'note s3';
                setTimeout(() => { leaving.className = 'note s2'; }, 700);
                notes[order[0]].className = 'note s0';
                notes[order[1]].className = 'note s1';
            }, 2800);
        }

        // 5. roles + barras
        const roles = $$('.role');
        const bars = $$('[data-bars] i');
        const holder = $('.viz-roles');
        if (bars.length) {
            const rnd = () => bars.forEach(b => b.style.setProperty('--s', (0.28 + Math.random() * 0.72).toFixed(2)));
            if (motion) {
                once(holder, () => bars.forEach((b, i) => setTimeout(() => b.style.setProperty('--s', (0.3 + Math.random() * 0.7).toFixed(2)), i * 90)), 0.12);
                onVisible(holder);
                let r = 0;
                setInterval(() => {
                    if (!holder._vis || document.hidden) return;
                    r = (r + 1) % roles.length;
                    roles.forEach((el, i) => el.classList.toggle('is-on', i === r));
                    rnd();
                }, 2800);
            } else rnd();
        }
    }

    /* --------------------------------------------------------------- video */
    function initVideo() {
        const vids = $$('[data-video]');
        vids.forEach(v => {
            const bar = $('.vid__time i', v);
            bar.addEventListener('animationend', () => v.classList.remove('is-playing'));
            v.addEventListener('click', () => {
                const on = !v.classList.contains('is-playing');
                vids.forEach(x => x.classList.remove('is-playing'));
                if (on) {
                    bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
                    v.classList.add('is-playing');
                }
            });
        });
    }

    /* ----------------------------------------------------------------- init */
    function init() {
        applyLang(lang);
        const toggle = $('#lang-toggle');
        if (toggle) toggle.addEventListener('click', e => {
            const option = e.target.closest('[data-l]');
            if (option && option.dataset.l !== lang) applyLang(option.dataset.l, { animate: true });
        });

        initScroll();
        buildScrubText();
        initScrub();
        initNav();
        initCursor();
        initHero();
        initReveals();
        initMarquee();
        initViz();
        initVideo();
        initPointerFx();
        initPreloader();
        queueUpdate();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();


/* Enlaces a la aplicación.
   El HTML ya apunta a la aplicación publicada. Mientras se desarrolla (localhost o red local),
   los enlaces pasan a la aplicación local siguiendo el host con el que se abrió la landing. */
(() => {
    const isLocal = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname);
    if (!isLocal) return;
    const base = 'http://' + location.hostname + ':4200';
    document.querySelectorAll('[data-app-path]').forEach((link) => {
        link.href = base + link.dataset.appPath;
    });
})();
