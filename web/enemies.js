'use strict';
/* =====================================================================
   ENEMIES: ground monsters, ghosts and flying vampires
   ===================================================================== */
const enemies = [], EB = [], pickups = [];
const SPH = new THREE.SphereGeometry(1, 10, 8), BOXG = new THREE.BoxGeometry(1, 1, 1), CONEG = new THREE.ConeGeometry(1, 1, 8), CYLG = new THREE.CylinderGeometry(1, 1, 1, 8);
const L = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
const B = c => new THREE.MeshBasicMaterial({ color: c });
const GH = (c, op) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op == null ? .5 : op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
function sph(p, m, sx, sy, sz, x, y, z) { const o = new THREE.Mesh(SPH, m); o.scale.set(sx, sy, sz); o.position.set(x || 0, y || 0, z || 0); p.add(o); return o; }
function bx(p, m, w, h, d, x, y, z) { const o = new THREE.Mesh(BOXG, m); o.scale.set(w, h, d); o.position.set(x || 0, y || 0, z || 0); p.add(o); return o; }
function cone(p, m, r, h, x, y, z) { const o = new THREE.Mesh(CONEG, m); o.scale.set(r, h, r); o.position.set(x || 0, y || 0, z || 0); p.add(o); return o; }
function limb(p, m, x, y, z, w, h, d) { const pv = new THREE.Group(); pv.position.set(x, y, z); const o = bx(pv, m, w, h, d, 0, -h / 2, 0); p.add(pv); return pv; }

