// ─────────────────────────────────────────────
//  app/admin/schedules/index.tsx — Horarios (Admin)
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useSchedules } from '@/features/schedules/useSchedules';
import { useEnvironments } from '@/features/environments/useEnvironments';
import { useAcademic } from '@/features/academic/useAcademic';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function SchedulesListScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { schedules, search, setSearch, remove } = useSchedules();
  const { getById: getEnvironment } = useEnvironments();
  const { getFicha } = useAcademic();
  const { alert, DialogUI } = useAppDialog();
  const { width } = useWindowDimensions();
  const isMobile = width < 480;
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  // Resuelve el nombre actual del ambiente/ficha contra los módulos reales
  // (Ambientes/Académico). Si la entidad ya no existe (p. ej. fue eliminada
  // permanentemente), se conserva el nombre guardado como respaldo histórico.
  const resolveEnvironmentName = (environmentId: string, fallback: string) => getEnvironment(environmentId)?.code ?? fallback;
  const resolveFichaNumber = (fichaId: string, fallback: string) => getFicha(fichaId)?.number ?? fallback;

  const handleDelete = (id: string) => {
    alert(t('schedules.delete'), t('schedules.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('schedules.delete'), style: 'destructive', onPress: () => {
        const r = remove(id);
        if (r.success) alert('✓', t('schedules.deleteSuccess'));
      }},
    ]);
  };

  return (
    <View style={[sls.safe, { backgroundColor: bg }]}>
      <View style={[sls.header, isMobile && sls.headerMobile]}>
        <Text style={[sls.title, { color: text }]}>{t('schedules.title')}</Text>
        <TouchableOpacity onPress={() => router.push('/admin/schedules/register' as any)} style={[sls.addBtn, isMobile && sls.addBtnMobile, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color={Colors.white} /><Text style={sls.addBtnText}>{t('schedules.register')}</Text>
        </TouchableOpacity>
      </View>

      <View style={[sls.searchWrap, { backgroundColor: inputBg, borderColor: border }]}>
        <Ionicons name="search-outline" size={18} color={muted} />
        <TextInput style={[sls.searchInput, { color: text }] as any} value={search} onChangeText={setSearch}
          placeholder={t('schedules.searchPlaceholder')} placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'} />
      </View>

      <FlatList data={schedules} keyExtractor={s => s.id}
        contentContainerStyle={sls.list}
        renderItem={({ item }) => {
          const environmentName = resolveEnvironmentName(item.environmentId, item.environmentName);
          const fichaNumber = resolveFichaNumber(item.fichaId, item.fichaNumber);
          return (
            <TouchableOpacity onPress={() => router.push(`/admin/schedules/${item.id}` as any)} activeOpacity={0.7}
              style={[sls.card, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <View style={[sls.dayBadge, { backgroundColor: theme.primary + '20' }]}>
                  <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 12 }}>{t(`schedules.days.${item.day}`).slice(0, 3).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[sls.cardTitle, { color: text }]}>Ficha {fichaNumber} - {item.programName}</Text>
                  <Text style={[sls.cardTime, { color: muted }]}>{item.startTime} - {item.endTime}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push(`/admin/schedules/register?id=${item.id}` as any)} style={[sls.iconBtn, { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name="create-outline" size={16} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={[sls.iconBtn, { backgroundColor: Colors.error + '15' }]}>
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
              <View style={sls.cardFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="business-outline" size={13} color={muted} /><Text style={{ color: muted, fontSize: 12 }}>{environmentName}</Text></View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="person-outline" size={13} color={muted} /><Text style={{ color: muted, fontSize: 12 }}>{item.instructorName}</Text></View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<View style={sls.empty}><Text style={{ color: muted }}>{t('schedules.empty')}</Text></View>}
      />
      <TouchableOpacity onPress={() => router.push('/admin/schedules/exceptions' as any)} style={[sls.exBtn, { borderColor: Colors.warning }]} activeOpacity={0.7}>
        <Ionicons name="alert-circle-outline" size={18} color={Colors.warning} /><Text style={{ color: Colors.warning, fontWeight: '700' }}>{t('schedules.exceptions')}</Text>
      </TouchableOpacity>
      {DialogUI}
    </View>
  );
}

const sls = StyleSheet.create({
  safe: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerMobile: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  addBtnMobile: { justifyContent: 'center', paddingVertical: 13, alignSelf: 'stretch' },
  addBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginVertical: 10, height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: FontSize.md, outlineStyle: 'none' } as any,
  list: { padding: 16, gap: 10 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  dayBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  cardTime: { fontSize: FontSize.sm, marginTop: 2 },
  cardFooter: { flexDirection: 'row', gap: 16, marginTop: 6 },
  iconBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  exBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, marginHorizontal: 16, marginBottom: 16 },
});
