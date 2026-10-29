import { getAttendanceUISnapshot, subscribeAttendanceUI } from '@/features/attendance/attendanceUIStore';
import { useAttendanceRF6, type DayCell } from '@/features/attendance/useAttendanceRF6';
import { Colors } from '@/shared/constants/colors';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { fetchAttendanceMatrix } from '@/shared/services/facialAttendanceService';
import { exportReport, type ExportData, type ExportOptions } from '@/shared/utils/export';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

export function useAttendanceByUserScreen({ allowedFichaIds }: { allowedFichaIds?: string[] } = {}) {
  const { isDark, theme } = useTheme();
  const { t, i18n }       = useTranslation();
  const { searchLearners } = useAttendanceRF6();

  // Estado persistido desde el store.
  const ui = useSyncExternalStore(subscribeAttendanceUI, getAttendanceUISnapshot);
  const { query, selectedLearner, dateFrom, dateTo } = ui.byUser;

  // Estado local (solo modal detalle celda).
  const [cellDetail, setCellDetail] = useState<DayCell | null>(null);
  const [exporting,  setExporting]  = useState(false);
  const [realCells, setRealCells] = useState<DayCell[]>([]);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [matrixError, setMatrixError] = useState<string | null>(null);

  const text    = isDark ? Colors.dark.text      : Colors.light.text;
  const muted   = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg  = theme.surface;
  const border  = theme.border;
  const bg      = isDark ? Colors.dark.background  : Colors.light.background;
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : Colors.light.inputBg;
  const allowedFichaSet = useMemo(
    () => allowedFichaIds ? new Set(allowedFichaIds) : null,
    [allowedFichaIds],
  );

  // Derivados.
  const searchResults = useMemo(
    () => query.trim().length >= 2
      ? searchLearners(query).filter(result => !allowedFichaSet || allowedFichaSet.has(result.fichaId))
      : [],
    [query, searchLearners, allowedFichaSet],
  );

  const selectedLearnerFichaId = useMemo(() => {
    if (!selectedLearner) return '';
    if ('fichaId' in selectedLearner && selectedLearner.fichaId) return selectedLearner.fichaId;
    return searchLearners(selectedLearner.document)
      .find(result => result.learnerId === selectedLearner.learnerId)?.fichaId ?? '';
  }, [selectedLearner, searchLearners]);

  useEffect(() => {
    let cancelled = false;

    async function loadLearnerMatrix() {
      if (!selectedLearner || !selectedLearnerFichaId || !dateFrom || !dateTo || dateFrom > dateTo) {
        setRealCells([]);
        setMatrixError(null);
        return;
      }

      setLoadingMatrix(true);
      setMatrixError(null);
      try {
        const matrix = await fetchAttendanceMatrix({
          idChip: selectedLearnerFichaId,
          dateFrom,
          dateTo,
        });
        if (cancelled) return;

        const learner = matrix.learners.find(item => item.learnerId === selectedLearner.learnerId);
        setRealCells((learner?.days ?? []).map(day => ({
          idFacialEvent: day.idFacialEvent ?? null,
          idRecordEnvironment: day.idRecordEnvironment,
          apprenticeId: learner?.apprenticeId,
          date: day.date,
          status: day.status,
          entryTime: day.entryTime,
          delayMinutes: day.delayMinutes,
          environmentName: day.environmentName,
          instructorName: day.instructorName,
          fichaNumber: day.fichaNumber,
          programName: day.programName,
          exitRegistered: day.exitRegistered,
          excuse: day.excuse ?? null,
        })));
      } catch (error: any) {
        if (cancelled) return;
        setRealCells([]);
        setMatrixError(error?.response?.data?.message ?? 'No fue posible cargar la asistencia registrada.');
      } finally {
        if (!cancelled) setLoadingMatrix(false);
      }
    }

    loadLearnerMatrix();
    return () => {
      cancelled = true;
    };
  }, [selectedLearner, selectedLearnerFichaId, dateFrom, dateTo]);

  const cells: DayCell[] = realCells;

  // Formato.
  const fmtDate = (d: string) =>
    new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric' }).format(new Date(`${d}T12:00:00Z`));
  const fmtDateLong = (d: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long' }).format(new Date(`${d}T12:00:00Z`));
  const fmtTime = (v: string) =>
    v ? new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: '2-digit', hour12: true })
          .format(new Date(`1970-01-01T${v}:00`)) : '-';

  const getStatusLabel = (cell: DayCell) => {
    if (cell.status === 'punctual') return t('attendance.statuses.punctual');
    if (cell.status === 'late') return t('attendance.statuses.late');
    if (cell.status === 'absent') {
      return cell.excuse === true ? `${t('attendance.statuses.absent')} (E)` : t('attendance.statuses.absent');
    }
    return '-';
  };

  const getStatusColor = (cell: DayCell) => {
    if (cell.status === 'punctual') return Colors.success;
    if (cell.status === 'late') return Colors.warning;
    if (cell.status === 'absent') return Colors.error;
    return muted;
  };

  // Exportacion.
  const handleExport = async (format: 'excel' | 'csv') => {
    if (!cells.length || !selectedLearner) return;
    setExporting(true);
    try {
      const headers = [t('attendance.fields.date'), t('attendance.fields.status'), 'Salida'];
      const rows = cells.map(cell => [
        fmtDate(cell.date),
        getStatusLabel(cell),
        cell.exitRegistered ? 'x' : '-',
      ]);
      const data: ExportData = {
        title: t('attendance.rf6.exportTitleUser'),
        subtitle: `${t('attendance.rf6.learner')}: ${selectedLearner.name} | ${t('attendance.rf6.document')}: ${selectedLearner.document}`,
        headers, rows,
        filters: [
          { label: t('attendance.rf6.learner'),   value: selectedLearner.name },
          { label: t('attendance.rf6.document'),  value: selectedLearner.document },
          { label: t('attendance.rf6.ficha'),     value: selectedLearner.fichaNumber },
          { label: t('reports.filters.dateFrom'), value: dateFrom },
          { label: t('reports.filters.dateTo'),   value: dateTo },
        ],
        generatedAt: new Date().toLocaleString(),
      };
      await exportReport(data, {
        filename: `asistencia-aprendiz-${selectedLearner.document}-${dateFrom}_${dateTo}`,
        format,
      } as ExportOptions);
    } finally {
      setExporting(false);
    }
  };

  // ------------------------------------------------------------
  //  RENDER
  // ------------------------------------------------------------
    return {
    isDark,
    theme,
    t,
    query,
    selectedLearner,
    dateFrom,
    dateTo,
    cellDetail,
    setCellDetail,
    exporting,
    loadingMatrix,
    matrixError,
    text,
    muted,
    cardBg,
    border,
    bg,
    inputBg,
    searchResults,
    cells,
    fmtDateLong,
    fmtTime,
    getStatusColor,
    handleExport,
  };
}
