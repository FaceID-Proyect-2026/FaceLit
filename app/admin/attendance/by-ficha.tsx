// ─────────────────────────────────────────────
//  app/admin/attendance/by-ficha.tsx
//  RF-6.1 — Consulta de asistencia por ficha
//
//  Estado persistido en attendanceUIStore → sobrevive
//  cambios de tab sin perder selecciones.
//  Calendario: usa DateField (input date nativo web /
//  DateTimePicker nativo móvil).
// ─────────────────────────────────────────────
import { getProgramDisplayName } from '@/features/academic/types';
import { useAcademic } from '@/features/academic/useAcademic';
import {
    clearByFichaFicha,
    getAttendanceUISnapshot,
    setByFichaDateFrom,
    setByFichaDateTo,
    setByFichaFicha,
    setByFichaProgram,
    subscribeAttendanceUI,
} from '@/features/attendance/attendanceUIStore';
import {
    dateRange,
    useAttendanceRF6,
    type DayCell,
    type FichaDaySummary,
    type FichaTableRow,
} from '@/features/attendance/useAttendanceRF6';
import { SearchableSelect } from '@/shared/components/ui';
import AppButton from '@/shared/components/ui/AppButton';
import DateField from '@/shared/components/ui/DateField';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { exportReport, type ExportData, type ExportOptions } from '@/shared/utils/export';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const CELL_ABSENT   = Colors.error   + '30';
const CELL_LATE     = Colors.warning + '30';
const BORDER_ABSENT = Colors.error   + '80';
const BORDER_LATE   = Colors.warning + '80';

