'use strict';
/* =====================================================================
   JETS: F-14 Tomcat, F/A-18 Hornet, F-22 Raptor — models, flight model,
   cannon, homing missiles, radar lock
   ===================================================================== */
const DEG = Math.PI / 180;
const JD = {
  f14: { key: 'f14', name: 'F-14 TOMCAT', msl: 8, mslName: 'AIM-54 PHOENIX', maxSpd: 315, vr: 76, thrust: 30, pitchR: 1.05, rollR: 2.5, hp: 170, ammo: 675, gearH: 2.2, cam: [0, 6.4, 27], cock: [0, 1.15, -5.0], radius: 9, mdmg: 260, blurb: 'Heavy interceptor. Swing wings, 8 long-range Phoenix missiles.' },
  f18: { key: 'f18', name: 'F/A-18 HORNET', msl: 6, mslName: 'AIM-120 AMRAAM', maxSpd: 295, vr: 68, thrust: 32, pitchR: 1.3, rollR: 3.4, hp: 140, ammo: 578, gearH: 2.1, cam: [0, 5.6, 24], cock: [0, 1.0, -4.3], radius: 8, mdmg: 220, blurb: 'Agile carrier fighter. Twin tails, balanced and forgiving.' },
  f22: { key: 'f22', name: 'F-22 RAPTOR', msl: 6, mslName: 'AIM-9X / 120D', maxSpd: 390, vr: 64, thrust: 44, pitchR: 1.5, rollR: 3.2, hp: 200, ammo: 480, gearH: 2.0, cam: [0, 5.8, 26], cock: [0, .95, -4.9], radius: 8, mdmg: 240, blurb: 'Stealth air-superiority fighter. Fastest and tougher than the rest.' }
};
const jm = (c, o) => new THREE.MeshPhongMaterial(Object.assign({ color: c, shininess: 45, specular: 0x333840, flatShading: true, side: THREE.DoubleSide }, o || {}));
function slabH(pts, th) {
  const s = new THREE.Shape(); pts.forEach(([x, z], i) => i ? s.lineTo(x, z) : s.moveTo(x, z)); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: false }); g.rotateX(Math.PI / 2); g.translate(0, th / 2, 0); return g;
}
function slabV(pts, th) {
  const s = new THREE.Shape(); pts.forEach(([z, y], i) => i ? s.lineTo(-z, y) : s.moveTo(-z, y)); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: false }); g.rotateY(Math.PI / 2); g.translate(-th / 2, 0, 0); return g;
}
function lathe(prof, sx, sy, segs) { const g = new THREE.LatheGeometry(prof.map(([z, r]) => new THREE.Vector2(r, -z)), segs || 14); g.rotateX(-Math.PI / 2); g.scale(sx, sy, 1); return g; }
function cylZ(rn, rt, len, seg) { const g = new THREE.CylinderGeometry(rt, rn, len, seg || 10); g.rotateX(Math.PI / 2); return g; }
const mirror = pts => pts.map(([x, z]) => [-x, z]);
function add(par, geo, mat, x, y, z) { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); par.add(m); return m; }
const mslWhite = jm(0xe4e6ea), mslRed = jm(0xb02020), mslDark = jm(0x2a2c30);
function mkMsl(len, r) {
  const g = new THREE.Group(); add(g, cylZ(r, r, len, 8), mslWhite, 0, 0, 0); add(g, cylZ(0.02, r, len * .22, 8), mslRed, 0, 0, -len * .61);
  for (let i = 0; i < 4; i++) { const f = add(g, new THREE.BoxGeometry(r * 5, .04, len * .16), mslDark, 0, 0, len * .38); f.rotation.z = i * Math.PI / 2; } return g;
}
const flameMat = () => new THREE.MeshBasicMaterial({ color: 0xff9a30, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false });
function flameGeo() { const g = new THREE.ConeGeometry(.6, 1, 10); g.rotateX(Math.PI / 2); g.translate(0, 0, .5); return g; }
function wheel(par, x, y, z, r, w) { const m = add(par, new THREE.CylinderGeometry(r, r, w, 10), jm(0x16171a), x, y, z); m.rotation.z = Math.PI / 2; }
function gearSet(topY, noseZ, mainX, mainZ, wy, r) {
  const g = new THREE.Group(); g.position.y = topY; const st = jm(0x9a9ea6);
  add(g, new THREE.CylinderGeometry(.07, .07, -wy + topY - .1 + 0 || 1, 6), st, 0, (wy - topY) / 2 + .1, noseZ); wheel(g, 0, wy - topY, noseZ, r * .8, .3);
  for (const s of [-1, 1]) { add(g, new THREE.CylinderGeometry(.09, .09, topY - wy, 6), st, s * mainX, (wy - topY) / 2, mainZ); wheel(g, s * mainX, wy - topY, mainZ, r, .4); }
  return g;
}
function finish(J, slots, visible, len, r) {
  J.slots = slots; J.msl = [];
  slots.forEach(([x, y, z]) => { const m = mkMsl(len, r); m.position.set(x, y, z); m.visible = visible; J.g.add(m); J.msl.push(m); });
  return J;
}
function buildF14() {
  const g = new THREE.Group(), gr = jm(0x8d949c), lt = jm(0xb7bdc4), dk = jm(0x1f2227), glass = jm(0x1d3552, { transparent: true, opacity: .85, shininess: 120, specular: 0xaaccff });
  const J = { g, wings: [], flames: [] };
  add(g, lathe([[9.2, .02], [8.2, .5], [6, .85], [2, .98], [-2, 1.0], [-5.5, .82], [-8, .42], [-9.9, .02]], 1.55, .8), gr);
  add(g, cylZ(.02, .05, 1.8, 5), dk, 0, 0, -10.6);
  for (const s of [-1, 1]) {
    add(g, cylZ(.85, .9, 9.5, 14), lt, s * 1.5, -.3, 3.8); add(g, cylZ(.78, .66, 1.3, 12), dk, s * 1.5, -.3, 9.0);
    add(g, new THREE.BoxGeometry(1.3, 1.35, 3), dk, s * 1.55, -.1, -2.3);
    const fl = add(g, flameGeo(), flameMat(), s * 1.5, -.3, 9.6); fl.scale.set(1, 1, 3); J.flames.push(fl);
    add(g, slabH(s > 0 ? [[.8, -6.5], [2.7, -1.5], [2.7, .8], [.8, .8]] : mirror([[.8, -6.5], [2.7, -1.5], [2.7, .8], [.8, .8]]), .12), gr, 0, .12, 0);
    const piv = new THREE.Group(); piv.position.set(s * 2.3, .18, -1.6); g.add(piv); add(piv, slabH(s > 0 ? [[0, -.6], [8.3, -.2], [8.3, 1.6], [0, 3.4]] : mirror([[0, -.6], [8.3, -.2], [8.3, 1.6], [0, 3.4]]), .2), lt); J.wings.push([piv, s]);
    add(g, slabV([[9.4, .4], [5.2, .4], [6.5, 4.5], [8.5, 4.5]], .2), gr, s * 2.15, .3, 0);
    add(g, slabH(s > 0 ? [[1.8, 6.2], [5.4, 8.0], [5.4, 9.3], [1.8, 9.6]] : mirror([[1.8, 6.2], [5.4, 8.0], [5.4, 9.3], [1.8, 9.6]]), .16), gr, 0, -.2, 0);
  }
  add(g, new THREE.BoxGeometry(2.3, .6, 9.5), gr, 0, -.55, 3.2);
  const cp = add(g, new THREE.SphereGeometry(1, 12, 8), glass, 0, .78, -5.4); cp.scale.set(.62, .55, 2.1);
  J.gear = gearSet(-.7, -6.2, 1.9, 2.8, -1.75, .45); J.gear.children.forEach(c => c.position.x += 0); g.add(J.gear);
  return finish(J, [[-.55, -1.05, -1.6], [.55, -1.05, -1.6], [-.55, -1.05, 2.6], [.55, -1.05, 2.6], [-2.0, -.95, -1], [2.0, -.95, -1], [-2.0, -.95, 2], [2.0, -.95, 2]], true, 3.9, .19);
}
function buildF18() {
  const g = new THREE.Group(), gr = jm(0x6f7782), lt = jm(0x8f98a4), dk = jm(0x1d2024), glass = jm(0x2a2410, { transparent: true, opacity: .85, shininess: 120, specular: 0xffeeaa });
  const J = { g, wings: [], flames: [] };
  add(g, lathe([[9.3, .03], [8.2, .5], [6, .72], [2, .85], [-2, .86], [-5, .66], [-7.4, .32], [-9, .02]], 1.2, .85), gr);
  add(g, cylZ(.02, .05, 1.6, 5), dk, 0, 0, -9.7);
  for (const s of [-1, 1]) {
    add(g, cylZ(.62, .66, 3.5, 12), gr, s * .78, -.05, 7.7); add(g, cylZ(.58, .5, 1.1, 10), dk, s * .78, -.05, 9.7);
    add(g, new THREE.BoxGeometry(1.0, 1.05, 3.4), dk, s * 1.15, -.4, -1.8);
    const fl = add(g, flameGeo(), flameMat(), s * .78, -.05, 10.2); fl.scale.set(.9, .9, 3); J.flames.push(fl);
    const lerx = [[.8, -6.2], [2.6, -1.0], [2.6, .6], [.8, .6]]; add(g, slabH(s > 0 ? lerx : mirror(lerx), .1), lt, 0, .1, 0);
    const wing = [[1.0, -.4], [6.4, 1.5], [6.4, 2.7], [1.0, 3.8]]; add(g, slabH(s > 0 ? wing : mirror(wing), .16), lt, 0, 0, 0);
    const rail = add(g, cylZ(.1, .1, 2.8, 6), mslWhite, s * 6.55, 0, 1.4);
    const tail = add(g, slabV([[9.2, .3], [5.9, .3], [7.1, 4.0], [8.5, 4.0]], .16), gr, s * 1.45, .4, 0); tail.rotation.z = -s * .35; tail.position.x = s * 1.45;
    const hs = [[.9, 6.6], [4.3, 8.3], [4.3, 9.3], [.9, 9.5]]; add(g, slabH(s > 0 ? hs : mirror(hs), .13), gr, 0, -.1, 0);
  }
  const cp = add(g, new THREE.SphereGeometry(1, 12, 8), glass, 0, .72, -4.0); cp.scale.set(.58, .5, 2.0);
  J.gear = gearSet(-.6, -5.0, 1.55, 2.6, -1.65, .42); g.add(J.gear);
  return finish(J, [[-6.55, -.3, -.2], [6.55, -.3, -.2], [-3.3, -.6, 1.2], [3.3, -.6, 1.2], [-1.1, -1.05, 1.5], [1.1, -1.05, 1.5]], true, 3.5, .14);
}
function buildF22() {
  const g = new THREE.Group(), gr = jm(0x4b525c, { shininess: 70 }), lt = jm(0x5a626d, { shininess: 70 }), dk = jm(0x14161a), glass = jm(0x6a5420, { transparent: true, opacity: .85, shininess: 140, specular: 0xffe9a0 });
  const J = { g, wings: [], flames: [] };
  add(g, lathe([[9.6, .04], [8, .55], [5, .85], [1, .95], [-3, .86], [-6.2, .55], [-8.6, .2], [-10, .02]], 1.45, .55, 10), gr);
  for (const s of [-1, 1]) {
    const chine = [[.7, -8.8], [2.3, -2.0], [2.3, .8], [.7, .8]]; add(g, slabH(s > 0 ? chine : mirror(chine), .1), lt, 0, .05, 0);
    add(g, new THREE.BoxGeometry(1.1, .95, 3.2), dk, s * 1.55, -.28, -2.8).rotation.z = s * .12;
    add(g, cylZ(.6, .62, 4.2, 4), gr, s * .95, -.05, 7.4).rotation.z = Math.PI / 4;
    add(g, cylZ(.62, .5, 1.3, 4), dk, s * .95, -.05, 9.8).rotation.z = Math.PI / 4;
    const fl = add(g, flameGeo(), flameMat(), s * .95, -.05, 10.4); fl.scale.set(.9, .8, 3); J.flames.push(fl);
    const wing = [[1.0, -2.0], [6.9, 2.4], [6.9, 3.7], [1.0, 5.0]]; add(g, slabH(s > 0 ? wing : mirror(wing), .14), lt, 0, 0, 0);
    const hs = [[1.0, 6.4], [4.9, 8.0], [4.9, 8.8], [1.0, 9.4]]; add(g, slabH(s > 0 ? hs : mirror(hs), .12), gr, 0, -.05, 0);
    const tail = add(g, slabV([[9.2, .3], [5.8, .3], [7.3, 3.8], [8.8, 3.8]], .14), gr, s * 1.95, .3, 0); tail.rotation.z = -s * .47;
  }
  const cp = add(g, new THREE.SphereGeometry(1, 12, 8), glass, 0, .62, -4.8); cp.scale.set(.6, .45, 2.4);
  J.gear = gearSet(-.5, -6.0, 1.8, 3.0, -1.6, .42); g.add(J.gear);
  return finish(J, [[-.9, -.6, -1.2], [.9, -.6, -1.2], [-.9, -.6, 1.2], [.9, -.6, 1.2], [-1.4, -.5, 0], [1.4, -.5, 0]], false, 3.3, .13);
}
const BUILD = { f14: buildF14, f18: buildF18, f22: buildF22 };

