/**
 * The drawing half of the live wallpapers: the code that actually paints a
 * frame. Split out from `wallpapers.js` on purpose — that file is the catalogue
 * and rides in the entry bundle, while this one is a few hundred lines of
 * canvas work imported only by `LiveWallpaper`. So it ships in that lazy chunk,
 * and a visitor who never leaves the still photo never downloads it.
 *
 * A scene is four things and nothing else:
 *
 *   backdrop       the flat CSS gradient painted under the canvas. Every scene
 *                  has one and they cross-fade, so switching wallpapers is a
 *                  dissolve rather than a cut to black while frame one is drawn.
 *   init(w, h, q)  the scene's own mutable state. `q` is a quality factor
 *                  (0.5 on a phone), so particle counts scale with the device
 *                  rather than with the design's desktop assumption.
 *   draw(s, c)     one frame. `c` carries the context, size, time, delta, the
 *                  smoothed pointer, whether it is over free desktop (`hot`),
 *                  the motion multiplier and an idle ramp.
 *   click(s, x, y) the pointer went down on empty desktop.
 *
 * All of a scene's mutable state lives in the object `init` returns, so
 * switching scenes is just calling `init` again — there is no shared canvas
 * state to reset, and no way for one scene to leave something behind in another.
 *
 * Ported from the "Live Wallpaper" Claude Design document. The ambient audio
 * that goes with each scene is in `wallpaperVoices.js`, keyed by the same id.
 */

const rand = (a, b) => a + Math.random() * (b - a)

/** Exponential approach — `k` of the way from `v` to `t` each frame. */
export const ease = (v, t, k) => v + (t - v) * k

/** Scale a design-time particle count by the quality factor, never below 1. */
const count = (n, q) => Math.max(1, Math.round(n * q))

