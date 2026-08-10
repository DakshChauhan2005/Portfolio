/**
 * One ambient voice per live wallpaper, synthesised with the Web Audio API.
 *
 * Nothing is downloaded: rain is filtered noise, the motorcycle is two detuned
 * saws through a lowpass, the record is a crackle loop over a triangle chord.
 * That keeps the whole soundtrack at zero bytes of payload — which matters,
 * because this is a portfolio, not a music site.
 *
 * A voice is built by `VOICES[sceneId](ctx, destination)` and returns:
 *
 *   g       its own GainNode, already connected to `destination`. The caller
 *           ramps this to fade a voice in or out; it starts at 0.
 *   stop()  tear down every source and interval it owns.
 *   update(p)  optional — called ~11×/s with the smoothed pointer
 *              `{ x, y, hot }` in 0..1, so a scene can be *played* as well as
 *              watched. Always via `setTargetAtTime`, never a bare assignment,
 *              or the parameter steps and the speakers click.
 *   hit()   optional — the pointer went down on empty desktop.
 *
 * Keyed by the ids in `wallpapers.js`. A scene with no entry here is silent,
 * which is how the still photo works without a special case.
 */

/**
 * Two seconds of white noise, reused by every source that needs it. Cached per
 * AudioContext: a buffer belongs to the context that made it, so keying this on
 * the module alone would throw the first time a context was closed and remade.
 */
const noiseBuffers = new WeakMap()

function noise(ac) {
    let buffer = noiseBuffers.get(ac)
    if (!buffer) {
        buffer = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
        noiseBuffers.set(ac, buffer)
    }
    const source = ac.createBufferSource()
    source.buffer = buffer
    source.loop = true
    source.start()
    return source
}

const osc = (ac, type, f) => {
    const o = ac.createOscillator()
    o.type = type
    o.frequency.value = f
    o.start()
    return o
}

const filt = (ac, type, f, q) => {
    const b = ac.createBiquadFilter()
    b.type = type
    b.frequency.value = f
    if (q != null) b.Q.value = q
    return b
}

const gain = (ac, v) => {
    const g = ac.createGain()
    g.gain.value = v
    return g
}

/** Connect a list of nodes end to end. */
const chain = (...nodes) => {
    for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1])
    return nodes[0]
}

/**
 * A held chord under a slowly breathing lowpass — the bed most of the calmer
 * scenes sit on. Alternating sine and triangle keeps it from sounding like an
 * organ; the 0.07 Hz LFO on the cutoff is what stops it sounding like a drone.
 */
function pad(ac, out, freqs, vol, cut) {
    const g = gain(ac, 0)
    const lp = filt(ac, 'lowpass', cut, 0.6)
    const voices = freqs.map((f, i) => {
        const o = osc(ac, i % 2 ? 'triangle' : 'sine', f)
        const og = gain(ac, vol / freqs.length)
        o.connect(og); og.connect(lp)
        return o
    })
    const lfo = osc(ac, 'sine', 0.07)
    const lg = gain(ac, cut * 0.35)
    lfo.connect(lg); lg.connect(lp.frequency)
    lp.connect(g); g.connect(out)
    return { g, stop: () => { voices.forEach(o => o.stop()); lfo.stop() } }
}

