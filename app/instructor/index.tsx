import { findCurrentInstructor, getFichasForInstructor } from "@/features/academic/currentAcademic";
import { getProgramDisplayName } from "@/features/academic/types";
import { useAcademic } from "@/features/academic/useAcademic";
import { useAttendance } from "@/features/attendance/useAttendance";
import { Colors } from "@/shared/constants/colors";
import { Routes } from "@/shared/constants/routes";
import { FontSize, FontWeight } from "@/shared/constants/typography";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface StatCard {
  icon: string;
  value: string;
  label: string;
}

interface QuickAction {
  icon: string;
  label: string;
  route: string;
}

export default function InstructorDashboard() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { allFichas, allInstructors, allPrograms } = useAcademic();
  const attendanceRecords = useAttendance();
  const [fichaSearch, setFichaSearch] = useState("");

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = theme.surface;
  const border = theme.border;
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const currentInstructor = useMemo(
    () => findCurrentInstructor(allInstructors, user),
    [allInstructors, user],
  );
  const assignedFichas = useMemo(
    () => getFichasForInstructor(allFichas, currentInstructor),
    [allFichas, currentInstructor],
  );
  const assignedPrograms = useMemo(() => {
    const ids = new Set(assignedFichas.map(ficha => ficha.programId));
    return allPrograms.filter(program => ids.has(program.id));
  }, [allPrograms, assignedFichas]);
  const visibleFichas = useMemo(() => {
    const term = fichaSearch.trim().toLowerCase();
    if (term.length === 0) return [];
    return assignedFichas.filter(ficha => {
      const program = allPrograms.find(item => item.id === ficha.programId);
      return ficha.number.toLowerCase().includes(term)
        || ficha.code.toLowerCase().includes(term)
        || (program ? getProgramDisplayName(program, t).toLowerCase().includes(term) : false);
    });
  }, [allPrograms, assignedFichas, fichaSearch, t]);
  const activeLearners = useMemo(() => {
    const learnerIds = new Set<string>();
    assignedFichas.forEach(ficha => {
      ficha.learners.forEach(learner => {
        if (learner.status === "active") learnerIds.add(learner.id);
      });
    });
    return learnerIds.size;
  }, [assignedFichas]);
  const attendanceRate = useMemo(() => {
    const fichaIds = new Set(assignedFichas.map(ficha => ficha.id));
    const scoped = attendanceRecords.filter(record => fichaIds.has(record.fichaId));
    if (scoped.length === 0) return 0;
    const present = scoped.filter(record => record.status !== "absent").length;
    return Math.round((present / scoped.length) * 100);
  }, [assignedFichas, attendanceRecords]);

  const stats: StatCard[] = [
    { icon: "people-outline", value: String(activeLearners), label: t("dashboard.learnersInCharge") },
    { icon: "school-outline", value: String(assignedFichas.length), label: t("dashboard.assignedFichas") },
    { icon: "library-outline", value: String(assignedPrograms.length), label: t("dashboard.programs") },
    { icon: "checkmark-circle-outline", value: `${attendanceRate}%`, label: t("dashboard.attendanceRate") },
  ];

  const quickActions: QuickAction[] = [
    { icon: "school-outline", label: t("dashboard.myFichas"), route: "/instructor/academic" },
    { icon: "people-outline", label: t("dashboard.attendance"), route: "/instructor/attendance" },
    { icon: "scan-outline", label: t("sidebar.facial"), route: Routes.INSTRUCTOR.FACIAL },
    { icon: "person-outline", label: t("sidebar.profile"), route: Routes.PROFILE.VIEW },
  ];

  const displayName = user?.firstName ?? user?.name ?? user?.email?.split("@")[0] ?? t("users.roles.INSTRUCTOR");

  return (
    <View style={[ads.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={ads.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={["#2E7D32", "#65B361"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={ads.welcomeBanner}
        >
          <View style={{ flex: 1 }}>
            <Text style={ads.welcomeKicker}>{t("dashboard.instructorTitle")}</Text>
            <Text style={ads.welcomeTitle}>{displayName}</Text>
            <Text style={ads.welcomeSubtitle}>{t("dashboard.instructorSubtitle")}</Text>
          </View>
          <Ionicons name="person-circle-outline" size={62} color="rgba(255,255,255,0.28)" />
        </LinearGradient>

        <View style={ads.statsGrid}>
          {stats.map(stat => (
            <View key={stat.label} style={[ads.statCard, { backgroundColor: cardBg, borderColor: border }]}>
              <Ionicons name={stat.icon as any} size={22} color={theme.primary} />
              <Text style={[ads.statValue, { color: text }]}>{stat.value}</Text>
              <Text style={[ads.statLabel, { color: muted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={[ads.scopeCard, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={ads.scopeHeader}>
            <View style={[ads.scopeIcon, { backgroundColor: theme.primary + "18" }]}>
              <Ionicons name="albums-outline" size={22} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[ads.scopeTitle, { color: text }]}>{t("dashboard.academicScope")}</Text>
              <Text style={[ads.scopeSubtitle, { color: muted }]}>{t("dashboard.searchAssignedFicha")}</Text>
            </View>
          </View>

          <View style={[ads.searchWrap, { backgroundColor: bg, borderColor: border }]}>
            <Ionicons name="search-outline" size={18} color={muted} />
            <TextInput
              value={fichaSearch}
              onChangeText={setFichaSearch}
              placeholder={t("dashboard.searchFichaPlaceholder")}
              placeholderTextColor={muted}
              style={[ads.searchInput, { color: text }] as any}
            />
          </View>

          <View style={ads.fichaList}>
            {visibleFichas.map(ficha => {
              const program = allPrograms.find(item => item.id === ficha.programId);
              return (
                <TouchableOpacity
                  key={ficha.id}
                  onPress={() => router.push(`/instructor/academic/fichas/${ficha.id}` as any)}
                  style={[ads.fichaChip, { backgroundColor: theme.primary + "08", borderColor: border }]}
                  activeOpacity={0.75}
                >
                  <View>
                    <Text style={[ads.fichaChipTitle, { color: text }]}>{t('dashboard.apprenticeFicha')} {ficha.number}</Text>
                    <Text style={[ads.fichaChipMeta, { color: muted }]} numberOfLines={1}>
                      {program ? getProgramDisplayName(program, t) : t("dashboard.noProgram")} · {ficha.learners.length} {t("instructorAcademic.learners")}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={muted} />
                </TouchableOpacity>
              );
            })}
            {assignedFichas.length === 0 && (
              <Text style={[ads.emptyScope, { color: muted }]}>{t("dashboard.noAssignedFichas")}</Text>
            )}
            {assignedFichas.length > 0 && fichaSearch.trim().length === 0 && (
              <Text style={[ads.emptyScope, { color: muted }]}>{t("dashboard.typeToSearchFicha")}</Text>
            )}
            {assignedFichas.length > 0 && fichaSearch.trim().length > 0 && visibleFichas.length === 0 && (
              <Text style={[ads.emptyScope, { color: muted }]}>{t("dashboard.noFichasForSearch")}</Text>
            )}
          </View>
        </View>

        <Text style={[ads.sectionTitle, { color: text }]}>{t("dashboard.quickActions")}</Text>
        <View style={ads.quickGrid}>
          {quickActions.map(action => (
            <TouchableOpacity
              key={action.route}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.75}
              style={[ads.quickCard, { backgroundColor: cardBg, borderColor: border }]}
            >
              <View style={[ads.quickIconWrap, { backgroundColor: theme.primary + "18" }]}>
                <Ionicons name={action.icon as any} size={24} color={theme.primary} />
              </View>
              <Text style={[ads.quickLabel, { color: text }]}>{action.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={muted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const ads = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  welcomeBanner: { borderRadius: 16, padding: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  welcomeKicker: { color: "rgba(255,255,255,0.82)", fontSize: FontSize.sm, marginBottom: 4 },
  welcomeTitle: { color: Colors.white, fontSize: FontSize["2xl"], fontWeight: FontWeight.black },
  welcomeSubtitle: { color: "rgba(255,255,255,0.88)", fontSize: FontSize.sm, marginTop: 6, lineHeight: 19 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  statCard: { flex: 1, minWidth: 150, borderRadius: 14, borderWidth: 1, padding: 16, alignItems: "center" },
  statValue: { fontSize: FontSize["2xl"], fontWeight: FontWeight.black, marginTop: 8 },
  statLabel: { fontSize: FontSize.sm, marginTop: 4, textAlign: "center" },
  scopeCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  scopeHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  scopeIcon: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  scopeTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black },
  scopeSubtitle: { fontSize: FontSize.xs, marginTop: 2, lineHeight: 16 },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, height: 44, paddingHorizontal: 12, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: FontSize.sm, outlineStyle: "none" } as any,
  fichaList: { gap: 8 },
  fichaChip: { borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  fichaChipTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  fichaChipMeta: { fontSize: FontSize.xs, marginTop: 2 },
  emptyScope: { fontSize: FontSize.sm, textAlign: "center", paddingVertical: 14 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: 12 },
  quickGrid: { gap: 12, marginBottom: 24 },
  quickCard: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 14, borderWidth: 1, padding: 16 },
  quickIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  quickLabel: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
