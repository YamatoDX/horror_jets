'use strict';
/* =====================================================================
   GAME: player on foot, boarding jets, input, HUD, maps, main loop
   ===================================================================== */
const P = {
  mode: 'foot', pos: new V3(), yaw: 0, pitch: 0, vy: 0, grounded: true, hp: 100, maxhp: 100, jet: null, weapon: 0, mag: [30, 6], res: [180, 36],
  reloadT: 0, fireT: 0, swing: 0, kills: 0, score: 0, lords: 0, hitT: 0, hitKill: false, hurtT: 0, flares: 8, nav: 0, cockpit: false, bob: 0, stepT: 0, invert: false, map: false, near: null
};
let state = 'title', gameT = 0, last = 0, noLock = false, victoryT = 0;
const keys = {}, mouse = { l: false, r: false, dx: 0, dy: 0 }, stick = { x: 0, y: 0 }, JI = { pitch: 0, roll: 0, thr: 0, brake: false, fire: false, missile: false, assist: true };
let msgs = [];
function addMsg(text, dur) { msgs.push({ text, t: dur || 4, max: dur || 4 }); if (msgs.length > 4) msgs.shift(); }
const ov = document.getElementById('ov');

/* ---------------------------------------------------------------- viewmodels */
const VM = {}, vmRoot = new THREE.Group(); camera.add(vmRoot); vmRoot.position.set(.27, -.25, -.52); vmRoot.scale.setScalar(.48);
(function () {
  const dk = L(0x1d1f24), gr = L(0x3a3d44), wd = L(0x6a4426), sv = new THREE.MeshPhongMaterial({ color: 0xc8ccd4, shininess: 90, emissive: 0x181a1e }), gold = new THREE.MeshPhongMaterial({ color: 0xd8b040, shininess: 90, emissive: 0x302008 });
  const cz = (p, m, r, len, x, y, z) => { const o = new THREE.Mesh(CYLG, m); o.scale.set(r, len, r); o.rotation.x = Math.PI / 2; o.position.set(x, y, z); p.add(o); return o; };
  const mk = f => { const g = new THREE.Group(); f(g); g.visible = false; vmRoot.add(g); return g; };
  const L_ = [];
  L_.push(mk(g => { bx(g, dk, .07, .09, .5, 0, 0, 0); bx(g, wd, .075, .07, .3, 0, -.005, -.38); cz(g, gr, .015, .35, 0, .025, -.62); bx(g, dk, .05, .17, .07, 0, -.12, -.02).rotation.x = .45; bx(g, wd, .06, .1, .28, 0, -.03, .38); bx(g, sv, .02, .05, .04, 0, .07, -.15); }));
  L_.push(mk(g => { bx(g, dk, .07, .1, .5, 0, 0, 0); bx(g, gr, .03, .02, .45, 0, .06, -.05); bx(g, dk, .045, .05, .12, 0, .1, -.05); bx(g, B(0xff2020), .03, .03, .01, 0, .1, -.12); cz(g, gr, .025, .32, 0, .02, -.6); bx(g, dk, .05, .15, .06, 0, -.12, -.05); bx(g, gr, .06, .1, .25, 0, -.03, .38); }));
  L_.push(mk(g => { bx(g, dk, .06, .08, .8, 0, 0, .05); cz(g, gr, .012, .5, 0, .01, -.6); cz(g, gr, .032, .28, 0, .09, -.05); cz(g, B(0x60b0ff), .03, .02, 0, .09, -.2); bx(g, wd, .06, .12, .32, 0, -.03, .5); bx(g, gr, .01, .12, .01, -.03, -.08, -.45).rotation.z = .4; bx(g, gr, .01, .12, .01, .03, -.08, -.45).rotation.z = -.4; }));
  L_.push(mk(g => { cz(g, gr, .055, 1.0, 0, 0, -.2); cz(g, dk, .07, .1, 0, 0, -.72); const w = new THREE.Mesh(CONEG, L(0x4a5a2a)); w.scale.set(.1, .3, .1); w.rotation.x = -Math.PI / 2; w.position.set(0, 0, -.98); g.add(w); cz(g, dk, .035, .2, 0, 0, .35); bx(g, wd, .04, .12, .05, 0, -.09, .0); bx(g, wd, .04, .1, .05, 0, -.08, -.3); }));
  L_.push(mk(g => { bx(g, gr, .05, .055, .27, 0, .02, -.04); bx(g, dk, .04, .04, .22, 0, -.02, 0); bx(g, dk, .04, .13, .06, 0, -.1, .08).rotation.x = .2; bx(g, sv, .01, .02, .02, 0, .055, -.15); }));
  L_.push(mk(g => { cz(g, gr, .03, .36, 0, .03, -.26); bx(g, sv, .05, .08, .2, 0, 0, 0); cz(g, sv, .05, .09, 0, .01, -.07); bx(g, wd, .045, .13, .07, 0, -.1, .1).rotation.x = .3; }));
  L_.push(mk(g => { bx(g, dk, .075, .08, .5, 0, 0, 0); bx(g, dk, .025, .025, .75, -.02, .03, -.5); bx(g, dk, .025, .025, .75, .02, .03, -.5); bx(g, wd, .065, .055, .24, 0, -.05, -.35); bx(g, wd, .06, .1, .3, 0, -.03, .38); }));
  L_.push(mk(g => { bx(g, wd, .04, .04, .22, 0, 0, .05); bx(g, gold, .26, .035, .035, 0, 0, -.07); bx(g, B(0xd02020), .045, .045, .045, 0, 0, -.07); VM.blade = bx(g, new THREE.MeshPhongMaterial({ color: 0xdfe6ff, emissive: 0x3050ff, shininess: 100 }), .05, .012, 1.0, 0, 0, -.58); g.position.set(0, .02, 0); }));
  L_.push(mk(g => { VM.spin = new THREE.Group(); VM.spin.position.set(0, 0, -.45); g.add(VM.spin); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; cz(VM.spin, gr, .014, .55, Math.cos(a) * .045, Math.sin(a) * .045, 0); } cz(g, dk, .075, .3, 0, 0, -.1); cz(g, B(0x60e0ff), .02, .05, 0, 0, -.73); bx(g, dk, .12, .14, .22, 0, -.1, .22); bx(g, B(0x60e0ff), .02, .02, .3, .06, .02, -.1); }));
  L_.push(mk(g => { bx(g, dk, .09, .11, .9, 0, 0, .1); for (const s of [-1, 1]) bx(g, B(0x70e0ff), .02, .03, 1.2, s * .05, .03, -.5); for (let i = 0; i < 5; i++) cz(g, gr, .07, .03, 0, .02, -.2 - i * .22); bx(g, wd, .07, .12, .25, 0, -.03, .6); bx(g, B(0xffffff), .04, .04, .04, 0, .06, -1.0); }));
  L_.push(mk(g => { cz(g, gold, .1, .8, 0, 0, -.2); cz(g, dk, .13, .12, 0, 0, -.62); VM.sun = sph(g, B(0xff8a20), .1, .1, .1, 0, 0, -.72); for (let i = 0; i < 4; i++) { const f = bx(g, gold, .02, .14, .2, 0, 0, .2); f.rotation.z = i * Math.PI / 2; f.position.set(Math.cos(i * Math.PI / 2) * .1, Math.sin(i * Math.PI / 2) * .1, .2); } bx(g, dk, .06, .13, .06, 0, -.12, 0); }));
  L_.push(mk(g => { bx(g, dk, .07, .09, .6, 0, 0, 0); cz(g, gr, .02, .5, 0, .02, -.5); for (let i = 0; i < 4; i++) cz(g, B(0x6a90ff), .06 - i * .005, .02, 0, .02, -.3 - i * .13); VM.storm = sph(g, B(0xaad0ff), .06, .06, .06, 0, .02, -.82); bx(g, dk, .05, .12, .06, 0, -.1, .05); }));
  VM.list = L_;
  VM.flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffd080, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); VM.flash.scale.set(.5, .5, 1); VM.flash.visible = false; vmRoot.add(VM.flash);
  VM.kick = 0;
})();
const WEAP = [
  { name: 'AK-47', t: 'gun', dmg: 34, rate: .095, auto: 1, spread: .03, mz: -.8, snd: 'rifle', kick: 1 },
  { name: 'M416', t: 'gun', dmg: 30, rate: .068, auto: 1, spread: .012, mz: -.95, snd: 'rifle', kick: .7 },
  { name: 'SNIPER RIFLE', t: 'gun', dmg: 600, rate: .9, spread: .0006, range: 1800, zoom: 16, mz: -1.05, snd: 'sniper', kick: 3 },
  { name: 'RPG-7', t: 'rocket', rate: .6, mz: -.95, kick: 3, rocket: { dmg: 450, rad: 30, esz: 1.6, spd: 75 } },
  { name: 'M1911', t: 'gun', dmg: 60, rate: .16, spread: .008, mz: -.35, snd: 'rifle', kick: .6 },
  { name: 'MAGNUM', t: 'gun', dmg: 180, rate: .36, spread: .006, mz: -.5, snd: 'shotgun', kick: 1.6 },
  { name: 'SHOTGUN', t: 'gun', dmg: 28, pellets: 10, rate: .65, spread: .06, mz: -.95, snd: 'shotgun', kick: 2 },
  { name: 'SWORD OF OMENS  (RMB: THUNDER)', t: 'sword' },
  { name: 'PLASMA MINIGUN', sup: 1, t: 'gun', dmg: 50, rate: .027, auto: 1, spread: .045, mz: -.78, snd: 'plasma', kick: .4, fc: 0x60e0ff, splash: 5 },
  { name: 'RAILGUN', sup: 1, t: 'gun', dmg: 1500, rate: .75, spread: 0, range: 2200, pierce: 1, beam: '#70e0ff', mz: -1.1, snd: 'rail', kick: 3 },
  { name: 'SUN CANNON', sup: 1, t: 'rocket', rate: .9, mz: -.75, kick: 4, rocket: { dmg: 2200, rad: 75, esz: 4, spd: 60, sun: 1 } },
  { name: 'STORM CALLER', sup: 1, t: 'chain', dmg: 160, rate: .11, auto: 1, range: 160, chain: 7, mz: -.82, snd: 'zap', kick: .3, fc: 0x9ac0ff }
];

