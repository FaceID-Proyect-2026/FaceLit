// ─────────────────────────────────────────────
//  app/apprentice/facial.tsx
//  Reconocimiento Facial — Aprendiz
//  RF-5.1: Pantalla de confirmación de identidad
//  RF-5.2: Captura con validación inteligente
//  Solo puede registrar la persona autenticada.
// ─────────────────────────────────────────────
import FaceGuideOverlay from "@/features/auth/components/FaceGuideOverlay";
import WebCamera from "@/features/auth/components/WebCamera";
import { useFacialRegistration } from "@/features/auth/hooks/useFacialRegistration";
import { getFacialRecordsSnapshot } from "@/features/facial/facialStore";
import { canStartFacialCapture, hasUnusedFacialApproval } from "@/features/facial/registrationAccess";
import { Colors } from "@/shared/constants/colors";
import { Routes } from "@/shared/constants/routes";
import { FontSize, FontWeight } from "@/shared/constants/typography";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { useAppDialog } from "@/shared/hooks/useAppDialog";
import { fetchMyFacialEnrollmentStatus, fetchMyFacialResetState, requestMyFacialReset, type FacialResetState } from "@/shared/services/facialEnrollmentService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// CameraView solo existe en nativo — importarlo en web devuelve null y rompe el render.
// Se importa con require() condicional dentro del componente de cámara.

// ── Paso del flujo ─────────────────────────────
type Step = "confirm" | "camera" | "done";

