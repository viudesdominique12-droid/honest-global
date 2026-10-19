/* Live line-engraving renderers (canvas): the cover globe and the group seal.
   Each exposes a mutable `state` and `request()` to redraw on the next frame. */
(function () {
    'use strict';

    var TAU = Math.PI * 2;
    var RAD = Math.PI / 180;
    var SKY = '#6B8CB5';
    var STEEL = '#3C5A7F';
    var PAPER = '#F5F0E6';

    function setupCanvas(canvas, draw) {
        var ctx = canvas.getContext && canvas.getContext('2d');
        if (!ctx) return null;
        var api = { ctx: ctx, size: 0, dpr: 1 };
        var queued = false;

        api.resize = function () {
            var w = canvas.clientWidth;
            if (!w) return;
            api.dpr = Math.min(window.devicePixelRatio || 1, 2);
            api.size = w;
            canvas.width = Math.round(w * api.dpr);
            canvas.height = Math.round(w * api.dpr);
            draw();
        };
        api.request = function () {
            if (queued) return;
            queued = true;
            requestAnimationFrame(function () { queued = false; draw(); });
        };
        if (window.ResizeObserver) new ResizeObserver(api.resize).observe(canvas);
        else window.addEventListener('resize', api.resize);
        return api;
    }

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    /* ------------------------------------------------------------ Globe */
    function globe(root) {
        var canvas = root.querySelector('canvas');
        var d3 = window.d3;
        if (!canvas || !d3 || !d3.geoOrthographic || !window.HG_LAND) return null;

        var land = window.HG_LAND;
        var sphere = { type: 'Sphere' };
        var graticule = d3.geoGraticule().step([15, 15])();
        var ADDIS = [38.74, 9.03];
        var DESTINATIONS = [[4.5, 51.9], [55.3, 25.2], [72.8, 19.0], [121.5, 31.2], [-74.0, 40.7]];
        var routeMode = root.getAttribute('data-routes') || 'out';
        var routes = DESTINATIONS.map(function (d) {
            return routeMode === 'in' ? { from: d, at: d3.geoInterpolate(d, ADDIS) } : { from: ADDIS, at: d3.geoInterpolate(ADDIS, d) };
        });
        var LABELS = [
            ['Africa', [21, 3]],
            ['Europe', [17, 51]],
            ['Asia', [95, 47]],
            ['Middle East', [46, 27]],
            ['North America', [-100, 45]],
            ['South America', [-60, -14]],
            ['Oceania', [134, -25]]
        ];

        var state = {
            lon: parseFloat(root.getAttribute('data-lon') || '30'),
            lat: parseFloat(root.getAttribute('data-lat') || '16'),
            spin: 0, alpha: 1, routes: routeMode === 'none' ? 0 : 1, marker: 1
        };
        var projection = d3.geoOrthographic().clipAngle(90).precision(0.4);
        var path;
        var c = setupCanvas(canvas, draw);
        if (!c) return null;
        path = d3.geoPath(projection, c.ctx);
        root.classList.add('is-live');

        function draw() {
            if (!c.size || !path) return;
            var ctx = c.ctx, size = c.size;
            var s = size / 600, R = 250 * s, C = 300 * s;
            var center = [state.lon + state.spin, state.lat];
            projection.scale(R).translate([C, C]).rotate([-center[0], -center[1]]);

            ctx.setTransform(c.dpr, 0, 0, c.dpr, 0, 0);
            ctx.clearRect(0, 0, size, size);
            ctx.globalAlpha = state.alpha;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            ctx.beginPath();
            path(sphere);
            ctx.fillStyle = 'rgba(107, 140, 181, 0.04)';
            ctx.fill();

            ctx.beginPath();
            path(graticule);
            ctx.strokeStyle = STEEL;
            ctx.lineWidth = 0.55;
            ctx.stroke();

            /* Land: solid ground, engraved hatching, then the coastline */
            ctx.save();
            ctx.beginPath();
            path(land);
            ctx.fillStyle = '#0E1626';
            ctx.fill();
            ctx.clip();
            ctx.beginPath();
            for (var y = C - R; y <= C + R; y += 2.6) {
                ctx.moveTo(C - R, y);
                ctx.lineTo(C + R, y);
            }
            ctx.strokeStyle = 'rgba(107, 140, 181, 0.42)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.restore();

            ctx.beginPath();
            path(land);
            ctx.strokeStyle = 'rgba(245, 240, 230, 0.66)';
            ctx.lineWidth = 0.7;
            ctx.stroke();

            /* Sphere outline and graduated bezel, which turns with the globe */
            ctx.beginPath();
            path(sphere);
            ctx.strokeStyle = 'rgba(107, 140, 181, 0.85)';
            ctx.lineWidth = 1;
            ctx.stroke();

            var r1 = R + 14 * s, r2 = R + 22 * s;
            ctx.beginPath();
            ctx.arc(C, C, r1, 0, TAU);
            ctx.moveTo(C + r2, C);
            ctx.arc(C, C, r2, 0, TAU);
            var turn = center[0] * RAD;
            for (var deg = 0; deg < 360; deg += 2) {
                var a = deg * RAD - Math.PI / 2 + turn;
                var len = (deg % 30 === 0 ? 8 : deg % 10 === 0 ? 4.5 : 2.5) * s;
                ctx.moveTo(C + r1 * Math.cos(a), C + r1 * Math.sin(a));
                ctx.lineTo(C + (r1 + len) * Math.cos(a), C + (r1 + len) * Math.sin(a));
            }
            ctx.strokeStyle = STEEL;
            ctx.lineWidth = 0.7;
            ctx.stroke();

            /* Routes from Addis Ababa */
            if (state.routes > 0 && routeMode !== 'none') {
                ctx.beginPath();
                routes.forEach(function (r) {
                    path({ type: 'LineString', coordinates: [r.from, r.at(state.routes)] });
                });
                ctx.strokeStyle = SKY;
                ctx.lineWidth = 1;
                ctx.stroke();
                if (state.routes >= 1) {
                    ctx.beginPath();
                    path.pointRadius(2 * Math.max(s, 0.6));
                    path({ type: 'MultiPoint', coordinates: DESTINATIONS });
                    ctx.fillStyle = SKY;
                    ctx.fill();
                }
            }

            /* Continent names, fading out towards the horizon */
            var fontPx = Math.max(8, 9.5 * Math.max(s, 0.85));
            ctx.font = '500 ' + fontPx.toFixed(1) + 'px "Inter Tight", Helvetica, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if ('letterSpacing' in ctx) ctx.letterSpacing = (fontPx * 0.2).toFixed(1) + 'px';
            LABELS.forEach(function (l) {
                var dist = d3.geoDistance(l[1], center);
                if (dist > 1.3) return;
                var fade = dist < 0.95 ? 1 : 1 - (dist - 0.95) / 0.35;
                var p = projection(l[1]);
                ctx.globalAlpha = state.alpha * fade * 0.85;
                ctx.fillStyle = PAPER;
                ctx.fillText(l[0].toUpperCase(), p[0], p[1]);
            });
            if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
            ctx.globalAlpha = state.alpha;

            /* Addis Ababa */
            if (state.marker > 0 && d3.geoDistance(ADDIS, center) < Math.PI / 2 - 0.05) {
                var m = projection(ADDIS);
                ctx.globalAlpha = state.alpha * state.marker;
                ctx.beginPath();
                ctx.arc(m[0], m[1], 9 * Math.max(s, 0.7) * (0.4 + 0.6 * state.marker), 0, TAU);
                ctx.strokeStyle = SKY;
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(m[0], m[1], 3 * Math.max(s, 0.7), 0, TAU);
                ctx.fillStyle = PAPER;
                ctx.fill();
                ctx.font = 'italic 400 ' + Math.max(11, 13 * s).toFixed(1) + 'px "Playfair Display", Georgia, serif';
                ctx.textAlign = 'left';
                ctx.fillText('Addis Ababa', m[0] + 14 * Math.max(s, 0.7), m[1] + 1);
            }
            ctx.globalAlpha = 1;
        }

        /* Drag to turn, with inertia; arrow keys when focused */
        var view = { state: state, request: c.request, resize: c.resize, onInteract: null };
        var drag = null, vLon = 0, vLat = 0, spinRaf = 0;
        function perPixel() { return 57.3 / (250 * c.size / 600); }
        function stopInertia() { cancelAnimationFrame(spinRaf); vLon = vLat = 0; }
        function inertia() {
            vLon *= 0.94;
            vLat *= 0.9;
            if (Math.abs(vLon) < 0.01 && Math.abs(vLat) < 0.01) return;
            state.lon -= vLon;
            state.lat = clamp(state.lat + vLat, -70, 70);
            draw();
            spinRaf = requestAnimationFrame(inertia);
        }
        canvas.addEventListener('pointerdown', function (e) {
            stopInertia();
            drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
            canvas.setPointerCapture(e.pointerId);
            root.classList.add('is-dragging');
            if (view.onInteract) view.onInteract();
        });
        canvas.addEventListener('pointermove', function (e) {
            if (!drag || e.pointerId !== drag.id) return;
            var k = perPixel();
            var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
            drag.x = e.clientX;
            drag.y = e.clientY;
            vLon = dx * k;
            vLat = dy * k;
            state.lon -= vLon;
            state.lat = clamp(state.lat + vLat, -70, 70);
            c.request();
        });
        function release() {
            if (!drag) return;
            drag = null;
            root.classList.remove('is-dragging');
            spinRaf = requestAnimationFrame(inertia);
        }
        canvas.addEventListener('pointerup', release);
        canvas.addEventListener('pointercancel', release);

        root.addEventListener('keydown', function (e) {
            var step = { ArrowLeft: [-15, 0], ArrowRight: [15, 0], ArrowUp: [0, 10], ArrowDown: [0, -10] }[e.key];
            if (!step) return;
            e.preventDefault();
            stopInertia();
            if (view.onInteract) view.onInteract();
            var from = [state.lon, state.lat], to = [state.lon + step[0], clamp(state.lat + step[1], -70, 70)];
            var t0 = performance.now();
            (function tick(now) {
                var t = Math.min(1, (now - t0) / 600), k = 1 - Math.pow(1 - t, 3);
                state.lon = from[0] + (to[0] - from[0]) * k;
                state.lat = from[1] + (to[1] - from[1]) * k;
                draw();
                if (t < 1) spinRaf = requestAnimationFrame(tick);
            })(t0);
        });

        c.resize();
        return view;
    }

    /* ------------------------------------------------------------ Seal */
    function seal(root) {
        var canvas = root.querySelector('canvas');
        if (!canvas) return null;

        var bands = [
            { R: 128, a: 5, k: 40, copies: 6, n: 720 },
            { R: 101, a: 9, k: 24, copies: 8, n: 540 },
            { R: 56, a: 24, k: 14, copies: 9, n: 540 }
        ];
        bands.forEach(function (b) {
            b.step = TAU / (b.k * b.copies);
            b.r = new Float32Array(b.n);
            b.t = new Float32Array(b.n);
            for (var i = 0; i < b.n; i++) {
                var t = TAU * i / b.n;
                b.t[i] = t;
                b.r[i] = b.R + b.a * Math.sin(b.k * t);
            }
        });
        var rings = [150, 146, 137, 117, 86, 28];
        var state = { r0: 0, r1: 0, r2: 0, alpha: 1 };
        var color = root.getAttribute('data-color') || STEEL;

        var c = setupCanvas(canvas, draw);
        if (!c) return null;
        root.classList.add('is-live');

        function draw() {
            if (!c.size) return;
            var ctx = c.ctx, size = c.size, s = size / 312, C = size / 2;
            ctx.setTransform(c.dpr, 0, 0, c.dpr, 0, 0);
            ctx.clearRect(0, 0, size, size);
            ctx.globalAlpha = state.alpha;
            ctx.strokeStyle = color;

            ctx.lineWidth = 0.5;
            var rot = [state.r0, state.r1, state.r2];
            bands.forEach(function (b, bi) {
                ctx.beginPath();
                for (var k = 0; k < b.copies; k++) {
                    var off = rot[bi] + k * b.step;
                    for (var i = 0; i < b.n; i++) {
                        var t = b.t[i] + off, r = b.r[i] * s;
                        var x = C + r * Math.cos(t), y = C + r * Math.sin(t);
                        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                }
                ctx.stroke();
            });

            ctx.lineWidth = 0.9;
            ctx.beginPath();
            rings.forEach(function (r) {
                ctx.moveTo(C + r * s, C);
                ctx.arc(C, C, r * s, 0, TAU);
            });
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(C, C, 2.2 * s, 0, TAU);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        var view = { state: state, request: c.request, resize: c.resize };
        c.resize();
        return view;
    }

    window.HGEngraving = { globe: globe, seal: seal };
})();