export const VOICES = {
    dusk(ac, out) {
        const p = pad(ac, out, [82.4, 123.5, 164.8, 246.9], 0.09, 520)
        const air = noise(ac)
        chain(air, filt(ac, 'bandpass', 620, 0.5), gain(ac, 0.012), p.g)
        return { g: p.g, stop: () => { p.stop(); air.stop() } }
    },

    rain(ac, out) {
        const g = gain(ac, 0)
        const hiss = noise(ac)
        const body = noise(ac)
        chain(hiss, filt(ac, 'bandpass', 1400, 0.5), gain(ac, 0.5), g)
        chain(body, filt(ac, 'lowpass', 340, 0.8), gain(ac, 0.32), g)
        g.connect(out)
        return {
            g,
            stop: () => { hiss.stop(); body.stop() },
            // Thunder: a noise burst whose lowpass sweeps down over two seconds.
            hit: () => {
                const n = noise(ac)
                const lp = filt(ac, 'lowpass', 180, 1.2)
                const e = gain(ac, 0)
                chain(n, lp, e, out)
                const t = ac.currentTime
                e.gain.setValueAtTime(0, t)
                e.gain.linearRampToValueAtTime(0.5, t + 0.12)
                e.gain.exponentialRampToValueAtTime(0.0008, t + 2.4)
                lp.frequency.setValueAtTime(320, t)
                lp.frequency.exponentialRampToValueAtTime(70, t + 2.2)
                setTimeout(() => n.stop(), 2600)
            },
        }
    },

    ride(ac, out) {
        const g = gain(ac, 0)
        const lp = filt(ac, 'lowpass', 260, 4)
        const a = osc(ac, 'sawtooth', 52)
        const b = osc(ac, 'sawtooth', 52.7)
        const sub = osc(ac, 'sine', 26)
        for (const o of [a, b]) { const og = gain(ac, 0.16); o.connect(og); og.connect(lp) }
        const sg = gain(ac, 0.16); sub.connect(sg); sg.connect(lp)
        const wind = noise(ac)
        const wg = gain(ac, 0.035)
        chain(wind, filt(ac, 'bandpass', 900, 0.4), wg, g)
        lp.connect(g); g.connect(out)
        return {
            g,
            stop: () => { a.stop(); b.stop(); sub.stop(); wind.stop() },
            // The cursor's x is the throttle, exactly as it is for the drawing.
            update: (p) => {
                const f = 42 + (p.hot ? p.x : 0.45) * 96
                const t = ac.currentTime
                a.frequency.setTargetAtTime(f, t, 0.3)
                b.frequency.setTargetAtTime(f * 1.013, t, 0.3)
                sub.frequency.setTargetAtTime(f / 2, t, 0.3)
                lp.frequency.setTargetAtTime(200 + f * 4, t, 0.3)
                wg.gain.setTargetAtTime(0.02 + (p.hot ? p.x : 0.4) * 0.06, t, 0.4)
            },
            hit: () => {
                const t = ac.currentTime
                a.frequency.cancelScheduledValues(t)
                a.frequency.setValueAtTime(a.frequency.value * 1.7, t)
            },
        }
    },

    drive(ac, out) {
        const g = gain(ac, 0)
        const road = noise(ac)
        const rumble = noise(ac)
        const bp = filt(ac, 'bandpass', 420, 0.7)
        chain(road, bp, gain(ac, 0.42), g)
        chain(rumble, filt(ac, 'lowpass', 150, 0.9), gain(ac, 0.5), g)
        const hum = osc(ac, 'sine', 68)
        const hg = gain(ac, 0.05); hum.connect(hg); hg.connect(g)
        g.connect(out)
        return {
            g,
            stop: () => { road.stop(); rumble.stop(); hum.stop() },
            update: (p) => bp.frequency.setTargetAtTime(340 + (p.hot ? p.x : 0.5) * 380, ac.currentTime, 0.5),
            hit: () => {
                const o = osc(ac, 'triangle', 420)
                const e = gain(ac, 0)
                chain(o, e, out)
                const t = ac.currentTime
                e.gain.setValueAtTime(0.12, t)
                e.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
                o.frequency.exponentialRampToValueAtTime(210, t + 0.3)
                setTimeout(() => o.stop(), 400)
            },
        }
    },

    desk(ac, out) {
        const p = pad(ac, out, [65.4, 98, 130.8, 196], 0.075, 380)
        const room = noise(ac)
        chain(room, filt(ac, 'lowpass', 260, 0.5), gain(ac, 0.022), p.g)
        return { g: p.g, stop: () => { p.stop(); room.stop() } }
    },

    stars(ac, out) {
        const p = pad(ac, out, [110, 164.8, 220, 329.6], 0.045, 420)
        const scale = [523.3, 587.3, 659.3, 784, 880, 1046.5]
        // A note from a pentatonic-ish set, so any two that overlap still agree.
        const ping = () => {
            const f = scale[Math.floor(Math.random() * scale.length)]
            const o = osc(ac, 'sine', f)
            const harmonic = osc(ac, 'sine', f * 2.01)
            const e = gain(ac, 0)
            o.connect(e)
            const hg = gain(ac, 0.3); harmonic.connect(hg); hg.connect(e)
            e.connect(p.g)
            const t = ac.currentTime
            e.gain.setValueAtTime(0, t)
            e.gain.linearRampToValueAtTime(0.1, t + 0.02)
            e.gain.exponentialRampToValueAtTime(0.0005, t + 3.4)
            setTimeout(() => { o.stop(); harmonic.stop() }, 3600)
        }
        const timer = setInterval(() => { if (Math.random() < 0.5) ping() }, 2600)
        return { g: p.g, stop: () => { p.stop(); clearInterval(timer) }, hit: ping }
    },

    ink(ac, out) {
        const p = pad(ac, out, [55, 82.4, 110], 0.05, 300)
        return {
            g: p.g,
            stop: p.stop,
            hit: () => {
                const o = osc(ac, 'sine', 900)
                const e = gain(ac, 0)
                chain(o, e, p.g)
                const t = ac.currentTime
                e.gain.setValueAtTime(0.16, t)
                e.gain.exponentialRampToValueAtTime(0.0006, t + 0.7)
                o.frequency.setValueAtTime(1100, t)
                o.frequency.exponentialRampToValueAtTime(340, t + 0.28)
                setTimeout(() => o.stop(), 800)
            },
        }
    },

    vinyl(ac, out) {
        const g = gain(ac, 0)
        const crackle = noise(ac)
        const cg = gain(ac, 0.05)
        chain(crackle, filt(ac, 'highpass', 2400, 0.6), cg, g)
        const hiss = noise(ac)
        chain(hiss, filt(ac, 'bandpass', 5200, 0.4), gain(ac, 0.018), g)
        const warm = filt(ac, 'lowpass', 900, 0.6)
        warm.connect(g)
        const chord = [110, 164.8, 207.7, 261.6].map(f => {
            const o = osc(ac, 'triangle', f)
            const og = gain(ac, 0.028)
            o.connect(og); og.connect(warm)
            return o
        })
        g.connect(out)
        // A pop is the crackle gain spiking for four milliseconds.
        const pop = () => {
            const t = ac.currentTime
            cg.gain.cancelScheduledValues(t)
            cg.gain.setValueAtTime(0.05, t)
            cg.gain.linearRampToValueAtTime(0.34, t + 0.004)
            cg.gain.exponentialRampToValueAtTime(0.05, t + 0.07)
        }
        const timer = setInterval(() => { if (Math.random() < 0.55) pop() }, 320)
        return {
            g,
            stop: () => { crackle.stop(); hiss.stop(); chord.forEach(o => o.stop()); clearInterval(timer) },
            // Slowing the record detunes it flat, like a hand on the platter.
            update: (p) => {
                const detune = ((p.hot ? 0.25 + p.x * 1.9 : 1) - 1) * 120
                chord.forEach(o => o.detune.setTargetAtTime(detune, ac.currentTime, 0.4))
            },
            hit: pop,
        }
    },
}

export default VOICES
