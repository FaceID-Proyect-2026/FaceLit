// ─────────────────────────────────────────────
//  app/admin/_layout.tsx
//  Layout principal admin con sidebar y header
// ─────────────────────────────────────────────
import Sidebar from "@/shared/components/layout/Sidebar";
import { fetchCurrentActiveEnvironmentSession } from "@/features/environments/environmentSessionApi";
import { useFacialRegistry } from "@/features/facial/useFacialRegistry";
import { clearFacialCameraGuard } from "@/features/facial/facialStore";
import { useNotifications } from "@/features/notifications/useNotifications";
import { LanguageSelector, ThemeToggle } from "@/shared/components/ui";
import { Colors } from "@/shared/constants/colors";
import { FontSize, FontWeight } from "@/shared/constants/typography";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { useRoleGuard } from "@/shared/hooks/useRoleGuard";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, usePathname } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminLayout() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { theme, isDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { canRenderContent } = useRoleGuard({ isAuthenticated, role: user?.role ?? null, allowedRoles: ['INSTRUCTOR'], authLoading });
  const { unreadCount } = useNotifications();
  const pathname = usePathname();
  const { setActiveSession } = useFacialRegistry(user?.id);
  const sessionLookupDone = useRef(false);
  const [checkingActiveSession, setCheckingActiveSession] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setCheckingActiveSession(false);
      return;
    }
    if (sessionLookupDone.current) return;
    sessionLookupDone.current = true;
    fetchCurrentActiveEnvironmentSession().then((session) => {
      if (!session) return;
      setActiveSession({
        idRecordEnvironment: session.idRecordEnvironment,
        idEnvironment: session.idEnvironment,
        environmentName: session.environmentName,
        idDevice: session.idDevice,
        deviceCode: session.deviceCode,
        idChip: session.idChip,
        chipCode: session.chipCode,
        idInstructorScheduled: session.idInstructorScheduled,
        instructorScheduledName: session.instructorScheduledName,
        idInstructorInCharge: session.idInstructorInCharge,
        instructorInChargeName: session.instructorInChargeName,
        shutdownTime: session.shutdownTime,
        active: session.active,
      });
    }).catch(() => undefined).finally(() => setCheckingActiveSession(false));
  }, [isAuthenticated, setActiveSession]);

  useEffect(() => {
    if (pathname === "/auth/login") {
      clearFacialCameraGuard();
    }
  }, [pathname]);

  // La contraseña se solicita únicamente desde la cámara, al intentar
  // abandonar una sesión facial en curso.
  const isFacialLockedScreen =
    pathname.startsWith("/admin/facial") ||
    pathname.startsWith("/instructor/facial");
  const isInstructorFacialHome = pathname === "/instructor/facial";
  // En celular la pantalla facial es informativa, pero debe conservar una
  // vía clara para volver a las opciones del instructor.
  const showMobileFacialMenu = Platform.OS !== "web" && isInstructorFacialHome;

  if (!canRenderContent || checkingActiveSession) {
    return (
      <SafeAreaView
        style={[
          sal.safe,
          {
            backgroundColor: isDark
              ? Colors.dark.background
              : Colors.light.background,
          },
        ]}
      >
        <View style={sal.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const headerBg = isDark ? Colors.dark.surface : Colors.light.surface;
  const border = isDark ? Colors.dark.border : Colors.light.border;

  return (
    <SafeAreaView style={[sal.safe, { backgroundColor: bg }]} edges={["top"]}>
      {/* Header */}
      <View
        style={[
          sal.header,
          { backgroundColor: headerBg, borderBottomColor: border },
        ]}
      >
        <View style={sal.headerLeft}>
          {isInstructorFacialHome && (
            <TouchableOpacity
              onPress={() => {
                router.replace("/instructor" as any);
              }}
              style={sal.menuBtn}
              accessibilityLabel="Volver al inicio del instructor"
            >
              <Ionicons name="arrow-back" size={22} color={text} />
            </TouchableOpacity>
          )}
          {(!isFacialLockedScreen || showMobileFacialMenu) && (
            <TouchableOpacity
              onPress={() => setSidebarOpen(!sidebarOpen)}
              style={sal.menuBtn}
            >
              <Ionicons
                name={sidebarOpen ? "close" : "menu"}
                size={22}
                color={text}
              />
            </TouchableOpacity>
          )}
          <Text style={[sal.headerTitle, { color: theme.primary }]}>
            FaceLit
          </Text>
        </View>
        <View style={sal.headerRight}>
          <LanguageSelector />
          <ThemeToggle />
          <TouchableOpacity
            onPress={() => router.push("/notifications" as any)}
            style={sal.iconBtn}
          >
            <Ionicons name="notifications-outline" size={20} color={text} />
            {unreadCount > 0 && (
              <View style={[sal.notificationBadge, { backgroundColor: theme.primary }]}>
                <Text style={sal.notificationBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* En móvil el módulo facial conserva el acceso al menú; en web queda
          bloqueado para evitar salir accidentalmente de la sesión facial. */}
      {(!isFacialLockedScreen || showMobileFacialMenu) && (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      {/* Content */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
          animation: "slide_from_right",
          animationDuration: 240,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="facial/index" />
        <Stack.Screen name="facial/settings" />
        <Stack.Screen name="facial/camera" />
        <Stack.Screen name="facial/exit" />
        <Stack.Screen name="environments/index" />
        <Stack.Screen
          name="environments/register"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            animationDuration: 260,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen name="environments/[id]" />
        <Stack.Screen name="academic/index" />
        <Stack.Screen
          name="academic/programs/register"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            animationDuration: 260,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen name="academic/programs/[id]" />
        <Stack.Screen
          name="academic/fichas/register"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            animationDuration: 260,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen name="academic/fichas/[id]" />
        <Stack.Screen name="attendance/index" />
        <Stack.Screen name="attendance/[id]" />
        <Stack.Screen name="reports/index" />
        <Stack.Screen name="reports/by-user" />
        <Stack.Screen name="reports/by-ficha" />
        <Stack.Screen name="reports/calendar" />
        <Stack.Screen name="reports/my-performance" />
        <Stack.Screen name="reports/excuses-review" />
      </Stack>
    </SafeAreaView>
  );
}

const sal = StyleSheet.create({
  safe: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