/* ---------------------------------------------------------------- instances */
const jets = [];
const _f = new V3(), _u = new V3(), _r = new V3(), _v = new V3(), _q1 = new Q4(), _e = new THREE.Euler();
const AX = new V3(1, 0, 0), AZ = new V3(0, 0, 1), AY = new V3(0, 1, 0);
function parkJet(j) {
  const s = ISL[j.isl], [px, pz] = j.padPos = afw(s, ...s.pad[j.slot]);
  j.pos.set(px, groundH(px, pz) + j.d.gearH, pz); j.q.setFromAxisAngle(AY, yawOf(Math.cos(s.rot), Math.sin(s.rot)));
  j.vel.set(0, 0, 0); j.gs = 0; j.gp = 0; j.throttle = 0; j.gearT = 1; j.gearDown = true; j.onGround = true; j.hp = j.d.hp; j.ammo = j.d.ammo; j.mslN = j.d.msl;
  j.mdl.msl.forEach(m => m.visible = j.mdl.slots && j.type !== 'f22'); j.alive = true; j.mesh.visible = true; j.occupied = false; j.sweep = 68 * DEG;
}
function makeJet(type, isl, slot) {
  const mdl = BUILD[type](), j = { type, d: JD[type], mdl, mesh: mdl.g, pos: new V3(), q: new Q4(), vel: new V3(), isl, slot, fireT: 0, mT: 0, respawn: 0, rearmT: 0, rearming: false, ab: 0 };
  scene.add(j.mesh); parkJet(j); jets.push(j); return j;
}
for (const s of ISL) ['f14', 'f18', 'f22'].forEach((t, i) => makeJet(t, s.id, i));

