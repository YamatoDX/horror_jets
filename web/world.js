'use strict';
/* =====================================================================
   WORLD: three islands (open fields) in a dark ocean, airfields, props
   ===================================================================== */
const ISL_R = 1000, ISL_N = 250, ISL_CELL = 2 * ISL_R / ISL_N, FLAT = 380, LAND_Y = 4;
const ISL = [
  { id: 0, name: 'BLACKMOOR FIELD', short: 'A', x: 0, z: 0, rot: 0.15, seed: 11, hill: 42, mt: 2.4, pal: { grass: [.2, .29, .17], dry: [.3, .28, .18], rock: [.42, .42, .46], sand: [.34, .31, .25], peak: [.62, .62, .66] } },
  { id: 1, name: 'HOLLOW HEATH', short: 'B', x: 3000, z: -900, rot: 0.9, seed: 23, hill: 30, mt: -0.6, pal: { grass: [.38, .33, .15], dry: [.47, .38, .2], rock: [.48, .4, .36], sand: [.42, .36, .26], peak: [.62, .52, .45] } },
  { id: 2, name: 'CARRION ISLE', short: 'C', x: -1200, z: 2800, rot: -1.2, seed: 37, hill: 75, mt: 1.0, pal: { grass: [.3, .33, .3], dry: [.4, .38, .34], rock: [.62, .58, .52], sand: [.45, .42, .36], peak: [.85, .83, .8] } }
];
const COLS = new Map(), CC = 40;
const ckey = (cx, cz) => (cx + 600) * 1400 + (cz + 600);
function addCol(x, z, r) { const k = ckey(Math.floor(x / CC), Math.floor(z / CC)); let a = COLS.get(k); if (!a) COLS.set(k, a = []); a.push({ x, z, r }); }
function pushOut(p, r) {
  let hit = false; const cx = Math.floor(p.x / CC), cz = Math.floor(p.z / CC);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    const a = COLS.get(ckey(cx + i, cz + j)); if (!a) continue;
    for (const c of a) { const dx = p.x - c.x, dz = p.z - c.z, m = r + c.r, d2 = dx * dx + dz * dz; if (d2 < m * m) { const d = Math.sqrt(d2) || .01; p.x = c.x + dx / d * m; p.z = c.z + dz / d * m; hit = true; } }
  }
  return hit;
}
function islandHeight(s, wx, wz) {
  const dx = wx - s.x, dz = wz - s.z, d = Math.hypot(dx, dz);
  const n = fbm(wx * .0035 + s.seed, wz * .0035 + s.seed * 1.7, 4), n2 = fbm(wx * .02 + 9, wz * .02 + s.seed, 3);
  const ang = Math.atan2(dz, dx), mt = Math.pow(Math.cos(ang - s.mt) * .5 + .5, 2);
  let h = LAND_Y + smooth(FLAT, FLAT + 280, d) * s.hill * (.15 + 1.1 * n + mt * 1.0);
  h += (n2 - .5) * 3 * smooth(300, 560, d) + (n2 - .5) * .35;
  const cw = (n - .5) * 150; h = lerp(h, -38, smooth(700 + cw, 940 + cw, d));
  return h;
}
function groundH(x, z) {
  for (let k = 0; k < 3; k++) {
    const s = ISL[k], lx = x - s.x + ISL_R, lz = z - s.z + ISL_R;
    if (lx >= 0 && lz >= 0 && lx < 2 * ISL_R && lz < 2 * ISL_R) {
      const fx = lx / ISL_CELL, fz = lz / ISL_CELL, i = Math.min(fx | 0, ISL_N - 1), j = Math.min(fz | 0, ISL_N - 1), u = fx - i, v = fz - j, w = ISL_N + 1, h = s.hm;
      const a = h[j * w + i], b = h[j * w + i + 1], c = h[(j + 1) * w + i], d = h[(j + 1) * w + i + 1];
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
  }
  return -40;
}
function slopeAt(x, z) { const gx = (groundH(x + 5, z) - groundH(x - 5, z)) / 10, gz = (groundH(x, z + 5) - groundH(x, z - 5)) / 10; return Math.hypot(gx, gz); }
function islandAt(x, z) { for (const s of ISL) if (Math.abs(x - s.x) < ISL_R && Math.abs(z - s.z) < ISL_R) return s.id; return -1; }
function nearestIsland(x, z) { let b = 0, bd = 1e12; for (const s of ISL) { const d = (x - s.x) ** 2 + (z - s.z) ** 2; if (d < bd) { bd = d; b = s.id; } } return ISL[b]; }
function afw(s, lx, lz) { const c = Math.cos(s.rot), n = Math.sin(s.rot); return [s.x + lx * c - lz * n, s.z + lx * n + lz * c]; }
function yawOf(dx, dz) { return Math.atan2(-dx, -dz); }

/* ---------------------------------------------------------------- textures */
function canvasTex(w, h, fn, repeat) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (repeat) t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 4; return t; }
const DETAIL = canvasTex(256, 256, (g, w, h) => {
  const im = g.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = .72 + .22 * fbm(x / 24, y / 24, 3) + (Math.random() - .5) * .12; const i = (y * w + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = clamp(v, 0, 1) * 255; im.data[i + 3] = 255;
  } g.putImageData(im, 0, 0);
});
const STONE = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#8b8d92'; g.fillRect(0, 0, w, h); const r = mulberry(4);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) { const ox = (y % 2) * 16, v = 105 + r() * 55; g.fillStyle = `rgb(${v},${v + 2},${v + 8})`; g.fillRect(x * 32 + ox + 1, y * 16 + 1, 30, 14); }
  g.strokeStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 160; i++) { g.beginPath(); g.moveTo(r() * w, r() * h); g.lineTo(r() * w, r() * h); g.stroke(); }
});
const matStone = new THREE.MeshLambertMaterial({ map: STONE, color: 0xb0b2ba });
const matDark = new THREE.MeshLambertMaterial({ color: 0x2a2a30 });
const matWood = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
function boxT(w, h, d, tile) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, t = tile || 4, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); } return g;
}
const runwayTex = canvasTex(2048, 128, (g, w, h) => {
  g.fillStyle = '#2b2d31'; g.fillRect(0, 0, w, h); const im = g.getImageData(0, 0, w, h);
  for (let i = 0; i < im.data.length; i += 4) { const v = (Math.random() - .5) * 18; im.data[i] += v; im.data[i + 1] += v; im.data[i + 2] += v; } g.putImageData(im, 0, 0);
  g.fillStyle = '#d8d8cc'; for (let x = 150; x < w - 150; x += 80) g.fillRect(x, h / 2 - 3, 44, 6);
  g.fillRect(0, 6, w, 3); g.fillRect(0, h - 9, w, 3);
  for (const e of [0, 1]) for (let k = 0; k < 8; k++) g.fillRect(e ? w - 60 : 14, 18 + k * 12, 46, 6);
  g.font = 'bold 40px sans-serif'; g.fillStyle = '#d8d8cc'; g.save(); g.translate(120, 90); g.rotate(Math.PI / 2); g.fillText('27', -20, 0); g.restore();
  g.save(); g.translate(w - 90, 40); g.rotate(-Math.PI / 2); g.fillText('09', -20, 0); g.restore();
});
const mistTex = canvasTex(256, 256, (g, w, h) => {
  const im = g.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const r = Math.hypot(x - w / 2, y - h / 2) / (w / 2), v = Math.pow(fbm(x / 28, y / 28, 4), 2.0) * 2.0 * (1 - smooth(.15, .9, r)); const i = (y * w + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = clamp(v, 0, 1) * 150;
  } g.putImageData(im, 0, 0);
}); mistTex.wrapS = mistTex.wrapT = THREE.ClampToEdgeWrapping;
/* ---------------------------------------------------------------- terrain */
function genIsland(s) {
  const w = ISL_N + 1, hm = s.hm = new Float32Array(w * w);
  for (let j = 0; j < w; j++) for (let i = 0; i < w; i++) hm[j * w + i] = islandHeight(s, s.x - ISL_R + i * ISL_CELL, s.z - ISL_R + j * ISL_CELL);
  const pos = new Float32Array(w * w * 3), col = new Float32Array(w * w * 3), uv = new Float32Array(w * w * 2), idx = [], P = s.pal;
  for (let j = 0; j < w; j++) for (let i = 0; i < w; i++) {
    const k = j * w + i, h = hm[k], x = i * ISL_CELL - ISL_R, z = j * ISL_CELL - ISL_R;
    pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; uv[k * 2] = x / 22; uv[k * 2 + 1] = z / 22;
    const sx = (hm[j * w + Math.min(i + 1, w - 1)] - hm[j * w + Math.max(i - 1, 0)]) / (2 * ISL_CELL), sz = (hm[Math.min(j + 1, w - 1) * w + i] - hm[Math.max(j - 1, 0) * w + i]) / (2 * ISL_CELL), sl = Math.hypot(sx, sz);
    const n = fbm((x + s.x) * .012, (z + s.z) * .012, 3); let c = [lerp(P.grass[0], P.dry[0], n), lerp(P.grass[1], P.dry[1], n), lerp(P.grass[2], P.dry[2], n)];
    const mix = (a, t) => { c = [lerp(c[0], a[0], t), lerp(c[1], a[1], t), lerp(c[2], a[2], t)]; };
    mix(P.rock, smooth(.28, .75, sl)); mix(P.peak, smooth(34, 80, h) * .85); mix(P.sand, 1 - smooth(1.2, 3.4, h));
    const sh = clamp(.82 + (sx * .5 + sz * .5) * -.35, .55, 1.15), j2 = 1 + (Math.random() - .5) * .08;
    col[k * 3] = c[0] * sh * j2 * 1.75; col[k * 3 + 1] = c[1] * sh * j2 * 1.75; col[k * 3 + 2] = c[2] * sh * j2 * 1.75;
  }
  for (let j = 0; j < ISL_N; j++) for (let i = 0; i < ISL_N; i++) { const a = j * w + i, b = a + 1, c = a + w, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, map: DETAIL })); m.position.set(s.x, 0, s.z); scene.add(m); s.mesh = m;
  const mist = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshBasicMaterial({ map: mistTex, color: 0x8fa0c8, transparent: true, opacity: .28, depthWrite: false }));
  mist.rotation.x = -Math.PI / 2; mist.position.set(s.x, LAND_Y + 5, s.z); scene.add(mist); s.mist = mist;
}

