// ─────────────────────────────────────────────
//  app/admin/academic/csv-upload.tsx
//  RF-3.1 + RF-3.1.1 V4 — Carga académica por CSV
// ─────────────────────────────────────────────
import { downloadAcademicTemplate, uploadAcademicCsv } from '@/features/academic/academicApi';
import { parseAcademicCsvV4 } from '@/features/academic/csvImport';
import { CsvImportSummaryV4, CsvRowResult } from '@/features/academic/types';
import { refreshAcademicStoreFromBackend } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
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
import * as XLSX from 'xlsx';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function getColumnGuide(t: (k: string) => string) {
  return [
    { col: 'tipo', badge: t('academic.csvV4Columns.tipo.when'), what: t('academic.csvV4Columns.tipo.what'), required: true },
    { col: 'documento', badge: t('academic.csvV4Columns.documento.when'), what: t('academic.csvV4Columns.documento.what'), required: false },
    { col: 'nombre', badge: t('academic.csvV4Columns.nombre.when'), what: t('academic.csvV4Columns.nombre.what'), required: false },
    { col: 'apellido', badge: t('academic.csvV4Columns.apellido.when'), what: t('academic.csvV4Columns.apellido.what'), required: false },
    { col: 'correo', badge: t('academic.csvV4Columns.correo.when'), what: t('academic.csvV4Columns.correo.what'), required: false },
    { col: 'programa_codigo', badge: t('academic.csvV4Columns.programa_codigo.when'), what: t('academic.csvV4Columns.programa_codigo.what'), required: false },
    { col: 'ficha_codigo', badge: t('academic.csvV4Columns.ficha_codigo.when'), what: t('academic.csvV4Columns.ficha_codigo.what'), required: false },
    { col: 'instructor_tipo', badge: t('academic.csvV4Columns.instructor_tipo.when'), what: t('academic.csvV4Columns.instructor_tipo.what'), required: false },
  ];
}

function getTips(t: any) {
  const instructions = (t('academic.csvV4Instructions', { returnObjects: true }) as string[]) || [];
  const icons = ['ban-outline', 'remove-outline', 'document-outline', 'search-outline'];
  return instructions.map((text, i) => ({ icon: icons[i] || 'information-circle-outline', text }));
}

function catColor(cat: CsvRowResult['category']) {
  return { created: Colors.success, updated: Colors.info, blocked: Colors.warning, error: Colors.error }[cat];
}
function catIcon(cat: CsvRowResult['category']) {
  return { created: 'checkmark-circle', updated: 'refresh-circle', blocked: 'warning', error: 'close-circle' }[cat];
}
function catLabel(cat: CsvRowResult['category'], t: (k: string) => string) {
  return { created: t('academic.csvV4Created'), updated: t('academic.csvV4Updated'), blocked: t('academic.csvV4Blocked'), error: t('academic.csvV4Errors') }[cat];
}
function resultCategoryLabel(cat: CsvRowResult['category'], t: (k: string) => string) {
  return {
    created: t('academic.csvStatusCreated'),
    updated: t('academic.csvStatusUpdated'),
    blocked: t('academic.csvStatusBlocked'),
    error: t('academic.csvStatusError'),
  }[cat];
}

type PasswordRow = CsvImportSummaryV4['generatedPasswords'][number];

function firstValue(...values: unknown[]) {
  return values.find(value => typeof value === 'string' && value.trim()) as string | undefined;
}

function getPasswordRows(result: any, csvRows: ReturnType<typeof parseAcademicCsvV4>['rows'] = []): PasswordRow[] {
  return (result.contrasenasGeneradas ?? []).map((item: any) => {
    const document = String(firstValue(item.documento, item.document, item.numeroDocumento) ?? '');
    const csvRow = csvRows.find(row => row.documento === document);
    const name = firstValue(
      item.nombreCompleto,
      item.nombreCompletoUsuario,
      [item.nombre, item.apellido].filter(value => typeof value === 'string' && value.trim()).join(' '),
      csvRow && [csvRow.nombre, csvRow.apellido].filter(Boolean).join(' '),
    );
    return {
      document,
      password: String(firstValue(item.contrasenaTemporal, item.password, item.contrasena) ?? ''),
      name,
      role: firstValue(item.rol, item.role, item.tipo, csvRow?.tipo),
      ficha: firstValue(item.ficha, item.fichaCodigo, item.numeroFicha, csvRow?.fichaCodigo),
      program: firstValue(item.programa, item.programaCodigo, item.codigoPrograma, csvRow?.programaCodigo),
    };
  });
}

