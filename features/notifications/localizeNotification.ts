import type { TFunction } from 'i18next';
import type { Notification, NotificationMeta } from './types';

const zone = 'America/Bogota';
const text = (...values: unknown[]): string | undefined =>
  values.find((value): value is string => typeof value === 'string' && value.trim() !== '' && value !== 'null') as string | undefined;

export function parseNotificationMeta(raw?: string | null): NotificationMeta | undefined {
  if (!raw) return undefined;
  try {
    const value = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function notificationDecisionActorName(meta: NotificationMeta, t: TFunction): string {
  if (meta.decidedByName?.trim()) return meta.decidedByName;
  const legacy = meta.decidedBy?.trim();
  if (legacy && !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(legacy)) return legacy;
  return t('notifications.templates.sessionUi.coordinator');
}

export function formatNotificationDate(value: string, language: string): string {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(language, {
    dateStyle: 'medium', timeZone: zone,
  }).format(date);
}

function sessionDay(value?: string): string | undefined {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(parsed);
  const part = (type: string) => parts.find(p => p.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function sessionTime(value?: string): string | undefined {
  if (!value) return undefined;
  if (/^\d{2}:\d{2}/.test(value)) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : new Intl.DateTimeFormat('en-GB', {
    timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(parsed);
}

/** Accept the names used by both older app events and the backend. Never use notification creation date as session date. */
export function normalizeNotificationMeta(input?: NotificationMeta): NotificationMeta {
  const meta = input ?? {};
  return {
    ...meta,
    learnerDocument: text(meta.learnerDocument, meta.document),
    fichaNumber: text(meta.fichaNumber, meta.chipCode, meta.chip),
    environmentName: text(meta.environmentName, meta.environment),
    date: sessionDay(text(meta.sessionDate, meta.date, meta.sessionStart, meta.entryTime, meta.eventDatetime)),
    entryTime: sessionTime(text(meta.sessionStart, meta.entryTime)),
    exitTime: sessionTime(text(meta.exitTime)),
  };
}

export function localizeNotification(notif: Notification, t: TFunction, language: string) {
  const meta = normalizeNotificationMeta(notif.meta);
  const unavailable = t('notifications.values.unavailable');
  const entity = ['program', 'ficha', 'learner', 'instructor'].includes(meta.entityType ?? '') ? meta.entityType : 'item';
  const values = {
    learnerName: meta.learnerName || t('notifications.values.learner'),
    document: meta.learnerDocument || meta.accountDocument || unavailable,
    fromFicha: meta.fromFichaNumber || unavailable,
    toFicha: meta.toFichaNumber || unavailable,
    ficha: meta.fichaNumber || meta.toFichaNumber || unavailable,
    date: meta.date ? formatNotificationDate(meta.date, language) : unavailable,
    delayMinutes: meta.delayMinutes ?? unavailable,
    environment: meta.environmentName || unavailable,
    instructorName: meta.instructorName || t('notifications.values.instructor'),
    name: text(meta.name, meta.programName, meta.fichaNumber, meta.instructorName, meta.learnerName) || unavailable,
    action: text(meta.action) || unavailable,
    failedCount: meta.failedCount ?? unavailable,
    lockMinutes: meta.lockMinutes ?? unavailable,
    entity: t(`notifications.entities.${entity}`),
    email: notif.message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || unavailable,
    previousRole: t(`notifications.templates.lifecycleUi.roles.${meta.previousRole ?? 'NONE'}`, { defaultValue: unavailable }),
    newRole: t(`notifications.templates.lifecycleUi.roles.${meta.newRole ?? 'NONE'}`, { defaultValue: unavailable }),
    changedByName: meta.changedByName || unavailable,
    affectedUserName: meta.affectedUserName || unavailable,
    originalTypeTitle: meta.originalType ? t(`notifications.templates.${meta.originalType}.title`, { defaultValue: meta.originalTitle || unavailable }) : unavailable,
    attemptCount: meta.attemptCount ?? unavailable,
    eventType: t(`notifications.templates.lifecycleUi.${meta.eventType === 'EXIT' ? 'exit' : 'entry'}`),
  };
  const key = `notifications.templates.${notif.type}`;
  // Unknown future types keep their source text instead of exposing an i18n key.
  const title = t(`${key}.title`, { defaultValue: '' });
  if (!title) return {
    title: notif.title || t('notifications.templates.unknown.title'),
    message: notif.message || t('notifications.templates.unknown.message'),
  };
  const summary = notif.type === 'csv_upload_done' ? meta.csvSummary : undefined;
  const emailConflict = notif.type === 'csv_ref_error' && /ya est[aá] registrado en otro usuario/i.test(notif.message);
  const deactivated = notif.type === 'account_status_changed'
    && ['desactivada', 'inactive', 'deactivated', 'disabled'].includes(text(meta.status)?.toLowerCase() ?? '');
  const decision = notif.type === 'facial_request_resolved' && (meta.facialDecision === 'accepted' || meta.facialDecision === 'rejected')
    ? `notifications.templates.resetUi.${meta.facialDecision}Message` : undefined;
  const replaced = notif.type === 'facial_registration_completed' && meta.requestId;
  const recovered = notif.type === 'password_changed' && meta.action === 'password_recovered';
  const message = t(recovered ? 'notifications.templates.lifecycleUi.recoveryMessage' : decision || (replaced ? 'notifications.templates.resetUi.replacedMessage'
    : summary ? `${key}.summaryMessage` : emailConflict ? `${key}.emailMessage`
    : deactivated ? `${key}.inactiveMessage` : `${key}.message`), {
    ...values, ...summary,
  });
  const contextual = notif.category === 'attendance' || notif.category === 'facial';
  const details: string[] = [];
  if (contextual) {
    const add = (label: string, value?: string) => { if (value) details.push(`${t(label)}: ${value}`); };
    add('notifications.detail.learner', meta.learnerName);
    add('notifications.detail.document', meta.learnerDocument);
    add('notifications.detail.ficha', meta.fichaNumber);
    add('notifications.templates.resetUi.program', meta.programName);
    add('notifications.templates.context.date', meta.date ? formatNotificationDate(meta.date, language) : undefined);
    add('notifications.templates.context.start', meta.entryTime);
    add('notifications.templates.context.end', meta.exitTime);
    add('attendance.fields.environment', meta.environmentName);
    add('notifications.templates.sessionUi.configuredBy', meta.configuredByName);
    add(meta.configuredByName ? 'notifications.templates.sessionUi.responsibleInstructor' : 'attendance.fields.instructor', meta.instructorName);
    const expires = text(meta.authorizationExpiresAt);
    if (expires && !Number.isNaN(new Date(expires).getTime())) {
        add(notif.type === 'facial_authorization_expired' ? 'notifications.templates.lifecycleUi.expiredAt' : 'notifications.templates.resetUi.expires', new Intl.DateTimeFormat(language, {
        timeZone: zone, dateStyle: 'medium', timeStyle: 'short',
      }).format(new Date(expires)));
    }
  }
  if (notif.type === 'facial_request_resolved' && meta.facialDecision) {
    details.push(`${t('notifications.detail.facialDecision')}: ${t(`notifications.detail.${meta.facialDecision}`)}`);
    details.push(`${t('notifications.detail.decidedBy')}: ${notificationDecisionActorName(meta, t)}`);
  }
  if (notif.type === 'attendance_corrected') {
    const state = (status?: string, datetime?: string, excuse?: boolean) => {
      const localizedStatus = status ? t(`attendance.statuses.${status.toLowerCase()}`, { defaultValue: unavailable }) : unavailable;
      let timestamp = '';
      if (datetime && !Number.isNaN(new Date(datetime).getTime())) timestamp = new Intl.DateTimeFormat(language, {
        timeZone: zone, dateStyle: 'medium', timeStyle: 'short',
      }).format(new Date(datetime));
      return [localizedStatus, timestamp, `${t('notifications.templates.lifecycleUi.excuse')}: ${t(`notifications.templates.lifecycleUi.${excuse ? 'yes' : 'no'}`)}`].filter(Boolean).join(' · ');
    };
    details.push(`${t('notifications.templates.lifecycleUi.before')}: ${state(meta.previousStatus, meta.previousDatetime, meta.previousExcuse)}`);
    details.push(`${t('notifications.templates.lifecycleUi.after')}: ${state(meta.newStatus, meta.newDatetime, meta.newExcuse)}`);
    details.push(`${t('notifications.templates.lifecycleUi.changedBy')}: ${meta.changedByName || unavailable}`);
    const reason = meta.correctionReasonCode === 'excuse_removed' ? t('notifications.templates.lifecycleUi.excuseRemoved') : meta.correctionReason;
    if (reason) details.push(`${t('notifications.templates.lifecycleUi.reason')}: ${reason}`);
    details.push(t('notifications.templates.lifecycleUi.reviewCorrection'));
  }
  if (meta.recipientName) details.push(`${t('notifications.templates.lifecycleUi.recipient')}: ${meta.recipientName}`);
  if (meta.recipientContext && ['learner', 'responsible_instructor', 'account_owner', 'coordinator'].includes(meta.recipientContext))
    details.push(t(`notifications.templates.lifecycleUi.${meta.recipientContext === 'learner' && notif.type === 'facial_authorization_expired' ? 'learnerFacial' : meta.recipientContext}`));
  const occurredAt = meta.occurredAt || (notif.type === 'attendance_corrected' ? text(meta.correctedAt) : undefined);
  if (occurredAt && !Number.isNaN(new Date(occurredAt).getTime())) details.push(`${t('notifications.templates.lifecycleUi.eventDate')}: ${new Intl.DateTimeFormat(language, {
    timeZone: zone, dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(occurredAt))}`);
  if (notif.type === 'user_role_changed') details.push(t('notifications.templates.lifecycleUi.roleAction'));
  return { title, message: [message, ...details].join('\n') };
}
