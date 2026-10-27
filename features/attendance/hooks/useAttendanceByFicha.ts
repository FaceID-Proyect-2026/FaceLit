import {
  clearByFichaFicha,
  setByFichaDateFrom,
  setByFichaDateTo,
  setByFichaDirectFicha,
  setByFichaFicha,
  setByFichaProgram,
 getAttendanceUISnapshot, subscribeAttendanceUI } from '@/features/attendance/attendanceUIStore';
import { getProgramDisplayName } from "@/features/academic/types";
import { todayBogota } from "@/features/attendance/utils/attendanceDates";
import { useAcademic } from "@/features/academic/useAcademic";

import { type DayCell, type FichaDaySummary, type FichaTableRow } from "@/features/attendance/useAttendanceRF6";
import { Colors } from "@/shared/constants/colors";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { fetchAttendanceMatrix, updateFacialEventExcuse } from "@/shared/services/facialAttendanceService";
import { exportReport, type ExportData, type ExportOptions } from "@/shared/utils/export";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { Platform, ScrollView } from "react-native";

export interface AttendanceByFichaOptions {
  directFichaOnly?: boolean;
  allowedFichaIds?: string[];
}

export function useAttendanceByFicha({ directFichaOnly = false, allowedFichaIds }: AttendanceByFichaOptions) {
  const { isDark, theme } = useTheme();
  const { role } = useAuth();
  const { t, i18n } = useTranslation();
  const { programs, allFichas, allInstructors } = useAcademic();

  // ── Estado persistido desde el store ─────────
  const ui = useSyncExternalStore(
    subscribeAttendanceUI,
    getAttendanceUISnapshot,
  );
  const { selectedProgramId, selectedFichaId, dateFrom, dateTo } = ui.byFicha;

  // ── Estado local (solo para el modal de detalle de celda) ──
  const [cellDetail, setCellDetail] = useState<{
    cell: DayCell;
    learnerName: string;
  } | null>(null);
  const [realTableRows, setRealTableRows] = useState<FichaTableRow[]>([]);
  const [realDates, setRealDates] = useState<string[]>([]);
  const [realFichaCards, setRealFichaCards] = useState<FichaDaySummary[]>([]);
  const [loadingFichaCards, setLoadingFichaCards] = useState(false);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [matrixError, setMatrixError] = useState<string | null>(null);
  const [excuseError, setExcuseError] = useState<string | null>(null);
  const [savingExcuse, setSavingExcuse] = useState(false);
  const [exporting, setExporting] = useState(false);
  const learnerHeaderRef = useRef<ScrollView>(null);
  const learnerGridRef = useRef<ScrollView>(null);
  const learnerGridX = useRef(0);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = theme.surface;
  const border = theme.border;
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const allowedFichaSet = useMemo(
    () => allowedFichaIds ? new Set(allowedFichaIds) : null,
    [allowedFichaIds],
  );
  const visibleFichas = useMemo(
    () => allowedFichaSet ? allFichas.filter(ficha => allowedFichaSet.has(ficha.id)) : allFichas,
    [allFichas, allowedFichaSet],
  );
  const visibleProgramIds = useMemo(
    () => new Set(visibleFichas.map(ficha => ficha.programId)),
    [visibleFichas],
  );

  // ── Derivados ─────────────────────────────────
  const programOptions = useMemo(
    () =>
      programs.filter(p => visibleProgramIds.has(p.id)).map((p) => ({
        value: p.id,
        label: getProgramDisplayName(p, t),
      })),
    [programs, t, visibleProgramIds],
  );
  const fichaOptions = useMemo(
    () =>
      visibleFichas.map((ficha) => ({
        value: ficha.id,
        label: `Ficha ${ficha.number}`,
        sublabel: ficha.code,
      })),
    [visibleFichas],
  );

  const selectedProgramFichas = useMemo(
    () => visibleFichas.filter((ficha) => ficha.programId === selectedProgramId),
    [selectedProgramId, visibleFichas],
  );
  const fichaCards: FichaDaySummary[] = realFichaCards;

  const selectedFicha = useMemo(
    () => visibleFichas.find((f) => f.id === selectedFichaId),
    [visibleFichas, selectedFichaId],
  );
  const responsibleInstructors = useMemo(
    () => allInstructors.filter(instructor =>
      instructor.status === "active" && instructor.fichaIds.includes(selectedFichaId ?? ""),
    ),
    [allInstructors, selectedFichaId],
  );
  const selectedProgram = useMemo(
    () => programs.find((p) => p.id === selectedProgramId),
    [programs, selectedProgramId],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadFichaCards() {
      if (!selectedProgramId || selectedProgramFichas.length === 0) {
        setRealFichaCards([]);
        return;
      }

      const today = todayBogota();
      setLoadingFichaCards(true);
      try {
        const cards = await Promise.all(
          selectedProgramFichas.map(async (ficha) => {
            try {
              const matrix = await fetchAttendanceMatrix({
                idChip: ficha.id,
                dateFrom: today,
                dateTo: today,
              });

              const dayCells = matrix.learners.flatMap((learner) => learner.days);
              const totalLearners = matrix.learners.length || ficha.learners.filter((learner) => learner.status === "active").length;
              const absentToday = dayCells.filter((day) => day.status === "absent").length;
              const lateToday = dayCells.filter((day) => day.status === "late").length;

              return {
                fichaId: ficha.id,
                fichaNumber: matrix.chipCode ?? ficha.number,
                programId: selectedProgramId,
                programName: matrix.programName ?? selectedProgram?.name ?? "",
                totalLearners,
                absentToday,
                lateToday,
                absentPct: totalLearners > 0 ? Math.round((absentToday / totalLearners) * 100) : 0,
                latePct: totalLearners > 0 ? Math.round((lateToday / totalLearners) * 100) : 0,
              } satisfies FichaDaySummary;
            } catch {
              const totalLearners = ficha.learners.filter((learner) => learner.status === "active").length;

              return {
                fichaId: ficha.id,
                fichaNumber: ficha.number,
                programId: selectedProgramId,
                programName: selectedProgram?.name ?? "",
                totalLearners,
                absentToday: 0,
                lateToday: 0,
                absentPct: 0,
                latePct: 0,
              } satisfies FichaDaySummary;
            }
          }),
        );

        if (!cancelled) setRealFichaCards(cards);
      } catch {
        if (!cancelled) setRealFichaCards([]);
      } finally {
        if (!cancelled) setLoadingFichaCards(false);
      }
    }

    loadFichaCards();
    return () => {
      cancelled = true;
    };
  }, [selectedProgramFichas, selectedProgramId, selectedProgram]);

  useEffect(() => {
    let cancelled = false;

    async function loadMatrix() {
      if (!selectedFichaId || !dateFrom || !dateTo || dateFrom > dateTo) {
        setRealTableRows([]);
        setRealDates([]);
        setMatrixError(null);
        return;
      }

      setLoadingMatrix(true);
      setMatrixError(null);
      try {
        const matrix = await fetchAttendanceMatrix({
          idChip: selectedFichaId,
          dateFrom,
          dateTo,
        });
        if (cancelled) return;

        setRealDates(matrix.sessions.map((session) => session.date));
        setRealTableRows(matrix.learners.map((learner) => ({
          learnerId: learner.learnerId,
          learnerName: learner.learnerName,
          learnerDocument: learner.learnerDocument,
          days: learner.days.map((day) => ({
            idFacialEvent: day.idFacialEvent ?? null,
            idRecordEnvironment: day.idRecordEnvironment,
            apprenticeId: learner.apprenticeId,
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
          })),
        })));
      } catch (error: any) {
        if (cancelled) return;
        setRealTableRows([]);
        setRealDates([]);
        setMatrixError(error?.response?.data?.message ?? "No fue posible cargar la asistencia registrada.");
      } finally {
        if (!cancelled) setLoadingMatrix(false);
      }
    }

    loadMatrix();
    return () => {
      cancelled = true;
    };
  }, [selectedFichaId, dateFrom, dateTo]);

  const tableRows: FichaTableRow[] = realTableRows;
  const dates: string[] = realDates;

  // ── Formato ───────────────────────────────────
  const fmtDate = (d: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      month: "short",
      day: "numeric",
    }).format(new Date(`${d}T12:00:00Z`));
  const fmtDateLong = (d: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: "long" }).format(
      new Date(`${d}T12:00:00Z`),
    );
  const fmtTime = (v: string) =>
    v
      ? new Intl.DateTimeFormat(i18n.language, {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(new Date(`1970-01-01T${v}:00`))
      : "—";

  const canEditExcuse = role === "INSTRUCTOR";

  const handleUpdateExcuse = async (excuse: boolean) => {
    if (!cellDetail?.cell.idRecordEnvironment || !cellDetail.cell.apprenticeId) return;

    setSavingExcuse(true);
    setExcuseError(null);
    try {
      const event = await updateFacialEventExcuse({
        idRecordEnvironment: cellDetail.cell.idRecordEnvironment,
        idApprentice: cellDetail.cell.apprenticeId,
        excuse,
      });

      setRealTableRows((rows) =>
        rows.map((row) => ({
          ...row,
          days: row.days.map((day) =>
            day.idRecordEnvironment === cellDetail.cell.idRecordEnvironment &&
            day.apprenticeId === cellDetail.cell.apprenticeId
              ? {
                  ...day,
                  idFacialEvent: event.idFacialEvent,
                  excuse: event.excuse ?? excuse,
                  status: "absent",
                }
              : day,
          ),
        })),
      );
      setCellDetail((current) =>
        current
          ? {
              ...current,
              cell: {
                ...current.cell,
                idFacialEvent: event.idFacialEvent,
                excuse: event.excuse ?? excuse,
                status: "absent",
              },
            }
          : current,
      );
    } catch (error: any) {
      setExcuseError(error?.response?.data?.message ?? "No fue posible guardar la excusa.");
    } finally {
      setSavingExcuse(false);
    }
  };

  // ── Exportación ───────────────────────────────
  const handleLearnerGridScroll = (event: any) => {
    learnerGridX.current = event.nativeEvent.contentOffset.x;
    learnerHeaderRef.current?.scrollTo({ x: learnerGridX.current, animated: false });
  };
  const handleLearnerGridWheel = (event: any) => {
    if (Platform.OS !== "web") return;
    const nativeEvent = event?.nativeEvent ?? event;
    const delta = Math.abs(nativeEvent.deltaX) > Math.abs(nativeEvent.deltaY)
      ? nativeEvent.deltaX
      : nativeEvent.deltaY;
    if (!delta) return;
    nativeEvent.preventDefault?.();
    const nextX = Math.max(0, learnerGridX.current + delta);
    learnerGridX.current = nextX;
    learnerGridRef.current?.scrollTo({ x: nextX, animated: false });
  };
  const learnerGridWheelProps = Platform.OS === "web" ? ({ onWheel: handleLearnerGridWheel } as any) : {};

  const handleExport = async (format: "excel" | "csv") => {
    if (!tableRows.length || !selectedFicha || !selectedProgram) return;
    setExporting(true);
    try {
      const programLabel = getProgramDisplayName(selectedProgram, t);
      const headers = [
        t("attendance.rf6.learner"),
        t("attendance.rf6.document"),
        ...dates.map(fmtDate),
      ];
      const rows = tableRows.map((row) => [
        row.learnerName,
        row.learnerDocument,
        ...row.days.map((cell) => {
          if (!cell.status) return "—";
          if (cell.status === "absent") return t("attendance.statuses.absent");
          if (cell.status === "late")
            return `${t("attendance.statuses.late")} (${cell.delayMinutes} min)`;
          return t("attendance.statuses.punctual");
        }),
      ]);
      const data: ExportData = {
        title: t("attendance.rf6.exportTitle"),
        subtitle: `${t("attendance.rf6.program")}: ${programLabel} | ${t("attendance.rf6.ficha")}: ${selectedFicha.number}`,
        headers,
        rows,
        filters: [
          { label: t("attendance.rf6.program"), value: programLabel },
          { label: t("attendance.rf6.ficha"), value: selectedFicha.number },
          { label: t("reports.filters.dateFrom"), value: dateFrom },
          { label: t("reports.filters.dateTo"), value: dateTo },
        ],
        generatedAt: new Date().toLocaleString(),
      };
      await exportReport(data, {
        filename: `asistencia-ficha-${selectedFicha.number}-${dateFrom}_${dateTo}`,
        format,
      } as ExportOptions);
    } finally {
      setExporting(false);
    }
  };

  // ─────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────
    return {
    theme,
    t,
    selectedProgramId,
    selectedFichaId,
    dateFrom,
    dateTo,
    cellDetail,
    setCellDetail,
    loadingFichaCards,
    loadingMatrix,
    matrixError,
    excuseError,
    setExcuseError,
    savingExcuse,
    exporting,
    learnerHeaderRef,
    learnerGridRef,
    text,
    muted,
    cardBg,
    border,
    bg,
    visibleFichas,
    programOptions,
    fichaOptions,
    fichaCards,
    selectedFicha,
    responsibleInstructors,
    selectedProgram,
    tableRows,
    dates,
    fmtDate,
    fmtDateLong,
    fmtTime,
    canEditExcuse,
    handleUpdateExcuse,
    handleLearnerGridScroll,
    learnerGridWheelProps,
    handleExport,
    directFichaOnly,
    setByFichaProgram,
    setByFichaDirectFicha,
    setByFichaFicha,
    setByFichaDateFrom,
    setByFichaDateTo,
    clearByFichaFicha,
  };
}

export type AttendanceByFichaModel = ReturnType<typeof useAttendanceByFicha>;
