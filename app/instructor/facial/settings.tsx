// ─────────────────────────────────────────────
//  app/admin/facial/settings.tsx — Ajustes de Reconocimiento Facial (Admin)
//
//  Pantalla accesible únicamente desde el botón "Ajustes" de
//  app/admin/facial/index.tsx. Permite configurar la jornada del punto
//  de reconocimiento: tiempo de registro, hora de salida y hora de
//  apagado. El botón "Volver" regresa a la pantalla de configuración
//  de sesión (facial/index), nunca al menú principal.
//
//  Los tres campos usan SelectField con listas fijas de opciones (no
//  texto libre), siguiendo el mismo criterio ya aplicado en
//  ScheduleFormModal para horas: evita estados inválidos por horas mal
//  formadas.
// ─────────────────────────────────────────────
import {
  DEFAULT_FACIAL_SETTINGS,
  FACIAL_REGISTRATION_MINUTES_OPTIONS,
  FACIAL_TIME_SLOTS,
} from '@/features/facial/types';
import { useFacialRegistry } from '@/features/facial/useFacialRegistry';
import { AppButton, SelectField } from '@/shared/components/ui';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FacialSettingsScreen() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { settings, saveSettings } = useFacialRegistry();
  const { alert, DialogUI } = useAppDialog();

  const initial = settings ?? DEFAULT_FACIAL_SETTINGS;
  const [registrationMinutes, setRegistrationMinutes] = useState(String(initial.registrationMinutes));
  const [exitTime, setExitTime] = useState(initial.exitTime);
  const [shutdownTime, setShutdownTime] = useState(initial.shutdownTime);
  const [errors, setErrors] = useState<{ registrationMinutes?: string; exitTime?: string; shutdownTime?: string }>({});

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const registrationOptions = FACIAL_REGISTRATION_MINUTES_OPTIONS.map(minutes => ({
    value: String(minutes),
    label: `${minutes} min`,
  }));
  const exitTimeOptions = FACIAL_TIME_SLOTS.map(slot => ({ value: slot, label: slot }));
  // La hora de apagado solo puede ser posterior a la hora de salida, igual
  // que endOptions en ScheduleFormModal para startTime/endTime.
  const shutdownTimeOptions = FACIAL_TIME_SLOTS
    .filter(slot => !exitTime || slot > exitTime)
    .map(slot => ({ value: slot, label: slot }));

  const handleSave = () => {
    const newErrors: typeof errors = {};
    if (!registrationMinutes) newErrors.registrationMinutes = t('common.required');
    if (!exitTime) newErrors.exitTime = t('common.required');
    if (!shutdownTime) newErrors.shutdownTime = t('common.required');
    else if (shutdownTime <= exitTime) newErrors.shutdownTime = t('facial.settings.validation.shutdownAfterExit');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const result = saveSettings({
      registrationMinutes: Number(registrationMinutes),
      exitTime,
      shutdownTime,
    });

    if (result.success) {
      alert('✓', t('facial.settings.saveSuccess'));
    } else {
      alert(t('common.error'), t(result.error));
    }
  };

  return (
    <View style={[fs.safe, { backgroundColor: bg }]}>
      {/* Header con flecha propia: regresa a la pantalla de configuración
          de sesión (facial/index), no al menú principal ni al dashboard. */}
      <View style={fs.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[fs.title, { color: text }]}>{t('facial.settings.title')}</Text>
          <Text style={{ color: muted, fontSize: FontSize.xs, marginTop: 2 }}>
            {t('facial.settings.subtitle')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={fs.scroll}>
        <View style={fs.centerWrap}>
          <View style={[fs.card, { backgroundColor: cardBg, borderColor: border }]}>
            <SelectField
              label={t('facial.settings.fields.registrationMinutes')}
              value={registrationMinutes}
              options={registrationOptions}
              onSelect={v => { setRegistrationMinutes(v); setErrors(p => ({ ...p, registrationMinutes: '' })); }}
              error={errors.registrationMinutes}
              placeholder={t('facial.settings.placeholders.registrationMinutes')}
            />
            <SelectField
              label={t('facial.settings.fields.exitTime')}
              value={exitTime}
              options={exitTimeOptions}
              onSelect={v => {
                setExitTime(v);
                if (shutdownTime && shutdownTime <= v) setShutdownTime('');
                setErrors(p => ({ ...p, exitTime: '', shutdownTime: '' }));
              }}
              error={errors.exitTime}
              placeholder={t('facial.settings.placeholders.exitTime')}
            />
            <SelectField
              label={t('facial.settings.fields.shutdownTime')}
              value={shutdownTime}
              options={shutdownTimeOptions}
              onSelect={v => { setShutdownTime(v); setErrors(p => ({ ...p, shutdownTime: '' })); }}
              error={errors.shutdownTime}
              placeholder={t('facial.settings.placeholders.shutdownTime')}
            />

            <AppButton title={t('common.save')} onPress={handleSave} style={{ marginTop: 20 }} />
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
});
