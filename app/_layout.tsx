// ─────────────────────────────────────────────
//  app/_layout.tsx
//  Root layout con AuthProvider + temas + i18n
// ─────────────────────────────────────────────
import { useUserSettings } from "@/features/profile/useUserSettings";
import { refreshAcademicStoreFromBackend } from "@/features/academic/useAcademic";
import { clearAcademicStore } from "@/features/academic/academicStore";
import { AuthProvider, useAuth } from "@/shared/contexts/AuthContext";
import { I18nProvider } from "@/shared/contexts/I18nContext";
import { ThemeProvider, useTheme } from "@/shared/contexts/ThemeContext";
import i18n from "@/shared/i18n/index";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { AppState, StyleSheet, View } from "react-native";

// ── Carga y aplica las preferencias guardadas del usuario
//    (tema, idioma, notificaciones) apenas hay sesión activa ──
function UserSettingsLoader() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { loadAndApply } = useUserSettings();
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated && !applied) {
      loadAndApply();
      setApplied(true);
    }
    if (!isAuthenticated) {
      setApplied(false); // permite recargar la próxima vez que inicie sesión
    }
  }, [authLoading, isAuthenticated, applied]);

  return null;
}

function AcademicDataLoader() {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!authLoading && !user?.id) clearAcademicStore();
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (authLoading || !user?.id) return;
    void refreshAcademicStoreFromBackend(user.role).catch(error => {
      console.warn('No se pudo sincronizar la información académica:', error);
    });
  }, [authLoading, pathname, user?.id, user?.role]);

  useEffect(() => {
    if (authLoading || !user?.id) return;
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void refreshAcademicStoreFromBackend(user.role).catch(error => {
          console.warn('No se pudo actualizar la información académica:', error);
        });
      }
    });
    return () => subscription.remove();
  }, [authLoading, user?.id, user?.role]);

  return null;
}

function RootLayoutInner() {
  const { theme } = useTheme();

  return (
    <View style={[s.root, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBar} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" options={{ animation: "fade" }} />
        {/* Auth — RF-1: solo login y recuperación de contraseña */}
        <Stack.Screen
          name="auth/login"
          options={{
            // Deslizamiento hacia arriba al entrar, más profundidad visual
            animation: "slide_from_bottom",
            animationDuration: 380,
          }}
        />
        <Stack.Screen
          name="auth/password-recovery"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="auth/verify-identity"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="auth/new-password"
          options={{ animation: "slide_from_right" }}
        />
        {/* Dashboards por rol */}
        <Stack.Screen name="admin" options={{ animation: "fade" }} />
        <Stack.Screen name="instructor" options={{ animation: "fade" }} />
        <Stack.Screen name="apprentice" options={{ animation: "fade" }} />
        <Stack.Screen
          name="notifications/index"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="profile/index"
          options={{ animation: "slide_from_right" }}
        />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <UserSettingsLoader />
            <AcademicDataLoader />
            <RootLayoutInner />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
});
