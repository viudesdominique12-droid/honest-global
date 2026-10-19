(function () {
    'use strict';

    var html = document.documentElement;
    var motion = html.classList.contains('motion') && !!(window.gsap && window.ScrollTrigger && window.SplitText);
    if (!motion) html.classList.remove('motion');
    var CONFIG = window.HG_CONFIG || {};

    function $(sel, ctx) { return (ctx || document).querySelector(sel); }
    function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
    function esc(s) {
        return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
    }
    function param(name) {
        try { return new URLSearchParams(window.location.search).get(name); } catch (e) { return null; }
    }
    function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

    var masthead = $('.masthead');
    function headerH() { return masthead ? masthead.offsetHeight : 0; }
    var lenis = null;
    function scrollToEl(el) {
        if (!el) return;
        if (lenis) lenis.scrollTo(el, { offset: -headerH(), duration: 1.6 });
        else window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - headerH() });
    }

    /* ------------------------------------------------ Home: cover wordmark fit */
    var title = $('.cover__title');
    var fitEl = title && $('[data-fit]', title);
    function fit() {
        if (!fitEl) return;
        var cs = getComputedStyle(title);
        var avail = title.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        title.style.fontSize = '100px';
        var w = fitEl.getBoundingClientRect().width;
        if (w > 0) title.style.fontSize = (100 * avail / w).toFixed(2) + 'px';
    }
    if (fitEl) {
        fit();
        var fitRaf;
        window.addEventListener('resize', function () {
            cancelAnimationFrame(fitRaf);
            fitRaf = requestAnimationFrame(fit);
        });
    }

    /* ------------------------------------------------ Engravings (canvas) */
    var E = window.HGEngraving || {};
    var globeEl = $('.globe');
    var globe = globeEl && E.globe ? E.globe(globeEl) : null;
    if (globeEl && !globe) {
        globeEl.removeAttribute('tabindex');
        var hint = $('.caption__hint');
        if (hint) hint.remove();
    }
    if (globe && document.fonts && document.fonts.ready) document.fonts.ready.then(globe.request);
    var seals = $$('.seal').map(function (el) {
        var view = E.seal ? E.seal(el) : null;
        return view ? { el: el, view: view } : null;
    }).filter(Boolean);

    /* ------------------------------------------------ Liquids: engraved fill lines and a moving surface */
    function createLiquid(svg, sel, spec) {
        var fill = $(sel.fill, svg), surface = $(sel.surface, svg), rect = $(sel.level, svg);
        if (!fill || !surface || !rect) return null;
        var x1 = spec[0], x2 = spec[1], top = spec[2], bottom = spec[3], target = spec[4];
        var d = '';
        for (var y = top + 2; y <= bottom; y += 3.5) d += 'M' + x1 + ' ' + y.toFixed(1) + ' H' + x2 + ' ';
        fill.setAttribute('d', d);
        var state = { level: target, phase: 0, amp: 0.9 };
        function draw() {
            rect.setAttribute('y', state.level.toFixed(2));
            var p = 'M' + (x1 - 2) + ' ' + state.level.toFixed(2);
            for (var x = x1 - 2; x <= x2 + 2; x += 4) {
                p += ' L' + x + ' ' + (state.level + Math.sin(x * 0.07 + state.phase) * state.amp).toFixed(2);
            }
            surface.setAttribute('d', p);
        }
        draw();
        return { state: state, draw: draw, bottom: bottom + 2, target: target };
    }

    /* Honest Oil container */
    function createBottle(el) {
        var liq = createLiquid(el, { fill: '.b-fill', surface: '.b-surface', level: '.b-level' }, [40, 260, 120, 390, 150]);
        return {
            el: el,
            mode: el.getAttribute('data-bottle'),
            q: function (sel) { return el.querySelectorAll(sel); },
            one: function (sel) { return el.querySelector(sel); },
            liquid: liq.state,
            draw: liq.draw
        };
    }
    var bottles = $$('[data-bottle]').map(createBottle);

    /* ------------------------------------------------ Smooth scroll */
    if (motion && window.Lenis) {
        lenis = new window.Lenis({
            duration: 1.15,
            easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }
        });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
    }

    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href^="#"]');
        if (!a) return;
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var target = $(id);
        if (!target) return;
        e.preventDefault();
        scrollToEl(target);
    });

    /* ------------------------------------------------ Businesses panel */
    var nb = $('.nav-businesses');
    var nbBtn = nb && $('button', nb);
    function setPanel(open) {
        if (!nb) return;
        nb.classList.toggle('is-open', open);
        nbBtn.setAttribute('aria-expanded', String(open));
    }
    if (nbBtn) {
        nbBtn.addEventListener('click', function () { setPanel(!nb.classList.contains('is-open')); });
        document.addEventListener('click', function (e) { if (!nb.contains(e.target)) setPanel(false); });
    }

    /* ------------------------------------------------ Mobile menu */
    var menuBtn = $('.menu-btn');
    var menu = $('#mobile-menu');
    function setMenu(open) {
        if (!menu) return;
        menu.classList.toggle('is-open', open);
        masthead.classList.toggle('menu-open', open);
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', open ? 'Close the menu' : 'Open the menu');
        document.body.style.overflow = open ? 'hidden' : '';
        if (lenis) { if (open) lenis.stop(); else lenis.start(); }
    }
    if (menuBtn && menu) {
        menuBtn.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
        $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { setPanel(false); setMenu(false); }
    });

    var year = $('[data-year]');
    if (year) year.textContent = new Date().getFullYear();

    /* ------------------------------------------------ Forms: field options and pre-selection */
    $$('select[data-sectors]').forEach(function (sel) {
        (window.HG_SECTORS || []).forEach(function (s) {
            var o = document.createElement('option');
            o.value = s.letter;
            o.textContent = s.letter + '. ' + s.name.replace(/&amp;/g, '&');
            sel.insertBefore(o, sel.querySelector('option[value="other"]'));
        });
    });
    // The marque is typed freely: the listed marques are only suggestions, any other can be requested
    $$('datalist[data-marque-list]').forEach(function (list) {
        var seen = {};
        (window.HG_MARQUES || []).forEach(function (g) {
            g.marques.forEach(function (m) {
                var name = m.name.replace(/ electric$/, '');
                if (!m.models.length || seen[name]) return;
                seen[name] = true;
                var o = document.createElement('option');
                o.value = name;
                list.appendChild(o);
            });
        });
    });
    function preselect(name, value) {
        if (!value) return;
        $$('select[name="' + name + '"]').forEach(function (sel) {
            var match = $$('option', sel).filter(function (o) { return o.value === value; })[0];
            if (match) sel.value = value;
        });
        $$('input[name="' + name + '"][list]').forEach(function (input) {
            // "other" leaves the field empty, ready for the visitor's own marque
            var electric = / electric$/.test(value);
            input.value = value === 'other' ? '' : value.replace(/ electric$/, '');
            if (electric) preselect('powertrain', 'Electric');
        });
    }
    preselect('sector', param('sector'));
    preselect('topic', param('topic'));
    preselect('marque', param('marque'));
    var typeParam = param('type');
    if (typeParam) $$('input[name="request_type"]').forEach(function (r) { r.checked = r.value === typeParam; });

    document.addEventListener('click', function (e) {
        var sector = e.target.closest && e.target.closest('[data-sector]');
        if (sector && $('#sourcing form')) {
            e.preventDefault();
            preselect('sector', sector.getAttribute('data-sector'));
            scrollToEl($('#sourcing'));
            return;
        }
        var marque = e.target.closest && e.target.closest('[data-marque]');
        if (marque && $('#request form')) {
            e.preventDefault();
            preselect('marque', marque.getAttribute('data-marque') || 'other');
            scrollToEl($('#request'));
            return;
        }
        var type = e.target.closest && e.target.closest('[data-request-type]');
        if (type) {
            $$('input[name="request_type"]').forEach(function (r) { r.checked = r.value === type.getAttribute('data-request-type'); });
        }
    });

    /* ------------------------------------------------ Forms: validation and sending */
    $$('form[data-form]').forEach(function (form) {
        var status = $('.form__status', form);
        var btn = $('button[type="submit"]', form);
        var fields = $$('input, select, textarea', form).filter(function (f) { return !f.closest('.hp'); });
        form.setAttribute('novalidate', '');

        fields.forEach(function (f) {
            f.addEventListener('input', function () {
                if (f.getAttribute('aria-invalid') === 'true' && f.checkValidity()) f.setAttribute('aria-invalid', 'false');
            });
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var invalid = fields.filter(function (f) {
                var bad = !f.checkValidity();
                f.setAttribute('aria-invalid', bad ? 'true' : 'false');
                return bad;
            });
            if (invalid.length) {
                status.textContent = 'Please complete the highlighted fields.';
                invalid[0].focus();
                return;
            }
            var trap = $('.hp input', form);
            if (trap && trap.value) {
                status.textContent = 'Thank you. Your request has been sent.';
                form.reset();
                return;
            }
            if (!CONFIG.formEndpoint) {
                status.textContent = 'Thank you. This form is not connected yet: submissions will be enabled before the site goes live.';
                return;
            }
            var data = new FormData(form);
            data.append('_subject', form.getAttribute('data-form') + ' · Honest Global PLC');
            btn.disabled = true;
            status.textContent = 'Sending…';
            fetch(CONFIG.formEndpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
                .then(function (r) {
                    if (!r.ok) throw new Error(String(r.status));
                    form.reset();
                    status.textContent = 'Thank you. Your request has been sent, and our team will come back to you.';
                })
                .catch(function () {
                    status.textContent = 'Something went wrong. Please try again in a moment.';
                })
                .then(function () { btn.disabled = false; });
        });
    });

    /* ------------------------------------------------ Two-pane explorers (sectors, marques) */
    function twoPane(opts) {
        var root = $(opts.root);
        if (!root || !opts.items.length) return;
        var list = $(opts.list, root);
        var panel = $(opts.panel, root);
        var mobile = window.matchMedia('(max-width: 860px)');
        var buttons = [];
        var active = -1;
        panel.id = opts.panelId;

        opts.items.forEach(function (item, i) {
            var b = opts.button(item, i);
            b.type = 'button';
            b.setAttribute('aria-pressed', 'false');
            b.setAttribute('aria-controls', opts.panelId);
            b.addEventListener('click', function () { select(i); });
            buttons.push(b);
        });

        function swap(i) {
            var inner = panel.firstElementChild;
            if (!motion || !inner) { panel.innerHTML = opts.render(i); return; }
            gsap.killTweensOf(inner);
            gsap.to(inner, {
                autoAlpha: 0, y: -8, duration: 0.18, ease: 'power2.in',
                onComplete: function () {
                    panel.innerHTML = opts.render(i);
                    gsap.fromTo(panel.firstElementChild, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'expo.out' });
                    if (mobile.matches) ScrollTrigger.refresh();
                }
            });
        }
        function place() {
            if (mobile.matches && active > -1) buttons[active].after(panel);
            else if (panel.previousElementSibling !== list) list.after(panel);
        }
        function select(i) {
            if (i === active && panel.firstElementChild) return;
            if (active > -1) {
                buttons[active].classList.remove('is-active');
                buttons[active].setAttribute('aria-pressed', 'false');
            }
            active = i;
            if (i > -1) {
                buttons[i].classList.add('is-active');
                buttons[i].setAttribute('aria-pressed', 'true');
            }
            place();
            swap(i);
        }
        if (mobile.addEventListener) mobile.addEventListener('change', place);
        select(opts.initial || 0);
        return { select: select, buttons: buttons, refresh: function () { swap(active); }, active: function () { return active; } };
    }

    /* Import sectors */
    (function () {
        var data = window.HG_SECTORS || [];
        var input = $('#sector-search');
        var count = $('.search__count');
        var query = '';
        var explorer = twoPane({
            root: '[data-explorer]',
            list: '.explorer__list',
            panel: '.explorer__panel',
            panelId: 'sector-panel',
            items: data,
            button: function (s) {
                var b = document.createElement('button');
                b.className = 'sector';
                b.innerHTML = '<span class="sector__letter">' + s.letter + '</span><span class="sector__name">' + esc(s.name) + '</span>';
                $('[data-explorer] .explorer__list').appendChild(b);
                return b;
            },
            render: function (i) {
                if (i < 0) {
                    return '<div class="panel__inner"><span class="panel__letter">Z</span>' +
                        '<h4 class="panel__name">Not on the list?</h4>' +
                        '<p class="panel__items">We can still assess the sourcing possibilities, supplier availability and applicable import requirements for “' + esc(input.value.trim()) + '”.</p>' +
                        '<a class="link" href="trading.html?sector=other#sourcing" data-sector="other">Submit a sourcing request<span class="arr" aria-hidden="true">→</span></a></div>';
                }
                var s = data[i];
                var items = s.items.map(function (it) {
                    var h = esc(it);
                    return query && norm(it).indexOf(query) > -1 ? '<mark>' + h + '</mark>' : h;
                }).join('<span class="sep"> · </span>');
                var photo = s.photo ? '<div class="panel__media"><img src="https://images.unsplash.com/photo-' + s.photo +
                    '?auto=format&fit=crop&w=900&q=70" width="900" height="506" alt="" loading="lazy" decoding="async"></div>' : '';
                return '<div class="panel__inner">' + photo + '<span class="panel__letter">' + s.letter + '</span>' +
                    '<h4 class="panel__name">' + esc(s.name) + '</h4>' +
                    '<p class="panel__items">' + items + '</p>' +
                    (s.note ? '<p class="note panel__note">' + esc(s.note) + '</p>' : '') +
                    '<a class="link" href="trading.html?sector=' + s.letter + '#sourcing" data-sector="' + s.letter + '">Request a quotation in this sector<span class="arr" aria-hidden="true">→</span></a></div>';
            }
        });
        if (!explorer || !input) return;

        function matches(s) {
            if (!query) return true;
            if (norm(s.name).indexOf(query) > -1) return true;
            return s.items.some(function (it) { return norm(it).indexOf(query) > -1; });
        }
        input.addEventListener('input', function () {
            query = norm(input.value.trim());
            var first = -1, n = 0;
            data.forEach(function (s, i) {
                var m = matches(s);
                explorer.buttons[i].classList.toggle('is-muted', !m);
                if (m) { n++; if (first < 0) first = i; }
            });
            count.textContent = query ? (n ? n + (n > 1 ? ' sectors' : ' sector') : 'No match') : '';
            var active = explorer.active();
            if (!query) { if (active < 0) explorer.select(0); else explorer.refresh(); return; }
            if (!n) { explorer.select(-1); return; }
            if (active < 0 || !matches(data[active])) explorer.select(first); else explorer.refresh();
        });
    })();

    /* Marques */
    (function () {
        var flat = [];
        (window.HG_MARQUES || []).forEach(function (g) {
            g.marques.forEach(function (m) { flat.push({ group: g.group, m: m }); });
        });
        var groups = {};
        twoPane({
            root: '[data-marques]',
            list: '.mx__list',
            panel: '.mx__panel',
            panelId: 'marque-panel',
            items: flat,
            button: function (it) {
                var list = $('[data-marques] .mx__list');
                if (!groups[it.group]) {
                    var wrap = document.createElement('div');
                    wrap.className = 'mx-group';
                    wrap.innerHTML = '<p class="mx-group__name">' + esc(it.group) + '</p>';
                    list.appendChild(wrap);
                    groups[it.group] = wrap;
                }
                var b = document.createElement('button');
                b.className = 'mx-marque';
                b.textContent = it.m.name;
                groups[it.group].appendChild(b);
                return b;
            },
            render: function (i) {
                var it = flat[i], m = it.m;
                var article = /^[AEIOU]/.test(m.name) ? 'an ' : 'a ';
                var cta = m.cta || ('Request ' + article + m.name);
                var value = m.models.length ? m.name : 'other';
                return '<div class="mx-panel__inner">' +
                    '<p class="mx-panel__group">' + esc(it.group) + '</p>' +
                    '<h3 class="mx-panel__name">' + esc(m.name) + '</h3>' +
                    (m.models.length ? '<p class="mx-panel__label">Model lines, for reference</p><p class="mx-panel__models">' + m.models.map(esc).join('<span class="sep"> · </span>') + '</p>' : '') +
                    (m.note ? '<p class="note mx-panel__note">' + esc(m.note) + '</p>' : '') +
                    '<p class="mx-panel__cta"><a class="link" href="#request" data-marque="' + esc(value) + '">' + esc(cta) + '<span class="arr" aria-hidden="true">→</span></a></p></div>';
            }
        });
    })();

    if (!motion) {
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
        return;
    }

    /* ================================================================ Motion */
    gsap.registerPlugin(ScrollTrigger, SplitText);
    var EASE = 'expo.out';

    function fontsReady() {
        var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
        return Promise.race([ready, new Promise(function (r) { setTimeout(r, 2500); })]);
    }

    function splitChars(el) {
        var text = el.textContent;
        el.textContent = '';
        for (var i = 0; i < text.length; i++) {
            var ch = document.createElement('span');
            ch.className = 'ch';
            ch.textContent = text[i];
            el.appendChild(ch);
        }
        return $$('.ch', el);
    }

    /* Honest Oil: the container is drafted, filled, labelled and capped */
    function bottleTimeline(b) {
        var q = b.q;
        var cap = b.one('.b-capgroup');
        var ridges = b.one('.b-ridges');
        var spec = $$('[data-spec] > div');

        gsap.set(q('[pathLength]'), { strokeDasharray: 1, strokeDashoffset: 1 });
        gsap.set(q('.b-type, .b-letters'), { autoAlpha: 0 });
        gsap.set(ridges, { autoAlpha: 0, x: -10 });
        gsap.set(cap, { y: -9 });
        if (spec.length) gsap.set(spec, { autoAlpha: 0, y: 14 });
        b.liquid.level = 392;
        b.liquid.amp = 2.4;
        b.draw();

        var tl = gsap.timeline({
            defaults: { ease: 'none' },
            onUpdate: function () { b.liquid.phase = tl.progress() * 26; b.draw(); }
        });
        tl.to(q('.b-ground'), { strokeDashoffset: 0, duration: 0.5 }, 0)
            .to(q('.b-outline'), { strokeDashoffset: 0, duration: 1.4, ease: 'power1.inOut' }, 0.1)
            .to(q('.b-hole'), { strokeDashoffset: 0, duration: 0.5 }, 0.9)
            .to(q('.b-cap'), { strokeDashoffset: 0, duration: 0.4 }, 1.1)
            .to(ridges, { autoAlpha: 1, duration: 0.2 }, 1.4)
            .to(q('.b-hatch path'), { strokeDashoffset: 0, duration: 0.7 }, 1.2)
            .to(q('.b-highlight'), { strokeDashoffset: 0, duration: 0.5 }, 1.3)
            .to(q('.b-panel, .b-inner'), { strokeDashoffset: 0, duration: 0.5, stagger: 0.1 }, 1.5)
            .to(b.liquid, { level: 150, duration: 1.8, ease: 'power1.inOut' }, 1.9)
            .to(q('.b-type'), { autoAlpha: 1, duration: 0.4 }, 2.5)
            .to(b.liquid, { amp: 0.9, duration: 0.8, ease: 'power1.out' }, 3.1)
            .to(cap, { y: 0, duration: 0.5, ease: 'power2.inOut' }, 3.4)
            .to(ridges, { x: 0, duration: 0.5, ease: 'power2.inOut' }, 3.4)
            .to(q('.b-callouts path'), { strokeDashoffset: 0, duration: 0.3, stagger: 0.1 }, 3.6)
            .to(q('.b-letters'), { autoAlpha: 1, duration: 0.3 }, 3.9);
        if (spec.length) tl.to(spec, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.25, ease: 'power2.out' }, 2.1);
        return tl;
    }

    /* Any engraving: strokes are drafted, printed details appear */
    function drawTimeline(svg) {
        var strokes = $$('[pathLength]', svg);
        var fades = $$('[data-draw-fade]', svg);
        gsap.set(strokes, { strokeDasharray: 1, strokeDashoffset: 1 });
        gsap.set(fades, { autoAlpha: 0 });
        var tl = gsap.timeline();
        tl.to(strokes, { strokeDashoffset: 0, duration: 1.4, stagger: { amount: 1.8 }, ease: 'power2.inOut' });
        tl.to(fades, { autoAlpha: 1, duration: 0.9, stagger: 0.08, ease: 'power2.out' }, '-=0.8');
        return tl;
    }

    function globeIntro(tl, at) {
        if (!globe) return;
        var g = globe.state;
        var lon = g.lon;
        g.alpha = 0; g.routes = 0; g.marker = 0; g.lon = lon - 90;
        globe.request();
        globe.onInteract = function () { gsap.killTweensOf(g, 'lon,lat'); };
        tl.to(g, { alpha: 1, duration: 1.6, ease: 'power2.out', onUpdate: globe.request }, at)
            .to(g, { lon: lon, duration: 3.4, ease: 'expo.out', onUpdate: globe.request }, at)
            .to(g, { marker: 1, duration: 1.2, onUpdate: globe.request }, at + 1.5)
            .to(g, { routes: 1, duration: 2, ease: 'power2.inOut', onUpdate: globe.request }, at + 1.7);
    }

    /* Home opening: the page is "printed" */
    function homeIntro() {
        var chars = [];
        $$('.word', fitEl).forEach(function (w) { chars = chars.concat(splitChars(w)); });
        fit();
        var line = SplitText.create('.cover__line', { type: 'lines', mask: 'lines', linesClass: 'ln' });
        var tl = gsap.timeline({ defaults: { ease: EASE }, onComplete: function () { line.revert(); } });

        tl.set('.cover__title, .cover__line, .cover__plate', { autoAlpha: 1 })
            .from(chars, { yPercent: 125, duration: 1.8, stagger: 0.05 }, 0.15)
            .fromTo('.cover .rule-double', { autoAlpha: 1, scaleX: 0 }, { scaleX: 1, duration: 1.9, ease: 'expo.inOut' }, 0.25)
            .fromTo('.cover__plc', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 1.3)
            .fromTo('.cover__meta p', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.1 }, 0.7)
            .fromTo('.masthead__nav, .menu-btn', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2 }, 0.9)
            .from(line.lines, { yPercent: 110, duration: 1.5, stagger: 0.1 }, 1.0)
            .fromTo('.cover__text .standfirst, .cover__links', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1.3, stagger: 0.12 }, 1.35)
            .fromTo('.cover__plate .caption', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 2.4);
        globeIntro(tl, 0.4);
    }

    /* Inner pages: a chapter opening */
    function openerIntro() {
        var op = $('.opener');
        if (!op) return;
        var num = $('.opener__num', op);
        var chars = num ? splitChars(num) : [];
        var titleSplit = SplitText.create($('.opener__title', op), { type: 'lines', mask: 'lines', linesClass: 'ln' });
        var tl = gsap.timeline({ defaults: { ease: EASE }, onComplete: function () { titleSplit.revert(); } });

        tl.set($$('.opener__title, .opener__num', op), { autoAlpha: 1 })
            .fromTo($$('.opener__meta p', op), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.1 }, 0)
            .from(chars, { yPercent: 115, duration: 1.7, stagger: 0.08 }, 0.1)
            .fromTo($('.opener__kicker', op), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 1.2 }, 0.3)
            .from(titleSplit.lines, { yPercent: 110, duration: 1.5, stagger: 0.1 }, 0.4)
            .fromTo($('.rule-double', op), { autoAlpha: 1, scaleX: 0 }, { scaleX: 1, duration: 1.8, ease: 'expo.inOut' }, 0.5)
            .fromTo($$('.opener__deck, .opener__aside', op), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1.3, stagger: 0.12 }, 1.0);

        var figs = $$('.opener__figure, .opener__wide', op);
        if (figs.length) tl.fromTo(figs, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2, ease: 'power2.out' }, 0.7);
        bottles.filter(function (x) { return op.contains(x.el); }).forEach(function (b) { tl.add(bottleTimeline(b), 1.0); });
        $$('[data-draw-auto]', op).forEach(function (svg) { tl.add(drawTimeline(svg), 0.9); });
        if (globeEl && op.contains(globeEl)) globeIntro(tl, 0.5);
    }

    function scrollScenes() {
        var mm = gsap.matchMedia();

        /* Home: the wordmark docks into the masthead once the cover title has passed */
        if (title) {
            ScrollTrigger.create({
                trigger: title,
                start: function () { return 'bottom top+=' + headerH(); },
                onEnter: function () { masthead.classList.add('is-docked'); },
                onLeaveBack: function () { masthead.classList.remove('is-docked'); }
            });
        }

        /* Running head: the current section, like a book */
        var rh = $('.rh');
        var current = '';
        function setRunning(label) {
            if (!rh || label === current) return;
            current = label;
            gsap.killTweensOf(rh);
            gsap.to(rh, {
                yPercent: -100, autoAlpha: 0, duration: 0.3, ease: 'power2.in',
                onComplete: function () {
                    rh.innerHTML = label;
                    if (label) gsap.fromTo(rh, { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: EASE });
                }
            });
        }
        $$('[data-running]').forEach(function (sec, i) {
            var label = sec.getAttribute('data-running');
            ScrollTrigger.create({
                trigger: sec,
                start: 'top 45%',
                end: 'bottom 45%',
                onEnter: function () { setRunning(label); },
                onEnterBack: function () { setRunning(label); },
                onLeaveBack: i === 0 ? function () { setRunning(''); } : null
            });
        });

        /* The globe turns as its section scrolls away */
        if (globe) {
            var globeSection = globeEl.closest('section') || globeEl;
            gsap.to(globe.state, {
                spin: 60, ease: 'none', onUpdate: globe.request,
                scrollTrigger: { trigger: globeSection, start: 'top top', end: 'bottom top', scrub: 1 }
            });
            gsap.to(globeEl, {
                yPercent: 8, ease: 'none',
                scrollTrigger: { trigger: globeSection, start: 'top top', end: 'bottom top', scrub: true }
            });
        }

        /* Cars: the wheels turn and the car moves with the scroll */
        $$('[data-car]').forEach(function (svg) {
            function range() { return { trigger: svg, start: 'top bottom', end: 'bottom top', scrub: 0.6 }; }
            $$('.car__spokes', svg).forEach(function (w) {
                gsap.to(w, { rotation: 540, svgOrigin: w.getAttribute('data-origin'), ease: 'none', scrollTrigger: range() });
            });
            gsap.fromTo(svg, { xPercent: -3 }, { xPercent: 3, ease: 'none', scrollTrigger: range() });
        });

        /* Rules are ruled across the page */
        $$('[data-rule]').forEach(function (el) {
            var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
            tl.fromTo(el, { '--rx': 0 }, { '--rx': 1, duration: 1.6, ease: 'expo.inOut' });
            if (el.classList.contains('chapter__head')) {
                tl.fromTo(el.children, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08, ease: EASE }, 0.55);
            }
        });

        /* Headlines are set line by line */
        $$('[data-split]').forEach(function (el) {
            if (el.classList.contains('cover__line')) return;
            var done = false;
            SplitText.create(el, {
                type: 'lines',
                mask: 'lines',
                linesClass: 'ln',
                autoSplit: true,
                onSplit: function (self) {
                    if (done) return;
                    return gsap.from(self.lines, {
                        yPercent: 110, duration: 1.5, stagger: 0.1, ease: EASE,
                        scrollTrigger: { trigger: el, start: 'top 94%', once: true },
                        onComplete: function () { done = true; }
                    });
                }
            });
        });

        /* Text blocks */
        gsap.set('[data-fade]', { autoAlpha: 0, y: 18 });
        ScrollTrigger.batch('[data-fade]', {
            start: 'top 86%',
            once: true,
            onEnter: function (batch) {
                gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.3, stagger: 0.1, ease: EASE, overwrite: true });
            }
        });
        $$('[data-stagger]').forEach(function (el) {
            gsap.fromTo(el.children, { autoAlpha: 0, y: 14 }, {
                autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.045, ease: EASE,
                scrollTrigger: { trigger: el, start: 'top 88%', once: true }
            });
        });

        /* Engraved drawings are drafted stroke by stroke */
        $$('[data-draw-auto]').forEach(function (svg) {
            if (svg.closest('.opener')) return;
            var tl = drawTimeline(svg).pause();
            ScrollTrigger.create({ trigger: svg, start: 'top 82%', once: true, onEnter: function () { tl.play(); } });
        });

        /* Honest Oil on the home page: pinned and driven by the scroll on desktop, played once on mobile */
        bottles.filter(function (b) { return b.mode === 'pin'; }).forEach(function (b) {
            var body = b.el.closest('.oil__body');
            mm.add('(min-width: 861px)', function () {
                ScrollTrigger.create({
                    animation: bottleTimeline(b),
                    trigger: body,
                    start: function () { return 'center center+=' + Math.round(headerH() / 2); },
                    end: '+=160%',
                    pin: true,
                    scrub: 0.8,
                    anticipatePin: 1
                });
            });
            mm.add('(max-width: 860px)', function () {
                var tl = bottleTimeline(b).pause();
                ScrollTrigger.create({ trigger: b.el, start: 'top 70%', once: true, onEnter: function () { tl.play(); } });
            });
        });
        bottles.filter(function (b) { return b.mode === 'play' && !b.el.closest('.opener'); }).forEach(function (b) {
            var tl = bottleTimeline(b).pause();
            ScrollTrigger.create({ trigger: b.el, start: 'top 72%', once: true, onEnter: function () { tl.play(); } });
        });

        /* Lists that are called out one by one as you scroll */
        $$('[data-rollcall]').forEach(function (list) {
            gsap.fromTo(list.children, { opacity: 0.14 }, {
                opacity: 1, stagger: 0.4, ease: 'none',
                scrollTrigger: { trigger: list, start: 'top 82%', end: 'bottom 48%', scrub: 0.6 }
            });
        });

        /* Seals: rings turning like a movement */
        seals.forEach(function (s) {
            var section = s.el.closest('section') || s.el;
            gsap.fromTo(s.view.state, { alpha: 0 }, {
                alpha: 1, duration: 1.6, ease: 'power2.out', onUpdate: s.view.request,
                scrollTrigger: { trigger: s.el, start: 'top 92%', once: true }
            });
            gsap.to(s.view.state, {
                r0: 0.5, r1: -0.75, r2: 1.1, ease: 'none', onUpdate: s.view.request,
                scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 1 }
            });
        });

        /* Home: the paper page slides over the last chapter */
        var last = $('.chapter--turn');
        var group = $('.group');
        if (last && group) {
            mm.add('(min-width: 861px)', function () {
                ScrollTrigger.create({
                    trigger: last,
                    start: 'bottom bottom',
                    end: function () { return '+=' + window.innerHeight; },
                    pin: true,
                    pinSpacing: false
                });
                gsap.fromTo(last, { '--dim': 0 }, {
                    '--dim': 0.7, ease: 'none',
                    scrollTrigger: { trigger: group, start: 'top bottom', end: 'top top', scrub: true }
                });
            });
        }
    }

    /* Shared opening and scenes (site.js); a page may bring its own (home.js) */
    var site = window.HG_SITE || null;
    var page = window.HG_PAGE || null;
    var pageApi = {
        $: $, $$: $$, EASE: EASE, lenis: lenis, headerH: headerH, scrollToEl: scrollToEl,
        globe: globe, globeEl: globeEl, globeIntro: globeIntro
    };

    fontsReady().then(function () {
        if (page && page.intro) page.intro(pageApi);
        else if (site && site.intro) site.intro(pageApi);
        else if (fitEl) homeIntro();
        else openerIntro();
        scrollScenes();
        if (site && site.scenes) site.scenes(pageApi);
        if (page && page.scenes) page.scenes(pageApi);
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
        if (window.location.hash) {
            var target = $(window.location.hash);
            if (target) setTimeout(function () { scrollToEl(target); }, 300);
        }
    });
})();