export default function CsvUploadScreen() {
  const { t, i18n }       = useTranslation();
  const { theme, isDark } = useTheme();

  const [loading, setLoading]     = useState(false);
  const [summary, setSummary]     = useState<CsvImportSummaryV4 | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName]   = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const text   = isDark ? Colors.dark.text       : Colors.light.text;
  const muted  = isDark ? Colors.dark.textMuted   : Colors.light.textMuted;
  const cardBg = theme.surface;
  const border = theme.border;
  const soft   = theme.primaryFaint;

  // ── Plantilla ─────────────────────────────
  const downloadTemplate = async () => {
    if (Platform.OS === 'web') {
      const blob = await downloadAcademicTemplate();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'plantilla_academica_facelit.csv'; a.click();
      URL.revokeObjectURL(url);
    }
    // eslint-disable-next-line no-console
    console.info('[Plantilla CSV] disponible en /api/academic/csv/template');
  };

  const ensureWebExport = () => {
    if (Platform.OS !== 'web') {
      setFileError(t('academic.csvUploadWebNotice'));
      return false;
    }
    return true;
  };

  const fitSheetColumns = (sheet: XLSX.WorkSheet, rows: unknown[][]) => {
    const widthCount = Math.max(...rows.map(row => row.length), 1);
    sheet['!cols'] = Array.from({ length: widthCount }, (_, columnIndex) => {
      const maxLength = rows.reduce((max, row) => Math.max(max, String(row[columnIndex] ?? '').length), 10);
      return { wch: Math.min(Math.max(maxLength + 2, 12), 55) };
    });
  };

  const setSheetFilter = (sheet: XLSX.WorkSheet, startRow = 0) => {
    if (!sheet['!ref']) return;
    const range = XLSX.utils.decode_range(sheet['!ref']);
    range.s.r = startRow;
    sheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
  };

  const downloadWorkbook = (workbook: XLSX.WorkBook, fileNameToDownload: string) => {
    const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([output], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileNameToDownload;
    link.click();
    URL.revokeObjectURL(url);
  };

  const buildRowsSheet = (rows: Record<string, unknown>[], emptyMessage: string, messageHeader: string) => {
    const safeRows = rows.length > 0 ? rows : [{ [messageHeader]: emptyMessage }];
    const matrix = [Object.keys(safeRows[0]), ...safeRows.map(row => Object.values(row))];
    const sheet = XLSX.utils.json_to_sheet(safeRows);
    fitSheetColumns(sheet, matrix);
    setSheetFilter(sheet);
    return sheet;
  };

  const downloadCredentials = () => {
    if (!summary || summary.generatedPasswords.length === 0 || !ensureWebExport()) return;

    const rows = summary.generatedPasswords.map(item => ({
      [t('academic.csvCredentials.document')]: item.document,
      [t('academic.csvCredentials.name')]: item.name ?? '',
      [t('academic.csvCredentials.role')]: item.role ?? '',
      [t('academic.csvCredentials.ficha')]: item.ficha ?? '',
      [t('academic.csvCredentials.program')]: item.program ?? '',
      [t('academic.csvCredentials.password')]: item.password,
    }));

    const workbook = XLSX.utils.book_new();
    const sheetRows = [
      [t('academic.csvCredentials.title')],
      [t('academic.csvReport.file'), fileName ?? 'carga-academica.csv'],
      [t('academic.csvReport.generatedAt'), new Date().toLocaleString(i18n.language)],
      [],
      Object.keys(rows[0]),
      ...rows.map(row => Object.values(row)),
    ];
    const sheet = XLSX.utils.aoa_to_sheet(sheetRows);
    fitSheetColumns(sheet, sheetRows);
    setSheetFilter(sheet, 4);
    XLSX.utils.book_append_sheet(workbook, sheet, t('academic.csvCredentials.sheet'));
    downloadWorkbook(workbook, 'credenciales-usuarios-facelit.xlsx');
  };

  const downloadResultReport = () => {
    if (!summary || !ensureWebExport()) return;

    const generatedAt = new Date();
    const headers = {
      row: t('academic.csvReport.row'),
      category: t('academic.csvReport.category'),
      type: t('academic.csvReport.type'),
      identifier: t('academic.csvReport.identifier'),
      message: t('academic.csvReport.message'),
      relatedRecord: t('academic.csvReport.relatedRecord'),
      relatedRecordType: t('academic.csvReport.relatedRecordType'),
    };
    const detailRows: Record<string, string | number>[] = summary.rows.map(row => ({
      [headers.row]: row.rowIndex,
      [headers.category]: resultCategoryLabel(row.category, t),
      [headers.type]: row.tipo,
      [headers.identifier]: row.identifier || '',
      [headers.message]: row.message,
      [headers.relatedRecord]: row.conflictRecordId || '',
      [headers.relatedRecordType]: row.conflictRecordType || '',
    }));

    const columns = Object.values(headers);
    const reportRows = [
      [t('academic.csvReport.title')],
      [t('academic.csvReport.file'), fileName ?? 'carga-academica.csv'],
      [t('academic.csvReport.generatedAt'), generatedAt.toLocaleString(i18n.language)],
      [t('academic.csvReport.created'), summary.created],
      [t('academic.csvReport.updated'), summary.updated],
      [t('academic.csvReport.blocked'), summary.blocked],
      [t('academic.csvReport.errors'), summary.errors],
      [t('academic.csvReport.totalRows'), summary.rows.length],
      [],
      [t('academic.csvReport.detailsByRow')],
      columns,
      ...detailRows.map(row => columns.map(header => row[header] ?? '')),
    ];

    const workbook = XLSX.utils.book_new();
    const reportSheet = XLSX.utils.aoa_to_sheet(reportRows);
    fitSheetColumns(reportSheet, reportRows);
    setSheetFilter(reportSheet, 10);
    XLSX.utils.book_append_sheet(workbook, reportSheet, t('academic.csvReport.fullSheet'));
    XLSX.utils.book_append_sheet(workbook, buildRowsSheet(detailRows.filter(row => row[headers.category] === t('academic.csvStatusCreated')), t('academic.csvReport.noCreations'), headers.message), t('academic.csvReport.creationsSheet'));
    XLSX.utils.book_append_sheet(workbook, buildRowsSheet(detailRows.filter(row => row[headers.category] === t('academic.csvStatusUpdated')), t('academic.csvReport.noUpdates'), headers.message), t('academic.csvReport.updatesSheet'));
    XLSX.utils.book_append_sheet(workbook, buildRowsSheet(detailRows.filter(row => row[headers.category] === t('academic.csvStatusBlocked')), t('academic.csvReport.noBlocked'), headers.message), t('academic.csvReport.inconsistenciesSheet'));
    XLSX.utils.book_append_sheet(workbook, buildRowsSheet(detailRows.filter(row => row[headers.category] === t('academic.csvStatusError')), t('academic.csvReport.noErrors'), headers.message), t('academic.csvReport.errorsSheet'));
    downloadWorkbook(workbook, `resultado-csv-facelit-${generatedAt.toISOString().slice(0, 10)}.xlsx`);
  };
  // ── Procesamiento ─────────────────────────
  const processFile = async (file: { uri: string; name: string } | Blob) => {
    const name = file instanceof Blob ? 'carga-academica.csv' : file.name;
    setFileName(name); setFileError(null); setSummary(null); setLoading(true);
    try {
      const backendResult = await uploadAcademicCsv(file);
      let csvRows: ReturnType<typeof parseAcademicCsvV4>['rows'] = [];
      if (file instanceof Blob) {
        csvRows = parseAcademicCsvV4(await file.text()).rows;
      }
      const rows: CsvRowResult[] = [
        ...backendResult.creados.map((r: any) => ({ rowIndex: r.fila, category: 'created' as const, tipo: r.tipo, identifier: '', message: r.detalle })),
        ...backendResult.actualizados.map((r: any) => ({ rowIndex: r.fila, category: 'updated' as const, tipo: r.tipo, identifier: '', message: r.detalle })),
        ...backendResult.inconsistenciasBloqueadas.map((r: any) => ({ rowIndex: r.fila, category: 'blocked' as const, tipo: r.tipo, identifier: r.valorArchivo ?? '', message: r.mensaje })),
        ...backendResult.erroresDeReferencia.map((r: any) => ({ rowIndex: r.fila, category: 'error' as const, tipo: r.tipo, identifier: '', message: r.mensaje })),
      ].sort((a, b) => a.rowIndex - b.rowIndex);
      setSummary({
        created: backendResult.creados.length,
        updated: backendResult.actualizados.length,
        blocked: backendResult.inconsistenciasBloqueadas.length,
        errors: backendResult.erroresDeReferencia.length,
        rows,
        generatedPasswords: getPasswordRows(backendResult, csvRows),
      });
      await refreshAcademicStoreFromBackend();
    } catch (error: any) {
      // Log completo para depuración — ver exactamente qué devuelve el backend
      console.error('[CSV Upload] Error al procesar el archivo:', {
        status:   error?.response?.status,
        data:     error?.response?.data,
        message:  error?.message,
        config:   { url: error?.config?.url, method: error?.config?.method },
      });

      const status   = error?.response?.status ?? 0;
      const rawData  = error?.response?.data;
      const textData = typeof rawData === 'string' ? rawData : rawData?.message ?? rawData?.error ?? '';
      const msg      = textData || error?.message || '';

      if (status === 500 || status === 0) {
        const serverMessage = String(msg).toLowerCase();
        const isHtml = serverMessage.includes('<html') || serverMessage.includes('internal server error');
        setFileError(
          isHtml
            ? t('academic.csvServerProcessError')
            : `${t('common.error')} (${status || 'offline'}): ${msg || t('academic.csvServerProcessError')}`,
        );
      } else if (status === 413) {
        setFileError(t('academic.csvFileTooLargeServer'));
      } else if (status === 415) {
        setFileError(t('academic.csvFormatNotSupportedServer'));
      } else if (status === 400) {
        setFileError(msg || t('academic.csvServerProcessError'));
      } else {
        setFileError(msg || t('academic.csvServerProcessError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const openWebPicker = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.csv,text/csv';
    input.onchange = () => {
      const file = input.files?.[0]; if (!file) return;
      if (!file.name.toLowerCase().endsWith('.csv')) { setFileError(t('academic.csvV4WrongExtension')); return; }
      if (file.size > MAX_FILE_BYTES) { setFileError(t('academic.csvV4FileTooLarge')); return; }
      void processFile(file);
    };
    input.click();
  };
  const openNativePicker = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'text/csv', copyToCacheDirectory: true });
    if (res.canceled) return;
    const asset = res.assets[0];
    if (!asset.name.toLowerCase().endsWith('.csv')) { setFileError(t('academic.csvV4WrongExtension')); return; }
    setLoading(true);
    try { await processFile({ uri: asset.uri, name: asset.name }); }
    finally { setLoading(false); }
  };
  const handlePickFile = Platform.OS === 'web' ? openWebPicker : openNativePicker;
  const reset = () => { setSummary(null); setFileError(null); setFileName(null); };
  const goBack = () => router.replace('/admin/academic' as any);

  // ── Render ────────────────────────────────
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Encabezado ── */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={goBack} style={s.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[s.pageTitle, { color: text }]}>{t('academic.csvV4Title')}</Text>
            <Text style={[s.pageSubtitle, { color: muted }]}>{t('academic.csvV4Subtitle')}</Text>
          </View>
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
                  <Text style={[s.dropMain, { color: muted }]}>{t('academic.csvProcessing')}</Text>
                </View>
              ) : (
                <View style={s.dropInner}>
                  <View style={[s.dropIconCircle, { backgroundColor: theme.primary + '1A', borderColor: theme.primary + '44' }]}>
                    <Ionicons name="cloud-upload-outline" size={34} color={theme.primary} />
                  </View>
                  <Text style={[s.dropMain, { color: text }]}>
                    {Platform.OS === 'web' ? t('academic.csvDropPromptWeb') : t('academic.csvDropPromptMobile')}
                  </Text>
                  <Text style={[s.dropSub, { color: muted }]}>{t('academic.csvDropLimit')}</Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* ── Guía de columnas (colapsable, debajo de la zona de carga) ── */}
        <View style={[s.guideCard, { backgroundColor: cardBg, borderColor: border }]}>
          <TouchableOpacity onPress={() => setGuideOpen(v => !v)} style={s.guideToggle} activeOpacity={0.7}>
            <Ionicons name="help-circle-outline" size={18} color={theme.primary} />
            <Text style={[s.guideToggleText, { color: theme.primary }]}>{t('academic.csvGuideToggle')}</Text>
            <Ionicons name={guideOpen ? 'chevron-up' : 'chevron-down'} size={16} color={muted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {guideOpen && (
            <View style={s.guideBody}>
              <View style={[s.fileSizeNotice, { backgroundColor: theme.primary + '12', borderColor: theme.primary + '44' }]}>
                <Ionicons name="information-circle-outline" size={16} color={theme.primary} />
                <Text style={[s.fileSizeNoticeText, { color: text }]}>{t('academic.csvFileSizeNotice')}</Text>
              </View>

              {/* Chips de columnas */}
              <Text style={[s.guideSection, { color: muted }]}>{t('academic.csvColumnsSection')}</Text>
              {getColumnGuide(t).map(row => (
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
              <Text style={[s.guideSection, { color: muted, marginTop: 14 }]}>{t('academic.csvTipsSection')}</Text>
              {getTips(t).map((tip, i) => (
                <View key={i} style={s.tipRow}>
                  <Ionicons name={tip.icon as any} size={14} color={theme.primary} style={{ marginTop: 1 }} />
                  <Text style={[s.tipText, { color: text }]}>{tip.text}</Text>
                </View>
              ))}

              <TouchableOpacity onPress={downloadTemplate} style={[s.templateButton, { borderColor: theme.primary, backgroundColor: theme.primary + '12' }]} activeOpacity={0.8}>
                <Ionicons name="download-outline" size={16} color={theme.primary} />
                <Text style={[s.templateButtonText, { color: theme.primary }]}>{t('academic.csvDownloadTemplateBtn')}</Text>
              </TouchableOpacity>
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
            <View style={s.resultToolbar}>
              {fileName ? <Text style={[s.fileChip, { color: muted }]}>{t('academic.csvFilePrefix')}: {fileName}</Text> : <View />}
              <TouchableOpacity onPress={downloadResultReport} style={[s.downloadBtn, { borderColor: theme.primary, backgroundColor: theme.primary + '12' }]} activeOpacity={0.8}>
                <Ionicons name="download-outline" size={16} color={theme.primary} />
                <Text style={[s.downloadBtnText, { color: theme.primary }]}>{t('academic.csvDownloadExcelReport')}</Text>
              </TouchableOpacity>
            </View>

            {summary.generatedPasswords.length > 0 && (
              <View style={[s.guideCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={s.credentialsHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.resultHeader, { color: text }]}>{t('academic.csvGeneratedCredentials')}</Text>
                    <Text style={[s.resultMsg, { color: muted }]}>{t('academic.csvCredentialsSubtitle')}</Text>
                  </View>
                  <TouchableOpacity onPress={downloadCredentials} style={[s.downloadBtn, { borderColor: theme.primary, backgroundColor: theme.primary + '12' }]} activeOpacity={0.8}>
                    <Ionicons name="download-outline" size={16} color={theme.primary} />
                    <Text style={[s.downloadBtnText, { color: theme.primary }]}>{t('academic.csvExcelFormat')}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[s.resultMsg, { color: muted }]}>{t('academic.csvCredentialsWarning')}</Text>
                {summary.generatedPasswords.map((item) => (
                  <View key={item.document} style={[s.passwordRow, { borderBottomColor: border }]}>
                    <View style={s.passwordIdentity}>
                      <Text style={[s.passwordDocument, { color: text }]}>{item.document}</Text>
                      <Text style={[s.passwordMeta, { color: muted }]}>{item.name || t('academic.csvNameNotReported')} · {item.role || t('academic.csvRoleNotReported')}</Text>
                      <Text style={[s.passwordMeta, { color: muted }]}>{t('academic.ficha')}: {item.ficha || t('academic.csvNotApplicable')} · {t('academic.program')}: {item.program || t('academic.csvNotReported')}</Text>
                    </View>
                    <Text selectable style={[s.passwordValue, { color: theme.primary }]}>{item.password}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Lista de filas */}
            <View style={[s.guideCard, { backgroundColor: cardBg, borderColor: border }]}>
              <Text style={[s.resultHeader, { color: text }]}>{t('academic.csvRowDetail')}</Text>
              {summary.rows.map(row => (
                <View key={row.rowIndex} style={[s.resultRow, { borderLeftColor: catColor(row.category), borderBottomColor: border }]}>
                  <Ionicons name={catIcon(row.category) as any} size={14} color={catColor(row.category)} style={{ marginTop: 2, flexShrink: 0 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.resultId, { color: text }]}>{t('academic.csvRowPrefix')} {row.rowIndex} · <Text style={{ color: theme.primary }}>{row.tipo}</Text> · {row.identifier}</Text>
                    <Text style={[s.resultMsg, { color: muted }]}>{row.message}</Text>
                  </View>
                  {row.category === 'blocked' && row.conflictRecordId && (
                    <TouchableOpacity
                      onPress={() => router.push(row.conflictRecordType === 'ficha' ? `/admin/academic/fichas/${row.conflictRecordId}` as any : '/admin/academic' as any)}
                      style={[s.fixBtn, { borderColor: Colors.warning }]}
                    >
                      <Text style={[s.fixBtnText, { color: Colors.warning }]}>{t('academic.csvFix')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Nuevo archivo */}
            <TouchableOpacity onPress={reset} style={[s.reloadBtn, { borderColor: theme.primary }]} activeOpacity={0.8}>
              <Ionicons name="reload-outline" size={16} color={theme.primary} />
              <Text style={[s.reloadText, { color: theme.primary }]}>{t('academic.csvUploadAnother')}</Text>
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
  fileSizeNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 16 },
  fileSizeNoticeText: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, lineHeight: 18 },
  guideSection:   { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  colRow:         { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, gap: 12 },
  colLeft:        { width: 130, gap: 4 },
  colName:        { fontSize: FontSize.sm, fontWeight: FontWeight.bold, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined },
  whenBadge:      { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start' },
  whenText:       { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  colWhat:        { flex: 1, fontSize: FontSize.sm, lineHeight: 18 },
  tipRow:         { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 6 },
  tipText:        { flex: 1, fontSize: FontSize.sm, lineHeight: 18 },
  templateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginTop: 12, alignSelf: 'flex-start' },
  templateButtonText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  // Stats
  statsRow:  { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard:  { flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 12, alignItems: 'center', gap: 4 },
  statNum:   { fontSize: FontSize['2xl'], fontWeight: FontWeight.black },
  statLbl:   { fontSize: FontSize.xs, textAlign: 'center', lineHeight: 15 },
  resultToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 10 },
  fileChip:  { fontSize: FontSize.xs, marginBottom: 10 },

  // Result rows
  resultHeader: { fontSize: FontSize.base, fontWeight: FontWeight.black, marginBottom: 10 },
  resultRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 10, borderBottomWidth: 1 },
  resultId:     { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  resultMsg:    { fontSize: FontSize.xs, lineHeight: 17, marginTop: 2 },
  credentialsHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  downloadBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  passwordRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  passwordIdentity: { flex: 1, minWidth: 0 },
  passwordDocument: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  passwordMeta: { fontSize: FontSize.xs, lineHeight: 16, marginTop: 2 },
  passwordValue: { fontSize: FontSize.sm, fontWeight: FontWeight.black },
  fixBtn:       { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, flexShrink: 0 },
  fixBtnText:   { fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  // Reload
  reloadBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, alignSelf: 'center', marginTop: 16 },
  reloadText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
