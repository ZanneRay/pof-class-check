// PoF Class Check — backend adapter.
// Two implementations with the same API:
//   Firebase Realtime Database (production, needs config.js)
//   Mock (?mock=1): BroadcastChannel + localStorage, for testing on one computer.
// API: await Backend.init() -> uid; set(path, v); update(path, obj); remove(path);
//      on(path, cb) -> unsubscribe; once(path) -> value

const MOCK = new URLSearchParams(location.search).has("mock");

function splitPath(p) { return p.split("/").filter(Boolean); }
function getAt(tree, p) { let n = tree; for (const k of splitPath(p)) { if (n == null || typeof n !== "object") return null; n = n[k]; } return n === undefined ? null : n; }
function setAt(tree, p, v) {
  const ks = splitPath(p); let n = tree;
  for (let i = 0; i < ks.length - 1; i++) { if (n[ks[i]] == null || typeof n[ks[i]] !== "object") n[ks[i]] = {}; n = n[ks[i]]; }
  if (v === null || v === undefined) delete n[ks[ks.length - 1]]; else n[ks[ks.length - 1]] = JSON.parse(JSON.stringify(v));
}

function mockBackend() {
  const KEY = "pofcc-mockdb";
  const ch = new BroadcastChannel("pofcc-mock");
  const subs = new Set();
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
  const write = (t) => { localStorage.setItem(KEY, JSON.stringify(t)); ch.postMessage("x"); fire(); };
  const fire = () => { const t = read(); subs.forEach((s) => s.cb(getAt(t, s.path))); };
  ch.onmessage = fire;
  let uid = sessionStorage.getItem("pofcc-mock-uid");
  if (!uid) { uid = "m" + Math.random().toString(36).slice(2, 10); sessionStorage.setItem("pofcc-mock-uid", uid); }
  return {
    mode: "mock",
    async init() { return uid; },
    async set(p, v) { const t = read(); setAt(t, p, v); write(t); },
    async update(p, obj) { const t = read(); for (const [k, v] of Object.entries(obj)) setAt(t, p + "/" + k, v); write(t); },
    async remove(p) { const t = read(); setAt(t, p, null); write(t); },
    async once(p) { return getAt(read(), p); },
    on(p, cb) { const s = { path: p, cb }; subs.add(s); cb(getAt(read(), p)); return () => subs.delete(s); },
  };
}

function firebaseBackend() {
  const V = "10.12.2";
  let db, fb, uid;
  return {
    mode: "firebase",
    async init() {
      if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.databaseURL) throw new Error("config.js is not filled in (FIREBASE_CONFIG).");
      const app = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
      const auth = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`);
      fb = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-database.js`);
      const a = app.initializeApp(window.FIREBASE_CONFIG);
      db = fb.getDatabase(a);
      const au = auth.getAuth(a);
      const cred = await auth.signInAnonymously(au);
      uid = cred.user.uid;
      return uid;
    },
    async set(p, v) { await fb.set(fb.ref(db, p), v); },
    async update(p, obj) { await fb.update(fb.ref(db, p), obj); },
    async remove(p) { await fb.remove(fb.ref(db, p)); },
    async once(p) { const s = await fb.get(fb.ref(db, p)); return s.exists() ? s.val() : null; },
    on(p, cb) { return fb.onValue(fb.ref(db, p), (s) => cb(s.exists() ? s.val() : null)); },
  };
}

window.Backend = MOCK ? mockBackend() : firebaseBackend();
