// ─────────────────────────────────────────────
//  app/admin/environments/index.tsx
//  Listado de ambientes con búsqueda y filtro
// ─────────────────────────────────────────────
import { EnvironmentStatusFilter, useEnvironments } from '@/features/environments/useEnvironments';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { isRecent, wasEditedRecently } from '@/shared/utils/dates';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';

export default function EnvironmentsListScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { environments, search, setSearch, statusFilter, setStatusFilter, deactivate, reactivate, deletePermanently } = useEnvironments();
  const { alert, DialogUI } = useAppDialog();
  const { width } = useWindowDimensions();
  const isMobile = width < 480;

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';

  const statusColors: Record<string, string> = {
    active: Colors.success,
    inactive: Colors.error,
  };

  const filterOptions: { value: EnvironmentStatusFilter; label: string }[] = [
    { value: 'all', label: t('environments.filter.all') },
    { value: 'active', label: t('environments.filter.active') },
    { value: 'inactive', label: t('environments.filter.inactive') },
  ];

  const handleDeactivate = (id: string, code: string) => {
    alert(
      t('environments.delete'),
      `${code}\n\n${t('environments.confirmDelete')}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('environments.delete'),
          style: 'destructive',
          onPress: () => {
            const result = deactivate(id);
            if (!result.success && result.error) alert(t('common.error'), t(result.error));
          },
        },
      ]
    );
  };

  const handleDeletePermanently = (id: string, code: string) => {
    alert(
      t('environments.deleteCompletely'),
      `${code}\n\n${t('environments.deleteCompletelyConfirm')}`,
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: () => {
            const result = deletePermanently(id);
            if (result.success) alert('✓', t('environments.deleteCompletelySuccess'));
            else if (result.error) alert(t('common.error'), t(result.error));
          },
        },
      ]
    );
  };

  const handleReactivate = (id: string, code: string) => {
    alert(t('environments.reactivate'), `${code}\n\n${t('environments.confirmReactivate')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('environments.reactivate'), onPress: () => {
        const result = reactivate(id);
        if (result.success) alert('✓', t('environments.reactivateSuccess'));
        else if (result.error) alert(t('common.error'), t(result.error));
      } },
    ]);
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      onPress={() => router.push(`/admin/environments/${item.id}` as any)}
      style={[els.card, { backgroundColor: cardBg, borderColor: border }]}
      activeOpacity={0.7}
    >
      <View style={els.cardHeader}>
        <View style={[els.typeBadge, { backgroundColor: theme.primary + '20' }]}>
          <Ionicons name="business-outline" size={16} color={theme.primary} />
          <Text style={[els.typeText, { color: theme.primary }]}>{item.code}</Text>
        </View>
        <View style={els.statusWrap}>
          <View style={[els.statusDot, { backgroundColor: statusColors[item.status] || muted }]} />
          <Text style={[els.statusLabel, { color: statusColors[item.status] || muted }]}>
            {t(`environments.statuses.${item.status}`)}
          </Text>
        </View>
      </View>
      {(isRecent(item.createdAt) || wasEditedRecently(item.createdAt, item.updatedAt)) && (
        <View style={els.badgeRow}>
          {isRecent(item.createdAt) && <View style={[els.infoBadge, { backgroundColor: theme.primary + '18' }]}>
            <Ionicons name="sparkles-outline" size={12} color={theme.primary} />
            <Text style={[els.infoBadgeText, { color: theme.primary }]}>{t('environments.recentBadge')}</Text>
          </View>}
          {wasEditedRecently(item.createdAt, item.updatedAt) && <View style={[els.infoBadge, { backgroundColor: '#8A6D3B18' }]}>
            <Ionicons name="create-outline" size={12} color="#B8860B" />
            <Text style={[els.infoBadgeText, { color: '#B8860B' }]}>{t('environments.editedRecentlyBadge')}</Text>
          </View>}
        </View>
      )}
      <View style={els.titleRow}>
        <Text style={[els.cardTitle, { color: text }]}>{t('environments.cardTitle', { code: item.code })}</Text>
      </View>
      <Text style={[els.cardSub, { color: muted }]}>{t('environments.fields.quantity')}: {item.quantity}</Text>
      <View style={els.cardActions}>
        <TouchableOpacity
          onPress={() => router.push(`/admin/environments/${item.id}` as any)}
          style={[els.actionBtn, { backgroundColor: theme.primary + '15' }]}
          accessibilityLabel={t('common.view')}
        >
          <Ionicons name="eye-outline" size={16} color={theme.primary} />
        </TouchableOpacity>
        {item.status === 'active' && (
          <TouchableOpacity
            onPress={() => handleDeactivate(item.id, item.code)}
            style={[els.actionBtn, { backgroundColor: Colors.error + '15' }]}
            accessibilityLabel={t('environments.delete')}
          >
            <Ionicons name="trash-outline" size={16} color={Colors.error} />
          </TouchableOpacity>
        )}
        {item.status === 'inactive' && (
          <>
            <TouchableOpacity onPress={() => handleReactivate(item.id, item.code)} style={[els.actionBtn, { backgroundColor: theme.primary + '15' }]} accessibilityLabel={t('environments.reactivate')}>
              <Ionicons name="refresh-outline" size={16} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeletePermanently(item.id, item.code)} style={[els.actionBtn, { backgroundColor: Colors.error + '15' }]} accessibilityLabel={t('environments.deleteCompletely')}>
              <Ionicons name="trash" size={16} color={Colors.error} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[els.safe, { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }]}>
      <View style={[els.header, isMobile && els.headerMobile]}>
        <View style={els.headingCopy}>
          <Text style={[els.title, { color: text }]}>{t('environments.title')}</Text>
          <Text style={[els.subtitle, { color: muted }]}>{t('environments.listSubtitle', 'Consulta, filtra y administra los ambientes de formación registrados en la institución.')}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/admin/environments/register' as any)}
          style={[els.addBtn, isMobile && els.addBtnMobile, { backgroundColor: theme.primary }]}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={els.addBtnText}>{t('environments.register')}</Text>
        </TouchableOpacity>
      </View>

      <View style={[els.searchWrap, { backgroundColor: inputBg, borderColor: border }]}>
        <Ionicons name="search-outline" size={18} color={muted} />
        <TextInput
          style={[els.searchInput, { color: text }]}
          value={search}
          onChangeText={setSearch}
          placeholder={t('environments.search')}
          placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
        />
      </View>

      <View style={els.filterRow}>
        {filterOptions.map(opt => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setStatusFilter(opt.value)}
            style={[
              els.filterChip,
              {
                backgroundColor: statusFilter === opt.value ? theme.primary + '20' : inputBg,
                borderColor: statusFilter === opt.value ? theme.primary : border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[els.filterChipText, { color: statusFilter === opt.value ? theme.primary : muted }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[els.filterHelp, { color: muted }]}>{t('environments.filterHelp', 'Los ambientes inactivos no están disponibles para horarios ni fichas.')}</Text>

      <FlatList
        data={environments}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={els.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={els.empty}>
            <Ionicons name="business-outline" size={48} color={muted} />
            <Text style={[els.emptyText, { color: muted }]}>{t('environments.emptyState')}</Text>
          </View>
        }
      />
      {DialogUI}
    </View>
  );
}

const els = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
  },
  headerMobile: {
    flexDirection: 'column', alignItems: 'stretch', gap: 12,
  },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black },
  headingCopy: { flex: 1 },
  subtitle: { fontSize: FontSize.sm, marginTop: 3 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
  },
  addBtnMobile: {
    justifyContent: 'center', paddingVertical: 13, alignSelf: 'stretch',
  },
  addBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 10,
    height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14,
  },
  filterRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginTop: 10 },
  filterHelp: { marginHorizontal: 16, marginTop: 6, fontSize: FontSize.xs },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.2 },
  filterChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  infoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  infoBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  searchInput: { flex: 1, fontSize: FontSize.md, paddingVertical: 4 },
  cardSub: { fontSize: FontSize.sm, marginBottom: 8 },
  cardActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  actionBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: FontSize.base, textAlign: 'center' },
});