/* ---------------------------------------------------------------- weapons */
const BUL = [], bulGeo = new THREE.BoxGeometry(.2, .2, 10), bulMat = new THREE.MeshBasicMaterial({ color: 0xffd27a, fog: false });
for (let i = 0; i < 180; i++) { const m = new THREE.Mesh(bulGeo, bulMat); m.visible = false; scene.add(m); BUL.push({ m, on: false, p: new V3(), v: new V3(), t: 0 }); }
let bulI = 0;
const MSL = [];
const LOCK = { t: null, c: null, p: 0, list: [] };
function segSphere(a, b, c, r) { // closest approach of segment a-b to sphere centre c; returns t or -1
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, l2 = dx * dx + dy * dy + dz * dz || 1e-6;
  let t = ((c.x - a.x) * dx + (c.y - a.y) * dy + (c.z - a.z) * dz) / l2; t = clamp(t, 0, 1);
  const px = a.x + dx * t - c.x, py = a.y + dy * t - c.y, pz = a.z + dz * t - c.z; return px * px + py * py + pz * pz < r * r ? t : -1;
}
function enemyCenter(e, out) { return out.set(e.pos.x, e.pos.y + e.def.cy, e.pos.z); }
function spawnBullet(p, v, life, fx) { const b = BUL[bulI = (bulI + 1) % BUL.length]; b.fx = !!fx; b.on = true; b.p.copy(p); b.v.copy(v); b.t = life || 1.5; b.m.visible = true; b.m.position.copy(p); b.m.lookAt(p.x + v.x, p.y + v.y, p.z + v.z); }
const _c = new V3(), _p2 = new V3();
function updateBullets(dt) {
  for (const b of BUL) {
    if (!b.on) continue; _p2.copy(b.p).addScaledVector(b.v, dt); b.t -= dt;
    let hit = false;
    if (b.fx) { if (b.t <= 0) { b.on = false; b.m.visible = false; } else { b.p.copy(_p2); b.m.position.copy(b.p); } continue; }
    for (const e of enemies) {
      if (!e.alive || !e.vis) continue; enemyCenter(e, _c);
      const t = segSphere(b.p, _p2, _c, e.def.r + .6); if (t >= 0) { _v.lerpVectors(b.p, _p2, t); sparks(_v, 3, '#ffb0a0', 8); puff(_v.x, _v.y, _v.z, 0, 0, 0, .15, 3, 5, '#ff3030', true, .8); dmgEnemy(e, 14, 'gun'); hit = true; break; }
    }
    const gh = groundH(_p2.x, _p2.z);
    if (!hit && _p2.y < gh) { hit = true; if (gh < .3) splash(_p2); else { sparks(_p2, 4, '#ffd070', 10); puff(_p2.x, _p2.y, _p2.z, 0, 2, 0, 1, 2, 6, '#6a5e50', false, .5, 'smoke'); } }
    if (hit || b.t <= 0) { b.on = false; b.m.visible = false; continue; }
    b.p.copy(_p2); b.m.position.copy(b.p);
  }
}
const _mm = new THREE.Matrix4();
function fireCannon(j) {
  if (j.ammo <= 0 || !j.alive) return; j.ammo--;
  const f = _f.set(0, 0, -1).applyQuaternion(j.q), side = (j.ammo & 1) ? -.9 : .9;
  _r.set(side, .1, -7).applyQuaternion(j.q).add(j.pos);
  const sp = .007; _u.set(rand(-sp, sp), rand(-sp, sp), 0).applyQuaternion(j.q);
  _v.copy(f).add(_u).normalize().multiplyScalar(1150).add(j.vel);
  spawnBullet(_r, _v, 1.5); if (j.ammo % 3 === 0) { sfx.cannon(); puff(_r.x, _r.y, _r.z, 0, 0, 0, .06, 2, 3, '#ffe9a0', true, .9); }
}
function fireMissile(j) {
  if (!j.alive || j.mslN <= 0 || j.mT > 0) { if (j.mslN <= 0) sfx.dry(); return; }
  const i = j.d.msl - j.mslN; j.mslN--; j.mT = .45; j.mdl.msl[i].visible = false;
  const m = mkMsl(j.type === 'f14' ? 3.9 : 3.3, j.type === 'f14' ? .19 : .14), sl = j.mdl.slots[i]; scene.add(m);
  const p = new V3(sl[0], sl[1], sl[2]).applyQuaternion(j.q).add(j.pos);
  const f = new V3(0, 0, -1).applyQuaternion(j.q), dn = new V3(0, -1, 0).applyQuaternion(j.q);
  const locked = LOCK.t && LOCK.t.alive && LOCK.p >= 1;
  MSL.push({ m, pos: p, vel: j.vel.clone().addScaledVector(dn, 14).addScaledVector(f, 30), dir: f.clone(), tgt: locked ? LOCK.t : null, age: 0, dmg: j.d.mdmg, spd: j.vel.length() + 30 });
  sfx.missile(); puff(p.x, p.y, p.z, 0, 0, 0, .5, 6, 14, '#ffffff', true, .8);
  if (j === pilotJet()) addMsg(locked ? 'FOX THREE — missile away' : 'Missile away (no lock)', 2);
}
function updateMissiles(dt) {
  for (let i = MSL.length - 1; i >= 0; i--) {
    const m = MSL[i]; m.age += dt; let boom = false, hitPos = null;
    if (m.age > .35) m.spd = Math.min(560, m.spd + 320 * dt);
    if (m.tgt && m.tgt.alive && m.age > .4) {
      enemyCenter(m.tgt, _c); _v.copy(_c).sub(m.pos); const dist = _v.length(), tt = Math.min(dist / m.spd, 2.5); _v.copy(_c).addScaledVector(m.tgt.vel, tt * .9).sub(m.pos).normalize();
      const ang = Math.acos(clamp(m.dir.dot(_v), -1, 1)), turn = Math.min(ang, 3.6 * dt); if (ang > 1e-4) { _u.crossVectors(m.dir, _v).normalize(); if (_u.lengthSq() > .1) m.dir.applyAxisAngle(_u, turn).normalize(); }
      if (dist < 16 + m.tgt.def.r) { boom = true; hitPos = _c.clone(); }
    } else if (m.age <= .4) { m.dir.y -= .25 * dt; m.dir.normalize(); }
    _v.copy(m.dir).multiplyScalar(m.spd); m.vel.lerp(_v, 1 - Math.exp(-dt * 8)); _p2.copy(m.pos).addScaledVector(m.vel, dt);
    if (!boom) { for (const e of enemies) { if (!e.alive || !e.vis) continue; enemyCenter(e, _c); if (segSphere(m.pos, _p2, _c, e.def.r + 2.5) >= 0) { boom = true; hitPos = _c.clone(); break; } } }
    const gh = groundH(_p2.x, _p2.z); if (!boom && _p2.y < gh) { boom = true; hitPos = _p2.clone(); }
    if (boom || m.age > 9) {
      const hp = hitPos || m.pos; scene.remove(m.m); MSL.splice(i, 1);
      if (hp.y < 1 && groundH(hp.x, hp.z) < .3) { splash(hp); explosion(hp, .9); } else explosion(hp, 1.3);
      blast(hp, 26, m.dmg, 'msl'); continue;
    }
    m.pos.copy(_p2); m.m.position.copy(m.pos); m.m.quaternion.setFromUnitVectors(_f.set(0, 0, -1), _v.copy(m.vel).normalize());
    puff(m.pos.x, m.pos.y, m.pos.z, 0, 0, 0, 1.8, 1.6, 7, '#c9ced8', false, .5, 'smoke');
    _u.copy(m.vel).normalize().multiplyScalar(-2.4); puff(m.pos.x + _u.x, m.pos.y + _u.y, m.pos.z + _u.z, 0, 0, 0, .09, 3, 1.5, '#ffb050', true, 1);
  }
}
function blast(p, rad, dmg, src) {
  for (const e of enemies) { if (!e.alive) continue; enemyCenter(e, _c); const d = _c.distanceTo(p) - e.def.r; if (d < rad) dmgEnemy(e, dmg * (1 - clamp(d / rad, 0, 1) * .6), src); }
}
function updateLock(j, dt) {
  LOCK.list.length = 0; const f = _f.set(0, 0, -1).applyQuaternion(j.q);
  for (const e of enemies) {
    if (!e.alive || !e.vis) continue; enemyCenter(e, _c); _v.copy(_c).sub(j.pos); const dist = _v.length(); if (dist > 4500 || dist < 20) continue;
    const ang = Math.acos(clamp(f.dot(_v) / dist, -1, 1)); if (ang < .6) LOCK.list.push({ e, ang, dist });
  }
  LOCK.list.sort((a, b) => a.ang - b.ang);
  if (LOCK.t) {
    const e = LOCK.t; enemyCenter(e, _c); _v.copy(_c).sub(j.pos); const dist = _v.length(), ang = Math.acos(clamp(f.dot(_v) / dist, -1, 1));
    if (!e.alive || dist > 5200 || ang > 1.3) { LOCK.t = null; LOCK.p = 0; LOCK.c = null; }
  }
  if (!LOCK.t) {
    const c = LOCK.list.length ? LOCK.list[0].e : null;
    if (c && LOCK.list[0].ang < .3) { if (LOCK.c === c) LOCK.p += dt / 1.0; else { LOCK.c = c; LOCK.p = 0; } if (LOCK.p >= 1) { LOCK.t = c; LOCK.p = 1; sfx.beep(1500, .3); } }
    else { LOCK.c = null; LOCK.p = Math.max(0, LOCK.p - dt * 2); }
  }
}
function cycleLock() {
  if (!LOCK.list.length) return; let i = LOCK.t ? LOCK.list.findIndex(o => o.e === LOCK.t) : -1; LOCK.t = LOCK.list[(i + 1) % LOCK.list.length].e; LOCK.c = LOCK.t; LOCK.p = 1; sfx.beep(1500, .2);
}

