import {
  createManagedEnvironment,
  EnvironmentInput,
  getManagedEnvironment,
  ManagedEnvironment,
  setManagedEnvironmentState,
  updateManagedEnvironment,
} from '@/features/environments/environmentAdminApi';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

function messageFrom(error: unknown, fallback: string) {
  const value = error as { response?: { data?: { message?: unknown } } };
  return typeof value?.response?.data?.message === 'string' ? value.response.data.message : fallback;
}

export default function EnvironmentAdminForm({ mode }: { mode: 'create' | 'edit' }) {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const [environment, setEnvironment] = useState<ManagedEnvironment | null>(null);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const surface = isDark ? Colors.dark.surface : Colors.light.surface;
  const border = isDark ? Colors.dark.border : Colors.light.border;
  const copy = useCallback((key: string) => t(`environmentAdmin.${key}`), [t]);

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    let active = true;
    getManagedEnvironment(id)
      .then(value => {
        if (!active) return;
        setEnvironment(value);
        setName(value.environmentName);
        setCapacity(value.capacity == null ? '' : String(value.capacity));
      })
      .catch(reason => { if (active) setError(messageFrom(reason, copy('loadError'))); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [copy, id, mode]);

  const submit = async () => {
    const normalizedName = name.trim().replace(/\s+/g, ' ');
    const parsedCapacity = capacity.trim() ? Number(capacity) : null;
    if (!normalizedName) { setError(copy('nameRequired')); return; }
    if (parsedCapacity !== null && (!Number.isInteger(parsedCapacity) || parsedCapacity < 1)) {
      setError(copy('capacityInvalid')); return;
    }
    const input: EnvironmentInput = { environmentName: normalizedName, capacity: parsedCapacity };
    setSaving(true);
    setError('');
    try {
      if (mode === 'create') await createManagedEnvironment(input);
      else if (id) await updateManagedEnvironment(id, input);
      router.replace('/admin/environments' as any);
    } catch (reason) {
      setError(messageFrom(reason, copy(mode === 'create' ? 'createError' : 'updateError')));
    } finally {
      setSaving(false);
    }
  };

  const changeState = async () => {
    if (!id || !environment) return;
    const next = environment.state === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const apply = async () => {
      setSaving(true);
      setError('');
      try { setEnvironment(await setManagedEnvironmentState(id, next)); }
      catch (reason) { setError(messageFrom(reason, copy('stateError'))); }
      finally { setSaving(false); }
    };
    if (next === 'INACTIVE') {
      if (Platform.OS === 'web') {
        if (globalThis.confirm(copy('confirmDeactivate'))) await apply();
        return;
      }
      Alert.alert(copy('confirmDeactivateTitle'), copy('confirmDeactivate'), [
        { text: copy('cancel'), style: 'cancel' },
        { text: copy('deactivate'), style: 'destructive', onPress: () => { void apply(); } },
      ]);
    } else {
      await apply();
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={theme.primary} /></View>;

  return (
    <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
      <View style={s.heading}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={copy('back')} onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={21} color={text} />
        </TouchableOpacity>
        <View style={s.headingCopy}>
          <Text style={[s.title, { color: text }]}>{copy(mode === 'create' ? 'createTitle' : 'editTitle')}</Text>
          <Text style={[s.subtitle, { color: theme.textMuted }]}>{copy('formSubtitle')}</Text>
        </View>
      </View>

      <View style={[s.card, { backgroundColor: surface, borderColor: border }]}>
        <Text style={[s.label, { color: text }]}>{copy('name')}</Text>
        <TextInput
          accessibilityLabel={copy('name')}
          value={name}
          onChangeText={setName}
          maxLength={100}
          placeholder={copy('namePlaceholder')}
          placeholderTextColor={theme.textMuted}
          style={[s.input, { color: text, borderColor: border, backgroundColor: isDark ? Colors.dark.background : Colors.light.background }]}
        />
        <Text style={[s.label, { color: text }]}>{copy('capacity')}</Text>
        <TextInput
          accessibilityLabel={copy('capacity')}
          value={capacity}
          onChangeText={value => setCapacity(value.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={5}
          placeholder={copy('capacityOptional')}
          placeholderTextColor={theme.textMuted}
          style={[s.input, { color: text, borderColor: border, backgroundColor: isDark ? Colors.dark.background : Colors.light.background }]}
        />
        <Text style={[s.help, { color: theme.textMuted }]}>{copy('capacityHelp')}</Text>
        {environment && <Text style={[s.state, { color: theme.textMuted }]}>{copy('state')}: {environment.state === 'ACTIVE' ? copy('active') : copy('inactive')}</Text>}
        {!!error && <Text accessibilityRole="alert" style={[s.error, { color: theme.danger }]}>{error}</Text>}
        <TouchableOpacity accessibilityRole="button" disabled={saving} onPress={() => { void submit(); }} style={[s.primaryButton, { backgroundColor: theme.primary, opacity: saving ? 0.65 : 1 }]}>
          {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={s.primaryText}>{copy(mode === 'create' ? 'createAction' : 'saveAction')}</Text>}
        </TouchableOpacity>
        {environment && (
          <TouchableOpacity accessibilityRole="button" disabled={saving} onPress={() => { void changeState(); }} style={[s.secondaryButton, { borderColor: border }]}>
            <Text style={[s.secondaryText, { color: text }]}>{environment.state === 'ACTIVE' ? copy('deactivate') : copy('reactivate')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  page: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 22, gap: 18 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headingCopy: { flex: 1 },
  back: { padding: 8 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  subtitle: { marginTop: 4, fontSize: FontSize.sm, lineHeight: 20 },
  card: { borderWidth: 1, borderRadius: 16, padding: 20 },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: 7, marginTop: 12 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: FontSize.md },
  help: { fontSize: FontSize.xs, lineHeight: 18, marginTop: 6 },
  state: { fontSize: FontSize.sm, marginTop: 14 },
  error: { fontSize: FontSize.sm, lineHeight: 20, marginTop: 14 },
  primaryButton: { minHeight: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingHorizontal: 16 },
  primaryText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.md },
  secondaryButton: { minHeight: 46, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  secondaryText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});
