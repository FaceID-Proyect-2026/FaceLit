const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const Module = require('node:module');
const filename = path.resolve(__dirname, '../features/facial/liveness.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const loaded = new Module(filename, module);
loaded._compile(compiled.outputText, filename);
const { ActiveChallenge, eyeOpenness } = loaded.exports;
const observe = (tracker, pose, time, eyes = 0.3, happy = 0) => tracker.observe(pose, time, 0, eyes, happy);

for (const pose of ['blink', 'blink_twice', 'smile']) {
  const tracker = new ActiveChallenge();
  for (let time = 0; time < 4000; time += 100)
    assert.equal(observe(tracker, pose, time, 0.3, 0.9), null, 'Static expression must not satisfy action');
}
const blink = new ActiveChallenge();
for (const [time, eyes] of [[0, .3], [100, .3], [300, .1], [500, .3]])
  assert.equal(observe(blink, 'blink', time, eyes), null);
assert.equal(observe(blink, 'blink', 700).blinks, 1);

const twice = new ActiveChallenge();
for (const [time, eyes] of [[0, .3], [200, .1], [400, .3], [700, .3], [800, .1]])
  assert.equal(observe(twice, 'blink_twice', time, eyes), null);
assert.equal(observe(twice, 'blink_twice', 1000).blinks, 2);

const closed = new ActiveChallenge();
for (const [time, eyes] of [[0, .1], [200, .1], [500, .3], [800, .3]])
  assert.equal(observe(closed, 'blink', time, eyes), null, 'Must first observe open eyes');

const slow = new ActiveChallenge();
for (const [time, eyes] of [[0, .3], [200, .1], [700, .1], [1100, .3], [1300, .3]])
  assert.equal(observe(slow, 'blink', time, eyes), null, 'Prolonged closure is not a blink');

const smile = new ActiveChallenge();
for (const [time, happy] of [[0, 0], [200, 0.9], [400, .9], [600, .9]])
  assert.equal(observe(smile, 'smile', time, .3, happy), null);
assert.equal(observe(smile, 'smile', 800, .3, .9).smileTransition, true);

const gap = new ActiveChallenge();
for (const time of [0, 200, 400, 1700, 1900, 2100])
  assert.equal(observe(gap, 'center', time), null, 'Long gap resets hold');
assert.ok(observe(gap, 'center', 2400));
gap.reset();
for (let i = 0; i < 10; i++) assert.equal(observe(gap, 'center', 500), null, 'Repeated timestamps do not progress');
assert.ok(Number.isNaN(eyeOpenness([])), 'Missing landmarks cannot count as a gesture');
console.log('Liveness: static faces, blink transitions, double blink, smile, gaps and stale timestamps passed.');
