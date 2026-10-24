/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function load(file, dependencies = {}) {
  const result = { exports: {} };
  const compiled = ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'module', 'exports', compiled)(name => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  }, result, result.exports);
  return result.exports;
}
const fichas = [{ id: 'group-test', programId: 'program-test', learners: [] }];
const day = {
  idFacialEvent: 'event-test', idRecordEnvironment: 'session-test', idEnvironment: 'room-test',
  date: '2026-10-24', status: 'late', entryTime: '09:18', delayMinutes: 3,
  environmentName: 'Test room', instructorName: 'Test instructor', fichaNumber: 'test-group',
  programName: 'Actual database name', sessionStartTime: '09:00', sessionEndTime: '14:45',
  exitTime: '14:42', exitRegistered: true, excuse: false,
};
const matrix = {
  idChip: 'group-test', idProgram: 'program-test',
  learners: [{ learnerId: 'user-test', apprenticeId: 'apprentice-test', learnerName: 'Test learner', learnerDocument: 'test-document', days: [day] }],
  sessions: [],
};
async function run() {
  const { resolveAttendance, createAttendanceDataStore } = load('features/attendance/attendanceData.ts');
  const rows = resolveAttendance([matrix], fichas);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].sessionStartTime, '09:00');
  assert.equal(rows[0].sessionEndTime, '14:45');
  assert.equal(rows[0].exitTime, '14:42');
  assert.equal(rows[0].programName, 'Actual database name');
  assert.equal(resolveAttendance([{ ...matrix, learners: [] }], fichas).length, 0);
  const noTimes = resolveAttendance([{ ...matrix, learners: [{ ...matrix.learners[0], days: [{ ...day, sessionStartTime: undefined, sessionEndTime: undefined, exitTime: undefined }] }] }], fichas)[0];
  assert.equal(noTimes.sessionStartTime, '');
  assert.equal(noTimes.sessionEndTime, '');
  assert.equal(noTimes.exitTime, '');
  let fail = true;
  const store = createAttendanceDataStore(async () => {
    if (fail) throw new Error('Connection unavailable');
    return matrix;
  });
  const request = store.load('account-a', fichas);
  assert.equal(store.getSnapshot().loading, true);
  await request;
  assert.equal(store.getSnapshot().error, true);
  assert.deepEqual(store.getSnapshot().records, []);
  fail = false;
  await store.load('account-a', fichas, true);
  assert.equal(store.getSnapshot().error, false);
  assert.equal(store.getSnapshot().records.length, 1);
  let resolveFirst;
  let calls = 0;
  const isolated = createAttendanceDataStore(() => ++calls === 1
    ? new Promise(resolve => { resolveFirst = resolve; }) : Promise.resolve({ ...matrix, learners: [] }));
  const old = isolated.load('account-a', fichas);
  await isolated.load('account-b', fichas);
  resolveFirst(matrix);
  await old;
  assert.equal(isolated.getSnapshot().key, isolated.keyFor('account-b', fichas));
  assert.deepEqual(isolated.getSnapshot().records, []);
  await isolated.load('', []);
  assert.deepEqual(isolated.getSnapshot().records, []);
  const academic = load('features/academic/types.ts');
  assert.equal(academic.getProgramDisplayName({ id: '1', name: 'Real program name' }, () => 'Sample translation'), 'Real program name');
  const api = {
    searchSessionEnvironments: async () => [{ idEnvironment: 'real-room', environmentName: 'Database room', state: 'ACTIVE', capacity: 18 }],
    getOrCreateSessionEnvironment: async () => ({}),
  };
  const environments = load('features/environments/environmentsStore.ts', { './environmentSessionApi': api });
  assert.deepEqual(environments.getSnapshot(), []);
  await environments.loadEnvironments('instructor-a');
  assert.equal(environments.getSnapshot()[0].id, 'real-room');
  const original = environments.getSnapshot();
  assert.equal(environments.updateEnvironment('real-room', { code: 'Changed' }).success, false);
  assert.equal(environments.assignFichaToEnvironment('real-room', 'group-test').success, false);
  assert.equal(environments.getSnapshot(), original);
  api.searchSessionEnvironments = async () => { throw new Error('Forbidden or offline'); };
  await environments.loadEnvironments('instructor-a', true);
  assert.equal(environments.getMetaSnapshot().error, true);
  assert.deepEqual(environments.getSnapshot(), []);
  api.searchSessionEnvironments = async () => [];
  await environments.loadEnvironments('instructor-a', true);
  assert.equal(environments.getMetaSnapshot().error, false);
  assert.deepEqual(environments.getSnapshot(), []);
  let finishCreation;
  api.getOrCreateSessionEnvironment = () => new Promise(resolve => { finishCreation = resolve; });
  const creation = environments.registerEnvironment({ code: 'Requested room', quantity: 20 });
  await environments.loadEnvironments('instructor-b');
  finishCreation({});
  assert.equal((await creation).success, false);
  assert.equal(environments.getMetaSnapshot().owner, 'instructor-b');
  for (const language of ['es', 'en', 'fr', 'de']) {
    const locale = load(`shared/i18n/locales/${language}.ts`, {
      '../notificationTemplates': { notificationTemplates: { es: {}, en: {}, fr: {}, de: {} } },
      '../landing': { landingEs: {}, landingEn: {}, landingFr: {}, landingDe: {} },
    }).default;
    assert.equal(locale.schedules, undefined);
    assert.ok(locale.attendance.fields.sessionPeriod);
    assert.equal(locale.attendance.fields.scheduledTime, undefined);
    assert.equal(locale.apprentice.attendance.scheduledHours, undefined);
    assert.ok(locale.facial.setup);
    assert.ok(locale.dataState.environmentLimit);
  }
  for (const role of ['admin', 'instructor']) {
    for (const name of ['index', 'register', '[id]', 'exceptions']) assert.equal(fs.existsSync(path.join(root, `app/${role}/schedules/${name}.tsx`)), false);
    assert.match(read(`app/${role}/attendance/[id].tsx`), /attendance.fields.sessionPeriod/);
    assert.doesNotMatch(read(`app/${role}/environments/[id].tsx`), /MOCK_FICHAS/);
  }
  for (const file of ['features/attendance/types.ts', 'features/academic/types.ts', 'features/environments/types.ts', 'features/facial/types.ts', 'features/reports/types.ts']) {
    assert.doesNotMatch(read(file), /export const (MOCK_|ATTENDANCE_EVENTS)/);
  }
  assert.doesNotMatch(read('shared/constants/routes.ts'), /SCHEDULES|\/schedules/);
  assert.doesNotMatch(read('shared/utils/permissionsHelper.ts'), /MANAGE_SCHEDULES/);
  console.log('PASS: real attendance data, empty/error/retry states, stale-account isolation, real program names, environment API loading, pending unsupported mutations, translations and removed routes.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
