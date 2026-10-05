// ─────────────────────────────────────────────
//  app/instructor/facial/camera.tsx
//  Cámara de Reconocimiento Facial — Instructor
//
//  Reutiliza la experiencia de cámara del aprendiz, pero entra directo al
//  reconocimiento facial después de guardar la configuración de la sesión.
// ─────────────────────────────────────────────
import FaceGuideOverlay from "@/features/auth/components/FaceGuideOverlay";
import ShutterButton from "@/features/auth/components/ShutterButton";
import WebCamera from "@/features/auth/components/WebCamera";
import { useFacialRegistration } from "@/features/auth/hooks/useFacialRegistration";
import { Colors } from "@/shared/constants/colors";
import { Routes } from "@/shared/constants/routes";
import { FontSize, FontWeight } from "@/shared/constants/typography";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { useAppDialog } from "@/shared/hooks/useAppDialog";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Step = "camera" | "done";

export default function InstructorFacialCameraScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { DialogUI } = useAppDialog();
  const [step, setStep] = useState<Step>("camera");

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = theme.surface;
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const {
    screenState,
    photoUri,
    isTaking,
    isRegistering,
    quality,
    successModalVisible,
    isWeb,
    isPositioning,
    canFinish,
    cameraRef,
    handleOpenCamera,
    handleConfirmCamera,
    handleCancelCamera,
    handleTakePhotoNative,
    handleWebCapture,
    handleWebShutter,
    handleRetake,
    handleFinish,
    handleCloseSuccessModal,
  } = useFacialRegistration();

  useEffect(() => {
    handleOpenCamera();
  }, [handleOpenCamera]);

  const qualityWarnings: { icon: string; label: string; ok: boolean }[] = [
    {
      icon: "sunny-outline",
      label: t("facialReg.checkLight"),
      ok: quality !== "lowLight",
    },
    {
      icon: "scan-outline",
      label: t("facialReg.checkFace"),
      ok: screenState !== "idle" && screenState !== "requesting",
    },
    {
      icon: "camera-outline",
      label: t("facialReg.checkFrontal"),
      ok: quality === "good",
    },
  ];

  function handleCancelAndReturn() {
    handleCancelCamera();
    router.replace(Routes.INSTRUCTOR.FACIAL as any);
  }

  function handleSuccess() {
    handleCloseSuccessModal();
    setStep("done");
  }

  if (step === "done") {
    return (
      <View style={[s.doneSafe, { backgroundColor: bg }]}>
        <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
        <Text style={[s.successTitle, { color: text, marginTop: 20 }]}>
          {t("facialReg.successTitle")}
        </Text>
        <Text style={[{ color: muted, textAlign: "center", marginTop: 8 }]}>
          {t("facialReg.successMessage")}
        </Text>
        <TouchableOpacity
          onPress={() => router.replace(Routes.INSTRUCTOR.FACIAL as any)}
          style={[s.primaryBtn, { marginTop: 32, backgroundColor: theme.primary }]}
        >
          <Ionicons name="arrow-back-outline" size={18} color={Colors.white} />
          <Text style={s.primaryBtnText}>{t("common.back")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.safe, { backgroundColor: "#000" }]}>
      {DialogUI}
      <View style={s.camHeader}>
        <TouchableOpacity
          onPress={handleCancelAndReturn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={s.camHeaderTitle}>{t("facialReg.title")}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={s.qualityRow}>
        {qualityWarnings.map((warning) => (
          <View
            key={warning.label}
            style={[
              s.qualityChip,
              {
                backgroundColor: warning.ok ? Colors.success + "22" : Colors.error + "22",
                borderColor: warning.ok ? Colors.success : Colors.error,
              },
            ]}
          >
            <Ionicons
              name={warning.icon as any}
              size={13}
              color={warning.ok ? Colors.success : Colors.error}
            />
            <Text
              style={{
                color: warning.ok ? Colors.success : Colors.error,
                fontSize: 11,
                fontWeight: "700",
              }}
            >
              {warning.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={s.cameraWrap}>
        {photoUri ? (
          <View style={s.previewWrap}>
            <Text style={s.capturedText}>{t("facialReg.captured")}</Text>
            <View style={s.previewActions}>
              <TouchableOpacity onPress={handleRetake} style={s.secondaryBtn}>
                <Ionicons name="refresh-outline" size={18} color={Colors.white} />
                <Text style={s.secondaryBtnText}>{t("facialReg.retake")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleFinish}
                disabled={!canFinish}
                style={[
                  s.primaryBtn,
                  {
                    backgroundColor: canFinish ? theme.primary : muted + "60",
                    flex: 1,
                  },
                ]}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />
                <Text style={s.primaryBtnText}>
                  {isRegistering ? "Registrando..." : t("facialReg.finish")}
                </Text>
              </TouchableOpacity>
            </View>
            {quality === "lowLight" && (
              <Text style={s.lowLightText}>{t("facialReg.lowLight")}</Text>
            )}
          </View>
        ) : isWeb ? (
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
                  onConfirm={handleConfirmCamera}
                  onCancel={handleCancelAndReturn}
                />
              </View>
            );
          })()
        )}
      </View>

      {!photoUri && !isWeb && (
        <View style={s.shutterWrap}>
          <ShutterButton
            primaryColor={theme.primary}
            onPress={handleTakePhotoNative}
            disabled={isTaking || screenState !== "ready"}
            loading={isTaking}
          />
        </View>
      )}

      {successModalVisible && (
        <View style={s.successOverlay}>
          <View style={[s.successModal, { backgroundColor: cardBg }]}>
            <Ionicons name="checkmark-circle" size={60} color={Colors.success} />
            <Text style={[s.successTitle, { color: text }]}>
              {t("facialReg.successTitle")}
            </Text>
            <Text style={[{ color: muted, textAlign: "center", marginTop: 8 }]}>
              {t("facialReg.successMessage")}
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
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  doneSafe: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
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
  previewWrap: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  capturedText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    marginBottom: 24,
  },
  previewActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
  },
  lowLightText: {
    color: Colors.warning,
    textAlign: "center",
    paddingHorizontal: 24,
    marginTop: 12,
  },
  shutterWrap: { alignItems: "center", paddingBottom: 40, paddingTop: 20 },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
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