/* ---------------------------------------------------------------- damage / destruction */
function damageJet(j, n) { if (!j.alive) return; j.hp -= n; shakeAmt = Math.max(shakeAmt, 2); if (j === pilotJet()) sfx.hurt(); if (j.hp <= 0) destroyJet(j, 'shot'); }
function destroyJet(j, why) {
  if (!j.alive) return; j.alive = false; j.mesh.visible = false; j.respawn = 45;
  explosion(j.pos, 3, false); for (let i = 0; i < 14; i++) puff(j.pos.x, j.pos.y, j.pos.z, rand(-1, 1) * 30, rand(0, 1) * 30, rand(-1, 1) * 30, rand(1, 2.5), 3, 1, '#ff9030', true, 1, 'glow', 20);
  if (j.pos.y < 8 && groundH(j.pos.x, j.pos.z) < .3) splash(j.pos);
  if (j.occupied) { j.occupied = false; onJetDestroyed(j, why); }
}
function updateJetsIdle(dt) {
  for (const j of jets) {
    if (!j.alive) { j.respawn -= dt; if (j.respawn <= 0) parkJet(j); continue; }
    if (j.mT > 0) j.mT -= dt;
  }
}

/* ---------------------------------------------------------------- flight model */
function flyJet(j, dt, inp) {
  const d = j.d; j.throttle = clamp(j.throttle + inp.thr * dt * .6, 0, 1);
  j.gearT = clamp(j.gearT + (j.gearDown ? 1 : -1) * dt * .6, 0, 1);
  j.fireT -= dt;
  if (inp.fire && j.fireT <= 0) { let n = 0; while (j.fireT <= 0 && n++ < 3) { fireCannon(j); j.fireT += 1 / 45; } if (j.fireT < -.05) j.fireT = 0; }
  if (inp.missile) { inp.missile = false; fireMissile(j); }
  if (j.onGround) return groundStep(j, dt, inp);
  const f = _f.set(0, 0, -1).applyQuaternion(j.q), up = _u.set(0, 1, 0).applyQuaternion(j.q), rt = _r.set(1, 0, 0).applyQuaternion(j.q);
  const speed = j.vel.length(), auth = clamp((speed - 28) / (d.vr * 1.1), .14, 1), turnK = clamp(165 / Math.max(speed, 60), .5, 1.25);
  const stall = 1 - smooth(d.vr * .5, d.vr * .95, speed);
  let p = inp.pitch * d.pitchR * auth * turnK - stall * 1.1, r = inp.roll * d.rollR * auth * (.8 + turnK * .25);
  if (inp.assist && Math.abs(inp.roll) < .05 && Math.abs(inp.pitch) < .05) r += clamp(rt.y, -.7, .7) * 1.5;
  _q1.setFromAxisAngle(AX, p * dt); j.q.multiply(_q1); _q1.setFromAxisAngle(AZ, -r * dt); j.q.multiply(_q1); j.q.normalize();
  f.set(0, 0, -1).applyQuaternion(j.q); up.set(0, 1, 0).applyQuaternion(j.q);
  const ab = j.throttle > .92 ? 1.18 : 1, T = d.thrust * j.throttle * ab, kd = d.thrust / (d.maxSpd * d.maxSpd) * (1 + j.gearT * .9 + (inp.brake ? 1.4 : 0));
  j.vel.addScaledVector(f, T * dt); j.vel.multiplyScalar(1 - Math.min(.4, kd * speed * dt));
  const lift = smooth(d.vr * .45, d.vr * 1.05, speed);
  j.vel.y -= G * dt; j.vel.addScaledVector(up, G * lift * dt);
  const sp = j.vel.length(); _v.copy(f).multiplyScalar(sp); j.vel.lerp(_v, 1 - Math.exp(-dt * (1.0 + 3.2 * lift)));
  j.pos.addScaledVector(j.vel, dt); j.ab = j.throttle > .92 ? 1 : 0;
  // terrain
  const gh = groundH(j.pos.x, j.pos.z), bottom = j.pos.y - d.gearH * (.45 + .55 * j.gearT);
  if (bottom <= gh) {
    const pitch = Math.asin(clamp(f.y, -1, 1)), roll = Math.asin(clamp(rt.y, -1, 1)), sp2 = j.vel.length(), vy = j.vel.y, sl = slopeAt(j.pos.x, j.pos.z);
    const ok = gh > .6 && j.gearT > .85 && vy > -10 && sp2 < d.vr * 2 && pitch > -.1 && pitch < .38 && Math.abs(roll) < .38 && sl < .2;
    if (!ok) { j.pos.y = gh + 1; if (gh < .3) { splash(j.pos); } destroyJet(j, gh < .3 ? 'water' : 'crash'); return; }
    if (vy < -5) { damageJet(j, (-vy - 5) * 14); addMsg('Hard landing!', 2); }
    j.onGround = true; j.gs = Math.hypot(j.vel.x, j.vel.z); j.gp = pitch; j.vel.y = 0; j.pos.y = gh + d.gearH; sfx.step(); sfx.step();
    puff(j.pos.x, gh + 1, j.pos.z, 0, 2, 0, 1.5, 4, 14, '#aaa89e', false, .5, 'smoke'); addMsg('Touchdown', 2);
  }
}
function groundStep(j, dt, inp) {
  const d = j.d, f = _f.set(0, 0, -1).applyQuaternion(j.q); let yaw = Math.atan2(-f.x, -f.z);
  yaw -= inp.roll * .6 * Math.max(.3, clamp(j.gs / 8, 0, 1)) / (1 + j.gs / 30) * dt * 1.6;
  const T = d.thrust * j.throttle * .6 * (j.throttle > .92 ? 1.15 : 1), kd = d.thrust / (d.maxSpd * d.maxSpd);
  j.gs += (T - kd * j.gs * j.gs - (j.gs > .1 ? .6 : 0) - (inp.brake ? 24 : 0) - (j.throttle < .05 ? 1.5 : 0)) * dt; if (j.gs < 0) j.gs = 0;
  const lifted = j.gs > d.vr * .72, tgt = inp.pitch > .05 && lifted ? inp.pitch * .34 : 0; j.gp += (tgt - j.gp) * clamp(dt * 1.6, 0, 1);
  j.q.setFromEuler(_e.set(j.gp, yaw, 0, 'YXZ'));
  j.vel.set(-Math.sin(yaw) * j.gs, 0, -Math.cos(yaw) * j.gs); j.pos.x += j.vel.x * dt; j.pos.z += j.vel.z * dt;
  const gh = groundH(j.pos.x, j.pos.z);
  if (gh < .4) { destroyJet(j, 'water'); splash(j.pos); return; }
  const hit = pushOut(j.pos, 6); if (hit) { if (j.gs > 12) { destroyJet(j, 'crash'); return; } j.gs *= .4; }
  j.pos.y = gh + d.gearH;
  if (j.gs > d.vr && j.gp > .07) { j.onGround = false; f.set(0, 0, -1).applyQuaternion(j.q); j.vel.copy(f).multiplyScalar(j.gs); j.vel.y += 2; addMsg('Airborne — gear up with G', 3); }
}
function jetVisuals(j, dt, t) {
  const d = j.d, m = j.mesh; m.position.copy(j.pos); m.quaternion.copy(j.q);
  if (j.mdl.gear) { j.mdl.gear.visible = j.gearT > .04; j.mdl.gear.scale.y = Math.max(.01, j.gearT); }
  const sp = j.vel.length(), target = j.onGround ? (j.throttle < .05 && sp < 1 ? 68 : 22) : lerp(22, 68, smooth(110, 290, sp));
  j.sweep = lerp(j.sweep, target * DEG, 1 - Math.exp(-dt * 1.5)); for (const [w, s] of j.mdl.wings) w.rotation.y = -s * j.sweep;
  const fl = j.mdl.flames, k = j.throttle > .03 && j.alive ? (.4 + j.throttle * 3 + (j.throttle > .92 ? 3 : 0)) * (.9 + Math.random() * .2) : 0;
  for (const f of fl) { f.visible = k > 0; f.scale.z = k; f.material.color.setHex(j.throttle > .92 ? 0xffb050 : 0xff8830); }
}
function rearm(j, dt) {
  const s = nearestIsland(j.pos.x, j.pos.z), near = Math.hypot(j.pos.x - s.x, j.pos.z - s.z) < 650;
  j.rearming = false; if (!(j.onGround && j.gs < 2 && j.throttle < .15 && near)) return;
  if (j.hp < j.d.hp || j.ammo < j.d.ammo || j.mslN < j.d.msl) {
    j.rearming = true; j.hp = Math.min(j.d.hp, j.hp + 22 * dt); j.ammo = Math.min(j.d.ammo, j.ammo + 120 * dt); j.rearmT += dt;
    if (j.rearmT > 1.4 && j.mslN < j.d.msl) { j.rearmT = 0; j.mdl.msl[j.d.msl - j.mslN - 1].visible = j.type !== 'f22'; j.mslN++; sfx.beep(600, .08); }
  }
}
function pilotJet() { return P.jet; }
function jetCamera(j, dt, cockpit) {
  const d = j.d;
  if (!jetCamera.q) jetCamera.q = new Q4().copy(j.q);
  if (cockpit) { j.mesh.visible = false; camera.position.set(...d.cock).applyQuaternion(j.q).add(j.pos); camera.quaternion.copy(j.q); jetCamera.q.copy(j.q); }
  else {
    j.mesh.visible = true; jetCamera.q.slerp(j.q, 1 - Math.exp(-dt * 7)); camera.position.set(...d.cam).applyQuaternion(jetCamera.q).add(j.pos); camera.quaternion.copy(jetCamera.q);
    const gh = groundH(camera.position.x, camera.position.z); if (camera.position.y < gh + 2) camera.position.y = gh + 2;
  }
  camera.fov = 70 + (j.ab ? 7 : 0) + clamp(j.vel.length() / 400, 0, 1) * 5; camera.updateProjectionMatrix();
}
