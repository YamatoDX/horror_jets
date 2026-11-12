'use strict';
/* =====================================================================
   CORE: math, noise, renderer, sky, ocean, particles, audio
   ===================================================================== */
window.onerror = (m, s, l, c) => { const e = document.getElementById('err'); if (e) e.textContent += m + ' @' + (s || '').split('/').pop() + ':' + l + '\n'; };
const TAU = Math.PI * 2, G = 9.81;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];
const V3 = THREE.Vector3, Q4 = THREE.Quaternion;
function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; }
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const PERM = (() => { const r = mulberry(1337), p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = (r() * (i + 1)) | 0; [p[i], p[j]] = [p[j], p[i]]; } return new Uint8Array([...p, ...p]); })();
const hash2 = (x, y) => PERM[PERM[x & 255] + (y & 255)] / 255;
function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, o) { let s = 0, a = .5, f = 1, n = 0; for (let i = 0; i < o; i++) { s += noise2(x * f, y * f) * a; n += a; a *= .5; f *= 2; } return s / n; }

/* ---- shared target info (player or the jet the player flies) ---- */
const TGT = { pos: new V3(), vel: new V3(), fwd: new V3(0, 0, -1), jet: false, r: 1.2, alive: true };

/* ---------------------------------------------------------------- renderer */
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c3'), antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
const scene = new THREE.Scene();
const FOG_COL = 0x11182a;
scene.fog = new THREE.FogExp2(FOG_COL, 0.00027);
const camera = new THREE.PerspectiveCamera(70, 1, 0.3, 14000);
scene.add(camera);
const hudc = document.getElementById('hud'), hx = hudc.getContext('2d');
let SW = 1280, SH = 720;
function resize() {
  SW = window.innerWidth; SH = window.innerHeight;
  renderer.setSize(SW, SH, false); camera.aspect = SW / SH; camera.updateProjectionMatrix();
  hudc.width = SW; hudc.height = SH;
}
window.addEventListener('resize', resize); resize();

const MOON_DIR = new V3(-0.5, 0.42, -0.75).normalize();
scene.add(new THREE.HemisphereLight(0x7f8cc4, 0x2b2220, 0.95));
const moonLight = new THREE.DirectionalLight(0xb9c6ff, 0.95);
moonLight.position.copy(MOON_DIR).multiplyScalar(100); scene.add(moonLight);
const flashLight = new THREE.PointLight(0xff9a50, 0, 320, 2); scene.add(flashLight);
let flashI = 0;

