const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../shared/services/facialEmbeddingService.ts'), 'utf8');
const calls = [];
const api = { post: async (...args) => { calls.push(args); return { data: { live: true, status: 'ACTIVE' } }; } };
const moduleRef = { exports: {} };
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
new Function('require', 'module', 'exports', js)((name) => {
  if (name === './api') return { api };
  if (name === '@/shared/constants/api') return { API_URL: 'http://backend.test' };
  throw new Error(`Unexpected dependency: ${name}`);
}, moduleRef, moduleRef.exports);

(async () => {
  const service = moduleRef.exports;
  await service.registerFacialEmbeddingFromImage({ userId: 'untrusted', createdBy: 'untrusted',
    imageBase64: 'image', imageFrames: ['frame'], replaceExisting: true, resetToken: 'grant' });
  assert.equal(calls[0][0], '/api/facial/embeddings/from-image');
  assert.equal(calls[0][1].reset_token, 'grant');
  assert.equal(calls[0][1].replace_existing, true);
  assert.equal(calls[0][1].user_id, undefined);
  assert.equal(calls[0][1].created_by, undefined);
  assert.equal(calls[0][2].timeout, 180000);
  assert.deepEqual(calls[0][1].image_frames, ['frame']);
  await service.validateFacialLiveness({ imageFrames: ['frame'], livenessChallenge: 'blink' });
  assert.equal(calls[1][0], '/api/facial/embeddings/liveness-check');
  assert.equal(calls[1][1].liveness_challenge, 'blink');
  assert.equal(service.getFacialEmbeddingErrorMessage({ response: { data: { message: 'Autorización requerida' } } }), 'Autorización requerida');
  assert(!source.includes('X-API-Key'));
  console.log('PASS: HU-05 gateway, owner isolation, reset authorization, liveness and backend errors.');
})().catch(error => { console.error(error); process.exitCode = 1; });