function bThrall() {
  const g = new THREE.Group(), robe = L(0x3b3527), skin = L(0x8d9c7a), eye = B(0xff3020), P = {};
  bx(g, robe, .6, 1.0, .35, 0, 1.15, 0); cone(g, robe, .5, .9, 0, .6, 0).rotation.x = Math.PI;
  sph(g, skin, .22, .26, .22, 0, 1.85, -.03); sph(g, eye, .04, .04, .04, -.08, 1.88, -.2); sph(g, eye, .04, .04, .04, .08, 1.88, -.2);
  P.armL = limb(g, robe, -.4, 1.6, 0, .13, .8, .13); P.armR = limb(g, robe, .4, 1.6, 0, .13, .8, .13); P.armL.rotation.x = P.armR.rotation.x = 1.3;
  P.legL = limb(g, L(0x2a2a22), -.15, .7, 0, .17, .7, .17); P.legR = limb(g, L(0x2a2a22), .15, .7, 0, .17, .7, .17);
  return { g, P };
}
function bGhoul() {
  const g = new THREE.Group(), sk = L(0x6a7260), eye = B(0xffe030), P = {};
  bx(g, sk, .5, .45, 1.1, 0, .6, 0).rotation.x = .15; sph(g, sk, .26, .24, .3, 0, .78, -.75); bx(g, B(0xe8e4d0), .22, .05, .12, 0, .62, -.98);
  sph(g, eye, .05, .05, .05, -.1, .84, -.95); sph(g, eye, .05, .05, .05, .1, .84, -.95);
  P.armL = limb(g, sk, -.34, .75, -.4, .1, .95, .1); P.armR = limb(g, sk, .34, .75, -.4, .1, .95, .1); P.legL = limb(g, sk, -.28, .55, .45, .12, .7, .12); P.legR = limb(g, sk, .28, .55, .45, .12, .7, .12);
  P.armL.rotation.x = P.armR.rotation.x = .9; return { g, P };
}
function bLycan() {
  const g = new THREE.Group(), fur = L(0x3a2b23), eye = B(0xff2010), P = {};
  sph(g, fur, .5, .52, 1.0, 0, 1.0, .1); sph(g, fur, .42, .46, .5, 0, 1.15, -.5); sph(g, fur, .27, .25, .34, 0, 1.28, -1.0); bx(g, fur, .15, .13, .45, 0, 1.2, -1.35);
  cone(g, fur, .08, .3, -.14, 1.55, -.9); cone(g, fur, .08, .3, .14, 1.55, -.9); sph(g, eye, .04, .04, .04, -.1, 1.33, -1.2); sph(g, eye, .04, .04, .04, .1, 1.33, -1.2);
  const tail = cone(g, fur, .1, .9, 0, 1.0, .95); tail.rotation.x = -1.2;
  P.armL = limb(g, fur, -.3, .95, -.5, .15, .95, .15); P.armR = limb(g, fur, .3, .95, -.5, .15, .95, .15); P.legL = limb(g, fur, -.3, .9, .6, .17, .9, .17); P.legR = limb(g, fur, .3, .9, .6, .17, .9, .17);
  return { g, P };
}
function bGolem() {
  const g = new THREE.Group(), st = L(0x6b6d70), moss = L(0x4a5a3a), glow = B(0xff3a10), P = {};
  bx(g, st, 1.7, 1.8, 1.0, 0, 2.7, 0); bx(g, moss, 1.8, .4, 1.1, 0, 3.5, 0); bx(g, st, .8, .7, .7, 0, 3.85, -.1); sph(g, glow, .09, .09, .09, -.2, 3.9, -.5); sph(g, glow, .09, .09, .09, .2, 3.9, -.5);
  bx(g, glow, .08, .9, .03, .1, 2.8, -.52).rotation.z = .4; bx(g, glow, .06, .6, .03, -.3, 2.4, -.52).rotation.z = -.5;
  P.armL = limb(g, st, -1.2, 3.4, 0, .6, 2.1, .6); P.armR = limb(g, st, 1.2, 3.4, 0, .6, 2.1, .6); P.legL = limb(g, st, -.5, 1.8, 0, .7, 1.8, .7); P.legR = limb(g, st, .5, 1.8, 0, .7, 1.8, .7);
  return { g, P };
}
function bWraith() {
  const g = new THREE.Group(), gm = GH(0x7fe8ff, .5), P = {};
  cone(g, gm, .75, 2.6, 0, 1.6, 0).rotation.x = Math.PI; sph(g, GH(0xc8f6ff, .6), .32, .36, .32, 0, 3.1, 0);
  sph(g, B(0x001018), .07, .1, .05, -.11, 3.12, -.28); sph(g, B(0x001018), .07, .1, .05, .11, 3.12, -.28);
  for (const s of [-1, 1]) { const a = cone(g, gm, .16, 1.8, s * .7, 2.2, -.4); a.rotation.set(1.7, 0, s * .4); }
  P.body = g; return { g, P };
}
function bBanshee() {
  const g = new THREE.Group(), gm = GH(0xd8e4ff, .5), P = {};
  cone(g, gm, 1.0, 3.4, 0, 1.7, 0); P.head = sph(g, GH(0xf0f4ff, .65), .3, .38, .3, 0, 3.55, 0);
  sph(g, B(0x000008), .09, .14, .05, -.12, 3.58, -.26); sph(g, B(0x000008), .09, .14, .05, .12, 3.58, -.26); P.mouth = sph(g, B(0x000008), .09, .2, .05, 0, 3.3, -.27);
  for (let i = 0; i < 4; i++) { const h = cone(g, GH(0x8898c0, .45), .12, 2.4, (i - 1.5) * .16, 3.0, .35); h.rotation.x = -.35; }
  for (const s of [-1, 1]) { const a = cone(g, gm, .14, 1.6, s * .75, 2.8, -.1); a.rotation.set(0, 0, -s * .7); }
  return { g, P };
}
const batWingGeo = (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(1.3, .5); s.lineTo(1.0, -.15); s.lineTo(.7, -.5); s.lineTo(.3, -.3); s.closePath(); const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); return g; })();
function bBat() {
  const g = new THREE.Group(), m = L(0x1c1418, { side: THREE.DoubleSide }), P = {};
  sph(g, m, .18, .16, .32, 0, 0, 0); sph(g, B(0xff2020), .03, .03, .03, -.07, .05, -.28); sph(g, B(0xff2020), .03, .03, .03, .07, .05, -.28);
  cone(g, m, .04, .14, -.07, .17, -.22); cone(g, m, .04, .14, .07, .17, -.22);
  for (const s of [-1, 1]) { const pv = new THREE.Group(); pv.position.set(s * .12, .02, 0); const w = new THREE.Mesh(batWingGeo, m); w.scale.set(s, 1, 1); pv.add(w); g.add(pv); P[s < 0 ? 'wingL' : 'wingR'] = pv; }
  g.scale.setScalar(1.7); return { g, P };
}
function bSkull() {
  const g = new THREE.Group(), bone = L(0xe8e4d0, { emissive: 0x302010 }), P = {};
  sph(g, bone, .5, .55, .55, 0, 0, 0); bx(g, bone, .5, .2, .4, 0, -.45, -.15); sph(g, B(0xff7010), .13, .15, .1, -.2, .05, -.45); sph(g, B(0xff7010), .13, .15, .1, .2, .05, -.45);
  const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xff6a10, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .8 })); gl.scale.set(6, 6, 1); g.add(gl);
  g.scale.setScalar(1.5); return { g, P };
}
function wingGeo() { const s = new THREE.Shape(); [[0, 0], [3.8, .7], [5.2, -.1], [4.3, -1.0], [3.2, -1.5], [2.2, -1.2], [1.0, -1.6], [0, -1.0]].forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath(); const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); return g; }
const WINGG = wingGeo();
function bVampire(lord) {
  const g = new THREE.Group(), cape = L(lord ? 0x160810 : 0x28101a), skin = L(lord ? 0xb5aea0 : 0xd0c9be), wm = L(lord ? 0x2c0c1c : 0x3c1424, { side: THREE.DoubleSide }), eye = B(0xff1818), P = {};
  sph(g, cape, .42, .72, .3, 0, 0, 0); cone(g, cape, .75, 2.2, 0, -1.3, .15).rotation.x = Math.PI + .15;
  sph(g, skin, .26, .3, .26, 0, .95, -.1); cone(g, skin, .07, .55, -.22, 1.2, .0).rotation.z = .25; cone(g, skin, .07, .55, .22, 1.2, 0).rotation.z = -.25;
  if (lord) { const n = cone(g, skin, .07, .5, 0, .93, -.45); n.rotation.x = -Math.PI / 2; }
  bx(g, B(0xffffff), .05, .1, .03, -.07, .72, -.32); bx(g, B(0xffffff), .05, .1, .03, .07, .72, -.32);
  sph(g, eye, .05, .05, .04, -.1, 1.0, -.31); sph(g, eye, .05, .05, .04, .1, 1.0, -.31);
  P.armL = limb(g, cape, -.4, .45, -.05, .1, .8, .1); P.armR = limb(g, cape, .4, .45, -.05, .1, .8, .1); P.armL.rotation.x = P.armR.rotation.x = 1.0;
  for (const s of [-1, 1]) {
    const pv = new THREE.Group(); pv.position.set(s * .3, .45, .15); pv.scale.setScalar(lord ? .8 : .72);
    const w = new THREE.Mesh(WINGG, wm); w.scale.x = s; pv.add(w); const bone = bx(pv, L(0x1a0a10), 3.86, .09, .09, s * 1.9, 0, -.35); bone.rotation.y = s * .18; g.add(pv); P[s < 0 ? 'wingL' : 'wingR'] = pv;
  }
  g.rotation.order = 'YXZ'; return { g, P, lord };
}
const EDEF = {
  thrall: { name: 'Thrall', hp: 45, spd: 3.4, r: 1.0, cy: 1.1, dmg: 12, aggro: 140, gnd: true, build: bThrall, score: 10 },
  ghoul: { name: 'Ghoul', hp: 35, spd: 9.5, r: .9, cy: .6, dmg: 9, aggro: 170, gnd: true, build: bGhoul, score: 15 },
  lycan: { name: 'Lycan', hp: 100, spd: 12, r: 1.1, cy: 1.0, dmg: 18, aggro: 230, gnd: true, build: bLycan, score: 30 },
  golem: { name: 'Grave Golem', hp: 420, spd: 2.5, r: 2.2, cy: 2.5, dmg: 35, aggro: 170, gnd: true, throws: true, build: bGolem, score: 80 },
  wraith: { name: 'Wraith', hp: 55, spd: 5.8, r: 1.4, cy: 2.4, dmg: 7, aggro: 170, hover: 2.2, build: bWraith, score: 25 },
  banshee: { name: 'Banshee', hp: 70, spd: 6.5, r: 1.4, cy: 2.6, dmg: 14, aggro: 210, hover: 7, shriek: true, build: bBanshee, score: 40 },
  bat: { name: 'Vampire Bat', hp: 8, spd: 58, r: 1.1, cy: 0, dmg: 4, air: true, build: bBat, score: 5 },
  skull: { name: 'Wisp Skull', hp: 20, spd: 100, r: 1.6, cy: 0, dmg: 25, air: true, kami: true, build: bSkull, score: 20 },
  vampire: { name: 'Vampire', hp: 140, spd: 88, r: 2.6, cy: 0, dmg: 14, air: true, shoots: true, build: () => bVampire(false), score: 60 },
  lord: { name: 'Nosferatu Lord', hp: 1500, spd: 72, r: 7, cy: 0, dmg: 24, air: true, shoots: true, boss: true, build: () => { const b = bVampire(true); b.g.scale.setScalar(3.2); return b; }, score: 1000 }
};
function spawnEnemy(kind, x, y, z, isl) {
  const def = EDEF[kind], b = def.build(), e = {
    kind, def, mesh: b.g, P: b.P || {}, pos: new V3(x, y, z), vel: new V3(), hp: def.hp, maxhp: def.hp, alive: true, vis: true, t: rand(0, 10), ph: rand(0, 6), yaw: rand(0, TAU), isl, home: new V3(x, y, z),
    cd: rand(.5, 3), cd2: rand(3, 8), wind: 0, alert: false, st: 0, wp: new V3(x, 0, z), ang: rand(0, TAU), brk: 0, side: 1, lastYaw: 0, dist: 1e5, summon: rand(8, 14)
  };
  b.g.position.copy(e.pos); b.g.rotation.order = 'YXZ'; scene.add(b.g); enemies.push(e); return e;
}
function populate() {
  for (const s of ISL) {
    const spawnAround = (kind, n, r0, r1) => {
      for (let i = 0, tr = 0; i < n && tr < 80; tr++) {
        const a = rand(0, TAU), d = rand(r0, r1), x = s.x + Math.cos(a) * d, z = s.z + Math.sin(a) * d, gy = groundH(x, z); if (gy < 1.6) continue;
        const lx = (x - s.x) * Math.cos(s.rot) + (z - s.z) * Math.sin(s.rot), lz = -(x - s.x) * Math.sin(s.rot) + (z - s.z) * Math.cos(s.rot); if (Math.hypot(lx + 400, lz - 50) < 170) continue;
        const def = EDEF[kind]; spawnEnemy(kind, x, def.air ? gy + rand(40, 160) : def.hover ? gy + def.hover : gy, z, s.id); i++;
      }
    };
    spawnAround('thrall', 11, 170, 560); spawnAround('ghoul', 6, 220, 620); spawnAround('lycan', 4, 260, 650); spawnAround('golem', 2, 320, 600);
    spawnAround('wraith', 5, 160, 560); spawnAround('banshee', 3, 220, 600); spawnAround('bat', 9, 200, 600); spawnAround('skull', 3, 300, 700); spawnAround('vampire', 4, 250, 650);
    const l = spawnEnemy('lord', s.nest.x, s.nest.y + 110, s.nest.z, s.id); l.home.set(s.nest.x, s.nest.y + 110, s.nest.z); s.lord = l;
  }
}

