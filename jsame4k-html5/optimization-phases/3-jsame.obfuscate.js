(function() {
    var W = 20,
        H = 15,
        T = 26,
        S = 20,
        B = 4,
        C = [0x914e3b, 0x7b8376, 0x3d6287, 0xaf8652, 0x262c4b],
        F = 0.7,
        N = C.length - 1,
        l, t, z, V, X, E, v, R, M, A;

    function m(e) {
        var k = V.getBoundingClientRect();
        return {
            x: (e.clientX - k.left) * (V.width / k.width),
            y: (e.clientY - k.top) * (V.height / k.height)
        };
    }

    function s(x) {
        for (var i = 1; i < arguments.length; i++) {
            x = x.replace(/%s/, arguments[i]);
        }
        return x;
    }

    function Q(x) {
        var r = x >> 16;
        var g = x >> 8 & 0xff;
        var b = x & 0xff;
        return [r, g, b];
    }

    function h(x) {
        var y = x[0] << 16 | x[1] << 8 | x[2];
        return '#' + (function(e) {
            return new Array(7 - e.length).join('0') + e;
        })(y.toString(16));
    }

    function b(x) {
        var r = x[0];
        var g = x[1];
        var k = x[2];
        var i = Math.floor(1.0 / (1.0 - F));
        if (r == 0 && g == 0 && k == 0) {
            return [i, i, i];
        }
        if (r > 0 && r < i) {
            r = i;
        }
        if (g > 0 && g < i) {
            g = i;
        }
        if (k > 0 && k < i) {
            k = i;
        }
        return [
            Math.min(Math.floor(r / F), 0xff),
            Math.min(Math.floor(g / F), 0xff),
            Math.min(Math.floor(k / F), 0xff)
        ];
    }

    function d(x) {
        return [
            Math.floor(x[0] * F),
            Math.floor(x[1] * F),
            Math.floor(x[2] * F)
        ];
    }

    function u() {
        l = new Array(C.length * 2 - 1);
        for (var i = 0; i < C.length; i++) {
            l[i] = q(Q(C[i]), true);
            l[C.length * 2 - 2 - i] = q(Q(C[i]), false);
        }
    }

    function q(x, y) {
        var i = document.createElement('canvas');
        i.width = T;
        i.height = T;
        var e = i.getContext('2d');

        var j = y ? b(x) : x;
        var k = b(j);
        var c = d(j);

        e.fillStyle = h(c);
        e.fillRect(0, 0, T, T);

        e.fillStyle = h(j);
        e.fillRect(0, 0, T - 1, T - 1);

        e.fillStyle = h(k);
        e.fillRect(1, 1, T - 3, T - 3);

        var r = e.createLinearGradient(2, 2, T - 4, T - 4);
        r.addColorStop(0, h(j));
        r.addColorStop(1, h(k));
        e.fillStyle = r;
        e.fillRect(2, 2, T - 4, T - 4);

        if (y) {
            e.fillStyle = h(c);
            e.fillRect(8, 8, T - 16, T - 16);
        }

        return i;
    }

    function p() {
        X.fillStyle = '#262c4b';
        X.fillRect(
            0,
            0,
            W * T + B * 2,
            H * T + B * 2
        );
        X.fillStyle = '#484d50';
        X.fillRect(
            0,
            H * T + B * 2,
            W * T + B * 2,
            S
        );

        X.font = 'bold 12px sans-serif';
        z[1] = M > 1 ?
            s('Marked: %s (%s points)', M, P(M)) :
            (E ? '' : 'Game Over!');
        z[2] = s('Score: %s', R);
        for (var i = 0; i < z.length; i++) {
            X.fillStyle = '#62696a';
            X.fillRect(
                Math.floor((W * T + B * 2) / 3) * i + 1,
                H * T + B * 2 + 1,
                Math.floor((W * T + B * 2) / 3) - 2,
                S - 2
            );
            X.fillStyle = '#ffffff';
            X.fillText(
                z[i],
                Math.floor((W * T + B * 2) / 6) * (2 * i + 1) - Math.floor(X.measureText(z[i]).width / 2),
                H * T + B * 2 + Math.floor(S / 2) + 4
            );
        }
        for (var x = 0; x < W; x++) {
            for (var y = 0; y < H; y++) {
                X.drawImage(
                    l[t[W * y + x] + N],
                    x * T + B,
                    y * T + B
                );
            }
        }
    }

    function Z() {
        M = 0;
        R = 0;
        A = false;
        E = true;
        for (var i = 0; i < t.length; i++) {
            t[i] = Math.floor((Math.random() * N) + 1);
        }
    }

    function L(x, y) {
        if (x < 0 || y < 0 || x > W - 1 || y > H - 1) {
            return 0;
        }
        return t[W * y + x];
    }

    function I(x, y) {
        return L(x, y) < 0;
    }

    function G(x, y) {
        return L(x, y) == 0;
    }

    function Y(x, y) {
        return L(x, y) < 0 ? -1 * L(x, y) : L(x, y);
    }

    function P(x) {
        return x * x - 4 * x + 4;
    }

    function J(x, y) {
        return O(x, y, Y(x, y));
    }

    function O(x, y, c) {
        if (I(x, y) || c != Y(x, y) || G(x, y)) {
            return 0;
        }
        var r = 1;
        t[W * y + x] = -1 * Y(x, y);
        r += O(x - 1, y, Y(x, y));
        r += O(x, y - 1, Y(x, y));
        r += O(x + 1, y, Y(x, y));
        r += O(x, y + 1, Y(x, y));
        return r;
    }

    function K() {
        for (var i = 0; i < t.length; i++) {
            t[i] = t[i] < 0 ? -1 * t[i] : t[i];
        }
    }

    function w(x, y, j, k) {
        var c = W * y + x;
        var r = W * k + j;
        var e = t[c];
        t[c] = t[r];
        t[r] = e;
    }

    function D(e, k) {
        var r = m(e);
        var x = r.x < B ? -1 : Math.floor((r.x - B) / T);
        var y = r.y < B ? -1 : Math.floor((r.y - B) / T);
        if (((v.x != x || v.y != y) && !I(x, y)) || k) {
            if (G(x, y) && G(v.x, v.y)) {
                v.x = x;
                v.y = y;
                return;
            }
            K();
            M = J(x, y);
            p();
            v.x = x;
            v.y = y;
        }
    }

    function U(e, k) {
        var r = m(e);
        var x = r.x < B ? -1 : Math.floor((r.x - B) / T);
        var y = r.y < B ? -1 : Math.floor((r.y - B) / T);
        if (v.x != x || v.y != y || k) {
            K();
            M = 0;
            p();
            v.x = x;
            v.y = y;
        }
    }

    function init() {
        V = document.getElementById('jsame4k');
        if (V != null && !!V.getContext) {
            X = V.getContext('2d');
            u();
            t = new Array(W * H);
            v = { x : -1, y : -1 };
            z = [ 'New Game', '', '' ];
            Z();
            p();
            V.addEventListener('mousedown', function(e) {
                var c, r, i, j, k = m(e);
                if (k.x > 0 &&
                        k.x < Math.floor((W * T + B * 2) / 3) - 1 &&
                        k.y > H * T + B * 2 &&
                        k.y < H * T + B * 2 + S - 1) {
                    Z();
                    E = true;
                    M = 0;
                    p();
                }

                var x = k.x < B ? -1 : Math.floor((k.x - B) / T);
                var y = k.y < B ? -1 : Math.floor((k.y - B) / T);
                r = 0;
                for (i = 0; i < t.length; i++) {
                    if (t[i] < 0) {
                        r++;
                    }
                }
                if (r < 2) {
                    return;
                }
                for (i = 0; i < t.length; i++) {
                    if (t[i] < 0) {
                        t[i] = 0;
                    }
                }
                for (j = 0; j < W; j++) {
                    c = true;
                    while (c) {
                        c = false;
                        for (k = 1; k < H; k++) {
                            if (G(j, k) && !G(j, k - 1)) {
                                w(j, k, j, k - 1);
                                c = true;
                            }
                        }
                    }
                }
                c = true;
                while (c) {
                    c = false;
                    for (j = 1; j < W; j++) {
                        if (G(j - 1, H - 1) && !G(j, H - 1)) {
                            for (k = 0; k < H; k++) {
                                w(j, k, j - 1, k);
                            }
                            c = true;
                        }
                    }
                }
                R += P(r);
                c = true;
                r = 0;
                for (i = 0; i < W; i++) {
                    for (j = 0; j < H; j++) {
                        if (G(i, j)) {
                            continue;
                        }
                        r++;
                        k = Y(i, j);
                        if (Y(i - 1, j) == k ||
                            Y(i, j - 1) == k ||
                            Y(i + 1, j) == k ||
                            Y(i, j + 1) == k) {
                            c = false;
                            break;
                        }
                    }
                }
                if (r == 0 && !A) {
                    A = true;
                    R += 1000;
                }

                M = 0;
                if (!c) {
                    M = J(x, y);
                }

                if (c && E) {
                    E = false;
                    M = 0;
                }
                p();
            }, false);
            V.addEventListener('mouseup', function(e) { D(e, true); }, false);
            V.addEventListener('mousemove', function(e) { D(e, false); }, false);
            V.addEventListener('mouseover', function(e) { D(e, false); }, false);
            V.addEventListener('mouseout', function(e) { U(e, true); }, false);
        }
    }
    init();
})();
