// ─────────────────────────────────────────────
//  app/admin/academic/index.tsx — Programas (Admin)
// ─────────────────────────────────────────────
import FichaFormModal from '@/features/academic/components/FichaFormModal';
import ProgramFormModal from '@/features/academic/components/ProgramFormModal';
import { getProgramDisplayName } from '@/features/academic/types';
import { ProgramStatusFilter, useAcademic } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { isRecent, wasEditedRecently } from '@/shared/utils/dates';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';

type ViewMode = 'programs' | 'unlinked' | 'orphans';

export default function AcademicProgramsScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const {
    programs, allFichas, search, setSearch, statusFilter, setStatusFilter, deactivateProgram, reactivateProgram, deleteProgram, deactivateFicha, reactivateFicha, deleteFicha,
    unlinkedFichas, linkFichaToProgram, orphanLearners, deleteOrphanLearner,
  } = useAcademic();
  const { alert, DialogUI } = useAppDialog();
  const { width } = useWindowDimensions();
  const isMobile = width < 480;
  const [viewMode, setViewMode] = useState<ViewMode>('programs');
  const [expandedFichaId, setExpandedFichaId] = useState<string | null>(null);
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [fichaModalOpen, setFichaModalOpen] = useState(false);

  // Programas activos disponibles para vincular una ficha desvinculada.
  const activePrograms = programs.filter(p => p.status === 'active');

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const filterOptions: { value: ProgramStatusFilter; label: string }[] = [
    { value: 'all', label: t('environments.filter.all') },
    { value: 'active', label: t('environments.filter.active') },
    { value: 'inactive', label: t('environments.filter.inactive') },
  ];

  // Eliminar (desactivación lógica) — solo disponible para programas Activos.
  const handleDeactivate = (id: string, name: string) => {
    alert(t('academic.programDelete'), `${name}\n\n${t('academic.programDeactivateConfirm')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('academic.programDelete'), style: 'destructive', onPress: () => {
        deactivateProgram(id);
      }},
    ]);
  };

  // Eliminar completamente — solo disponible para programas Inactivos.
  const handleDeleteCompletely = (id: string, name: string) => {
    alert(t('academic.programDeleteCompletely'), `${name}\n\n${t('academic.programDeleteCompletelyConfirm')}`, [
      { text: t('common.no'), style: 'cancel' },
      { text: t('common.yes'), style: 'destructive', onPress: () => {
        const r = deleteProgram(id);
        if (r.success) alert('✓', t('academic.programDeleteCompletelySuccess'));
        else if (r.error) alert(t('common.error'), t(r.error));
      }},
    ]);
  };

  const handleReactivate = (id: string, name: string) => {
    alert(t('academic.alreadyActive'), `${name}\n\n${t('environments.reactivateConfirm')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('environments.reactivate'), onPress: () => reactivateProgram(id) },
    ]);
  };

  const handleReactivateFicha = (id: string, number: string) => {
    alert(t('academic.alreadyActive'), `${number}\n\n${t('environments.reactivateConfirm')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('environments.reactivate'), onPress: () => reactivateFicha(id) },
    ]);
  };

  const handleDeactivateFicha = (id: string, number: string) => {
    alert(t('academic.deactivateFicha'), `${number}\n\n${t('academic.confirmDeactivateFicha')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('academic.deactivateFicha'), style: 'destructive', onPress: () => deactivateFicha(id) },
    ]);
  };

  // Eliminar completamente — solo disponible para fichas Inactivas.
  const handleDeleteFichaCompletely = (id: string, number: string) => {
    alert(t('academic.fichaDeleteCompletely'), `${number}\n\n${t('academic.fichaDeleteCompletelyConfirm')}`, [
      { text: t('common.no'), style: 'cancel' },
      { text: t('common.yes'), style: 'destructive', onPress: () => {
        const r = deleteFicha(id);
        if (r.success) alert('✓', t('academic.fichaDeleteCompletelySuccess'));
        else if (r.error) alert(t('common.error'), t(r.error));
      }},
    ]);
  };

  // Vincular una ficha desvinculada a un programa — misma lógica de
  // confirmación que se usa en el resto del módulo (Gestión de Ambientes).
  const handleLinkFicha = (fichaId: string, fichaNumber: string, programId: string, programName: string) => {
    alert(t('academic.linkToProgram'), `${t('academic.fichaCode')} ${fichaNumber} → ${programName}\n\n${t('academic.linkToProgramConfirm')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('academic.linkToProgram'), style: 'default', onPress: () => {
        const r = linkFichaToProgram(fichaId, programId);
        setExpandedFichaId(null);
        if (r.success) alert('✓', t('academic.linkToProgramSuccess'));
        else if (r.error) alert(t('common.error'), t(r.error));
      }},
    ]);
  };

  // Eliminación definitiva de un aprendiz que quedó sin ficha (ya no
  // pertenece al SENA). Se pide confirmación explícita: es irreversible.
  const handleDeleteOrphan = (learnerId: string, name: string) => {
    alert(t('academic.orphanDeleteTitle'), `${name}\n\n${t('academic.orphanDeleteConfirm')}`, [
      { text: t('common.no'), style: 'cancel' },
      { text: t('common.yes'), style: 'destructive', onPress: () => deleteOrphanLearner(learnerId) },
    ]);
  };

  const activeFichaRefs = allFichas.filter(f => f.status === 'active');

  const tabTitles: Record<ViewMode, string> = {
    programs: t('academic.programs'),
    unlinked: t('academic.unlinkedFichas'),
    orphans: t('academic.orphanLearners'),
  };
  const tabSubtitles: Record<ViewMode, string> = {
    programs: t('academic.programsListSubtitle', 'Consulta, filtra y administra los programas de formación y sus fichas asociadas.'),
    unlinked: t('academic.unlinkedListSubtitle', 'Fichas sin programa asociado. Vincúlalas a un programa activo o gestiona su ciclo de vida.'),
    orphans: t('academic.orphanLearnersSubtitle', 'Aprendices trasladados que quedaron sin ficha, a la espera de unirse a otra con un código.'),
  };

  return (
    <View style={[aps.safe, { backgroundColor: bg }]}>
      <View style={[aps.header, isMobile && aps.headerMobile]}>
        <View style={aps.headingCopy}>
          <Text style={[aps.title, { color: text }]}>{tabTitles[viewMode]}</Text>
          <Text style={[aps.subtitle, { color: muted }]}>{tabSubtitles[viewMode]}</Text>
        </View>
        <View style={[aps.headerButtons, isMobile && aps.headerButtonsMobile]}>
          <TouchableOpacity onPress={() => setProgramModalOpen(true)} style={[aps.addBtn, isMobile && aps.addBtnMobile, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={aps.addBtnText}>{t('academic.programRegister')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFichaModalOpen(true)} style={[aps.addBtn, isMobile && aps.addBtnMobile, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={aps.addBtnText}>{t('academic.fichaRegister')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={aps.tabRow}>
        <TouchableOpacity
          onPress={() => setViewMode('programs')}
          style={[aps.tabChip, { backgroundColor: viewMode === 'programs' ? theme.primary + '20' : inputBg, borderColor: viewMode === 'programs' ? theme.primary : border }]}
          activeOpacity={0.7}
        >
          <Ionicons name="school-outline" size={16} color={viewMode === 'programs' ? theme.primary : muted} />
          <Text style={[aps.tabChipText, { color: viewMode === 'programs' ? theme.primary : muted }]}>{t('academic.programs')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setViewMode('unlinked')}
          style={[aps.tabChip, { backgroundColor: viewMode === 'unlinked' ? theme.primary + '20' : inputBg, borderColor: viewMode === 'unlinked' ? theme.primary : border }]}
          activeOpacity={0.7}
        >
          <Ionicons name="link-outline" size={16} color={viewMode === 'unlinked' ? theme.primary : muted} />
          <Text style={[aps.tabChipText, { color: viewMode === 'unlinked' ? theme.primary : muted }]}>{t('academic.unlinkedFichas')} ({unlinkedFichas.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setViewMode('orphans')}
          style={[aps.tabChip, { backgroundColor: viewMode === 'orphans' ? theme.primary + '20' : inputBg, borderColor: viewMode === 'orphans' ? theme.primary : border }]}
          activeOpacity={0.7}
        >
          <Ionicons name="person-remove-outline" size={16} color={viewMode === 'orphans' ? theme.primary : muted} />
          <Text style={[aps.tabChipText, { color: viewMode === 'orphans' ? theme.primary : muted }]}>{t('academic.orphanLearners')} ({orphanLearners.length})</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'programs' && (
        <>
          <View style={[aps.searchWrap, { backgroundColor: inputBg, borderColor: border }]}>
            <Ionicons name="search-outline" size={18} color={muted} />
            <TextInput style={[aps.searchInput, { color: text }] as any} value={search} onChangeText={setSearch}
              placeholder={t('academic.searchProgram')} placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'} />
          </View>

          <View style={aps.filterRow}>
            {filterOptions.map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setStatusFilter(opt.value)}
                style={[
                  aps.filterChip,
                  {
                    backgroundColor: statusFilter === opt.value ? theme.primary + '20' : inputBg,
                    borderColor: statusFilter === opt.value ? theme.primary : border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[aps.filterChipText, { color: statusFilter === opt.value ? theme.primary : muted }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList data={programs} keyExtractor={p => p.id}
            contentContainerStyle={aps.list}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => router.push(`/admin/academic/programs/${item.id}` as any)}
                style={[aps.card, { backgroundColor: cardBg, borderColor: border }]} activeOpacity={0.7}>
                <View style={aps.cardHeader}>
                  <View style={[aps.typeBadge, { backgroundColor: theme.primary + '20' }]}>
                    <Ionicons name="school-outline" size={16} color={theme.primary} />
                    <Text style={[aps.typeText, { color: theme.primary }]}>{item.fichas.length} {t('academic.fichas').toLowerCase()}</Text>
                  </View>
                  <View style={aps.statusWrap}>
                    <View style={[aps.statusDot, { backgroundColor: item.status === 'active' ? Colors.success : Colors.error }]} />
                    <Text style={[aps.statusLabel, { color: item.status === 'active' ? Colors.success : Colors.error }]}>{t(`environments.statuses.${item.status}`)}</Text>
                  </View>
                </View>
                {(isRecent(item.createdAt) || wasEditedRecently(item.createdAt, item.updatedAt)) && (
                  <View style={aps.badgeRow}>
                    {isRecent(item.createdAt) && <View style={[aps.infoBadge, { backgroundColor: theme.primary + '18' }]}>
                      <Ionicons name="sparkles-outline" size={12} color={theme.primary} />
                      <Text style={[aps.infoBadgeText, { color: theme.primary }]}>{t('environments.recentBadge')}</Text>
                    </View>}
                    {wasEditedRecently(item.createdAt, item.updatedAt) && <View style={[aps.infoBadge, { backgroundColor: '#8A6D3B18' }]}>
                      <Ionicons name="create-outline" size={12} color="#B8860B" />
                      <Text style={[aps.infoBadgeText, { color: '#B8860B' }]}>{t('environments.editedRecentlyBadge')}</Text>
                    </View>}
                  </View>
                )}
                <View style={aps.titleRow}>
                  <Text style={[aps.cardTitle, { color: text }]}>{getProgramDisplayName(item, t)}</Text>
                </View>
                <Text style={[aps.cardSub, { color: muted }]}>{t('environments.detail.createdAt')}: {new Date(item.createdAt).toLocaleString()}</Text>
                <Text style={[aps.cardDates, { color: muted }]}>{t('environments.detail.updatedAt')}: {new Date(item.updatedAt).toLocaleString()}</Text>
                <View style={aps.cardActions}>
                  <TouchableOpacity onPress={() => router.push(`/admin/academic/programs/${item.id}` as any)} style={[aps.actionBtn, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="eye-outline" size={16} color={theme.primary} />
                  </TouchableOpacity>
                  {item.status === 'active' && (
                    <TouchableOpacity onPress={() => handleDeactivate(item.id, getProgramDisplayName(item, t))} style={[aps.actionBtn, { backgroundColor: Colors.error + '15' }]}>
                      <Ionicons name="trash-outline" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  )}
                  {item.status === 'inactive' && (
                    <><TouchableOpacity onPress={() => handleReactivate(item.id, getProgramDisplayName(item, t))} style={[aps.actionBtn, { backgroundColor: theme.primary + '15' }]}><Ionicons name="refresh-outline" size={16} color={theme.primary} /></TouchableOpacity><TouchableOpacity onPress={() => handleDeleteCompletely(item.id, getProgramDisplayName(item, t))} style={[aps.actionBtn, { backgroundColor: Colors.error + '15' }]}><Ionicons name="trash" size={16} color={Colors.error} /></TouchableOpacity></>
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<View style={aps.empty}><Ionicons name="school-outline" size={48} color={muted} /><Text style={[aps.emptyText, { color: muted }]}>{t('academic.programEmpty')}</Text></View>}
          />
        </>
      )}

      {viewMode === 'unlinked' && (
        <FlatList data={unlinkedFichas} keyExtractor={f => f.id}
          contentContainerStyle={aps.list}
          renderItem={({ item }) => {
            const isExpanded = expandedFichaId === item.id;
            return (
              <View style={[aps.card, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={aps.cardHeader}>
                  <View style={[aps.typeBadge, { backgroundColor: Colors.warning + '20' }]}>
                    <Ionicons name="document-text-outline" size={16} color={Colors.warning} />
                    <Text style={[aps.typeText, { color: Colors.warning }]}>{item.code}</Text>
                  </View>
                  <View style={aps.statusWrap}>
                    <View style={[aps.statusDot, { backgroundColor: item.status === 'active' ? Colors.success : Colors.error }]} />
                    <Text style={[aps.statusLabel, { color: item.status === 'active' ? Colors.success : Colors.error }]}>{t(`environments.statuses.${item.status}`)}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => router.push(`/admin/academic/fichas/${item.id}` as any)} activeOpacity={0.7}>
                  <View style={aps.titleRow}>
                    <Text style={[aps.cardTitle, { color: text }]}>Ficha {item.number}</Text>
                  </View>
                  <Text style={[aps.cardSub, { color: muted }]}>{t(`academic.jornadas.${item.jornada}`)} · {item.learners.length} {t('academic.learners').toLowerCase()}</Text>
                  <Text style={[aps.cardDates, { color: muted }]}>{t('environments.detail.createdAt')}: {new Date(item.createdAt).toLocaleString()} · {t('environments.detail.updatedAt')}: {new Date(item.updatedAt).toLocaleString()}</Text>
                </TouchableOpacity>
                <View style={aps.cardActions}>
                  <TouchableOpacity
                    onPress={() => setExpandedFichaId(isExpanded ? null : item.id)}
                    style={[aps.actionBtn, { backgroundColor: theme.primary + '15' }]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="link-outline" size={16} color={theme.primary} />
                  </TouchableOpacity>
                  {item.status === 'active' && (
                    <TouchableOpacity onPress={() => handleDeactivateFicha(item.id, item.number)} style={[aps.actionBtn, { backgroundColor: Colors.error + '15' }]}>
                      <Ionicons name="pause-outline" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  )}
                  {item.status === 'inactive' && (
                    <>
                      <TouchableOpacity onPress={() => handleReactivateFicha(item.id, item.number)} style={[aps.actionBtn, { backgroundColor: theme.primary + '15' }]}>
                        <Ionicons name="refresh-outline" size={16} color={theme.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteFichaCompletely(item.id, item.number)} style={[aps.actionBtn, { backgroundColor: Colors.error + '15' }]}>
                        <Ionicons name="trash" size={16} color={Colors.error} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                {isExpanded && (
                  <View style={aps.programPicker}>
                    {activePrograms.length === 0 ? (
                      <Text style={{ color: muted, fontSize: FontSize.sm, paddingVertical: 8 }}>{t('academic.noActivePrograms')}</Text>
                    ) : (
                      activePrograms.map(p => (
                        <TouchableOpacity
                          key={p.id}
                          onPress={() => handleLinkFicha(item.id, item.number, p.id, getProgramDisplayName(p, t))}
                          style={[aps.programOption, { backgroundColor: inputBg, borderColor: border }]}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="school-outline" size={16} color={theme.primary} />
                          <Text style={{ color: text, fontWeight: '600', fontSize: FontSize.sm, flex: 1 }}>{getProgramDisplayName(p, t)}</Text>
                          <Ionicons name="chevron-forward" size={16} color={muted} />
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={<View style={aps.empty}><Ionicons name="link-outline" size={48} color={muted} /><Text style={[aps.emptyText, { color: muted }]}>{t('academic.unlinkedFichasEmpty')}</Text></View>}
        />
      )}

      {viewMode === 'orphans' && (
        <FlatList
          data={orphanLearners}
          keyExtractor={l => l.id}
          contentContainerStyle={aps.list}
          ListHeaderComponent={
            activeFichaRefs.length > 0 ? (
              <View style={[aps.hintBox, { backgroundColor: inputBg, borderColor: border }]}>
                <Ionicons name="information-circle-outline" size={16} color={muted} />
                <Text style={{ color: muted, fontSize: FontSize.sm, flex: 1 }}>
                  {t('academic.orphanHint', 'Comparte con el aprendiz el código de la ficha a la que debe unirse:')} {activeFichaRefs.map(f => f.code).join(', ')}
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={[aps.card, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={aps.cardHeader}>
                <View style={[aps.typeBadge, { backgroundColor: Colors.warning + '20' }]}>
                  <Ionicons name="person-outline" size={16} color={Colors.warning} />
                  <Text style={[aps.typeText, { color: Colors.warning }]}>Doc: {item.document}</Text>
                </View>
              </View>
              <View style={aps.titleRow}>
                <Text style={[aps.cardTitle, { color: text }]}>{item.name} {item.lastname}</Text>
              </View>
              {item.fromFichaNumber ? <Text style={[aps.cardSub, { color: muted }]}>{t('academic.orphanFrom')}: Ficha {item.fromFichaNumber}</Text> : null}
              <Text style={[aps.cardDates, { color: muted }]}>{t('academic.orphanMovedAt')}: {new Date(item.movedAt).toLocaleString()}</Text>
              <View style={aps.cardActions}>
                <TouchableOpacity onPress={() => handleDeleteOrphan(item.id, `${item.name} ${item.lastname}`)} style={[aps.actionBtn, { backgroundColor: Colors.error + '15' }]}>
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<View style={aps.empty}><Ionicons name="person-remove-outline" size={48} color={muted} /><Text style={[aps.emptyText, { color: muted }]}>{t('academic.orphanEmpty')}</Text></View>}
        />
      )}

      {DialogUI}
      <ProgramFormModal visible={programModalOpen} onClose={() => setProgramModalOpen(false)} />
      <FichaFormModal visible={fichaModalOpen} onClose={() => setFichaModalOpen(false)} />
    </View>
  );
}

const aps = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerMobile: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  headerButtons: { flexDirection: 'row', gap: 8 },
  headerButtonsMobile: { flexDirection: 'column', alignSelf: 'stretch' },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 6 },
  headingCopy: { flex: 1 },
  subtitle: { fontSize: FontSize.sm, lineHeight: 19 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  addBtnMobile: { justifyContent: 'center', paddingVertical: 13, alignSelf: 'stretch' },
  addBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginVertical: 10, height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: FontSize.md, outlineStyle: 'none' } as any,
  tabRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginTop: 4, marginBottom: 8, flexWrap: 'wrap' },
  tabChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.2, flexShrink: 1 },
  tabChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, flexShrink: 1 },
  filterRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.2 },
  filterChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  infoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  infoBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  unlinkedCard: { flexDirection: 'column', alignItems: 'stretch' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: 2 },
  cardSub: { fontSize: FontSize.sm, marginBottom: 4 },
  cardMeta: { fontSize: FontSize.sm, marginTop: 2 },
  cardDates: { fontSize: FontSize.xs, marginBottom: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  recentBadge: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  cardActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  actionBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  programPicker: { marginTop: 12, gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(101,179,97,0.15)', paddingTop: 12 },
  hintBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 12 },
  programOption: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1.2, paddingHorizontal: 12, paddingVertical: 10 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: FontSize.base },
});