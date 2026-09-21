// ─────────────────────────────────────────────
//  app/admin/users/[id].tsx
//  MF-06 — Detalle y edición de usuario con reglas vigentes
// ─────────────────────────────────────────────
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { getManagedUser, updateManagedUser } from '@/shared/services/userManagementService';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function UserDetailScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { alert, DialogUI } = useAppDialog();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [base, setBase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');

  useEffect(() => {
    if (!id) return;
    getManagedUser(id)
      .then((data) => {
        setBase(data);
        setName(data.firstName ?? '');
        setLastname(data.lastName ?? '');
      })
      .catch(() => setBase(undefined))
      .finally(() => setLoading(false));
  }, [id]);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const card = theme.surface;
  const border = theme.border;
  const softGreen = theme.successSoft;
  const softBlue = theme.infoSoft;
  const softAmber = theme.warningSoft;

  if (loading) {
    return <View style={[styles.root, { backgroundColor: bg }]} />;
  }

  if (!base) {
    return (
      <View style={[styles.root, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={40} color={muted} />
        <Text style={[styles.notFound, { color: muted }]}>{t('users.errors.notFound')}</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtnCenter, { borderColor: border }]}>
          <Text style={{ color: theme.primary, fontWeight: '700' }}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isInstructor = base.role === 'INSTRUCTOR';
  const isApprentice = base.role === 'APPRENTICE';
  const roleColor = isInstructor ? theme.info : isApprentice ? Colors.warning : theme.primary;
  const roleBg = isInstructor ? softBlue : isApprentice ? softAmber : softGreen;
  const roleLabel =
    base.role === 'COORDINATOR'
      ? 'Coordinador'
      : base.role === 'INSTRUCTOR'
        ? t('users.create.roleInstructor')
        : t('users.create.roleApprentice');

  const handleSave = async () => {
    try {
      await updateManagedUser(base.userId, {
        firstName: name.trim(),
        lastName: lastname.trim(),
        accountStatus: base.accountStatus,
        role: base.role,
      });
      alert(t('common.save'), 'Los cambios se guardaron correctamente.', [{ text: t('common.ok') }]);
    } catch (error: any) {
      alert(t('common.error'), error?.message || 'No se pudieron guardar los cambios.', [{ text: t('common.ok') }]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: card, borderColor: border }]}
          >
            <Ionicons name="arrow-back" size={20} color={text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: text }]} numberOfLines={1}>
              {name} {lastname}
            </Text>
            <Text style={[styles.subtitle, { color: muted }]}>Detalle del usuario</Text>
          </View>
        </View>

        <View style={[styles.banner, { backgroundColor: roleBg }]}>
          <View style={[styles.bannerAvatar, { backgroundColor: roleColor }]}>
            <Text style={styles.bannerAvatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerName, { color: text }]}>{name} {lastname}</Text>
            <View style={[styles.rolePill, { backgroundColor: roleColor + '22' }]}>
              <Text style={[styles.rolePillText, { color: roleColor }]}>{roleLabel}</Text>
            </View>
          </View>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: String(base.accountStatus).toUpperCase() === 'ACTIVE' ? softGreen : isDark ? 'rgba(255,255,255,0.06)' : '#F2F2F2' },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: String(base.accountStatus).toUpperCase() === 'ACTIVE' ? Colors.success : muted }]} />
            <Text style={[styles.statusText, { color: String(base.accountStatus).toUpperCase() === 'ACTIVE' ? Colors.success : muted }]}>
              {String(base.accountStatus).toUpperCase() === 'ACTIVE' ? t('users.statuses.ACTIVE') : t('users.statuses.INACTIVE')}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
          <Text style={[styles.section, { color: theme.primary }]}>{t('users.readonlyData')}</Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.primary }]}>{t('users.document')}</Text>
            <View style={[styles.fieldDisabled, { borderColor: border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F5F5F5' }]}>
              <Ionicons name="lock-closed-outline" size={14} color={muted} style={{ marginRight: 6 }} />
              <Text style={[styles.fieldDisabledText, { color: muted }]}>{base.documentNumber ?? 'Sin documento'}</Text>
            </View>
            <Text style={[styles.fieldHint, { color: muted }]}>Este dato no cambia nunca.</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="shield-outline" size={13} color={muted} />
            <Text style={[styles.infoText, { color: muted }]}>
              Rol: <Text style={{ color: roleColor, fontWeight: '700' }}>{roleLabel}</Text>
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: card, borderColor: border, marginTop: 12 }]}>
          <Text style={[styles.section, { color: theme.primary }]}>{t('users.editData')}</Text>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.primary }]}>{t('users.firstName')}</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t('users.firstName')}
                  placeholderTextColor={muted}
                  style={[styles.field, { color: text, borderColor: border }]}
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.primary }]}>{t('users.lastName')}</Text>
                <TextInput
                  value={lastname}
                  onChangeText={setLastname}
                  placeholder={t('users.lastName')}
                  placeholderTextColor={muted}
                  style={[styles.field, { color: text, borderColor: border }]}
                />
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.primary }]}>{t('register.email')}</Text>
            <View style={[styles.fieldDisabled, { borderColor: border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F5F5F5' }]}>
              <Ionicons name="mail-outline" size={14} color={muted} style={{ marginRight: 6 }} />
              <Text style={[styles.fieldDisabledText, { color: muted }]}>{base.email ?? 'Sin correo'}</Text>
            </View>
          </View>

          <Text style={[styles.section, { color: theme.primary }]}>Datos académicos</Text>
          <Text style={[styles.infoText, { color: muted }]}>Ficha: {base.chipCode ?? 'Sin ficha activa'}</Text>
          <Text style={[styles.infoText, { color: muted }]}>Programa: {base.programName ?? 'Sin programa'}</Text>
          <Text style={[styles.infoText, { color: muted }]}>Sesión: {base.sessionStatus ?? 'INACTIVE'}</Text>
          <Text style={[styles.infoText, { color: muted }]}>Vencimiento: {base.sessionExpiresAt ?? 'Sin sesión registrada'}</Text>

          <View style={[styles.note, { backgroundColor: softAmber, borderColor: Colors.warning + '40' }]}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.warning} />
            <Text style={[styles.noteText, { color: Colors.warning }]}>
              El tipo de instructor y el traslado de ficha se manejan con las validaciones de módulo académico para respetar la regla de negocio.
            </Text>
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
              <Text style={{ color: muted, fontWeight: '600' }}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: theme.primary }]}>
              <Ionicons name="save-outline" size={16} color={Colors.white} />
              <Text style={styles.saveBtnText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {DialogUI}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 18, paddingBottom: 40 },
  notFound: { fontSize: FontSize.md, marginTop: 12 },
  backBtnCenter: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, marginTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black },
  subtitle: { fontSize: FontSize.sm, marginTop: 3 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14, marginBottom: 12 },
  bannerAvatar: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  bannerAvatarText: { color: Colors.white, fontWeight: '900', fontSize: 18 },
  bannerName: { fontSize: 15, fontWeight: '800' },
  rolePill: { flexDirection: 'row', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, marginTop: 4, alignSelf: 'flex-start' },
  rolePillText: { fontSize: FontSize.xs, fontWeight: '800' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '800' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  section: { fontSize: FontSize.xs, fontWeight: '900', textTransform: 'uppercase' },
  fieldGroup: { gap: 5 },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: '800', textTransform: 'uppercase' },
  fieldDisabled: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  fieldDisabledText: { fontSize: 14, flex: 1 },
  fieldHint: { fontSize: FontSize.xs, marginTop: 3 },
  field: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  fieldError: { color: Colors.error, fontSize: FontSize.xs, marginTop: 2 },
  row: { flexDirection: 'row', gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  infoText: { fontSize: FontSize.sm },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleOption: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11 },
  roleOptionText: { fontSize: FontSize.sm, fontWeight: '700' },
  programGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  programChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, width: '47%' },
  programCode: { fontSize: FontSize.sm, fontWeight: '900' },
  programLabel: { fontSize: FontSize.xs, marginTop: 2 },
  transferButton: { borderRadius: 10, alignItems: 'center', paddingVertical: 10, marginTop: 8 },
  historyBox: { borderWidth: 1, borderRadius: 12, padding: 10, marginTop: 10, borderColor: Colors.light.border },
  historyTitle: { fontSize: FontSize.sm, fontWeight: '800', marginBottom: 6 },
  historyItem: { fontSize: FontSize.xs, marginBottom: 4 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  noteText: { flex: 1, fontSize: FontSize.xs, lineHeight: 16 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 4 },
  cancelBtn: { paddingHorizontal: 8, paddingVertical: 11 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 },
  saveBtnText: { color: Colors.white, fontWeight: '800', fontSize: FontSize.sm },
});
