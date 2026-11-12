// Run with: node --test tests/experience.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const web = path.join(__dirname, '..', 'web');

function browser(saved = '{}') {
  const listeners = {};
  const draw = new Proxy({
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createLinearGradient: () => ({ addColorStop() {} })
  }, { get: (o, k) => k in o ? o[k] : () => {} });
  const elements = {};
  const element = () => ({ innerHTML: '', classList: { add() {}, remove() {} },
    addEventListener(name, fn) { (listeners[name] ||= []).push(fn); },
    getContext: () => draw, contains: () => false });
  const document = { createElement: element, body: { requestPointerLock() {} },
    getElementById: id => elements[id] ||= element(),
    addEventListener(name, fn) { (listeners[name] ||= []).push(fn); }, exitPointerLock() {} };
  const context = vm.createContext({ console, document, performance, Uint8ClampedArray,
    location: { hash: '' }, navigator: {}, HTMLElement: class {},
    localStorage: { getItem: () => saved, setItem: (_, value) => { saved = value; } },
    fetch: () => Promise.resolve(), setInterval() {}, requestAnimationFrame() {} });
  context.window = context;
  context.innerWidth = 1280; context.innerHeight = 760;
  context.addEventListener = document.addEventListener;
  const run = source => vm.runInContext(source, context);
  run(fs.readFileSync(path.join(web, 'three.min.js'), 'utf8'));
  run('THREE.WebGLRenderer = class { setPixelRatio() {} setSize() {} render() {} };');
  for (const file of ['settings', 'core', 'world', 'jets', 'enemies', 'game']) {
    run(fs.readFileSync(path.join(web, file + '.js'), 'utf8'));
  }
  return { run, elements, listeners };
}

test('sortie flow clears input, freezes references, navigates to living Lords and wins after pause', () => {
  const { run, elements } = browser();
  assert.match(elements.ov.innerHTML, /Begin sortie/);
  run('startGame(); frame(1000);');
  assert.equal(run('state'), 'play');
  assert.equal(run('P.mode'), 'foot');
  run("keys.KeyW = true; mouse.l = true; JI.missile = true; pressed('KeyM');");
  const time = run('gameT');
  run('frame(2000);');
  assert.equal(run('gameT'), time);
  assert.equal(run('mouse.l || keys.KeyW || JI.missile'), false);
  run("pressed('Escape'); pressed('Tab'); frame(3000);");
  assert.equal(run('gameT'), time);
  run("pressed('Escape'); pressed('Escape');");
  assert.equal(run('state'), 'pause');
  run('resume(); boardJet(jets[0]);');
  assert.equal(run('navTarget().name.startsWith("LORD OF ")'), true);
  run('ISL[0].lord.alive = false; onLordKilled(ISL[0].lord);');
  assert.equal(run('navTarget().name === "LORD OF " + ISL[0].short'), false);
  run('P.lords = 2; onLordKilled(ISL[1].lord); pause(); frame(10000);');
  assert.equal(run('state'), 'pause');
  run('resume(); for (let i = 0; i < 80; i++) frame(11000 + i * 50);');
  assert.equal(run('state'), 'win');
});

test('saved settings handle malformed storage and clamp numeric values', () => {
  assert.equal(browser('{broken').run('OPTIONS.volume'), 65);
  const { run } = browser('{"volume":-20,"sensitivity":900,"reducedMotion":true}');
  assert.equal(run('OPTIONS.volume'), 0);
  assert.equal(run('OPTIONS.sensitivity'), 200);
  assert.equal(run('OPTIONS.reducedMotion'), true);
});