export default function ApprenticeFacialScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { alert, DialogUI } = useAppDialog();
  const [step, setStep] = useState<Step>("confirm");
  const [confirmed, setConfirmed] = useState(false);
  const [captureWarningVisible, setCaptureWarningVisible] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const [resetState, setResetState] = useState<FacialResetState | null>(null);
  const [consumedRequests, setConsumedRequests] = useState<ReadonlySet<string>>(() => new Set());
  const [savedInThisScreen, setSavedInThisScreen] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [serverRegistered, setServerRegistered] = useState<boolean | null>(null);
  const [serverRegistrationDate, setServerRegistrationDate] = useState<string | null>(null);
  const [loadingRegistrationStatus, setLoadingRegistrationStatus] = useState(false);
  const [registrationStatusError, setRegistrationStatusError] = useState<string | null>(null);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = theme.surface;
  const border = theme.border;
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  // Nombre completo del aprendiz
  const fullName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : (user?.email ?? "");

  // Estado del registro facial actual
  const records = getFacialRecordsSnapshot();
  const myRecord = records.find((r) => r.userId === user?.id);
  const isRegistered = serverRegistered ?? myRecord?.status === "registered";
  const unusedApproval = hasUnusedFacialApproval(resetState, consumedRequests);

  useEffect(() => {
    setConsumedRequests(new Set());
    setSavedInThisScreen(false);
    setResetState(null);
    setConfirmed(false);
  }, [user?.id]);

  const handleRegistrationSaved = useCallback(() => {
    if (resetState?.requestId) {
      const consumedId = resetState.requestId;
      setConsumedRequests(previous => new Set([...previous, consumedId]));
    }
    setSavedInThisScreen(true);
    setServerRegistered(true);
    setResetState(null);
    setResetRequested(false);
    setConfirmed(false);
    setCaptureWarningVisible(false);
    setServerRegistrationDate(new Date().toISOString());
  }, [resetState?.requestId]);

  useEffect(() => {
    let cancelled = false;

    async function loadRegistrationStatus() {
      if (!user?.id) {
        setServerRegistered(null);
        setServerRegistrationDate(null);
        return;
      }
      setLoadingRegistrationStatus(true);
      setRegistrationStatusError(null);
      try {
        const [status, reset] = await Promise.all([fetchMyFacialEnrollmentStatus(), fetchMyFacialResetState()]);
        if (!cancelled) {
          setServerRegistered(status.registered);
          setResetState(reset);
          setResetRequested(reset.status === "PENDING");
          setServerRegistrationDate(status.registrationDate ?? null);
        }
      } catch (error) {
        console.warn("[ApprenticeFacial] No se pudo consultar el estado facial:", error);
        if (!cancelled) {
          setServerRegistered(null);
          setServerRegistrationDate(null);
          setRegistrationStatusError("No fue posible verificar si ya tienes rostro registrado.");
        }
      } finally {
        if (!cancelled) setLoadingRegistrationStatus(false);
      }
    }

    void loadRegistrationStatus();
    const timer = setInterval(() => { if (step === "confirm") void loadRegistrationStatus(); }, 15000);
    return () => {
      clearInterval(timer);
      cancelled = true;
    };
  }, [user?.id, step]);

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
    handleCloseSuccessModal,
    handleCloseErrorModal,
  } = useFacialRegistration({ requireResponsibilityConfirmation: false,
    replaceExisting: unusedApproval, resetToken: unusedApproval ? resetState?.authorizationToken : null,
    onRegistrationSaved: handleRegistrationSaved });

  const canStartRegistration = canStartFacialCapture({ registered: serverRegistered, savedInThisScreen,
    reset: resetState, consumedRequests, loading: loadingRegistrationStatus, hasError: !!registrationStatusError });

  // ── Cancelar desde la cámara → limpia estado y vuelve al paso confirm ──
  function handleCancelAndReturn() {
    handleCancelCamera();
    setStep("confirm");
  }

  // ── Confirmación de identidad (RF-5.1) ────────
  function handleConfirmAndProceed() {
    if (!confirmed) return;
    if (loadingRegistrationStatus || registrationStatusError || serverRegistered === null) return;
    if (!canStartRegistration) return;
    setCaptureWarningVisible(true);
  }

  function handleAcceptCaptureWarning() {
    setCaptureWarningVisible(false);
    if (!canStartRegistration) return;
    setStep("camera");
    handleOpenCamera();
  }

  async function handleRequestFacialReset() {
    if (!user?.id || resetRequested || sendingReset || unusedApproval) return;
    setSendingReset(true);
    try {
      const state = await requestMyFacialReset();
      setResetState(state);
      setResetRequested(state.status === "PENDING");
      alert(t("notifications.templates.resetUi.sentTitle"), t("notifications.templates.resetUi.sentMessage"));
    } catch (error: any) {
      alert(t("notifications.templates.resetUi.errorTitle"), error?.response?.data?.message || t("notifications.templates.resetUi.errorMessage"));
    } finally { setSendingReset(false); }
  }

  // ── Al cerrar modal de éxito ───────────────────
  function handleSuccess() {
    handleCloseSuccessModal();
    setServerRegistered(true);
    setResetState(null);
    setResetRequested(false);
    setServerRegistrationDate(new Date().toISOString());
    setStep("done");
  }

  const formatRegistrationDate = (value?: string | null) => {
    if (!value) return "";
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  };
  const registeredDateLabel = formatRegistrationDate(serverRegistrationDate) || myRecord?.date || "";

  // ─────────────────────────────────────────────
  //  PASO 1 — Confirmación de identidad
  // ─────────────────────────────────────────────
  if (step === "confirm") {
    return (
      <View style={[s.safe, { backgroundColor: bg }]}>
        {DialogUI}
        <Modal
          visible={captureWarningVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCaptureWarningVisible(false)}
        >
          <View style={s.captureWarningBackdrop}>
            <View
              style={[
                s.captureWarningCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <View
                style={[
                  s.captureWarningIcon,
                  { backgroundColor: theme.primary + "18" },
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={34}
                  color={theme.primary}
                />
              </View>
              <Text style={[s.captureWarningTitle, { color: text }]}>
                {t("facialReg.captureWarningTitle")}
              </Text>
              <Text style={[s.captureWarningBody, { color: muted }]}>
                {t("facialReg.captureWarningBody")}
              </Text>
              <View
                style={[
                  s.captureWarningNotice,
                  { backgroundColor: theme.primary + "10", borderColor: theme.primary + "55" },
                ]}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={theme.primary}
                />
                <Text style={[s.captureWarningNoticeText, { color: text }]}>
                  {t("facialReg.captureWarningCoordinator")}
                </Text>
              </View>
              <View style={s.captureWarningActions}>
                <TouchableOpacity
                  onPress={() => setCaptureWarningVisible(false)}
                  style={[s.captureWarningSecondary, { borderColor: border }]}
                  activeOpacity={0.85}
                >
                  <Text style={[s.captureWarningSecondaryText, { color: text }]}>
                    {t("facialReg.captureWarningCancel")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAcceptCaptureWarning}
                  style={[
                    s.captureWarningPrimary,
                    { backgroundColor: theme.primary },
                  ]}
                  activeOpacity={0.85}
                >
                  <Ionicons name="camera-outline" size={18} color={Colors.white} />
                  <Text style={s.captureWarningPrimaryText}>
                    {t("facialReg.captureWarningContinue")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Header */}
        <View style={[s.header, { borderBottomColor: border }]}>
          <View style={{ width: 22 }} />
          <Text style={[s.headerTitle, { color: text }]}>
            {t("sidebar.facialRecognition")}
          </Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll}>
          {/* Estado actual del registro */}
          <View
            style={[
              s.statusCard,
              {
                backgroundColor: isRegistered
                  ? Colors.success + "15"
                  : Colors.warning + "15",
                borderColor: isRegistered ? Colors.success : Colors.warning,
              },
            ]}
          >
            <Ionicons
              name={isRegistered ? "checkmark-circle" : "alert-circle"}
              size={28}
              color={isRegistered ? Colors.success : Colors.warning}
            />
            <View style={{ flex: 1 }}>
              <Text style={[s.statusTitle, { color: text }]}>
                {isRegistered
                  ? t("facialReg.alreadyRegisteredTitle")
                  : loadingRegistrationStatus
                    ? t("common.loading")
                    : t("facialReg.pendingTitle")}
              </Text>
              <Text style={[s.statusDesc, { color: muted }]}>
                {isRegistered
                  ? t("facialReg.registeredOn") +
                    ` ${registeredDateLabel}`
                  : registrationStatusError
                    ? registrationStatusError
                  : t("facialReg.registerFaceDesc")}
              </Text>
            </View>
          </View>

          {unusedApproval && (
            <Text style={[s.statusDesc, { color: Colors.success, padding: 16 }]}>
              {t("notifications.templates.resetUi.authorized")}
            </Text>
          )}
          {/* Aviso de responsabilidad (RF-5.1) */}
          <View
            style={[
              s.noticeCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View
              style={[
                s.noticeIconWrap,
                { backgroundColor: theme.primary + "20" },
              ]}
            >
              <Ionicons
                name="person-circle-outline"
                size={32}
                color={theme.primary}
              />
            </View>
            <Text style={[s.noticeTitle, { color: text }]}>
              {t("facialReg.identityTitle")}
            </Text>
            <Text style={[s.noticeBody, { color: text }]}>
              {t("facialReg.identityNotice")}
            </Text>
            <LinearGradient
              colors={[theme.primary, theme.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.nameBadge}
            >
              <Text style={s.nameBadgeText}>{fullName}</Text>
            </LinearGradient>
          </View>

          {isRegistered && !unusedApproval && (
            <TouchableOpacity
              onPress={handleRequestFacialReset}
              disabled={resetRequested || sendingReset}
              style={[
                s.resetRequestBtn,
                {
                  borderColor: resetRequested ? Colors.success : theme.primary,
                  backgroundColor: resetRequested ? Colors.success + "12" : theme.primary + "10",
                },
              ]}
              activeOpacity={0.85}
            >
              <Ionicons
                name={resetRequested ? "checkmark-circle-outline" : "refresh-circle-outline"}
                size={20}
                color={resetRequested ? Colors.success : theme.primary}
              />
              <Text style={[s.resetRequestText, { color: resetRequested ? Colors.success : theme.primary }]}>
                {t(resetRequested ? "notifications.templates.resetUi.sentTitle" : "notifications.templates.resetUi.requestButton")}
              </Text>
            </TouchableOpacity>
          )}

          {/* Instrucciones */}
          <View
            style={[
              s.instructCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <Text style={[s.instructTitle, { color: text }]}>
              {t("facialReg.instructions")}
            </Text>
            {[
              { icon: "sunny-outline", text: t("facialReg.instr2") },
              { icon: "eye-outline", text: t("facialReg.instr3") },
              { icon: "glasses-outline", text: t("facialReg.instr4") },
              {
                icon: "phone-portrait-outline",
                text: t("facialReg.noPhonePhoto"),
              },
              { icon: "person-outline", text: t("facialReg.instr5") },
            ].map((item, i) => (
              <View key={i} style={s.instructRow}>
                <View
                  style={[
                    s.instructDot,
                    { backgroundColor: theme.primary + "20" },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={16}
                    color={theme.primary}
                  />
                </View>
                <Text style={[s.instructText, { color: muted }]}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>

          {/* Casilla de confirmación */}
          <TouchableOpacity
            onPress={() => setConfirmed((c) => !c)}
            style={[
              s.checkRow,
              { borderColor: confirmed ? theme.primary : border },
            ]}
            activeOpacity={0.8}
          >
            <View
              style={[
                s.checkbox,
                {
                  borderColor: confirmed ? theme.primary : muted,
                  backgroundColor: confirmed ? theme.primary : "transparent",
                },
              ]}
            >
              {confirmed && (
                <Ionicons name="checkmark" size={14} color={Colors.white} />
              )}
            </View>
            <Text style={[s.checkLabel, { color: text }]}>
              {t("facialReg.confirmResponsibility")}
            </Text>
          </TouchableOpacity>

          {/* Botón continuar */}
          <TouchableOpacity
            onPress={handleConfirmAndProceed}
            disabled={!confirmed || !canStartRegistration}
            style={[
              s.primaryBtn,
              {
                backgroundColor:
                  !confirmed || !canStartRegistration ? muted + "40" : theme.primary,
              },
            ]}
            activeOpacity={0.85}
          >
            <Ionicons name="scan-outline" size={20} color={Colors.white} />
            <Text style={s.primaryBtnText}>
              {isRegistered && !unusedApproval
                ? t("facialReg.alreadyRegisteredTitle")
                : loadingRegistrationStatus
                  ? t("common.loading")
                  : t("facialReg.captureBtn")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ─────────────────────────────────────────────
  //  PASO 2 — Cámara + validación inteligente
  // ─────────────────────────────────────────────
  if (step === "camera") {
    return (
      <View style={[s.safe, { backgroundColor: "#000" }]}>
        {DialogUI}

        {/* Vista de cámara */}
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
              // require condicional: evita que CameraView sea null en web
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

        {/* Modal de éxito */}
        {successModalVisible && (
          <View style={s.successOverlay}>
            <View style={[s.successModal, { backgroundColor: cardBg }]}>
              <Ionicons
                name="checkmark-circle"
                size={60}
                color={Colors.success}
              />
              <Text style={[s.successTitle, { color: text }]}>
                {t("facialReg.successTitle")}
              </Text>
              <Text
                style={[{ color: muted, textAlign: "center", marginTop: 8 }]}
              >
                {t("facialReg.successMessage")}
              </Text>
              <TouchableOpacity
                onPress={handleSuccess}
                style={[
                  s.primaryBtn,
                  { marginTop: 24, backgroundColor: theme.primary },
                ]}
              >
                <Text style={s.primaryBtnText}>{t("common.ok")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {errorModalVisible && (
          <View style={s.successOverlay}>
            <View style={[s.successModal, { backgroundColor: cardBg }]}>
              <Ionicons
                name="alert-circle"
                size={60}
                color={Colors.error}
              />
              <Text style={[s.successTitle, { color: text }]}>
                {errorModalTitle}
              </Text>
              <Text
                style={[{ color: muted, textAlign: "center", marginTop: 8 }]}
              >
                {errorModalMessage}
              </Text>
              <TouchableOpacity
                onPress={handleCloseErrorModal}
                style={[
                  s.primaryBtn,
                  { marginTop: 24, backgroundColor: theme.primary },
                ]}
              >
                <Text style={s.primaryBtnText}>{t("common.ok")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }

  // ─────────────────────────────────────────────
  //  PASO 3 — Registro completado
  // ─────────────────────────────────────────────
  return (
    <View
      style={[
        s.safe,
        {
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        },
      ]}
    >
      <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
      <Text style={[s.successTitle, { color: text, marginTop: 20 }]}>
        {t("facialReg.successTitle")}
      </Text>
      <Text style={[{ color: muted, textAlign: "center", marginTop: 8 }]}>
        {t("facialReg.successMessage")}
      </Text>
      <TouchableOpacity
        onPress={() => router.replace(Routes.APPRENTICE.DASHBOARD as any)}
        style={[
          s.primaryBtn,
          { marginTop: 32, backgroundColor: theme.primary },
        ]}
      >
        <Ionicons name="home-outline" size={18} color={Colors.white} />
        <Text style={s.primaryBtnText}>{t("common.back")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black },

  // Status card
  statusCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
  },
  statusTitle: { fontSize: FontSize.base, fontWeight: FontWeight.black },
  statusDesc: { fontSize: FontSize.sm, marginTop: 3, lineHeight: 18 },

  // Notice card
  noticeCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  noticeIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    textAlign: "center",
  },
  noticeBody: { fontSize: FontSize.base, textAlign: "center" },
  nameBadge: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24 },
  nameBadgeText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    textAlign: "center",
  },
  resetRequestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1.4,
    paddingVertical: 13,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  resetRequestText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.black,
    textAlign: "center",
  },
  warningText: { fontSize: FontSize.sm, textAlign: "center", lineHeight: 18 },

  // Instructions
  instructCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  instructTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.black,
    marginBottom: 4,
  },
  instructRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  instructDot: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  instructText: { flex: 1, fontSize: FontSize.sm, lineHeight: 18 },

  // Checkbox
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 10,
    borderWidth: 1.2,
    padding: 14,
    marginBottom: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkLabel: { flex: 1, fontSize: FontSize.sm, lineHeight: 20 },

  // Capture warning modal
  captureWarningBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.58)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  captureWarningCard: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  captureWarningIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  captureWarningTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    textAlign: "center",
  },
  captureWarningBody: {
    fontSize: FontSize.base,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
  },
  captureWarningNotice: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 18,
  },
  captureWarningNoticeText: {
    flex: 1,
    fontSize: FontSize.sm,
    lineHeight: 20,
    fontWeight: FontWeight.bold,
  },
  captureWarningActions: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  captureWarningSecondary: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  captureWarningSecondaryText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.black,
    textAlign: "center",
  },
  captureWarningPrimary: {
    flex: 1.25,
    minHeight: 48,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  captureWarningPrimaryText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.black,
    textAlign: "center",
  },

  // Camera
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
  qualityRail: { flexDirection: "row", gap: 6 },
  qualityDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraWrap: { flex: 1 },
  shutterWrap: { alignItems: "center", paddingBottom: 40, paddingTop: 20 },
  previewActions: { flexDirection: "row", gap: 12, paddingHorizontal: 24 },
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

  // Success overlay
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

  // Buttons
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
});
