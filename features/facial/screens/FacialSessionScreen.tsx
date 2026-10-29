import { AppButton, InputField, SelectField } from '@/shared/components/ui';
import { Colors } from '@/shared/constants/colors';
import { Routes } from '@/shared/constants/routes';
import { FontSize } from '@/shared/constants/typography';
import MobileFacialNotice from '@/shared/components/facial/MobileFacialNotice';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { fs } from '@/features/facial/components/FacialSessionStyles';

import { useFacialSessionScreen } from '@/features/facial/hooks/useFacialSessionScreen';

export default function FacialSessionScreen() {
  const {
    theme,
    isDark,
    t,
    width,
    settings,
    activeSession,
    saveConfig,
    saveSectionDraft,
    setActiveSession,
    alert,
    DialogUI,
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
  } = useFacialSessionScreen();
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
