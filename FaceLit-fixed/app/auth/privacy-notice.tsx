// ─────────────────────────────────────────────
//  app/auth/privacy-notice.tsx
//  Aviso de privacidad — con i18n
// ─────────────────────────────────────────────
import GradientBackground from '@/shared/components/layout/GradientBackground';
import { Colors } from '@/shared/constants/colors';
import { Routes } from '@/shared/constants/routes';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PRIVACY_URL = 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981';

export default function PrivacyNoticeScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const cardBg    = isDark ? Colors.dark.surface   : Colors.white;
  const textColor = isDark ? Colors.dark.text      : Colors.black;
  const muted     = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const linkColor = isDark ? Colors.primaryLight   : Colors.primary;

  // Array definido DENTRO del componente para acceder a t()
  const LIST_ITEMS = [
    t('privacyNotice.item1'),
    t('privacyNotice.item2'),
    t('privacyNotice.item3'),
    t('privacyNotice.item4'),
  ];

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.card, { backgroundColor: cardBg }]}>

          {/* Cerrar */}
          <TouchableOpacity
            style={s.closeBtn}
            onPress={() => router.replace(Routes.AUTH.LOGIN as any)}
          >
            <Text style={[s.closeText, { color: textColor }]}>✕</Text>
          </TouchableOpacity>

          {/* Título */}
          <Text style={[s.title, { color: textColor }]}>
            {t('privacyNotice.title')}
          </Text>
          <Text style={[s.subtitle, { color: muted }]}>
            {t('privacyNotice.subtitle')}
          </Text>

          {/* Cuerpo */}
          <Text style={[s.body, { color: textColor }]}>
            {t('privacyNotice.body1')}
          </Text>

          {/* Lista */}
          {LIST_ITEMS.map((item) => (
            <View key={item} style={s.listRow}>
              <Text style={[s.bullet, { color: textColor }]}>•</Text>
              <Text style={[s.listItem, { color: textColor }]}>{item}</Text>
            </View>
          ))}

          {/* Advertencia */}
          <Text style={s.warning}>
            {t('privacyNotice.warning')}
          </Text>

          {/* Derechos */}
          <Text style={[s.body, { color: textColor }]}>
            {t('privacyNotice.body2')}
          </Text>

          {/* Link */}
          <Text style={[s.body, { color: textColor }]}>
            <Text style={s.bold}>{t('privacyNotice.moreInfo')}</Text>
            <Text
              style={[s.link, { color: linkColor }]}
              onPress={() => Linking.openURL(PRIVACY_URL)}
            >
              {PRIVACY_URL}
            </Text>
          </Text>

        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const s = StyleSheet.create({
  scroll: {
    flexGrow:          1,
    justifyContent:    'center',
    alignItems:        'center',
    paddingHorizontal: 20,
    paddingVertical:   30,
  },
  card: {
    width:             '100%',
    maxWidth:          800,        // ← aumentado (antes 520)
    borderRadius:      26,
    paddingHorizontal: 26,
    paddingVertical:   28,
    shadowOffset:      { width: 0, height: 10 },
    shadowOpacity:     0.18,
    shadowRadius:      18,
    elevation:         8,
  },
  closeBtn:  { alignSelf: 'flex-end', marginBottom: 8 },
  closeText: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold },

  title:    { fontSize: FontSize['3xl'], fontWeight: FontWeight.black, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: FontSize.base,  textAlign: 'center',          marginBottom: 40 },

  body:     { fontSize: FontSize.base, lineHeight: 22, marginBottom: 14 },
  listRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, paddingLeft: 6 },
  bullet:   { fontSize: FontSize.base, marginRight: 8, lineHeight: 22 },
  listItem: { flex: 1, fontSize: FontSize.base, lineHeight: 22 },
  warning:  { fontSize: FontSize.base, color: Colors.error, marginVertical: 12, lineHeight: 22, fontWeight: FontWeight.bold },
  bold:     { fontWeight: FontWeight.bold },
  link:     { fontSize: FontSize.base, fontWeight: FontWeight.bold, textDecorationLine: 'underline' },
});