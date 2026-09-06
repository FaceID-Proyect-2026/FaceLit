// ─────────────────────────────────────────────
//  app/admin/environments/[id].tsx
//  Detalle de ambiente + edición + asignación
// ─────────────────────────────────────────────
import EnvironmentFormModal from '@/features/environments/components/EnvironmentFormModal';
import { MOCK_FICHAS } from '@/features/environments/types';
import { useEnvironments } from '@/features/environments/useEnvironments';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function EnvironmentDetailScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById, assignFicha, unassignFicha } = useEnvironments();
  const { alert, DialogUI } = useAppDialog();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const env = getById(id ?? '');

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  if (!env) {
    return (
      <View style={[eds.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }]}>
        <Ionicons name="alert-circle-outline" size={48} color={muted} />
        <Text style={{ color: text, fontSize: FontSize.lg, fontWeight: FontWeight.bold, textAlign: 'center' }}>
          {t('environments.detail.notFound')}
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={[eds.editBtn, { borderColor: theme.primary, marginTop: 8 }]}>
          <Ionicons name="arrow-back" size={18} color={theme.primary} />
          <Text style={[eds.editBtnText, { color: theme.primary }]}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = env.status === 'active' ? Colors.success : Colors.error;

  const activeAssignments = env.assignedFichas.filter(item => !item.unassignedAt);
  const historicalAssignments = env.assignedFichas.filter(item => item.unassignedAt);
  const assignedFichasData = MOCK_FICHAS.filter(f => activeAssignments.some(item => item.fichaCode === f.code));
  const availableFichas = MOCK_FICHAS.filter(f => !activeAssignments.some(item => item.fichaCode === f.code));

  const handleRemoveFicha = (fichaId: string, fichaName: string) => {
    alert(
      t('environments.detail.removeFicha'),
      `${fichaName}\n\n${t('environments.detail.removeFichaConfirm')}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('environments.detail.removeFicha'),
          style: 'destructive',
          onPress: () => {
            const result = unassignFicha(env.id, fichaId);
            if (result.success) alert('✓', t('environments.detail.removeFichaSuccess'));
          },
        },
      ]
    );
  };

  return (
    <View style={[eds.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={eds.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={eds.backBtn}>
          <Ionicons name="arrow-back" size={20} color={text} />
          <Text style={[eds.backText, { color: text }]}>{t('common.back')}</Text>
        </TouchableOpacity>

        <View style={eds.heading}>
          <View style={[eds.headingIcon, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '55' }]}>
            <Ionicons name="business-outline" size={26} color={theme.primary} />
          </View>
          <View style={eds.headingCopy}>
            <Text style={[eds.title, { color: text }]}>{t('environments.detail.title')}</Text>
            <Text style={[eds.subtitle, { color: muted }]}>{t('environments.detail.subtitle', 'Información y fichas asociadas')}</Text>
          </View>
        </View>

        {/* Info card */}
        <View style={[eds.card, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={eds.infoRow}>
            <Text style={[eds.infoLabel, { color: muted }]}>{t('environments.fields.name')}</Text>
            <Text style={[eds.infoValue, { color: text }]}>{env.code}</Text>
          </View>
          <View style={eds.infoRow}>
            <Text style={[eds.infoLabel, { color: muted }]}>{t('environments.fields.quantity')}</Text>
            <Text style={[eds.infoValue, { color: text }]}>{env.quantity}</Text>
          </View>
          <View style={eds.infoRow}>
            <Text style={[eds.infoLabel, { color: muted }]}>{t('environments.fields.status')}</Text>
            <View style={[eds.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <View style={[eds.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[eds.statusText, { color: statusColor }]}>{t(`environments.statuses.${env.status}`)}</Text>
            </View>
          </View>
          <View style={eds.infoRow}>
            <Text style={[eds.infoLabel, { color: muted }]}>{t('environments.detail.createdAt')}</Text>
            <Text style={[eds.infoValue, { color: text }]}>{new Date(env.createdAt).toLocaleString()}</Text>
          </View>
          <View style={[eds.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={[eds.infoLabel, { color: muted }]}>{t('environments.detail.updatedAt')}</Text>
            <Text style={[eds.infoValue, { color: text }]}>{new Date(env.updatedAt).toLocaleString()}</Text>
          </View>
        </View>

        {/* Edit button (único) */}
        <TouchableOpacity
          onPress={() => setEditModalOpen(true)}
          style={[eds.editBtn, { borderColor: theme.primary }]}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={18} color={theme.primary} />
          <Text style={[eds.editBtnText, { color: theme.primary }]}>{t('environments.edit')}</Text>
        </TouchableOpacity>

        {/* Assigned fichas */}
        <View style={eds.sectionHeading}>
          <View style={[eds.sectionIcon, { backgroundColor: theme.primary + '18' }]}>
            <Ionicons name="layers-outline" size={18} color={theme.primary} />
          </View>
          <View style={eds.sectionHeadingCopy}>
            <Text style={[eds.sectionTitle, { color: text }]}>{t('environments.detail.assignedFichas')}</Text>
            <Text style={[eds.sectionHelp, { color: muted }]}>{t('environments.detail.assignedFichasHelp', 'Fichas que actualmente usan este ambiente. Puedes asignar nuevas o retirar las existentes.')}</Text>
          </View>
        </View>
        {assignedFichasData.length === 0 ? (
          <Text style={[eds.empty, { color: muted }]}>{t('environments.detail.noFichas')}</Text>
        ) : (
          assignedFichasData.map(f => {
            const relation = activeAssignments.find(item => item.fichaCode === f.code);
            return (
            <View key={f.id} style={[eds.fichaCard, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[eds.fichaName, { color: text }]}>{f.name}</Text>
                <Text style={[eds.fichaInfo, { color: muted }]}>{f.program} · {f.learners} {t('environments.detail.learners')}</Text>
                {relation && <Text style={[eds.fichaAssignedAt, { color: muted }]}>{t('environments.detail.assignedAt')}: {new Date(relation.assignedAt).toLocaleDateString()}</Text>}
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveFicha(f.code, f.name)}
                style={[eds.removeBtn, { backgroundColor: Colors.error + '15' }]}
              >
                <Ionicons name="close-circle-outline" size={18} color={Colors.error} />
              </TouchableOpacity>
            </View>
            );
          })
        )}

        {/* Assign ficha */}
        {availableFichas.length > 0 && (
          <>
            <View style={[eds.sectionHeading, { marginTop: 20 }]}>
              <View style={[eds.sectionIcon, { backgroundColor: theme.primary + '18' }]}>
                <Ionicons name="add-circle-outline" size={18} color={theme.primary} />
              </View>
              <View style={eds.sectionHeadingCopy}>
                <Text style={[eds.sectionTitle, { color: text }]}>{t('environments.assign.title')}</Text>
                <Text style={[eds.sectionHelp, { color: muted }]}>{t('environments.detail.assignHelp', 'Selecciona una ficha para vincularla con este ambiente.')}</Text>
              </View>
            </View>
            {availableFichas.map(f => (
              <TouchableOpacity
                key={f.id}
                onPress={() => {
                  const result = assignFicha(env.id, f.code);
                  if (result.success) alert('✓', t('environments.assign.successMsg'));
                }}
                style={[eds.assignCard, { backgroundColor: cardBg, borderColor: theme.primary + '40' }]}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[eds.fichaName, { color: text }]}>{f.name}</Text>
                  <Text style={[eds.fichaInfo, { color: muted }]}>{f.program} · {f.learners} {t('environments.detail.learners')}</Text>
                </View>
                <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {historicalAssignments.length > 0 && (
          <>
            <Text style={[eds.sectionTitle, { color: text, marginTop: 20 }]}>{t('environments.detail.assignmentHistory')}</Text>
            {historicalAssignments.map(assignment => {
              const ficha = MOCK_FICHAS.find(item => item.code === assignment.fichaCode);
              return (
                <View key={`${assignment.fichaCode}-${assignment.assignedAt}`} style={[eds.historyCard, { backgroundColor: cardBg, borderColor: border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[eds.fichaName, { color: text }]}>{ficha?.name ?? assignment.fichaCode}</Text>
                    <Text style={[eds.fichaInfo, { color: muted }]}>{t('environments.detail.assignedAt')}: {new Date(assignment.assignedAt).toLocaleDateString()}</Text>
                    <Text style={[eds.fichaAssignedAt, { color: muted }]}>{t('environments.detail.unassignedAt')}: {new Date(assignment.unassignedAt!).toLocaleDateString()}</Text>
                  </View>
                  <Ionicons name="time-outline" size={20} color={muted} />
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
      {DialogUI}
      <EnvironmentFormModal visible={editModalOpen} editId={env.id} onClose={() => setEditModalOpen(false)} />
    </View>
  );
}

const eds = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  headingIcon: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 6 },
  subtitle: { fontSize: FontSize.sm, lineHeight: 19 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  infoLabel: { fontSize: FontSize.md, flex: 1 },
  infoValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, flex: 1, textAlign: 'right' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, borderWidth: 1.5, paddingVertical: 12, marginBottom: 20 },
  editBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black, marginBottom: 10 },
  sectionHelp: { fontSize: FontSize.sm, lineHeight: 19, marginTop: -4, marginBottom: 10 },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  sectionIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionHeadingCopy: { flex: 1 },
  empty: { fontSize: FontSize.md, textAlign: 'center', paddingVertical: 20 },
  fichaCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8, gap: 10 },
  fichaName: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  fichaInfo: { fontSize: FontSize.sm, marginTop: 2 },
  fichaAssignedAt: { fontSize: FontSize.xs, marginTop: 2, fontStyle: 'italic' },
  historyCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8, gap: 10, opacity: 0.82 },
  removeBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  assignCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8, gap: 10 },
});
