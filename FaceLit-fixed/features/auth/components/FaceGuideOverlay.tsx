// ─────────────────────────────────────────────
//  features/auth/components/FaceGuideOverlay.tsx
//  Vista pura: marco guía + badge de estado de
//  posicionamiento. Sin lógica de negocio.
// ─────────────────────────────────────────────
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

interface FaceGuideOverlayProps {
  primaryColor: string;
  isPositioning: boolean;
}

export default function FaceGuideOverlay({ primaryColor, isPositioning }: FaceGuideOverlayProps) {
  const { t } = useTranslation();

  return (
    <View style={s.faceGuideContainer} pointerEvents="none">
      <View style={[
        s.faceGuide,
        { borderColor: isPositioning ? Colors.warning : primaryColor },
      ]} />
      <View style={[
        s.positionBadge,
        { backgroundColor: isPositioning ? Colors.warning : primaryColor },
      ]}>
        <Ionicons
          name={isPositioning ? 'resize-outline' : 'checkmark-circle'}
          size={14} color={Colors.white}
        />
        <Text style={s.positionBadgeText}>
          {isPositioning ? t('facialReg.moveCloser') : t('facialReg.goodPosition')}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  faceGuideContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  faceGuide:          { width: 170, height: 210, borderRadius: 90, borderWidth: 2, borderStyle: 'dashed' },
  positionBadge:      { position: 'absolute', bottom: 90, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  positionBadgeText:  { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});
