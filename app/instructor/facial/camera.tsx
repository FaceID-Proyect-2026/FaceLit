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
import { Colors } from "@/shared/constants/colors";
import { Routes } from "@/shared/constants/routes";
import { FontSize, FontWeight } from "@/shared/constants/typography";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { useAppDialog } from "@/shared/hooks/useAppDialog";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function InstructorFacialCameraScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { DialogUI } = useAppDialog();
  const { activeSession, settings, setActiveSession } = useFacialRegistry(user?.id);
  const sessionClosedRef = useRef(false);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = theme.surface;

  const {
    screenState,
    isTaking,
    quality,
    successModalVisible,
    errorModalVisible,
    errorModalMessage,
    livenessChallenge,
    isWeb,
    isPositioning,
    cameraRef,
    handleOpenCamera,
    handleConfirmCamera,
    handleCancelCamera,
    handleWebCapture,
    handleWebShutter,
    randomizeLivenessChallenge,
    handleRetake,
    handleCloseSuccessModal,
    handleCloseErrorModal,
  } = useSessionAttendanceCapture({ session: activeSession });

  useEffect(() => {
    handleOpenCamera();
  }, [handleOpenCamera]);

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

  function handleCancelAndReturn() {
    handleCancelCamera();
    setActiveSession(undefined);
    router.replace(Routes.INSTRUCTOR.FACIAL as any);
  }

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
            onFaceReady={randomizeLivenessChallenge}
            requiresLiveness
            autoCapture
            livenessInstruction={livenessChallenge.label}
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
                  livenessInstruction={livenessChallenge.label}
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
              No se pudo registrar
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
