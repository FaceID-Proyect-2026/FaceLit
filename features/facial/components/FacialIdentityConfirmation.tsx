import { Colors } from "@/shared/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { ApprenticeFacialModel } from '@/features/facial/hooks/useApprenticeFacial';
import { s } from '@/features/facial/components/apprenticeFacialStyles';

export function FacialIdentityConfirmation({ model }: { model: Pick<ApprenticeFacialModel,
    | "theme"
    | "t"
    | "DialogUI"
    | "confirmed"
    | "setConfirmed"
    | "captureWarningVisible"
    | "setCaptureWarningVisible"
    | "resetRequested"
    | "sendingReset"
    | "loadingRegistrationStatus"
    | "registrationStatusError"
    | "text"
    | "muted"
    | "cardBg"
    | "border"
    | "bg"
    | "fullName"
    | "identityFailed"
    | "isRegistered"
    | "unusedApproval"
    | "canStartRegistration"
    | "handleConfirmAndProceed"
    | "handleAcceptCaptureWarning"
    | "handleRequestFacialReset"
    | "registeredDateLabel"
  > }) {
  const {
    theme,
    t,
    DialogUI,
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
    canStartRegistration,
    handleConfirmAndProceed,
    handleAcceptCaptureWarning,
    handleRequestFacialReset,
    registeredDateLabel,
  } = model;
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
              <Text style={s.nameBadgeText}>{fullName || t(identityFailed ? "common.error" : "common.loading")}</Text>
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
