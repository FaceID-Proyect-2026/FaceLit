// ─────────────────────────────────────────────
//  features/auth/components/PrivacyNoticeModal.tsx
// ─────────────────────────────────────────────
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PRIVACY_URL = 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function PrivacyNoticeModal({ visible, onClose }: Props) {
    const { t } = useTranslation();
    const { isDark } = useTheme();

    const cardBg = isDark ? Colors.dark.surface : Colors.white;
    const textColor = isDark ? Colors.dark.text : Colors.black;
    const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
    const linkColor = isDark ? Colors.primaryLight : Colors.primary;

    const LIST_ITEMS = [
        t('privacyNotice.item1'),
        t('privacyNotice.item2'),
        t('privacyNotice.item3'),
        t('privacyNotice.item4'),
    ];

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
            <View style={s.overlay}>
                <View style={[s.card, { backgroundColor: cardBg }]}>
                    <ScrollView showsVerticalScrollIndicator={false}>

                        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={22} color={textColor} />
                        </TouchableOpacity>

                        <Text style={[s.title, { color: textColor }]}>{t('privacyNotice.title')}</Text>
                        <Text style={[s.subtitle, { color: muted }]}>{t('privacyNotice.subtitle')}</Text>

                        <Text style={[s.body, { color: textColor }]}>{t('privacyNotice.body1')}</Text>

                        {LIST_ITEMS.map((item) => (
                            <View key={item} style={s.listRow}>
                                <Text style={[s.bullet, { color: textColor }]}>•</Text>
                                <Text style={[s.listItem, { color: textColor }]}>{item}</Text>
                            </View>
                        ))}

                        <Text style={s.warning}>{t('privacyNotice.warning')}</Text>

                        <Text style={[s.body, { color: textColor }]}>{t('privacyNotice.body2')}</Text>
                        <Text style={[s.body, { color: muted, fontSize: FontSize.sm }]}>
                            {t('privacyNotice.articlesRef')}
                        </Text>
                        <Text style={[s.body, { color: textColor }]}>
                            <Text style={s.bold}>{t('privacyNotice.moreInfo')}</Text>
                            <Text style={[s.link, { color: linkColor }]} onPress={() => Linking.openURL(PRIVACY_URL)}>
                                {PRIVACY_URL}
                            </Text>
                        </Text>

                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 40 },
    card: { width: '100%', maxWidth: 700, maxHeight: '85%', borderRadius: 26, paddingHorizontal: 24, paddingVertical: 24 },
    closeBtn: { alignSelf: 'flex-end', marginBottom: 8 },
    title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: FontSize.base, textAlign: 'center', marginBottom: 24 },
    body: { fontSize: FontSize.base, lineHeight: 22, marginBottom: 14 },
    listRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, paddingLeft: 6 },
    bullet: { fontSize: FontSize.base, marginRight: 8, lineHeight: 22 },
    listItem: { flex: 1, fontSize: FontSize.base, lineHeight: 22 },
    warning: { fontSize: FontSize.base, color: Colors.error, marginVertical: 12, lineHeight: 22, fontWeight: FontWeight.bold },
    bold: { fontWeight: FontWeight.bold },
    link: { fontSize: FontSize.base, fontWeight: FontWeight.bold, textDecorationLine: 'underline' },
});