import { localizeNotification, normalizeNotificationMeta, notificationDecisionActorName, profileChangeDetails, formatNotificationDate } from '@/features/notifications/localizeNotification';
import { useAuthGuard } from '@/shared/hooks/useAuthGuard';
// ─────────────────────────────────────────────
//  app/notifications/index.tsx
//  RF-8.2 — Bandeja de notificaciones (Coordinador)
//
//  • Lista ordenada más reciente primero
//  • Filtro por estado: Todas / No leídas / Leídas
//  • Filtro por categoría: todas las 6 del catálogo
//  • Tocar una notificación → la marca como leída
//    y expande el detalle completo
//  • RF-8.4: notificaciones de re-registro facial
//    muestran botones Aceptar / Rechazar inline
//  • Badge de no leídas en la cabecera
// ─────────────────────────────────────────────
import type { Notification, NotificationCategory } from '@/features/notifications/types';
import { useNotifications, type StatusFilter } from '@/features/notifications/useNotifications';
import RoleTopbar from '@/shared/components/layout/RoleTopbar';
import AppButton from '@/shared/components/ui/AppButton';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ── Configuración visual por categoría ────────
const CAT_CONFIG: Record<
  NotificationCategory,
  { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; labelKey: string }
> = {
  csv:        { icon: 'document-text-outline', color: Colors.info, labelKey: 'notifications.categories.csv' },
  transfer:   { icon: 'swap-horizontal-outline', color: '#8B5CF6', labelKey: 'notifications.categories.transfer' },
  attendance: { icon: 'checkmark-circle-outline', color: Colors.success, labelKey: 'notifications.categories.attendance' },
  academic:   { icon: 'school-outline', color: Colors.warning, labelKey: 'notifications.categories.academic' },
  security:   { icon: 'shield-outline', color: Colors.error, labelKey: 'notifications.categories.security' },
  facial:     { icon: 'scan-outline', color: Colors.primary, labelKey: 'notifications.categories.facial' },
};

const ALL_CATEGORIES: (NotificationCategory | 'all')[] = [
  'all', 'csv', 'transfer', 'attendance', 'academic', 'security', 'facial',
];
const APPRENTICE_CATEGORIES: (NotificationCategory | 'all')[] = [
  'all', 'attendance', 'transfer', 'facial',
];