/* ---------------------------------------------------------------- bolts / pickups */
function fireBolt(e, dmg, spd, spread, size) {
  const o = new V3(e.pos.x, e.pos.y + e.def.cy, e.pos.z), dist = o.distanceTo(TGT.pos), lead = TGT.jet ? dist / spd * .85 : 0;
  const d = new V3().copy(TGT.pos).addScaledVector(TGT.vel, lead).sub(o).normalize(); d.x += rand(-spread, spread); d.y += rand(-spread, spread); d.z += rand(-spread, spread); d.normalize();
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: e.def.throws ? 0x886644 : 0xff2030, transparent: true, blending: e.def.throws ? THREE.NormalBlending : THREE.AdditiveBlending, depthWrite: false }));
  sp.scale.set(size, size, 1); sp.position.copy(o); scene.add(sp);
  EB.push({ pos: o, vel: d.multiplyScalar(spd), sp, life: 8, dmg, hom: e.def.throws ? 0 : .45, size, grav: e.def.throws ? 4 : 0 });
}
function updateBolts(dt) {
  for (let i = EB.length - 1; i >= 0; i--) {
    const b = EB[i]; b.life -= dt;
    if (b.hom > 0) { _v.copy(TGT.pos).sub(b.pos); const dist = _v.length(), sp = b.vel.length(); _v.multiplyScalar(sp / (dist || 1)); b.vel.lerp(_v, clamp(b.hom * dt, 0, .1)); b.vel.setLength(sp); }
    b.vel.y -= b.grav * dt; b.pos.addScaledVector(b.vel, dt); b.sp.position.copy(b.pos);
    puff(b.pos.x, b.pos.y, b.pos.z, 0, 0, 0, .35, b.size * .8, .5, b.hom > 0 ? '#ff2040' : '#887766', b.hom > 0, .6);
    const dd = b.pos.distanceTo(TGT.pos); let dead = b.life <= 0 || b.pos.y < groundH(b.pos.x, b.pos.z);
    if (dd < TGT.r + b.size * .5 + (TGT.jet ? 1 : .4) && TGT.alive) { hurtPlayer(b.dmg, 'bolt'); dead = true; sparks(b.pos, 8, '#ff3040', 12); }
    if (dead) { scene.remove(b.sp); b.sp.material.dispose(); EB.splice(i, 1); }
  }
}
function clearBoltsNear(p, r) { for (let i = EB.length - 1; i >= 0; i--) if (EB[i].pos.distanceTo(p) < r && EB[i].hom > 0) { explosion(EB[i].pos, .3, true); scene.remove(EB[i].sp); EB.splice(i, 1); } }
function spawnPickup(type, p) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: type === 'hp' ? 0x40ff70 : 0xffd040, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); sp.scale.set(2.4, 2.4, 1);
  sp.position.set(p.x, groundH(p.x, p.z) + 1.2, p.z); scene.add(sp); pickups.push({ type, sp, life: 70, t: rand(0, 6) });
}
function updatePickups(dt) {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const k = pickups[i]; k.life -= dt; k.t += dt; k.sp.position.y += Math.sin(k.t * 3) * .01; let take = false;
    if (P.mode === 'foot' && P.hp > 0 && Math.hypot(k.sp.position.x - P.pos.x, k.sp.position.z - P.pos.z) < 3) { take = true; pickupFx(k.type); }
    if (take || k.life <= 0) { scene.remove(k.sp); pickups.splice(i, 1); }
  }
}

