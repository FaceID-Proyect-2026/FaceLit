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
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function InstructorFacialRegisterScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { DialogUI } = useAppDialog();

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = theme.surface;

  const {
    screenState,
    photoUri,
    isTaking,
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
    handleOpenCamera(true);
  }, [handleOpenCamera]);

  const handleCancelAndReturn = () => {
    handleCancelCamera();
    router.replace(Routes.FACIAL.MANAGEMENT as any);
  };

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

      <View style={s.cameraWrap}>
        {photoUri ? (
          <View style={s.preview}>
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
                  { backgroundColor: canFinish ? theme.primary : muted + "60" },
                ]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color={Colors.white}
                />
                <Text style={s.primaryBtnText}>{t("facialReg.finish")}</Text>
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
            const { CameraView: NativeCameraView } = require("expo-camera");
            return (
              <NativeCameraView ref={cameraRef} style={{ flex: 1 }} facing="front">
                <FaceGuideOverlay
                  primaryColor={theme.primary}
                  isPositioning={isPositioning}
                  screenState={screenState}
                  quality={quality}
                  onConfirm={handleConfirmCamera}
                  onCancel={handleCancelAndReturn}
                />
              </NativeCameraView>
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
            <Text style={[s.successBody, { color: muted }]}>
              {t("facialReg.successMessage")}
            </Text>
            <TouchableOpacity
              onPress={handleCloseSuccessModal}
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
  cameraWrap: { flex: 1 },
  preview: {
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
  primaryBtn: {
    flex: 1,
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
  secondaryBtnText: { color: Colors.white, fontWeight: "700" },
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
  successBody: { textAlign: "center", marginTop: 8 },
});
