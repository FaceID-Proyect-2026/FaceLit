const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { createInstance } = require('i18next');

const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(relative) {
  const file = path.resolve(root, relative);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const localRequire = name => name.startsWith('.')
    ? load(path.relative(root, path.resolve(path.dirname(file), `${name}.ts`))) : require(name);
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
}

const { localizeNotification, normalizeNotificationMeta, parseNotificationMeta, notificationDecisionActorName } = load('features/notifications/localizeNotification.ts');
const { NOTIFICATION_CHANNELS } = load('features/notifications/types.ts');
const catalog = fs.readFileSync(path.resolve(root, '../FaceLit-Backend/src/main/java/com/FaceLit/backend/notification/service/NotificationCatalog.java'), 'utf8');
const types = [...catalog.matchAll(/Map\.entry\("([^"]+)"/g)].map(match => match[1]);
const languages = ['es', 'en', 'fr', 'de'];
const resources = Object.fromEntries(languages.map(lang => [lang, { translation: load(`shared/i18n/locales/${lang}.ts`).default }]));
const i18n = createInstance();
i18n.init({ resources, lng: 'es', fallbackLng: false, initImmediate: false, interpolation: { escapeValue: false } });

const sample = {
  id: 'example', type: 'attendance_excuse_registered', category: 'attendance', channel: 'app+email',
  title: 'Excusa registrada', message: 'Se registró una excusa.', date: '2026-10-15', time: '08:00', read: false,
  meta: { learnerName: 'Carlos Ramírez', chipCode: '3145555', sessionDate: '2026-10-12',
    sessionStart: '2026-10-13T01:00:00Z', instructorName: 'Luis Pérez' },
};
let checked = 0;
for (const lang of languages) {
  const t = i18n.getFixedT(lang);
  const recovery = localizeNotification({ ...sample, type: 'password_changed', category: 'security', meta: {
    action: 'password_recovered', recipientName: 'Carlos Ramirez', recipientContext: 'account_owner', occurredAt: '2026-10-16T15:00:00Z',
  } }, t, lang);
  for (const expected of ['Carlos Ramirez', t('notifications.templates.lifecycleUi.recoveryMessage'),
    t('notifications.templates.lifecycleUi.account_owner'), t('notifications.templates.lifecycleUi.eventDate')]) assert.ok(recovery.message.includes(expected));
  const expiry = localizeNotification({ ...sample, type: 'facial_authorization_expired', category: 'facial', meta: {
    recipientName: 'Carlos Ramirez', recipientContext: 'learner', authorizationExpiresAt: '2026-10-17T14:00:00Z',
  } }, t, lang);
  assert.ok(expiry.message.includes(t('notifications.templates.lifecycleUi.expiredAt')));
  assert.ok(!expiry.message.includes(t('notifications.templates.resetUi.expires')));
  assert.ok(expiry.message.includes('Carlos Ramirez'));
  for (const label of ['captureMode', 'automaticCapture', 'earlyExitCapture']) {
    assert.ok(i18n.exists(`notifications.templates.lifecycleUi.${label}`, { lng: lang }));
  }
  const corrected = localizeNotification({ ...sample, type: 'attendance_corrected', meta: { ...sample.meta,
    previousStatus: 'ABSENT', newStatus: 'LATE', previousDatetime: '2026-10-13T01:00:00Z', newDatetime: '2026-10-13T01:30:00Z',
    previousExcuse: true, newExcuse: false, changedByName: 'Ana Gomez', correctionReasonCode: 'excuse_removed', eventType: 'ENTRY',
  } }, t, lang);
  for (const expected of ['Ana Gomez', 'Carlos Ramírez', t('attendance.statuses.absent'), t('attendance.statuses.late'),
    t('notifications.templates.lifecycleUi.before'), t('notifications.templates.lifecycleUi.after'), t('notifications.templates.lifecycleUi.excuseRemoved')]) {
    assert.ok(corrected.message.includes(expected), `${lang} corrected missing ${expected}`);
  }
  const roleChanged = localizeNotification({ ...sample, type: 'user_role_changed', category: 'security', meta: {
    previousRole: 'APPRENTICE', newRole: 'INSTRUCTOR', changedByName: 'Maria Rodriguez',
  } }, t, lang);
  assert.ok(roleChanged.message.includes('Maria Rodriguez'));
  assert.ok(roleChanged.message.includes(t('notifications.templates.lifecycleUi.roles.APPRENTICE')));
  assert.ok(!roleChanged.message.includes('APPRENTICE'));
  const emailFailed = localizeNotification({ ...sample, type: 'email_delivery_failed', category: 'security', meta: {
    originalType: 'facial_request_resolved', originalTitle: 'Respuesta a tu solicitud facial', affectedUserName: 'Mariana Lopez', attemptCount: 3,
  } }, t, lang);
  assert.ok(emailFailed.message.includes(t('notifications.templates.facial_request_resolved.title')));
  assert.ok(emailFailed.message.includes('Mariana Lopez'));
  const actorId = '337fc0d2-1daf-481e-9329-99bb6d988a64';
  assert.equal(notificationDecisionActorName({ decidedBy: actorId }, t), t('notifications.templates.sessionUi.coordinator'));
  assert.equal(notificationDecisionActorName({ decidedBy: actorId, decidedByName: 'Maria Rodriguez' }, t), 'Maria Rodriguez');
  const session = localizeNotification({ ...sample, type: 'facial_session_substitution',
    meta: { ...sample.meta, configuredByName: 'Camila Perez', instructorName: 'Luis Gomez' } }, t, lang);
  for (const value of ['Camila Perez', 'Luis Gomez', t('notifications.templates.sessionUi.configuredBy'),
    t('notifications.templates.sessionUi.responsibleInstructor')]) assert.ok(session.message.includes(value));
  for (const type of types) {
    assert.ok(NOTIFICATION_CHANNELS[type], `Missing app type ${type}`);
    for (const field of ['title', 'message']) {
      const key = `notifications.templates.${type}.${field}`;
      assert.ok(i18n.exists(key, { lng: lang }), `Missing ${lang}: ${key}`);
    }
    const rendered = localizeNotification({ ...sample, type }, t, lang);
    assert.ok(!/notifications\.|\{\{/.test(rendered.title + rendered.message), `${lang} ${type}: unresolved translation`);
    checked++;
  }
  const rendered = localizeNotification(sample, t, lang);
  assert.ok(rendered.message.includes('Carlos Ramírez'));
  assert.ok(rendered.message.includes('3145555'));
  assert.ok(rendered.message.includes('Luis Pérez'));
  assert.ok(rendered.message.includes('20:00'));
  assert.ok(!rendered.message.includes('15/10/2026'));
  assert.notEqual(rendered.message, sample.message);
  if (lang !== 'es') assert.ok(!rendered.message.includes('Se registró'));
  const future = localizeNotification({ ...sample, type: 'future_event' }, t, lang);
  assert.equal(future.title, sample.title);
  assert.equal(future.message, sample.message);
  const summary = localizeNotification({ ...sample, type: 'csv_upload_done', meta: { csvSummary: { created: 8, updated: 3, blocked: 2, errors: 1 } } }, t, lang);
  assert.ok(['8', '3', '2', '1'].every(value => summary.message.includes(value)));
  assert.equal(sample.message, 'Se registró una excusa.'); // Localization never rewrites source/email text.
  const academic = { learnerName: 'Mariana López', fichaNumber: '3145555', programName: 'Análisis de software' };
  const request = localizeNotification({ ...sample, category: 'facial', type: 'facial_reregister_request', meta: academic }, t, lang);
  for (const detail of Object.values(academic)) assert.ok(request.message.includes(detail));
  for (const facialDecision of ['accepted', 'rejected']) {
    const resolved = localizeNotification({ ...sample, category: 'facial', type: 'facial_request_resolved',
      meta: { ...academic, facialDecision, authorizationExpiresAt: '2026-10-16T15:00:00Z' } }, t, lang);
    assert.ok(resolved.message.includes(t(`notifications.templates.resetUi.${facialDecision}Message`)));
    assert.ok(!/notifications\.|\{\{/.test(resolved.message));
  }
}
const legacy = normalizeNotificationMeta({ chip: '123', environment: 'Aula 2', entryTime: '2026-10-13T01:00:00Z', exitTime: '2026-10-13T02:00:00Z' });
assert.equal(legacy.fichaNumber, '123');
assert.equal(legacy.environmentName, 'Aula 2');
assert.equal(legacy.date, '2026-10-12');
assert.equal(legacy.entryTime, '20:00');
assert.equal(legacy.exitTime, '21:00');
assert.equal(parseNotificationMeta('{invalid'), undefined);
assert.equal(parseNotificationMeta('[]'), undefined);
assert.equal(parseNotificationMeta('null'), undefined);
assert.equal(normalizeNotificationMeta().date, undefined);
console.log(`PASS: ${checked} notification/language combinations (${types.length} types × 4 languages), interpolation, session dates, metadata compatibility and safe fallback.`);