export default function NotificationsScreen() {
  const { isDark, theme } = useTheme();
  const { t, i18n }         = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { canRenderContent } = useAuthGuard(isAuthenticated, '/auth/login', authLoading);

  const [statusFilter,   setStatusFilter]   = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | 'all'>('all');
  const [expandedId,     setExpandedId]     = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const isApprentice = user?.role === 'APPRENTICE';
  const isCoordinator = user?.role === 'COORDINATOR';
  const { notifications, unreadCount, markRead, resolveFacial } = useNotifications({
    statusFilter,
    categoryFilter,
    recipientUserId: isApprentice ? user?.id : undefined,
  });

  const text    = isDark ? Colors.dark.text    : Colors.light.text;
  const muted   = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg  = theme.surface;
  const border  = theme.border;
  const bg      = isDark ? Colors.dark.background : Colors.light.background;
  const inputBg = theme.inputBg;

  const formatLocalizedDate = (value: string) => {
    return value ? formatNotificationDate(value, i18n.resolvedLanguage ?? i18n.language) : '—';
  };

  const getLocalizedText = (notif: Notification) =>
    localizeNotification(notif, t, i18n.resolvedLanguage ?? i18n.language);

  // ── Handlers ──────────────────────────────
  const handlePress = (notif: Notification) => {
    markRead(notif.id);
    setExpandedId(prev => (prev === notif.id ? null : notif.id));
  };

  const handleFacialDecision = async (notifId: string, decision: 'accepted' | 'rejected') => {
    if (resolvingId) return;
    setResolvingId(notifId);
    setDecisionError(null);
    try {
      await resolveFacial(notifId, decision, user?.id ?? '', [user?.firstName, user?.lastName].filter(Boolean).join(' '));
      setExpandedId(null);
    } catch (error: any) {
      setDecisionError(error?.response?.data?.message || t('notifications.templates.resetUi.errorMessage'));
    } finally { setResolvingId(null); }
  };

  // ── Render de detalle expandido ──────────
  const renderDetail = (notif: Notification) => {
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
  };

  // ── Render de una tarjeta ─────────────────
  const renderItem = ({ item }: { item: Notification }) => {
    const cfg      = CAT_CONFIG[item.category];
    const localized = getLocalizedText(item);
    const isUnread = !item.read;
    const expanded = expandedId === item.id;
    const isEmail  = item.channel === 'app+email';
    const isFacialRequest = isCoordinator && item.type === 'facial_reregister_request' && !item.meta?.facialDecision;

    return (
      <TouchableOpacity
        onPress={() => handlePress(item)}
        style={[
          ns.card,
          !isDark && ns.cardLightShadow,
          { backgroundColor: cardBg, borderColor: isUnread ? cfg.color + '50' : border },
          isUnread && { shadowColor: cfg.color, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 },
        ]}
        activeOpacity={0.78}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={[ns.stripe, { backgroundColor: cfg.color }]} />

        <View style={ns.cardBody}>
          {/* Cabecera */}
          <View style={ns.cardHead}>
            <View style={[ns.iconCircle, { backgroundColor: cfg.color + '20' }]}>
              <Ionicons name={cfg.icon} size={18} color={cfg.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={ns.titleRow}>
                <Text
                  style={[ns.cardTitle, { color: text, fontWeight: isUnread ? FontWeight.black : FontWeight.medium }]}
                  numberOfLines={expanded ? undefined : 1}
                >
                  {localized.title}
                </Text>
                <View style={ns.badges}>
                  {isEmail && (
                    <View style={[ns.emailBadge, { backgroundColor: Colors.info + '20' }]}>
                      <Ionicons name="mail-outline" size={10} color={Colors.info} />
                    </View>
                  )}
                  {isFacialRequest && (
                    <View style={[ns.pendingBadge, { backgroundColor: theme.primary + '20' }]}>
                      <Text style={[ns.pendingText, { color: theme.primary }]}>{t('notifications.pending')}</Text>
                    </View>
                  )}
                  {isUnread && <View style={[ns.unreadDot, { backgroundColor: theme.primary }]} />}
                </View>
              </View>
              <Text style={[ns.cardMsg, { color: muted }]} numberOfLines={expanded ? undefined : 2}>
                {localized.message}
              </Text>
              <View style={ns.cardFooter}>
                <Text style={[ns.cardDate, { color: muted }]}>{formatLocalizedDate(item.date)} · {item.time}</Text>
                <View style={[ns.catChip, { backgroundColor: cfg.color + '15', borderColor: cfg.color + '30' }]}>
                  <Ionicons name={cfg.icon} size={10} color={cfg.color} />
                  <Text style={[ns.catChipText, { color: cfg.color }]} numberOfLines={1}>{t(cfg.labelKey)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Detalle expandido */}
          {expanded && renderDetail(item)}
        </View>
      </TouchableOpacity>
    );
  };

  // ── Render principal ──────────────────────
  if (!canRenderContent) return null;

  return (
    <SafeAreaView style={[ns.root, { backgroundColor: bg }]} edges={['top', 'left', 'right']}>
      <RoleTopbar />
      {/* Cabecera */}
      <View style={[ns.header, { borderBottomColor: border }]}>
        <View style={ns.headerTitle}>
          <Text style={[ns.title, { color: text }]}>{t('notifications.title')}</Text>
          {unreadCount > 0 && (
            <View style={[ns.badge, { backgroundColor: theme.primary }]}>
              <Text style={ns.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Filtros de estado */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[ns.filterScroll, { borderBottomColor: border }]}
        contentContainerStyle={ns.filterRow}
      >
        {(['all', 'unread', 'read'] as StatusFilter[]).map(f => {
          const active = statusFilter === f;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setStatusFilter(f)}
              style={[
                ns.filterBtn,
                !isDark && ns.lightShadow,
                { backgroundColor: active ? theme.primary + '20' : inputBg, borderColor: active ? theme.primary : border },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={{ color: active ? theme.primary : muted, fontWeight: '700', fontSize: 15 }}>
                {t(`notifications.filters.${f}`)}
                {f === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Filtros de categoría */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[ns.catScroll, { borderBottomColor: border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F5F5F5' }]}
        contentContainerStyle={ns.catRow}
      >
        {(isApprentice ? APPRENTICE_CATEGORIES : ALL_CATEGORIES).map(cat => {
          const active = categoryFilter === cat;
          const cfg = cat !== 'all' ? CAT_CONFIG[cat] : null;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategoryFilter(cat)}
              style={[
                ns.catBtn,
                !isDark && ns.lightShadow,
                { backgroundColor: active ? (cfg?.color ?? theme.primary) + '20' : inputBg, borderColor: active ? (cfg?.color ?? theme.primary) : border },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              {cfg
                ? <Ionicons name={cfg.icon} size={15} color={active ? cfg.color : muted} />
                : <Ionicons name="apps-outline" size={15} color={active ? theme.primary : muted} />
              }
              <Text
                numberOfLines={1}
                style={{ color: active ? (cfg?.color ?? theme.primary) : muted, fontSize: 14, fontWeight: '600' }}
              >
                {cat === 'all' ? t('notifications.filters.all') : t(cfg!.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Lista */}
      <FlatList
        style={ns.listWrap}
        data={notifications}
        keyExtractor={n => n.id}
        contentContainerStyle={ns.list}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={ns.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={muted} />
            <Text style={[ns.emptyText, { color: muted }]}>
              {notifications.length === 0 && statusFilter === 'all' && categoryFilter === 'all'
                ? t('notifications.empty')
                : t('notifications.emptyFiltered')}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────
const ns = StyleSheet.create({
  // flex:1 + minHeight:0 es necesario en web para que el hijo con overflow
  // (la lista) pueda scrollear DENTRO del espacio restante, en vez de que
  // el contenido empuje/encoja a los hermanos de arriba (los filtros).
  root:   { flex: 1, minHeight: 0 },
  lightShadow: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  cardLightShadow: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 4,
  },

  header: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 22, borderBottomWidth: 1 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  title:  { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  badge:  { borderRadius: 10, minWidth: 20, height: 20, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  // ── Fix: altura fija que NUNCA se encoge (flexShrink:0), sin importar
  // cuánto contenido tenga la lista de abajo ──
  filterScroll: { flexShrink: 0, borderBottomWidth: 1, flexGrow: 0, height: 64, marginTop: 18, marginBottom: 2 },
  filterRow:    { flexDirection: 'row', gap: 14, paddingHorizontal: 16, alignItems: 'center' },
  filterBtn:    { borderRadius: 22, borderWidth: 1.5, paddingHorizontal: 18, paddingVertical: 10, minWidth: 90, alignItems: 'center', justifyContent: 'center', outlineStyle: 'none' } as any,

  // ── Fix: misma idea — altura fija, nunca se encoge ──
  catScroll: { flexShrink: 0, borderBottomWidth: 1, flexGrow: 0, height: 66, marginTop: 14, marginBottom: 4 },
  catRow:    { flexDirection: 'row', gap: 12, paddingHorizontal: 16, alignItems: 'center' },
  catBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, borderWidth: 1.2, paddingHorizontal: 16, paddingVertical: 10, minWidth: 82, justifyContent: 'center', outlineStyle: 'none' } as any,

  // ── La lista es la única sección "elástica": toma el resto del
  // espacio disponible y scrollea internamente (nunca empuja al resto) ──
  listWrap: { flex: 1, minHeight: 0 },
  list:   { padding: 16, paddingTop: 24, gap: 12, paddingBottom: 40 },

  card:   { flexDirection: 'row', borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  stripe: { width: 4 },
  cardBody: { flex: 1, padding: 12 },
  cardHead: { flexDirection: 'row', gap: 10 },

  iconCircle: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 2 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: FontSize.base, flex: 1 },
  badges:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  emailBadge:  { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  pendingBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  pendingText:  { fontSize: 10, fontWeight: '700' },
  unreadDot:   { width: 8, height: 8, borderRadius: 4 },

  cardMsg:    { fontSize: FontSize.sm, marginTop: 3 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  cardDate:   { fontSize: 11, flex: 1 },
  catChip:    { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 8, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, maxWidth: 120 },
  catChipText: { fontSize: 10, fontWeight: '700', flexShrink: 1 },

  // Detalle expandido
  detail:     { marginTop: 10, paddingTop: 10, gap: 2 },
  detailRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 0.5 },
  detailLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, minWidth: 0 },
  detailLabelText: { fontSize: FontSize.xs, flexShrink: 1 },
  detailValue: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, flex: 1, minWidth: 0, textAlign: 'right' },

  actionLink:     { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, borderWidth: 1, padding: 10, marginTop: 8 },
  actionLinkText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  facialActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  facialBtn:     { flex: 1 },

  empty:     { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: FontSize.base, textAlign: 'center' },
});
