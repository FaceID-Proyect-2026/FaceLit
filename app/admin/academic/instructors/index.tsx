// ─────────────────────────────────────────────
//  app/admin/academic/instructors/index.tsx
//  Listado de Instructores con carga masiva por CSV (sección 23) y
//  registro manual, filtro por tipo (ESPECÍFICO/TRANSVERSAL) y búsqueda.
// ─────────────────────────────────────────────
import CsvUploadZone from '@/features/academic/components/CsvUploadZone';
import InstructorFormModal from '@/features/academic/components/InstructorFormModal';
import { useAreas } from '@/features/academic/areas/useAreas';
import { parseInstructorsCsv } from '@/features/academic/instructors/csvImportInstructors';
import { useInstructors } from '@/features/academic/instructors/useInstructors';
import { getInstructorFullName } from '@/features/academic/instructors/types';
import { useTransversals } from '@/features/academic/transversals/useTransversals';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';

export default function InstructorsListScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const {
    instructors, search, setSearch, typeFilter, setTypeFilter,
    addInstructor, deactivateInstructor, reactivateInstructor,
  } = useInstructors();
  const { activeAreas } = useAreas();
  const { activeTransversals } = useTransversals();
  const { alert, DialogUI } = useAppDialog();
  const { width } = useWindowDimensions();
  const isMobile = width < 480;
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | undefined>(undefined);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';

  const filterOptions: { value: 'all' | 'ESPECIFICO' | 'TRANSVERSAL'; label: string }[] = [
    { value: 'all', label: t('academic.instructors.filter.all') },
    { value: 'ESPECIFICO', label: t('academic.instructors.types.ESPECIFICO') },
    { value: 'TRANSVERSAL', label: t('academic.instructors.types.TRANSVERSAL') },
  ];

  const openCreate = () => { setEditId(undefined); setFormOpen(true); };
  const openEdit = (id: string) => { setEditId(id); setFormOpen(true); };

  const handleDeactivate = (id: string, name: string) => {
    alert(t('academic.instructors.deactivate'), `${name}\n\n${t('academic.instructors.confirmDeactivate')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('academic.instructors.deactivate'), style: 'destructive', onPress: () => deactivateInstructor(id) },
    ]);
  };

  const handleReactivate = (id: string, name: string) => {
    alert(t('academic.instructors.reactivate'), `${name}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('academic.instructors.reactivate'), onPress: () => reactivateInstructor(id) },
    ]);
  };

  const handleCsvFile = (csvText: string) => {
    const result = parseInstructorsCsv(csvText, activeAreas, activeTransversals);
    if (result.structureError) { alert(t('common.error'), t(result.structureError)); return; }

    let added = 0;
    let conflict = 0;
    result.rows.forEach(row => {
      const outcome = addInstructor({
        name: row.name,
        lastname: row.lastname,
        document: row.document,
        type: row.type,
        areaId: row.type === 'ESPECIFICO' ? activeAreas.find(a => a.name.toLowerCase() === (row.areaName ?? '').toLowerCase())?.id : undefined,
        transversalIds: row.type === 'TRANSVERSAL'
          ? row.transversalNames.map(n => activeTransversals.find(tr => tr.name.toLowerCase() === n.toLowerCase())?.id).filter((v): v is string => !!v)
          : undefined,
      });
      if (outcome.success) added += 1; else conflict += 1;
    });

    const parts = [
      `${t('academic.instructors.csvAdded')}: ${added}`,
      `${t('academic.instructors.csvConflict')}: ${conflict}`,
    ];
    if (result.duplicateInFile > 0) parts.push(`${t('academic.instructors.csvDuplicateInFile')}: ${result.duplicateInFile}`);
    if (result.rowErrors.length > 0) parts.push(`${t('academic.instructors.csvRowErrors')}: ${result.rowErrors.length}`);
    alert(t('academic.instructors.csvImportTitle'), parts.join('\n'), [{ text: 'OK' }]);
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity onPress={() => openEdit(item.id)} style={[ils.card, { backgroundColor: cardBg, borderColor: border }]} activeOpacity={0.7}>
      <View style={ils.cardHeader}>
        <View style={[ils.typeBadge, { backgroundColor: theme.primary + '20' }]}>
          <Ionicons name={item.type === 'ESPECIFICO' ? 'person-outline' : 'people-outline'} size={14} color={theme.primary} />
          <Text style={[ils.typeText, { color: theme.primary }]}>{t(`academic.instructors.types.${item.type}`)}</Text>
        </View>
        <View style={ils.statusWrap}>
          <View style={[ils.statusDot, { backgroundColor: item.status === 'active' ? Colors.success : Colors.error }]} />
          <Text style={{ color: item.status === 'active' ? Colors.success : Colors.error, fontSize: 12, fontWeight: '700' }}>
            {t(`environments.statuses.${item.status}`)}
          </Text>
        </View>
      </View>
      <Text style={[ils.name, { color: text }]}>{getInstructorFullName(item)}</Text>
      <Text style={[ils.meta, { color: muted }]}>
        Doc: {item.document}
        {item.type === 'ESPECIFICO' && item.areaId ? ` · ${t('academic.fields.area')}: ${activeAreas.find(a => a.id === item.areaId)?.name ?? ''}` : ''}
        {item.type === 'TRANSVERSAL' ? ` · ${item.transversalIds.map((tid: string) => activeTransversals.find(tr => tr.id === tid)?.name).filter(Boolean).join(', ')}` : ''}
      </Text>
      <View style={ils.cardActions}>
        {item.status === 'active' ? (
          <TouchableOpacity onPress={() => handleDeactivate(item.id, getInstructorFullName(item))} style={[ils.actionBtn, { backgroundColor: Colors.error + '15' }]}>
            <Ionicons name="trash-outline" size={16} color={Colors.error} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => handleReactivate(item.id, getInstructorFullName(item))} style={[ils.actionBtn, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="refresh-outline" size={16} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[ils.safe, { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }]}>
      <FlatList
        data={instructors}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={ils.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <TouchableOpacity onPress={() => router.back()} style={ils.backBtn}>
              <Ionicons name="arrow-back" size={20} color={text} />
              <Text style={{ color: text, fontWeight: '700' }}>{t('common.back')}</Text>
            </TouchableOpacity>

            <View style={[ils.header, isMobile && ils.headerMobile]}>
              <View style={{ flex: 1 }}>
                <Text style={[ils.title, { color: text }]}>{t('academic.instructors.title')}</Text>
                <Text style={[ils.subtitle, { color: muted }]}>{t('academic.instructors.listSubtitle')}</Text>
              </View>
              <TouchableOpacity onPress={openCreate} style={[ils.addBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
                <Ionicons name="add" size={20} color={Colors.white} />
                <Text style={ils.addBtnText}>{t('academic.instructors.register')}</Text>
              </TouchableOpacity>
            </View>

            <CsvUploadZone isDark={isDark} disabled={false} onFileRead={handleCsvFile} />

            <View style={[ils.searchWrap, { backgroundColor: inputBg, borderColor: border }]}>
              <Ionicons name="search-outline" size={18} color={muted} />
              <TextInput
                style={{ flex: 1, color: text, fontSize: FontSize.md }}
                value={search} onChangeText={setSearch}
                placeholder={t('academic.instructors.search')} placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
              />
            </View>

            <View style={ils.filterRow}>
              {filterOptions.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setTypeFilter(opt.value)}
                  style={[ils.filterChip, { backgroundColor: typeFilter === opt.value ? theme.primary + '20' : inputBg, borderColor: typeFilter === opt.value ? theme.primary : border }]}
                >
                  <Text style={{ color: typeFilter === opt.value ? theme.primary : muted, fontWeight: '700', fontSize: 13 }}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={ils.empty}>
            <Ionicons name="people-outline" size={48} color={muted} />
            <Text style={{ color: muted }}>{t('academic.instructors.emptyState')}</Text>
          </View>
        }
      />
      {DialogUI}
      <InstructorFormModal visible={formOpen} editId={editId} onClose={() => setFormOpen(false)} />
    </View>
  );
}

const ils = StyleSheet.create({
  safe: { flex: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  headerMobile: { flexDirection: 'column', alignItems: 'stretch' },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 4 },
  subtitle: { fontSize: FontSize.sm },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: Colors.white, fontWeight: FontWeight.bold },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 10, height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 16, marginTop: 10, marginBottom: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.2 },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  name: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: 2 },
  meta: { fontSize: FontSize.sm },
  cardActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 8 },
  actionBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
});
