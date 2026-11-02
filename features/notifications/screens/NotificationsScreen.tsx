import NotificationDetail from '@/features/notifications/components/NotificationDetail';
import { notificationStyles as ns } from '@/features/notifications/styles/notificationStyles';
import { localizeNotification, formatNotificationDate } from '@/features/notifications/localizeNotification';
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
          {expanded && <NotificationDetail notif={item} isApprentice={isApprentice} isCoordinator={isCoordinator}
            resolvingId={resolvingId} decisionError={decisionError} handleFacialDecision={handleFacialDecision} />}
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
