import { Colors } from "@/shared/constants/colors";
import { FontSize, FontWeight } from "@/shared/constants/typography";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

interface MobileFacialNoticeProps {
  attendanceRoute: string;
}

export default function MobileFacialNotice(_props: MobileFacialNoticeProps) {
  const { theme, isDark } = useTheme();
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const background = isDark ? Colors.dark.background : Colors.light.background;

  return (
    <View style={[s.safe, { backgroundColor: background }]}>
      <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[s.icon, { backgroundColor: theme.primary + "18" }]}>
          <Ionicons name="desktop-outline" size={34} color={theme.primary} />
        </View>
        <Text style={[s.title, { color: text }]}>Reconocimiento facial no disponible</Text>
        <Text style={[s.body, { color: muted }]}>Esta función no es válida para celulares. El registro facial solo se realiza desde la versión web. Desde tu celular solo puedes revisar la asistencia y mantenerte al día con tus notificaciones.</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 470, borderWidth: 1, borderRadius: 20, padding: 26, alignItems: "center" },
  icon: { width: 68, height: 68, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.black, textAlign: "center", marginTop: 16 },
  body: { fontSize: FontSize.base, lineHeight: 22, textAlign: "center", marginTop: 10 },
});
