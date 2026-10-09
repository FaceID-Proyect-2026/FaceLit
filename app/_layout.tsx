// ─────────────────────────────────────────────
//  app/_layout.tsx
//  Root layout con AuthProvider + temas + i18n
// ─────────────────────────────────────────────
import { useUserSettings } from "@/features/profile/useUserSettings";
import { refreshAcademicStoreFromBackend } from "@/features/academic/useAcademic";
import { clearAcademicStore } from "@/features/academic/academicStore";
import { loadNotifications } from "@/features/notifications/notificationsStore";
import { getToken } from "@/shared/services/tokenStorage";
import {
  requestRealtimeSync,
  startRealtime,
  subscribeRealtime,
} from "@/shared/services/realtime";
import type { RealtimeMessage } from "@/shared/services/realtime";
const { AuthProvider, useAuth } = require("@/shared/contexts/AuthContext") as {
  AuthProvider: React.ComponentType<React.PropsWithChildren>;
  useAuth: () => {
    isAuthenticated: boolean;
    loading: boolean;
    user?: { id?: string; role: string } | null;
  };
};
const { ThemeProvider, useTheme } = require("@/shared/contexts/ThemeContext") as {
  ThemeProvider: React.ComponentType<React.PropsWithChildren>;
  useTheme: () => { theme: { background: string; statusBar: "light" | "dark" } };
};
import i18n from "@/shared/i18n/index";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { AppState, LogBox, StyleSheet, View } from "react-native";

const { I18nProvider } = require("@/shared/contexts/I18nContext") as {
  I18nProvider: React.ComponentType<React.PropsWithChildren>;
};

LogBox.ignoreLogs([
  "DateTimePicker: onChange is deprecated",
  "Cannot connect to Expo CLI",
]);

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
  }, [authLoading, isAuthenticated, applied, loadAndApply]);

  return null;
}

function AcademicDataLoader() {
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user?.id) clearAcademicStore();
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (authLoading || !user?.id) return;
    void refreshAcademicStoreFromBackend(user.role).catch(error => {
      console.warn('No se pudo sincronizar la información académica:', error);
    });
  }, [authLoading, user?.id, user?.role]);

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

function RealtimeSync() {
  const { isAuthenticated, user } = useAuth();
  const { reloadAndApply } = useUserSettings();

  const synchronize = useCallback((message: RealtimeMessage) => {
    if (message.type === "ready" || message.type === "sync") {
      void refreshAcademicStoreFromBackend(user?.role).catch(error => {
        console.warn("[Realtime] No se pudo sincronizar la información académica:", error);
      });
      void loadNotifications();
      void reloadAndApply().catch(error => {
        console.warn("[Realtime] No se pudo sincronizar la configuración del usuario:", error);
      });
      return;
    }

    if (message.type === "authentication.failed") {
      console.warn("[Realtime] El canal WebSocket rechazó la sesión; la autenticación REST se mantiene activa.");
      return;
    }
    if (message.type !== "data.changed") return;
    if (message.resource === "academic" || message.resource === "users") {
      void refreshAcademicStoreFromBackend(user?.role).catch(error => {
        console.warn("[Realtime] No se pudo actualizar la información académica:", error);
      });
    }
    if (message.resource === "notifications" || message.resource === "attendance") {
      void loadNotifications();
    }
    if (message.resource === "user-configuration" && message.actorId === user?.id) {
      void reloadAndApply().catch(error => {
        console.warn("[Realtime] No se pudo actualizar la configuración del usuario:", error);
      });
    }
  }, [reloadAndApply, user?.id, user?.role]);
  const synchronizeRef = useRef(synchronize);

  useEffect(() => {
    synchronizeRef.current = synchronize;
  }, [synchronize]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    let active = true;
    let stop: (() => void) | undefined;
    const unsubscribe = subscribeRealtime(message => synchronizeRef.current(message));

    void getToken().then(token => {
      if (active && token) stop = startRealtime(token);
    }).catch(error => {
      console.warn("[Realtime] No se pudo recuperar el token de sesión:", error);
    });

    const appStateSubscription = AppState.addEventListener("change", state => {
      if (state === "active") requestRealtimeSync();
    });

    return () => {
      active = false;
      unsubscribe();
      appStateSubscription.remove();
      stop?.();
    };
  }, [isAuthenticated, user?.id]);

  return null;
}

function RootLayoutInner() {
  const { theme } = useTheme();

  const screens = [
    React.createElement(Stack.Screen, { key: "index", name: "index" }),
    React.createElement(Stack.Screen, { key: "login", name: "auth/login", options: { animation: "slide_from_bottom" } }),
    React.createElement(Stack.Screen, { key: "recovery", name: "auth/password-recovery", options: { animation: "slide_from_right" } }),
    React.createElement(Stack.Screen, { key: "verify", name: "auth/verify-identity", options: { animation: "slide_from_right" } }),
    React.createElement(Stack.Screen, { key: "new-password", name: "auth/new-password", options: { animation: "slide_from_right" } }),
    React.createElement(Stack.Screen, { key: "admin", name: "admin" }),
    React.createElement(Stack.Screen, { key: "instructor", name: "instructor" }),
    React.createElement(Stack.Screen, { key: "apprentice", name: "apprentice" }),
    React.createElement(Stack.Screen, { key: "notifications", name: "notifications/index", options: { animation: "slide_from_right" } }),
    React.createElement(Stack.Screen, { key: "profile", name: "profile/index", options: { animation: "slide_from_right" } }),
    React.createElement(Stack.Screen, { key: "settings", name: "profile/settings", options: { animation: "slide_from_right" } }),
  ];
  return React.createElement(
    View,
    { style: [s.root, { backgroundColor: theme.background }] },
    React.createElement(StatusBar, { style: theme.statusBar }),
    React.createElement(Stack, { screenOptions: { headerShown: false, contentStyle: { backgroundColor: "transparent" }, animation: "slide_from_right" } }, screens),
  );
}

export default function RootLayout() {
  return React.createElement(
    I18nextProvider,
    { i18n },
    React.createElement(
      ThemeProvider,
      null,
      React.createElement(
        I18nProvider,
        null,
        React.createElement(
          AuthProvider,
          null,
          React.createElement(UserSettingsLoader),
          React.createElement(AcademicDataLoader),
          React.createElement(RealtimeSync),
          React.createElement(RootLayoutInner),
        ),
      ),
    ),
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
});
