// ─────────────────────────────────────────────
//  app/admin/academic/csv-upload.tsx
//  RF-3.1 + RF-3.1.1 V4 — Carga académica por CSV
// ─────────────────────────────────────────────
import {
  addLearnerStore,
  getFichasSnapshot,
  getInstructorsSnapshot,
  getProgramsSnapshot,
  registerFicha,
  registerInstructorStore,
  registerProgram,
} from '@/features/academic/academicStore';
import {
  CSV_TEMPLATE,
  parseAcademicCsvV4,
  processAcademicCsvV4,
  type StoreSnapshots,
} from '@/features/academic/csvImport';
import { CsvImportSummaryV4, CsvRowResult } from '@/features/academic/types';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

// ── Guía de columnas ─────────────────────────
const COLUMN_GUIDE = [
  { col: 'tipo',            badge: 'Siempre',            what: 'programa · ficha · aprendiz · instructor',   required: true  },
  { col: 'documento',       badge: 'aprendiz/instructor', what: 'Número de documento (10 dígitos)',            required: false },
  { col: 'nombre',          badge: 'aprendiz/instructor', what: 'Nombre de la persona',                        required: false },
  { col: 'apellido',        badge: 'aprendiz/instructor', what: 'Apellido de la persona',                      required: false },
  { col: 'correo',          badge: 'aprendiz/instructor', what: 'Correo electrónico personal',                 required: false },
  { col: 'programa_codigo', badge: 'programa/ficha/inst.','what': 'Código del programa (ej. ADSO)',             required: false },
  { col: 'ficha_codigo',    badge: 'ficha/aprendiz',      what: 'Código de la ficha (7 dígitos)',               required: false },
  { col: 'instructor_tipo', badge: 'instructor',          what: 'especifico  ó  transversal',                  required: false },
] as const;

const TIPS = [
  { icon: 'ban-outline',         text: 'No elimines la primera fila (encabezados).' },
  { icon: 'remove-outline',      text: 'Columnas que no apliquen déjalas en blanco — no escribas N/A ni guiones.' },
  { icon: 'document-outline',    text: 'Puedes subir un archivo de una sola fila para actualizar un dato puntual.' },
  { icon: 'search-outline',      text: "Consulta los códigos ya existentes en 'Gestión académica' antes de armar el archivo." },
] as const;

function catColor(cat: CsvRowResult['category']) {
  return { created: Colors.success, updated: Colors.info, blocked: Colors.warning, error: Colors.error }[cat];
}
function catIcon(cat: CsvRowResult['category']) {
  return { created: 'checkmark-circle', updated: 'refresh-circle', blocked: 'warning', error: 'close-circle' }[cat];
}
function catLabel(cat: CsvRowResult['category'], t: (k: string) => string) {
  return { created: t('academic.csvV4Created'), updated: t('academic.csvV4Updated'), blocked: t('academic.csvV4Blocked'), error: t('academic.csvV4Errors') }[cat];
}

