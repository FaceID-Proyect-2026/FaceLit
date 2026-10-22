const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../features/attendance/attendanceUIStore.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const storeModule = { exports: {} };
new Function('exports', 'module', compiled)(storeModule.exports, storeModule);
const store = storeModule.exports;
const original = store.getAttendanceUISnapshot();

let renders = 0;
const leaveScreen = store.subscribeAttendanceUI(() => renders++);
store.setApprenticeDateFrom('learner-a', '2026-10-21');
store.setApprenticeDateTo('learner-a', '2026-10-21');
assert.equal(renders, 2);
leaveScreen();
const returnToScreen = store.subscribeAttendanceUI(() => renders++);
assert.deepEqual(store.getAttendanceUISnapshot().apprentice['learner-a'], {
  dateFrom: '2026-10-21', dateTo: '2026-10-21',
});

store.setApprenticeDateFrom('learner-b', '2026-09-01');
store.setApprenticeDateTo('learner-b', '2026-09-30');
store.setApprenticeDateFrom('learner-a', '2026-10-22');
assert.deepEqual(store.getAttendanceUISnapshot().apprentice['learner-a'], {
  dateFrom: '2026-10-22', dateTo: '',
});
assert.deepEqual(store.getAttendanceUISnapshot().apprentice['learner-b'], {
  dateFrom: '2026-09-01', dateTo: '2026-09-30',
});
assert.equal(store.getAttendanceUISnapshot().byFicha, original.byFicha);
assert.equal(store.getAttendanceUISnapshot().byUser, original.byUser);
const beforeAnonymous = store.getAttendanceUISnapshot();
store.setApprenticeDateTo('', '2026-10-31');
assert.equal(store.getAttendanceUISnapshot(), beforeAnonymous);
returnToScreen();
console.log('OK: attendance period survives navigation, stays isolated by account and preserves other filters.');
