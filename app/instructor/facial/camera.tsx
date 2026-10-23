// ─────────────────────────────────────────────
//  app/instructor/facial/camera.tsx
//  Cámara de Reconocimiento Facial — Instructor
//
//  Abre una sesión para registrar rostros de varios aprendices de la ficha
//  configurada por el instructor.
// ─────────────────────────────────────────────
import FaceGuideOverlay from "@/features/auth/components/FaceGuideOverlay";
import WebCamera from "@/features/auth/components/WebCamera";
import { useFacialRegistry } from "@/features/facial/useFacialRegistry";
import { useSessionAttendanceCapture } from "@/features/facial/useSessionAttendanceCapture";
import { initializeFacialSessionAbsences } from "@/shared/services/facialAttendanceService";
import { Colors } from "@/shared/constants/colors";
import { Routes } from "@/shared/constants/routes";
import { FontSize, FontWeight } from "@/shared/constants/typography";
import { useAuth } from "@/shared/contexts/AuthContext";
import { verifyCurrentPassword } from "@/shared/services/authService";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { useAppDialog } from "@/shared/hooks/useAppDialog";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function InstructorFacialCameraScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { blocked } = useLocalSearchParams<{ blocked?: string }>();
  const { DialogUI } = useAppDialog();
  const { activeSession, settings, setActiveSession } = useFacialRegistry(user?.id);
  const sessionClosedRef = useRef(false);
  const [exitPromptVisible, setExitPromptVisible] = useState(false);
  const [exitPassword, setExitPassword] = useState("");
  const [exitError, setExitError] = useState("");
  const [verifyingExit, setVerifyingExit] = useState(false);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = theme.surface;

  const {
    screenState,
    isTaking,
    isValidatingLiveness,
    quality,
    successModalVisible,
    errorModalVisible,
    errorModalTitle,
    errorModalMessage,
    livenessInstruction,
    isWeb,
    isPositioning,
    cameraRef,
    handleOpenCamera,
    handleConfirmCamera,
    handleCancelCamera,
    handleWebCapture,
    handleWebShutter,
    handleRetake,
    handleCloseSuccessModal,
    handleCloseErrorModal,
  } = useSessionAttendanceCapture({ session: activeSession });

  useEffect(() => {
    handleOpenCamera();
  }, [handleOpenCamera]);

  useEffect(() => {
    if (blocked === "1") {
      setExitPassword("");
      setExitError("");
      setExitPromptVisible(true);
    }
  }, [blocked]);

  useEffect(() => {
    if (!activeSession?.idRecordEnvironment) return;
    void initializeFacialSessionAbsences(activeSession.idRecordEnvironment);
  }, [activeSession?.idRecordEnvironment]);

  useEffect(() => {
    const shutdownAt = (() => {
      if (activeSession?.shutdownTime) {
        const sessionDate = new Date(activeSession.shutdownTime);
        return Number.isNaN(sessionDate.getTime()) ? null : sessionDate;
      }

      if (!settings?.shutdownTime) return null;
      const [hours, minutes] = settings.shutdownTime.split(":").map(Number);
      if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

      const fallbackDate = new Date();
      fallbackDate.setHours(hours, minutes || 0, 0, 0);
      if (fallbackDate.getTime() <= Date.now()) {
        fallbackDate.setDate(fallbackDate.getDate() + 1);
      }
      return fallbackDate;
    })();

    if (!shutdownAt || sessionClosedRef.current) return;

    const closeSession = () => {
      if (sessionClosedRef.current) return;
      sessionClosedRef.current = true;
      handleCancelCamera();
      setActiveSession(undefined);
      router.replace(Routes.INSTRUCTOR.DASHBOARD as any);
    };

    const remainingMs = shutdownAt.getTime() - Date.now();
    if (remainingMs <= 0) {
      closeSession();
      return;
    }

    const timer = setTimeout(closeSession, remainingMs);
    return () => clearTimeout(timer);
  }, [activeSession, handleCancelCamera, setActiveSession, settings?.shutdownTime]);

  function performExit() {
    handleCancelCamera();
    setActiveSession(undefined);
    router.replace(Routes.INSTRUCTOR.DASHBOARD as any);
  }

  function handleCancelAndReturn() {
    setExitPassword("");
    setExitError("");
    setExitPromptVisible(true);
  }

  async function confirmExit() {
    if (!exitPassword.trim() || verifyingExit) return;
    setVerifyingExit(true);
    try {
      const valid = await verifyCurrentPassword(exitPassword);
      if (!valid) {
        setExitError("La contraseña no es válida.");
        return;
      }
      setExitPromptVisible(false);
      performExit();
    } catch {
      setExitError("No se pudo validar la contraseña. Intenta nuevamente.");
    } finally {
      setVerifyingExit(false);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined" || !window.history?.pushState) return;
    window.history.pushState({ facialKioskGuard: true }, "", window.location.href);
    const handleBackAttempt = () => {
      window.history.pushState({ facialKioskGuard: true }, "", window.location.href);
      handleCancelAndReturn();
    };
    window.addEventListener("popstate", handleBackAttempt);
    return () => window.removeEventListener("popstate", handleBackAttempt);
  }, []);

  function handleSuccess() {
    handleCloseSuccessModal();
    handleRetake();
  }

  return (
    <View style={[s.safe, { backgroundColor: "#000" }]}>
      {DialogUI}
      <View style={s.cameraWrap}>
        {isWeb ? (
          <WebCamera
            primaryColor={theme.primary}
            isTaking={isTaking}
            isPositioning={isPositioning}
            screenState={screenState}
            quality={quality}
            onCapture={handleWebCapture}
            onShutter={handleWebShutter}
            onConfirm={handleConfirmCamera}
            onCancel={handleCancelAndReturn}
            requiresLiveness
            autoCapture
            paused={isValidatingLiveness || errorModalVisible || successModalVisible}
            livenessInstruction={livenessInstruction}
          />
        ) : (
          (() => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { CameraView: NativeCameraView } = require("expo-camera");
            return (
              <View style={{ flex: 1 }}>
                <NativeCameraView
                  ref={cameraRef}
                  style={StyleSheet.absoluteFill}
                  facing="front"
                />
                <FaceGuideOverlay
                  primaryColor={theme.primary}
                  isPositioning={isPositioning}
                  screenState={screenState}
                  quality={quality}
                  requiresLiveness
                  livenessCaptureActive={isTaking}
                  livenessInstruction={livenessInstruction}
                  onConfirm={handleConfirmCamera}
                  onCancel={handleCancelAndReturn}
                />
              </View>
            );
          })()
        )}
      </View>

      {successModalVisible && (
        <View style={s.successOverlay}>
          <View style={[s.successModal, { backgroundColor: cardBg }]}>
            <Ionicons name="checkmark-circle" size={60} color={Colors.success} />
            <Text style={[s.successTitle, { color: text }]}>
              Asistencia registrada
            </Text>
            <Text style={[{ color: muted, textAlign: "center", marginTop: 8 }]}>
              El rostro coincide con un aprendiz de la ficha y el evento quedó guardado.
            </Text>
            <TouchableOpacity
              onPress={handleSuccess}
              style={[s.primaryBtn, { marginTop: 24, backgroundColor: theme.primary }]}
            >
              <Text style={s.primaryBtnText}>{t("common.ok")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {errorModalVisible && (
        <View style={s.successOverlay}>
          <View style={[s.successModal, { backgroundColor: cardBg }]}>
            <Ionicons name="alert-circle" size={60} color={Colors.error} />
            <Text style={[s.successTitle, { color: text }]}>
              {errorModalTitle}
            </Text>
            <Text style={[{ color: muted, textAlign: "center", marginTop: 8 }]}>
              {errorModalMessage}
            </Text>
            <TouchableOpacity
              onPress={handleCloseErrorModal}
              style={[s.primaryBtn, { marginTop: 24, backgroundColor: theme.primary }]}
            >
              <Text style={s.primaryBtnText}>{t("common.ok")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal visible={exitPromptVisible} transparent animationType="fade" onRequestClose={() => setExitPromptVisible(false)}>
        <View style={s.exitOverlay}>
          <View style={[s.exitModal, { backgroundColor: cardBg }]}>
            <Ionicons name="lock-closed-outline" size={36} color={theme.primary} />
            <Text style={[s.exitTitle, { color: text }]}>Registro facial activo</Text>
            <Text style={[s.exitBody, { color: muted }]}>Para salir, ingrese la contraseña del instructor.</Text>
            <TextInput
              value={exitPassword}
              onChangeText={(value) => { setExitPassword(value); setExitError(""); }}
              placeholder="Contraseña"
              placeholderTextColor={muted}
              secureTextEntry
              autoFocus
              style={[s.exitInput, { color: text, borderColor: exitError ? Colors.error : theme.border }]}
              onSubmitEditing={confirmExit}
            />
            {exitError ? <Text style={s.exitError}>{exitError}</Text> : null}
            <View style={s.exitActions}>
              <TouchableOpacity onPress={() => setExitPromptVisible(false)} style={s.exitCancelButton}>
                <Text style={[s.exitCancelText, { color: muted }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmExit} style={[s.exitConfirmButton, { backgroundColor: theme.primary }]}>
                <Text style={s.exitConfirmText}>{verifyingExit ? "Validando…" : "Confirmar salida"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  camHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  camHeaderTitle: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
  },
  qualityRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexWrap: "wrap",
  },
  scannerPanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(12,18,16,0.82)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  scannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scannerCopy: { flex: 1 },
  scannerTitle: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.black,
  },
  scannerBody: {
    color: "rgba(255,255,255,0.72)",
    fontSize: FontSize.sm,
    lineHeight: 18,
    marginTop: 2,
  },
  qualityRail: {
    flexDirection: "row",
    gap: 6,
  },
  qualityDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  qualityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cameraWrap: { flex: 1 },
  processingWrap: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  processingRing: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  processingTitle: {
    color: Colors.white,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    marginTop: 22,
    textAlign: "center",
  },
  processingBody: {
    color: "rgba(255,255,255,0.72)",
    fontSize: FontSize.base,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 22,
  },
  successOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  successModal: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
  },
  successTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    textAlign: "center",
    marginTop: 12,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.black,
  },
  exitOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", alignItems: "center", justifyContent: "center", padding: 24 },
  exitModal: { width: "100%", maxWidth: 390, borderRadius: 20, padding: 24, alignItems: "center" },
  exitTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, marginTop: 12, textAlign: "center" },
  exitBody: { fontSize: FontSize.base, lineHeight: 21, marginTop: 8, textAlign: "center" },
  exitInput: { width: "100%", height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, marginTop: 20, fontSize: FontSize.base, outlineStyle: "none" } as any,
  exitError: { width: "100%", color: Colors.error, fontSize: FontSize.xs, marginTop: 6 },
  exitActions: { width: "100%", flexDirection: "row", gap: 10, marginTop: 20 },
  exitCancelButton: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 13, borderRadius: 12 },
  exitCancelText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  exitConfirmButton: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 13, borderRadius: 12 },
  exitConfirmText: { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  secondaryBtnText: {
    color: Colors.white,
    fontWeight: "700",
  },
});
