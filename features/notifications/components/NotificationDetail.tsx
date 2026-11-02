import { normalizeNotificationMeta, notificationDecisionActorName, profileChangeDetails, formatNotificationDate } from '@/features/notifications/localizeNotification';
import type { Notification } from '@/features/notifications/types';
import { notificationStyles as ns } from '@/features/notifications/styles/notificationStyles';
import AppButton from '@/shared/components/ui/AppButton';
import { Colors } from '@/shared/constants/colors';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';

interface Props {
  notif: Notification;
  isApprentice: boolean;
  isCoordinator: boolean;
  resolvingId: string | null;
  decisionError: string | null;
  handleFacialDecision: (id: string, decision: 'accepted' | 'rejected') => Promise<void>;
}

export default function NotificationDetail({ notif, isApprentice, isCoordinator, resolvingId, decisionError, handleFacialDecision }: Props) {
  const { isDark, theme } = useTheme();
  const { t, i18n } = useTranslation();
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const border = theme.border;
  const formatLocalizedDate = (value?: string) => value ? formatNotificationDate(value, i18n.resolvedLanguage ?? i18n.language) : '—';
  const m = normalizeNotificationMeta(notif.meta);
  const rows: [string, string, string?, string?][] = [];
  const changes = profileChangeDetails(m, t);
  for (const change of changes) {
    rows.push(['arrow-back-outline', `${change.label} · ${t('notifications.templates.profileUi.before')}`, change.before]);
    rows.push(['arrow-forward-outline', `${change.label} · ${t('notifications.templates.profileUi.after')}`, change.after]);
  }
  if (changes.length) {
    if (m.affectedUserName) rows.push(['person-outline', t('notifications.templates.lifecycleUi.recipient'), m.affectedUserName]);
    if (m.changedByName) rows.push(['person-outline', t('notifications.templates.lifecycleUi.changedBy'), m.changedByName]);
    if (m.occurredAt && !Number.isNaN(new Date(m.occurredAt).getTime())) rows.push(['calendar-outline',
      t('notifications.templates.lifecycleUi.eventDate'), new Intl.DateTimeFormat(i18n.resolvedLanguage ?? i18n.language, {
        timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short',
      }).format(new Date(m.occurredAt))]);
  }

  // Campos comunes según tipo
  if (m.learnerName)      rows.push(['person-outline',       t('notifications.detail.learner'),   m.learnerName]);
  if (m.programName) rows.push(['school-outline', t('notifications.templates.resetUi.program'), m.programName]);
  if (m.learnerDocument)  rows.push(['card-outline',         t('notifications.detail.document'),  m.learnerDocument]);
  if (m.accountDocument && !m.learnerDocument)
                          rows.push(['card-outline',         t('notifications.detail.document'),  m.accountDocument]);
  if (m.fromFichaNumber)  rows.push(['arrow-forward-outline',t('notifications.detail.fromFicha'), m.fromFichaNumber]);
  if (m.toFichaNumber)    rows.push(['arrow-forward-circle-outline', t('notifications.detail.toFicha'), m.toFichaNumber]);
  if (m.fichaNumber && !m.fromFichaNumber)
                          rows.push(['school-outline',       t('notifications.detail.ficha'),     m.fichaNumber]);
  if (m.date)             rows.push(['calendar-outline',     t('attendance.fields.date'),         formatLocalizedDate(m.date)]);
  if (m.entryTime)        rows.push(['log-in-outline',       t('attendance.fields.entryTime'),    m.entryTime]);
  if (m.delayMinutes && m.delayMinutes > 0)
                          rows.push(['timer-outline',        t('attendance.fields.delay'),        `${m.delayMinutes} ${t('notifications.units.minutes')}`]);
  if (m.environmentName)  rows.push(['business-outline',     t('attendance.fields.environment'),  m.environmentName]);
  if (m.configuredByName) rows.push(['person-outline', t('notifications.templates.sessionUi.configuredBy'), m.configuredByName]);
  if (m.instructorName) rows.push(['person-circle-outline', t(m.configuredByName ? 'notifications.templates.sessionUi.responsibleInstructor' : 'attendance.fields.instructor'), m.instructorName]);
  if (m.failedCount)      rows.push(['alert-circle-outline', t('notifications.detail.failedCount'), `${m.failedCount}`]);
  if (m.lockMinutes)      rows.push(['time-outline',         t('notifications.detail.lockMinutes'), `${m.lockMinutes} ${t('notifications.units.minutes')}`]);
  if (m.csvSummary) {
    const s = m.csvSummary;
    rows.push(['add-circle-outline',   t('notifications.detail.created'), `${s.created}`]);
    rows.push(['pencil-outline',       t('notifications.detail.updated'), `${s.updated}`]);
    rows.push(['alert-circle-outline', t('notifications.detail.blocked'), `${s.blocked}`]);
    rows.push(['close-circle-outline', t('notifications.detail.errors'),  `${s.errors}`]);
  }
  if (m.entityType && !changes.length) {
    const entityTypeKey = m.entityType === 'program' || m.entityType === 'ficha'
      || m.entityType === 'learner' || m.entityType === 'instructor'
      ? `notifications.entities.${m.entityType}`
      : 'notifications.entities.item';
    rows.push(['information-circle-outline', t('notifications.detail.entityType'), t(entityTypeKey)]);
  }

  // Canal y correo
  const channelLabel = notif.channel === 'app+email'
    ? t('notifications.detail.channelEmail')
    : t('notifications.detail.channelApp');
  rows.push(['mail-outline', t('notifications.detail.channel'), channelLabel]);
  if (notif.emailStatus) {
    const emailLabel =
      notif.emailStatus === 'sent'    ? t('notifications.detail.emailSent')    :
      notif.emailStatus === 'pending' ? t('notifications.detail.emailPending') :
                                        t('notifications.detail.emailFailed');
    rows.push(['send-outline', t('notifications.detail.emailStatus'), emailLabel]);
  }

  // RF-8.4 — si ya tiene decisión
  if (m.facialDecision) {
    rows.push([
      m.facialDecision === 'accepted' ? 'checkmark-circle-outline' : 'close-circle-outline',
      t('notifications.detail.facialDecision'),
      m.facialDecision === 'accepted' ? t('notifications.detail.accepted') : t('notifications.detail.rejected'),
      m.facialDecision === 'accepted' ? Colors.success : Colors.error,
    ] as any);
    if (m.decidedBy || m.decidedByName) rows.push(['person-outline', t('notifications.detail.decidedBy'), notificationDecisionActorName(m, t)]);
  }

  // Enlace a corregir (para inconsistencias CSV)
  const hasConflictLink = !!m.conflictRecordId && notif.type === 'csv_inconsistency';

  return (
    <View style={[ns.detail, { borderTopColor: border }]}>
      {rows.map(([icon, label, value, valueColor]) => (
        <View key={String(label)} style={[ns.detailRow, { borderBottomColor: border }]}>
          <View style={ns.detailLabel}>
            <Ionicons name={icon as any} size={13} color={muted} />
            <Text style={[ns.detailLabelText, { color: muted }]}>{label}</Text>
          </View>
          <Text style={[ns.detailValue, { color: (valueColor as string | undefined) || text }]}>{value}</Text>
        </View>
      ))}

      {/* Enlace a corregir para CSV_INCONSISTENCY */}
      {!isApprentice && hasConflictLink && (
        <TouchableOpacity
          style={[ns.actionLink, !isDark && ns.lightShadow, { backgroundColor: Colors.info + '18', borderColor: Colors.info + '50' }]}
          onPress={() => router.push('/admin/academic' as any)}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-forward-circle-outline" size={15} color={Colors.info} />
          <Text style={[ns.actionLinkText, { color: Colors.info }]}>{t('notifications.detail.goCorrect')}</Text>
        </TouchableOpacity>
      )}

      {/* RF-8.4 — Botones Aceptar/Rechazar para re-registro facial sin decisión aún */}
      {isApprentice && (notif.type === 'facial_authorization_expired' || (notif.type === 'facial_request_resolved' && m.facialDecision === 'accepted')) && (
        <AppButton title={t('notifications.templates.resetUi.openFacial')}
          onPress={() => router.push('/apprentice/facial')} />
      )}
      {decisionError && <Text style={{ color: Colors.error }}>{decisionError}</Text>}
      {isCoordinator && notif.type === 'facial_reregister_request' && !m.facialDecision && (
        <View style={ns.facialActions}>
          <AppButton
            title={t('notifications.detail.reject')}
            disabled={resolvingId !== null}
            onPress={() => handleFacialDecision(notif.id, 'rejected')}
            variant="outline"
            fullWidth={false}
            style={{ flex: 1, borderColor: Colors.error }}
          />
          <AppButton
            title={t('notifications.detail.accept')}
            disabled={resolvingId !== null}
            onPress={() => handleFacialDecision(notif.id, 'accepted')}
            fullWidth={false}
            style={ns.facialBtn}
          />
        </View>
      )}
    </View>
  );
}