/* ---------------------------------------------------------------- damage */
function dmgEnemy(e, n, src) {
  if (!e.alive) return; e.hp -= n; e.alert = true; if (typeof hitMarker === 'function' && (src === 'gun' || src === 'rifle' || src === 'msl' || src === 'blade')) hitMarker(e.hp <= 0);
  if (e.hp <= 0) killEnemy(e, src);
  else if (e.def.hover) puff(e.pos.x, e.pos.y + e.def.cy, e.pos.z, 0, 0, 0, .3, 2, 4, '#aaf0ff', true, .6);
}
function killEnemy(e, src) {
  e.alive = false; scene.remove(e.mesh); const d = e.def, c = new V3(e.pos.x, e.pos.y + d.cy, e.pos.z);
  if (d.boss) { explosion(c, 5); for (let i = 0; i < 30; i++) puff(c.x, c.y, c.z, rand(-1, 1) * 50, rand(-.5, 1) * 50, rand(-1, 1) * 50, rand(1, 3), 5, 1, '#ff2030', true, 1, 'glow', 15); onLordKilled(e); }
  else if (d.air) explosion(c, d.kami ? .6 : .9, false);
  else if (d.hover) { for (let i = 0; i < 16; i++) puff(c.x, c.y, c.z, rand(-1, 1) * 5, rand(0, 1) * 6, rand(-1, 1) * 5, rand(.6, 1.4), 2, 8, pick(['#9ff', '#cff']), true, .7); sfx.shriek(e.dist); }
  else { for (let i = 0; i < 14; i++) puff(c.x, c.y, c.z, rand(-1, 1) * 6, rand(0, 1) * 8, rand(-1, 1) * 6, rand(.5, 1.1), 1.5, .5, '#6a0c10', false, .9, 'glow', 14); }
  if (typeof onKill === 'function') onKill(e);
  if (!d.air && Math.random() < .22) spawnPickup(Math.random() < .5 ? 'hp' : 'ammo', e.pos);
}

