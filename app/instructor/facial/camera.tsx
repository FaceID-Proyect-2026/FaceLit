// ─────────────────────────────────────────────
//  app/instructor/facial/camera.tsx
//  Cámara de Reconocimiento Facial — Instructor
//
//  Abre una sesión para registrar rostros de varios aprendices de la ficha
//  configurada por el instructor.
// ─────────────────────────────────────────────
import FaceGuideOverlay from "@/features/auth/components/FaceGuideOverlay";
import ShutterButton from "@/features/auth/components/ShutterButton";
import WebCamera from "@/features/auth/components/WebCamera";
import { useFacialRegistration } from "@/features/auth/hooks/useFacialRegistration";
import { refreshAcademicStoreFromBackend, useAcademic } from "@/features/academic/useAcademic";
import { useFacialRegistry } from "@/features/facial/useFacialRegistry";
import { InputField } from "@/shared/components/ui";
import { Colors } from "@/shared/constants/colors";
import { Routes } from "@/shared/constants/routes";
import { FontSize, FontWeight } from "@/shared/constants/typography";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { useAppDialog } from "@/shared/hooks/useAppDialog";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function InstructorFacialCameraScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { DialogUI } = useAppDialog();
  const { allFichas } = useAcademic();
  const { config, records } = useFacialRegistry();
  const [learnerDocument, setLearnerDocument] = useState("");

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = theme.surface;

  const sessionFicha = useMemo(() => {
    if (!config) return null;
    return allFichas.find((ficha) =>
      ficha.id === config.fichaId || String(ficha.number) === String(config.fichaNumber),
    ) ?? null;
  }, [allFichas, config]);

  const learners = useMemo(
    () => sessionFicha?.learners.filter((learner) => learner.status === "active") ?? [],
    [sessionFicha],
  );

  const normalizedDocument = learnerDocument.replace(/\D/g, "");
  const selectedLearner = learners.find((learner) => learner.document === normalizedDocument);
  const documentBelongsToOtherFicha =
    normalizedDocument.length >= 6 &&
    !selectedLearner &&
    allFichas.some((ficha) =>
      ficha.id !== sessionFicha?.id &&
      ficha.learners.some((learner) => learner.status === "active" && learner.document === normalizedDocument),
    );
  const documentError = normalizedDocument.length >= 6 && !selectedLearner
    ? documentBelongsToOtherFicha
      ? "Este aprendiz pertenece a otra ficha."
      : "Este documento no pertenece a la ficha de esta sesión."
    : undefined;
  const selectedFacialUser = selectedLearner
    ? {
        id: selectedLearner.id,
        name: `${selectedLearner.name} ${selectedLearner.lastname}`.trim(),
        role: "aprendiz" as const,
        fichaId: sessionFicha?.id,
        fichaNumber: sessionFicha?.number,
      }
    : undefined;

  const sessionRegisteredCount = records.filter((record) =>
    learners.some((learner) => learner.id === record.userId && record.status === "registered"),
  ).length;
  const selectedLearnerRegistered = selectedLearner
    ? records.some((record) => record.userId === selectedLearner.id && record.status === "registered")
    : false;

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
  } = useFacialRegistration({
    targetUser: selectedFacialUser,
    replaceExisting: true,
    createdBy: "instructor-session",
    allowLocalFallback: true,
  });

  useEffect(() => {
    refreshAcademicStoreFromBackend().catch(() => undefined);
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
    setLearnerDocument("");
    handleRetake();
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

      <View style={[s.sessionPanel, { backgroundColor: cardBg, borderColor: theme.border }]}>
        <View style={s.sessionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[s.sessionTitle, { color: text }]}>Registro de aprendices</Text>
            <Text style={[s.sessionSubtitle, { color: muted }]}>
              {sessionFicha
                ? `Ficha ${sessionFicha.number} - solo se aceptan aprendices activos de esta ficha.`
                : "No hay una ficha configurada para esta sesión."}
            </Text>
          </View>
          <View style={[s.countBadge, { backgroundColor: theme.primary + "18" }]}>
            <Text style={[s.countText, { color: theme.primary }]}>{sessionRegisteredCount}</Text>
          </View>
        </View>
        <InputField
          label="Documento del aprendiz"
          value={learnerDocument}
          onChangeText={(value) => setLearnerDocument(value.replace(/\D/g, "").slice(0, 15))}
          placeholder={learners.length > 0 ? "Digita el documento" : "Sin aprendices activos"}
          keyboardType="number-pad"
          icon="card-outline"
          error={documentError}
        />
        {selectedLearner ? (
          <View style={[s.learnerBadge, { backgroundColor: Colors.success + "15", borderColor: Colors.success }]}>
            <Ionicons name="checkmark-circle-outline" size={16} color={Colors.success} />
            <Text style={[s.learnerBadgeText, { color: Colors.success }]}>
              {selectedLearner.name} {selectedLearner.lastname}
              {selectedLearnerRegistered ? " - registro existente, se actualizará" : ""}
            </Text>
          </View>
        ) : null}
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
                disabled={!canFinish || !selectedLearner}
                style={[
                  s.primaryBtn,
                  {
                    backgroundColor: canFinish && selectedLearner ? theme.primary : muted + "60",
                    flex: 1,
                  },
                ]}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />
                <Text style={s.primaryBtnText}>
                  {isRegistering ? "Registrando..." : "Guardar aprendiz"}
                </Text>
              </TouchableOpacity>
            </View>
            {!selectedLearner && (
              <Text style={s.selectLearnerText}>Digita un documento válido de la ficha para guardar esta captura.</Text>
            )}
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
              Aprendiz registrado
            </Text>
            <Text style={[{ color: muted, textAlign: "center", marginTop: 8 }]}>
              La captura se guardó correctamente. Puedes continuar con otro aprendiz.
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
  sessionPanel: {
    borderWidth: 1,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.black,
  },
  sessionSubtitle: {
    fontSize: FontSize.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  countBadge: {
    minWidth: 34,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  countText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.black,
  },
  learnerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  learnerBadgeText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
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
  selectLearnerText: {
    color: Colors.warning,
    textAlign: "center",
    paddingHorizontal: 24,
    marginTop: 12,
    fontWeight: "700",
  },
  shutterWrap: { alignItems: "center", paddingBottom: 40, paddingTop: 20 },
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
