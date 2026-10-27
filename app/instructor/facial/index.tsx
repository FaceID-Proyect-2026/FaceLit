import { useEnvironmentSession } from "@/features/environments/useEnvironmentSession";
import { fetchCurrentActiveEnvironmentSession } from "@/features/environments/environmentSessionApi";
import { useFacialRegistry } from "@/features/facial/useFacialRegistry";
import { AppButton, InputField, SelectField } from "@/shared/components/ui";
import { Colors } from "@/shared/constants/colors";
import { Routes } from "@/shared/constants/routes";
import { FontSize, FontWeight } from "@/shared/constants/typography";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { useAppDialog } from "@/shared/hooks/useAppDialog";
import MobileFacialNotice from "@/shared/components/facial/MobileFacialNotice";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

export default function FacialManagementScreen() {
  const { logout, user } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const {
    config,
    sectionDraft,
    settings,
    activeSession,
    saveConfig,
    saveSectionDraft,
    saveSettings,
    setActiveSession,
  } = useFacialRegistry(user?.id);
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
    chipsLoading,
    chipsError,
    reloadChips,
    selectedChipId,
    setSelectedChipId,
    loading,
    saving,
    saveSession,
  } = useEnvironmentSession();
  useFocusEffect(useCallback(() => { reloadChips(); }, [reloadChips]));
  const restoredConfigRef = useRef(false);
  const remoteSessionKeyRef = useRef<string | null>(null);

  const syncRemoteSession = useCallback(async () => {
    const session = await fetchCurrentActiveEnvironmentSession();
    if (!session) {
      // Un fallo temporal o una respuesta vacía no debe borrar una sesión
      // todavía vigente que fue creada en este navegador. Solo se limpia
      // cuando la copia local también ya superó su shutdown_time.
      const localShutdown = activeSession?.shutdownTime
        ? new Date(activeSession.shutdownTime).getTime()
        : NaN;
      if (Number.isFinite(localShutdown) && localShutdown > Date.now()) return;
      if (!activeSession) return;

      // El backend desactiva las sesiones vencidas. Limpiar también la copia
      // local evita mostrar "Continuar" cuando la jornada ya terminó.
      remoteSessionKeyRef.current = null;
      setActiveSession(undefined);
      return;
    }

    const remoteSessionKey = [
      session.idRecordEnvironment,
      session.idEnvironment,
      session.idInstructorScheduled,
      session.idChip,
      session.exitTime,
      session.shutdownTime,
    ].join('|');
    if (remoteSessionKeyRef.current === remoteSessionKey) return;
    remoteSessionKeyRef.current = remoteSessionKey;

    // Permite que una configuración creada o actualizada desde otro
    // navegador reemplace la copia local de este navegador.
    restoredConfigRef.current = false;
    setActiveSession({
      idRecordEnvironment: session.idRecordEnvironment,
      idEnvironment: session.idEnvironment,
      environmentName: session.environmentName,
      idDevice: session.idDevice,
      deviceCode: session.deviceCode,
      idChip: session.idChip,
      chipCode: session.chipCode,
      idInstructorScheduled: session.idInstructorScheduled,
      instructorScheduledName: session.instructorScheduledName,
      idInstructorInCharge: session.idInstructorInCharge,
      instructorInChargeName: session.instructorInChargeName,
      shutdownTime: session.shutdownTime,
      active: session.active,
    });
    selectEnvironment({
      idEnvironment: session.idEnvironment,
      environmentName: session.environmentName,
    });
    setSelectedInstructorId(session.idInstructorScheduled);

    // La configuración de la sesión vive en el backend, no en el navegador
    // que la creó. Así otro navegador puede reconstruir el formulario y
    // mostrar la misma sesión activa.
    void saveConfig({
      environmentId: session.idEnvironment,
      environmentName: session.environmentName,
      instructorId: session.idInstructorScheduled,
      instructorName: session.instructorScheduledName,
      fichaId: session.idChip,
      fichaNumber: session.chipCode,
    });
    void saveSectionDraft({
      environmentId: session.idEnvironment,
      environmentName: session.environmentName,
      instructorId: session.idInstructorScheduled,
      fichaId: session.idChip,
    });
    void saveSettings({
      registrationMinutes: session.registrationMinutes,
      exitTime: new Date(session.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      shutdownTime: new Date(session.shutdownTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    });
  }, [activeSession, saveConfig, saveSectionDraft, saveSettings, selectEnvironment, setActiveSession, setSelectedInstructorId]);

  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      void syncRemoteSession().catch(() => undefined);
    };
    refresh();
    const timer = setInterval(() => {
      if (mounted) refresh();
    }, 10000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [syncRemoteSession]);

  useEffect(() => {
    if (!activeSession || !chips.some(chip => chip.idChip === activeSession.idChip)) return;
    if (selectedChipId !== activeSession.idChip) {
      setSelectedChipId(activeSession.idChip);
    }
  }, [activeSession, chips, selectedChipId, setSelectedChipId]);

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

  useEffect(() => {
    const savedSection = sectionDraft ?? config;
    if (restoredConfigRef.current || !savedSection) return;
    if (selectedEnvironment || selectedInstructorId || selectedChipId) return;
    if (!savedSection.environmentId || !savedSection.environmentName) return;

    selectEnvironment({
      idEnvironment: savedSection.environmentId,
      environmentName: savedSection.environmentName,
    });
    if (savedSection.instructorId) {
      setSelectedInstructorId(savedSection.instructorId);
    }
    restoredConfigRef.current = true;
  }, [
    config,
    sectionDraft,
    selectEnvironment,
    selectedChipId,
    selectedEnvironment,
    selectedInstructorId,
    setSelectedInstructorId,
  ]);

  useEffect(() => {
    const savedSection = sectionDraft ?? config;
    if (!savedSection || !restoredConfigRef.current || selectedChipId) return;
    if (!savedSection.fichaId || selectedInstructorId !== savedSection.instructorId) return;
    if (!chips.some((chip) => chip.idChip === savedSection.fichaId)) return;

    setSelectedChipId(savedSection.fichaId);
  }, [chips, config, sectionDraft, selectedChipId, selectedInstructorId, setSelectedChipId]);

  if (Platform.OS !== "web") {
    return <MobileFacialNotice attendanceRoute={Routes.ATTENDANCE.INSTRUCTOR} />;
  }

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

  const hasSettings = !!settings;
  const canSave = !!selectedEnvironment && !!selectedInstructor && !!selectedChip && hasSettings && !saving && !chipsLoading && !chipsError;
  const handleContinueSession = () => router.replace(Routes.INSTRUCTOR.FACIAL_CAMERA as any);

  const handleCreateEnvironment = async () => {
    try {
      const environment = await createEnvironment();
      if (environment) {
        void saveSectionDraft({
          environmentId: environment.idEnvironment,
          environmentName: environment.environmentName,
        });
      }
    } catch {
      alert(t("common.error"), t("facial.setup.validation.environmentCreateFailed"));
    }
  };

  const handleSelectEnvironment = (environment: { idEnvironment: string; environmentName: string }) => {
    selectEnvironment(environment);
    void saveSectionDraft({
      environmentId: environment.idEnvironment,
      environmentName: environment.environmentName,
    });
  };

  const handleEnvironmentQueryChange = (value: string) => {
    setEnvironmentQuery(value);
    if (selectedEnvironment?.environmentName.trim().toLowerCase() !== value.trim().toLowerCase()) {
      void saveSectionDraft({ environmentId: undefined, environmentName: value.trim() || undefined });
    }
  };

  const handleSelectInstructor = (idInstructor: string) => {
    if (idInstructor === selectedInstructorId) return;
    setSelectedInstructorId(idInstructor);
    void saveSectionDraft({ instructorId: idInstructor || undefined, fichaId: undefined });
  };

  const handleSelectChip = (idChip: string) => {
    setSelectedChipId(idChip);
    void saveSectionDraft({ fichaId: idChip || undefined });
  };

  const handleSave = async () => {
    if (!canSave) {
      alert(
        t("common.error"),
        hasSettings
          ? t("facial.setup.validation.allRequired")
          : t("facial.settings.validation.allRequired"),
      );
      return;
    }

    const sessionConfig = {
      environmentId: selectedEnvironment.idEnvironment,
      environmentName: selectedEnvironment.environmentName,
      instructorId: selectedInstructor.idInstructor,
      instructorName: `${selectedInstructor.firstName} ${selectedInstructor.lastName}`.trim(),
      fichaId: selectedChip.idChip,
      fichaNumber: selectedChip.chipCode,
    };

    void saveConfig(sessionConfig);
    void saveSectionDraft(sessionConfig);

    const result = await saveSession({
      registrationMinutes: settings.registrationMinutes,
      exitTime: settings.exitTime,
      shutdownTime: settings.shutdownTime,
    });

    if (!result.success) {
      alert(t("common.error"), t(result.error));
      return;
    }

    setActiveSession(result.session);

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
          {activeSession ? (
            <View style={[fs.activeSessionCard, { backgroundColor: theme.primary + "12", borderColor: theme.primary }]}>
              <Ionicons name="play-circle-outline" size={26} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[fs.activeSessionTitle, { color: text }]}>Registro en curso</Text>
                <Text style={[fs.activeSessionBody, { color: muted }]}>La sección de {activeSession.chipCode} en {activeSession.environmentName} sigue habilitada hasta las {new Date(activeSession.shutdownTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.</Text>
              </View>
              <AppButton
                title="Continuar con la sección"
                onPress={handleContinueSession}
                fullWidth={isCompact}
                style={{ ...fs.continueButton, ...(isCompact ? fs.continueButtonCompact : {}) }}
              />
            </View>
          ) : null}
          <View style={[fs.summaryCard, isCompact && fs.summaryCardCompact, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[fs.panelTitle, { color: text }]}>Configuracion actual</Text>
            <View style={fs.timerGrid}>
              <View style={[fs.timerTile, { backgroundColor: theme.primary + "10", borderColor: border }]}>
                <Text style={[fs.timerValue, { color: text }]}>{settings ? `${settings.registrationMinutes} min` : "-"}</Text>
                <Text style={[fs.timerLabel, { color: muted }]}>Registro</Text>
              </View>
              <View style={[fs.timerTile, { backgroundColor: theme.primary + "10", borderColor: border }]}>
                <Text style={[fs.timerValue, { color: text }]}>{settings?.exitTime ?? "-"}</Text>
                <Text style={[fs.timerLabel, { color: muted }]}>Salida</Text>
              </View>
              <View style={[fs.timerTile, { backgroundColor: theme.primary + "10", borderColor: border }]}>
                <Text style={[fs.timerValue, { color: text }]}>{settings?.shutdownTime ?? "-"}</Text>
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
              onChangeText={handleEnvironmentQueryChange}
              placeholder={t("facial.setup.placeholders.environment")}
            />

            {environmentQuery.trim() ? (
              <View style={[fs.optionsBox, { borderColor: border, backgroundColor: cardBg }]}>
                {environments.map((environment) => (
                  <TouchableOpacity
                    key={environment.idEnvironment}
                    onPress={() => handleSelectEnvironment(environment)}
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
              onSelect={handleSelectInstructor}
              placeholder={loading ? t("common.loading") : t("facial.setup.placeholders.instructor")}
            />
            <SelectField
              label={t("facial.setup.fields.ficha")}
              value={selectedChipId}
              options={fichaOptions}
              onSelect={handleSelectChip}
              error={chipsError ? t("facial.setup.chipsLoadFailed") : undefined}
              placeholder={
                chipsLoading ? t("common.loading") : selectedInstructorId
                  ? t("facial.setup.placeholders.ficha")
                  : t("facial.setup.placeholders.instructorFirst")
              }
            />

            {selectedInstructorId && !chipsLoading && (chipsError || chips.length === 0) ? (
              <View>
                {!chipsError ? <Text style={{ color: muted }}>{t("facial.setup.noChips")}</Text> : null}
                <AppButton title={t("dataState.retry")} variant="outline" onPress={reloadChips} />
              </View>
            ) : null}

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
  activeSessionCard: { width: "100%", borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12 },
  activeSessionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.black },
  activeSessionBody: { fontSize: FontSize.sm, marginTop: 4, lineHeight: 18 },
  continueButton: { minWidth: 178, borderRadius: 12 },
  continueButtonCompact: { width: "100%", marginTop: 2 },
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
