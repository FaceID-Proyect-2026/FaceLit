import { useNotifications } from "@/features/notifications/useNotifications";
import Sidebar from "@/shared/components/layout/Sidebar";
import { LanguageSelector, ThemeToggle } from "@/shared/components/ui";
import { Colors } from "@/shared/constants/colors";
import { FontSize, FontWeight } from "@/shared/constants/typography";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function RoleTopbar() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount } = useNotifications({ recipientUserId: user?.role === "APPRENTICE" ? user?.id : undefined });

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const headerBg = isDark ? Colors.dark.surface : Colors.light.surface;
  const border = isDark ? Colors.dark.border : Colors.light.border;

  return (
    <>
      <View style={[s.header, { backgroundColor: headerBg, borderBottomColor: border, paddingTop: Math.max(insets.top, 10) + 8 }]}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => setSidebarOpen(value => !value)} style={s.menuBtn} activeOpacity={0.75}>
            <Ionicons name={sidebarOpen ? "close" : "menu"} size={22} color={text} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: theme.primary }]}>FaceLit</Text>
        </View>
        <View style={s.headerRight}>
          <LanguageSelector />
          <ThemeToggle />
          <TouchableOpacity onPress={() => router.push("/notifications" as any)} style={s.iconBtn} activeOpacity={0.75}>
            <Ionicons name="notifications-outline" size={20} color={text} />
            {unreadCount > 0 && (
              <View style={[s.notificationBadge, { backgroundColor: theme.primary }]}>
                <Text style={s.notificationBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}

export default memo(RoleTopbar);

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    position: "relative",
    zIndex: 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { padding: 4 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { padding: 6 },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  notificationBadgeText: { color: Colors.white, fontSize: 9, fontWeight: "900" },
});
