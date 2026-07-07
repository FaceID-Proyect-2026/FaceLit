// ─────────────────────────────────────────────
//  app/admin/environments/[id].tsx
//  Detalle de ambiente + edición + asignación
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useEnvironments } from '@/features/environments/useEnvironments';
import { MOCK_FICHAS } from '@/features/environments/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function EnvironmentDetailScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById, assignFicha } = useEnvironments();
  const env = getById(id ?? '');

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  if (!env) {
    return (
      <View style={[eds.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: muted }}>Ambiente no encontrado</Text>
      </View>
    );
  }

  const statusColor = env.status === 'active' ? Colors.success : env.status === 'maintenance' ? Colors.warning : Colors.error;

  const assignedFichasData = MOCK_FICHAS.filter(f => env.assignedFichas.includes(f.code));
  const availableFichas = MOCK_FICHAS.filter(f => !env.assignedFichas.includes(f.code));

  return (
    <View style={[eds.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={eds.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={eds.backBtn}>
          <Ionicons name="arrow-back" size={20} color={text} />
          <Text style={[eds.backText, { color: text }]}>{t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={[eds.title, { color: text }]}>{t('environments.detail.title')}</Text>

        {/* Info card */}
        <View style={[eds.card, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={eds.infoRow}>
            <Text style={[eds.infoLabel, { color: muted }]}>{t('environments.fields.code')}</Text>
            <Text style={[eds.infoValue, { color: text }]}>{env.code}</Text>
          </View>
          <View style={eds.infoRow}>
            <Text style={[eds.infoLabel, { color: muted }]}>{t('environments.fields.name')}</Text>
            <Text style={[eds.infoValue, { color: text }]}>{env.name}</Text>
          </View>
          <View style={eds.infoRow}>
            <Text style={[eds.infoLabel, { color: muted }]}>{t('environments.fields.type')}</Text>
            <Text style={[eds.infoValue, { color: text }]}>{t(`environments.types.${env.type}`)}</Text>
          </View>
          <View style={eds.infoRow}>
            <Text style={[eds.infoLabel, { color: muted }]}>{t('environments.fields.capacity')}</Text>
            <Text style={[eds.infoValue, { color: text }]}>{env.capacity}</Text>
          </View>
          <View style={eds.infoRow}>
            <Text style={[eds.infoLabel, { color: muted }]}>{t('environments.fields.status')}</Text>
            <View style={[eds.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <View style={[eds.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[eds.statusText, { color: statusColor }]}>{t(`environments.statuses.${env.status}`)}</Text>
            </View>
          </View>
          <View style={eds.infoRow}>
            <Text style={[eds.infoLabel, { color: muted }]}>{t('environments.fields.location')}</Text>
            <Text style={[eds.infoValue, { color: text }]}>{env.location}</Text>
          </View>
        </View>

        {/* Edit button */}
        <TouchableOpacity
          onPress={() => router.push(`/admin/environments/${env.id}?edit=1` as any)}
          style={[eds.editBtn, { borderColor: theme.primary }]}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={18} color={theme.primary} />
          <Text style={[eds.editBtnText, { color: theme.primary }]}>{t('environments.edit')}</Text>
        </TouchableOpacity>

        {/* Assigned fichas */}
        <Text style={[eds.sectionTitle, { color: text }]}>{t('environments.detail.assignedFichas')}</Text>
        {assignedFichasData.length === 0 ? (
          <Text style={[eds.empty, { color: muted }]}>{t('environments.detail.noFichas')}</Text>
        ) : (
          assignedFichasData.map(f => (
            <View key={f.id} style={[eds.fichaCard, { backgroundColor: cardBg, borderColor: border }]}>
              <View>
                <Text style={[eds.fichaName, { color: text }]}>{f.name}</Text>
                <Text style={[eds.fichaInfo, { color: muted }]}>{f.program} · {f.learners} aprendices</Text>
              </View>
            </View>
          ))
        )}

        {/* Assign ficha */}
        {availableFichas.length > 0 && (
          <>
            <Text style={[eds.sectionTitle, { color: text, marginTop: 16 }]}>{t('environments.assign.title')}</Text>
            {availableFichas.map(f => (
              <TouchableOpacity
                key={f.id}
                onPress={() => {
                  const result = assignFicha(env.id, f.code);
                  if (result.success) Alert.alert('✓', t('environments.assign.successMsg'));
                }}
                style={[eds.assignCard, { backgroundColor: cardBg, borderColor: theme.primary + '40' }]}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[eds.fichaName, { color: text }]}>{f.name}</Text>
                  <Text style={[eds.fichaInfo, { color: muted }]}>{f.program} · {f.learners} aprendices</Text>
                </View>
                <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Link to register page for editing */}
        <TouchableOpacity
          onPress={() => router.push(`/admin/environments/register?id=${env.id}` as any)}
          style={[eds.fullEditBtn, { backgroundColor: theme.primary }]}
          activeOpacity={0.85}
        >
          <Text style={eds.fullEditText}>{t('environments.edit')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const eds = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 16 },
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
  empty: { fontSize: FontSize.md, textAlign: 'center', paddingVertical: 20 },
  fichaCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8 },
  fichaName: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  fichaInfo: { fontSize: FontSize.sm, marginTop: 2 },
  assignCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8, gap: 10 },
  fullEditBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  fullEditText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