export default function AttendanceByFichaScreen() {
  const { isDark, theme } = useTheme();
  const { t, i18n }       = useTranslation();
  const { programs, allFichas } = useAcademic();
  const { getFichaCardsForProgram, getFichaTable } = useAttendanceRF6();

  // ── Estado persistido desde el store ─────────
  const ui = useSyncExternalStore(subscribeAttendanceUI, getAttendanceUISnapshot);
  const { selectedProgramId, selectedFichaId, dateFrom, dateTo } = ui.byFicha;

  // ── Estado local (solo para el modal de detalle de celda) ──
  const [cellDetail, setCellDetail] = useState<{ cell: DayCell; learnerName: string } | null>(null);
  const [exporting,  setExporting]  = useState(false);

  const text    = isDark ? Colors.dark.text      : Colors.light.text;
  const muted   = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg  = isDark ? '#0D1F14'             : Colors.white;
  const border  = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg      = isDark ? Colors.dark.background  : Colors.light.background;

  // ── Derivados ─────────────────────────────────
  const programOptions = useMemo(
    () => programs.map(p => ({ value: p.id, label: getProgramDisplayName(p, t) })),
    [programs, t],
  );

  const fichaCards: FichaDaySummary[] = useMemo(
    () => selectedProgramId ? getFichaCardsForProgram(selectedProgramId) : [],
    [selectedProgramId, getFichaCardsForProgram],
  );

  const selectedFicha   = useMemo(() => allFichas.find(f => f.id === selectedFichaId), [allFichas, selectedFichaId]);
  const selectedProgram = useMemo(() => programs.find(p => p.id === selectedProgramId), [programs, selectedProgramId]);

  const tableRows: FichaTableRow[] = useMemo(
    () => selectedFichaId && dateFrom && dateTo && dateFrom <= dateTo
      ? getFichaTable(selectedFichaId, dateFrom, dateTo)
      : [],
    [selectedFichaId, dateFrom, dateTo, getFichaTable],
  );

  const dates: string[] = useMemo(
    () => dateFrom && dateTo && dateFrom <= dateTo ? dateRange(dateFrom, dateTo) : [],
    [dateFrom, dateTo],
  );

  // ── Formato ───────────────────────────────────
  const fmtDate = (d: string) =>
    new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric' }).format(new Date(`${d}T12:00:00Z`));
  const fmtDateLong = (d: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long' }).format(new Date(`${d}T12:00:00Z`));
  const fmtTime = (v: string) =>
    v ? new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: '2-digit', hour12: true })
          .format(new Date(`1970-01-01T${v}:00`)) : '—';

  // ── Exportación ───────────────────────────────
  const handleExport = async (format: 'excel' | 'csv') => {
    if (!tableRows.length || !selectedFicha || !selectedProgram) return;
    setExporting(true);
    try {
      const programLabel = getProgramDisplayName(selectedProgram, t);
      const headers = [t('attendance.rf6.learner'), t('attendance.rf6.document'), ...dates.map(fmtDate)];
      const rows = tableRows.map(row => [
        row.learnerName, row.learnerDocument,
        ...row.days.map(cell => {
          if (!cell.status) return '—';
          if (cell.status === 'absent') return t('attendance.statuses.absent');
          if (cell.status === 'late')   return `${t('attendance.statuses.late')} (${cell.delayMinutes} min)`;
          return t('attendance.statuses.punctual');
        }),
      ]);
      const data: ExportData = {
        title: t('attendance.rf6.exportTitle'),
        subtitle: `${t('attendance.rf6.program')}: ${programLabel} | ${t('attendance.rf6.ficha')}: ${selectedFicha.number}`,
        headers, rows,
        filters: [
          { label: t('attendance.rf6.program'), value: programLabel },
          { label: t('attendance.rf6.ficha'),   value: selectedFicha.number },
          { label: t('reports.filters.dateFrom'), value: dateFrom },
          { label: t('reports.filters.dateTo'),   value: dateTo },
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
  return (
    <ScrollView
      style={[s.root, { backgroundColor: bg }]}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >

      {/* ── Selector de programa — solo visible sin ficha activa ── */}
      {!selectedFichaId && (
        <View style={[s.card, { backgroundColor: cardBg, borderColor: border, zIndex: 10 }]}>
          <SearchableSelect
            label={t('attendance.selectProgram')}
            value={selectedProgramId}
            options={programOptions}
            onSelect={setByFichaProgram}
            placeholder={t('attendance.selectProgramPlaceholder')}
            emptyText={t('attendance.noProgramsFound')}
          />
        </View>
      )}

      {/* Estado inicial — sin programa */}
      {!selectedProgramId && !selectedFichaId && (
        <View style={s.prompt}>
          <View style={[s.promptIcon, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="albums-outline" size={32} color={theme.primary} />
          </View>
          <Text style={[s.promptText, { color: muted }]}>{t('attendance.rf6.selectProgramPrompt')}</Text>
        </View>
      )}

      {/* Programa sin fichas */}
      {selectedProgramId && !selectedFichaId && fichaCards.length === 0 && (
        <View style={s.emptyBox}>
          <Ionicons name="document-outline" size={28} color={muted} />
          <Text style={[s.emptyText, { color: muted }]}>{t('attendance.noFichasInProgram')}</Text>
        </View>
      )}

      {/* ── Tarjetas de fichas ── */}
      {fichaCards.length > 0 && !selectedFichaId && (
        <>
          <Text style={[s.sectionLabel, { color: text }]}>{t('attendance.rf6.fichasToday')}</Text>
          <View style={s.cardsGrid}>
            {fichaCards.map(card => (
              <TouchableOpacity
                key={card.fichaId}
                activeOpacity={0.75}
                onPress={() => setByFichaFicha(card.fichaId)}
                style={[s.fichaCard, { backgroundColor: cardBg, borderColor: border }]}
                accessibilityRole="button"
              >
                <View style={[s.fichaCardHeader, { backgroundColor: theme.primary + '18' }]}>
                  <Ionicons name="people-outline" size={18} color={theme.primary} />
                  <Text style={[s.fichaNumber, { color: theme.primary }]}>{card.fichaNumber}</Text>
                </View>
                <View style={s.fichaMetrics}>
                  <View style={s.fichaMetric}>
                    <View style={[s.metricDot, { backgroundColor: Colors.error }]} />
                    <Text style={[s.metricPct, { color: Colors.error }]}>{card.absentPct}%</Text>
                    <Text style={[s.metricLabel, { color: muted }]}>{t('attendance.rf6.absent')}</Text>
                  </View>
                  <View style={[s.metricDivider, { backgroundColor: border }]} />
                  <View style={s.fichaMetric}>
                    <View style={[s.metricDot, { backgroundColor: Colors.warning }]} />
                    <Text style={[s.metricPct, { color: Colors.warning }]}>{card.latePct}%</Text>
                    <Text style={[s.metricLabel, { color: muted }]}>{t('attendance.rf6.late')}</Text>
                  </View>
                </View>
                <Text style={[s.fichaTotal, { color: muted }]}>
                  {card.absentToday} {t('attendance.rf6.absentCount')} · {card.lateToday} {t('attendance.rf6.lateCount')} · {card.totalLearners} {t('attendance.rf6.total')}
                </Text>
                <View style={[s.fichaAction, { borderTopColor: border }]}>
                  <Text style={[s.fichaActionText, { color: theme.primary }]}>{t('attendance.rf6.viewDetail')}</Text>
                  <Ionicons name="chevron-forward" size={14} color={theme.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* ── Pantalla 2: Detalle de ficha ── */}
      {selectedFichaId && (
        <>
          {/* Breadcrumb */}
          <TouchableOpacity
            onPress={clearByFichaFicha}
            style={[s.backRow, { backgroundColor: cardBg, borderColor: border }]}
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={16} color={theme.primary} />
            <Text style={[s.backProgram, { color: muted }]} numberOfLines={1}>
              {selectedProgram ? getProgramDisplayName(selectedProgram, t) : ''}
            </Text>
            <Ionicons name="chevron-forward" size={13} color={muted} />
            <Text style={[s.backFicha, { color: theme.primary }]}>
              {t('attendance.rf6.ficha')} {selectedFicha?.number}
            </Text>
          </TouchableOpacity>

          {/* Selectores de fecha con DateField */}
          <View style={[s.card, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[s.rangeLabel, { color: muted }]}>{t('attendance.rf6.selectRange')}</Text>
            <View style={s.rangeRow}>
              <View style={s.dateFieldWrap}>
                <DateField
                  label={t('reports.filters.dateFrom')}
                  value={dateFrom}
                  onChange={setByFichaDateFrom}
                  placeholder="AAAA-MM-DD"
                  containerStyle={s.noMargin}
                />
              </View>
              <View style={s.dateSepWrap}>
                <Text style={[s.dateSep, { color: muted }]}>→</Text>
              </View>
              <View style={s.dateFieldWrap}>
                <DateField
                  label={t('reports.filters.dateTo')}
                  value={dateTo}
                  onChange={setByFichaDateTo}
                  minDate={dateFrom || undefined}
                  placeholder="AAAA-MM-DD"
                  containerStyle={s.noMargin}
                />
              </View>
            </View>
            {dateFrom && dateTo && dateFrom > dateTo && (
              <Text style={[s.dateError, { color: Colors.error }]}>{t('reports.invalidDateRange')}</Text>
            )}
          </View>

          {/* ── Tabla ── */}
          {tableRows.length > 0 && dates.length > 0 && (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator style={s.tableScroll}>
                <View>
                  <View style={s.tableHeaderRow}>
                    <View style={[s.cellName, s.thCell, { backgroundColor: theme.primary + '20', borderColor: border }]}>
                      <Text style={[s.thText, { color: theme.primary }]}>{t('attendance.rf6.learner')}</Text>
                    </View>
                    {dates.map(d => (
                      <View key={d} style={[s.cellDay, s.thCell, { backgroundColor: theme.primary + '20', borderColor: border }]}>
                        <Text style={[s.thText, { color: theme.primary }]}>{fmtDate(d)}</Text>
                      </View>
                    ))}
                  </View>
                  {tableRows.map((row, rIdx) => (
                    <View key={row.learnerId} style={[s.tableRow, { backgroundColor: rIdx % 2 === 0 ? cardBg : theme.primary + '08' }]}>
                      <View style={[s.cellName, { borderColor: border }]}>
                        <Text style={[s.cellNameText, { color: text }]} numberOfLines={1}>{row.learnerName}</Text>
                        <Text style={[s.cellDocText,  { color: muted }]} numberOfLines={1}>{row.learnerDocument}</Text>
                      </View>
                      {row.days.map((cell, dIdx) => {
                        const isAbsent    = cell.status === 'absent';
                        const isLate      = cell.status === 'late';
                        const isClickable = isAbsent || isLate;
                        return (
                          <TouchableOpacity
                            key={dIdx}
                            disabled={!isClickable}
                            onPress={() => isClickable && setCellDetail({ cell, learnerName: row.learnerName })}
                            style={[
                              s.cellDay, { borderColor: border },
                              isAbsent && { backgroundColor: CELL_ABSENT, borderColor: BORDER_ABSENT },
                              isLate   && { backgroundColor: CELL_LATE,   borderColor: BORDER_LATE },
                            ]}
                            accessibilityRole={isClickable ? 'button' : 'none'}
                          >
                            {isAbsent && <Ionicons name="close-circle" size={16} color={Colors.error} />}
                            {isLate   && <Ionicons name="time"         size={16} color={Colors.warning} />}
                            {cell.status === 'punctual' && <View style={[s.punctualDot, { backgroundColor: Colors.success + '60' }]} />}
                            {!cell.status && <Text style={[s.cellEmpty, { color: muted }]}>—</Text>}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </ScrollView>

              <View style={s.legend}>
                {[
                  { color: Colors.error,   label: t('attendance.statuses.absent') },
                  { color: Colors.warning, label: t('attendance.statuses.late') },
                  { color: Colors.success, label: t('attendance.statuses.punctual') },
                ].map(item => (
                  <View key={item.label} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: item.color }]} />
                    <Text style={[s.legendText, { color: muted }]}>{item.label}</Text>
                  </View>
                ))}
              </View>

              <View style={s.exportRow}>
                <AppButton title={exporting ? t('common.loading') : t('attendance.rf6.exportExcel')} onPress={() => handleExport('excel')} disabled={exporting} fullWidth={false} style={s.exportBtn} />
                <AppButton title={exporting ? t('common.loading') : t('attendance.rf6.exportCsv')} onPress={() => handleExport('csv')} disabled={exporting} variant="outline" fullWidth={false} style={s.exportBtn} />
              </View>
            </>
          )}

          {(!dateFrom || !dateTo) && (
            <View style={s.emptyBox}>
              <Ionicons name="calendar-outline" size={28} color={muted} />
              <Text style={[s.emptyText, { color: muted }]}>{t('attendance.rf6.selectRangePrompt')}</Text>
            </View>
          )}

          {dateFrom && dateTo && dateFrom <= dateTo && tableRows.length === 0 && (
            <View style={s.emptyBox}>
              <Ionicons name="document-text-outline" size={28} color={muted} />
              <Text style={[s.emptyText, { color: muted }]}>{t('attendance.rf6.noRecordsRange')}</Text>
            </View>
          )}
        </>
      )}

      {/* ── Modal detalle de celda ── */}
      <Modal visible={!!cellDetail} transparent animationType="slide">
        <Pressable style={s.modalOverlay} onPress={() => setCellDetail(null)}>
          <Pressable style={[s.detailBox, { backgroundColor: cardBg, borderColor: border }]}>
            {cellDetail && (
              <>
                <View style={[s.detailBanner, {
                  backgroundColor: (cellDetail.cell.status === 'absent' ? Colors.error : Colors.warning) + '15',
                }]}>
                  <Ionicons
                    name={cellDetail.cell.status === 'absent' ? 'close-circle' : 'time'} size={36}
                    color={cellDetail.cell.status === 'absent' ? Colors.error : Colors.warning}
                  />
                  <Text style={[s.detailStatus, {
                    color: cellDetail.cell.status === 'absent' ? Colors.error : Colors.warning,
                  }]}>
                    {cellDetail.cell.status === 'absent' ? t('attendance.statuses.absent') : t('attendance.statuses.late')}
                  </Text>
                </View>
                {([
                  ['person-outline',        t('attendance.rf6.learner'),       cellDetail.learnerName],
                  ['calendar-outline',      t('attendance.fields.date'),        fmtDateLong(cellDetail.cell.date)],
                  ['log-in-outline',        t('attendance.fields.entryTime'),   fmtTime(cellDetail.cell.entryTime)],
                  ...(cellDetail.cell.delayMinutes > 0
                    ? [['timer-outline', t('attendance.fields.delay'), `${cellDetail.cell.delayMinutes} min`]]
                    : []),
                  ['business-outline',      t('attendance.fields.environment'), cellDetail.cell.environmentName || '—'],
                  ['person-circle-outline', t('attendance.fields.instructor'),  cellDetail.cell.instructorName  || '—'],
                ] as [string, string, string][]).map(([icon, label, value]) => (
                  <View key={label} style={[s.detailRow, { borderBottomColor: border }]}>
                    <View style={s.detailLabel}>
                      <Ionicons name={icon as any} size={15} color={muted} />
                      <Text style={[s.detailLabelText, { color: muted }]}>{label}</Text>
                    </View>
                    <Text style={[s.detailValue, { color: text }]}>{value}</Text>
                  </View>
                ))}
                <AppButton title={t('common.close')} onPress={() => setCellDetail(null)} variant="outline" style={{ marginTop: 14 }} />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

// ── Estilos ───────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1 },
  content: { padding: 16, paddingBottom: 48, gap: 12 },
  card:    { borderRadius: 14, borderWidth: 1, padding: 16 },
  noMargin: { marginBottom: 0 },

  prompt:     { alignItems: 'center', paddingVertical: 60, gap: 12 },
  promptIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  promptText: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },

  emptyBox:  { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: FontSize.sm, textAlign: 'center' },

  sectionLabel: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: 4 },

  cardsGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  fichaCard:       { flexBasis: 160, flexGrow: 1, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  fichaCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  fichaNumber:     { fontSize: FontSize.base, fontWeight: FontWeight.black },
  fichaMetrics:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  fichaMetric:     { flex: 1, alignItems: 'center', gap: 3 },
  metricDot:       { width: 8, height: 8, borderRadius: 4 },
  metricPct:       { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  metricLabel:     { fontSize: FontSize.xs, textAlign: 'center' },
  metricDivider:   { width: 1, height: 40, marginHorizontal: 8 },
  fichaTotal:      { fontSize: FontSize.xs, textAlign: 'center', paddingHorizontal: 12, paddingBottom: 8 },
  fichaAction:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderTopWidth: 1, padding: 10 },
  fichaActionText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  backRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, borderWidth: 1, padding: 10 },
  backProgram: { fontSize: FontSize.xs, flex: 1 },
  backFicha:   { fontSize: FontSize.sm, fontWeight: FontWeight.black },

  rangeLabel:    { fontSize: FontSize.sm, marginBottom: 10 },
  rangeRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' },
  dateFieldWrap: { flex: 1, minWidth: 130 },
  dateSepWrap:   { paddingTop: 34, alignItems: 'center' },
  dateSep:       { fontSize: FontSize.lg },
  dateError:     { fontSize: FontSize.xs, marginTop: 4 },

  tableScroll:    { marginHorizontal: -16 },
  tableHeaderRow: { flexDirection: 'row' },
  tableRow:       { flexDirection: 'row' },
  thCell:         { justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, padding: 8 },
  thText:         { fontSize: FontSize.xs, fontWeight: FontWeight.black, textAlign: 'center' },
  cellName:       { width: 140, borderWidth: 0.5, padding: 8, justifyContent: 'center' },
  cellNameText:   { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  cellDocText:    { fontSize: 10 },
  cellDay:        { width: 52, height: 52, borderWidth: 0.5, alignItems: 'center', justifyContent: 'center' },
  punctualDot:    { width: 8, height: 8, borderRadius: 4 },
  cellEmpty:      { fontSize: FontSize.xs },

  legend:     { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: FontSize.xs },

  exportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  exportBtn: { flexGrow: 1, minWidth: 140 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  detailBox:    { width: '100%', maxWidth: 400, borderRadius: 16, borderWidth: 1, padding: 20 },
  detailBanner: { borderRadius: 12, padding: 20, alignItems: 'center', gap: 8, marginBottom: 16 },
  detailStatus: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  detailRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  detailLabel:  { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  detailLabelText: { fontSize: FontSize.sm },
  detailValue:  { fontSize: FontSize.sm, fontWeight: FontWeight.bold, flex: 1, textAlign: 'right' },
});
