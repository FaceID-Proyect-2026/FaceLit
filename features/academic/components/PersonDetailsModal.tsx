import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { formatDateTime } from '@/shared/utils/dates';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface AcademicPersonDetails {
  name: string;
  lastname: string;
  document: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
  instructorType?: 'especifico' | 'transversal';
}

interface PersonDetailsModalProps {
  visible: boolean;
  title: string;
  person: AcademicPersonDetails | null;
  onClose: () => void;
}

export default function PersonDetailsModal({ visible, title, person, onClose }: PersonDetailsModalProps) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;

  if (!person) return null;

  const fullName = `${person.name} ${person.lastname}`.trim();
  const initials = `${person.name.trim().charAt(0)}${person.lastname.trim().charAt(0)}`.toUpperCase();

  const fields = [
    { label: t('academic.personFullName'), value: fullName, icon: 'person-outline' as const },
    { label: t('academic.documentNumber'), value: person.document || '—', icon: 'card-outline' as const },
    { label: t('academic.emailLabel'), value: person.email || '—', icon: 'mail-outline' as const },
    { label: t('environments.detail.createdAt'), value: person.createdAt ? formatDateTime(person.createdAt) : '—', icon: 'calendar-outline' as const },
    { label: t('environments.detail.updatedAt'), value: person.updatedAt ? formatDateTime(person.updatedAt) : '—', icon: 'time-outline' as const },
    ...(person.instructorType
      ? [{
          label: t('academic.instructorType'),
          value: t(person.instructorType === 'transversal'
            ? 'academic.instructorTypeTransversalShort'
            : 'academic.instructorTypeEspecificoShort'),
          icon: 'ribbon-outline' as const,
        }]
      : []),
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.accent, { backgroundColor: theme.primary }]} />
          <View style={styles.header}>
            <View style={[styles.avatar, { backgroundColor: theme.primaryFaint, borderColor: theme.primary + '55' }]}>
              <Text style={[styles.initials, { color: theme.primary }]}>{initials || '?'}</Text>
            </View>
            <View style={styles.heading}>
              <Text style={[styles.title, { color: text }]}>{title}</Text>
              <Text style={[styles.subtitle, { color: muted }]} numberOfLines={2}>{fullName}</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              onPress={onClose}
              style={[styles.closeIcon, { backgroundColor: theme.surfaceSecondary }]}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color={muted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.fields} showsVerticalScrollIndicator={false}>
            {fields.map(field => {
              const icon: IoniconName = field.icon;
              return (
                <View key={field.label} style={[styles.field, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                  <View style={[styles.fieldIcon, { backgroundColor: theme.primaryFaint }]}>
                    <Ionicons name={icon} size={18} color={theme.primary} />
                  </View>
                  <View style={styles.fieldContent}>
                    <Text style={[styles.label, { color: muted }]}>{field.label}</Text>
                    <Text selectable style={[styles.value, { color: text }]}>{field.value}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: theme.primary }]}
              activeOpacity={0.82}
            >
              <Text style={styles.closeLabel}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.68)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  sheet: { width: '100%', maxWidth: 560, maxHeight: '88%', alignSelf: 'center', borderRadius: 22, borderWidth: 1, overflow: 'hidden', elevation: 16, shadowColor: Colors.black, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24 },
  accent: { height: 4, width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingTop: 22, paddingBottom: 18 },
  avatar: { width: 54, height: 54, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  heading: { flex: 1, minWidth: 0 },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.black },
  subtitle: { fontSize: FontSize.sm, marginTop: 4, lineHeight: 18 },
  closeIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexShrink: 1 },
  fields: { paddingHorizontal: 22, paddingBottom: 18, gap: 9 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12 },
  fieldIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  fieldContent: { flex: 1, minWidth: 0 },
  label: { fontSize: FontSize.xs, marginBottom: 3 },
  value: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, lineHeight: 20 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 22, paddingTop: 15, paddingBottom: 20 },
  closeButton: { alignItems: 'center', justifyContent: 'center', borderRadius: 12, minHeight: 48, paddingHorizontal: 16 },
  closeLabel: { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
