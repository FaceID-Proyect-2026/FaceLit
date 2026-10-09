// ─────────────────────────────────────────────
//  shared/components/layout/Sidebar.tsx
//  Sidebar de navegación para admin/instructor
// ─────────────────────────────────────────────
import { Colors } from "@/shared/constants/colors";
import { Routes } from "@/shared/constants/routes";
import { FontSize, FontWeight } from "@/shared/constants/typography";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    Animated,
    Easing,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  module: string;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: 240,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [isOpen, progress]);

  if (!mounted) return null;

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const activeBg = isDark ? "rgba(101,179,97,0.15)" : "rgba(101,179,97,0.10)";
  const bg = isDark ? Colors.dark.surface : Colors.light.surface;
  const border = isDark ? Colors.dark.border : Colors.light.border;
  const roleLabel =
    user?.role === "ADMINISTRATOR"
      ? t("sidebar.administratorRole")
      : user?.role === "COORDINATOR" || user?.role === "COORDINATOR_REGISTER"
        ? t("sidebar.coordinatorRole")
        : user?.role === "INSTRUCTOR"
          ? t("sidebar.instructorRole")
          : t("sidebar.apprenticeRole");

  const adminMenu: MenuItem[] = [
    {
      icon: "grid-outline",
      label: t("sidebar.dashboard"),
      route: Routes.ADMIN.DASHBOARD,
      module: "dashboard",
    },
    // RF-10.5 — solo COORDINATOR puede crear/gestionar usuarios (COORDINATOR_REGISTER no ve este ítem)
    ...(user?.role === "ADMINISTRATOR" || user?.role === "COORDINATOR"
      ? [
          {
            icon: "people-outline",
            label: t("sidebar.users"),
            route: Routes.ADMIN.USERS,
            module: "users",
          },
        ]
      : []),
    {
      icon: "school-outline",
      label: t("sidebar.academic"),
      route: Routes.ACADEMIC.PROGRAMS,
      module: "academic",
    },
    {
      icon: "checkmark-circle-outline",
      label: t("sidebar.attendance"),
      route: Routes.ATTENDANCE.LIST,
      module: "attendance",
    },
    {
      icon: "notifications-outline",
      label: t("sidebar.notifications"),
      route: Routes.NOTIFICATIONS.CENTER,
      module: "notifications",
    },
    {
      icon: "person-outline",
      label: t("sidebar.profile"),
      route: Routes.PROFILE.VIEW,
      module: "profile",
    },
  ];

  const instructorMenu: MenuItem[] = [
    {
      icon: "grid-outline",
      label: t("sidebar.dashboard"),
      route: "/instructor",
      module: "dashboard",
    },
    {
      icon: "checkmark-circle-outline",
      label: t("sidebar.attendance"),
      route: Routes.ATTENDANCE.INSTRUCTOR,
      module: "attendance",
    },
    {
      icon: "scan-outline",
      label: t("sidebar.facial"),
      route: Routes.INSTRUCTOR.FACIAL,
      module: "facial",
    },
    {
      icon: "notifications-outline",
      label: t("sidebar.notifications"),
      route: Routes.NOTIFICATIONS.CENTER,
      module: "notifications",
    },
    {
      icon: "person-outline",
      label: t("sidebar.profile"),
      route: Routes.PROFILE.VIEW,
      module: "profile",
    },
  ];

  const apprenticeMenu: MenuItem[] = [
    {
      icon: "grid-outline",
      label: t("sidebar.dashboard"),
      route: "/apprentice",
      module: "dashboard",
    },
    {
      icon: "checkmark-circle-outline",
      label: t("sidebar.myAttendance"),
      route: Routes.ATTENDANCE.APPRENTICE,
      module: "attendance",
    },
    {
      icon: "scan-outline",
      label: t("sidebar.facialRecognition"),
      route: Routes.APPRENTICE.FACIAL,
      module: "facial",
    },
    {
      icon: "notifications-outline",
      label: t("sidebar.notifications"),
      route: Routes.NOTIFICATIONS.CENTER,
      module: "notifications",
    },
    {
      icon: "person-outline",
      label: t("sidebar.profile"),
      route: Routes.PROFILE.VIEW,
      module: "profile",
    },
  ];

  // ✅ FIX: roles del backend vienen en MAYÚSCULAS
  // RF-10.5: COORDINATOR_REGISTER usa el mismo panel admin
  const menu =
    user?.role === "ADMINISTRATOR" ||
    user?.role === "COORDINATOR" ||
    user?.role === "COORDINATOR_REGISTER"
      ? adminMenu
      : user?.role === "INSTRUCTOR"
        ? instructorMenu
        : apprenticeMenu;

  const isActive = (route: string) => {
    if (
      route === "/admin" ||
      route === "/instructor" ||
      route === "/apprentice"
    ) {
      return pathname === route;
    }
    return pathname.startsWith(route.split("[")[0]);
  };
  const sidebarX = progress.interpolate({ inputRange: [0, 1], outputRange: [-332, 0] });
  const sidebarScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] });
  const backdropOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  // ✅ FIX: iniciales con respaldo si no hay firstName/lastName
  const getInitials = () => {
    if (user?.firstName) {
      return `${user.firstName.charAt(0)}${user.lastName?.charAt(0) ?? ""}`.toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() ?? "?";
  };

  // ✅ FIX: nombre a mostrar con respaldo al email
  const getDisplayName = () => {
    if (user?.firstName) {
      return `${user.firstName} ${user.lastName ?? ""}`.trim();
    }
    return user?.email ?? "";
  };

  return (
    <View style={ss.overlay}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        activeOpacity={1}
      />
      <Animated.View style={[ss.backdrop, { opacity: backdropOpacity }]} pointerEvents="none" />
      <Animated.View
        style={[
          ss.sidebar,
          {
            backgroundColor: bg,
            borderRightColor: border,
            transform: [{ translateX: sidebarX }, { scale: sidebarScale }],
          },
        ]}
      >
        <View style={[ss.glowTop, { backgroundColor: theme.primary + "18" }]} />
        <View style={[ss.glowBottom, { backgroundColor: theme.primary + "10" }]} />
        {/* Header */}
        <View style={[ss.header, { borderBottomColor: border, paddingTop: Math.max(insets.top + 14, 28) }]}>
          <View>
            <Text style={[ss.logo, { color: theme.primary }]}>FaceLit</Text>
            <Text style={[ss.logoMeta, { color: muted }]}>{t("sidebar.navigationPanel")}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={[ss.closeBtn, { backgroundColor: activeBg }]}>
            <Ionicons name="close" size={22} color={muted} />
          </TouchableOpacity>
        </View>

        {/* User info */}
        {user && (
          <View style={[ss.userSection, { borderBottomColor: border }]}>
            <View style={[ss.avatar, { backgroundColor: theme.primary }]}>
              <Text style={ss.avatarText}>{getInitials()}</Text>
            </View>
            <View style={ss.userInfo}>
              <Text style={[ss.userName, { color: text }]} numberOfLines={1}>
                {getDisplayName()}
              </Text>
              <Text style={[ss.userRole, { color: muted }]}>
                {roleLabel}
              </Text>
            </View>
          </View>
        )}

        {/* Menu items */}
        <ScrollView style={ss.menuScroll} showsVerticalScrollIndicator={false}>
          {menu.map((item, index) => {
            const active = isActive(item.route);
            const itemOpacity = progress.interpolate({
              inputRange: [0, Math.min(0.85, 0.22 + index * 0.08), 1],
              outputRange: [0, 0, 1],
            });
            const itemX = progress.interpolate({
              inputRange: [0, 1],
              outputRange: [-18 - index * 2, 0],
            });
            return (
              <Animated.View
                key={item.route}
                style={{ opacity: itemOpacity, transform: [{ translateX: itemX }] }}
              >
                <TouchableOpacity
                  onPress={() => {
                    router.push(item.route as any);
                    onClose();
                  }}
                  style={[
                    ss.menuItem,
                    {
                      backgroundColor: active ? activeBg : "transparent",
                      borderColor: active ? theme.primary + "45" : "transparent",
                      marginTop: index === 0 ? 4 : 2,
                    },
                  ]}
                  activeOpacity={0.72}
                >
                  {active && <View style={[ss.activeRail, { backgroundColor: theme.primary }]} />}
                  <View style={[ss.menuIconWrap, { backgroundColor: active ? theme.primary + "20" : theme.primary + "0D" }]}>
                    <Ionicons
                      name={item.icon as any}
                      size={21}
                      color={active ? theme.primary : muted}
                    />
                  </View>
                  <Text
                    style={[
                      ss.menuLabel,
                      {
                        color: active ? theme.primary : text,
                        fontWeight: active
                          ? FontWeight.bold
                          : FontWeight.medium,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={active ? theme.primary : muted} style={{ opacity: active ? 1 : 0.35 }} />
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>

        {/* Logout */}
        <TouchableOpacity
          onPress={logout}
          style={[ss.logoutBtn, { borderTopColor: border }]}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={[ss.logoutText, { color: Colors.error }]}>
            {t("sidebar.logout")}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const ss = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
    flexDirection: "row",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.56)",
  },
  sidebar: {
    width: 304,
    height: "100%",
    borderRightWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 8, height: 0 },
    elevation: 12,
    overflow: "hidden",
  },
  glowTop: { position: "absolute", width: 160, height: 160, borderRadius: 80, right: -58, top: -40 },
  glowBottom: { position: "absolute", width: 220, height: 220, borderRadius: 110, left: -90, bottom: 72 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  logo: { fontSize: FontSize["2xl"], fontWeight: FontWeight.black },
  logoMeta: { fontSize: FontSize.xs, marginTop: 2, fontWeight: FontWeight.medium },
  closeBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  userRole: { fontSize: FontSize.sm, marginTop: 2 },
  menuScroll: { flex: 1, paddingVertical: 12, paddingHorizontal: 10 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 7,
    borderWidth: 1,
    overflow: "hidden",
  },
  activeRail: { position: "absolute", left: 0, top: 9, bottom: 9, width: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  menuIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: FontSize.base },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  logoutText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