/* ---------------------------------------------------------------- AI */
const _g = new V3(), _w = new V3();
function steer(e, goal, spd, turn, dt) { _w.copy(goal).sub(e.pos); const l = _w.length() || 1; _w.multiplyScalar(spd / l); e.vel.lerp(_w, 1 - Math.exp(-turn * dt)); }
function onFootTarget() { return !TGT.jet && P.mode === 'foot' && P.hp > 0; }
function aiGround(e, dt) {
  const d = e.def, foot = onFootTarget(); let goal = null, spd = d.spd;
  if (foot && (e.dist < d.aggro || e.alert)) goal = TGT.pos;
  else { e.st -= dt; if (e.st <= 0) { e.st = rand(3, 9); e.wp.set(e.home.x + rand(-60, 60), 0, e.home.z + rand(-60, 60)); } goal = e.wp; spd *= .3; }
  const dx = goal.x - e.pos.x, dz = goal.z - e.pos.z, dxz = Math.hypot(dx, dz), want = Math.atan2(-dx, -dz), da = angDiff(want, e.yaw);
  e.yaw += clamp(da, -3 * dt, 3 * dt); const move = (dxz > (goal === TGT.pos ? d.r + .6 : 1.5)) ? (Math.abs(da) < 1.2 ? 1 : .3) : 0;
  const nx = e.pos.x - Math.sin(e.yaw) * spd * move * dt, nz = e.pos.z - Math.cos(e.yaw) * spd * move * dt, gh = groundH(nx, nz);
  if (gh > .8 && Math.abs(gh - e.pos.y) < spd * dt * 1.4 + .3) { e.pos.x = nx; e.pos.z = nz; } else if (move && goal !== TGT.pos) e.st = 0;
  pushOut(e.pos, d.r * .7); e.pos.y = lerp(e.pos.y, groundH(e.pos.x, e.pos.z), clamp(dt * 12, 0, 1));
  e.ph += dt * spd * move * 1.5;
  const P_ = e.P, sw = Math.sin(e.ph) * (e.kind === 'golem' ? .5 : .75) * move;
  if (P_.legL) { P_.legL.rotation.x = sw; P_.legR.rotation.x = -sw; }
  if (P_.armL && e.kind !== 'thrall') { P_.armL.rotation.x = (e.kind === 'golem' ? 0 : .9) - sw; P_.armR.rotation.x = (e.kind === 'golem' ? 0 : .9) + sw; }
  e.mesh.rotation.z = e.kind === 'ghoul' || e.kind === 'lycan' ? Math.sin(e.ph) * .06 : 0;
  if (foot) {
    const dy = Math.abs(TGT.pos.y - 1.7 - e.pos.y); e.cd -= dt;
    if (dxz < d.r + 1.5 && dy < 3 && e.cd <= 0) { e.cd = e.kind === 'golem' ? 1.8 : 1; hurtPlayer(d.dmg, 'melee'); if (P_.armL) { P_.armL.rotation.x = 2.2; P_.armR.rotation.x = 2.2; } }
    if (d.throws) { e.cd2 -= dt; if (e.cd2 <= 0 && e.dist > 18 && e.dist < 140) { e.cd2 = rand(3.5, 5.5); fireBolt(e, 28, 52, .02, 2.6); } }
  } else if (d.throws && TGT.jet) { e.cd2 -= dt; if (e.cd2 <= 0 && e.dist < 380 && TGT.pos.y - e.pos.y < 250) { e.cd2 = rand(2.5, 4); fireBolt(e, 20, 90, .02, 2.6); } }
}
function aiHover(e, dt, t) {
  const d = e.def, foot = onFootTarget(); let goal, spd = d.spd;
  if (foot && (e.dist < d.aggro || e.alert)) goal = TGT.pos; else { e.st -= dt; if (e.st <= 0) { e.st = rand(4, 9); e.wp.set(e.home.x + rand(-80, 80), 0, e.home.z + rand(-80, 80)); } goal = e.wp; spd *= .3; }
  let dx = goal.x - e.pos.x, dz = goal.z - e.pos.z; const dxz = Math.hypot(dx, dz) || 1;
  let m = 1; if (d.shriek && foot && dxz < 22) m = -.6; else if (dxz < 1.6) m = 0;
  if (dxz > 12 || m < 0) e.yaw += clamp(angDiff(Math.atan2(-dx, -dz), e.yaw), -2.5 * dt, 2.5 * dt);
  e.pos.x += dx / dxz * spd * m * dt; e.pos.z += dz / dxz * spd * m * dt;
  const gy = groundH(e.pos.x, e.pos.z), base = Math.max(gy, 0) + d.hover + Math.sin(t * 1.6 + e.ph) * .8; e.pos.y = lerp(e.pos.y, base, clamp(dt * 3, 0, 1));
  if (Math.random() < dt * 10) puff(e.pos.x + rand(-.3, .3), e.pos.y + 1, e.pos.z + rand(-.3, .3), 0, .3, 0, 1, 1.2, 2.5, d.shriek ? '#b0c0ff' : '#80e8ff', true, .25);
  e.mesh.rotation.z = Math.sin(t * 1.3 + e.ph) * .08;
  if (foot) {
    e.cd -= dt;
    if (!d.shriek && dxz < 2.6 && e.cd <= 0 && Math.abs(TGT.pos.y - 1.7 - e.pos.y) < 4) { e.cd = .55; hurtPlayer(d.dmg, 'drain'); }
  }
  if (d.shriek) {
    const lowJet = TGT.jet && TGT.pos.y - Math.max(gy, 0) < 110 && e.dist < 160;
    if (e.wind > 0) {
      e.wind -= dt; const u = 1 - e.wind / 1.1; if (e.P.mouth) e.P.mouth.scale.y = .2 + u * .5; if (e.wind <= 0) {
        if (e.P.mouth) e.P.mouth.scale.y = .2;
        if (foot && e.dist < 62) hurtPlayer(d.dmg, 'shriek'); else if (lowJet) hurtPlayer(10, 'shriek');
        for (let k = 0; k < 2; k++) puff(e.pos.x, e.pos.y + 3, e.pos.z, 0, 0, 0, .8, 4, 70, '#c8d4ff', true, .6, 'ring');
      }
    } else { e.cd2 -= dt; if (e.cd2 <= 0 && ((foot && e.dist < 60) || lowJet)) { e.wind = 1.1; e.cd2 = rand(4, 6.5); sfx.shriek(e.dist); } }
  }
}
function aiAir(e, dt, t) {
  const d = e.def, jet = TGT.jet, alive = TGT.alive && P.hp > 0; let goal = _g;
  const engage = alive && (d.boss ? e.dist < 2600 : d.kami ? e.dist < 1000 : d.shoots ? e.dist < (jet ? 2400 : 1000) : e.dist < 900) || (e.alert && alive && e.dist < 3000);
  if (d.kami) {
    if (engage) { goal.copy(TGT.pos).addScaledVector(TGT.vel, Math.min(e.dist / d.spd, 2) * .6); goal.x += Math.sin(t * 5 + e.ph) * 8; goal.y += Math.cos(t * 4 + e.ph) * 6; steer(e, goal, d.spd, 3, dt);
      if (e.dist < TGT.r + 5) { explosion(e.pos, .8); if (TGT.alive) hurtPlayer(d.dmg, 'blast'); e.hp = 0; e.alive = false; scene.remove(e.mesh); if (typeof onKill === 'function') onKill(e, true); } }
    else { e.ang += dt * .5; goal.set(e.home.x + Math.cos(e.ang) * 150, e.home.y, e.home.z + Math.sin(e.ang) * 150); steer(e, goal, 25, 1, dt); }
    if (Math.random() < dt * 25) puff(e.pos.x, e.pos.y, e.pos.z, 0, 0, 0, .5, 3.5, 1, '#ff7a18', true, .6);
  } else if (e.kind === 'bat') {
    if (engage) {
      if (e.brk > 0) { e.brk -= dt; goal.copy(e.pos).sub(TGT.pos).normalize().multiplyScalar(80).add(e.pos); goal.y += 20; }
      else { goal.copy(TGT.pos).addScaledVector(TGT.vel, Math.min(e.dist / d.spd, 1.2)); goal.x += Math.sin(t * 6 + e.ph) * 10; goal.y += Math.cos(t * 5 + e.ph) * 8; if (e.dist < TGT.r + 2.4) { e.brk = 1.4; hurtPlayer(d.dmg, 'bat'); } }
      steer(e, goal, d.spd, 4, dt);
    } else { e.ang += dt * .7; goal.set(e.home.x + Math.cos(e.ang) * 90, e.home.y + Math.sin(t + e.ph) * 12, e.home.z + Math.sin(e.ang) * 90); steer(e, goal, 22, 2, dt); }
    const f = Math.sin(t * 20 + e.ph) * .9; if (e.P.wingL) { e.P.wingL.rotation.z = -f; e.P.wingR.rotation.z = f; }
  } else { // vampire & lord
    const lord = d.boss;
    if (engage) {
      if (jet) {
        if (e.brk > 0) { e.brk -= dt; goal.copy(e.pos).sub(TGT.pos).setY(0).normalize().multiplyScalar(300).add(e.pos); goal.y = e.pos.y + 90; }
        else { goal.copy(TGT.pos).addScaledVector(TGT.vel, Math.min(e.dist / d.spd, 3) * .75); goal.x += e.side * 40; goal.y += 12; if (e.dist < (lord ? 110 : 75)) { e.brk = 2; e.side = -e.side; if (TGT.alive && e.dist < 40) hurtPlayer(d.dmg, 'claw'); } }
        steer(e, goal, d.spd, 2.1, dt);
      } else {
        e.ang += dt * (lord ? .3 : .55); e.cd2 -= dt;
        if (e.swoop > 0) { e.swoop -= dt; goal.copy(TGT.pos); goal.y += .6; if (e.dist < 3.8) { hurtPlayer(d.dmg, 'claw'); e.swoop = 0; } }
        else { const rr = lord ? 90 : 42; goal.set(TGT.pos.x + Math.cos(e.ang) * rr, TGT.pos.y + (lord ? 45 : 26) + Math.sin(t) * 7, TGT.pos.z + Math.sin(e.ang) * rr); if (e.cd2 <= 0) { e.swoop = 2.4; e.cd2 = rand(5, 9); } }
        steer(e, goal, e.swoop > 0 ? d.spd * .75 : d.spd * .55, 2.4, dt);
      }
      e.cd -= dt;
      if (e.cd <= 0 && e.dist < (jet ? (lord ? 1100 : 650) : 260)) {
        _w.copy(e.vel).normalize(); _v.copy(TGT.pos).sub(e.pos).normalize();
        if (_w.dot(_v) > .55 || e.dist < 60) {
          e.cd = lord ? (e.hp < e.maxhp * .5 ? 2.2 : 3.2) : rand(2.2, 3.4); sfx.roar(e.dist);
          const n = lord ? 3 : 1; for (let k = 0; k < n; k++) fireBolt(e, lord ? 14 : 11, jet ? 230 : 70, lord ? .05 : .012, lord ? 7 : 4);
        }
      }
      if (lord) { e.summon -= dt; if (e.summon <= 0) { e.summon = 16; const nb = enemies.filter(o => o.alive && o.kind === 'bat').length; if (nb < 40) for (let k = 0; k < 4; k++) { const b = spawnEnemy('bat', e.pos.x + rand(-8, 8), e.pos.y + rand(-8, 8), e.pos.z + rand(-8, 8), e.isl); b.home.copy(e.home); b.alert = true; } addMsg('The Lord summons bats!', 2.5); } }
    } else {
      e.ang += dt * (lord ? .18 : .25); const rr = lord ? 170 : 230;
      goal.set(e.home.x + Math.cos(e.ang) * rr, e.home.y + Math.sin(t * .5 + e.ph) * 15, e.home.z + Math.sin(e.ang) * rr); steer(e, goal, lord ? 38 : 35, 1.2, dt);
    }
    const fl = Math.sin(t * (lord ? 3.6 : 7) + e.ph) * .65; if (e.P.wingL) { e.P.wingL.rotation.z = -fl; e.P.wingR.rotation.z = fl; }
  }
  // keep clear of the ground
  const gh = Math.max(groundH(e.pos.x, e.pos.z), 0); if (e.pos.y < gh + 8) e.vel.y += 90 * dt;
  e.pos.addScaledVector(e.vel, dt);
  const sp = e.vel.length(); if (sp > 1) {
    const yaw = Math.atan2(-e.vel.x, -e.vel.z), pitch = Math.atan2(e.vel.y, Math.hypot(e.vel.x, e.vel.z));
    const bank = clamp(angDiff(yaw, e.lastYaw) / Math.max(dt, 1e-3) * .18, -.8, .8); e.lastYaw = yaw;
    const pk = d.air && (e.kind === 'vampire' || d.boss) ? .6 : .9; e.mesh.rotation.set(pitch * pk, yaw, -bank * .6);
  }
}
let reinfT = 20;
function updateEnemies(dt, t) {
  for (const e of enemies) {
    if (!e.alive) continue;
    const dx = TGT.pos.x - e.pos.x, dy = TGT.pos.y - e.pos.y, dz = TGT.pos.z - e.pos.z; e.dist = Math.sqrt(dx * dx + dy * dy + dz * dz); e.t += dt;
    e.vis = e.dist < 3000; e.mesh.visible = e.vis; if (!e.vis && !e.def.boss) continue; if (!e.vis && e.dist > 6000) continue;
    const d = e.def;
    if (d.gnd) aiGround(e, dt); else if (d.hover) aiHover(e, dt, t); else aiAir(e, dt, t);
    e.mesh.position.copy(e.pos); if (!d.air) e.mesh.rotation.y = e.yaw;
  }
  updateBolts(dt); updatePickups(dt);
  reinfT -= dt; if (reinfT <= 0) { reinfT = P.mode === 'jet' ? 28 : 18; reinforce(); }
}
function reinforce() {
  const s = nearestIsland(TGT.pos.x, TGT.pos.z);
  if (P.mode === 'foot') {
    const near = enemies.filter(e => e.alive && !e.def.air && e.dist < 450).length; if (near > 14) return;
    for (let k = 0; k < 2; k++) for (let tr = 0; tr < 12; tr++) {
      const a = rand(0, TAU), dd = rand(130, 230), x = TGT.pos.x + Math.cos(a) * dd, z = TGT.pos.z + Math.sin(a) * dd, gy = groundH(x, z); if (gy < 1.6) continue;
      const kind = pick(['thrall', 'thrall', 'ghoul', 'wraith', 'lycan', 'banshee', 'ghoul']), def = EDEF[kind]; const e = spawnEnemy(kind, x, def.hover ? gy + def.hover : gy, z, s.id); e.alert = true; break;
    }
  } else {
    const n = enemies.filter(e => e.alive && e.def.air && !e.def.boss).length; if (n > 44) return;
    for (let k = 0; k < 3; k++) {
      const a = rand(0, TAU), dd = rand(700, 1200), x = s.x + Math.cos(a) * dd * .5, z = s.z + Math.sin(a) * dd * .5, kind = pick(['vampire', 'vampire', 'bat', 'skull']);
      const e = spawnEnemy(kind, x, Math.max(groundH(x, z), 0) + rand(80, 300), z, s.id); e.home.copy(e.pos);
    }
  }
}
populate();
