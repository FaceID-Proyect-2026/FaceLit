import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAcademic } from '@/features/academic/useAcademic';
import { getProgramDisplayName } from '@/features/academic/types';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import ProgramFormModal from '@/features/academic/components/ProgramFormModal';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function ProgramDetailScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProgram, allFichas, unlinkFichaFromProgram } = useAcademic();
  const { alert, DialogUI } = useAppDialog();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const program = getProgram(id ?? '');
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  if (!program) return <View style={[pds.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: muted }}>Programa no encontrado</Text></View>;

  const programFichas = allFichas.filter(f => program.fichas.includes(f.id));

  return (
    <View style={[pds.safe, { backgroundColor: bg }]}>
      <FlatList
        data={programFichas}
        keyExtractor={f => f.id}
        contentContainerStyle={pds.scroll}
        ListHeaderComponent={
          <View>
            <TouchableOpacity onPress={() => router.back()} style={pds.backBtn}><Ionicons name="arrow-back" size={20} color={text} /><Text style={[pds.backText, { color: text }]}>{t('common.back')}</Text></TouchableOpacity>
            <View style={[pds.headerCard, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={pds.headerTop}>
                <View style={[pds.iconCircleLg, { backgroundColor: theme.primary + '20' }]}>
                  <Ionicons name="school" size={26} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[pds.title, { color: text }]}>{getProgramDisplayName(program, t)}</Text>
                  <Text style={[pds.subtitle, { color: muted }]}>{t('academic.programDetailSubtitle')}</Text>
                </View>
                <View style={[pds.statusBadge, { backgroundColor: program.status === 'active' ? Colors.success + '20' : Colors.error + '20' }]}>
                  <View style={[pds.statusDot, { backgroundColor: program.status === 'active' ? Colors.success : Colors.error }]} />
                  <Text style={{ color: program.status === 'active' ? Colors.success : Colors.error, fontWeight: '700', fontSize: 13 }}>{t(`environments.statuses.${program.status}`)}</Text>
                </View>
              </View>

              <View style={[pds.infoRow, { borderBottomColor: border }]}>
                <Text style={[pds.infoLabel, { color: muted }]}>{t('academic.fichas')}</Text>
                <Text style={[pds.infoValue, { color: text }]}>{programFichas.length}</Text>
              </View>
              <View style={[pds.infoRow, { borderBottomColor: border }]}>
                <Text style={[pds.infoLabel, { color: muted }]}>{t('environments.detail.createdAt')}</Text>
                <Text style={[pds.infoValue, { color: text }]}>{new Date(program.createdAt).toLocaleString()}</Text>
              </View>
              <View style={[pds.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={[pds.infoLabel, { color: muted }]}>{t('environments.detail.updatedAt')}</Text>
                <Text style={[pds.infoValue, { color: text }]}>{new Date(program.updatedAt).toLocaleString()}</Text>
              </View>

              <TouchableOpacity onPress={() => setEditModalOpen(true)} style={[pds.editBtn, { borderColor: theme.primary }]} activeOpacity={0.7}>
                <Ionicons name="create-outline" size={16} color={theme.primary} /><Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>{t('academic.programEdit')}</Text>
              </TouchableOpacity>
            </View>

            <Text style={[pds.sectionTitle, { color: text }]}>{t('academic.fichas')} ({programFichas.length})</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/admin/academic/fichas/${item.id}` as any)}
            style={[pds.card, { backgroundColor: cardBg, borderColor: border }]} activeOpacity={0.7}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={[pds.iconCircle, { backgroundColor: theme.primary + '20' }]}><Ionicons name="document-text-outline" size={20} color={theme.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[pds.cardTitle, { color: text }]}>Ficha {item.number}</Text>
                <Text style={[pds.cardMeta, { color: muted }]}>{t(`academic.jornadas.${item.jornada}`)} · {item.learners.length} aprendices · Código: {item.code}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => {
              if (item.learners.length > 0) { alert(t('common.error'), t('academic.fichaHasLearnersUnlink')); return; }
              alert(t('academic.unlinkConfirm')??'', '', [{ text: t('common.cancel'), style: 'cancel' }, { text: t('academic.unlinkFromProgram'), style: 'destructive', onPress: () => {
                const result = unlinkFichaFromProgram(item.id, program.id);
                if (!result.success && result.error) alert(t('common.error'), t(result.error));
              } }]);
            }}
              style={{ padding: 6 }}><Ionicons name="link-outline" size={18} color={Colors.warning} /></TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={pds.empty}><Text style={{ color: muted }}>{t('academic.fichaEmpty')}</Text></View>}
      />
      {DialogUI}
      <ProgramFormModal visible={editModalOpen} editId={program.id} onClose={() => setEditModalOpen(false)} />
    </View>
  );
}

const pds = StyleSheet.create({
  safe: { flex: 1 }, scroll: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  headerCard: { borderRadius: 16, borderWidth: 1, padding: 18, marginBottom: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
  iconCircleLg: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.black, marginBottom: 4, flexShrink: 1, flexWrap: 'wrap' },
  subtitle: { fontSize: FontSize.sm, lineHeight: 18 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1 },
  infoLabel: { fontSize: FontSize.sm },
  infoValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, marginTop: 16 },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, marginBottom: 10 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconCircle: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  cardMeta: { fontSize: FontSize.sm, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 40 },
});
