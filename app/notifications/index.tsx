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
import { resolveFacialRequest } from '@/features/notifications/notificationsStore';
import type { Notification, NotificationCategory } from '@/features/notifications/types';
import { useNotifications, type StatusFilter } from '@/features/notifications/useNotifications';
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
  csv:        { icon: 'document-text-outline', color: '#4A90D9', labelKey: 'notifications.categories.csv' },
  transfer:   { icon: 'swap-horizontal-outline', color: '#8E44AD', labelKey: 'notifications.categories.transfer' },
  attendance: { icon: 'checkmark-circle-outline', color: Colors.success, labelKey: 'notifications.categories.attendance' },
  academic:   { icon: 'school-outline', color: Colors.warning, labelKey: 'notifications.categories.academic' },
  security:   { icon: 'shield-outline', color: Colors.error, labelKey: 'notifications.categories.security' },
  facial:     { icon: 'scan-outline', color: Colors.primary, labelKey: 'notifications.categories.facial' },
};

const ALL_CATEGORIES: (NotificationCategory | 'all')[] = [
  'all', 'csv', 'transfer', 'attendance', 'academic', 'security', 'facial',
];

export default function NotificationsScreen() {
  const { isDark, theme } = useTheme();
  const { t }              = useTranslation();
  const { user }           = useAuth();

  const [statusFilter,   setStatusFilter]   = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | 'all'>('all');
  const [expandedId,     setExpandedId]     = useState<string | null>(null);

  const { notifications, unreadCount, markRead, markAllRead } = useNotifications({
    statusFilter,
    categoryFilter,
  });

  const text    = isDark ? Colors.dark.text    : Colors.light.text;
  const muted   = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg  = isDark ? '#0D1F14'           : Colors.white;
  const border  = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg      = isDark ? Colors.dark.background : Colors.light.background;
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5';

  // ── Handlers ──────────────────────────────
  const handlePress = (notif: Notification) => {
    markRead(notif.id);
    setExpandedId(prev => (prev === notif.id ? null : notif.id));
  };

  const handleFacialDecision = (notifId: string, decision: 'accepted' | 'rejected') => {
    resolveFacialRequest(notifId, decision, user?.document ?? 'coordinator');
    setExpandedId(null);
  };

  // ── Render de detalle expandido ──────────
  const renderDetail = (notif: Notification) => {
    const m = notif.meta ?? {};
    const rows: [string, string, string?, string?][] = [];

    // Campos comunes según tipo
    if (m.learnerName)      rows.push(['person-outline',       t('notifications.detail.learner'),   m.learnerName]);
    if (m.learnerDocument)  rows.push(['card-outline',         t('notifications.detail.document'),  m.learnerDocument]);
    if (m.accountDocument && !m.learnerDocument)
                            rows.push(['card-outline',         t('notifications.detail.document'),  m.accountDocument]);
    if (m.fromFichaNumber)  rows.push(['arrow-forward-outline',t('notifications.detail.fromFicha'), m.fromFichaNumber]);
    if (m.toFichaNumber)    rows.push(['arrow-forward-circle-outline', t('notifications.detail.toFicha'), m.toFichaNumber]);
    if (m.fichaNumber && !m.fromFichaNumber)
                            rows.push(['school-outline',       t('notifications.detail.ficha'),     m.fichaNumber]);
    if (m.date)             rows.push(['calendar-outline',     t('attendance.fields.date'),         m.date]);
    if (m.entryTime)        rows.push(['log-in-outline',       t('attendance.fields.entryTime'),    m.entryTime]);
    if (m.delayMinutes && m.delayMinutes > 0)
                            rows.push(['timer-outline',        t('attendance.fields.delay'),        `${m.delayMinutes} min`]);
    if (m.environmentName)  rows.push(['business-outline',     t('attendance.fields.environment'),  m.environmentName]);
    if (m.instructorName)   rows.push(['person-circle-outline',t('attendance.fields.instructor'),   m.instructorName]);
    if (m.failedCount)      rows.push(['alert-circle-outline', t('notifications.detail.failedCount'), `${m.failedCount}`]);
    if (m.lockMinutes)      rows.push(['time-outline',         t('notifications.detail.lockMinutes'), `${m.lockMinutes} min`]);
    if (m.csvSummary) {
      const s = m.csvSummary;
      rows.push(['add-circle-outline',   t('notifications.detail.created'), `${s.created}`]);
      rows.push(['pencil-outline',       t('notifications.detail.updated'), `${s.updated}`]);
      rows.push(['alert-circle-outline', t('notifications.detail.blocked'), `${s.blocked}`]);
      rows.push(['close-circle-outline', t('notifications.detail.errors'),  `${s.errors}`]);
    }
    if (m.entityType) rows.push(['information-circle-outline', t('notifications.detail.entityType'), m.entityType]);

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
      if (m.decidedBy) rows.push(['person-outline', t('notifications.detail.decidedBy'), m.decidedBy]);
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
        {hasConflictLink && (
          <TouchableOpacity
            style={[ns.actionLink, { backgroundColor: Colors.info + '18', borderColor: Colors.info + '50' }]}
            onPress={() => router.push('/admin/academic' as any)}
            accessibilityRole="button"
          >
            <Ionicons name="arrow-forward-circle-outline" size={15} color={Colors.info} />
            <Text style={[ns.actionLinkText, { color: Colors.info }]}>{t('notifications.detail.goCorrect')}</Text>
          </TouchableOpacity>
        )}

        {/* RF-8.4 — Botones Aceptar/Rechazar para re-registro facial sin decisión aún */}
        {notif.type === 'facial_reregister_request' && !m.facialDecision && (
          <View style={ns.facialActions}>
            <AppButton
              title={t('notifications.detail.reject')}
              onPress={() => handleFacialDecision(notif.id, 'rejected')}
              variant="outline"
              fullWidth={false}
              style={{ flex: 1, borderColor: Colors.error }}
            />
            <AppButton
              title={t('notifications.detail.accept')}
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
    const isUnread = !item.read;
    const expanded = expandedId === item.id;
    const isEmail  = item.channel === 'app+email';
    const isFacialRequest = item.type === 'facial_reregister_request' && !item.meta?.facialDecision;

    return (
      <TouchableOpacity
        onPress={() => handlePress(item)}
        style={[
          ns.card,
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
                  {item.title}
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
                {item.message}
              </Text>
              <View style={ns.cardFooter}>
                <Text style={[ns.cardDate, { color: muted }]}>{item.date} · {item.time}</Text>
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
  return (
    <SafeAreaView style={[ns.root, { backgroundColor: bg }]} edges={['top', 'left', 'right']}>
      {/* Cabecera */}
      <View style={[ns.header, { borderBottomColor: border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} accessibilityRole="button">
          <Ionicons name="arrow-back" size={22} color={text} />
        </TouchableOpacity>
        <View style={ns.headerTitle}>
          <Text style={[ns.title, { color: text }]}>{t('notifications.title')}</Text>
          {unreadCount > 0 && (
            <View style={[ns.badge, { backgroundColor: theme.primary }]}>
              <Text style={ns.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={markAllRead}
            style={[ns.markAllBtn, { backgroundColor: theme.primary + '20' }]}
            accessibilityRole="button"
          >
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 12 }}>
              {t('notifications.markAllRead')}
            </Text>
          </TouchableOpacity>
        )}
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
              style={[ns.filterBtn, { backgroundColor: active ? theme.primary + '20' : inputBg, borderColor: active ? theme.primary : border }]}
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
        {ALL_CATEGORIES.map(cat => {
          const active = categoryFilter === cat;
          const cfg = cat !== 'all' ? CAT_CONFIG[cat] : null;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategoryFilter(cat)}
              style={[ns.catBtn, { backgroundColor: active ? (cfg?.color ?? theme.primary) + '20' : inputBg, borderColor: active ? (cfg?.color ?? theme.primary) : border }]}
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
  root:   { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 40, paddingBottom: 28, borderBottomWidth: 1 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginLeft: 12 },
  title:  { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  badge:  { borderRadius: 10, minWidth: 20, height: 20, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  markAllBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },

  // ── Fix: altura fija + contenido centrado verticalmente ──
  filterScroll: { borderBottomWidth: 1, flexGrow: 0, height: 60, marginTop: 16 },
  filterRow:    { flexDirection: 'row', gap: 10, paddingHorizontal: 16, alignItems: 'center' },
  filterBtn:    { borderRadius: 22, borderWidth: 1.5, paddingHorizontal: 18, paddingVertical: 10, minWidth: 90, alignItems: 'center', justifyContent: 'center', outlineStyle: 'none' } as any,

  // ── Fix: altura fija + separación visual respecto a la fila de estado ──
  catScroll: { borderBottomWidth: 1, flexGrow: 0, height: 58, marginTop: 22 },
  catRow:    { flexDirection: 'row', gap: 10, paddingHorizontal: 16, alignItems: 'center' },
  catBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 18, borderWidth: 1.2, paddingHorizontal: 14, paddingVertical: 8, minWidth: 76, justifyContent: 'center', outlineStyle: 'none' } as any,

  list:   { padding: 16, paddingTop: 20, gap: 12, paddingBottom: 40 },

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
  detailLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  detailLabelText: { fontSize: FontSize.xs },
  detailValue: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, flex: 1, textAlign: 'right' },

  actionLink:     { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, borderWidth: 1, padding: 10, marginTop: 8 },
  actionLinkText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  facialActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  facialBtn:     { flex: 1 },

  empty:     { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: FontSize.base, textAlign: 'center' },
});