/* ---------------------------------------------------------------- navigation targets */
function navList() {
  const l = ISL.map(s => ({ name: s.name, x: s.x, z: s.z }));
  ISL.forEach(s => { if (s.lord && s.lord.alive) l.push({ name: 'LORD OF ' + s.short, x: s.nest.x, z: s.nest.z }); });
  return l;
}
function navTarget() { if (!P.nav) return null; const l = navList(); return l[(P.nav - 1) % l.length]; }
function guideToLord() {
  const pp = playerXZ(), list = navList();
  const targets = list.map((t, i) => ({ t, i })).filter(o => o.i >= ISL.length);
  targets.sort((a, b) => Math.hypot(a.t.x - pp.x, a.t.z - pp.z) - Math.hypot(b.t.x - pp.x, b.t.z - pp.z));
  P.nav = targets.length ? targets[0].i + 1 : 0;
}

/* ---------------------------------------------------------------- player actions */
function raySphere(o, d, c, r) { const ox = c.x - o.x, oy = c.y - o.y, oz = c.z - o.z, t = ox * d.x + oy * d.y + oz * d.z; if (t < 0) return -1; const px = o.x + d.x * t - c.x, py = o.y + d.y * t - c.y, pz = o.z + d.z * t - c.z; return px * px + py * py + pz * pz < r * r ? t : -1; }
function hitMarker(kill) { P.hitT = .22; P.hitKill = kill; if (!kill) sfx.hit(); }
function onKill(e, self) { if (!self) { P.kills++; P.score += e.def.score; } }
function onLordKilled(e) {
  P.lords++; addMsg('NOSFERATU LORD SLAIN  (' + P.lords + '/3)', 6); const s = ISL[e.isl]; if (s.beam) s.beam.visible = false; sfx.thunder();
  if (P.lords >= 3) victoryT = 3.5;
  else guideToLord();
}
function pickupFx(type) { sfx.pickup(); if (type === 'hp') { P.hp = Math.min(P.maxhp, P.hp + 30); addMsg('+30 health', 2); } else { P.res[0] += 60; P.res[1] += 8; addMsg('Ammo restored', 2); } }
function hurtPlayer(n, kind) {
  if (state !== 'play') return;
  if (P.mode === 'jet' && P.jet) { damageJet(P.jet, n * (kind === 'melee' || kind === 'drain' ? 0 : 1)); P.hurtT = .35; return; }
  if (kind === 'melee' || kind === 'drain') { P.hurtT = Math.max(P.hurtT, .15); return; }
  P.hurtT = .3; sfx.hurt(); shakeAmt = Math.max(shakeAmt, Math.min(4, n * .15)); P.hp = P.maxhp; /* infinite health */
}
function onJetDestroyed(j, why) {
  P.mode = 'foot'; P.jet = null; LOCK.t = null; LOCK.c = null; LOCK.p = 0; sfx.eject();
  const s = nearestIsland(j.pos.x, j.pos.z), [x, z] = afw(s, -350, 100);
  P.pos.set(x, groundH(x, z), z); P.vy = 0; P.yaw = yawOf(Math.cos(s.rot), Math.sin(s.rot));
  addMsg('JET LOST — you ejected and were recovered at ' + s.name, 6);
}
function nearestJet() {
  let b = null, bd = 22; for (const j of jets) { if (!j.alive || j.occupied) continue; const d = Math.hypot(j.pos.x - P.pos.x, j.pos.z - P.pos.z); if (d < bd && Math.abs(j.pos.y - P.pos.y) < 12) { bd = d; b = j; } } return b;
}
function boardJet(j) {
  P.mode = 'jet'; P.jet = j; j.occupied = true; j.fireT = 0; stick.x = stick.y = 0; LOCK.t = null; LOCK.p = 0; VM.list.forEach(g => g.visible = false); jetCamera.q = null;
  guideToLord();
  addMsg('Boarded ' + j.d.name + ' — Shift: throttle up, hold S to rotate at speed, G: gear', 6); sfx.gear();
}
function exitJet() {
  const j = P.jet; if (!j.onGround || j.gs > 3) { addMsg('Land and stop the jet first', 2); return; }
  j.occupied = false; j.throttle = 0; j.mesh.visible = true; _r.set(-1, 0, 0).applyQuaternion(j.q).multiplyScalar(8).add(j.pos);
  P.pos.set(_r.x, groundH(_r.x, _r.z), _r.z); P.mode = 'foot'; P.jet = null; LOCK.t = null; P.vy = 0; _f.set(0, 0, -1).applyQuaternion(j.q); P.yaw = Math.atan2(-_f.x, -_f.z); addMsg('On foot', 2);
}
function switchWeapon(w) {
  if (P.mode !== 'foot') return; w = (w + WEAP.length) % WEAP.length; if (w === P.weapon) return;
  P.weapon = w; P.swing = 0; P.chant = 0; VM.list.forEach((g, i) => g.visible = i === w); addMsg(WEAP[w].name + (WEAP[w].sup ? '  [SUPER WEAPON]' : ''), 1.5);
}
function startReload() { }
function bolt(a, b, col, size, life) {
  const n = clamp(Math.floor(a.distanceTo(b) / 3), 2, 60), d = _g.copy(b).sub(a);
  for (let i = 0; i <= n; i++) { const t = i / n, j = i === 0 || i === n ? 0 : 2.2; puff(a.x + d.x * t + rand(-j, j), a.y + d.y * t + rand(-j, j), a.z + d.z * t + rand(-j, j), 0, 0, 0, life || .22, size, size * .4, col || '#bcd8ff', true, 1); }
}
function rayHit(o, d, range) {
  let bt = range, be = null; for (const e of enemies) { if (!e.alive || e.dist > range + 20) continue; enemyCenter(e, _c); const t = raySphere(o, d, _c, e.def.r + .3); if (t >= 0 && t < bt) { bt = t; be = e; } }
  for (let s = 3; s < bt; s += (range > 600 ? 8 : 3)) { const x = o.x + d.x * s, y = o.y + d.y * s, z = o.z + d.z * s; if (y < groundH(x, z)) { bt = s; be = null; break; } }
  return { bt, be };
}
function muzzle(w) { _u.set(.12, -.08, w.mz * .55).applyQuaternion(camera.quaternion).add(camera.position); return _u; }
function footFire() {
  const w = WEAP[P.weapon]; if (P.fireT > 0) return;
  if (w.t === 'sword') { if (P.swing <= 0 && !(P.chant > 0)) { P.swing = .4; P.fireT = .4; sfx.slash(); P.swingHit = false; } return; }
  P.fireT = w.rate; VM.kick = Math.max(VM.kick, w.kick > 2 ? 1 : .6); VM.flash.visible = true; VM.flash.material.color.setHex(w.fc || (w.sup ? 0x60e0ff : 0xffd080)); VM.flash.position.set(0, .03, w.mz); VM.flashT = .05;
  shakeAmt = Math.max(shakeAmt, w.kick * .35); P.pitch += w.kick * .006; (sfx[w.snd] || sfx.rifle)();
  const o = camera.position, fwd = _f.set(0, 0, -1).applyQuaternion(camera.quaternion).clone();
  if (w.t === 'rocket') {
    const r = w.rocket, m = r.sun ? new THREE.Group() : mkMsl(2.2, .12);
    if (r.sun) { m.add(new THREE.Mesh(SPH, B(0xffc060))); m.children[0].scale.setScalar(1.6); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xff7a18, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); sp.scale.set(16, 16, 1); m.add(sp); }
    scene.add(m); const p = o.clone().addScaledVector(fwd, 2.5); p.y -= .25;
    MSL.push({ m, pos: p, vel: fwd.clone().multiplyScalar(r.spd), dir: fwd.clone(), tgt: null, age: .4, dmg: r.dmg, spd: r.spd, rad: r.rad, esz: r.esz, maxSpd: r.sun ? 130 : 420, acc: r.sun ? 40 : 260 });
    puff(p.x, p.y, p.z, 0, 0, 0, .5, 4, 12, '#ffffff', true, .8); return;
  }
  const n = w.pellets || 1, range = w.range || 500;
  if (w.t === 'chain') {
    const d = fwd.clone(); d.x += rand(-.01, .01); d.y += rand(-.01, .01); d.normalize(); const { bt, be } = rayHit(o, d, range), m0 = muzzle(w).clone(), hp = d.clone().multiplyScalar(bt).add(o);
    bolt(m0, hp, '#bcd8ff', 2.2, .12);
    if (be) {
      const hit = new Set([be]); let cur = be; dmgEnemy(be, w.dmg, 'rifle');
      for (let k = 0; k < w.chain; k++) { let nx = null, nd = 32; for (const e of enemies) { if (!e.alive || hit.has(e)) continue; const dd = e.pos.distanceTo(cur.pos); if (dd < nd) { nd = dd; nx = e; } } if (!nx) break; hit.add(nx); const a1 = enemyCenter(cur, new V3()), a2 = enemyCenter(nx, new V3()); bolt(a1, a2, '#9ac0ff', 1.8, .15); dmgEnemy(nx, w.dmg, 'rifle'); cur = nx; }
    } else sparks(hp, 4, '#bcd8ff', 8);
    return;
  }
  for (let k = 0; k < n; k++) {
    const d = fwd.clone(); d.x += rand(-w.spread, w.spread); d.y += rand(-w.spread, w.spread); d.z += rand(-w.spread, w.spread); d.normalize();
    const { bt, be } = rayHit(o, d, range), hp = d.clone().multiplyScalar(bt).add(o);
    if (w.pierce) { for (const e of enemies) { if (!e.alive || e.dist > bt + 30) continue; enemyCenter(e, _c); const t = raySphere(o, d, _c, e.def.r + 1.2); if (t >= 0 && t <= bt + 2) { dmgEnemy(e, w.dmg, 'rifle'); puff(_c.x, _c.y, _c.z, 0, 0, 0, .4, 5, 10, '#ffffff', true, 1); } } }
    else if (be) { dmgEnemy(be, w.dmg * (bt < 12 && w.pellets ? 1.2 : 1), 'rifle'); puff(hp.x, hp.y, hp.z, 0, 0, 0, .25, 1.4, 2.4, w.sup ? '#60e0ff' : '#d02030', w.sup, .8); sparks(hp, 3, w.sup ? '#80f0ff' : '#ff6060', 5); if (w.splash) blast(hp, w.splash, w.dmg * .5, 'rifle'); }
    else if (bt < range) { sparks(hp, 3, w.sup ? '#80f0ff' : '#ffd070', 6); puff(hp.x, hp.y, hp.z, 0, .5, 0, .6, .8, 2.5, '#7a6e60', false, .5, 'smoke'); }
    const mz = muzzle(w).clone();
    if (w.beam) { const stp = Math.max(4, bt / 110); for (let s = 0; s < bt; s += stp) puff(mz.x + d.x * s, mz.y + d.y * s, mz.z + d.z * s, 0, 0, 0, .5, 2.6, 1, w.beam, true, 1); explosion(hp, .5, true); }
    else { _v.copy(d).multiplyScalar(w.sup ? 900 : 700); spawnBullet(mz, _v, Math.min(bt, 600) / 700, true); }
  }
}
function swordHit() {
  const o = camera.position, f = _f.set(0, 0, -1).applyQuaternion(camera.quaternion);
  for (const e of enemies) { if (!e.alive || e.dist > 12) continue; enemyCenter(e, _c); _v.copy(_c).sub(o); const d = _v.length() - e.def.r; if (d < 4.2 && _v.normalize().dot(f) > .3) { dmgEnemy(e, 220, 'blade'); sparks(_c, 10, '#9fc0ff', 9); } }
}
function startThunder() {
  if (P.chant > 0 || P.thCD > 0) return; P.chant = 1.5; P.thCD = 4.5; P.swing = 0;
  try { if (window.speechSynthesis) { speechSynthesis.cancel(); const a = new SpeechSynthesisUtterance('Thunder'), b = new SpeechSynthesisUtterance('Cats!'); a.rate = .65; a.pitch = .2; b.rate = .75; b.pitch = .25; speechSynthesis.speak(a); speechSynthesis.speak(b); } } catch (e) { }
  tone(120, 1.4, 'sawtooth', .2, 300); addMsg('THUNDER... CATS!', 2);
}
function thunderStrike() {
  const o = camera.position, f = _f.set(0, 0, -1).applyQuaternion(camera.quaternion).clone(), list = [];
  for (const e of enemies) { if (!e.alive || e.dist > 90) continue; enemyCenter(e, _c); _v.copy(_c).sub(o); const d = _v.length(); if (d > 3 && _v.normalize().dot(f) > .25) list.push({ e, d }); }
  list.sort((a, b) => a.d - b.d); const hit = new Set();
  for (const { e } of list.slice(0, 8)) { hit.add(e); for (const e2 of enemies) if (e2.alive && !hit.has(e2) && e2.pos.distanceTo(e.pos) < 12) hit.add(e2); }
  if (!hit.size) { const t = f.clone().multiplyScalar(30).add(o); t.y = groundH(t.x, t.z); bolt(new V3(t.x, t.y + 150, t.z), t, '#dfe8ff', 4, .4); explosion(t, .8, true); }
  for (const e of hit) { const c = enemyCenter(e, new V3()); bolt(new V3(c.x + rand(-8, 8), c.y + 160, c.z + rand(-8, 8)), c.clone(), '#dfe8ff', 5, .45); explosion(c, .7, true); dmgEnemy(e, 700, 'blade'); }
  P.flashT = .5; shakeAmt = Math.max(shakeAmt, 5); sfx.thunder(); flashLight.position.copy(o); flashLight.position.y += 20; flashI = 8;
}
function launchFlare() {
  if (P.flares <= 0 || !P.jet) return; P.flares--; clearBoltsNear(P.jet.pos, 500); sfx.beep(2000, .1);
  for (let i = 0; i < 18; i++) puff(P.jet.pos.x, P.jet.pos.y - 3, P.jet.pos.z, rand(-1, 1) * 25, rand(-1, .2) * 20, rand(-1, 1) * 25, rand(1.5, 3), 3, 1, '#ffeeaa', true, 1, 'glow', 6);
  addMsg('Flares deployed (' + P.flares + ' left)', 1.5);
}

