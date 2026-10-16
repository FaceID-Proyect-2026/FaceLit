const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const moduleRef = { exports: {} };
const source = fs.readFileSync(path.resolve(__dirname, '../features/facial/registrationAccess.ts'), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
new Function('module', 'exports', js)(moduleRef, moduleRef.exports);
const { canStartFacialCapture, hasUnusedFacialApproval } = moduleRef.exports;
const approved = { requestId: 'approval-1', status: 'ACCEPTED', canReregister: true,
  authorizationToken: 'token-1', expiresAt: new Date(Date.now() + 3600000).toISOString() };
const state = { registered: true, savedInThisScreen: false, reset: null,
  consumedRequests: new Set(), loading: false, hasError: false };
assert.equal(canStartFacialCapture(state), false); // Existing face, no permission.
assert.equal(canStartFacialCapture({ ...state, reset: { ...approved, status: 'PENDING', canReregister: false } }), false);
assert.equal(canStartFacialCapture({ ...state, reset: approved }), true);
const consumed = { ...state, savedInThisScreen: true, consumedRequests: new Set(['approval-1']) };
assert.equal(canStartFacialCapture(consumed), false); // Locks immediately after save, before dismissing success.
assert.equal(canStartFacialCapture({ ...consumed, reset: approved }), false); // Stale approval response.
assert.equal(canStartFacialCapture({ ...consumed, registered: false, reset: approved }), false); // Stale registration response too.
assert.equal(canStartFacialCapture({ ...consumed, reset: { ...approved, requestId: 'approval-2', authorizationToken: 'token-2' } }), true);
assert.equal(canStartFacialCapture({ ...state, registered: false }), true); // First ever registration.
assert.equal(hasUnusedFacialApproval({ ...approved, expiresAt: '2020-01-01T00:00:00Z' }, new Set()), false);
assert.equal(hasUnusedFacialApproval({ ...approved, authorizationToken: null }, new Set()), false);
assert.equal(canStartFacialCapture({ ...state, reset: approved, loading: true }), false);
assert.equal(canStartFacialCapture({ ...state, reset: approved, hasError: true }), false);
assert.equal(canStartFacialCapture({ ...state, reset: approved, registered: null }), false);
console.log('PASS: 13 facial capture access cases, including immediate lock, stale responses and a fresh coordinator approval.');
