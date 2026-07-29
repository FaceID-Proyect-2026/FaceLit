import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAcademic } from '@/features/academic/useAcademic';
import { useFacialRegistry } from '@/features/facial/useFacialRegistry';
import { FacialRole, FacialUser, VALID_FACIAL_ROLES } from '@/features/facial/types';
import { getSystemUsers } from '@/shared/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
type Filter = 'registered' | 'pending';

export default function FacialManagementScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { allFichas } = useAcademic();
  const { records } = useFacialRegistry();
  const [filter, setFilter] = useState<Filter>('registered');
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const users = useMemo(() => {
    const directory = new Map<string, FacialUser>();
    getSystemUsers().forEach(user => directory.set(user.id, { id: user.id, name: `${user.name} ${user.lastname}`, role: user.role }));
    allFichas.forEach(ficha => ficha.learners.forEach(learner => {
      const role = learner.role as FacialRole;
      if (!VALID_FACIAL_ROLES.includes(role)) return;
      const current = directory.get(learner.id);
      directory.set(learner.id, { ...current, id: learner.id, name: `${learner.name} ${learner.lastname}`, role, fichaId: ficha.id, fichaNumber: ficha.number });
    }));
    return [...directory.values()].filter(user => VALID_FACIAL_ROLES.includes(user.role));
  }, [allFichas]);

  const recordByUserId = useMemo(() => new Map(records.filter(record => record.status === 'registered').map(record => [record.userId, record])), [records]);
  const listedUsers = users.filter(user => filter === 'registered' ? recordByUserId.has(user.id) : !recordByUserId.has(user.id));
  const stats = { registered: recordByUserId.size, pending: users.filter(user => !recordByUserId.has(user.id)).length, verified: 12 };

  return <View style={[fms.safe, { backgroundColor: bg }]}>
    <Text style={[fms.title, { color: text }]}>{t('facial.management')}</Text>
    <View style={fms.statsRow}>
      {[{ label: t('facial.stats.registered'), value: stats.registered, color: Colors.success }, { label: t('facial.stats.pending'), value: stats.pending, color: Colors.warning }, { label: t('facial.stats.verified'), value: stats.verified, color: Colors.info }].map(stat => <View key={stat.label} style={[fms.statCard, { backgroundColor: cardBg, borderColor: border }]}><Text style={[fms.statValue, { color: stat.color }]}>{stat.value}</Text><Text style={[fms.statLabel, { color: muted }]}>{stat.label}</Text></View>)}
    </View>
    <Text style={[fms.sectionTitle, { color: text }]}>{t('facial.instructions.title')}</Text>
    <View style={[fms.instrCard, { backgroundColor: cardBg, borderColor: border }]}>
      {[t('facial.instructions.step1'), t('facial.instructions.step2'), t('facial.instructions.step3'), t('facial.instructions.step4')].map((step, index) => <View key={index} style={fms.instruction}><Ionicons name="checkmark-circle" size={16} color={theme.primary} /><Text style={[fms.instructionText, { color: text }]}>{step}</Text></View>)}
    </View>
    <Text style={[fms.sectionTitle, { color: text }]}>{t('facial.users')}</Text>
    <View style={fms.filterRow}>
      {(['registered', 'pending'] as const).map(status => <TouchableOpacity key={status} onPress={() => setFilter(status)} style={[fms.filterButton, { borderColor: filter === status ? theme.primary : border, backgroundColor: filter === status ? theme.primary : cardBg }]}><Text style={{ color: filter === status ? Colors.white : text, fontWeight: '700' }}>{t(`facial.filters.${status}`)}</Text></TouchableOpacity>)}
    </View>
    <FlatList data={listedUsers} keyExtractor={item => item.id} contentContainerStyle={fms.list} ListEmptyComponent={<View style={fms.empty}><Text style={{ color: muted }}>{t('facial.empty')}</Text></View>} renderItem={({ item }) => {
      const record = recordByUserId.get(item.id);
      const status: Filter = record ? 'registered' : 'pending';
      const statusColor = status === 'registered' ? Colors.success : Colors.warning;
      return <View style={[fms.recordCard, { backgroundColor: cardBg, borderColor: border }]}><View style={fms.recordRow}><View style={[fms.avatar, { backgroundColor: theme.primary + '20' }]}><Ionicons name="person" size={20} color={theme.primary} /></View><View style={fms.userInfo}><Text numberOfLines={1} style={[fms.userName, { color: text }]}>{item.name}</Text><Text style={{ color: muted, fontSize: 12 }}>{t(`facial.roles.${item.role}`)}</Text><Text style={{ color: muted, fontSize: 12 }}>{record?.date ?? t('facial.noDate')}</Text></View><View style={[fms.statusBadge, { backgroundColor: statusColor + '20' }]}><Text style={{ color: statusColor, fontWeight: '700', fontSize: 12 }}>{t(`facial.statuses.${status}`)}</Text></View></View></View>;
    }} />
  </View>;
}

const fms = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 16, paddingTop: 16 }, title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 }, statCard: { flex: 1, minWidth: 0, borderRadius: 14, borderWidth: 1, padding: 10, alignItems: 'center' }, statValue: { fontSize: FontSize['3xl'], fontWeight: FontWeight.black }, statLabel: { fontSize: FontSize.xs, marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black, marginBottom: 10 }, instrCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 }, instruction: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }, instructionText: { flex: 1, fontSize: 14 },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 6 }, filterButton: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  list: { gap: 10, paddingBottom: 24 }, recordCard: { borderRadius: 12, borderWidth: 1, padding: 14 }, recordRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, userInfo: { flex: 1, minWidth: 0 }, userName: { fontSize: FontSize.base, fontWeight: FontWeight.bold }, statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }, empty: { alignItems: 'center', paddingVertical: 48 },
});