/* ---------------------------------------------------------------- props */
const beacons = [], flicker = [];
function glowSprite(parent, x, y, z, size, color, op) {
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: op == null ? .9 : op }));
  m.position.set(x, y, z); m.scale.set(size, size, 1); parent.add(m); return m;
}
function addBox(parent, w, h, d, x, y, z, mat, ry) { const m = new THREE.Mesh(boxT(w, h, d), mat || matStone); m.position.set(x, y, z); if (ry) m.rotation.y = ry; parent.add(m); return m; }
function localGroup(s) { const g = new THREE.Group(); g.position.set(s.x, 0, s.z); g.rotation.y = -s.rot; scene.add(g); return g; }
function brokenWall(list, s, x0, z0, x1, z1, hmax, th) {
  const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 3)), ang = Math.atan2(z1 - z0, x1 - x0);
  for (let i = 0; i < n; i++) {
    const t = (i + .5) / n, x = lerp(x0, x1, t), z = lerp(z0, z1, t), r = Math.random(), h = r < .2 ? 0 : hmax * (r < .5 ? .35 + Math.random() * .3 : .85 + Math.random() * .15); if (h < .5) continue;
    const gy = groundH(...afw(s, x, z));
    list.push([boxT(len / n + .05, h, th, 4), M4(x, gy + h / 2, z, 0, -ang, 0)]);
    if (i % 2 === 0) { const [wx, wz] = afw(s, x, z); addCol(wx, wz, 2.4); }
  }
}
function ruinWalls(s, g, cx, cz, w, d, h) {
  const list = [], hw = w / 2, hd = d / 2;
  brokenWall(list, s, cx - hw, cz - hd, cx + hw, cz - hd, h, 1.2); brokenWall(list, s, cx + hw, cz - hd, cx + hw, cz + hd, h, 1.2);
  brokenWall(list, s, cx + hw, cz + hd, cx - hw, cz + hd, h, 1.2); brokenWall(list, s, cx - hw, cz + hd, cx - hw, cz - hd, h, 1.2);
  for (const [px, pz] of [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd], [0, -hd], [0, hd]]) { const ph = h * (.7 + Math.random() * .6); list.push([new THREE.CylinderGeometry(.9, 1.1, ph, 8), M4(cx + px, groundH(...afw(s, cx + px, cz + pz)) + ph / 2, cz + pz)]); }
  const m = new THREE.Mesh(mergeGeos(list), matStone); g.add(m);
}
function mkTreeGeo() {
  const L = [[new THREE.CylinderGeometry(.14, .38, 7, 6), M4(0, 3.5, 0)]], r = mulberry(8);
  for (let i = 0; i < 6; i++) { const a = r() * TAU, y = 2.5 + r() * 4, len = 2.2 + r() * 2; L.push([new THREE.CylinderGeometry(.04, .13, len, 5), M4(Math.cos(a) * len * .35, y + len * .3, Math.sin(a) * len * .35, Math.sin(a) * .9, 0, -Math.cos(a) * .9)]); }
  return mergeGeos(L);
}
const TREEGEO = mkTreeGeo();
function scatterTrees(s, n, dmin, dmax, mat) {
  const ms = [], r = mulberry(s.seed * 7);
  for (let i = 0, tries = 0; i < n && tries < n * 6; tries++) {
    const a = r() * TAU, d = lerp(dmin, dmax, Math.sqrt(r())), x = s.x + Math.cos(a) * d, z = s.z + Math.sin(a) * d, gy = groundH(x, z); if (gy < 1.8) continue;
    const lx = (x - s.x) * Math.cos(s.rot) + (z - s.z) * Math.sin(s.rot), lz = -(x - s.x) * Math.sin(s.rot) + (z - s.z) * Math.cos(s.rot);
    if (Math.abs(lz) < 75 && Math.abs(lx) < 580) continue; if (Math.hypot(lx + 380, lz - 50) < 110) continue;
    const sc = .7 + r() * .9; ms.push(M4(x, gy - .3, z, 0, r() * TAU, (r() - .5) * .2, sc, sc * (.9 + r() * .4), sc)); if (d > 100) addCol(x, z, .7 * sc); i++;
  }
  instances(TREEGEO, mat || new THREE.MeshLambertMaterial({ color: 0x32261c }), ms);
}
function graveyard(s, lx, lz, rows, cols, ang) {
  const slabs = [], crosses = [], r = mulberry(lx * 31 + lz), c0 = Math.cos(ang), s0 = Math.sin(ang);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    if (r() < .12) continue; const a = (i - rows / 2) * 5.5 + (r() - .5), b = (j - cols / 2) * 3.4 + (r() - .5);
    const [x, z] = afw(s, lx + a * c0 - b * s0, lz + a * s0 + b * c0), gy = groundH(x, z); if (gy < 1.5) continue;
    const yaw = -s.rot + ang + (r() - .5) * .3; (r() < .25 ? crosses : slabs).push(M4(x, gy, z, (r() - .5) * .25, yaw, (r() - .5) * .25, .7 + r() * .5, .7 + r() * .6, 1));
  }
  const gm = new THREE.MeshLambertMaterial({ color: 0x80848c });
  instances(mergeGeos([[new THREE.BoxGeometry(.9, 1.3, .22), M4(0, .65, 0)], [new THREE.CylinderGeometry(.45, .45, .22, 8), M4(0, 1.3, 0, Math.PI / 2, 0, 0)]]), gm, slabs);
  instances(mergeGeos([[new THREE.BoxGeometry(.2, 2, .2), M4(0, 1, 0)], [new THREE.BoxGeometry(1.1, .2, .2), M4(0, 1.5, 0)]]), gm, crosses);
}
function brazier(g, x, y, z) {
  const b = new THREE.Mesh(new THREE.CylinderGeometry(.6, .35, .9, 8), matDark); b.position.set(x, y + .45, z); g.add(b);
  flicker.push(glowSprite(g, x, y + 1.4, z, 4.5, 0xff7a20, .85));
}
function buildAirfield(s) {
  const g = localGroup(s); s.group = g;
  const rw = new THREE.Mesh(new THREE.PlaneGeometry(1000, 40), new THREE.MeshLambertMaterial({ map: runwayTex, color: 0xdddddd })); rw.rotation.x = -Math.PI / 2; rw.position.set(0, LAND_Y + .07, 0); g.add(rw);
  const tw = new THREE.MeshLambertMaterial({ color: 0x35373c });
  for (const [x, z, w, d] of [[-300, 34, 26, 30], [-370, 52, 200, 40]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), tw); p.rotation.x = -Math.PI / 2; p.position.set(x, LAND_Y + .06, z); g.add(p); }
  const pts = [], cols = [];
  for (let x = -500; x <= 500; x += 25) for (const z of [-21, 21]) { pts.push(x, LAND_Y + .5, z); const e = x === -500 ? [.2, 1, .3] : x === 500 ? [1, .2, .2] : [1, .95, .7]; cols.push(...e); }
  for (let x = -460; x <= -280; x += 30) { pts.push(x, LAND_Y + .5, 32, x, LAND_Y + .5, 72); cols.push(.3, .5, 1, .3, .5, 1); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); pg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  g.add(new THREE.Points(pg, new THREE.PointsMaterial({ size: 7, map: TEX.glow, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
  // control tower
  addBox(g, 7, 20, 7, -200, LAND_Y + 10, -75, matStone); addBox(g, 11, 4, 11, -200, LAND_Y + 22, -75, new THREE.MeshLambertMaterial({ color: 0x405a70 }));
  addBox(g, 12, 1, 12, -200, LAND_Y + 24.5, -75, matDark); glowSprite(g, -200, LAND_Y + 22, -75, 16, 0xffd890, .55);
  const bc = glowSprite(g, -200, LAND_Y + 27, -75, 9, 0xff2020, 1); beacons.push(bc);
  { const [wx, wz] = afw(s, -200, -75); addCol(wx, wz, 7); }
  // hangars
  for (const hx0 of [-340, -290]) {
    addBox(g, 30, 9, 22, hx0, LAND_Y + 4.5, -110, new THREE.MeshLambertMaterial({ color: 0x5a6068 }));
    const rf = new THREE.Mesh(new THREE.ConeGeometry(15.5, 6, 4), matDark); rf.rotation.y = Math.PI / 4; rf.scale.set(1, 1, .75); rf.position.set(hx0, LAND_Y + 12, -110); g.add(rf);
    addBox(g, 14, 7, .4, hx0, LAND_Y + 3.5, -98.7, matDark);
    for (let k = -1; k <= 1; k++) { const [wx, wz] = afw(s, hx0 + k * 10, -110); addCol(wx, wz, 9); }
  }
  // fuel truck, crates
  for (let i = 0; i < 5; i++) addBox(g, 3, 2, 2, -400 + i * 7 + rand(-1, 1), LAND_Y + 1, 95 + rand(-3, 3), new THREE.MeshLambertMaterial({ color: pick([0x3a4a30, 0x4a4030, 0x30384a]) }), rand(0, 1));
  s.pad = [[-450, 52], [-410, 52], [-370, 52]];
  // lord's nest crypt
  const cx = 150, cz = -300, [nx, nz] = afw(s, cx, cz), ny = groundH(nx, nz); s.nest = new V3(nx, ny, nz);
  addBox(g, 26, 1.2, 26, cx, LAND_Y + .6, cz, matStone); addBox(g, 13, 9, 17, cx, LAND_Y + 5.7, cz, matStone);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(11.5, 7, 4), matDark); roof.rotation.y = Math.PI / 4; roof.scale.set(1.1, 1, 1.4); roof.position.set(cx, LAND_Y + 13.7, cz); g.add(roof);
  for (const [dx, dz] of [[-6, 9.5], [6, 9.5], [-6, -9.5], [6, -9.5]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.7, .8, 9, 8), matStone); c.position.set(cx + dx, LAND_Y + 5.5, cz + dz); g.add(c); }
  const door = new THREE.Mesh(new THREE.PlaneGeometry(4, 6.5), new THREE.MeshBasicMaterial({ color: 0xff2a10 })); door.position.set(cx, LAND_Y + 4.5, cz + 8.55); g.add(door);
  glowSprite(g, cx, LAND_Y + 4.5, cz + 12, 26, 0xff2010, .7);
  for (const [dx, dz] of [[-12, 12], [12, 12], [-12, -12], [12, -12]]) brazier(g, cx + dx, LAND_Y + 1.2, cz + dz);
  addCol(nx, nz, 12);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(4, 9, 600, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xff2030, transparent: true, opacity: .13, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.set(cx, LAND_Y + 300, cz); g.add(beam); s.beam = beam;
  return g;
}
function buildBlackmoor(s) {
  const g = s.group;
  graveyard(s, -180, -230, 9, 14, .2); graveyard(s, 260, 240, 8, 12, -.3); graveyard(s, -330, 200, 7, 10, .5); graveyard(s, 120, 300, 6, 9, 0);
  ruinWalls(s, g, -120, -270, 34, 16, 9); // chapel
  ruinWalls(s, g, 330, -120, 18, 14, 6);
  for (let i = 0; i < 14; i++) { const a = rand(0, TAU), d = rand(120, 470), [x, z] = afw(s, Math.cos(a) * d, Math.sin(a) * d); if (Math.abs(Math.sin(a) * d) < 80) continue; glowSprite(scene, x, groundH(x, z) + rand(1.2, 3), z, 3, 0x6fd0ff, .8); }
  scatterTrees(s, 520, 120, 760);
}
function buildHeath(s) {
  const g = s.group;
  const stones = [];
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, [x, z] = afw(s, 300 + Math.cos(a) * 30, 200 + Math.sin(a) * 30), gy = groundH(x, z), h = 6 + Math.random() * 3; stones.push([boxT(1.8, h, 1.2, 4), M4(x, gy + h / 2, z, (Math.random() - .5) * .15, a + 1.5, (Math.random() - .5) * .12)]); addCol(x, z, 1.4); }
  scene.add(new THREE.Mesh(mergeGeos(stones), matStone));
  // burnt windmill
  const [wx, wz] = afw(s, -250, -240), wy = groundH(wx, wz), mill = new THREE.Group(); mill.position.set(wx, wy, wz); scene.add(mill);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(4, 6.5, 22, 10), new THREE.MeshLambertMaterial({ color: 0x3a342f })); tower.position.y = 11; mill.add(tower);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(5.2, 6, 10), matDark); cap.position.y = 25; mill.add(cap);
  const hub = new THREE.Group(); hub.position.set(0, 21, 5.5); mill.add(hub);
  for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.4, 17, .3), matWood); b.position.y = 0; const arm = new THREE.Group(); arm.rotation.z = i * Math.PI / 2 + .3; b.position.y = 9; arm.add(b); hub.add(arm); }
  s.mill = hub; addCol(wx, wz, 7); flicker.push(glowSprite(mill, 0, 24, 0, 10, 0xff6a18, .6));
  // haystacks & fence
  const hs = []; for (let i = 0; i < 24; i++) { const [x, z] = afw(s, rand(-100, 220) - 80, rand(150, 330)), gy = groundH(x, z); if (gy < 2) continue; hs.push(M4(x, gy + 1.4, z, 0, rand(0, 6), 0, 1 + rand(0, .4), 1, 1 + rand(0, .4))); }
  instances(new THREE.ConeGeometry(2.4, 3.4, 8), new THREE.MeshLambertMaterial({ color: 0x8a7030 }), hs);
  const fence = []; for (let i = 0; i < 40; i++) { const [x, z] = afw(s, -220 + i * 4, 120), gy = groundH(x, z); if (Math.random() < .2) continue; fence.push([new THREE.BoxGeometry(.2, 1.4, .2), M4(x, gy + .7, z)], [new THREE.BoxGeometry(4, .15, .1), M4(x, gy + 1, z, 0, -s.rot, 0)]); }
  scene.add(new THREE.Mesh(mergeGeos(fence), matWood));
  ruinWalls(s, g, 120, 330, 24, 12, 7);
  const barnBurn = glowSprite(scene, ...(() => { const [x, z] = afw(s, 120, 330); return [x, groundH(x, z) + 4, z]; })(), 22, 0xff5a10, .6); flicker.push(barnBurn);
  graveyard(s, -300, -60, 5, 8, 1);
  scatterTrees(s, 260, 120, 760, new THREE.MeshLambertMaterial({ color: 0x2e241a }));
}
function buildCarrion(s) {
  const spires = [], r = mulberry(99);
  for (let i = 0; i < 160; i++) { const a = r() * TAU, d = lerp(330, 760, r()), x = s.x + Math.cos(a) * d, z = s.z + Math.sin(a) * d, gy = groundH(x, z); if (gy < 3) continue; const h = 6 + r() * 28; spires.push(M4(x, gy + h / 2 - 2, z, (r() - .5) * .3, r() * 6, (r() - .5) * .3, 1 + r(), h / 6, 1 + r())); if (h > 18) addCol(x, z, 2.2); }
  instances(new THREE.ConeGeometry(2.4, 6, 6), new THREE.MeshLambertMaterial({ color: 0xcfc8b4 }), spires);
  // rib arches near the nest
  const ribs = [], [nx, nz] = afw(s, 150, -300);
  for (let i = 0; i < 8; i++) { const [x, z] = afw(s, 150 - 60 + i * 9, -300 + 38), gy = groundH(x, z); ribs.push([new THREE.TorusGeometry(9 - Math.abs(i - 3.5) * .5, .55, 6, 14, Math.PI), M4(x, gy, z, 0, -s.rot + Math.PI / 2, 0)]); }
  scene.add(new THREE.Mesh(mergeGeos(ribs), new THREE.MeshLambertMaterial({ color: 0xd8d2bf })));
  // skull rock
  const [kx, kz] = afw(s, -200, 270), ky = groundH(kx, kz), sk = new THREE.Group(); sk.position.set(kx, ky, kz); sk.rotation.y = -s.rot + 2.2; scene.add(sk);
  const bone = new THREE.MeshLambertMaterial({ color: 0xcfc8b4 }), cr = new THREE.Mesh(new THREE.SphereGeometry(16, 14, 10), bone); cr.scale.set(1, .85, 1.1); cr.position.y = 12; sk.add(cr);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(16, 6, 14), bone); jaw.position.set(0, 3, 4); sk.add(jaw);
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(4, 10, 8), new THREE.MeshBasicMaterial({ color: 0x120808 })); e.position.set(sx * 6, 13, 13); sk.add(e); flicker.push(glowSprite(sk, sx * 6, 13, 15, 9, 0xff2a20, .9)); }
  addCol(kx, kz, 16);
  graveyard(s, 300, 120, 5, 8, .4);
  scatterTrees(s, 140, 160, 700, new THREE.MeshLambertMaterial({ color: 0x4a4038 }));
}

