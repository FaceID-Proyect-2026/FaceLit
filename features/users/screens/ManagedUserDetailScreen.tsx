import { Colors } from '@/shared/constants/colors';
import { updateManagedUser } from '@/shared/services/userManagementService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '@/features/users/components/ManagedUserDetailStyles';
import { normalizeDate, roleLabel } from '@/features/users/components/ManagedUserDetailSupport';
import { PillList } from '@/features/users/components/ManagedUserDetail/PillList';
import { Field } from '@/features/users/components/ManagedUserDetail/Field';

import { useManagedUserDetailScreen } from '@/features/users/hooks/useManagedUserDetailScreen';

export default function ManagedUserDetailScreen() {
  const {
    theme,
    t,
    i18n,
    alert,
    DialogUI,
    base,
    setBase,
    form,
    errors,
    loading,
    updatingStatus,
    setUpdatingStatus,
    text,
    muted,
    bg,
    card,
    border,
    role,
    isCoordinator,
    isInstructor,
    isApprentice,
    isInactive,
    roleColor,
    updateField,
    handleSave,
  } = useManagedUserDetailScreen();
if (loading) return <View style={[styles.root, { backgroundColor: bg }]} />;

  if (!base) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: bg }]}>
        <Ionicons name="alert-circle-outline" size={40} color={muted} />
        <Text style={[styles.notFound, { color: muted }]}>{t('users.errors.notFound')}</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtnCenter, { borderColor: border }]}>
          <Text style={{ color: theme.primary, fontWeight: '700' }}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: card, borderColor: border }]}
          >
            <Ionicons name="arrow-back" size={20} color={text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.subtitle, { color: muted }]}>{t('users.detail.title')}</Text>
          </View>
        </View>

        <View style={[styles.banner, { backgroundColor: roleColor + '18', borderColor: roleColor + '35' }]}>
          <View style={[styles.bannerAvatar, { backgroundColor: roleColor }]}>
            <Text style={styles.bannerAvatarText}>{form.firstName.charAt(0).toUpperCase() || '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerName, { color: text }]}>{form.firstName} {form.lastName}</Text>
            <View style={[styles.rolePill, { backgroundColor: roleColor + '22' }]}>
              <Text style={[styles.rolePillText, { color: roleColor }]}>{roleLabel(role, t)}</Text>
            </View>
          </View>
          <View style={[styles.statusPill, { backgroundColor: theme.successSoft }]}>
            <View style={[styles.statusDot, { backgroundColor: base.accountStatus === 'ACTIVE' ? Colors.success : muted }]} />
            <Text style={[styles.statusText, { color: base.accountStatus === 'ACTIVE' ? Colors.success : muted }]}>
              {t(`users.statuses.${base.accountStatus === 'ACTIVE' || base.accountStatus === 'BLOCKED' ? base.accountStatus : 'INACTIVE'}`)}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
          <Text style={[styles.section, { color: theme.primary }]}>{t('users.detail.personalData')}</Text>
          <View style={styles.row}>
            <Field
              label={t('users.document')}
              value={form.document}
              onChange={updateField('document')}
              error={errors.document}
              keyboard="numeric"
              textColor={text}
              mutedColor={muted}
              borderColor={border}
              labelColor={theme.primary}
            />
            <Field
              label={t('register.email')}
              value={form.email}
              onChange={updateField('email')}
              error={errors.email}
              keyboard="email-address"
              textColor={text}
              mutedColor={muted}
              borderColor={border}
              labelColor={theme.primary}
            />
          </View>
          <View style={styles.row}>
            <Field
              label={t('users.firstName')}
              value={form.firstName}
              onChange={updateField('firstName')}
              error={errors.firstName}
              textColor={text}
              mutedColor={muted}
              borderColor={border}
              labelColor={theme.primary}
            />
            <Field
              label={t('users.lastName')}
              value={form.lastName}
              onChange={updateField('lastName')}
              error={errors.lastName}
              textColor={text}
              mutedColor={muted}
              borderColor={border}
              labelColor={theme.primary}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
          <Text style={[styles.section, { color: theme.primary }]}>{t('users.detail.session')}</Text>
          <Text style={[styles.infoText, { color: muted }]}>
            {t('users.detail.sessionStatus', {
              status: base.sessionStatus === 'ACTIVE' ? t('users.detail.sessionActive') : t('users.detail.sessionInactive'),
            })}
          </Text>
          <Text style={[styles.infoText, { color: muted }]}>
            {t('users.detail.sessionExpires', { date: normalizeDate(base.sessionExpiresAt, t('users.detail.noDate'), i18n.resolvedLanguage) })}
          </Text>
          <Text style={[styles.infoText, { color: muted }]}>
            {t('users.detail.hasLoggedIn', { value: base.hasSession ? t('common.yes') : t('common.no') })}
          </Text>
        </View>

        {isApprentice ? (
          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            <Text style={[styles.section, { color: theme.primary }]}>{t('users.detail.academicData')}</Text>
            <Text style={[styles.infoText, { color: muted }]}>
              {t('users.detail.fichaLabel', { ficha: base.chipCode || t('users.noFichaActive') })}
            </Text>
            <Text style={[styles.infoText, { color: muted }]}>
              {t('users.detail.programLabel', { program: base.programName || t('users.noProgram') })}
            </Text>
          </View>
        ) : null}

        {isInstructor ? (
          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            <Text style={[styles.section, { color: theme.primary }]}>{t('users.detail.academicData')}</Text>
            <Text style={[styles.infoLabel, { color: text }]}>{t('users.detail.assignedPrograms')}</Text>
            <PillList items={base.instructorProgramNames} empty={t('users.detail.noAssignedPrograms')} color={theme.primary} />
            <Text style={[styles.infoLabel, { color: text }]}>{t('users.detail.relatedFichas')}</Text>
            <PillList items={base.instructorChipCodes} empty={t('users.detail.noRelatedFichas')} color={theme.info} />
          </View>
        ) : null}

        {isCoordinator ? (
          <View style={[styles.note, { backgroundColor: theme.infoSoft, borderColor: theme.info + '40' }]}>
            <Ionicons name="information-circle-outline" size={14} color={theme.info} />
            <Text style={[styles.noteText, { color: theme.info }]}>
              {t('users.detail.coordinatorNote')}
            </Text>
          </View>
        ) : null}

        <View style={styles.formActions}>
          {isInactive && (
            <TouchableOpacity
              disabled={updatingStatus}
              onPress={() => {
                alert(t('users.activateUser'), t('users.activateConfirm', { name: `${form.firstName} ${form.lastName}` }), [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('users.panel.activate'),
                    onPress: async () => {
                      setUpdatingStatus(true);
                      try {
                        const updated = await updateManagedUser(base.userId, {
                          numberDocument: base.documentNumber ?? '',
                          firstName: base.firstName ?? '',
                          lastName: base.lastName ?? '',
                          email: base.email ?? '',
                          accountStatus: 'ACTIVE',
                          role: base.role,
                        });
                        setBase(updated);
                        alert(t('common.success'), t('users.activateSuccess'), [{ text: t('common.ok') }]);
                      } catch {
                        alert(t('common.error'), t('users.statusUpdateError'), [{ text: t('common.ok') }]);
                      } finally {
                        setUpdatingStatus(false);
                      }
                    },
                  },
                ]);
              }}
              style={[styles.activateBtn, { backgroundColor: theme.primary, opacity: updatingStatus ? 0.6 : 1 }]}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color={Colors.white} />
              <Text style={styles.saveBtnText}>{t('users.panel.activate')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
            <Text style={{ color: muted, fontWeight: '600' }}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: theme.primary }]}>
            <Ionicons name="save-outline" size={16} color={Colors.white} />
            <Text style={styles.saveBtnText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {DialogUI}
    </KeyboardAvoidingView>
  );

}
