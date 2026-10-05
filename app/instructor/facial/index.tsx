import { useEnvironmentSession } from "@/features/environments/useEnvironmentSession";
import { useFacialRegistry } from "@/features/facial/useFacialRegistry";
import { AppButton, InputField, SelectField } from "@/shared/components/ui";
import { Colors } from "@/shared/constants/colors";
import { Routes } from "@/shared/constants/routes";
import { FontSize, FontWeight } from "@/shared/constants/typography";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { useAppDialog } from "@/shared/hooks/useAppDialog";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

export default function FacialManagementScreen() {
  const { logout } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { settings, saveConfig } = useFacialRegistry();
  const { alert, DialogUI } = useAppDialog();
  const {
    environmentQuery,
    setEnvironmentQuery,
    environments,
    selectedEnvironment,
    selectEnvironment,
    createEnvironment,
    exactEnvironmentMatch,
    instructors,
    selectedInstructorId,
    setSelectedInstructorId,
    chips,
    selectedChipId,
    setSelectedChipId,
    loading,
    saving,
    saveSession,
  } = useEnvironmentSession();

  useEffect(() => {
    if (typeof window === "undefined" || !window.history?.pushState) return;

    window.history.pushState({ facialBackGuard: true }, "", window.location.href);

    const handleBrowserBack = async () => {
      window.history.pushState({ facialBackGuard: true }, "", window.location.href);
      await logout();
      router.replace(Routes.AUTH.LOGIN as any);
    };

    window.addEventListener("popstate", handleBrowserBack);
    return () => window.removeEventListener("popstate", handleBrowserBack);
  }, [logout]);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = theme.surface;
  const border = theme.border;
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const isCompact = width < 700;

  const instructorOptions = instructors.map((instructor) => ({
    value: instructor.idInstructor,
    label: `${instructor.firstName} ${instructor.lastName} - ${instructor.instructorType}`,
  }));

  const fichaOptions = chips.map((chip) => ({
    value: chip.idChip,
    label: `${t("facial.setup.fields.ficha")} ${chip.chipCode} - ${chip.programName}`,
  }));
  const selectedInstructor = instructors.find((instructor) => instructor.idInstructor === selectedInstructorId);
  const selectedChip = chips.find((chip) => chip.idChip === selectedChipId);
  const sessionSummary = [
    { icon: "business-outline", label: t("facial.setup.fields.environment"), value: selectedEnvironment?.environmentName ?? t("facial.setup.unselected") },
    { icon: "person-outline", label: t("facial.setup.fields.instructor"), value: selectedInstructor ? `${selectedInstructor.firstName} ${selectedInstructor.lastName}` : t("facial.setup.unselected") },
    { icon: "school-outline", label: t("facial.setup.fields.ficha"), value: selectedChip ? `${t("facial.setup.fields.ficha")} ${selectedChip.chipCode}` : t("facial.setup.unselected") },
  ];

  const canSave = !!selectedEnvironment && !!selectedInstructor && !!selectedChip && !saving;

  const handleCreateEnvironment = async () => {
    try {
      await createEnvironment();
    } catch {
      alert(t("common.error"), t("facial.setup.validation.environmentCreateFailed"));
    }
  };

  const handleSave = async () => {
    if (!canSave) {
      alert(t("common.error"), t("facial.setup.validation.allRequired"));
      return;
    }

    const result = await saveSession({
      registrationMinutes: settings.registrationMinutes,
      exitTime: settings.exitTime,
      shutdownTime: settings.shutdownTime,
    });

    const sessionConfig = result.success
      ? {
          environmentId: result.session.idEnvironment,
          environmentName: result.session.environmentName,
          instructorId: result.session.idInstructorInCharge,
          instructorName: result.session.instructorName,
          fichaId: result.session.idChip,
          fichaNumber: result.session.chipCode,
        }
      : {
          environmentId: selectedEnvironment.idEnvironment,
          environmentName: selectedEnvironment.environmentName,
          instructorId: selectedInstructor.idInstructor,
          instructorName: `${selectedInstructor.firstName} ${selectedInstructor.lastName}`.trim(),
          fichaId: selectedChip.idChip,
          fichaNumber: selectedChip.chipCode,
        };

    saveConfig(sessionConfig);

    alert(t("common.success"), t("facial.setup.saveSuccess"), [
      {
        text: t("common.ok"),
        onPress: () => router.replace(Routes.INSTRUCTOR.FACIAL_CAMERA as any),
      },
    ]);
  };

  return (
    <View style={[fs.safe, { backgroundColor: bg }]}>
      <View style={fs.header}>
        <View style={{ flex: 1 }}>
          <Text style={[fs.title, { color: text }]}>{t("sidebar.facial")}</Text>
          <Text style={{ color: muted, fontSize: FontSize.xs, marginTop: 2 }}>
            {t("facial.setup.subtitle")}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[fs.scroll, isCompact && fs.scrollCompact]} showsHorizontalScrollIndicator={false}>
        <View style={[fs.heroCard, isCompact && fs.heroCardCompact, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={[fs.heroIcon, { backgroundColor: theme.primary + "18" }]}>
            <Ionicons name="scan-outline" size={28} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[fs.heroTitle, { color: text }]}>Punto de reconocimiento</Text>
            <Text style={[fs.heroSubtitle, { color: muted }]}>Prepara la jornada antes de activar el registro de asistencia.</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push(Routes.FACIAL.SETTINGS as any)}
            style={[fs.heroAction, { borderColor: border, backgroundColor: theme.primary + "10" }]}
          >
            <Ionicons name="options-outline" size={18} color={theme.primary} />
            <Text style={[fs.heroActionText, { color: theme.primary }]}>{t("facial.setup.settingsButton")}</Text>
          </TouchableOpacity>
        </View>

        <View style={[fs.contentGrid, isCompact && fs.contentGridCompact]}>
          <View style={[fs.summaryCard, isCompact && fs.summaryCardCompact, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[fs.panelTitle, { color: text }]}>Configuracion actual</Text>
            <View style={fs.timerGrid}>
              <View style={[fs.timerTile, { backgroundColor: theme.primary + "10", borderColor: border }]}>
                <Text style={[fs.timerValue, { color: text }]}>{settings.registrationMinutes} min</Text>
                <Text style={[fs.timerLabel, { color: muted }]}>Registro</Text>
              </View>
              <View style={[fs.timerTile, { backgroundColor: theme.primary + "10", borderColor: border }]}>
                <Text style={[fs.timerValue, { color: text }]}>{settings.exitTime}</Text>
                <Text style={[fs.timerLabel, { color: muted }]}>Salida</Text>
              </View>
              <View style={[fs.timerTile, { backgroundColor: theme.primary + "10", borderColor: border }]}>
                <Text style={[fs.timerValue, { color: text }]}>{settings.shutdownTime}</Text>
                <Text style={[fs.timerLabel, { color: muted }]}>Apagado</Text>
              </View>
            </View>

            <Text style={[fs.panelTitle, { color: text, marginTop: 18 }]}>Resumen de sesion</Text>
            <View style={fs.summaryList}>
              {sessionSummary.map((item) => (
                <View key={item.label} style={[fs.summaryRow, { borderColor: border }]}>
                  <View style={[fs.summaryIcon, { backgroundColor: theme.primary + "18" }]}>
                    <Ionicons name={item.icon as any} size={17} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[fs.summaryLabel, { color: muted }]}>{item.label}</Text>
                    <Text style={[fs.summaryValue, { color: text }]} numberOfLines={1}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={[fs.card, isCompact && fs.cardCompact, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={[fs.iconWrap, { backgroundColor: theme.primary + "18" }]}>
              <Ionicons name="scan-outline" size={28} color={theme.primary} />
            </View>
            <Text style={[fs.cardTitle, { color: text }]}>{t("facial.setup.title")}</Text>
            <Text style={[fs.cardSubtitle, { color: muted }]}>{t("facial.setup.helper")}</Text>

            <InputField
              label={t("facial.setup.fields.environment")}
              value={environmentQuery}
              onChangeText={setEnvironmentQuery}
              placeholder={t("facial.setup.placeholders.environment")}
            />

            {environmentQuery.trim() ? (
              <View style={[fs.optionsBox, { borderColor: border, backgroundColor: cardBg }]}>
                {environments.map((environment) => (
                  <TouchableOpacity
                    key={environment.idEnvironment}
                    onPress={() => selectEnvironment(environment)}
                    style={[
                      fs.optionRow,
                      selectedEnvironment?.idEnvironment === environment.idEnvironment && {
                        backgroundColor: theme.primary + "18",
                      },
                    ]}
                  >
                    <Ionicons name="business-outline" size={16} color={theme.primary} />
                    <Text style={[fs.optionText, { color: text }]}>{environment.environmentName}</Text>
                  </TouchableOpacity>
                ))}
                {!exactEnvironmentMatch ? (
                  <TouchableOpacity onPress={handleCreateEnvironment} style={fs.optionRow}>
                    <Ionicons name="add-circle-outline" size={16} color={theme.primary} />
                    <Text style={[fs.optionText, { color: theme.primary }]}>
                      {t("facial.setup.createEnvironment", { name: environmentQuery.trim() })}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            <SelectField
              label={t("facial.setup.fields.instructor")}
              value={selectedInstructorId}
              options={instructorOptions}
              onSelect={setSelectedInstructorId}
              placeholder={loading ? t("common.loading") : t("facial.setup.placeholders.instructor")}
            />
            <SelectField
              label={t("facial.setup.fields.ficha")}
              value={selectedChipId}
              options={fichaOptions}
              onSelect={setSelectedChipId}
              placeholder={
                selectedInstructorId
                  ? t("facial.setup.placeholders.ficha")
                  : t("facial.setup.placeholders.instructorFirst")
              }
            />

            <AppButton
              title={t("facial.setup.settingsButton")}
              variant="outline"
              onPress={() => router.push(Routes.FACIAL.SETTINGS as any)}
              style={{ marginTop: 16 }}
            />
            <AppButton
              title={saving ? t("common.loading") : t("common.save")}
              onPress={handleSave}
              disabled={!canSave}
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </ScrollView>
      {DialogUI}
    </View>
  );
}

const fs = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  scroll: { flexGrow: 1, padding: 16, paddingBottom: 40 },
  scrollCompact: { paddingHorizontal: 14, paddingBottom: 28 },
  heroCard: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroCardCompact: {
    padding: 14,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  heroIcon: { width: 58, height: 58, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  heroTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  heroSubtitle: { fontSize: FontSize.sm, marginTop: 4, lineHeight: 19 },
  heroAction: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  heroActionText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  contentGrid: { width: "100%", flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 16 },
  contentGridCompact: { flexDirection: "column", flexWrap: "nowrap", alignItems: "stretch", justifyContent: "flex-start" },
  summaryCard: {
    flex: 1,
    flexBasis: 330,
    maxWidth: 470,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignSelf: "stretch",
  },
  summaryCardCompact: {
    width: "100%",
    maxWidth: undefined,
    flexBasis: "auto",
    padding: 14,
  },
  panelTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black, marginBottom: 12 },
  timerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timerTile: { flex: 1, minWidth: 92, borderRadius: 14, borderWidth: 1, padding: 12 },
  timerValue: { fontSize: FontSize.lg, fontWeight: FontWeight.black },
  timerLabel: { fontSize: FontSize.xs, marginTop: 4 },
  summaryList: { gap: 10 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 13, padding: 12 },
  summaryIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  summaryLabel: { fontSize: FontSize.xs, marginBottom: 2 },
  summaryValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 420,
  },
  card: {
    width: "100%",
    maxWidth: 460,
    flexBasis: 420,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "stretch",
  },
  cardCompact: {
    maxWidth: undefined,
    flexBasis: "auto",
    padding: 16,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    textAlign: "center",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: FontSize.sm,
    textAlign: "center",
    marginBottom: 20,
  },
  optionsBox: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: -6,
    marginBottom: 14,
    overflow: "hidden",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionText: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
});