/* ---- sky dome: gradient, stars, blood moon ---- */
const sky = new THREE.Mesh(new THREE.SphereGeometry(10000, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { moonDir: { value: MOON_DIR } },
  vertexShader: 'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `varying vec3 vD;uniform vec3 moonDir;
  float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
  void main(){vec3 d=normalize(vD);float h=clamp(d.y,0.,1.);
   vec3 hor=vec3(.067,.094,.165),zen=vec3(.006,.01,.03);
   vec3 col=mix(hor,zen,pow(h,.45));if(d.y<0.)col=hor*.9;
   vec3 sp=floor(d*330.);float s=h3(sp);col+=step(.9962,s)*smoothstep(.0,.2,d.y)*vec3(.8,.85,1.)*(.55+.45*h3(sp+7.));
   float md=max(dot(d,normalize(moonDir)),0.);
   col+=vec3(1.,.38,.28)*smoothstep(.99895,.9993,md)*1.15+vec3(.85,.18,.22)*(pow(md,70.)*.38+pow(md,9.)*.09);
   gl_FragColor=vec4(col,1.);}`
}));
sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);

/* ---- ocean ---- */
function waterNormalTex() {
  const n = 256, c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'), im = g.createImageData(n, n);
  const waves = []; const r = mulberry(5); for (let i = 0; i < 9; i++) waves.push([1 + (r() * 5 | 0), 1 + (r() * 5 | 0) * (r() < .5 ? -1 : 1), r() * TAU, .5 / (1 + i * .5)]);
  const H = (x, y) => { let s = 0; for (const [kx, ky, ph, a] of waves) s += a * Math.sin(TAU * (kx * x + ky * y) / n + ph); return s; };
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = H(x + 1, y) - H(x - 1, y), dy = H(x, y + 1) - H(x, y - 1), i = (y * n + x) * 4;
    im.data[i] = 128 - dx * 90; im.data[i + 1] = 128 - dy * 90; im.data[i + 2] = 255; im.data[i + 3] = 255;
  }
  g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const WTEX = waterNormalTex(); WTEX.repeat.set(250, 250);
const ocean = new THREE.Mesh(new THREE.PlaneGeometry(16000, 16000), new THREE.MeshPhongMaterial({ color: 0x0b2a40, specular: 0xaab8ff, shininess: 110, normalMap: WTEX, normalScale: new THREE.Vector2(.7, .7) }));
ocean.rotation.x = -Math.PI / 2; ocean.frustumCulled = false; scene.add(ocean);
function updateOcean(t) {
  ocean.position.set(camera.position.x, 0, camera.position.z);
  WTEX.offset.set(camera.position.x / 64 + t * .012, -camera.position.z / 64 + t * .007);
}

/* ---------------------------------------------------------------- geometry helpers */
function M4(px, py, pz, rx, ry, rz, sx, sy, sz) {
  return new THREE.Matrix4().compose(new V3(px, py, pz), new Q4().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new V3(sx == null ? 1 : sx, sy == null ? 1 : sy, sz == null ? 1 : sz));
}
function mergeGeos(list) {
  const pos = [], nor = [], col = [], uv = [];
  for (const [g0, m, c] of list) {
    const g = g0.index ? g0.toNonIndexed() : g0.clone(); g.applyMatrix4(m);
    const p = g.attributes.position.array, n = g.attributes.normal.array, u = g.attributes.uv ? g.attributes.uv.array : null;
    for (let i = 0; i < p.length; i++) { pos.push(p[i]); nor.push(n[i]); }
    for (let i = 0; i < p.length / 3 * 2; i++) uv.push(u ? u[i] : 0);
    if (c !== undefined) { const cc = new THREE.Color(c); for (let i = 0; i < p.length / 3; i++) col.push(cc.r, cc.g, cc.b); }
  }
  const r = new THREE.BufferGeometry(); r.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); r.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  r.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (col.length) r.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return r;
}
function instances(geo, mat, mats) {
  const im = new THREE.InstancedMesh(geo, mat, mats.length);
  mats.forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; scene.add(im); return im;
}

/* ---------------------------------------------------------------- particles */
function radTex(stops) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}
const TEX = {
  glow: radTex([[0, 'rgba(255,255,255,1)'], [.3, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]),
  smoke: radTex([[0, 'rgba(255,255,255,.75)'], [.55, 'rgba(255,255,255,.3)'], [1, 'rgba(255,255,255,0)']]),
  ring: (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.strokeStyle = '#fff'; g.lineWidth = 7; g.shadowColor = '#fff'; g.shadowBlur = 8; g.beginPath(); g.arc(64, 64, 52, 0, TAU); g.stroke(); return new THREE.CanvasTexture(c); })()
};
const FXFREE = [], FXON = [];
for (let i = 0; i < 700; i++) {
  const m = new THREE.SpriteMaterial({ map: TEX.glow, transparent: true, depthWrite: false });
  const s = new THREE.Sprite(m); s.visible = false; scene.add(s);
  FXFREE.push({ s, m, t: 0, life: 1, v: new V3(), s0: 1, s1: 1, a: 1, g: 0, d: 1 });
}
function puff(x, y, z, vx, vy, vz, life, s0, s1, color, add, a, tex, grav, damp) {
  const p = FXFREE.pop(); if (!p) return;
  p.t = 0; p.life = life; p.v.set(vx, vy, vz); p.s0 = s0; p.s1 = s1; p.a = a == null ? 1 : a; p.g = grav || 0; p.d = damp == null ? 1 : damp;
  p.m.map = TEX[tex || 'glow']; p.m.color.set(color); p.m.blending = add ? THREE.AdditiveBlending : THREE.NormalBlending; p.m.opacity = p.a;
  p.s.position.set(x, y, z); p.s.scale.set(s0, s0, 1); p.s.visible = true; FXON.push(p);
}
function updateFX(dt) {
  for (let i = FXON.length - 1; i >= 0; i--) {
    const p = FXON[i]; p.t += dt;
    if (p.t >= p.life) { p.s.visible = false; FXFREE.push(p); FXON[i] = FXON[FXON.length - 1]; FXON.pop(); continue; }
    const u = p.t / p.life; p.v.y -= p.g * dt; if (p.d !== 1) p.v.multiplyScalar(Math.pow(p.d, dt * 60));
    p.s.position.addScaledVector(p.v, dt); const sc = lerp(p.s0, p.s1, u); p.s.scale.set(sc, sc, 1); p.m.opacity = p.a * (1 - u) * (1 - u * .3);
  }
  flashI = Math.max(0, flashI - dt * 9); flashLight.intensity = flashI;
}
let shakeAmt = 0;
function explosion(p, size, quiet) {
  size = size || 1;
  for (let i = 0; i < 9 * size + 4; i++) { const v = rand(4, 22) * size; puff(p.x, p.y, p.z, rand(-1, 1) * v, rand(-.3, 1) * v, rand(-1, 1) * v, rand(.4, .9), 5 * size, 16 * size, pick(['#ffb030', '#ff6a18', '#ffd870']), true, .9, 'glow', 0, .94); }
  for (let i = 0; i < 7 * size + 2; i++) { const v = rand(2, 9) * size; puff(p.x, p.y, p.z, rand(-1, 1) * v, rand(0, 1) * v, rand(-1, 1) * v, rand(1.4, 2.8), 6 * size, 22 * size, '#2a2522', false, .75, 'smoke', -2, .96); }
  puff(p.x, p.y, p.z, 0, 0, 0, .25, 10 * size, 38 * size, '#fff2c8', true, 1, 'glow');
  flashLight.position.copy(p); flashI = Math.max(flashI, 3.5 * Math.min(size, 3));
  const d = p.distanceTo(camera.position); shakeAmt = Math.max(shakeAmt, size * 6 / (1 + d / 120));
  if (!quiet) sfx.boom(size, d);
}
function sparks(p, n, color, spd) {
  for (let i = 0; i < n; i++) puff(p.x, p.y, p.z, rand(-1, 1) * spd, rand(0, 1) * spd, rand(-1, 1) * spd, rand(.2, .5), .7, .1, color || '#ffd070', true, 1, 'glow', 14);
}
function splash(p) {
  for (let i = 0; i < 12; i++) puff(p.x, 0.5, p.z, rand(-1, 1) * 6, rand(6, 16), rand(-1, 1) * 6, rand(.6, 1.2), 3, 7, '#bcd6ee', false, .8, 'smoke', 22, .97);
}

/* ---------------------------------------------------------------- audio */
let AC = null, master = null, noiseBuf = null, eng = null;
function initAudio() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = OPTIONS.volume / 100; master.connect(AC.destination);
    noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const ns = AC.createBufferSource(); ns.buffer = noiseBuf; ns.loop = true;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500; const ng = AC.createGain(); ng.gain.value = 0;
    ns.connect(lp); lp.connect(ng); ng.connect(master); ns.start();
    const o1 = AC.createOscillator(), o2 = AC.createOscillator(); o1.type = 'sawtooth'; o2.type = 'square'; o1.frequency.value = 60; o2.frequency.value = 90;
    const og = AC.createGain(); og.gain.value = 0; const olp = AC.createBiquadFilter(); olp.type = 'lowpass'; olp.frequency.value = 400;
    o1.connect(olp); o2.connect(olp); olp.connect(og); og.connect(master); o1.start(); o2.start();
    const ws = AC.createBufferSource(); ws.buffer = noiseBuf; ws.loop = true; const wf = AC.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 700; wf.Q.value = .4;
    const wg = AC.createGain(); wg.gain.value = 0; ws.connect(wf); wf.connect(wg); wg.connect(master); ws.start();
    eng = { ng, lp, o1, o2, og, wg, wf };
  } catch (e) { AC = null; }
}
function audioUpdate(inJet, thr, spd, gearDown) {
  if (!AC || !eng) return; const t = AC.currentTime;
  const on = inJet ? 1 : 0;
  eng.og.gain.setTargetAtTime(on * (.05 + thr * .1), t, .1); eng.ng.gain.setTargetAtTime(on * (.08 + thr * .28), t, .1);
  eng.lp.frequency.setTargetAtTime(300 + thr * 1800, t, .1);
  eng.o1.frequency.setTargetAtTime(48 + thr * 70, t, .15); eng.o2.frequency.setTargetAtTime(71 + thr * 92, t, .15);
  eng.wg.gain.setTargetAtTime(on * clamp(spd / 400, 0, 1) * .22 + (1 - on) * .035, t, .2); eng.wf.frequency.setTargetAtTime(400 + spd * 2, t, .2);
}
function tone(f, dur, type, vol, f2, delay) {
  if (!AC) return; const t = AC.currentTime + (delay || 0), o = AC.createOscillator(), g = AC.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .02);
}
function nburst(dur, freq, vol, type, f2, delay) {
  if (!AC) return; const t = AC.currentTime + (delay || 0), s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = AC.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.setValueAtTime(freq, t); if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur);
  const g = AC.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + dur + .02);
}
const dv = d => clamp(1 - d / 1600, 0, 1);
const sfx = {
  cannon() { nburst(.07, 2400, .28, 'bandpass', 600); tone(90, .06, 'square', .12, 50); },
  rifle() { nburst(.12, 3200, .38, 'lowpass', 400); tone(140, .1, 'square', .16, 50); },
  shotgun() { nburst(.3, 1800, .6, 'lowpass', 150); tone(70, .25, 'sawtooth', .25, 30); },
  sniper() { nburst(.35, 2200, .7, 'lowpass', 120); tone(60, .4, 'sawtooth', .3, 25); },
  plasma() { tone(1100, .06, 'sawtooth', .1, 300); nburst(.05, 4000, .15, 'highpass'); },
  rail() { tone(2400, .5, 'sawtooth', .18, 80); nburst(.5, 3000, .5, 'lowpass', 100); },
  zap() { nburst(.1, 5000, .25, 'highpass'); tone(300 + Math.random() * 400, .08, 'square', .1, 90); },
  dry() { tone(900, .03, 'square', .06); },
  reload() { tone(300, .05, 'square', .08); tone(500, .05, 'square', .08, 0, .35); },
  slash() { nburst(.2, 3000, .25, 'bandpass', 800); },
  missile() { nburst(1.2, 900, .4, 'lowpass', 3000); tone(200, .8, 'sawtooth', .1, 700); },
  boom(size, dist) { const v = dv(dist || 0) * Math.min(1, .4 + size * .3); if (v > .02) { nburst(.9 + size * .5, 700, .8 * v, 'lowpass', 60); tone(60, .8, 'sine', .5 * v, 25); } },
  hit() { tone(1200, .04, 'square', .1); },
  hurt() { nburst(.2, 600, .4, 'lowpass', 120); tone(110, .25, 'sawtooth', .2, 60); },
  shriek(d) { const v = dv(d || 0); if (v > .03) { tone(900, .7, 'sawtooth', .12 * v, 2200); tone(1400, .7, 'square', .06 * v, 600); } },
  roar(d) { const v = dv(d || 0); if (v > .03) { tone(110, .9, 'sawtooth', .3 * v, 45); nburst(.8, 500, .3 * v, 'lowpass', 100); } },
  beep(f, d) { tone(f || 1000, d || .08, 'sine', .12); },
  warn() { tone(780, .12, 'square', .09); tone(520, .12, 'square', .09, 0, .14); },
  gear() { nburst(.6, 400, .25, 'lowpass', 200); tone(70, .5, 'square', .1, 55); },
  thunder() { nburst(2.2, 400, .7, 'lowpass', 40); tone(40, 1.8, 'sine', .4, 20); },
  pickup() { tone(660, .1, 'sine', .15); tone(990, .15, 'sine', .15, 0, .09); },
  step() { nburst(.07, 260, .1, 'lowpass', 90); },
  eject() { nburst(.5, 1500, .5, 'bandpass', 300); }
};
