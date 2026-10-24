/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const current = file => fs.readFileSync(path.join(root, file), 'utf8');
function load(source, dependencies = {}) {
  const result = { exports: {} };
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'module', 'exports', compiled)(name => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  }, result, result.exports);
  return result.exports;
}

const retainedTypes = load(current('features/attendance/types.ts'));
const learners = ['l1', 'l2', 'l3', 'l4'].map((id, i) => ({
  id, name: `Learner${i}`, lastname: 'Test', document: String(i + 100), email: `${id}@example.test`, status: 'active',
}));
const fichas = [
  { id: '1', number: '3145555', programId: 'p1', learners: learners.slice(0, 3) },
  { id: '2', number: '3145556', programId: 'p2', learners: learners.slice(3) },
];
const academic = {
  getFichasSnapshot: () => fichas,
  getProgramsSnapshot: () => [{ id: 'p1', name: 'Program A' }, { id: 'p2', name: 'Program B' }],
  subscribe: () => () => {},
};
const environments = {
  getSnapshot: () => [{ id: '1', code: 'Room A' }, { id: '2', code: 'Room B' }],
  subscribe: () => () => {},
};
const common = {
  react: { useSyncExternalStore: () => {}, useMemo: factory => factory() },
  '@/features/academic/academicStore': academic,
  '@/features/environments/environmentsStore': environments,
};
const retained = load(current('features/attendance/useAttendance.ts'), { ...common, './types': retainedTypes });
assert.equal(retained.resolveAttendance().length, 4);
assert.deepEqual(retained.resolveAttendance().map(record => record.status), ['punctual', 'late', 'absent', 'punctual']);
assert.deepEqual(retained.resolveAttendance().map(record => [record.fichaId, record.environmentName, record.sessionStartTime, record.sessionEndTime]), [
  ['1', 'Room A', '07:00', '12:00'], ['1', 'Room A', '07:00', '12:00'],
  ['1', 'Room A', '07:00', '12:00'], ['2', 'Room B', '13:00', '18:00'],
]);
assert.deepEqual(retained.resolveAttendance([{ ...retainedTypes.ATTENDANCE_EVENTS[0], userId: 'unknown' }]), []);
assert.deepEqual(retained.resolveAttendance([{ ...retainedTypes.ATTENDANCE_EVENTS[0], environmentId: 'unknown' }]), []);
assert.deepEqual(retained.resolveAttendance([{ ...retainedTypes.ATTENDANCE_EVENTS[0], date: 'invalid' }]), []);

const afterRF6 = load(current('features/attendance/useAttendanceRF6.ts'), { ...common, './useAttendance': retained });
const after = afterRF6.useAttendanceRF6();
assert.equal(after.getHistory().length, 4);
assert.equal(after.getHistory({ fichaId: '2' }).length, 1);
assert.equal(after.searchLearners('Learner').length, 4);
assert.equal(after.searchLearners('100')[0].learnerId, 'l1');
const table = after.getFichaTable('1', '2026-06-22', '2026-06-23');
assert.deepEqual(table.map(row => row.days.map(day => day.status)), [['punctual', null], ['late', null], ['absent', null]]);

for (const language of ['es', 'en', 'fr', 'de']) {
  const file = `shared/i18n/locales/${language}.ts`;
  const localeDependencies = {
    '../notificationTemplates': { notificationTemplates: { es: {}, en: {}, fr: {}, de: {} } },
    '../landing': { landingEs: {}, landingEn: {}, landingFr: {}, landingDe: {} },
  };
  const after = load(current(file), localeDependencies).default;
  assert.equal(after.schedules, undefined);
  assert.ok(after.facial.setup);
  assert.ok(after.facial.settings);
  assert.ok(after.attendance.rf6);
}
for (const role of ['admin', 'instructor']) {
  for (const name of ['index', 'register', '[id]', 'exceptions']) {
    assert.equal(fs.existsSync(path.join(root, `app/${role}/schedules/${name}.tsx`)), false);
  }
  assert.doesNotMatch(current(`app/${role}/_layout.tsx`), /name="schedules\//);
}
assert.doesNotMatch(current('shared/constants/routes.ts'), /SCHEDULES|\/schedules/);
assert.doesNotMatch(current('shared/utils/permissionsHelper.ts'), /MANAGE_SCHEDULES/);
assert.match(current('shared/services/facialAttendanceService.ts'), /\/api\/facial\/events\/attendance-matrix/);
assert.match(current('features/environments/environmentSessionApi.ts'), /idInstructorScheduled: string/);
console.log('PASS: attendance results, history filters, learner search and daily tables remain available without the removed module; session routes and translations remain present.');
