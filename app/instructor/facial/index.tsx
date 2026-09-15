// ─────────────────────────────────────────────
//  app/admin/facial/index.tsx — Reconocimiento Facial (Admin)
//
//  Pantalla de acceso desde la barra lateral y desde los accesos
//  rápidos del Dashboard. Permite configurar la sesión de
//  reconocimiento facial eligiendo Ambiente, Instructor y Ficha
//  esperados, y guardar la selección.
// ─────────────────────────────────────────────
import { useAcademic } from '@/features/academic/useAcademic';
import { useEnvironments } from '@/features/environments/useEnvironments';
import { MOCK_INSTRUCTORS } from '@/features/schedules/types';
import { useFacialRegistry } from '@/features/facial/useFacialRegistry';
import { AppButton, SelectField } from '@/shared/components/ui';
import { Colors } from '@/shared/constants/colors';
import { Routes } from '@/shared/constants/routes';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function FacialManagementScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { environments } = useEnvironments();
  const { allFichas } = useAcademic();
  const { config, saveConfig } = useFacialRegistry();
  const { alert, DialogUI } = useAppDialog();

  const [environmentId, setEnvironmentId] = useState(config?.environmentId ?? '');
  const [instructorId, setInstructorId] = useState(config?.instructorId ?? '');
  const [fichaId, setFichaId] = useState(config?.fichaId ?? '');

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const environmentOptions = environments.map(e => ({ value: e.id, label: e.code }));
  const instructorOptions = MOCK_INSTRUCTORS.map(i => ({ value: i.id, label: i.name }));
  const fichaOptions = allFichas.map(f => ({ value: f.id, label: `Ficha ${f.number}` }));

  const handleSave = () => {
    const environment = environments.find(e => e.id === environmentId);
    const instructor = MOCK_INSTRUCTORS.find(i => i.id === instructorId);
    const ficha = allFichas.find(f => f.id === fichaId);

    if (!environment || !instructor || !ficha) {
      alert(t('common.error'), t('facial.setup.validation.allRequired'));
      return;
    }

    const result = saveConfig({
      environmentId: environment.id,
      environmentName: environment.code,
      instructorId: instructor.id,
      instructorName: instructor.name,
      fichaId: ficha.id,
      fichaNumber: ficha.number,
    });

    if (result.success) {
      alert('✓', t('facial.setup.saveSuccess'));
    } else {
      alert(t('common.error'), t(result.error));
    }
  };

  return (
    <View style={[fs.safe, { backgroundColor: bg }]}>
      {/* Header — sin flecha de retorno: esta pantalla no permite volver al menú principal */}
      <View style={fs.header}>
        <View style={{ flex: 1 }}>
          <Text style={[fs.title, { color: text }]}>{t('sidebar.facial')}</Text>
          <Text style={{ color: muted, fontSize: FontSize.xs, marginTop: 2 }}>
            {t('facial.setup.subtitle')}
          </Text>
        </View>
      </View>

      {/* Contenido centrado */}
      <ScrollView contentContainerStyle={fs.scroll}>
        <View style={fs.centerWrap}>
          <View style={[fs.card, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={[fs.iconWrap, { backgroundColor: theme.primary + '18' }]}>
              <Ionicons name="scan-outline" size={28} color={theme.primary} />
            </View>
            <Text style={[fs.cardTitle, { color: text }]}>{t('facial.setup.title')}</Text>
            <Text style={[fs.cardSubtitle, { color: muted }]}>{t('facial.setup.helper')}</Text>

            <SelectField
              label={t('facial.setup.fields.environment')}
              value={environmentId}
              options={environmentOptions}
              onSelect={setEnvironmentId}
              placeholder={t('facial.setup.placeholders.environment')}
            />
            <SelectField
              label={t('facial.setup.fields.instructor')}
              value={instructorId}
              options={instructorOptions}
              onSelect={setInstructorId}
              placeholder={t('facial.setup.placeholders.instructor')}
            />
            <SelectField
              label={t('facial.setup.fields.ficha')}
              value={fichaId}
              options={fichaOptions}
              onSelect={setFichaId}
              placeholder={t('facial.setup.placeholders.ficha')}
            />

            <AppButton
              title={t('facial.setup.settingsButton')}
              variant="outline"
              onPress={() => router.push(Routes.FACIAL.SETTINGS as any)}
              style={{ marginTop: 16 }}
            />
            <AppButton title={t('common.save')} onPress={handleSave} style={{ marginTop: 12 }} />
          </View>
        </View>
      </ScrollView>
      {DialogUI}
    </View>
  );
}

const fs = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  scroll: { flexGrow: 1, padding: 16, paddingBottom: 40 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 420 },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'stretch',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: 20,
  },
});