/* ---------------------------------------------------------------- input */
const lockEl = document.body;
function lockPointer() { try { const p = document.body.requestPointerLock(); if (p && p.catch) p.catch(() => { noLock = true; }); } catch (e) { noLock = true; } }
document.addEventListener('pointerlockerror', () => { noLock = true; });
document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && state === 'play' && !P.help && !noLock && performance.now() - fsT > 1500) pause(); });
document.addEventListener('mousemove', e => { if (state !== 'play' || P.map || P.help || (!document.pointerLockElement && !noLock)) return; mouse.dx += e.movementX || 0; mouse.dy += e.movementY || 0; });
document.addEventListener('mousedown', e => {
  if (state !== 'play' || P.map || P.help) return; if (e.button === 0) mouse.l = true; if (e.button === 2) { mouse.r = true; if (P.mode === 'jet') JI.missile = true; else if (WEAP[P.weapon].t === 'sword') startThunder(); }
});
document.addEventListener('mouseup', e => { if (e.button === 0) mouse.l = false; if (e.button === 2) mouse.r = false; });
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('wheel', e => { if (state !== 'play' || P.map || P.help) return; if (P.mode === 'jet' && P.jet) P.jet.throttle = clamp(P.jet.throttle - e.deltaY * .0006, 0, 1); else if (Math.abs(e.deltaY) > 1 && performance.now() - (P._wh || 0) > 120) { P._wh = performance.now(); switchWeapon(P.weapon + (e.deltaY > 0 ? 1 : -1)); } }, { passive: true });
let fsT = 0;
function toggleFullscreen() {
  fsT = performance.now();
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else { const p = document.documentElement.requestFullscreen(); if (p && p.then) p.then(() => { if (state === 'play' && !noLock) lockPointer(); }).catch(() => { }); }
  } catch (err) { }
}
window.addEventListener('keydown', e => {
  if (e.altKey && (e.code === 'Enter' || e.code === 'NumpadEnter')) { e.preventDefault(); if (!e.repeat) toggleFullscreen(); return; }
  if (state === 'play' && (e.code === 'Tab' || !P.help && ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))) e.preventDefault();
  if (state !== 'play' && e.target instanceof HTMLElement && e.target.closest('button, input, summary')) {
    if (state !== 'pause' || e.code !== 'Escape') return;
  }
  if (e.repeat) return; keys[e.code] = true; if (state === 'play') pressed(e.code);
  else if (state === 'pause' && (e.code === 'Escape' || e.code === 'Enter')) resume();
  else if (state === 'title' && e.code === 'Enter') startGame();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
function clearInput() {
  for (const k in keys) keys[k] = false;
  mouse.l = mouse.r = false; mouse.dx = mouse.dy = 0;
  stick.x = stick.y = 0; JI.fire = JI.missile = false; P._held = false;
}
window.addEventListener('blur', () => { clearInput(); pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
function pressed(c) {
  const j = P.jet;
  if (c === 'Tab') {
    if (P.help) closeHelp();
    else {
      P.help = true; P.map = false; clearInput();
      showOverlay(`<div class="panel"><p class="eyebrow">FLIGHT MANUAL / SIMULATION PAUSED</p><h1>CONTROLS</h1>
<div class="actions"><button class="primary" data-action="close-help">Return to sortie [Tab]</button></div>${KEYHELP}</div>`);
      if (document.pointerLockElement) document.exitPointerLock();
    }
    return;
  }
  if (c === 'KeyM') { if (P.help) closeHelp(); P.map = !P.map; clearInput(); return; }
  if (c === 'Escape' || c === 'KeyP') {
    if (P.help) closeHelp(); else if (P.map) { P.map = false; clearInput(); } else pause();
    return;
  }
  if (P.help || (P.map && c !== 'KeyN')) return;
  if (c === 'KeyN') { P.nav = (P.nav + 1) % (navList().length + 1); const t = navTarget(); addMsg(t ? 'Navigation: ' + t.name : 'Navigation cleared', 2.5); sfx.beep(900, .06); return; }
  if (c === 'KeyE') { if (P.mode === 'foot') { const n = nearestJet(); if (n) boardJet(n); else addMsg('No jet in reach — walk to one of the parked fighters', 2.5); } else exitJet(); return; }
  if (P.mode === 'foot') {
    { const dm = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5, Digit7: 6, Digit8: 7, Digit9: 8, Digit0: 9, Minus: 10, Equal: 11 }; if (c in dm) switchWeapon(dm[c]); if (c === 'BracketLeft' || c === 'KeyQ') switchWeapon(P.weapon - 1); if (c === 'BracketRight') switchWeapon(P.weapon + 1); }
    if (c === 'Space' && P.grounded) { P.vy = 6.5; P.grounded = false; }
  } else if (j) {
    if (c === 'KeyG') { if (j.onGround) addMsg('Gear locked down on the ground', 1.5); else { j.gearDown = !j.gearDown; sfx.gear(); addMsg(j.gearDown ? 'GEAR DOWN' : 'GEAR UP', 1.5); } }
    if (c === 'KeyV') P.cockpit = !P.cockpit; if (c === 'KeyT') cycleLock(); if (c === 'KeyQ') launchFlare(); if (c === 'KeyF') JI.missile = true; if (c === 'KeyX') j.throttle = 0; if (c === 'KeyI') { P.invert = !P.invert; addMsg('Pitch invert ' + (P.invert ? 'ON' : 'OFF'), 1.5); } if (c === 'KeyL') { JI.assist = !JI.assist; addMsg('Flight assist ' + (JI.assist ? 'ON' : 'OFF'), 1.5); }
  }
}

/* ---------------------------------------------------------------- update: on foot */
function updateFoot(dt) {
  const zm = WEAP[P.weapon].zoom && mouse.r, ms = (zm ? .0022 * WEAP[P.weapon].zoom / 76 : .0022) * OPTIONS.sensitivity / 100; P.yaw -= mouse.dx * ms; P.pitch = clamp(P.pitch - mouse.dy * ms, -1.5, 1.5);
  const sp = keys.ShiftLeft || keys.ShiftRight, fw = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0), st = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  const spd = (sp && fw > 0 ? 9.5 : 5.6) * (P.weapon === 2 ? 1.1 : 1), sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
  let vx = (-sy * fw + cy * st), vz = (-cy * fw - sy * st); const l = Math.hypot(vx, vz); if (l > 0) { vx = vx / l * spd * dt; vz = vz / l * spd * dt; }
  const nx = P.pos.x + vx, nz = P.pos.z + vz, gh = groundH(nx, nz), cur = groundH(P.pos.x, P.pos.z);
  if (gh > .6 && (gh - cur) < Math.hypot(vx, vz) * 1.2 + .05) { P.pos.x = nx; P.pos.z = nz; } else if (gh > .6) { /* too steep */ } else if (l > 0) { if (!P._wm) { addMsg('The sea is cold and endless — find a jet', 2); P._wm = 2; } }
  if (P._wm) P._wm -= dt; if (P._wm < 0) P._wm = 0;
  pushOut(P.pos, .5);
  P.vy -= 20 * dt; P.pos.y += P.vy * dt; const g2 = groundH(P.pos.x, P.pos.z); if (P.pos.y <= g2) { P.pos.y = g2; P.vy = 0; P.grounded = true; } else P.grounded = P.pos.y - g2 < .05;
  if (l > 0 && P.grounded) { P.bob += dt * spd * 1.5; P.stepT -= dt; if (P.stepT <= 0) { P.stepT = sp ? .3 : .45; sfx.step(); } }
  camera.position.set(P.pos.x, P.pos.y + 1.7 + Math.sin(P.bob) * .035 * (l > 0 && !OPTIONS.reducedMotion ? 1 : 0), P.pos.z); camera.quaternion.setFromEuler(_e.set(P.pitch, P.yaw, 0, 'YXZ'));
  const tf = zm ? WEAP[P.weapon].zoom : 76 + (sp && fw > 0 && !OPTIONS.reducedMotion ? 5 : 0); camera.fov += (tf - camera.fov) * clamp(dt * 8, 0, 1); camera.updateProjectionMatrix();
  P.fireT -= dt; const w = WEAP[P.weapon];
  if (P.thCD > 0) P.thCD -= dt; if (P.flashT > 0) P.flashT -= dt;
  if (P.chant > 0) { P.chant -= dt; if (P.chant <= 0) thunderStrike(); }
  if (VM.spin) VM.spin.rotation.z += dt * (P.weapon === 8 && mouse.l ? 40 : 2);
  if (VM.sun) VM.sun.scale.setScalar(.1 + Math.sin(gameT * 8) * .015); if (VM.storm) VM.storm.scale.setScalar(.06 + Math.random() * .03);
  if (P.chant > 0) { /* channeling */ } else if (mouse.l && (w.auto || !P._held)) footFire(); P._held = mouse.l;
  if (VM.blade) VM.blade.material.emissive.setHex(P.chant > 0 ? 0xaaccff : 0x3050ff);
  if (P.swing > 0) { P.swing -= dt; if (!P.swingHit && P.swing < .22) { P.swingHit = true; swordHit(); } }
  VM.kick = Math.max(0, VM.kick - dt * 9); if (VM.flashT > 0) { VM.flashT -= dt; if (VM.flashT <= 0) VM.flash.visible = false; }
  const g = VM.list[P.weapon]; const sw = P.swing > 0 ? Math.sin((1 - P.swing / .4) * Math.PI) : 0, rl = 0, ch = P.chant > 0 ? Math.sin(clamp(1 - P.chant / 1.5, 0, 1) * Math.PI * .5) : 0;
  vmRoot.position.set(.27 - sw * .35 - ch * .2, -.25 + ch * .25 + Math.sin(P.bob * 2) * .004, -.52 + VM.kick * .06); vmRoot.rotation.set(VM.kick * .05 - sw * .5 + ch * .9, sw * 1.1, sw * -.9);
  TGT.pos.set(P.pos.x, P.pos.y + 1.2, P.pos.z); TGT.vel.set(vx / dt || 0, 0, vz / dt || 0); TGT.jet = false; TGT.r = 1.1; TGT.alive = P.hp > 0;
  const nj = nearestJet(); P.near = nj;
}

/* ---------------------------------------------------------------- update: flying */
function updateFly(dt) {
  const j = P.jet, inv = P.invert ? -1 : 1;
  stick.x = clamp(stick.x + mouse.dx * .0042 * OPTIONS.sensitivity / 100, -1, 1); stick.y = clamp(stick.y + mouse.dy * .0042 * inv * OPTIONS.sensitivity / 100, -1, 1);
  const rx = Math.exp(-dt * .9); stick.x *= rx; stick.y *= rx;
  JI.pitch = clamp(((keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0)) * inv + stick.y, -1, 1);
  JI.roll = clamp((keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + stick.x, -1, 1);
  JI.thr = (keys.ShiftLeft || keys.ShiftRight ? 1 : 0) - (keys.KeyZ ? 1 : 0); JI.brake = !!keys.KeyB; JI.fire = !!(keys.Space || mouse.l);
  flyJet(j, dt, JI); if (P.mode !== 'jet') return;
  rearm(j, dt);
  jetCamera(j, dt, P.cockpit);
  TGT.pos.copy(j.pos); TGT.vel.copy(j.vel); TGT.jet = true; TGT.r = j.d.radius; TGT.alive = j.alive;
  updateLock(j, dt); lockAudio(dt, j);
}
let lockBeepT = 0;
function lockAudio(dt, j) {
  lockBeepT -= dt; if (LOCK.t && LOCK.p >= 1) { if (lockBeepT <= 0) { sfx.beep(1800, .05); lockBeepT = .12; } } else if (LOCK.c && LOCK.p > 0 && lockBeepT <= 0) { sfx.beep(900, .05); lockBeepT = .5 - LOCK.p * .35; }
  const f = _f.set(0, 0, -1).applyQuaternion(j.q), ahead = j.pos.clone().addScaledVector(j.vel, 4); const gh = Math.max(groundH(ahead.x, ahead.z), 0);
  j.warn = !j.onGround && j.alive && (ahead.y - 8 < gh || j.pos.y - Math.max(groundH(j.pos.x, j.pos.z), 0) < 25 && j.vel.y < -12);
  j.stall = !j.onGround && j.vel.length() < j.d.vr * .6; if ((j.warn || j.stall) && (j._wt = (j._wt || 0) - dt) <= 0) { j._wt = .7; sfx.warn(); }
}

/* ---------------------------------------------------------------- state changes */
const KEYHELP = `
<p><span class="k">Alt</span>+<span class="k">Enter</span> toggles full screen. Press <span class="k">Tab</span> in game for the controls list at any time.</p><p class="sec">ON FOOT</p>
<p><span class="k">W A S D</span> move &nbsp; <span class="k">Mouse</span> look &nbsp; <span class="k">Shift</span> sprint &nbsp; <span class="k">Space</span> jump &nbsp; <span class="k">LMB</span> fire &nbsp; <span class="k">1</span>-<span class="k">0</span> <span class="k">-</span> <span class="k">=</span> AK-47, M416, sniper, RPG-7, M1911, magnum, shotgun, Sword of Omens (RMB: Thunder-Cats!) and 4 super weapons &nbsp; <b>infinite health &amp; ammo</b></p>
<p><span class="k">E</span> board a parked jet (walk up to it) &nbsp; <span class="k">M</span> map &nbsp; <span class="k">N</span> cycle navigation waypoint</p>
<p class="sec">IN THE JET</p>
<p><span class="k">Shift</span> throttle up &nbsp; <span class="k">Z</span> throttle down &nbsp; <span class="k">X</span> idle &nbsp; <span class="k">Wheel</span> throttle &nbsp; <span class="k">B</span> brake / airbrake &nbsp; <span class="k">G</span> landing gear</p>
<p><span class="k">S</span> / <span class="k">W</span> pull up / push down &nbsp; <span class="k">A</span> / <span class="k">D</span> roll (steer on the ground) &nbsp; <span class="k">Mouse</span> stick &nbsp; <span class="k">I</span> invert &nbsp; <span class="k">L</span> flight assist</p>
<p><span class="k">Space</span> / <span class="k">LMB</span> cannon &nbsp; <span class="k">F</span> / <span class="k">RMB</span> missile &nbsp; <span class="k">T</span> cycle radar lock &nbsp; <span class="k">Q</span> flares &nbsp; <span class="k">V</span> cockpit view</p>
<p><b>Take off:</b> full throttle, hold <span class="k">S</span> past ~75 m/s, gear up with <span class="k">G</span>. <b>Land:</b> gear down, ~70-90 m/s, gentle descent, flat ground — then stop and press <span class="k">E</span>. Landing at a field re-arms and repairs.</p>`;
function showOverlay(h) { ov.innerHTML = h; ov.classList.remove('hide'); }
function hideOverlay() { if (ov.contains(document.activeElement)) document.activeElement.blur(); ov.classList.add('hide'); }
function closeHelp() { P.help = false; clearInput(); hideOverlay(); lockPointer(); }
function settingsPanel() {
  return `<details><summary>Sound &amp; comfort</summary><div class="settings">
<label>Volume<input data-option="volume" aria-label="Volume" type="range" min="0" max="100" value="${OPTIONS.volume}"><output>${OPTIONS.volume}%</output></label>
<label>Mouse sensitivity<input data-option="sensitivity" aria-label="Mouse sensitivity" type="range" min="25" max="200" value="${OPTIONS.sensitivity}"><output>${OPTIONS.sensitivity}%</output></label>
<label class="check"><input data-option="reducedMotion" type="checkbox" ${OPTIONS.reducedMotion ? 'checked' : ''}>Reduce camera shake, head bob &amp; flashes</label>
<p class="footnote">Settings save automatically on this device.</p></div></details>`;
}
ov.addEventListener('input', e => {
  const key = e.target.dataset.option; if (!Object.hasOwn(OPTIONS, key)) return;
  OPTIONS[key] = e.target.type === 'checkbox' ? e.target.checked : Number(e.target.value);
  const output = e.target.nextElementSibling; if (output) output.textContent = OPTIONS[key] + '%';
  if (master && AC) master.gain.setTargetAtTime(state === 'play' ? OPTIONS.volume / 100 : 0, AC.currentTime, .05);
  saveOptions();
});
function titleScreen() {
  state = 'title';
  showOverlay(`<div class="panel"><p class="eyebrow">A NIGHT FLIGHT OVER THE BLACK SEA</p><h1>NOSFERATU</h1><h2>Blood Moon Sorties</h2>
<p class="intro">Three islands. Three vampire Lords. Take a fighter into the blood moon and bring the dawn.</p>
<div class="steps"><div class="step"><b>01 / FIND YOUR FIGHTER</b><span>WASD to move. Follow the airfield guide, then press E beside a parked jet.</span></div>
<div class="step"><b>02 / TAKE TO THE SKY</b><span>Hold Shift for throttle. Hold S at takeoff speed. Press G to raise your gear.</span></div>
<div class="step"><b>03 / HUNT THE LORDS</b><span>Follow the gold waypoint. Aim to lock on, then F to launch a missile.</span></div></div>
<div class="actions"><button class="primary" data-action="start">Begin sortie <small>[Enter]</small></button></div>
<p class="footnote">Free-flight arsenal &bull; Infinite health and ammo &bull; Keyboard + mouse<br>Esc pauses &middot; M opens the map &middot; Tab shows controls</p>
${settingsPanel()}<details><summary>Full flight manual &amp; controls</summary>${KEYHELP}</details></div>`);
}
function startGame() {
  initAudio(); hideOverlay(); state = 'play'; last = performance.now();
  const s = ISL[0], [x, z] = afw(s, -400, 85); P.pos.set(x, groundH(x, z), z); P.yaw = yawOf(s.x - x, s.z - z); switchWeapon(0); P.weapon = -1; switchWeapon(0);
  addMsg('Walk to the parked jets and press E to board. Press M for the map, Tab for all controls.', 8); addMsg('Objective: slay the 3 Nosferatu Lords', 8);
  lockPointer();
}
function pause() {
  if (state !== 'play') return; state = 'pause'; P.map = P.help = false; clearInput();
  if (document.pointerLockElement) document.exitPointerLock();
  if (master && AC) master.gain.setTargetAtTime(0, AC.currentTime, .05);
  showOverlay(`<div class="panel"><p class="eyebrow">SORTIE ON HOLD</p><h1>PAUSED</h1><p class="intro">${P.lords}/3 Lords slain &middot; ${P.kills} kills &middot; ${P.score} points</p>
<div class="actions"><button class="primary" data-action="resume">Resume sortie <small>[Esc]</small></button></div>
${settingsPanel()}<details><summary>Flight manual &amp; controls</summary>${KEYHELP}</details></div>`);
}
function resume() { clearInput(); initAudio(); if (master && AC) master.gain.setTargetAtTime(OPTIONS.volume / 100, AC.currentTime, .05); hideOverlay(); state = 'play'; last = performance.now(); lockPointer(); }
function die(by) {
  state = 'dead'; if (document.exitPointerLock) document.exitPointerLock();
  showOverlay(`<h1>YOU HAVE BEEN CLAIMED</h1><h2>The night is long</h2><p>Kills: ${P.kills} &nbsp; Score: ${P.score} &nbsp; Lords slain: ${P.lords}/3</p><div class="go">— click to rise again —</div>`);
}
function win() {
  if (state !== 'play') return; state = 'win'; if (document.exitPointerLock) document.exitPointerLock();
  showOverlay(`<h1 style="color:#e8c860">DAWN BREAKS</h1><h2>The three Lords are dust</h2><p>Kills: ${P.kills} &nbsp; Score: ${P.score}</p><div class="go">— click to fly again —</div>`);
}
ov.addEventListener('click', e => {
  const action = e.target.closest('[data-action]');
  if (action && action.dataset.action === 'start' && state === 'title') startGame();
  else if (action && action.dataset.action === 'resume' && state === 'pause') resume();
  else if (action && action.dataset.action === 'close-help' && P.help) closeHelp();
  else if (state === 'dead' || state === 'win') location.reload();
});

/* ---------------------------------------------------------------- HUD helpers */
const HG = '#7dffb4', HR = '#ff5a5a', HY = '#ffd35a';
const _s = new V3();
function scr(v) { _s.copy(v).project(camera); return [(_s.x * .5 + .5) * SW, (-_s.y * .5 + .5) * SH, _s.z < 1]; }
function txt(s, x, y, size, col, al, bold) { hx.font = (bold ? 'bold ' : '') + size + 'px Consolas, "Courier New", monospace'; hx.fillStyle = col || HG; hx.textAlign = al || 'left'; hx.fillText(s, x, y); }
function mapMarkers(c, k, wantEnemies, px, pz, range) {
  for (const j of jets) { if (!j.alive) continue; if (j === P.jet) continue; c.fillStyle = j.type === 'f14' ? '#66ccff' : j.type === 'f18' ? '#ffcc66' : '#cc99ff'; const r = 4.5 / k; c.fillRect(j.pos.x - r / 2, j.pos.z - r / 2, r, r); }
  for (const e of enemies) {
    if (!e.alive) continue; const d = e.def;
    if (d.boss) { c.fillStyle = '#ff2030'; c.font = (18 / k) + 'px sans-serif'; c.textAlign = 'center'; c.fillText('☠', e.pos.x, e.pos.z + 6 / k); continue; }
    if (!wantEnemies || Math.hypot(e.pos.x - px, e.pos.z - pz) > range) continue;
    c.fillStyle = d.air ? '#ff9a30' : d.hover ? '#9fe8ff' : '#ff4a4a'; const r = (d.air ? 3.2 : 2.6) / k; c.fillRect(e.pos.x - r / 2, e.pos.z - r / 2, r, r);
  }
  const nt = navTarget(); if (nt) { c.save(); c.translate(nt.x, nt.z); c.rotate(Math.PI / 4); c.strokeStyle = HY; c.lineWidth = 2 / k; const r = 6 / k; c.strokeRect(-r / 2, -r / 2, r, r); c.restore(); }
  for (const m of EB) { c.fillStyle = '#ff2040'; const r = 2 / k; c.fillRect(m.pos.x - r / 2, m.pos.z - r / 2, r, r); }
}
function heading() { if (P.mode === 'jet' && P.jet) { const f = _f.set(0, 0, -1).applyQuaternion(P.jet.q); return Math.atan2(f.x, -f.z); } return -P.yaw; }
function playerXZ() { return P.mode === 'jet' && P.jet ? P.jet.pos : P.pos; }
function drawMinimap() {
  const R = Math.min(96, SH * .13), cx = 24 + R, cy = SH - 24 - R, range = P.mode === 'jet' ? 3600 : 450, k = R / range, h = heading(), pp = playerXZ();
  hx.save(); hx.beginPath(); hx.arc(cx, cy, R, 0, TAU); hx.clip(); hx.fillStyle = '#04101c'; hx.fillRect(cx - R, cy - R, R * 2, R * 2);
  hx.translate(cx, cy); hx.rotate(-h); hx.scale(k, k); hx.translate(-pp.x, -pp.z); hx.globalAlpha = .9; hx.drawImage(MAPIMG, MAPB.x0, MAPB.z0, MAPB.w, MAPB.h); hx.globalAlpha = 1;
  mapMarkers(hx, k, true, pp.x, pp.z, range); hx.restore();
  hx.strokeStyle = HG; hx.globalAlpha = .7; hx.lineWidth = 2; hx.beginPath(); hx.arc(cx, cy, R, 0, TAU); hx.stroke(); hx.globalAlpha = .3; hx.beginPath(); hx.arc(cx, cy, R / 2, 0, TAU); hx.stroke(); hx.globalAlpha = 1;
  hx.fillStyle = '#fff'; hx.beginPath(); hx.moveTo(cx, cy - 7); hx.lineTo(cx + 5, cy + 6); hx.lineTo(cx, cy + 3); hx.lineTo(cx - 5, cy + 6); hx.fill();
  txt('N', cx + Math.sin(-h) * (R - 10), cy - Math.cos(-h) * (R - 10) + 4, 12, '#ffcc66', 'center', true);
  txt((range / 1000).toFixed(range < 1000 ? 2 : 1) + ' km', cx, cy + R + 14, 11, HG, 'center');
}
function drawFullMap() {
  const k = Math.min(SW * .86 / MAPB.w, SH * .8 / MAPB.h), w = MAPB.w * k, h = MAPB.h * k, x0 = (SW - w) / 2, y0 = (SH - h) / 2 + 10;
  hx.fillStyle = 'rgba(0,6,12,.86)'; hx.fillRect(0, 0, SW, SH); hx.save(); hx.translate(x0, y0); hx.scale(k, k); hx.translate(-MAPB.x0, -MAPB.z0); hx.drawImage(MAPIMG, MAPB.x0, MAPB.z0, MAPB.w, MAPB.h);
  hx.strokeStyle = 'rgba(255,255,255,.08)'; hx.lineWidth = 1 / k; for (let g = -2000; g <= 4000; g += 1000) { hx.beginPath(); hx.moveTo(g, MAPB.z0); hx.lineTo(g, MAPB.z0 + MAPB.h); hx.stroke(); hx.beginPath(); hx.moveTo(MAPB.x0, g); hx.lineTo(MAPB.x0 + MAPB.w, g); hx.stroke(); }
  const pp = playerXZ(); mapMarkers(hx, k, true, pp.x, pp.z, 3600);
  hx.strokeStyle = 'rgba(125,255,180,.25)'; hx.lineWidth = 1 / k; hx.beginPath(); hx.arc(pp.x, pp.z, 3600, 0, TAU); hx.stroke();
  hx.save(); hx.translate(pp.x, pp.z); hx.rotate(heading()); const r = 11 / k; hx.fillStyle = '#fff'; hx.beginPath(); hx.moveTo(0, -r); hx.lineTo(r * .7, r * .8); hx.lineTo(0, r * .4); hx.lineTo(-r * .7, r * .8); hx.fill(); hx.restore();
  hx.restore();
  for (const s of ISL) { const [sx, sy] = [x0 + (s.x - MAPB.x0) * k, y0 + (s.z - MAPB.z0) * k]; txt(s.name, sx, sy - 70 * k * 6 / 6 - 14, 15, '#f2e8c4', 'center', true); }
  const nt = navTarget(); if (nt) { const dd = Math.hypot(nt.x - pp.x, nt.z - pp.z); txt('WAYPOINT: ' + nt.name + '  ' + (dd / 1000).toFixed(2) + ' km  brg ' + String((Math.round(Math.atan2(nt.x - pp.x, -(nt.z - pp.z)) / DEG) + 360) % 360).padStart(3, '0'), SW / 2, y0 - 8, 14, HY, 'center', true); }
  txt('NAVIGATION MAP   [M] close   [N] cycle waypoint', SW / 2, SH - 18, 14, HG, 'center');
  const leg = [['#66ccff', 'F-14'], ['#ffcc66', 'F-18'], ['#cc99ff', 'F-22'], ['#ff9a30', 'flyer'], ['#ff4a4a', 'ground'], ['#9fe8ff', 'ghost'], ['#ff2030', '☠ Lord']]; let lx = x0;
  leg.forEach(([c, n]) => { hx.fillStyle = c; hx.fillRect(lx, y0 + h + 8, 10, 10); txt(n, lx + 14, y0 + h + 17, 12, '#cfc6b4'); lx += 80; });
}
function drawCompass() {
  const cx = SW / 2, w = Math.min(520, SW * .5), h = heading() / DEG, y = 30; hx.save(); hx.beginPath(); hx.rect(cx - w / 2, y - 18, w, 36); hx.clip();
  const ppd = w / 90; hx.strokeStyle = HG; hx.fillStyle = HG; hx.lineWidth = 1.5; hx.font = 'bold 13px Consolas, monospace'; hx.textAlign = 'center';
  for (let d = Math.floor(h / 5) * 5 - 50; d <= h + 50; d += 5) { const x = cx + (d - h) * ppd, dd = ((d % 360) + 360) % 360; hx.beginPath(); hx.moveTo(x, y + 4); hx.lineTo(x, y + (dd % 15 === 0 ? -4 : 0)); hx.stroke(); if (dd % 45 === 0) hx.fillText({ 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' }[dd], x, y - 8); else if (dd % 15 === 0) { hx.font = '11px Consolas, monospace'; hx.fillText(dd, x, y - 8); hx.font = 'bold 13px Consolas, monospace'; } }
  const nt = navTarget(), pp = playerXZ(); if (nt) { let b = Math.atan2(nt.x - pp.x, -(nt.z - pp.z)) / DEG, d = ((b - h + 540) % 360) - 180; d = clamp(d, -45, 45); hx.fillStyle = HY; hx.beginPath(); const x = cx + d * ppd; hx.moveTo(x, y + 14); hx.lineTo(x - 6, y + 22); hx.lineTo(x + 6, y + 22); hx.fill(); }
  hx.restore(); hx.strokeStyle = HG; hx.beginPath(); hx.moveTo(cx, y + 8); hx.lineTo(cx - 5, y + 16); hx.lineTo(cx + 5, y + 16); hx.closePath(); hx.stroke();
  txt(String(Math.round((h + 360) % 360)).padStart(3, '0'), cx, y + 36, 14, HG, 'center', true);
}
function drawCommon() {
  drawCompass(); drawMinimap();
  const a = P.mode === 'jet' && P.jet ? ISL[islandAt(P.jet.pos.x, P.jet.pos.z)] : ISL[islandAt(P.pos.x, P.pos.z)];
  txt('OBJECTIVE  Slay the Nosferatu Lords  ' + P.lords + '/3', 24, 28, 14, P.lords >= 3 ? HY : HG, 'left', true);
  txt('LOCATION  ' + (a ? a.name : 'OPEN SEA'), 24, 48, 13, HG); txt('KILLS ' + P.kills + '   SCORE ' + P.score, 24, 66, 13, HG);
  const nt = navTarget(); if (nt) { const pp = playerXZ(); txt('WPT ' + nt.name + '  ' + (Math.hypot(nt.x - pp.x, nt.z - pp.z) / 1000).toFixed(1) + ' km', 24, 84, 13, HY); }
  // waypoint marker in world
  if (nt) { const [x, y, ok] = scr(_g.set(nt.x, 80, nt.z)); if (ok && x > 20 && x < SW - 20 && y > 60 && y < SH - 20) { hx.strokeStyle = HY; hx.lineWidth = 2; hx.save(); hx.translate(x, y); hx.rotate(Math.PI / 4); hx.strokeRect(-7, -7, 14, 14); hx.restore(); txt(nt.name, x, y - 16, 11, HY, 'center'); } }
  // boss bar
  let lord = null, ld = 1e9; for (const e of enemies) if (e.alive && e.def.boss && e.dist < 2600 && e.dist < ld) { ld = e.dist; lord = e; }
  if (lord) { const w = Math.min(420, SW * .4), x = SW / 2 - w / 2, y = 78; hx.fillStyle = 'rgba(0,0,0,.55)'; hx.fillRect(x - 2, y - 2, w + 4, 14); hx.fillStyle = '#b01020'; hx.fillRect(x, y, w * lord.hp / lord.maxhp, 10); txt('NOSFERATU LORD  ' + Math.round(lord.dist) + ' m', SW / 2, y + 26, 12, '#ff8080', 'center', true); }
  // messages
  msgs.forEach((m, i) => { hx.globalAlpha = clamp(m.t / .6, 0, 1); txt(m.text, SW / 2, SH * .72 + i * 20, 15, '#f0e8c8', 'center', true); }); hx.globalAlpha = 1;
  // hurt vignette
  if (P.hurtT > 0) { const g = hx.createRadialGradient(SW / 2, SH / 2, SH * .3, SW / 2, SH / 2, SH * .8); g.addColorStop(0, 'rgba(160,0,0,0)'); g.addColorStop(1, 'rgba(160,0,0,' + (P.hurtT * 1.2) + ')'); hx.fillStyle = g; hx.fillRect(0, 0, SW, SH); }
}
function drawFootHUD() {
  drawGuide();
  const cx = SW / 2, cy = SH / 2, w = WEAP[P.weapon];
  hx.strokeStyle = 'rgba(240,235,210,.85)'; hx.lineWidth = 2; if (w.t !== 'sword') { hx.beginPath(); hx.moveTo(cx - 12, cy); hx.lineTo(cx - 4, cy); hx.moveTo(cx + 4, cy); hx.lineTo(cx + 12, cy); hx.moveTo(cx, cy - 12); hx.lineTo(cx, cy - 4); hx.moveTo(cx, cy + 4); hx.lineTo(cx, cy + 12); hx.stroke(); } else { hx.beginPath(); hx.arc(cx, cy, 3, 0, TAU); hx.stroke(); }
  if (P.hitT > 0) { hx.strokeStyle = P.hitKill ? '#ff3030' : '#fff'; hx.lineWidth = 2.5; hx.beginPath(); for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { hx.moveTo(cx + a * 7, cy + b * 7); hx.lineTo(cx + a * 15, cy + b * 15); } hx.stroke(); }
  const bw = 220, bx0 = SW - bw - 28, by = SH - 56;
  hx.fillStyle = 'rgba(0,0,0,.5)'; hx.fillRect(bx0 - 2, by - 2, bw + 4, 18); hx.fillStyle = P.hp > 35 ? '#c02a2a' : '#ff3030'; hx.fillRect(bx0, by, bw * clamp(P.hp / P.maxhp, 0, 1), 14); txt('HEALTH  ∞', bx0, by - 8, 13, '#e8d8c0', 'left', true);
  txt(w.name, SW - 28, SH - 100, 16, '#e8d8c0', 'right', true);
  if (w.t !== 'sword') txt('AMMO  ∞', SW - 28, SH - 78, 22, w.sup ? '#80f0ff' : '#e8d8c0', 'right', true); else txt(P.thCD > 0 ? 'THUNDER recharging' : 'THUNDER ready (RMB)', SW - 28, SH - 78, 16, P.thCD > 0 ? HR : HY, 'right', true);
  txt('1-9 0 - =  /  wheel  /  Q ]  switch weapon', SW - 28, SH - 120, 11, '#9a927e', 'right');
  if (P.flashT > 0 && !OPTIONS.reducedMotion) { hx.fillStyle = 'rgba(220,235,255,' + clamp(P.flashT * 1.6, 0, .8) + ')'; hx.fillRect(0, 0, SW, SH); }
  if (w.zoom && mouse.r) { const R = Math.min(SW, SH) * .42; hx.fillStyle = '#000'; hx.beginPath(); hx.rect(0, 0, SW, SH); hx.arc(cx, cy, R, 0, TAU, true); hx.fill(); hx.strokeStyle = '#000'; hx.lineWidth = 2; hx.beginPath(); hx.moveTo(cx - R, cy); hx.lineTo(cx + R, cy); hx.moveTo(cx, cy - R); hx.lineTo(cx, cy + R); hx.stroke(); }
  if (P.near && !P.map) { const j = P.near; txt('[E] BOARD ' + j.d.name, cx, SH * .62, 20, HY, 'center', true); txt(j.d.blurb, cx, SH * .62 + 22, 13, '#cfc6b4', 'center'); }
  // threat indicator: nearby monsters
  const near = enemies.filter(e => e.alive && e.dist < 60).length; if (near) txt('HOSTILES NEARBY: ' + near, cx, SH - 24, 14, HR, 'center', true);
}
function drawJetHUD() {
  drawGuide();
  const j = P.jet; if (!j) return; const d = j.d, f = _f.set(0, 0, -1).applyQuaternion(j.q).clone(), up = _u.set(0, 1, 0).applyQuaternion(j.q).clone(), rt = _r.set(1, 0, 0).applyQuaternion(j.q).clone();
  const pitch = Math.asin(clamp(f.y, -1, 1)), roll = Math.atan2(rt.y, up.y), spd = j.vel.length(), gh = Math.max(groundH(j.pos.x, j.pos.z), 0), agl = j.pos.y - d.gearH - gh;
  const [nx, ny] = scr(_g.copy(j.pos).addScaledVector(f, 1200)), cx = SW / 2, ppr = SH / (camera.fov * DEG) * 1.0;
  hx.strokeStyle = HG; hx.fillStyle = HG; hx.lineWidth = 1.6;
  // pitch ladder
  hx.save(); hx.beginPath(); hx.rect(cx - 230, SH / 2 - 190, 460, 380); hx.clip(); hx.translate(nx, ny); hx.rotate(-roll);
  for (let a = -90; a <= 90; a += 10) { const y = -(a * DEG - pitch) * ppr * 1; if (Math.abs(y) > 260) continue; const wd = a === 0 ? 170 : 50;
    hx.globalAlpha = a === 0 ? .9 : .6; hx.beginPath(); if (a < 0) { hx.setLineDash([6, 5]); } else hx.setLineDash([]); hx.moveTo(-wd, y); hx.lineTo(-22, y); hx.moveTo(22, y); hx.lineTo(wd, y); if (a !== 0) { hx.moveTo(-wd, y); hx.lineTo(-wd, y + (a > 0 ? 8 : -8)); hx.moveTo(wd, y); hx.lineTo(wd, y + (a > 0 ? 8 : -8)); } hx.stroke(); hx.setLineDash([]);
    if (a !== 0) { hx.font = '11px Consolas, monospace'; hx.textAlign = 'left'; hx.fillText(Math.abs(a), wd + 5, y + 4); hx.textAlign = 'right'; hx.fillText(Math.abs(a), -wd - 5, y + 4); } }
  hx.restore(); hx.globalAlpha = 1;
  // gun pipper at nose line
  hx.beginPath(); hx.arc(nx, ny, 3, 0, TAU); hx.moveTo(nx - 14, ny); hx.lineTo(nx - 6, ny); hx.moveTo(nx + 6, ny); hx.lineTo(nx + 14, ny); hx.moveTo(nx, ny - 14); hx.lineTo(nx, ny - 6); hx.stroke();
  // flight-path marker
  if (spd > 15) { const [vx, vy, ok] = scr(_g.copy(j.pos).addScaledVector(j.vel, 1200 / spd)); if (ok) { hx.beginPath(); hx.arc(vx, vy, 8, 0, TAU); hx.moveTo(vx - 20, vy); hx.lineTo(vx - 8, vy); hx.moveTo(vx + 8, vy); hx.lineTo(vx + 20, vy); hx.moveTo(vx, vy - 8); hx.lineTo(vx, vy - 14); hx.stroke(); } }
  // speed / altitude boxes
  const sx = SW / 2 - 250, ax = SW / 2 + 250, my = SH / 2;
  hx.strokeStyle = HG; hx.strokeRect(sx - 56, my - 14, 70, 28); hx.strokeRect(ax - 14, my - 14, 78, 28); txt(String(Math.round(spd * 1.944)), sx - 6, my + 7, 20, HG, 'right', true); txt(String(Math.round(j.pos.y)), ax + 58, my + 7, 20, HG, 'right', true);
  txt('KTS', sx - 56, my - 20, 11, HG); txt('ALT m', ax - 14, my - 20, 11, HG); txt('AGL ' + Math.round(agl), ax + 64, my + 28, 12, agl < 120 ? HY : HG, 'right'); txt((j.vel.y >= 0 ? '+' : '') + Math.round(j.vel.y) + ' m/s', ax + 64, my + 44, 12, j.vel.y < -12 && agl < 300 ? HR : HG, 'right');
  txt('M ' + (spd / 340).toFixed(2), sx - 56, my + 34, 12, HG);
  // throttle
  const tx = SW / 2 - 330, ty = SH / 2 + 30; hx.strokeStyle = HG; hx.strokeRect(tx, ty, 12, 100); hx.fillStyle = j.throttle > .92 ? HY : HG; hx.fillRect(tx + 2, ty + 100 - 98 * j.throttle, 8, 98 * j.throttle); txt('THR', tx - 2, ty - 6, 11, HG); txt(Math.round(j.throttle * 100) + (j.throttle > .92 ? ' AB' : ''), tx - 2, ty + 116, 12, j.throttle > .92 ? HY : HG);
  // weapons panel (bottom right)
  const px = SW - 28; let py = SH - 110;
  txt(d.name, px, py, 18, HG, 'right', true); txt('CANNON  ∞', px, py + 22, 15, HG, 'right'); txt(d.mslName + '  ∞', px, py + 42, 15, HG, 'right');
  const hp = clamp(j.hp / d.hp, 0, 1); hx.fillStyle = 'rgba(0,0,0,.5)'; hx.fillRect(px - 182, py + 52, 184, 14); hx.fillStyle = hp > .35 ? '#2fcf7a' : '#ff4040'; hx.fillRect(px - 180, py + 54, 176 * hp, 10); txt('HULL ∞', px - 186, py + 64, 12, HG, 'right');
  txt('GEAR ' + (j.gearT > .95 ? 'DOWN' : j.gearT < .05 ? 'UP' : '...'), px, py + 84, 13, j.gearT > .95 && agl < 600 && !j.onGround ? HY : HG, 'right'); txt('FLARES ' + P.flares, px, py + 100, 12, HG, 'right');
  if (j.rearming) txt('REARMING / REPAIRING', SW / 2, SH * .8, 18, HY, 'center', true);
  // radar lock overlays
  for (const o of LOCK.list.slice(0, 8)) { const e = o.e; if (e === LOCK.t) continue; const [x, y, ok] = scr(enemyCenter(e, _g)); if (!ok) continue; const c = e === LOCK.c ? HY : 'rgba(125,255,180,.55)'; hx.strokeStyle = c; hx.lineWidth = 1.5; const s = 14; hx.strokeRect(x - s, y - s, s * 2, s * 2); if (e === LOCK.c) { const p = 1 - LOCK.p, s2 = 14 + 40 * p; hx.strokeRect(x - s2, y - s2, s2 * 2, s2 * 2); } }
  const t = LOCK.t; if (t && t.alive) {
    enemyCenter(t, _g); const dist = _g.distanceTo(j.pos), [x, y, ok] = scr(_g);
    if (ok) {
      hx.strokeStyle = HR; hx.lineWidth = 2.5; const s = 22; hx.beginPath(); for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { hx.moveTo(x + a * s, y + b * s * .4); hx.lineTo(x + a * s, y + b * s); hx.lineTo(x + a * s * .4, y + b * s); } hx.stroke();
      hx.beginPath(); hx.moveTo(x, y - s - 6); hx.lineTo(x + 6, y - s - 14); hx.lineTo(x - 6, y - s - 14); hx.closePath(); hx.stroke();
      txt(t.def.name.toUpperCase() + '  ' + (dist / 1000).toFixed(2) + ' km', x, y + s + 18, 12, HR, 'center', true);
      const tt = dist / 1150, [lx, ly, ok2] = scr(_s.copy(_g).addScaledVector(t.vel, tt).addScaledVector(j.vel, -tt * .0)); // lead cue (cannon)
      if (ok2) { hx.strokeStyle = HY; hx.lineWidth = 1.5; hx.beginPath(); hx.arc(lx, ly, 10, 0, TAU); hx.stroke(); hx.beginPath(); hx.moveTo(x, y); hx.lineTo(lx, ly); hx.globalAlpha = .4; hx.stroke(); hx.globalAlpha = 1; }
    } else { const a = Math.atan2(y - SH / 2, x - SW / 2) + (ok ? 0 : Math.PI); }
    txt('LOCKED — ' + '[F] FIRE', SW / 2, SH * .22, 20, HR, 'center', true);
  } else if (LOCK.c && LOCK.p > 0) txt('ACQUIRING ' + Math.round(LOCK.p * 100) + '%', SW / 2, SH * .22, 16, HY, 'center', true);
  // threats: enemy flyers behind / offscreen and incoming bolts
  let arrows = 0;
  for (const e of enemies) {
    if (!e.alive || !e.def.air || e.kind === 'bat' || e.dist > 1300 || arrows > 6) continue; const [x, y, ok] = scr(enemyCenter(e, _g)); const on = ok && x > 40 && x < SW - 40 && y > 40 && y < SH - 40; if (on) continue; arrows++;
    const dx = x - SW / 2, dy = y - SH / 2, a = ok ? Math.atan2(dy, dx) : Math.atan2(-dy, -dx), r = Math.min(SW, SH) * .42; hx.save(); hx.translate(SW / 2 + Math.cos(a) * r, SH / 2 + Math.sin(a) * r); hx.rotate(a); hx.fillStyle = e.def.boss ? HR : 'rgba(255,154,48,.8)'; hx.beginPath(); hx.moveTo(10, 0); hx.lineTo(-6, 7); hx.lineTo(-6, -7); hx.fill(); hx.restore();
  }
  let inc = null, id = 600; for (const b of EB) { if (b.hom <= 0) continue; const dd = b.pos.distanceTo(j.pos); if (dd < id) { id = dd; inc = b; } }
  if (inc && (Math.floor(gameT * 6) & 1)) txt('⚠ INCOMING  ' + Math.round(id) + ' m — [Q] FLARES', SW / 2, SH * .3, 20, HR, 'center', true);
  if (j.warn && (Math.floor(gameT * 5) & 1)) txt('PULL UP', SW / 2, SH * .38, 34, HR, 'center', true);
  if (j.stall && !j.onGround && (Math.floor(gameT * 4) & 1)) txt('STALL', SW / 2, SH * .45, 26, HY, 'center', true);
  if (j.onGround) txt(j.gs < 2 && j.throttle < .05 ? '[E] EXIT JET   Shift: throttle up' : 'TAKEOFF: hold S past ' + Math.round(j.d.vr) + ' m/s   (now ' + Math.round(j.gs) + ')', SW / 2, SH * .86, 15, HY, 'center', true);
}

const HELP = [
  ['ON FOOT', [['W A S D', 'Move'], ['Mouse', 'Look'], ['Shift', 'Sprint'], ['Space', 'Jump'], ['Left click', 'Fire / swing blade'], ['Right click', 'Sword: THUNDER-CATS lightning / Sniper: zoom'], ['1-9, 0, -, =', 'AK-47, M416, Sniper, RPG-7, M1911, Magnum, Shotgun, Sword, then SUPER: Plasma Minigun, Railgun, Sun Cannon, Storm Caller'], ['Wheel / Q / ]', 'Previous / next weapon'], ['', 'Infinite health and ammo - no reloading'], ['E', 'Board a parked jet (walk up to it)']]],
  ['JET - FLYING', [['Shift', 'Throttle up (afterburner at max)'], ['Z', 'Throttle down'], ['X', 'Throttle idle'], ['Mouse wheel', 'Throttle'], ['S / W', 'Pull up / push down'], ['A / D', 'Roll (steers on the ground)'], ['Mouse', 'Virtual stick (pitch and roll)'], ['B', 'Brake / airbrake'], ['G', 'Landing gear up / down'], ['I', 'Invert pitch'], ['L', 'Flight assist (auto-level) on / off']]],
  ['JET - COMBAT', [['Space / Left click', 'Cannon'], ['F / Right click', 'Fire missile (needs lock to home)'], ['T', 'Cycle radar lock target'], ['Q', 'Flares (destroy homing blood bolts)'], ['V', 'Cockpit / chase view']]],
  ['TAKEOFF & LANDING', [['Takeoff', 'Full throttle, hold S past rotate speed, then G (gear up)'], ['Landing', 'Gear down, ~70-90 m/s, gentle descent, flat ground'], ['After landing', 'Stop, then E to exit. Fields re-arm and repair you']]],
  ['ANYWHERE', [['M', 'Full navigation map'], ['N', 'Cycle navigation waypoint'], ['Tab', 'This help'], ['Alt + Enter', 'Toggle full screen'], ['Esc', 'Pause / close']]]
];
function drawHelp() {
  hx.fillStyle = 'rgba(0,6,12,.84)'; hx.fillRect(0, 0, SW, SH);
  const cols = SW > 900 ? 2 : 1, colW = Math.min(560, (SW - 60) / cols), x0 = (SW - colW * cols) / 2, sz = Math.max(12, Math.min(15, SH / 48)), lh = sz * 1.45;
  txt('CONTROLS', SW / 2, 40, 24, HY, 'center', true);
  const heights = HELP.map(s => lh * (s[1].length + 1.8)); let col = 0, y = [64, 64];
  HELP.forEach((s, i) => {
    if (cols === 2 && col === 0 && y[0] > 64 && y[0] + heights[i] > SH - 60) col = 1; const x = x0 + col * colW; let yy = y[col] + lh;
    txt(s[0], x, yy, sz + 1, HG, 'left', true); yy += lh * .9;
    for (const [k, d] of s[1]) { txt(k, x + 8, yy, sz, '#ffe9a0', 'left', true); txt(d, x + colW * .34, yy, sz, '#d8d0bc'); yy += lh; }
    y[col] = yy + lh * .4;
  });
  txt('Press Tab to close', SW / 2, SH - 20, 14, HG, 'center');
}
function drawCockpitFrame() {
  if (P.cockpit && P.mode === 'jet') { const g = hx.createLinearGradient(0, SH * .7, 0, SH); g.addColorStop(0, 'rgba(8,10,14,0)'); g.addColorStop(1, 'rgba(8,10,14,.9)'); hx.fillStyle = g; hx.fillRect(0, SH * .7, SW, SH * .3); hx.fillStyle = '#0a0c10'; hx.beginPath(); hx.moveTo(0, 0); hx.lineTo(SW * .09, 0); hx.lineTo(SW * .02, SH); hx.lineTo(0, SH); hx.fill(); hx.beginPath(); hx.moveTo(SW, 0); hx.lineTo(SW * .91, 0); hx.lineTo(SW * .98, SH); hx.lineTo(SW, SH); hx.fill(); }
}
/* ---------------------------------------------------------------- main loop */
function drawGuide() {
  if (P.lords >= 3) return;
  let title, hint;
  if (P.mode === 'foot') {
    let jet = null, distance = Infinity;
    for (const j of jets) {
      if (!j.alive || j.occupied) continue;
      const d = Math.hypot(j.pos.x - P.pos.x, j.pos.z - P.pos.z);
      if (d < distance) { jet = j; distance = d; }
    }
    title = P.near ? 'BOARD YOUR FIGHTER' : 'REACH THE AIRFIELD';
    hint = P.near ? 'Press E to board ' + P.near.d.name : 'WASD move / Shift sprint';
    if (jet && !P.near) {
      const [x, y, ok] = scr(_g.copy(jet.pos));
      if (ok && x > 100 && x < SW - 100 && y > 180 && y < SH - 140) {
        txt('FIGHTER / ' + Math.round(distance) + ' m', x, y - 22, 13, HY, 'center', true);
        txt('v', x, y - 4, 18, HY, 'center');
      }
      const bearing = Math.atan2(jet.pos.x - P.pos.x, -(jet.pos.z - P.pos.z));
      const turn = angDiff(bearing, heading()) / DEG;
      hint = Math.round(distance) + ' m / ' + (Math.abs(turn) < 20 ? 'Ahead' : turn > 0 ? 'Turn right' : 'Turn left') + ' / Shift to sprint';
    }
  } else {
    const j = P.jet;
    if (j.onGround) {
      title = j.gs < j.d.vr ? 'BUILD TAKEOFF SPEED' : 'ROTATE';
      hint = j.gs < j.d.vr ? 'Hold Shift / target ' + Math.round(j.d.vr) + ' m/s' : 'Hold S to lift off';
    } else if (j.gearDown) { title = 'CLEAN UP FOR FLIGHT'; hint = 'Press G to raise landing gear'; }
    else if (!LOCK.t) { title = 'HUNT THE REMAINING LORDS'; hint = 'Gold waypoint / aim to lock / T cycle'; }
    else { title = 'TARGET LOCKED'; hint = 'F missile / Left click cannon / Q flares'; }
  }
  const width = Math.min(350, SW - 48);
  hx.fillStyle = 'rgba(6,12,19,.78)'; hx.fillRect(24, 108, width, 60);
  hx.fillStyle = HY; hx.fillRect(24, 108, 3, 60);
  txt(title, 36, 130, 13, HY, 'left', true);
  txt(hint, 36, 151, Math.min(12, (width - 24) / (hint.length * .61)), '#dfd9cb');
  txt('M map / Tab controls / Esc pause', SW / 2, SH - 6, 11, '#b8c8bc', 'center');
}
function update(dt) {
  gameT += dt; const t = gameT;
  if (victoryT > 0) { victoryT -= dt; if (victoryT <= 0) { win(); return; } }
  if (P.hurtT > 0) P.hurtT -= dt; if (P.hitT > 0) P.hitT -= dt;
  msgs.forEach(m => m.t -= dt); msgs = msgs.filter(m => m.t > 0);
  if (P.mode === 'foot') { VM.list.forEach((g, i) => g.visible = i === P.weapon); updateFoot(dt); } else { VM.list.forEach(g => g.visible = false); updateFly(dt); if (P.mode === 'foot') { updateFoot(dt); } }
  mouse.dx = mouse.dy = 0;
  updateJetsIdle(dt); for (const j of jets) jetVisuals(j, dt, t);
  if (P.mode !== 'jet') { LOCK.t = null; LOCK.c = null; LOCK.p = 0; LOCK.list.length = 0; }
  updateBullets(dt); updateMissiles(dt); updateEnemies(dt, t); updateFX(dt); updateWorld(t); updateOcean(t);
  sky.position.copy(camera.position);
  if (shakeAmt > .01 && !OPTIONS.reducedMotion) { camera.position.x += rand(-1, 1) * shakeAmt * .05; camera.position.y += rand(-1, 1) * shakeAmt * .05; shakeAmt *= Math.exp(-dt * 5); } else shakeAmt = 0;
  const j = P.jet; audioUpdate(P.mode === 'jet' && j, j ? j.throttle : 0, j ? j.vel.length() : 0);
}
function render() {
  renderer.render(scene, camera);
  hx.clearRect(0, 0, SW, SH);
  if (state === 'title') return;
  if (P.map) { drawFullMap(); return; }
  if (P.help) return;
  drawCockpitFrame(); drawCommon(); if (P.mode === 'jet') drawJetHUD(); else drawFootHUD();
}
function frame(now) {
  requestAnimationFrame(frame); const dt = Math.min((now - last) / 1000 || .016, .05); last = now;
  if (state === 'play' && !P.map && !P.help) update(dt);
  else if (state === 'title') { updateOcean(now / 1000); updateFX(dt); }
  if (master && AC) master.gain.setTargetAtTime(state === 'play' && !P.map && !P.help ? OPTIONS.volume / 100 : 0, AC.currentTime, .05);
  render();
}
/* title-screen backdrop: slow orbit over Blackmoor */
camera.position.set(-300, 60, -380); camera.lookAt(-420, 12, 40);
titleScreen();
setInterval(() => { try { fetch('/ping').catch(() => { }); } catch (e) { } }, 10000); try { fetch('/ping').catch(() => { }); } catch (e) { }
window.addEventListener('pagehide', () => { try { navigator.sendBeacon('/bye'); } catch (e) { } });
requestAnimationFrame(frame);

/* debug entry points (used for automated screenshots):  index.html#jet  #foot  #boss */
(function () {
  const h = location.hash; if (!h) return;
  noLock = true; state = 'play'; hideOverlay(); last = performance.now();
  const s = ISL[0], [x, z] = afw(s, -400, 85); P.pos.set(x, groundH(x, z), z); P.yaw = Math.atan2(-(s.x - x), -(s.z - z)); switchWeapon(0);
  if (h.includes('jet') || h.includes('boss')) {
    const j = jets.find(q => q.isl === 0 && q.type === (h.includes('f14') ? 'f14' : h.includes('f18') ? 'f18' : 'f22')); boardJet(j);
    j.onGround = false; j.gearDown = false; j.gearT = 0; j.pos.set(s.x - 300, 500, s.z); j.q.setFromAxisAngle(AY, yawOf(Math.cos(s.rot), Math.sin(s.rot))); j.vel.set(Math.cos(s.rot) * 220, 0, Math.sin(s.rot) * 220); j.throttle = .7; P.cockpit = h.includes('cock');
    if (h.includes('boss')) { const l = s.lord; j.pos.set(l.pos.x - 500, l.pos.y + 20, l.pos.z + 200); j.q.setFromAxisAngle(AY, yawOf(l.pos.x - j.pos.x, l.pos.z - j.pos.z)); j.vel.set(l.pos.x - j.pos.x, 0, l.pos.z - j.pos.z).setLength(220); }
  }
  if (h.includes('map')) P.map = true; if (h.includes('help')) P.help = true;
})();
