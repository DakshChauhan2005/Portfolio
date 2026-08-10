/**
 * The one thing about this desktop that is too big for localStorage: the audio
 * file a visitor picks for the Vinyl Hour wallpaper.
 *
 * Everything else the visitor chooses is a number or an id and lives in
 * `usePersistentSettings`. A track is megabytes of Blob, so it gets IndexedDB —
 * one database, one store, one record. Its *name* still lives in the settings
 * object, which is what the panel prints and what tells `LiveWallpaper` the
 * track changed; this file only holds the bytes.
 *
 * Nothing here throws. A browser in private mode, one with storage disabled and
 * one that is simply full all behave the same way: the promise resolves to null
 * or false, the panel says so, and the wallpaper falls back to the bundled
 * track. A portfolio must not break because a Blob would not fit.
 */

const DB = 'portfolio:audio'
const STORE = 'tracks'
const KEY = 'vinyl'

/**
 * A last-resort copy in memory. If IndexedDB is unavailable the visitor's pick
 * still works for this page view — it just doesn't survive a reload. Better
 * than a file picker that silently does nothing.
 */
let fallback = null

/** Open (and on first use create) the store. Resolves to null if it can't. */
function open() {
    return new Promise((resolve) => {
        let request
        try {
            request = indexedDB.open(DB, 1)
        } catch {
            resolve(null)
            return
        }
        if (!request) {
            resolve(null)
            return
        }
        request.onupgradeneeded = () => {
            const db = request.result
            if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => resolve(null)
        // Another tab holding an old version open, or a browser that prompts
        // for storage and is never answered: don't hang the settings panel.
        request.onblocked = () => resolve(null)
    })
}

/** Run one transaction and resolve with its result, or null on any failure. */
function transact(mode, run) {
    return open().then(db => {
        if (!db) return null
        return new Promise((resolve) => {
            let request
            try {
                const tx = db.transaction(STORE, mode)
                request = run(tx.objectStore(STORE))
                tx.oncomplete = () => { db.close(); resolve(request ? request.result : true) }
                tx.onerror = () => { db.close(); resolve(null) }
                tx.onabort = () => { db.close(); resolve(null) }
            } catch {
                db.close()
                resolve(null)
            }
        })
    })
}

/**
 * The stored track, or null if there isn't one. `{ name, blob }` — the name is
 * kept here too so the record is self-describing, but the panel reads the copy
 * in the settings object, which it already has synchronously.
 */
export function getTrack() {
    return transact('readonly', store => store.get(KEY))
        .then(record => record ?? fallback)
        .catch(() => fallback)
}

/**
 * Store a File as the vinyl track. Resolves true if it will survive a reload,
 * false if it only made it as far as memory — the panel says which.
 */
export function setTrack(file) {
    const record = { name: file.name, blob: file }
    fallback = record
    return transact('readwrite', store => store.put(record, KEY))
        .then(result => result !== null)
        .catch(() => false)
}

/** Forget the visitor's track and go back to the bundled one. */
export function clearTrack() {
    fallback = null
    return transact('readwrite', store => store.delete(KEY)).catch(() => null)
}

export default getTrack