const SCENES = [
    {
        id: 'dusk',
        backdrop: 'linear-gradient(168deg,#1d1a26 0%,#33232c 42%,#54322e 76%,#7a4a30 100%)',
        init(w, h, q) {
            return {
                motes: Array.from({ length: count(80, q) }, () => ({
                    x: Math.random(), y: Math.random(), r: rand(0.6, 2.4),
                    vx: rand(-0.06, 0.06), vy: rand(-0.09, -0.03),
                    a: rand(0.2, 0.7), ph: rand(0.4, 2), off: rand(0, 100), px: 0, py: 0,
                })),
                pools: Array.from({ length: 4 }, (_, i) => ({
                    x: rand(0.2, 0.8), y: rand(0.25, 0.8), r: rand(0.28, 0.54),
                    sx: rand(-0.03, 0.03), sy: rand(-0.02, 0.02), a: 0.085 + i * 0.015, d: 0.3 + i * 0.22,
                })),
            }
        },
        draw(s, c) {
            const { ctx, w, h, t, dt, mx, my, hot, motion, idle } = c
            const warm = [255, 190, 146]
            const pool = [235, 132, 86]

            // Additive, so overlapping motes brighten rather than paint over.
            ctx.globalCompositeOperation = 'lighter'
            for (const p of s.pools) {
                p.x += p.sx * dt * 0.001 * motion
                p.y += p.sy * dt * 0.001 * motion
                if (p.x < -0.2) p.x = 1.2
                if (p.x > 1.2) p.x = -0.2
                if (p.y < -0.2) p.y = 1.2
                if (p.y > 1.2) p.y = -0.2

                const par = 26 * p.d * motion
                const cx = p.x * w + (mx / w - 0.5) * -par
                const cy = p.y * h + (my / h - 0.5) * -par
                const rad = p.r * Math.min(w, h) * (1 + Math.sin(t / 5200 + p.d * 4) * 0.07)
                const a = p.a * (1 - idle * 0.25)
                const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad)
                g.addColorStop(0, `rgba(${pool},${a})`)
                g.addColorStop(0.55, `rgba(${pool},${a * 0.28})`)
                g.addColorStop(1, 'rgba(0,0,0,0)')
                ctx.fillStyle = g
                ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 7); ctx.fill()
            }

            const R = Math.min(w, h) * 0.19
            for (const m of s.motes) {
                m.x += m.vx * dt * 0.0006 * motion
                m.y += m.vy * dt * 0.0006 * motion
                if (m.y < -0.05) { m.y = 1.05; m.x = Math.random() }
                if (m.x < -0.05) m.x = 1.05
                if (m.x > 1.05) m.x = -0.05

                let x = m.x * w + Math.sin(t / 2600 + m.off) * 9 * motion
                let y = m.y * h
                // Pushed out of the cursor's way, then let go slack again.
                if (hot) {
                    const dx = x - mx, dy = y - my, d = Math.hypot(dx, dy)
                    if (d < R && d > 0.01) {
                        const f = (1 - d / R) ** 2 * 26 * motion
                        m.px = ease(m.px, dx / d * f, 0.12)
                        m.py = ease(m.py, dy / d * f, 0.12)
                    } else { m.px *= 0.94; m.py *= 0.94 }
                } else { m.px *= 0.94; m.py *= 0.94 }
                x += m.px; y += m.py

                const near = hot ? Math.max(0, 1 - Math.hypot(x - mx, y - my) / (R * 1.5)) : 0
                const a = m.a * (0.55 + 0.45 * Math.sin(t / 900 * m.ph + m.off)) * (1 - idle * 0.3) * (1 + near * 1.5)
                ctx.fillStyle = `rgba(${warm},${Math.min(0.95, a)})`
                ctx.beginPath(); ctx.arc(x, y, m.r * (1 + near * 0.7), 0, 7); ctx.fill()
            }
            ctx.globalCompositeOperation = 'source-over'
        },
        click(s) {
            for (const m of s.motes) { m.px += rand(-40, 40); m.py += rand(-40, 40) }
        },
    },

    {
        id: 'rain',
        backdrop: 'linear-gradient(180deg,#0a1018 0%,#101c26 55%,#16242e 100%)',
        init(w, h, q) {
            return {
                beads: Array.from({ length: count(170, q) }, () => ({
                    x: Math.random(), y: Math.random(), r: rand(1, 3.4), v: 0, hold: rand(0, 1),
                })),
                streaks: Array.from({ length: count(16, q) }, () => ({
                    x: Math.random(), y: Math.random(), r: rand(3, 6.5), v: rand(0.1, 0.3), trail: rand(30, 130),
                })),
                flash: 0,
            }
        },
        draw(s, c) {
            const { ctx, w, h, dt, mx, my, hot, motion } = c
            const k = dt * 0.06 * motion

            ctx.fillStyle = 'rgba(198,224,255,.42)'
            for (const b of s.beads) {
                b.hold -= dt * 0.00018
                if (b.hold < 0) {
                    b.v += 0.0006 * k
                    b.y += b.v * k
                    if (b.y > 1.03) { b.y = -0.03; b.x = Math.random(); b.v = 0; b.hold = rand(0.4, 3) }
                }
                // Wiped away by the cursor, the way a finger clears condensation.
                if (hot && Math.hypot(b.x * w - mx, b.y * h - my) < 74) {
                    b.y = -0.03; b.x = Math.random(); b.v = 0; b.hold = rand(1, 4)
                    continue
                }
                ctx.beginPath(); ctx.arc(b.x * w, b.y * h, b.r, 0, 7); ctx.fill()
                ctx.fillStyle = 'rgba(255,255,255,.30)'
                ctx.beginPath(); ctx.arc(b.x * w - b.r * 0.3, b.y * h - b.r * 0.35, b.r * 0.35, 0, 7); ctx.fill()
                ctx.fillStyle = 'rgba(198,224,255,.42)'
            }

            for (const st of s.streaks) {
                st.y += st.v * k * 0.06
                if (st.y > 1.06) { st.y = -0.06; st.x = Math.random() }
                if (hot && Math.hypot(st.x * w - mx, st.y * h - my) < 74) { st.y = -0.06; st.x = Math.random(); continue }
                const x = st.x * w, y = st.y * h
                const g = ctx.createLinearGradient(x, y - st.trail, x, y)
                g.addColorStop(0, 'rgba(190,220,255,0)')
                g.addColorStop(1, 'rgba(190,220,255,.26)')
                ctx.strokeStyle = g; ctx.lineWidth = st.r * 0.8; ctx.lineCap = 'round'
                ctx.beginPath(); ctx.moveTo(x, y - st.trail); ctx.lineTo(x, y); ctx.stroke()
                ctx.fillStyle = 'rgba(214,236,255,.6)'
                ctx.beginPath(); ctx.arc(x, y, st.r, 0, 7); ctx.fill()
            }

            if (s.flash > 0) {
                s.flash -= dt * 0.0022
                ctx.fillStyle = `rgba(200,222,255,${Math.max(0, s.flash) * 0.3})`
                ctx.fillRect(0, 0, w, h)
            }
        },
        click(s) { s.flash = 1 },
    },

    {
        id: 'ride',
        backdrop: 'linear-gradient(180deg,#120f1c 0%,#1d1830 38%,#33203a 66%,#4a2b3a 100%)',
        init() {
            return {
                d: 0,
                boost: 0,
                bands: [
                    { a: 30, f: 1.7, o: 0, y: 0.70, c: '#1b1526' },
                    { a: 22, f: 2.9, o: 2, y: 0.76, c: '#140f1d' },
                    { a: 14, f: 4.3, o: 4, y: 0.81, c: '#0d0a14' },
                ],
            }
        },
        draw(s, c) {
            const { ctx, w, h, t, dt, mx, my, hot, motion } = c
            const throttle = (hot ? 0.35 + (mx / w) * 1.5 : 0.8) + s.boost
            s.boost *= 0.97
            s.d += dt * throttle * 0.35 * motion
            const tilt = hot ? (my / h - 0.5) * 34 : 0

            const mnx = w * 0.78, mny = h * 0.2 + tilt * 0.3
            const mg = ctx.createRadialGradient(mnx, mny, 0, mnx, mny, 130)
            mg.addColorStop(0, 'rgba(255,236,214,.24)')
            mg.addColorStop(1, 'rgba(255,236,214,0)')
            ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mnx, mny, 130, 0, 7); ctx.fill()
            ctx.fillStyle = 'rgba(255,242,224,.82)'
            ctx.beginPath(); ctx.arc(mnx, mny, 26, 0, 7); ctx.fill()
            // A second disc in the backdrop's colour, offset — the crescent.
            ctx.fillStyle = 'rgba(74,43,58,.55)'
            ctx.beginPath(); ctx.arc(mnx - 9, mny - 5, 24, 0, 7); ctx.fill()

            for (const b of s.bands) {
                const base = h * b.y + tilt
                ctx.fillStyle = b.c
                ctx.beginPath(); ctx.moveTo(0, h)
                for (let x = 0; x <= w; x += 12) {
                    const u = x / w * b.f + s.d * 0.0016 * (1 + b.o * 0.5) + b.o
                    ctx.lineTo(x, base - (Math.sin(u * 3.1) * b.a + Math.sin(u * 7.3) * b.a * 0.35))
                }
                ctx.lineTo(w, h); ctx.closePath(); ctx.fill()
            }

            const roadY = h * 0.845 + tilt
            ctx.fillStyle = '#08060c'; ctx.fillRect(0, roadY, w, h - roadY)
            ctx.strokeStyle = 'rgba(255,226,190,.3)'; ctx.lineWidth = 2.5
            ctx.setLineDash([34, 30]); ctx.lineDashOffset = -s.d * 0.9
            ctx.beginPath()
            ctx.moveTo(0, roadY + (h - roadY) * 0.55)
            ctx.lineTo(w, roadY + (h - roadY) * 0.55)
            ctx.stroke()
            ctx.setLineDash([])

            const bx = w * 0.34
            const by = roadY - 2 + Math.sin(t / 190) * 1.2 * throttle
            const sc = Math.min(1.5, Math.max(0.85, w / 1100))
            const cg = ctx.createLinearGradient(bx, by, bx + 380 * sc, by - 30)
            cg.addColorStop(0, 'rgba(255,232,196,.30)')
            cg.addColorStop(1, 'rgba(255,232,196,0)')
            ctx.fillStyle = cg
            ctx.beginPath()
            ctx.moveTo(bx + 34 * sc, by - 30 * sc)
            ctx.lineTo(bx + 380 * sc, by - 78 * sc)
            ctx.lineTo(bx + 380 * sc, by + 14 * sc)
            ctx.closePath(); ctx.fill()
            this.bike(ctx, bx, by, sc)
        },
        /** The rider, in silhouette — stroked at the origin, then transformed. */
        bike(ctx, x, y, k) {
            ctx.save(); ctx.translate(x, y); ctx.scale(k, k)
            ctx.strokeStyle = '#07050a'; ctx.fillStyle = '#07050a'
            ctx.lineWidth = 3.2; ctx.lineCap = 'round'
            ctx.beginPath(); ctx.arc(-30, -13, 13, 0, 7); ctx.stroke()
            ctx.beginPath(); ctx.arc(28, -13, 13, 0, 7); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(-30, -13); ctx.lineTo(-6, -30); ctx.lineTo(20, -28); ctx.lineTo(28, -13); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(-6, -30); ctx.lineTo(2, -44); ctx.lineTo(18, -44); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(-30, -13); ctx.lineTo(-22, -34); ctx.lineTo(-4, -36); ctx.stroke()
            ctx.beginPath(); ctx.ellipse(6, -34, 13, 5, -0.08, 0, 7); ctx.fill()
            ctx.lineWidth = 4.4
            ctx.beginPath(); ctx.moveTo(2, -38); ctx.lineTo(-2, -58); ctx.lineTo(10, -62); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(-2, -58); ctx.lineTo(14, -50); ctx.stroke()
            ctx.beginPath(); ctx.arc(15, -68, 8, 0, 7); ctx.fill()
            ctx.restore()
        },
        click(s) { s.boost = 1.1 },
    },

    {
        id: 'drive',
        backdrop: 'linear-gradient(180deg,#241531 0%,#4a2440 40%,#8a3d43 66%,#c96a45 84%,#e29a58 100%)',
        init() {
            return { z: 0, steer: 0, brake: 0, dashes: Array.from({ length: 16 }, (_, i) => i / 16) }
        },
        draw(s, c) {
            const { ctx, w, h, t, dt, mx, my, hot, motion } = c
            s.steer = ease(s.steer, hot ? (mx / w - 0.5) * 2 : 0, 0.05)
            s.z += dt * 0.00035 * motion
            const hz = h * 0.58
            const cx = w * 0.5 + s.steer * w * 0.1

            const sy = hz - 4 - (hot ? (my / h - 0.5) * 40 : 0)
            const sr = Math.min(w, h) * 0.21
            ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, hz); ctx.clip()
            const sg = ctx.createLinearGradient(0, sy - sr, 0, sy + sr)
            sg.addColorStop(0, 'rgba(255,214,120,.95)')
            sg.addColorStop(1, 'rgba(240,110,90,.95)')
            ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(cx, sy, sr, 0, 7); ctx.fill()
            // Widening bands cut out of the sun — the retro sunset.
            ctx.fillStyle = 'rgba(36,21,49,.55)'
            for (let i = 0; i < 9; i++) {
                const yy = sy - sr * 0.05 + i * (sr * 0.19)
                ctx.fillRect(cx - sr * 1.1, yy, sr * 2.2, 2 + i * 1.7)
            }
            ctx.restore()

            ctx.fillStyle = 'rgba(10,7,14,.9)'
            ctx.beginPath(); ctx.moveTo(0, hz)
            for (let x = 0; x <= w; x += 16) {
                ctx.lineTo(x, hz - Math.max(0, Math.sin(x / w * 5.2 + 1.4) * 26 + Math.sin(x / w * 11) * 9))
            }
            ctx.lineTo(w, hz); ctx.closePath(); ctx.fill()

            ctx.fillStyle = '#0a0810'
            ctx.beginPath()
            ctx.moveTo(cx - 26, hz); ctx.lineTo(cx + 26, hz)
            ctx.lineTo(w * 0.5 + w * 0.82, h); ctx.lineTo(w * 0.5 - w * 0.82, h)
            ctx.closePath(); ctx.fill()
            ctx.strokeStyle = 'rgba(255,196,132,.5)'; ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(cx - 26, hz); ctx.lineTo(w * 0.5 - w * 0.82, h)
            ctx.moveTo(cx + 26, hz); ctx.lineTo(w * 0.5 + w * 0.82, h)
            ctx.stroke()

            // Cubed progress fakes perspective: dashes crawl at the horizon and
            // tear past at the bottom of the frame.
            for (let i = 0; i < s.dashes.length; i++) {
                const p = (s.dashes[i] + s.z) % 1
                const z = p * p * p
                const y = hz + (h - hz) * z
                const ww = 2 + z * 26
                const xx = cx + (w * 0.5 - cx) * z
                ctx.fillStyle = `rgba(255,226,180,${0.18 + z * 0.55})`
                ctx.fillRect(xx - ww / 2, y, ww, 3 + z * 20)
            }

            const car = h * 0.80
            const k = Math.min(1.5, w / 900) * 1.1
            this.car(ctx, w * 0.5 - s.steer * 26, car + Math.sin(t / 260) * 1.4, k, Math.max(0, s.brake))
            s.brake -= dt * 0.0016
        },
        car(ctx, x, y, k, brake) {
            ctx.save(); ctx.translate(x, y); ctx.scale(k, k)
            ctx.fillStyle = 'rgba(0,0,0,.45)'
            ctx.beginPath(); ctx.ellipse(0, 26, 66, 8, 0, 0, 7); ctx.fill()
            ctx.fillStyle = '#0b0810'
            ctx.beginPath(); ctx.moveTo(-40, -22); ctx.lineTo(-26, -44); ctx.lineTo(26, -44); ctx.lineTo(40, -22); ctx.closePath(); ctx.fill()
            ctx.fillStyle = 'rgba(255,206,150,.16)'
            ctx.beginPath(); ctx.moveTo(-31, -25); ctx.lineTo(-22, -40); ctx.lineTo(22, -40); ctx.lineTo(31, -25); ctx.closePath(); ctx.fill()
            ctx.fillStyle = '#0b0810'
            ctx.beginPath(); ctx.roundRect(-56, -24, 112, 42, 8); ctx.fill()
            ctx.fillRect(-58, 12, 16, 12); ctx.fillRect(42, 12, 16, 12)
            const a = 0.55 + brake * 0.45
            ctx.shadowColor = `rgba(255,60,40,${a})`
            ctx.shadowBlur = 10 + brake * 26
            ctx.fillStyle = `rgba(255,${70 - brake * 40},50,${a})`
            ctx.beginPath(); ctx.roundRect(-48, -12, 22, 8, 3); ctx.fill()
            ctx.beginPath(); ctx.roundRect(26, -12, 22, 8, 3); ctx.fill()
            ctx.shadowBlur = 0
            ctx.restore()
        },
        click(s) { s.brake = 1 },
    },

    {
        id: 'desk',
        backdrop: 'linear-gradient(160deg,#171208 0%,#241a10 45%,#2e2015 72%,#191108 100%)',
        init(w, h, q) {
            return {
                steam: Array.from({ length: count(26, q) }, () => ({ t: Math.random(), x: rand(-3, 3), s: rand(0.4, 1) })),
                warm: 1,
                target: 1,
            }
        },
        draw(s, c) {
            const { ctx, w, h, t, dt, mx, my, hot, motion } = c
            s.warm = ease(s.warm, s.target, 0.04)
            const lx = hot ? mx : w * 0.68
            const ly = hot ? my : h * 0.34
            const hue = s.warm > 0.5 ? [255, 198, 120] : [186, 214, 240]

            const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.min(w, h) * 0.62)
            g.addColorStop(0, `rgba(${hue},.20)`)
            g.addColorStop(0.4, `rgba(${hue},.07)`)
            g.addColorStop(1, 'rgba(0,0,0,0)')
            ctx.fillStyle = g
            ctx.beginPath(); ctx.arc(lx, ly, Math.min(w, h) * 0.62, 0, 7); ctx.fill()

            const wx = w * 0.12, wy = h * 0.16, ww = w * 0.2, wh = h * 0.3
            ctx.fillStyle = 'rgba(120,150,190,.07)'; ctx.fillRect(wx, wy, ww, wh)
            ctx.strokeStyle = 'rgba(255,222,180,.14)'; ctx.lineWidth = 2
            ctx.strokeRect(wx, wy, ww, wh)
            ctx.beginPath()
            ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh)
            ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2)
            ctx.stroke()

            const dy = h * 0.78
            ctx.fillStyle = '#0e0a06'; ctx.fillRect(0, dy, w, h - dy)
            ctx.fillStyle = `rgba(${hue},.10)`; ctx.fillRect(0, dy, w, 2)

            const px = w * 0.30
            const k = Math.min(1.5, w / 950) * 1.25
            ctx.save(); ctx.translate(px, dy); ctx.scale(k, k)
            ctx.fillStyle = '#0a0704'
            ctx.beginPath(); ctx.arc(0, -74, 17, 0, 7); ctx.fill()
            ctx.beginPath()
            ctx.moveTo(-34, 0); ctx.quadraticCurveTo(-30, -50, 0, -58)
            ctx.quadraticCurveTo(30, -50, 34, 0); ctx.closePath(); ctx.fill()
            ctx.strokeStyle = '#0a0704'; ctx.lineWidth = 9; ctx.lineCap = 'round'
            ctx.beginPath(); ctx.moveTo(26, -38); ctx.quadraticCurveTo(46, -26, 52, -8); ctx.stroke()
            ctx.restore()

            const mgx = px + 74 * k, mgy = dy - 2
            ctx.fillStyle = '#0a0704'
            ctx.beginPath(); ctx.roundRect(mgx - 11 * k, mgy - 22 * k, 22 * k, 22 * k, 3 * k); ctx.fill()
            ctx.beginPath(); ctx.arc(mgx + 15 * k, mgy - 12 * k, 7 * k, -1.2, 1.2)
            ctx.lineWidth = 3 * k; ctx.strokeStyle = '#0a0704'; ctx.stroke()
            for (const p of s.steam) {
                p.t += dt * 0.00019 * p.s * motion
                if (p.t > 1) p.t -= 1
                const yy = mgy - 24 * k - p.t * 90 * k
                const xx = mgx + p.x * k + Math.sin(p.t * 7 + p.s * 9) * 9 * k
                ctx.fillStyle = `rgba(${hue},${(1 - p.t) * 0.13})`
                ctx.beginPath(); ctx.arc(xx, yy, (2 + p.t * 9) * k, 0, 7); ctx.fill()
            }
            ctx.fillStyle = `rgba(${hue},${0.5 + Math.sin(t / 1400) * 0.06})`
            ctx.beginPath(); ctx.arc(lx, ly, 3.5, 0, 7); ctx.fill()
        },
        click(s) { s.target = s.target > 0.5 ? 0 : 1 },
    },

    {
        id: 'stars',
        backdrop: 'linear-gradient(180deg,#05070f 0%,#080d18 52%,#0d1422 100%)',
        init(w, h, q) {
            return {
                stars: Array.from({ length: count(150, q) }, () => ({
                    x: Math.random(), y: Math.random(), r: rand(0.5, 1.9),
                    a: rand(0.25, 0.95), ph: rand(0.3, 1.7), off: rand(0, 100),
                })),
                pinned: [],
                near: [],
            }
        },
        draw(s, c) {
            const { ctx, w, h, t, mx, my, hot } = c
            for (const st of s.stars) {
                const a = st.a * (0.5 + 0.5 * Math.sin(t / 1100 * st.ph + st.off))
                ctx.fillStyle = `rgba(226,238,255,${a})`
                ctx.beginPath(); ctx.arc(st.x * w, st.y * h, st.r, 0, 7); ctx.fill()
            }

            ctx.lineWidth = 1
            for (const seg of s.pinned) {
                ctx.strokeStyle = 'rgba(180,208,255,.34)'
                ctx.beginPath(); ctx.moveTo(seg[0] * w, seg[1] * h); ctx.lineTo(seg[2] * w, seg[3] * h); ctx.stroke()
            }

            if (!hot) { s.near = []; return }
            const R = Math.min(w, h) * 0.24
            const near = s.stars
                .filter(st => Math.hypot(st.x * w - mx, st.y * h - my) < R)
                .sort((a, b) => Math.hypot(a.x * w - mx, a.y * h - my) - Math.hypot(b.x * w - mx, b.y * h - my))
                .slice(0, 7)
            s.near = near
            for (const a of near) {
                const d = Math.hypot(a.x * w - mx, a.y * h - my)
                ctx.strokeStyle = `rgba(190,216,255,${(1 - d / R) * 0.5})`
                ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(a.x * w, a.y * h); ctx.stroke()
                ctx.fillStyle = `rgba(255,255,255,${(1 - d / R) * 0.9})`
                ctx.beginPath(); ctx.arc(a.x * w, a.y * h, a.r + 1.4, 0, 7); ctx.fill()
            }
        },
        click(s) {
            const n = s.near || []
            for (let i = 0; i < n.length - 1; i++) s.pinned.push([n[i].x, n[i].y, n[i + 1].x, n[i + 1].y])
            // Bounded, or a long session draws an ever-growing pile of segments.
            if (s.pinned.length > 90) s.pinned.splice(0, s.pinned.length - 90)
        },
    },

    {
        id: 'ink',
        backdrop: 'linear-gradient(150deg,#14161a 0%,#1b1e22 50%,#232629 100%)',
        init() { return { rings: [], trail: [] } },
        draw(s, c) {
            const { ctx, w, h, dt, mx, my, hot, down, motion } = c

            if (hot && down) s.trail.push({ x: mx, y: my, a: 1, r: rand(7, 16) })
            if (s.trail.length > 300) s.trail.splice(0, s.trail.length - 300)
            for (let i = s.trail.length - 1; i >= 0; i--) {
                const p = s.trail[i]
                p.a -= dt * 0.00042
                if (p.a <= 0) { s.trail.splice(i, 1); continue }
                ctx.fillStyle = `rgba(226,234,242,${p.a * 0.18})`
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + (1 - p.a) * 0.5), 0, 7); ctx.fill()
            }

            for (let i = s.rings.length - 1; i >= 0; i--) {
                const r = s.rings[i]
                r.t += dt * 0.00035 * motion
                if (r.t >= 1) { s.rings.splice(i, 1); continue }
                const rad = r.t * Math.min(w, h) * 0.5
                ctx.strokeStyle = `rgba(232,238,244,${(1 - r.t) * 0.4})`
                ctx.lineWidth = 1 + (1 - r.t) * 1.4
                ctx.beginPath(); ctx.arc(r.x, r.y, rad, 0, 7); ctx.stroke()
                ctx.strokeStyle = `rgba(232,238,244,${(1 - r.t) * 0.14})`
                ctx.beginPath(); ctx.arc(r.x, r.y, rad * 0.62, 0, 7); ctx.stroke()
            }

            if (hot) {
                ctx.strokeStyle = 'rgba(232,238,244,.3)'; ctx.lineWidth = 1
                ctx.beginPath(); ctx.arc(mx, my, 13, 0, 7); ctx.stroke()
            }
        },
        click(s, mx, my) { s.rings.push({ x: mx, y: my, t: 0 }) },
    },

    {
        id: 'vinyl',
        backdrop: 'linear-gradient(150deg,#120e12 0%,#1d151b 48%,#2a1d22 100%)',
        init() { return { a: 0, spin: 1, pulse: [], needle: 0, playing: false } },
        draw(s, c) {
            const { ctx, w, h, t, dt, mx, hot, motion } = c
            s.spin = ease(s.spin, hot ? 0.25 + (mx / w) * 1.9 : 1, 0.03)
            s.a += dt * 0.0016 * s.spin * motion
            s.needle = ease(s.needle, s.playing ? 1 : 0, 0.06)
            const cx = w * 0.5, cy = h * 0.54, R = Math.min(w, h) * 0.33

            ctx.save(); ctx.translate(cx, cy)
            ctx.fillStyle = 'rgba(0,0,0,.5)'
            ctx.beginPath(); ctx.arc(0, 8, R * 1.02, 0, 7); ctx.fill()
            ctx.fillStyle = '#0b0810'
            ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill()
            ctx.rotate(s.a)
            for (let i = 0; i < 26; i++) {
                const groove = R * (0.34 + i / 26 * 0.63)
                ctx.strokeStyle = `rgba(228,206,196,${0.03 + (i % 4 === 0 ? 0.05 : 0)})`
                ctx.lineWidth = 1
                ctx.beginPath(); ctx.arc(0, 0, groove, 0, 7); ctx.stroke()
            }
            // A band of highlight that rotates with the record.
            const sh = ctx.createLinearGradient(-R, -R, R, R)
            sh.addColorStop(0, 'rgba(255,214,190,0)')
            sh.addColorStop(0.42, 'rgba(255,214,190,.10)')
            sh.addColorStop(0.5, 'rgba(255,232,214,.16)')
            sh.addColorStop(0.58, 'rgba(255,214,190,.10)')
            sh.addColorStop(1, 'rgba(255,214,190,0)')
            ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill()
            ctx.fillStyle = '#b8664f'; ctx.beginPath(); ctx.arc(0, 0, R * 0.30, 0, 7); ctx.fill()
            ctx.fillStyle = 'rgba(0,0,0,.22)'
            ctx.beginPath(); ctx.arc(0, 0, R * 0.30, -0.6, 0.6); ctx.lineTo(0, 0); ctx.fill()
            ctx.fillStyle = '#120e12'; ctx.beginPath(); ctx.arc(0, 0, R * 0.035, 0, 7); ctx.fill()
            ctx.restore()

            const ax = cx + R * 1.06, ay = cy - R * 0.82
            ctx.save(); ctx.translate(ax, ay); ctx.rotate(-0.62 + s.needle * 0.5)
            ctx.strokeStyle = 'rgba(226,206,196,.5)'; ctx.lineWidth = 4; ctx.lineCap = 'round'
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R * 0.92, R * 0.5); ctx.stroke()
            ctx.fillStyle = 'rgba(226,206,196,.6)'
            ctx.beginPath(); ctx.roundRect(R * 0.88, R * 0.46, 16, 9, 2); ctx.fill()
            ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.fill()
            ctx.restore()

            for (let i = s.pulse.length - 1; i >= 0; i--) {
                const p = s.pulse[i]
                p.t += dt * 0.0006
                if (p.t >= 1) { s.pulse.splice(i, 1); continue }
                ctx.strokeStyle = `rgba(226,168,140,${(1 - p.t) * 0.3})`
                ctx.lineWidth = 1.5
                ctx.beginPath(); ctx.arc(cx, cy, R + p.t * Math.min(w, h) * 0.4, 0, 7); ctx.stroke()
            }

            const bars = 5
            for (let i = 0; i < bars; i++) {
                const bh = (6 + Math.abs(Math.sin(t / 320 + i)) * 26) * s.spin * s.needle
                ctx.fillStyle = 'rgba(226,168,140,.35)'
                ctx.fillRect(w * 0.5 - (bars * 9) / 2 + i * 9, cy + R + 34 - bh, 4, bh)
            }
        },
        click(s) { s.playing = !s.playing; s.pulse.push({ t: 0 }) },
    },
]

/** Keyed by wallpaper id, which is how `LiveWallpaper` looks an engine up. */
export const SCENE_ENGINES = Object.fromEntries(SCENES.map(s => [s.id, s]))

export default SCENE_ENGINES
