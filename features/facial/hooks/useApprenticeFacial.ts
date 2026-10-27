import { useFacialRegistration } from "@/features/auth/hooks/useFacialRegistration";
import { getFacialRecordsSnapshot } from "@/features/facial/facialStore";
import { canStartFacialCapture, hasUnusedFacialApproval } from "@/features/facial/registrationAccess";
import { Colors } from "@/shared/constants/colors";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { useAppDialog } from "@/shared/hooks/useAppDialog";
import { getMyProfile } from "@/shared/services/authService";
import {
  fetchMyFacialEnrollmentStatus,
  fetchMyFacialResetState,
  requestMyFacialReset,
  type FacialResetState,
} from "@/shared/services/facialEnrollmentService";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type Step = "confirm" | "camera" | "done";

export function useApprenticeFacial() {
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
  const [identityProfile, setIdentityProfile] = useState<{ userId: string; name: string; failed?: boolean } | null>(null);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = theme.surface;
  const border = theme.border;
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  // Nombre completo del aprendiz
  const sessionName = `${user?.firstName || user?.name || ""} ${user?.lastName || user?.lastname || ""}`.trim();
  const fullName = identityProfile?.userId === user?.id ? identityProfile?.name || sessionName : sessionName;
  const identityFailed = identityProfile?.userId === user?.id && identityProfile?.failed;

  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;
    let cancelled = false;
    getMyProfile().then((profile) => {
      if (cancelled) return;
      const name = `${profile.firstName || profile.name || ""} ${profile.lastName || profile.lastname || ""}`.trim();
      setIdentityProfile({ userId, name, failed: !name });
    }).catch(() => {
      if (!cancelled) setIdentityProfile({ userId, name: "", failed: true });
    });
    return () => { cancelled = true; };
  }, [user?.id]);

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
  }, [resetState]);

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
    isRegistering,
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



  const canStartRegistration = !!fullName && canStartFacialCapture({ registered: serverRegistered, savedInThisScreen,
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
    return {
    theme,
    t,
    DialogUI,
    step,
    confirmed,
    setConfirmed,
    captureWarningVisible,
    setCaptureWarningVisible,
    resetRequested,
    sendingReset,
    loadingRegistrationStatus,
    registrationStatusError,
    text,
    muted,
    cardBg,
    border,
    bg,
    fullName,
    identityFailed,
    isRegistered,
    unusedApproval,
    screenState,
    isTaking,
    isValidatingLiveness,
    isRegistering,
    quality,
    successModalVisible,
    errorModalVisible,
    errorModalTitle,
    errorModalMessage,
    livenessInstruction,
    isWeb,
    isPositioning,
    cameraRef,
    handleConfirmCamera,
    handleWebCapture,
    handleWebShutter,
    handleCloseErrorModal,
    canStartRegistration,
    handleCancelAndReturn,
    handleConfirmAndProceed,
    handleAcceptCaptureWarning,
    handleRequestFacialReset,
    handleSuccess,
    registeredDateLabel,
  };
}

export type ApprenticeFacialModel = ReturnType<typeof useApprenticeFacial>;
