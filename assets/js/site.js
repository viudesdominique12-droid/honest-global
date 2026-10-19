/* Honest Global PLC, behaviour shared by every page: the hero photograph, the masthead,
   photographs revealed as you scroll, numbers that count up, the globe band.
   main.js calls HG_SITE.intro() once fonts are ready, then HG_SITE.scenes(). */
(function () {
    'use strict';

    /* A tiny, blurred copy of each photograph shows at once while the full image loads */
    Array.prototype.forEach.call(document.querySelectorAll('img[loading="lazy"]'), function (img) {
        var m = /^(https:\/\/images\.unsplash\.com\/photo-[^?]+)/.exec(img.getAttribute('src') || '');
        if (!m || (img.complete && img.naturalWidth)) return;
        img.style.backgroundImage = 'url("' + m[1] + '?auto=format&fit=crop&w=40&q=40&blur=40")';
        img.style.backgroundSize = 'cover';
        img.style.backgroundPosition = 'center';
    });

    /* ------------------------------------------------ The opening of a page: the photograph settles, the title rises */
    function heroTimeline(A) {
        var $ = A.$, $$ = A.$$;
        var hero = $('.hero');
        var tl = gsap.timeline({ paused: true, defaults: { ease: A.EASE } });
        if (!hero) {
            tl.fromTo($$('.masthead__bar > *'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 });
            return tl;
        }
        var title = $('.hero__title', hero);
        var split = SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'ln' });
        tl.eventCallback('onComplete', function () { split.revert(); });
        tl.fromTo($('.hero__media img', hero), { scale: 1.16 }, { scale: 1, duration: 2.6, ease: 'expo.out' }, 0)
            .set(title, { autoAlpha: 1 }, 0.1)
            .from(split.lines, { yPercent: 115, duration: 1.6, stagger: 0.12 }, 0.15)
            .fromTo($$('.hero__kicker, .hero__lead, .hero__actions, .hero__scroll', hero), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1.3, stagger: 0.1 }, 0.45)
            // clearProps: a leftover transform would shrink the businesses menu to the width of the navigation
            .fromTo($$('.masthead__bar > *'), { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08, clearProps: 'transform' }, 0.6);
        return tl;
    }

    function intro(A) {
        heroTimeline(A).play();
    }

    /* ================================================================ Scroll scenes */
    function scenes(A) {
        var $ = A.$, $$ = A.$$;
        var mm = gsap.matchMedia();
        var masthead = $('.masthead');
        var hero = $('.hero');

        /* The masthead grows compact once the page moves */
        if (masthead) {
            ScrollTrigger.create({
                start: 40,
                end: 'max',
                onToggle: function (self) { masthead.classList.toggle('is-compact', self.isActive); }
            });
        }

        /* The masthead sits on the photograph, then turns blue */
        if (hero && masthead) {
            ScrollTrigger.create({
                trigger: hero,
                start: function () { return 'bottom top+=' + (A.headerH() + 1); },
                onEnter: function () { masthead.classList.remove('is-over'); },
                onLeaveBack: function () { masthead.classList.add('is-over'); }
            });
        } else if (masthead) {
            masthead.classList.remove('is-over');
        }

        /* The hero photograph shrinks into a print as the page lifts */
        if (hero) {
            var range = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
            gsap.fromTo($('.hero__media', hero), { clipPath: 'inset(0% 0% 0% 0% round 0px)' }, { clipPath: 'inset(9% 4% 0% 4% round 6px)', ease: 'none', scrollTrigger: range });
            gsap.to($('.hero__media img', hero), { yPercent: 12, ease: 'none', scrollTrigger: range });
            gsap.to($('.hero__inner', hero), { yPercent: -18, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '60% top', scrub: true } });
        }

        /* Photographs are uncovered from the bottom and settle into place.
           On a phone they are simply there: no waiting while you scroll. */
        mm.add('(min-width: 861px)', function () {
            $$('[data-reveal]').forEach(function (el) {
                var img = $('img', el);
                var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
                tl.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' });
                if (img) tl.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 2, ease: 'expo.out' }, 0.1);
            });
            $$('[data-parallax] img').forEach(function (img) {
                gsap.fromTo(img, { yPercent: -5 }, {
                    yPercent: 5, ease: 'none',
                    scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true }
                });
            });
        });

        /* Figures count up from zero */
        $$('[data-count]').forEach(function (el) {
            var to = parseFloat(el.getAttribute('data-count'));
            var show = function (v) { el.textContent = Math.round(v); };
            var n = { v: 0 };
            show(n.v);
            ScrollTrigger.create({
                trigger: el,
                start: 'top 88%',
                once: true,
                onEnter: function () {
                    gsap.to(n, {
                        v: to, duration: 1.6, ease: 'power3.out',
                        onUpdate: function () { show(n.v); }
                    });
                }
            });
        });

        /* The globe is drawn when its band arrives */
        if (A.globe) {
            var gtl = gsap.timeline({ paused: true });
            A.globeIntro(gtl, 0);
            ScrollTrigger.create({ trigger: A.globeEl, start: 'top 80%', once: true, onEnter: function () { gtl.play(); } });
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

    window.HG_SITE = { heroTimeline: heroTimeline, intro: intro, scenes: scenes };
})();
