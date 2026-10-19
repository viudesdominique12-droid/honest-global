/* Honest Global PLC, home page motion.
   main.js calls intro() once fonts are ready, then scenes() after the shared scroll scenes. */
(function () {
    'use strict';

    function rand(seed) {
        var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
        return x - Math.floor(x);
    }

    /* ------------------------------------------------ The opening of the page, once the intro is over */
    function heroTimeline(A) {
        var $ = A.$, $$ = A.$$;
        var hero = $('.hero');
        var img = $('.hero__media img', hero);
        var split = SplitText.create($('.hero__title', hero), { type: 'lines', mask: 'lines', linesClass: 'ln' });
        var tl = gsap.timeline({ paused: true, defaults: { ease: A.EASE }, onComplete: function () { split.revert(); } });
        tl.fromTo(img, { scale: 1.16 }, { scale: 1, duration: 2.6, ease: 'expo.out' }, 0)
            .set($('.hero__title', hero), { autoAlpha: 1 }, 0.1)
            .from(split.lines, { yPercent: 115, duration: 1.6, stagger: 0.12 }, 0.15)
            .fromTo($$('.hero__kicker, .hero__lead, .hero__actions, .hero__scroll', hero), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1.3, stagger: 0.1 }, 0.45)
            .fromTo($$('.masthead__bar > *'), { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08 }, 0.6);
        return tl;
    }

    /* ------------------------------------------------ Intro: the mark is drafted, then opens like a lens */
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
        gsap.set($$('.bm-ringtext, .bm-addis, .bm-dots circle, .bm-labels text, .boot__word .p', el), { autoAlpha: 0 });
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
        tl.to($('.boot__grid', el), { opacity: 1, duration: 0.9, ease: 'none' }, 0)
            .fromTo($('.boot__frame', el), { autoAlpha: 0, scale: 1.02 }, { autoAlpha: 1, scale: 1, duration: 1, ease: A.EASE }, 0)
            .to($$('.hud, .boot__skip', el), { autoAlpha: 1, duration: 0.6, stagger: 0.07, ease: 'none' }, 0.15)
            .to(n, {
                v: 100, duration: 2.9, ease: 'power1.inOut',
                onUpdate: function () { count.textContent = ('00' + Math.round(n.v)).slice(-3); }
            }, 0)
            .fromTo($('.bm-head', el), { attr: { x1: -480, x2: -480 }, opacity: 0.9 }, { attr: { x1: 480, x2: 480 }, duration: 1.9, ease: 'power1.inOut' }, 0.2)
            .to($('.bm-head', el), { opacity: 0, duration: 0.3 }, 1.9)
            .to($$('.bm-rings [pathLength]', el), { strokeDashoffset: 0, duration: 1.3, stagger: 0.12 }, 0.2)
            .to($$('.bm-globe [pathLength]', el), { strokeDashoffset: 0, duration: 1.1, stagger: 0.07 }, 0.55)
            .to($$('.bm-routes [pathLength]', el), { strokeDashoffset: 0, duration: 0.9, stagger: 0.12 }, 1.35)
            .to($('.bm-addis', el), { autoAlpha: 1, duration: 0.4 }, 1.3)
            .to($$('.bm-callouts [pathLength]', el), { strokeDashoffset: 0, duration: 0.8, stagger: 0.12 }, 1.55)
            .to($$('.bm-dots circle', el), { autoAlpha: 1, duration: 0.3, stagger: 0.12 }, 1.55)
            .fromTo($$('.bm-labels text', el), { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12, ease: A.EASE }, 1.9)
            .fromTo($('.bm-ringtext', el), { autoAlpha: 0, rotation: -24, svgOrigin: '0 0' }, { autoAlpha: 1, rotation: 0, svgOrigin: '0 0', duration: 2, ease: A.EASE }, 1.2)
            .from(chars, { yPercent: 115, duration: 1.2, stagger: 0.035, ease: A.EASE }, 1.7)
            .to($('.boot__word .p', el), { autoAlpha: 1, duration: 0.6 }, 2.4)
            .add(function () { state.textContent = 'Ready'; }, 2.9)
            .addLabel('portal', 3.25)
            .add(function () {
                // The hole opens on the globe, wherever it sits on this screen
                var g = $('.bm-globe circle', el).getBoundingClientRect();
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

        function hurry() { if (!finished && tl.timeScale() === 1) tl.timeScale(4); }
        el.addEventListener('click', hurry);
        var skip = $('[data-boot-skip]', el);
        if (skip) skip.addEventListener('click', function (e) { e.stopPropagation(); hurry(); });
        window.addEventListener('keydown', function (e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') hurry(); }, { once: true });
    }

    function intro(A) {
        var el = A.$('#boot');
        var hero = heroTimeline(A);
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
        var masthead = $('.masthead');
        var hero = $('.hero');

        /* The masthead sits on the photograph, then turns to paper */
        if (hero && masthead) {
            ScrollTrigger.create({
                trigger: hero,
                start: function () { return 'bottom top+=' + (A.headerH() + 1); },
                onEnter: function () { masthead.classList.remove('is-over'); },
                onLeaveBack: function () { masthead.classList.add('is-over'); }
            });
        }

        /* The hero photograph shrinks into a print as the page lifts */
        if (hero) {
            var range = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
            gsap.fromTo($('.hero__media', hero), { clipPath: 'inset(0% 0% 0% 0% round 0px)' }, { clipPath: 'inset(9% 4% 0% 4% round 6px)', ease: 'none', scrollTrigger: range });
            gsap.to($('.hero__media img', hero), { yPercent: 12, ease: 'none', scrollTrigger: range });
            gsap.to($('.hero__inner', hero), { yPercent: -18, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '60% top', scrub: true } });
        }

        /* Photographs are uncovered from the bottom and settle into place */
        $$('[data-reveal]').forEach(function (el) {
            var img = $('img', el);
            var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
            tl.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' })
                .fromTo(img, { scale: 1.3 }, { scale: 1, duration: 2.2, ease: 'expo.out' }, 0.1);
        });
        $$('.coffee .cf__media img, .card__media img').forEach(function (img) {
            gsap.fromTo(img, { yPercent: -5 }, {
                yPercent: 5, ease: 'none',
                scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true }
            });
        });

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
                        start: 'top top',
                        end: function () { return '+=' + dist(); },
                        pin: true,
                        scrub: 0.8,
                        invalidateOnRefresh: true
                    }
                });
                $$('.tile__media img', run).forEach(function (img) {
                    gsap.fromTo(img, { xPercent: -6, scale: 1.12 }, {
                        xPercent: 6, scale: 1.12, ease: 'none',
                        scrollTrigger: { trigger: img.parentNode, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
                    });
                });
                return function () { run.classList.remove('is-pinned'); gsap.set(track, { clearProps: 'x' }); };
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
                var GAP = 1100, NEAR = -260;
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
                        counter.textContent = ('0' + (nearest + 1)).slice(-2);
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

        /* The globe is drawn when its band arrives */
        if (A.globe) {
            var gtl = gsap.timeline({ paused: true });
            A.globeIntro(gtl, 0);
            ScrollTrigger.create({ trigger: A.globeEl, start: 'top 80%', once: true, onEnter: function () { gtl.play(); } });
        }

        /* Ethiopia: photographs gather into a circle, then the circle turns */
        var ring = $('[data-ring]');
        if (ring) {
            var tiles = $$('.rt__in', ring);
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
            gsap.fromTo($('.ring__tiles', ring), { rotation: -18 }, {
                rotation: 18, ease: 'none',
                scrollTrigger: { trigger: ring, start: 'top bottom', end: 'bottom top', scrub: 1 }
            });
        }

        /* The closing photograph drifts behind its headline */
        var closing = $('.closing-photo__media img');
        if (closing) {
            gsap.fromTo(closing, { yPercent: -6 }, {
                yPercent: 6, ease: 'none',
                scrollTrigger: { trigger: closing.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true }
            });
        }
    }

    window.HG_PAGE = { intro: intro, scenes: scenes };
})();
