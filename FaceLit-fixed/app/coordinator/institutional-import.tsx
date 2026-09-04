import {
    correctInstitutionalLearnerStore,
    getFichasSnapshot,
    updateLearnerDocument,
} from "@/features/academic/academicStore";
import { useAcademic } from "@/features/academic/useAcademic";
import { Colors } from "@/shared/constants/colors";
import { FontSize, FontWeight } from "@/shared/constants/typography";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useTheme } from "@/shared/contexts/ThemeContext";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type CsvSummary = { total: number; validated: number; inconsistency: number; userNotFound: number; fichaNotFound: number };
type CsvInconsistency = { id: string; fichaId: string; learnerId: string; learnerName: string; document: string; issue: string };

export default function InstitutionalImportScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { markValidation, removeLearner, addLearner } = useAcademic();
  const [summary, setSummary] = useState<CsvSummary | null>(null);
  const [inconsistencies, setInconsistencies] = useState<CsvInconsistency[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const normalize = (value: string) => value.trim().toLowerCase();
  const parseCsvLine = (line: string) => {
    const values: string[] = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"' && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') quoted = !quoted;
      else if (character === "," && !quoted) {
        values.push(value.trim());
        value = "";
      } else value += character;
    }
    values.push(value.trim());
    return values;
  };
  const selectFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "text/csv",
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const csv = await FileSystem.readAsStringAsync(result.assets[0].uri);
    const lines = csv.split(/\r?\n/).filter((line) => line.trim());
    const headers = parseCsvLine(lines.shift() ?? "").map(normalize);
    const column = (...names: string[]) =>
      headers.findIndex((header) => names.includes(header));
    const documentIndex = column(
      "document",
      "documento",
      "identification",
      "identificacion",
    );
    const learnerIdIndex = column("id", "learnerid", "learner id");
    const nameIndex = column("name", "nombre");
    const lastnameIndex = column("lastname", "last name", "apellido");
    const fichaIndex = column(
      "ficha",
      "fichacode",
      "ficha code",
      "codigo",
      "codigo ficha",
    );
    if (documentIndex < 0 || fichaIndex < 0) {
      setSummary({ total: lines.length, validated: 0, inconsistency: 0, userNotFound: lines.length, fichaNotFound: 0 });
      return;
    }
    let validated = 0;
    let inconsistencies = 0;
    let notFound = 0;
    let fichaNotFound = 0;
    const found: CsvInconsistency[] = [];
    lines.forEach((line) => {
      const values = parseCsvLine(line);
      const document = values[documentIndex] ?? "";
      const learnerId =
        learnerIdIndex >= 0 ? (values[learnerIdIndex] ?? "") : "";
      const name = nameIndex >= 0 ? (values[nameIndex] ?? "") : "";
      const lastname = lastnameIndex >= 0 ? (values[lastnameIndex] ?? "") : "";
      const fichaCode = values[fichaIndex] ?? "";
      const fichas = getFichasSnapshot();
      const current = fichas.find((ficha) =>
        ficha.learners.some(
          (learner) =>
            learner.id === learnerId || learner.document === document,
        ),
      );
      const learner = current?.learners.find(
        (item) => item.id === learnerId || item.document === document,
      );
      const target = fichas.find(
        (ficha) =>
          ficha.code.toLowerCase() === fichaCode.toLowerCase() ||
          ficha.number === fichaCode,
      );
      if (!current || !learner) {
        notFound++;
        return;
      }
      if (
        !target ||
        target.status !== "active" ||
        (name && normalize(learner.name) !== normalize(name)) ||
        (lastname && normalize(learner.lastname) !== normalize(lastname))
      ) {
        if (!target || target.status !== "active") fichaNotFound++;
        markValidation(learner.id, "inconsistency");
        inconsistencies++;
        found.push({ id: `${learner.id}-${inconsistencies}`, fichaId: current.id, learnerId: learner.id, learnerName: `${learner.name} ${learner.lastname}`, document, issue: !target ? t("academic.institutionalFichaNotFound") : t("academic.institutionalDataInconsistency") });
        return;
      }
      if (document !== learner.document)
        updateLearnerDocument(
          current.id,
          learner.id,
          document,
          "institutional-import",
        );
      markValidation(learner.id, "validated");
      const updatedLearner =
        getFichasSnapshot()
          .find((ficha) => ficha.id === current.id)
          ?.learners.find((item) => item.id === learner.id) ?? learner;
      if (current.id !== target.id) {
        removeLearner(current.id, learner.id);
        addLearner(target.id, updatedLearner);
      }
      validated++;
    });
    setSummary({ total: lines.length, validated, inconsistency: inconsistencies, userNotFound: notFound, fichaNotFound });
    setInconsistencies(found);
  };
  const correct = (item: CsvInconsistency) => { const result = correctInstitutionalLearnerStore(item.fichaId, item.learnerId, item.document, reasons[item.id] ?? "", user?.id ?? "coordinator"); if (result.success) setInconsistencies(current => current.filter(entry => entry.id !== item.id)); };
  return (
    <View style={[styles.safe, { backgroundColor: bg }]}>
      <Text style={[styles.title, { color: text }]}>
        {t("academic.institutionalImportTitle")}
      </Text>
      <TouchableOpacity
        onPress={selectFile}
        style={[styles.button, { backgroundColor: theme.primary }]}
      >
        <Text style={styles.buttonText}>
          {t("academic.institutionalImportSelectFile")}
        </Text>
      </TouchableOpacity>
      {summary && (
        <View style={styles.summary}>
          <Text style={{ color: text }}>
            {t("academic.institutionalImportSummary")}
          </Text>
          <Text style={{ color: muted }}>
            {summary.validated} · {summary.inconsistency} · {summary.userNotFound} · {summary.fichaNotFound}
          </Text>
        </View>
      )}
      {inconsistencies.map(item => <View key={item.id} style={styles.inconsistency}><Text style={{ color: text }}>{item.learnerName}</Text><Text style={{ color: muted }}>{item.issue}</Text><TextInput value={reasons[item.id] ?? ""} onChangeText={value => setReasons(current => ({ ...current, [item.id]: value }))} placeholder={t("academic.correctionReason")} placeholderTextColor={muted} style={[styles.reason, { color: text }]} /><TouchableOpacity disabled={!reasons[item.id]?.trim()} onPress={() => correct(item)} style={[styles.button, { backgroundColor: reasons[item.id]?.trim() ? theme.primary : muted }]}><Text style={styles.buttonText}>{t("academic.correctInstitutionalData")}</Text></TouchableOpacity></View>)}
    </View>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, padding: 24 },
  title: {
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.black,
    marginBottom: 20,
  },
  button: { paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  buttonText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  },
  summary: {
    marginTop: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: 12,
    gap: 8,
  },
  inconsistency: { marginTop: 12, padding: 14, borderWidth: 1, borderColor: Colors.error, borderRadius: 12, gap: 8 },
  reason: { borderWidth: 1, borderColor: Colors.error, borderRadius: 8, padding: 10 },
});