export default function CsvUploadScreen() {
  const { t }             = useTranslation();
  const { theme, isDark } = useTheme();

  const [loading, setLoading]     = useState(false);
  const [summary, setSummary]     = useState<CsvImportSummaryV4 | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName]   = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const text   = isDark ? Colors.dark.text       : Colors.light.text;
  const muted  = isDark ? Colors.dark.textMuted   : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14'               : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const soft   = isDark ? 'rgba(101,179,97,0.06)' : 'rgba(101,179,97,0.04)';

  // ── Plantilla ─────────────────────────────
  const downloadTemplate = () => {
    if (Platform.OS === 'web') {
      const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'plantilla_academica_facelit.csv'; a.click();
      URL.revokeObjectURL(url);
    }
    // eslint-disable-next-line no-console
    console.info('[Plantilla CSV]\n' + CSV_TEMPLATE);
  };

  // ── Procesamiento ─────────────────────────
  const processFile = (csvText: string, name: string) => {
    setFileName(name); setFileError(null); setSummary(null); setLoading(true);
    try {
      if (new Blob([csvText]).size > MAX_FILE_BYTES) { setFileError(t('academic.csvV4FileTooLarge')); return; }
      const parsed = parseAcademicCsvV4(csvText);
      if (parsed.fileError) { setFileError(t(parsed.fileError as any, { defaultValue: parsed.fileError })); return; }

      const snapFichas      = getFichasSnapshot();
      const snapInstructors = getInstructorsSnapshot();
      const snapLearners    = snapFichas.flatMap(f => f.learners.map(l => ({ id: l.id, document: l.document, email: l.email, fichaId: f.id, status: l.status })));
      const snapshots: StoreSnapshots = {
        programs:    getProgramsSnapshot().map(p => ({ id: p.id, name: p.name, code: p.name, status: p.status, fichas: p.fichas })),
        fichas:      snapFichas.map(f => ({ id: f.id, number: f.number, programId: f.programId, status: f.status, transferCode: f.transferCode, learners: f.learners.map(l => ({ id: l.id, document: l.document, status: l.status })) })),
        learners:    snapLearners,
        instructors: snapInstructors.map(i => ({ id: i.id, document: i.document, email: i.email, instructorType: i.instructorType, programId: i.programId, status: i.status })),
      };
      const result = processAcademicCsvV4(parsed.rows, snapshots);

      for (const row of parsed.rows) {
        if (row.errors.length > 0) continue;
        const rr = result.rows.find(r => r.rowIndex === row.rowIndex);
        if (!rr || rr.category === 'blocked' || rr.category === 'error') continue;
        if (row.tipo === 'programa' && row.programaCodigo) {
          if (!getProgramsSnapshot().find(p => p.name.toUpperCase() === row.programaCodigo!.toUpperCase())) registerProgram(row.nombre ?? row.programaCodigo);
        }
        if (row.tipo === 'ficha' && row.fichaCodigo && row.programaCodigo) {
          if (!getFichasSnapshot().find(f => f.number === row.fichaCodigo)) {
            const prog = getProgramsSnapshot().find(p => p.name.toUpperCase() === row.programaCodigo!.toUpperCase());
            if (prog) registerFicha(row.fichaCodigo, 'morning', prog.id);
          }
        }
        if (row.tipo === 'aprendiz' && row.documento && row.nombre && row.apellido && row.correo) {
          const tf = row.fichaCodigo ? getFichasSnapshot().find(f => f.number === row.fichaCodigo) : null;
          if (tf) addLearnerStore(tf.id, { id: `csv-${Date.now()}-${row.rowIndex}`, name: row.nombre, lastname: row.apellido, document: row.documento, email: row.correo, role: 'aprendiz', status: 'active', validationStatus: 'validated', initialPassword: null });
        }
        if (row.tipo === 'instructor' && row.documento && row.nombre && row.apellido && row.correo && row.instructorTipo) {
          const prog = row.programaCodigo ? getProgramsSnapshot().find(p => p.name.toUpperCase() === row.programaCodigo!.toUpperCase()) : undefined;
          registerInstructorStore({ name: row.nombre, lastname: row.apellido, document: row.documento, email: row.correo, instructorType: row.instructorTipo, programId: prog?.id });
        }
      }
      setSummary(result);
    } finally { setLoading(false); }
  };

  const openWebPicker = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.csv,text/csv';
    input.onchange = () => {
      const file = input.files?.[0]; if (!file) return;
      if (!file.name.toLowerCase().endsWith('.csv')) { setFileError(t('academic.csvV4WrongExtension')); return; }
      if (file.size > MAX_FILE_BYTES) { setFileError(t('academic.csvV4FileTooLarge')); return; }
      const r = new FileReader();
      r.onload = () => processFile(String(r.result ?? ''), file.name);
      r.readAsText(file, 'UTF-8');
    };
    input.click();
  };
  const openNativePicker = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'text/csv', copyToCacheDirectory: true });
    if (res.canceled) return;
    const asset = res.assets[0];
    if (!asset.name.toLowerCase().endsWith('.csv')) { setFileError(t('academic.csvV4WrongExtension')); return; }
    setLoading(true);
    try { const content = await FileSystem.readAsStringAsync(asset.uri); processFile(content, asset.name); }
    finally { setLoading(false); }
  };
  const handlePickFile = Platform.OS === 'web' ? openWebPicker : openNativePicker;
  const reset = () => { setSummary(null); setFileError(null); setFileName(null); };

  // ── Render ────────────────────────────────
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Encabezado ── */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[s.pageTitle, { color: text }]}>Cargar información (CSV)</Text>
            <Text style={[s.pageSubtitle, { color: muted }]}>Programas · Fichas · Aprendices · Instructores</Text>
          </View>
          <TouchableOpacity onPress={downloadTemplate} style={[s.templatePill, { borderColor: theme.primary, backgroundColor: theme.primary + '12' }]} activeOpacity={0.8}>
            <Ionicons name="download-outline" size={14} color={theme.primary} />
            <Text style={[s.templatePillText, { color: theme.primary }]}>Plantilla</Text>
          </TouchableOpacity>
        </View>

        {/* ── Zona de carga (arriba, protagonista) ── */}
        {!summary && (
          <>
            {fileError && (
              <View style={[s.alertBox, { backgroundColor: Colors.error + '12', borderColor: Colors.error + '44' }]}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                <Text style={[s.alertText, { color: Colors.error }]}>{fileError}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handlePickFile}
              disabled={loading}
              activeOpacity={0.85}
              style={[s.dropZone, { borderColor: theme.primary + '80', backgroundColor: soft }]}
            >
              {loading ? (
                <View style={s.dropInner}>
                  <ActivityIndicator color={theme.primary} size="large" />
                  <Text style={[s.dropMain, { color: muted }]}>Procesando…</Text>
                </View>
              ) : (
                <View style={s.dropInner}>
                  <View style={[s.dropIconCircle, { backgroundColor: theme.primary + '1A', borderColor: theme.primary + '44' }]}>
                    <Ionicons name="cloud-upload-outline" size={34} color={theme.primary} />
                  </View>
                  <Text style={[s.dropMain, { color: text }]}>
                    {Platform.OS === 'web' ? 'Arrastra el archivo aquí o haz clic para seleccionar' : 'Toca para seleccionar el archivo'}
                  </Text>
                  <Text style={[s.dropSub, { color: muted }]}>Solo archivos .csv · Máx. 5 MB · 5 000 filas</Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* ── Guía de columnas (colapsable, debajo de la zona de carga) ── */}
        <View style={[s.guideCard, { backgroundColor: cardBg, borderColor: border }]}>
          <TouchableOpacity onPress={() => setGuideOpen(v => !v)} style={s.guideToggle} activeOpacity={0.7}>
            <Ionicons name="help-circle-outline" size={18} color={theme.primary} />
            <Text style={[s.guideToggleText, { color: theme.primary }]}>¿Cómo debe estar el archivo?</Text>
            <Ionicons name={guideOpen ? 'chevron-up' : 'chevron-down'} size={16} color={muted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {guideOpen && (
            <View style={s.guideBody}>
              {/* Chips de columnas */}
              <Text style={[s.guideSection, { color: muted }]}>COLUMNAS</Text>
              {COLUMN_GUIDE.map(row => (
                <View key={row.col} style={[s.colRow, { borderBottomColor: border }]}>
                  <View style={s.colLeft}>
                    <Text style={[s.colName, { color: theme.primary }]}>{row.col}</Text>
                    <View style={[s.whenBadge, { backgroundColor: row.required ? theme.primary + '22' : border + '80' }]}>
                      <Text style={[s.whenText, { color: row.required ? theme.primary : muted }]}>{row.badge}</Text>
                    </View>
                  </View>
                  <Text style={[s.colWhat, { color: text }]}>{row.what}</Text>
                </View>
              ))}

              {/* Tips */}
              <Text style={[s.guideSection, { color: muted, marginTop: 14 }]}>CONSEJOS</Text>
              {TIPS.map((tip, i) => (
                <View key={i} style={s.tipRow}>
                  <Ionicons name={tip.icon as any} size={14} color={theme.primary} style={{ marginTop: 1 }} />
                  <Text style={[s.tipText, { color: text }]}>{tip.text}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Resumen de resultados ── */}
        {summary && (
          <>
            {/* Contadores */}
            <View style={s.statsRow}>
              {(['created', 'updated', 'blocked', 'errors'] as const).map(key => {
                const count = key === 'errors' ? summary.errors : summary[key as 'created'|'updated'|'blocked'];
                const cat   = key === 'errors' ? 'error' : key as CsvRowResult['category'];
                return (
                  <View key={key} style={[s.statCard, { backgroundColor: cardBg, borderColor: catColor(cat) + '55' }]}>
                    <Ionicons name={catIcon(cat) as any} size={20} color={catColor(cat)} />
                    <Text style={[s.statNum, { color: catColor(cat) }]}>{count}</Text>
                    <Text style={[s.statLbl, { color: muted }]}>{catLabel(cat, t)}</Text>
                  </View>
                );
              })}
            </View>

            {/* Nombre de archivo */}
            {fileName && <Text style={[s.fileChip, { color: muted }]}>📄 {fileName}</Text>}

            {/* Lista de filas */}
            <View style={[s.guideCard, { backgroundColor: cardBg, borderColor: border }]}>
              <Text style={[s.resultHeader, { color: text }]}>Detalle por fila</Text>
              {summary.rows.map(row => (
                <View key={row.rowIndex} style={[s.resultRow, { borderLeftColor: catColor(row.category), borderBottomColor: border }]}>
                  <Ionicons name={catIcon(row.category) as any} size={14} color={catColor(row.category)} style={{ marginTop: 2, flexShrink: 0 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.resultId, { color: text }]}>Fila {row.rowIndex} · <Text style={{ color: theme.primary }}>{row.tipo}</Text> · {row.identifier}</Text>
                    <Text style={[s.resultMsg, { color: muted }]}>{row.message}</Text>
                  </View>
                  {row.category === 'blocked' && row.conflictRecordId && (
                    <TouchableOpacity
                      onPress={() => router.push(row.conflictRecordType === 'ficha' ? `/admin/academic/fichas/${row.conflictRecordId}` as any : '/admin/academic' as any)}
                      style={[s.fixBtn, { borderColor: Colors.warning }]}
                    >
                      <Text style={[s.fixBtnText, { color: Colors.warning }]}>Corregir</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Nuevo archivo */}
            <TouchableOpacity onPress={reset} style={[s.reloadBtn, { borderColor: theme.primary }]} activeOpacity={0.8}>
              <Ionicons name="reload-outline" size={16} color={theme.primary} />
              <Text style={[s.reloadText, { color: theme.primary }]}>Cargar otro archivo</Text>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: 20, paddingBottom: 56 },

  // Header
  topBar:         { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn:        { padding: 4 },
  pageTitle:      { fontSize: FontSize.xl,  fontWeight: FontWeight.black },
  pageSubtitle:   { fontSize: FontSize.xs,  marginTop: 2 },
  templatePill:   { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  templatePillText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  // Error alert
  alertBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  alertText: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, lineHeight: 18 },

  // Drop zone
  dropZone: {
    borderRadius: 20, borderWidth: 2, borderStyle: 'dashed',
    marginBottom: 14, overflow: 'hidden',
  },
  dropInner:      { alignItems: 'center', justifyContent: 'center', paddingVertical: 44, paddingHorizontal: 24, gap: 10 },
  dropIconCircle: { width: 68, height: 68, borderRadius: 34, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  dropMain:       { fontSize: FontSize.base, fontWeight: FontWeight.bold, textAlign: 'center', lineHeight: 22 },
  dropSub:        { fontSize: FontSize.xs, textAlign: 'center' },

  // Guide
  guideCard:      { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14 },
  guideToggle:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  guideToggleText:{ fontSize: FontSize.base, fontWeight: FontWeight.bold, flex: 1 },
  guideBody:      { marginTop: 14 },
  guideSection:   { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  colRow:         { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, gap: 12 },
  colLeft:        { width: 130, gap: 4 },
  colName:        { fontSize: FontSize.sm, fontWeight: FontWeight.bold, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined },
  whenBadge:      { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start' },
  whenText:       { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  colWhat:        { flex: 1, fontSize: FontSize.sm, lineHeight: 18 },
  tipRow:         { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 6 },
  tipText:        { flex: 1, fontSize: FontSize.sm, lineHeight: 18 },

  // Stats
  statsRow:  { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard:  { flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 12, alignItems: 'center', gap: 4 },
  statNum:   { fontSize: FontSize['2xl'], fontWeight: FontWeight.black },
  statLbl:   { fontSize: FontSize.xs, textAlign: 'center', lineHeight: 15 },
  fileChip:  { fontSize: FontSize.xs, marginBottom: 10 },

  // Result rows
  resultHeader: { fontSize: FontSize.base, fontWeight: FontWeight.black, marginBottom: 10 },
  resultRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 10, borderBottomWidth: 1 },
  resultId:     { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  resultMsg:    { fontSize: FontSize.xs, lineHeight: 17, marginTop: 2 },
  fixBtn:       { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, flexShrink: 0 },
  fixBtnText:   { fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  // Reload
  reloadBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, alignSelf: 'center', marginTop: 16 },
  reloadText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
