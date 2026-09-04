import { useAcademic } from "@/features/academic/useAcademic";
import { useTransferRequests } from "@/features/academic/useTransferRequests";
import { Colors } from "@/shared/constants/colors";
import { FontSize, FontWeight } from "@/shared/constants/typography";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { useAppDialog } from "@/shared/hooks/useAppDialog";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function TransferRequestsScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { allFichas } = useAcademic();
  const { requests, approve, reject } = useTransferRequests();
  const { alert, DialogUI } = useAppDialog();
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const card = isDark ? Colors.dark.surface : Colors.white;
  const pending = requests.filter((request) => request.status === "pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [conditions, setConditions] = useState("");
  const fichaName = (id: string) =>
    allFichas.find((ficha) => ficha.id === id)?.number ?? id;
  const learnerName = (request: (typeof requests)[number]) =>
    allFichas
      .flatMap((ficha) => ficha.learners)
      .find((learner) => learner.id === request.learnerId)?.name ??
    request.learnerId;
  const confirmApprove = (id: string) =>
    alert(t("academic.transferApprove"), t("academic.transferApproveConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("academic.transferApprove"),
        onPress: () => {
          approve(id, user?.id ?? "coordinator", conditions.trim());
          setConditions("");
        },
      },
    ]);
  const confirmReject = (id: string) => {
    if (!reason.trim()) return;
    reject(id, user?.email ?? "coordinator", reason.trim());
    setRejectingId(null);
    setReason("");
    setConditions("");
  };
  return (
    <View style={[styles.safe, { backgroundColor: bg }]}>
      <Text style={[styles.title, { color: text }]}>
        {t("academic.transferRequestsTitle")}
      </Text>
      <FlatList
        data={pending}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={{ color: muted, textAlign: "center", marginTop: 40 }}>
            {t("academic.transferRequestsEmpty")}
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              { backgroundColor: card, borderColor: theme.primary + "30" },
            ]}
          >
            <Text style={[styles.name, { color: text }]}>
              {learnerName(item)}
            </Text>
            <Text style={{ color: muted }}>
              {item.learnerFicha || fichaName(item.currentFichaId)} →{" "}
              {fichaName(item.requestedFichaId)}
            </Text>
            <Text style={{ color: muted, marginTop: 4 }}>
              {new Date(item.requestedAt).toLocaleDateString()}
            </Text>
            <TextInput
              value={conditions}
              onChangeText={setConditions}
              placeholder={t("academic.transferApprovalConditions")}
              placeholderTextColor={muted}
              style={[
                styles.reason,
                { color: text, borderColor: theme.primary },
              ]}
            />
            {rejectingId === item.id && (
              <>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder={t("academic.transferRejectReason")}
                  placeholderTextColor={muted}
                  style={[
                    styles.reason,
                    {
                      color: text,
                      borderColor: reason.trim() ? theme.primary : Colors.error,
                    },
                  ]}
                />
                <TouchableOpacity
                  onPress={() => confirmReject(item.id)}
                  disabled={!reason.trim()}
                  style={[
                    styles.button,
                    { backgroundColor: reason.trim() ? Colors.error : muted },
                  ]}
                >
                  <Text style={styles.buttonText}>
                    {t("academic.transferReject")}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            <View style={styles.buttons}>
              <TouchableOpacity
                onPress={() => confirmApprove(item.id)}
                style={[styles.button, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.buttonText}>
                  {t("academic.transferApprove")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setRejectingId(item.id);
                  setReason("");
                }}
                style={[styles.button, { backgroundColor: Colors.error }]}
              >
                <Text style={styles.buttonText}>
                  {t("academic.transferReject")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      {DialogUI}
    </View>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, padding: 16 },
  title: {
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.black,
    marginBottom: 12,
  },
  list: { gap: 12 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16 },
  name: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: 6 },
  buttons: { flexDirection: "row", gap: 8, marginTop: 14 },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  reason: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginTop: 12,
  },
  buttonText: { color: Colors.white, fontWeight: FontWeight.bold },
});
