// ─────────────────────────────────────────────
//  app/admin/academic/index.tsx — Programas (Admin)
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAcademic, ProgramStatusFilter } from '@/features/academic/useAcademic';
import { getProgramDisplayName } from '@/features/academic/types';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

type ViewMode = 'programs' | 'unlinked';

export default function AcademicProgramsScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const {
    programs, search, setSearch, statusFilter, setStatusFilter, deactivateProgram, deleteProgram,
    unlinkedFichas, linkFichaToProgram,
  } = useAcademic();
  const { alert, DialogUI } = useAppDialog();
  const { width } = useWindowDimensions();
  const isMobile = width < 480;
  const [viewMode, setViewMode] = useState<ViewMode>('programs');
  const [expandedFichaId, setExpandedFichaId] = useState<string | null>(null);

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

  return (
    <View style={[aps.safe, { backgroundColor: bg }]}>
      <View style={[aps.header, isMobile && aps.headerMobile]}>
        <Text style={[aps.title, { color: text }]}>{viewMode === 'programs' ? t('academic.programs') : t('academic.unlinkedFichas')}</Text>
        <View style={[aps.headerButtons, isMobile && aps.headerButtonsMobile]}>
          <TouchableOpacity onPress={() => router.push('/admin/academic/programs/register' as any)} style={[aps.addBtn, isMobile && aps.addBtnMobile, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={aps.addBtnText}>{t('academic.programRegister')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/admin/academic/fichas/register' as any)} style={[aps.addBtn, isMobile && aps.addBtnMobile, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
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
                <View style={aps.cardLeft}>
                  <View style={[aps.iconCircle, { backgroundColor: theme.primary + '20' }]}>
                    <Ionicons name="school-outline" size={22} color={theme.primary} />
                  </View>
                  <View>
                    <Text style={[aps.cardTitle, { color: text }]}>{getProgramDisplayName(item, t)}</Text>
                    <Text style={[aps.cardMeta, { color: muted }]}>{item.fichas.length} {t('academic.fichas').toLowerCase()} · {t(`environments.statuses.${item.status}`)}</Text>
                  </View>
                </View>
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
                    <TouchableOpacity onPress={() => handleDeleteCompletely(item.id, getProgramDisplayName(item, t))} style={[aps.actionBtn, { backgroundColor: Colors.error + '15' }]}>
                      <Ionicons name="trash" size={16} color={Colors.error} />
                    </TouchableOpacity>
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
              <View style={[aps.card, aps.unlinkedCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <TouchableOpacity onPress={() => router.push(`/admin/academic/fichas/${item.id}` as any)} style={aps.cardLeft} activeOpacity={0.7}>
                    <View style={[aps.iconCircle, { backgroundColor: Colors.warning + '20' }]}>
                      <Ionicons name="document-text-outline" size={22} color={Colors.warning} />
                    </View>
                    <View>
                      <Text style={[aps.cardTitle, { color: text }]}>Ficha {item.number}</Text>
                      <Text style={[aps.cardMeta, { color: muted }]}>{t(`academic.jornadas.${item.jornada}`)} · {item.learners.length} {t('academic.learners').toLowerCase()} · {item.code}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setExpandedFichaId(isExpanded ? null : item.id)}
                    style={[aps.actionBtn, { backgroundColor: theme.primary + '15' }]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="link-outline" size={16} color={theme.primary} />
                  </TouchableOpacity>
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

      {DialogUI}
    </View>
  );
}

const aps = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerMobile: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  headerButtons: { flexDirection: 'row', gap: 8 },
  headerButtonsMobile: { flexDirection: 'column', alignSelf: 'stretch' },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black },
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
  list: { padding: 16, gap: 10 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  unlinkedCard: { flexDirection: 'column', alignItems: 'stretch' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  cardMeta: { fontSize: FontSize.sm, marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  programPicker: { marginTop: 12, gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(101,179,97,0.15)', paddingTop: 12 },
  programOption: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1.2, paddingHorizontal: 12, paddingVertical: 10 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: FontSize.base },
});
