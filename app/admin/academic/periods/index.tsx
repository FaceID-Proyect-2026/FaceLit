// ─────────────────────────────────────────────
//  app/admin/academic/periods/index.tsx
//  Listado de Períodos académicos — usados por Gestión de Horarios
//  para acotar la disponibilidad de instructores/ambientes por período
//  (Prompt maestro, sección 7 y 18).
// ─────────────────────────────────────────────
import PeriodFormModal from '@/features/academic/components/PeriodFormModal';
import { formatDateDisplay } from '@/shared/components/ui/DateField';
import { useAcademicPeriods } from '@/features/academic/periods/useAcademicPeriods';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AcademicPeriodsListScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { periods, deactivatePeriod, reactivatePeriod } = useAcademicPeriods();
  const { alert, DialogUI } = useAppDialog();
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | undefined>(undefined);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';

  const openCreate = () => { setEditId(undefined); setFormOpen(true); };
  const openEdit = (id: string) => { setEditId(id); setFormOpen(true); };

  const handleDeactivate = (id: string, name: string) => {
    alert(t('academic.periods.deactivate'), `${name}\n\n${t('academic.periods.confirmDeactivate')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('academic.periods.deactivate'), style: 'destructive', onPress: () => deactivatePeriod(id) },
    ]);
  };

  const handleReactivate = (id: string, name: string) => {
    alert(t('academic.periods.reactivate'), name, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('academic.periods.reactivate'), onPress: () => reactivatePeriod(id) },
    ]);
  };

  return (
    <View style={[pls.safe, { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }]}>
      <FlatList
        data={periods}
        keyExtractor={item => item.id}
        contentContainerStyle={pls.list}
        ListHeaderComponent={
          <View>
            <TouchableOpacity onPress={() => router.back()} style={pls.backBtn}>
              <Ionicons name="arrow-back" size={20} color={text} />
              <Text style={{ color: text, fontWeight: '700' }}>{t('common.back')}</Text>
            </TouchableOpacity>
            <View style={pls.header}>
              <View style={{ flex: 1 }}>
                <Text style={[pls.title, { color: text }]}>{t('academic.periods.title')}</Text>
                <Text style={[pls.subtitle, { color: muted }]}>{t('academic.periods.listSubtitle')}</Text>
              </View>
              <TouchableOpacity onPress={openCreate} style={[pls.addBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
                <Ionicons name="add" size={20} color={Colors.white} />
                <Text style={pls.addBtnText}>{t('academic.periods.register')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openEdit(item.id)} style={[pls.card, { backgroundColor: cardBg, borderColor: border }]} activeOpacity={0.7}>
            <View style={pls.cardHeader}>
              <Text style={[pls.name, { color: text }]}>{item.name}</Text>
              <View style={pls.statusWrap}>
                <View style={[pls.statusDot, { backgroundColor: item.status === 'active' ? Colors.success : Colors.error }]} />
                <Text style={{ color: item.status === 'active' ? Colors.success : Colors.error, fontSize: 12, fontWeight: '700' }}>
                  {t(`environments.statuses.${item.status}`)}
                </Text>
              </View>
            </View>
            <Text style={[pls.meta, { color: muted }]}>
              {formatDateDisplay(item.startDate)} — {formatDateDisplay(item.endDate)}
            </Text>
            <View style={pls.cardActions}>
              {item.status === 'active' ? (
                <TouchableOpacity onPress={() => handleDeactivate(item.id, item.name)} style={[pls.actionBtn, { backgroundColor: Colors.error + '15' }]}>
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => handleReactivate(item.id, item.name)} style={[pls.actionBtn, { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name="refresh-outline" size={16} color={theme.primary} />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={pls.empty}>
            <Ionicons name="calendar-clear-outline" size={48} color={muted} />
            <Text style={{ color: muted }}>{t('academic.periods.emptyState')}</Text>
          </View>
        }
      />
      {DialogUI}
      <PeriodFormModal visible={formOpen} editId={editId} onClose={() => setFormOpen(false)} />
    </View>
  );
}

const pls = StyleSheet.create({
  safe: { flex: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 4 },
  subtitle: { fontSize: FontSize.sm },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: Colors.white, fontWeight: FontWeight.bold },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  name: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  meta: { fontSize: FontSize.sm },
  cardActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 8 },
  actionBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
});
