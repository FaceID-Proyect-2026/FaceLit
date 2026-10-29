import { Colors } from "@/shared/constants/colors";
import { Routes } from "@/shared/constants/routes";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import type { ApprenticeFacialModel } from '@/features/facial/hooks/useApprenticeFacial';
import { s } from '@/features/facial/components/apprenticeFacialStyles';

export function FacialRegistrationComplete({ model }: { model: Pick<ApprenticeFacialModel, "theme" | "t" | "text" | "muted" | "bg"> }) {
  const { theme, t, text, muted, bg } = model;
  return (
    <View
      style={[
        s.safe,
        {
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        },
      ]}
    >
      <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
      <Text style={[s.successTitle, { color: text, marginTop: 20 }]}>
        {t("facialReg.successTitle")}
      </Text>
      <Text style={[{ color: muted, textAlign: "center", marginTop: 8 }]}>
        {t("facialReg.successMessage")}
      </Text>
      <TouchableOpacity
        onPress={() => router.replace(Routes.APPRENTICE.DASHBOARD as any)}
        style={[
          s.primaryBtn,
          { marginTop: 32, backgroundColor: theme.primary },
        ]}
      >
        <Ionicons name="home-outline" size={18} color={Colors.white} />
        <Text style={s.primaryBtnText}>{t("common.back")}</Text>
      </TouchableOpacity>
    </View>
  );
}
