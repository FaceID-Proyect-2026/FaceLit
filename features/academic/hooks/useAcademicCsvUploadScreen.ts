import * as XLSX from 'xlsx';
import * as DocumentPicker from 'expo-document-picker';
import { downloadAcademicTemplate, uploadAcademicCsv } from '@/features/academic/academicApi';
import { loadNotifications } from '@/features/notifications/notificationsStore';
import { CsvImportSummaryV4, CsvRowResult } from '@/features/academic/types';
import { refreshAcademicStoreFromBackend } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import {
  MAX_FILE_BYTES,
  translateCsvType,
  resultCategoryLabel,
} from '@/features/academic/components/AcademicCsvUploadSupport';

export function useAcademicCsvUploadScreen() {
  const { t }             = useTranslation();
  const { theme, isDark } = useTheme();
  const columnGuide = [
    { col: 'tipo', badge: t('academic.csvV4Columns.tipo.badge'), what: t('academic.csvV4Columns.tipo.what'), required: true },
    { col: 'documento', badge: t('academic.csvV4Columns.documento.badge'), what: t('academic.csvV4Columns.documento.what'), required: false },
    { col: 'nombre', badge: t('academic.csvV4Columns.nombre.badge'), what: t('academic.csvV4Columns.nombre.what'), required: false },
    { col: 'apellido', badge: t('academic.csvV4Columns.apellido.badge'), what: t('academic.csvV4Columns.apellido.what'), required: false },
    { col: 'correo', badge: t('academic.csvV4Columns.correo.badge'), what: t('academic.csvV4Columns.correo.what'), required: false },
    { col: 'programa_codigo', badge: t('academic.csvV4Columns.programa_codigo.badge'), what: t('academic.csvV4Columns.programa_codigo.what'), required: false },
    { col: 'ficha_codigo', badge: t('academic.csvV4Columns.ficha_codigo.badge'), what: t('academic.csvV4Columns.ficha_codigo.what'), required: false },
    { col: 'instructor_tipo', badge: t('academic.csvV4Columns.instructor_tipo.badge'), what: t('academic.csvV4Columns.instructor_tipo.what'), required: false },
  ] as const;
  const tips = [
    { icon: 'ban-outline', text: t('academic.csvV4TipKeepHeader') },
    { icon: 'remove-outline', text: t('academic.csvV4TipLeaveBlank') },
    { icon: 'document-outline', text: t('academic.csvV4TipSingleRow') },
    { icon: 'search-outline', text: t('academic.csvV4TipCheckCodes') },
  ] as const;

  const [loading, setLoading]     = useState(false);
  const [summary, setSummary]     = useState<CsvImportSummaryV4 | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [postUploadWarning, setPostUploadWarning] = useState<string | null>(null);
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
      a.href = url; a.download = t('academic.csvV4TemplateFileName'); a.click();
      URL.revokeObjectURL(url);
    }
    console.info('[Plantilla CSV] disponible en /api/academic/csv/template');
  };

  const ensureWebExport = () => {
    if (Platform.OS !== 'web') {
      setFileError(t('academic.csvV4WebExportOnly'));
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

  const buildRowsSheet = (rows: Record<string, unknown>[], emptyMessage: string) => {
    const safeRows = rows.length > 0 ? rows : [{ Mensaje: emptyMessage }];
    const matrix = [Object.keys(safeRows[0]), ...safeRows.map(row => Object.values(row))];
    const sheet = XLSX.utils.json_to_sheet(safeRows);
    fitSheetColumns(sheet, matrix);
    setSheetFilter(sheet);
    return sheet;
  };

  const downloadCredentials = () => {
    if (!summary || summary.generatedPasswords.length === 0 || !ensureWebExport()) return;

    const rows = summary.generatedPasswords.map(item => ({
      [t('academic.csvV4Export.document')]: item.document,
      [t('academic.csvV4Export.name')]: item.name ?? '',
      [t('academic.csvV4Export.role')]: item.role ?? '',
      [t('academic.csvV4Export.ficha')]: item.ficha ?? '',
      [t('academic.csvV4Export.program')]: item.program ?? '',
      [t('academic.csvV4Export.password')]: item.password,
    }));

    const workbook = XLSX.utils.book_new();
    const sheetRows = [
      [t('academic.csvV4CredentialsTitle')],
      [t('academic.csvV4Export.file'), fileName ?? t('academic.csvV4DefaultFileName')],
      [t('academic.csvV4Export.generatedAt'), new Date().toLocaleString()],
      [],
      Object.keys(rows[0]),
      ...rows.map(row => Object.values(row)),
    ];
    const sheet = XLSX.utils.aoa_to_sheet(sheetRows);
    fitSheetColumns(sheet, sheetRows);
    setSheetFilter(sheet, 4);
    XLSX.utils.book_append_sheet(workbook, sheet, t('academic.csvV4Export.credentialsSheet'));
    downloadWorkbook(workbook, `facelit-${t('academic.csvV4Export.credentialsFile')}.xlsx`);
  };

  const downloadResultReport = () => {
    if (!summary || !ensureWebExport()) return;

    const generatedAt = new Date();
    const detailRows: Record<string, string | number>[] = summary.rows.map(row => ({
      [t('academic.csvV4Export.row')]: row.rowIndex,
      [t('academic.csvV4Export.category')]: resultCategoryLabel(row.category, t),
      [t('academic.csvV4Export.type')]: translateCsvType(row.tipo, t),
      [t('academic.csvV4Export.identifier')]: row.identifier || '',
      [t('academic.csvV4Export.message')]: row.message,
      [t('academic.csvV4Export.relatedRecord')]: row.conflictRecordId || '',
      [t('academic.csvV4Export.relatedRecordType')]: row.conflictRecordType || '',
    }));

    const headers = [
      t('academic.csvV4Export.row'),
      t('academic.csvV4Export.category'),
      t('academic.csvV4Export.type'),
      t('academic.csvV4Export.identifier'),
      t('academic.csvV4Export.message'),
      t('academic.csvV4Export.relatedRecord'),
      t('academic.csvV4Export.relatedRecordType'),
    ];
    const reportRows = [
      [t('academic.csvV4Export.reportTitle')],
      [t('academic.csvV4Export.file'), fileName ?? t('academic.csvV4DefaultFileName')],
      [t('academic.csvV4Export.generatedAt'), generatedAt.toLocaleString()],
      [t('academic.csvV4Created'), summary.created],
      [t('academic.csvV4Updated'), summary.updated],
      [t('academic.csvV4Blocked'), summary.blocked],
      [t('academic.csvV4Errors'), summary.errors],
      [t('academic.csvV4Export.totalRows'), summary.rows.length],
      [],
      [t('academic.csvV4RowDetails')],
      headers,
      ...detailRows.map(row => headers.map(header => row[header] ?? '')),
    ];

    const workbook = XLSX.utils.book_new();
    const reportSheet = XLSX.utils.aoa_to_sheet(reportRows);
    fitSheetColumns(reportSheet, reportRows);
    setSheetFilter(reportSheet, 10);
    const categoryHeader = t('academic.csvV4Export.category');
    XLSX.utils.book_append_sheet(workbook, reportSheet, t('academic.csvV4Export.fullReportSheet'));
    XLSX.utils.book_append_sheet(workbook, buildRowsSheet(detailRows.filter(row => row[categoryHeader] === t('academic.csvV4Created')), t('academic.csvV4Export.noCreated')), t('academic.csvV4Created'));
    XLSX.utils.book_append_sheet(workbook, buildRowsSheet(detailRows.filter(row => row[categoryHeader] === t('academic.csvV4Updated')), t('academic.csvV4Export.noUpdated')), t('academic.csvV4Updated'));
    XLSX.utils.book_append_sheet(workbook, buildRowsSheet(detailRows.filter(row => row[categoryHeader] === t('academic.csvV4Blocked')), t('academic.csvV4Export.noBlocked')), t('academic.csvV4Blocked'));
    XLSX.utils.book_append_sheet(workbook, buildRowsSheet(detailRows.filter(row => row[categoryHeader] === t('academic.csvV4Errors')), t('academic.csvV4Export.noErrors')), t('academic.csvV4Errors'));
    downloadWorkbook(workbook, `resultado-csv-facelit-${generatedAt.toISOString().slice(0, 10)}.xlsx`);
  };
  // ── Procesamiento ─────────────────────────
  const processFile = async (file: { uri: string; name: string } | Blob) => {
    const name = file instanceof Blob ? t('academic.csvV4DefaultFileName') : file.name;
    setFileName(name); setFileError(null); setPostUploadWarning(null); setSummary(null); setLoading(true);
    try {
      const backendResult = await uploadAcademicCsv(file);
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
        generatedPasswords: [],
      });
      try {
        await refreshAcademicStoreFromBackend();
      } catch (refreshError) {
        console.warn('[CSV Upload] Los datos se guardaron, pero no se pudo actualizar la vista académica:', refreshError);
        setPostUploadWarning(t('academic.csvV4SavedButRefreshFailed'));
      }
      try {
        await loadNotifications();
      } catch (notificationError) {
        console.warn('[CSV Upload] Los datos se guardaron, pero no se pudieron actualizar las notificaciones:', notificationError);
      }
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

      if (error?.code === 'ECONNABORTED' || String(msg).toLowerCase().includes('timeout')) {
        setFileError(t('academic.csvV4Timeout'));
      } else if (status === 500 || status === 0) {
        const serverMessage = String(msg).toLowerCase();
        const isHtml = serverMessage.includes('<html') || serverMessage.includes('internal server error');
        setFileError(
          isHtml
            ? t('academic.csvV4ServerFailed')
            : t('academic.csvV4ServerError', { status: status || t('academic.csvV4NoConnection'), message: msg || t('academic.csvV4ServerFailed') }),
        );
      } else if (status === 413) {
        setFileError(t('academic.csvV4ServerFileTooLarge'));
      } else if (status === 415) {
        setFileError(t('academic.csvV4UnsupportedFormat'));
      } else if (status === 400) {
        setFileError(msg || t('academic.csvV4InvalidFile'));
      } else {
        setFileError(msg || t('academic.csvV4UploadFailed'));
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
  const reset = () => { setSummary(null);   setFileError(null); setFileName(null); setPostUploadWarning(null); };
  const goBack = () => router.replace('/admin/academic' as any);

  // ── Render ────────────────────────────────
    return {
    t,
    theme,
    isDark,
    columnGuide,
    tips,
    loading,
    summary,
    fileError,
    postUploadWarning,
    fileName,
    guideOpen,
    setGuideOpen,
    text,
    muted,
    cardBg,
    border,
    soft,
    downloadTemplate,
    downloadCredentials,
    downloadResultReport,
    handlePickFile,
    reset,
    goBack,
  };
}
