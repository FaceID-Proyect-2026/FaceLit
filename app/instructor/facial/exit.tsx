import { verifyEnvironmentSessionExitPassword } from "@/features/environments/environmentSessionApi";
import { useFacialRegistry } from "@/features/facial/useFacialRegistry";
import { Colors } from "@/shared/constants/colors";
import { Routes } from "@/shared/constants/routes";
import { FontSize, FontWeight } from "@/shared/constants/typography";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type CredentialOwner = "RESPONSIBLE" | "REPLACEMENT";

export default function FacialExitScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { activeSession, unlockInstructorHomeOnce } = useFacialRegistry(user?.id);
  const [credentialOwner, setCredentialOwner] = useState<CredentialOwner>("RESPONSIBLE");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const card = theme.surface;
  const hasReplacement = Boolean(activeSession?.idInstructorInCharge);
  const responsibleName = activeSession?.instructorScheduledName || "instructor responsable";
  const replacementName = activeSession?.instructorInChargeName || "instructor de reemplazo";

  async function verifyAndLeave() {
    if (!activeSession || !password.trim() || verifying) return;
    setVerifying(true);
    setError("");
    try {
      const valid = await verifyEnvironmentSessionExitPassword(
        activeSession.idRecordEnvironment,
        password,
        credentialOwner,
      );
      if (!valid) {
        setError("La contraseña no es válida para esta sección.");
        return;
      }
      unlockInstructorHomeOnce();
      router.replace(Routes.INSTRUCTOR.DASHBOARD as any);
    } catch {
      setError("No se pudo validar la contraseña. Intenta nuevamente.");
    } finally {
      setVerifying(false);
    }
  }

  if (!activeSession) {
    return (
      <View style={[s.safe, { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }]}>
        <View style={[s.card, { backgroundColor: card }]}>
          <Text style={[s.title, { color: text }]}>Sección no disponible</Text>
          <Text style={[s.body, { color: muted }]}>No hay una sección de reconocimiento facial activa.</Text>
          <TouchableOpacity onPress={() => router.replace(Routes.INSTRUCTOR.FACIAL as any)} style={[s.button, { backgroundColor: theme.primary }]}>
            <Text style={s.buttonText}>Volver a reconocimiento facial</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.safe, { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }]}>
      <View style={[s.card, { backgroundColor: card }]}>
        <Ionicons name="lock-closed-outline" size={42} color={theme.primary} />
        <Text style={[s.title, { color: text }]}>Sección de reconocimiento facial activa</Text>
        <Text style={[s.body, { color: muted }]}>Para dirigirte al inicio del instructor, confirma la contraseña correspondiente.</Text>

        <View style={s.options}>
          <TouchableOpacity
            onPress={() => { setCredentialOwner("RESPONSIBLE"); setPassword(""); setError(""); }}
            style={[s.option, { borderColor: credentialOwner === "RESPONSIBLE" ? theme.primary : theme.border, backgroundColor: credentialOwner === "RESPONSIBLE" ? theme.primary + "16" : "transparent" }]}
          >
            <Text style={[s.optionText, { color: text }]}>Instructor responsable: {responsibleName}</Text>
          </TouchableOpacity>
          {hasReplacement && (
            <TouchableOpacity
              onPress={() => { setCredentialOwner("REPLACEMENT"); setPassword(""); setError(""); }}
              style={[s.option, { borderColor: credentialOwner === "REPLACEMENT" ? theme.primary : theme.border, backgroundColor: credentialOwner === "REPLACEMENT" ? theme.primary + "16" : "transparent" }]}
            >
              <Text style={[s.optionText, { color: text }]}>Instructor de reemplazo: {replacementName}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          value={password}
          onChangeText={(value) => { setPassword(value); setError(""); }}
          placeholder="Contraseña"
          placeholderTextColor={muted}
          secureTextEntry
          autoFocus
          onSubmitEditing={verifyAndLeave}
          style={[s.input, { color: text, borderColor: error ? Colors.error : theme.border }]}
        />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <TouchableOpacity onPress={verifyAndLeave} disabled={!password.trim() || verifying} style={[s.button, { backgroundColor: theme.primary, opacity: !password.trim() || verifying ? 0.55 : 1 }]}>
          <Text style={s.buttonText}>{verifying ? "Validando…" : "Confirmar y continuar"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.replace(Routes.INSTRUCTOR.FACIAL_CAMERA as any)}
          disabled={verifying}
          style={[s.cancelButton, { borderColor: theme.border, opacity: verifying ? 0.55 : 1 }]}
        >
          <Text style={[s.cancelButtonText, { color: muted }]}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 470, borderRadius: 20, padding: 26, alignItems: "center" },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.black, textAlign: "center", marginTop: 14 },
  body: { fontSize: FontSize.base, lineHeight: 21, textAlign: "center", marginTop: 8 },
  options: { width: "100%", gap: 10, marginTop: 22 },
  option: { width: "100%", borderWidth: 1, borderRadius: 12, padding: 14 },
  optionText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, textAlign: "center" },
  input: { width: "100%", height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, marginTop: 18, fontSize: FontSize.base, outlineStyle: "none" } as any,
  error: { width: "100%", color: Colors.error, fontSize: FontSize.sm, marginTop: 7 },
  button: { width: "100%", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 12, marginTop: 20 },
  buttonText: { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  cancelButton: { width: "100%", alignItems: "center", justifyContent: "center", paddingVertical: 13, borderRadius: 12, borderWidth: 1, marginTop: 10 },
  cancelButtonText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
