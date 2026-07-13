// ─────────────────────────────────────────────
//  app/admin/environments/index.tsx
//  Listado de ambientes con búsqueda y filtro
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useEnvironments, EnvironmentStatusFilter } from '@/features/environments/useEnvironments';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function EnvironmentsListScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { environments, search, setSearch, statusFilter, setStatusFilter, deactivate } = useEnvironments();
  const { alert, DialogUI } = useAppDialog();

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
            if (!result.success) alert(t('common.error'), result.error);
          },
        },
      ]
    );
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
      <Text style={[els.cardTitle, { color: text }]}>{t('environments:cardTitle', { code: item.code })}
    </Text>
      <View style={els.cardActions}>
        <TouchableOpacity
          onPress={() => router.push(`/admin/environments/${item.id}` as any)}
          style={[els.actionBtn, { backgroundColor: theme.primary + '15' }]}
        >
          <Ionicons name="eye-outline" size={16} color={theme.primary} />
        </TouchableOpacity>
        {item.status === 'active' && (
          <TouchableOpacity
            onPress={() => handleDeactivate(item.id, item.code)}
            style={[els.actionBtn, { backgroundColor: Colors.error + '15' }]}
          >
            <Ionicons name="trash-outline" size={16} color={Colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[els.safe, { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }]}>
      <View style={els.header}>
        <Text style={[els.title, { color: text }]}>{t('environments.title')}</Text>
        <TouchableOpacity
          onPress={() => router.push('/admin/environments/register' as any)}
          style={[els.addBtn, { backgroundColor: theme.primary }]}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={els.addBtnText}>{t('environments.register')}</Text>
        </TouchableOpacity>
      </View>

      <View style={[els.searchWrap, { backgroundColor: inputBg, borderColor: border }]}>
        <Ionicons name="search-outline" size={18} color={muted} />
        <TextInput
          style={[{backgroundColor: inputBg, borderColor: border }]}
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
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
  },
  addBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 10,
    height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14,
  },
  filterRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginTop: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.2 },
  filterChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: 8 },
  cardActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  actionBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: FontSize.base, textAlign: 'center' },
});