/* ---------------------------------------------------------------- map image */
const MAPB = { x0: -2400, z0: -2100, w: 6600, h: 6100, s: 6 };
let MAPIMG = null;
function buildMapImage() {
  const W = Math.ceil(MAPB.w / MAPB.s), H = Math.ceil(MAPB.h / MAPB.s), c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), im = g.createImageData(W, H);
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const wx = MAPB.x0 + px * MAPB.s, wz = MAPB.z0 + py * MAPB.s, h = groundH(wx, wz), i = (py * W + px) * 4; let r, gg, b;
    if (h < -12) { r = 6; gg = 16; b = 34; } else if (h < .3) { const t = (h + 12) / 12.3; r = lerp(8, 18, t); gg = lerp(26, 62, t); b = lerp(48, 88, t); }
    else {
      const id = islandAt(wx, wz), P = ISL[id < 0 ? 0 : id].pal, sh = (groundH(wx - 8, wz - 8) - groundH(wx + 8, wz + 8)) * .03, t = clamp(h / 70, 0, 1), cc = t < .35 ? P.grass : P.rock, k = clamp(.75 + sh + t * .4, .4, 1.15);
      r = cc[0] * 255 * k * 1.5; gg = cc[1] * 255 * k * 1.5; b = cc[2] * 255 * k * 1.5;
    }
    im.data[i] = r; im.data[i + 1] = gg; im.data[i + 2] = b; im.data[i + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  for (const s of ISL) {
    g.save(); g.translate((s.x - MAPB.x0) / MAPB.s, (s.z - MAPB.z0) / MAPB.s); g.rotate(s.rot); g.fillStyle = '#d6d2c0'; g.fillRect(-500 / MAPB.s, -20 / MAPB.s, 1000 / MAPB.s, 40 / MAPB.s);
    g.fillStyle = '#4a4e58'; g.fillRect(-470 / MAPB.s, 32 / MAPB.s, 200 / MAPB.s, 40 / MAPB.s); g.restore();
  }
  MAPIMG = c;
}

function buildWorld() {
  for (const s of ISL) genIsland(s);
  for (const s of ISL) buildAirfield(s);
  buildBlackmoor(ISL[0]); buildHeath(ISL[1]); buildCarrion(ISL[2]);
  buildMapImage();
}
function updateWorld(t) {
  for (const s of ISL) s.mist.rotation.z = t * .004;
  beacons.forEach((b, i) => b.visible = ((t * 1.2 + i * .3) % 2) < .25);
  flicker.forEach((f, i) => { const k = .75 + .25 * Math.sin(t * 13 + i * 2.1) * Math.sin(t * 7.3 + i); f.material.opacity = .55 * k + .3; });
  if (ISL[1].mill) ISL[1].mill.rotation.z = t * .15;
}
buildWorld();
