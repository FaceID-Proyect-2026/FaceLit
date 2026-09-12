import ProgramFormModal from '@/features/academic/components/ProgramFormModal';
import { getProgramDisplayName } from '@/features/academic/types';
import { useAcademic } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProgramDetailScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProgram, allFichas, allInstructors, unlinkFichaFromProgram } = useAcademic();
  const { alert, DialogUI } = useAppDialog();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [fichaSearch, setFichaSearch]     = useState('');

  const program = getProgram(id ?? '');
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  if (!program) return <View style={[pds.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: muted }}>Programa no encontrado</Text></View>;

  const programFichas = allFichas.filter(f => program.fichas.includes(f.id));
  const programInstructors = allInstructors.filter(i => i.programId === program.id);

  // Filtrar fichas por número de ficha o nombre del instructor responsable
  const filteredFichas = fichaSearch.trim()
    ? programFichas.filter(f => {
        const q = fichaSearch.trim().toLowerCase();
        if (f.number.includes(q)) return true;
        // ¿algún instructor de esta ficha coincide con la búsqueda?
        return allInstructors.some(inst =>
          inst.fichaIds.includes(f.id) &&
          (`${inst.name} ${inst.lastname}`).toLowerCase().includes(q),
        );
      })
    : programFichas;

  return (
    <View style={[pds.safe, { backgroundColor: bg }]}>
      <SectionList
        sections={[
          { key: 'header', data: [] as any[] },
          { key: 'instructors', title: `Instructores (${programInstructors.length})`, data: programInstructors },
          { key: 'fichas', title: `${t('academic.fichas')} (${filteredFichas.length}${fichaSearch ? ` de ${programFichas.length}` : ''})`, data: filteredFichas },
        ]}
        keyExtractor={(item, i) => item?.id ?? String(i)}
        contentContainerStyle={pds.scroll}
        renderSectionHeader={({ section }) => {
          if (section.key === 'header') return null;
          return (
            <View>
              <Text style={[pds.sectionTitle, { color: text }]}>{section.title}</Text>
              {section.key === 'fichas' && (
                <View style={[pds.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F2F2F2', borderColor: border }]}>
                  <Ionicons name="search-outline" size={15} color={muted} />
                  <TextInput
                    style={[pds.searchInput, { color: text }] as any}
                    value={fichaSearch}
                    onChangeText={setFichaSearch}
                    placeholder="Buscar por número de ficha o nombre de instructor…"
                    placeholderTextColor={muted}
                    autoCorrect={false}
                  />
                  {fichaSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setFichaSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle" size={15} color={muted} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        }}
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
                <Text style={[pds.infoLabel, { color: muted }]}>Instructores</Text>
                <Text style={[pds.infoValue, { color: text }]}>{programInstructors.length}</Text>
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
          </View>
        }
        renderItem={({ item, section }) => {
          // ── Instructor card ──
          if (section.key === 'instructors') {
            return (
              <View style={[pds.card, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={[pds.iconCircle, { backgroundColor: theme.primary + '20' }]}>
                  <Ionicons name="person-outline" size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[pds.cardTitle, { color: text }]}>{item.name} {item.lastname}</Text>
                  <Text style={[pds.cardMeta, { color: muted }]}>
                    {item.instructorType === 'especifico' ? 'Específico' : 'Transversal'} · Doc: {item.document}
                  </Text>
                  <Text style={[pds.cardMeta, { color: muted }]}>{item.email}</Text>
                  {/* Contraseña inicial — el coordinador la ve para enviársela al instructor */}
                  {item.initialPassword ? (
                    <View style={[pds.pwdBadge, { backgroundColor: Colors.warning + '18', borderColor: Colors.warning + '55' }]}>
                      <Ionicons name="key-outline" size={11} color={Colors.warning} />
                      <Text style={[pds.pwdLabel, { color: Colors.warning }]}>Contraseña inicial: </Text>
                      <Text style={[pds.pwdValue, { color: Colors.warning }]} selectable>{item.initialPassword}</Text>
                    </View>
                  ) : (
                    <View style={[pds.pwdBadge, { backgroundColor: Colors.success + '14', borderColor: Colors.success + '44' }]}>
                      <Ionicons name="checkmark-circle-outline" size={11} color={Colors.success} />
                      <Text style={[pds.pwdLabel, { color: Colors.success }]}>Contraseña propia activa</Text>
                    </View>
                  )}
                </View>
                <View style={[pds.statusBadge, { backgroundColor: item.status === 'active' ? Colors.success + '18' : Colors.error + '18' }]}>
                  <View style={[pds.statusDot, { backgroundColor: item.status === 'active' ? Colors.success : Colors.error }]} />
                  <Text style={{ color: item.status === 'active' ? Colors.success : Colors.error, fontWeight: '700', fontSize: 11 }}>{t(`environments.statuses.${item.status}`)}</Text>
                </View>
              </View>
            );
          }
          // ── Ficha card ──
          return (
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
          );
        }}
        ListEmptyComponent={null}
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
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, marginBottom: 10, marginTop: 4 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  iconCircle: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  cardMeta: { fontSize: FontSize.sm, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  // ── Contraseña inicial ──
  pwdBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 7, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 4, marginTop: 6, flexWrap: 'wrap' },
  pwdLabel:  { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  pwdValue:  { fontSize: FontSize.xs, fontWeight: FontWeight.black, letterSpacing: 0.5 },
  // ── Buscador de fichas ──
  searchBar:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 11, borderWidth: 1, paddingHorizontal: 11, height: 40, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: FontSize.sm, outlineStyle: 'none' } as any,
});
