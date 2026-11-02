import { listManagedEnvironments, ManagedEnvironment } from '@/features/environments/environmentAdminApi';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

function errorMessage(error: unknown, fallback: string) {
  const value = error as { response?: { data?: { message?: unknown } } };
  return typeof value?.response?.data?.message === 'string' ? value.response.data.message : fallback;
}

export default function EnvironmentAdminList() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const [items, setItems] = useState<ManagedEnvironment[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const copy = useCallback((key: string) => t(`environmentAdmin.${key}`), [t]);
  const load = useCallback(async (search: string) => {
    setError('');
    try { setItems(await listManagedEnvironments(search)); }
    catch (reason) { setError(errorMessage(reason, copy('loadError'))); }
    finally { setLoading(false); }
  }, [copy]);

  useEffect(() => {
    const timer = setTimeout(() => { void load(query); }, 220);
    return () => clearTimeout(timer);
  }, [load, query]);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = theme.textMuted;
  const surface = isDark ? Colors.dark.surface : Colors.light.surface;
  const border = isDark ? Colors.dark.border : Colors.light.border;
  const renderItem = ({ item }: { item: ManagedEnvironment }) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${item.environmentName}, ${item.state === 'ACTIVE' ? copy('active') : copy('inactive')}`}
      onPress={() => router.push(`/admin/environments/${item.idEnvironment}` as any)}
      style={[s.card, { backgroundColor: surface, borderColor: border }]}
    >
      <View style={s.cardCopy}>
        <Text style={[s.name, { color: text }]}>{item.environmentName}</Text>
        <Text style={[s.meta, { color: muted }]}>
          {item.capacity ? `${item.capacity} ${copy('capacityUnit')}` : copy('capacityNotSet')} · {item.state === 'ACTIVE' ? copy('active') : copy('inactive')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={muted} />
    </TouchableOpacity>
  );

  return (
    <View style={[s.page, { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }]}>
      <View style={s.heading}>
        <View style={s.headingCopy}>
          <Text style={[s.title, { color: text }]}>{copy('listTitle')}</Text>
          <Text style={[s.subtitle, { color: muted }]}>{copy('listSubtitle')}</Text>
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={copy('createAction')} onPress={() => router.push('/admin/environments/register' as any)} style={[s.addButton, { backgroundColor: theme.primary }]}>
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={s.addText}>{copy('createAction')}</Text>
        </TouchableOpacity>
      </View>
      <View style={[s.search, { backgroundColor: surface, borderColor: border }]}>
        <Ionicons name="search" size={18} color={muted} />
        <TextInput
          accessibilityLabel={copy('search')}
          value={query}
          onChangeText={setQuery}
          placeholder={copy('search')}
          placeholderTextColor={muted}
          style={[s.searchInput, { color: text }]}
        />
      </View>
      {loading ? <View style={s.loading}><ActivityIndicator size="large" color={theme.primary} /></View> : (
        <FlatList
          data={items}
          keyExtractor={item => item.idEnvironment}
          renderItem={renderItem}
          contentContainerStyle={items.length ? s.list : s.emptyList}
          refreshing={loading}
          onRefresh={() => { setLoading(true); void load(query); }}
          ListEmptyComponent={<Text style={[s.empty, { color: muted }]}>{error || copy('empty')}</Text>}
        />
      )}
      {!!error && items.length > 0 && <Text accessibilityRole="alert" style={[s.error, { color: theme.danger }]}>{error}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, padding: 22, gap: 16 },
  heading: { width: '100%', maxWidth: 900, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 12 },
  headingCopy: { flex: 1 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  subtitle: { fontSize: FontSize.sm, lineHeight: 20, marginTop: 4 },
  addButton: { minHeight: 42, borderRadius: 10, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 5 },
  addText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  search: { width: '100%', maxWidth: 900, alignSelf: 'center', minHeight: 46, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, fontSize: FontSize.md, minHeight: 44 },
  list: { width: '100%', maxWidth: 900, alignSelf: 'center', gap: 10, paddingBottom: 28 },
  emptyList: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { minHeight: 76, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardCopy: { flex: 1 },
  name: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  meta: { fontSize: FontSize.xs, marginTop: 5 },
  empty: { textAlign: 'center', fontSize: FontSize.sm },
  error: { width: '100%', maxWidth: 900, alignSelf: 'center', fontSize: FontSize.sm },
});
