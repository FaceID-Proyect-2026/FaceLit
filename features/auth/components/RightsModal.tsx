// ─────────────────────────────────────────────
//  features/auth/components/RightsModal.tsx
//  Vista pura: modal informativo de derechos.
//  No contiene lógica de negocio, solo presentación.
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RightsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function RightsModal({ visible, onClose }: RightsModalProps) {
  const { t }             = useTranslation();
  const { theme, isDark } = useTheme();

  const RIGHTS = [
    { icon: 'eye-outline'              as const, title: t('rights.items.access.title'),        desc: t('rights.items.access.desc') },
    { icon: 'create-outline'           as const, title: t('rights.items.update.title'),        desc: t('rights.items.update.desc') },
    { icon: 'shield-checkmark-outline' as const, title: t('rights.items.rectification.title'), desc: t('rights.items.rectification.desc') },
    { icon: 'trash-outline'            as const, title: t('rights.items.deletion.title'),      desc: t('rights.items.deletion.desc') },
    { icon: 'ban-outline'              as const, title: t('rights.items.revocation.title'),    desc: t('rights.items.revocation.desc') },
  ];

  const text        = isDark ? '#FFFFFF' : '#111111';
  const muted       = isDark ? '#A8BCA6' : '#555555';
  const cardBg      = isDark ? '#07120D' : '#FFFFFF';
  const itemBg      = isDark ? 'rgba(255,255,255,0.04)' : '#F6FBF6';
  const itemBorder  = isDark ? 'rgba(101,179,97,0.18)'  : 'rgba(101,179,97,0.20)';
  const importantBg = isDark ? 'rgba(101,179,97,0.12)'  : 'rgba(101,179,97,0.10)';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={rm.overlay}>
        <View style={[rm.card, { backgroundColor: cardBg }]}>

          <TouchableOpacity
            onPress={onClose}
            style={[rm.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={muted} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={rm.iconWrap}>
              <LinearGradient colors={['#7DD87A', '#65B361', '#4A9146']} style={rm.iconCircle}>
                <Ionicons name="shield-checkmark" size={30} color="#FFFFFF" />
              </LinearGradient>
            </View>

            <Text style={[rm.title, { color: text }]}>
              {t('rights.title1')}{'\n'}
              <Text style={{ color: theme.primary }}>{t('rights.title2')}</Text>
            </Text>

            <Text style={[rm.subtitle, { color: muted }]}>
              {t('rights.subtitle')}{' '}
              <Text style={{ color: theme.primary, fontWeight: '700' }}>{t('rights.lawLabel')}</Text>
            </Text>

            <View style={[rm.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]} />

            {RIGHTS.map((r, i) => (
              <View key={i} style={[rm.rightItem, { backgroundColor: itemBg, borderColor: itemBorder }]}>
                <View style={[rm.rightIconWrap, { backgroundColor: theme.primary + '20' }]}>
                  <Ionicons name={r.icon} size={18} color={theme.primary} />
                </View>
                <View style={rm.rightContent}>
                  <Text style={[rm.rightTitle, { color: theme.primary }]}>{r.title}</Text>
                  <Text style={[rm.rightDesc,  { color: muted }]}>{r.desc}</Text>
                </View>
              </View>
            ))}

            <View style={[rm.importantBox, { backgroundColor: importantBg, borderColor: theme.primary + '40' }]}>
              <Ionicons name="information-circle-outline" size={18} color={theme.primary} style={{ marginBottom: 6 }} />
              <Text style={[rm.importantText, { color: text }]}>
                <Text style={[rm.importantBold, { color: theme.primary }]}>{t('rights.importantLabel')}</Text>
                {t('rights.importantText')}
              </Text>
            </View>
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}

const rm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  card: {
    width: '100%', maxWidth: 480, borderRadius: 26,
    paddingHorizontal: 24, paddingVertical: 28,
    maxHeight: '90%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 12,
  },
  closeBtn: {
    alignSelf: 'flex-end', width: 34, height: 34,
    borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  iconWrap:   { alignItems: 'center', marginBottom: 16 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: '#65B361', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 },
  title:    { fontSize: 22, fontWeight: '900', textAlign: 'center', lineHeight: 30, marginBottom: 8 },
  subtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  divider:  { height: 1, marginBottom: 20 },
  rightItem:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
  rightIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rightContent:  { flex: 1 },
  rightTitle:    { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  rightDesc:     { fontSize: 13, lineHeight: 19 },
  importantBox:  { borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 10, marginBottom: 8, alignItems: 'center' },
  importantText: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  importantBold: { fontWeight: '800' },
});
