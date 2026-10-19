/* Honest Global PLC, home page motion: the intro and the scenes only the home page has.
   The hero, the masthead and the photographs are handled by site.js. */
(function () {
    'use strict';

    function rand(seed) {
        var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
        return x - Math.floor(x);
    }

    /* ------------------------------------------------ Intro: the cannon is revealed, then opens like a lens */
    function boot(A, el, hero) {
        var $ = A.$, $$ = A.$$;
        var html = document.documentElement;
        if (A.lenis) A.lenis.stop();

        // Bezel ticks, every 6 degrees, longer every 30
        var ticks = $('.bm-ticks', el);
        var d = '';
        for (var i = 0; i < 60; i++) {
            var a = i * Math.PI / 30, r0 = i % 5 ? 158 : 154, r1 = 166;
            d += 'M' + (Math.cos(a) * r0).toFixed(1) + ' ' + (Math.sin(a) * r0).toFixed(1) +
                ' L' + (Math.cos(a) * r1).toFixed(1) + ' ' + (Math.sin(a) * r1).toFixed(1) + ' ';
        }
        ticks.setAttribute('d', d);

        var word = $('.boot__word .w', el);
        var text = word.textContent;
        word.textContent = '';
        var chars = text.split('').map(function (c) {
            var s = document.createElement('span');
            s.className = 'ch';
            s.textContent = c === ' ' ? ' ' : c;
            word.appendChild(s);
            return s;
        });

        var count = $('[data-boot-count]', el);
        var state = $('[data-boot-state]', el);
        var stage = $('.boot__stage', el);
        var strokes = $$('[pathLength]', el);
        var n = { v: 0 };
        gsap.set(strokes, { strokeDasharray: 1, strokeDashoffset: 1 });
        gsap.set($$('.bm-ringtext, .bm-dots circle, .bm-labels text, .boot__word .p', el), { autoAlpha: 0 });
        gsap.set($$('.hud, .boot__skip', el), { autoAlpha: 0 });
        gsap.set(el, { '--hole': '0px' });

        var finished = false;
        function done() {
            if (finished) return;
            finished = true;
            try { sessionStorage.setItem('hg-boot', '1'); } catch (e) { /* storage blocked */ }
            html.classList.remove('boot-on');
            el.remove();
            if (A.lenis) A.lenis.start();
            ScrollTrigger.refresh();
        }

        var tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onComplete: done });
        tl.timeScale(1.2);
        tl.to($('.boot__grid', el), { opacity: 1, duration: 0.9, ease: 'none' }, 0)
            .fromTo($('.boot__frame', el), { autoAlpha: 0, scale: 1.02 }, { autoAlpha: 1, scale: 1, duration: 1, ease: A.EASE }, 0)
            .to($$('.hud, .boot__skip', el), { autoAlpha: 1, duration: 0.6, stagger: 0.07, ease: 'none' }, 0.15)
            .to(n, {
                v: 100, duration: 2.9, ease: 'power1.inOut',
                onUpdate: function () { count.textContent = Math.round(n.v); }
            }, 0)
            .fromTo($('.bm-head', el), { attr: { x1: -480, x2: -480 }, opacity: 0.9 }, { attr: { x1: 480, x2: 480 }, duration: 1.9, ease: 'power1.inOut' }, 0.2)
            .to($('.bm-head', el), { opacity: 0, duration: 0.3 }, 1.9)
            .to($$('.bm-rings [pathLength]', el), { strokeDashoffset: 0, duration: 1.3, stagger: 0.12 }, 0.2)
            // The cannon is uncovered from left to right, then its orange bar is drawn under it
            .fromTo($('.bm-logo-wipe', el), { attr: { width: 0 } }, { attr: { width: 180 }, duration: 1.4, ease: 'power2.inOut' }, 0.45)
            .fromTo($('.bm-logo image', el), { opacity: 0.2 }, { opacity: 1, duration: 1.2, ease: 'power1.out' }, 0.45)
            .to($('.bm-bar', el), { strokeDashoffset: 0, duration: 0.7, ease: A.EASE }, 1.7)
            .to($$('.bm-callouts [pathLength]', el), { strokeDashoffset: 0, duration: 0.8, stagger: 0.12 }, 1.55)
            .to($$('.bm-dots circle', el), { autoAlpha: 1, duration: 0.3, stagger: 0.12 }, 1.55)
            .fromTo($$('.bm-labels text', el), { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12, ease: A.EASE }, 1.9)
            .fromTo($('.bm-ringtext', el), { autoAlpha: 0, rotation: -24, svgOrigin: '0 0' }, { autoAlpha: 1, rotation: 0, svgOrigin: '0 0', duration: 2, ease: A.EASE }, 1.2)
            .from(chars, { yPercent: 115, duration: 1.2, stagger: 0.035, ease: A.EASE }, 1.7)
            .to($('.boot__word .p', el), { autoAlpha: 1, duration: 0.6 }, 2.4)
            .add(function () { state.textContent = 'Ready'; }, 2.9)
            .addLabel('portal', 3.25)
            .add(function () {
                // The hole opens inside the seal, wherever it sits on this screen
                var g = $('.bm-inner', el).getBoundingClientRect();
                var cx = g.left + g.width / 2, cy = g.top + g.height / 2;
                var far = Math.max(
                    Math.hypot(cx, cy), Math.hypot(window.innerWidth - cx, cy),
                    Math.hypot(cx, window.innerHeight - cy), Math.hypot(window.innerWidth - cx, window.innerHeight - cy)
                );
                el.style.setProperty('--px', cx + 'px');
                el.style.setProperty('--py', cy + 'px');
                gsap.timeline()
                    .to(el, { '--hole': (g.width / 2 - 1) + 'px', duration: 0.6, ease: 'power3.out' })
                    .to(el, { '--hole': (far + 40) + 'px', duration: 1.25, ease: 'expo.inOut' }, 0.75);
            }, 'portal')
            .to(stage, { scale: 1.9, autoAlpha: 0, duration: 1.3, ease: 'expo.in', transformOrigin: '50% 42%' }, 'portal+=0.85')
            .to($$('.boot__hud, .boot__skip, .boot__frame, .boot__grid', el), { autoAlpha: 0, duration: 0.6 }, 'portal+=1.1')
            .add(function () { hero.play(); }, 'portal+=0.9')
            .to({}, { duration: 0.95 }, 'portal+=1.1');

        var hurried = false;
        function hurry() { if (!finished && !hurried) { hurried = true; tl.timeScale(4.5); } }
        el.addEventListener('click', hurry);
        var skip = $('[data-boot-skip]', el);
        if (skip) skip.addEventListener('click', function (e) { e.stopPropagation(); hurry(); });
        window.addEventListener('keydown', function (e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') hurry(); }, { once: true });
    }

    function intro(A) {
        var el = A.$('#boot');
        var hero = window.HG_SITE.heroTimeline(A);
        if (el && getComputedStyle(el).display !== 'none') {
            boot(A, el, hero);
        } else {
            if (el) el.remove();
            document.documentElement.classList.remove('boot-on');
            hero.play();
        }
    }

    /* ================================================================ Scroll scenes */
    function scenes(A) {
        var $ = A.$, $$ = A.$$;
        var mm = gsap.matchMedia();
        /* Imports: the gallery runs sideways while the page is held */
        var run = $('[data-hscroll]');
        if (run) {
            var track = $('.run__track', run);
            mm.add('(min-width: 861px)', function () {
                run.classList.add('is-pinned');
                function dist() { return Math.max(0, track.scrollWidth - window.innerWidth); }
                var tween = gsap.to(track, {
                    x: function () { return -dist(); },
                    ease: 'none',
                    scrollTrigger: {
                        trigger: run,
                        start: 'center center',
                        end: function () { return '+=' + dist(); },
                        pin: true,
                        scrub: 0.8,
                        invalidateOnRefresh: true
                    }
                });
                return function () { run.classList.remove('is-pinned'); gsap.set(track, { clearProps: 'x' }); tween.kill(); };
            });
        }

        /* Automobiles: the cars drive out of the distance */
        var reel = $('[data-reel]');
        if (reel) {
            mm.add('(min-width: 861px)', function () {
                reel.classList.add('is-3d');
                var cards = $$('.rc', reel);
                var floor = $('.reel__floor', reel);
                var counter = $('[data-reel-count]', reel);
                var GAP = 1100, NEAR = -140;
                var travel = (cards.length - 1) * GAP + 160;
                var spread = function () { return Math.min(window.innerWidth * 0.2, 300); };
                var shown = -1;

                function place(p) {
                    var s = spread();
                    var nearest = 0, best = Infinity;
                    cards.forEach(function (c, i) {
                        var z = NEAR - i * GAP + p * travel;
                        var x = (i % 2 ? 1 : -1) * s;
                        var far = Math.min(1, Math.max(0, (z + 5200) / 1800));
                        var past = Math.min(1, Math.max(0, (380 - z) / 420));
                        c.style.transform = 'translate3d(' + x.toFixed(1) + 'px, 0, ' + z.toFixed(1) + 'px)';
                        c.style.opacity = (far * past).toFixed(3);
                        c.style.visibility = far * past > 0.01 ? 'visible' : 'hidden';
                        var dz = Math.abs(z - NEAR);
                        if (z < 600 && dz < best) { best = dz; nearest = i; }
                    });
                    floor.style.backgroundPosition = '0 ' + (p * travel * 0.55).toFixed(1) + 'px';
                    if (nearest !== shown) {
                        shown = nearest;
                        counter.textContent = nearest + 1;
                    }
                }
                place(0);
                ScrollTrigger.create({
                    trigger: reel,
                    start: 'top top',
                    end: function () { return '+=' + Math.round(window.innerHeight * cards.length * 0.55); },
                    pin: true,
                    scrub: 0.9,
                    onUpdate: function (self) { place(self.progress); },
                    onRefresh: function (self) { place(self.progress); }
                });
                return function () {
                    reel.classList.remove('is-3d');
                    cards.forEach(function (c) { c.style.transform = c.style.opacity = c.style.visibility = ''; });
                    floor.style.backgroundPosition = '';
                };
            });
        }

        /* Ethiopia: photographs gather into a circle, then the circle turns */
        var ring = $('[data-ring]');
        if (ring) {
            var tiles = $$('.rt__in', ring);
            mm.add('(min-width: 861px)', function () {
                var gather = gsap.timeline({
                    scrollTrigger: { trigger: ring, start: 'top 95%', end: 'center 55%', scrub: 1 }
                });
                tiles.forEach(function (t, i) {
                    gather.fromTo(t, {
                        x: function () { return (rand(i + 1) - 0.5) * window.innerWidth * 1.1; },
                        y: function () { return (rand(i + 41) - 0.2) * window.innerHeight * 0.9; },
                        rotation: (rand(i + 7) - 0.5) * 50,
                        scale: 0.55,
                        autoAlpha: 0
                    }, { x: 0, y: 0, rotation: 0, scale: 1, autoAlpha: 1, ease: 'power2.out', duration: 1 }, rand(i + 13) * 0.35);
                });
                gather.fromTo($('.ring__center', ring), { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'power2.out' }, 0.7);
            });
            // On a phone the circle is already formed; the photographs only settle in briefly
            mm.add('(max-width: 860px)', function () {
                gsap.from(tiles, {
                    autoAlpha: 0, scale: 0.9, duration: 0.5, stagger: 0.03, ease: 'power2.out',
                    scrollTrigger: { trigger: ring, start: 'top 85%', once: true }
                });
            });
            gsap.fromTo($('.ring__tiles', ring), { rotation: -18 }, {
                rotation: 18, ease: 'none',
                scrollTrigger: { trigger: ring, start: 'top bottom', end: 'bottom top', scrub: 1 }
            });
        }

    }

    window.HG_PAGE = { intro: intro, scenes: scenes };
})();
