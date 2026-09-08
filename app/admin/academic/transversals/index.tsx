// ─────────────────────────────────────────────
//  app/admin/academic/transversals/index.tsx
//  Listado de Transversales — cada una puede estar asociada a varios
//  programas a la vez (Prompt maestro, sección 4).
// ─────────────────────────────────────────────
import TransversalFormModal from '@/features/academic/components/TransversalFormModal';
import { useTransversals } from '@/features/academic/transversals/useTransversals';
import { useAcademic } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TransversalsListScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { transversals, deactivateTransversal, reactivateTransversal } = useTransversals();
  const { getProgram } = useAcademic();
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
    alert(t('academic.transversals.deactivate'), `${name}\n\n${t('academic.transversals.confirmDeactivate')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('academic.transversals.deactivate'), style: 'destructive', onPress: () => deactivateTransversal(id) },
    ]);
  };

  const handleReactivate = (id: string, name: string) => {
    alert(t('academic.transversals.reactivate'), name, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('academic.transversals.reactivate'), onPress: () => reactivateTransversal(id) },
    ]);
  };

  return (
    <View style={[tls.safe, { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }]}>
      <FlatList
        data={transversals}
        keyExtractor={item => item.id}
        contentContainerStyle={tls.list}
        ListHeaderComponent={
          <View>
            <TouchableOpacity onPress={() => router.back()} style={tls.backBtn}>
              <Ionicons name="arrow-back" size={20} color={text} />
              <Text style={{ color: text, fontWeight: '700' }}>{t('common.back')}</Text>
            </TouchableOpacity>
            <View style={tls.header}>
              <View style={{ flex: 1 }}>
                <Text style={[tls.title, { color: text }]}>{t('academic.transversals.title')}</Text>
                <Text style={[tls.subtitle, { color: muted }]}>{t('academic.transversals.listSubtitle')}</Text>
              </View>
              <TouchableOpacity onPress={openCreate} style={[tls.addBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
                <Ionicons name="add" size={20} color={Colors.white} />
                <Text style={tls.addBtnText}>{t('academic.transversals.register')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openEdit(item.id)} style={[tls.card, { backgroundColor: cardBg, borderColor: border }]} activeOpacity={0.7}>
            <View style={tls.cardHeader}>
              <Text style={[tls.name, { color: text }]}>{item.name}</Text>
              <View style={tls.statusWrap}>
                <View style={[tls.statusDot, { backgroundColor: item.status === 'active' ? Colors.success : Colors.error }]} />
                <Text style={{ color: item.status === 'active' ? Colors.success : Colors.error, fontSize: 12, fontWeight: '700' }}>
                  {t(`environments.statuses.${item.status}`)}
                </Text>
              </View>
            </View>
            <Text style={[tls.meta, { color: muted }]}>
              {t('academic.transversals.fields.programs')}: {item.programIds.length === 0
                ? t('academic.transversals.noPrograms')
                : item.programIds.map((pid: string) => getProgram(pid)?.name).filter(Boolean).join(', ')}
            </Text>
            <View style={tls.cardActions}>
              {item.status === 'active' ? (
                <TouchableOpacity onPress={() => handleDeactivate(item.id, item.name)} style={[tls.actionBtn, { backgroundColor: Colors.error + '15' }]}>
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => handleReactivate(item.id, item.name)} style={[tls.actionBtn, { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name="refresh-outline" size={16} color={theme.primary} />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={tls.empty}>
            <Ionicons name="git-network-outline" size={48} color={muted} />
            <Text style={{ color: muted }}>{t('academic.transversals.emptyState')}</Text>
          </View>
        }
      />
      {DialogUI}
      <TransversalFormModal visible={formOpen} editId={editId} onClose={() => setFormOpen(false)} />
    </View>
  );
}

const tls = StyleSheet.create({
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
