import FaceGuideOverlay from "@/features/auth/components/FaceGuideOverlay";
import WebCamera from "@/features/auth/components/WebCamera";
import { Colors } from "@/shared/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { ApprenticeFacialModel } from '@/features/facial/hooks/useApprenticeFacial';
import { s } from '@/features/facial/components/apprenticeFacialStyles';

export function FacialLiveCapture({ model }: { model: Pick<ApprenticeFacialModel,
    | "theme"
    | "t"
    | "DialogUI"
    | "text"
    | "muted"
    | "cardBg"
    | "screenState"
    | "isTaking"
    | "isValidatingLiveness"
    | "isRegistering"
    | "quality"
    | "successModalVisible"
    | "errorModalVisible"
    | "errorModalTitle"
    | "errorModalMessage"
    | "livenessInstruction"
    | "isWeb"
    | "isPositioning"
    | "cameraRef"
    | "handleConfirmCamera"
    | "handleWebCapture"
    | "handleWebShutter"
    | "handleCloseErrorModal"
    | "handleCancelAndReturn"
    | "handleSuccess"
  > }) {
  const {
    theme,
    t,
    DialogUI,
    text,
    muted,
    cardBg,
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
    handleCancelAndReturn,
    handleSuccess,
  } = model;
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
              isProcessing={isValidatingLiveness || isRegistering}
              paused={isValidatingLiveness || isRegistering || errorModalVisible || successModalVisible}
              livenessInstruction={livenessInstruction}
            />
          ) : (
            (() => {
              // require condicional: evita que CameraView sea null en web
              // The native camera must stay lazy: web rendering cannot load this native view.
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              const { CameraView: NativeCameraView } = require("expo-camera");
              return (
                <View style={{ flex: 1 }}>
                  <NativeCameraView
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    facing="front"
                    mirror
                  />
                  <FaceGuideOverlay
                    primaryColor={theme.primary}
                    isPositioning={isPositioning}
                    screenState={screenState}
                    quality={quality}
                    requiresLiveness
                    livenessCaptureActive={isTaking}
                    isProcessing={isValidatingLiveness || isRegistering}
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
