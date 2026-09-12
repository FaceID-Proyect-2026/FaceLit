// ─────────────────────────────────────────────
//  app/admin/attendance/by-user.tsx
//  RF-6.2 — Consulta de asistencia por usuario
//
//  Estado persistido en attendanceUIStore → sobrevive
//  cambios de tab.
//  Calendario: usa DateField (input date nativo web /
//  DateTimePicker nativo móvil).
// ─────────────────────────────────────────────
import {
    getAttendanceUISnapshot,
    setByUserDateFrom,
    setByUserDateTo,
    setByUserLearner,
    setByUserQuery,
    subscribeAttendanceUI,
} from '@/features/attendance/attendanceUIStore';
import {
    dateRange,
    useAttendanceRF6,
    type DayCell,
} from '@/features/attendance/useAttendanceRF6';
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
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const CELL_ABSENT   = Colors.error   + '30';
const CELL_LATE     = Colors.warning + '30';
const BORDER_ABSENT = Colors.error   + '80';
const BORDER_LATE   = Colors.warning + '80';

export default function AttendanceByUserScreen() {
  const { isDark, theme } = useTheme();
  const { t, i18n }       = useTranslation();
  const { searchLearners, getLearnerTable } = useAttendanceRF6();

  // ── Estado persistido desde el store ─────────
  const ui = useSyncExternalStore(subscribeAttendanceUI, getAttendanceUISnapshot);
  const { query, selectedLearner, dateFrom, dateTo } = ui.byUser;

  // ── Estado local (solo modal detalle celda) ───
  const [cellDetail, setCellDetail] = useState<DayCell | null>(null);
  const [exporting,  setExporting]  = useState(false);

  const text    = isDark ? Colors.dark.text      : Colors.light.text;
  const muted   = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg  = isDark ? '#0D1F14'             : Colors.white;
  const border  = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg      = isDark ? Colors.dark.background  : Colors.light.background;
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';

  // ── Derivados ─────────────────────────────────
  const searchResults = useMemo(
    () => query.trim().length >= 2 ? searchLearners(query) : [],
    [query, searchLearners],
  );

  const dates: string[] = useMemo(
    () => dateFrom && dateTo && dateFrom <= dateTo ? dateRange(dateFrom, dateTo) : [],
    [dateFrom, dateTo],
  );

  const cells: DayCell[] = useMemo(
    () => selectedLearner && dateFrom && dateTo && dateFrom <= dateTo
      ? getLearnerTable(selectedLearner.learnerId, dateFrom, dateTo)
      : [],
    [selectedLearner, dateFrom, dateTo, getLearnerTable],
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
    if (!cells.length || !selectedLearner) return;
    setExporting(true);
    try {
      const headers = [t('reports.filters.dateFrom'), t('attendance.rf6.statusCol')];
      const rows = cells.map(cell => [
        fmtDate(cell.date),
        !cell.status          ? '—'
        : cell.status === 'absent' ? t('attendance.statuses.absent')
        : cell.status === 'late'   ? `${t('attendance.statuses.late')} (${cell.delayMinutes} min)`
        : t('attendance.statuses.punctual'),
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

  // ─────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────
  return (
    <ScrollView
      style={[s.root, { backgroundColor: bg }]}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >

      {/* ── Buscador ── */}
      <View style={[s.card, { backgroundColor: cardBg, borderColor: border }]}>
        <Text style={[s.searchLabel, { color: muted }]}>{t('attendance.rf6.searchLearner')}</Text>
        <View style={[s.searchRow, { backgroundColor: inputBg, borderColor: border }]}>
          <Ionicons name="search-outline" size={17} color={muted} />
          <TextInput
            style={[s.searchInput, { color: text }] as any}
            value={query}
            onChangeText={setByUserQuery}
            placeholder={t('attendance.rf6.searchPlaceholder')}
            placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setByUserQuery('')}>
              <Ionicons name="close-circle" size={17} color={muted} />
            </TouchableOpacity>
          )}
        </View>

        {query.trim().length >= 2 && searchResults.length === 0 && (
          <Text style={[s.noResults, { color: muted }]}>{t('attendance.rf6.noLearnerFound')}</Text>
        )}

        {searchResults.map(r => (
          <TouchableOpacity
            key={r.learnerId}
            style={[
              s.resultItem, { borderColor: border },
              selectedLearner?.learnerId === r.learnerId && { backgroundColor: theme.primary + '15', borderColor: theme.primary + '60' },
            ]}
            onPress={() => setByUserLearner(r)}
            accessibilityRole="button"
          >
            <View style={[s.resultAvatar, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[s.resultAvatarText, { color: theme.primary }]}>
                {r.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.resultName, { color: text }]}>{r.name}</Text>
              <Text style={[s.resultDoc,  { color: muted }]}>{r.document} · Ficha {r.fichaNumber}</Text>
            </View>
            {selectedLearner?.learnerId === r.learnerId && (
              <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Rango de fechas con DateField — solo si hay aprendiz seleccionado ── */}
      {selectedLearner && (
        <View style={[s.card, { backgroundColor: cardBg, borderColor: border }]}>
          {/* Cabecera del aprendiz seleccionado */}
          <View style={s.learnerHeader}>
            <View style={[s.learnerAvatar, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[s.learnerAvatarText, { color: theme.primary }]}>
                {selectedLearner.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.learnerName, { color: text }]}>{selectedLearner.name}</Text>
              <Text style={[s.learnerDoc,  { color: muted }]}>{selectedLearner.document} · Ficha {selectedLearner.fichaNumber}</Text>
            </View>
          </View>

          <Text style={[s.rangeLabel, { color: muted }]}>{t('attendance.rf6.selectRange')}</Text>
          <View style={s.rangeRow}>
            <View style={s.dateFieldWrap}>
              <DateField
                label={t('reports.filters.dateFrom')}
                value={dateFrom}
                onChange={setByUserDateFrom}
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
                onChange={setByUserDateTo}
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
      )}

      {/* ── Tabla de celdas coloreadas ── */}
      {cells.length > 0 && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator style={s.tableScroll}>
            <View style={s.tableInner}>
              <View style={s.tableHeaderRow}>
                {dates.map(d => (
                  <View key={d} style={[s.cell, s.thCell, { backgroundColor: theme.primary + '20', borderColor: border }]}>
                    <Text style={[s.thText, { color: theme.primary }]}>{fmtDate(d)}</Text>
                  </View>
                ))}
              </View>
              <View style={s.tableRow}>
                {cells.map((cell, i) => {
                  const isAbsent    = cell.status === 'absent';
                  const isLate      = cell.status === 'late';
                  const isClickable = isAbsent || isLate;
                  return (
                    <TouchableOpacity
                      key={i}
                      disabled={!isClickable}
                      onPress={() => isClickable && setCellDetail(cell)}
                      style={[
                        s.cell, { borderColor: border, backgroundColor: cardBg },
                        isAbsent && { backgroundColor: CELL_ABSENT, borderColor: BORDER_ABSENT },
                        isLate   && { backgroundColor: CELL_LATE,   borderColor: BORDER_LATE },
                      ]}
                      accessibilityRole={isClickable ? 'button' : 'none'}
                    >
                      {isAbsent && <Ionicons name="close-circle" size={18} color={Colors.error} />}
                      {isLate   && <Ionicons name="time"         size={18} color={Colors.warning} />}
                      {cell.status === 'punctual' && <View style={[s.dot, { backgroundColor: Colors.success + '70' }]} />}
                      {!cell.status && <Text style={[s.emptyCell, { color: muted }]}>—</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Leyenda */}
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

          {/* Resumen */}
          <View style={[s.summaryRow, { backgroundColor: cardBg, borderColor: border }]}>
            {[
              { label: t('attendance.stats.absent'),   value: cells.filter(c => c.status === 'absent').length,   color: Colors.error },
              { label: t('attendance.stats.late'),     value: cells.filter(c => c.status === 'late').length,     color: Colors.warning },
              { label: t('attendance.stats.punctual'), value: cells.filter(c => c.status === 'punctual').length, color: Colors.success },
            ].map(stat => (
              <View key={stat.label} style={s.summaryItem}>
                <Text style={[s.summaryValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={[s.summaryLabel, { color: muted }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Exportar */}
          <View style={s.exportRow}>
            <AppButton title={exporting ? t('common.loading') : t('attendance.rf6.exportExcel')} onPress={() => handleExport('excel')} disabled={exporting} fullWidth={false} style={s.exportBtn} />
            <AppButton title={exporting ? t('common.loading') : t('attendance.rf6.exportCsv')} onPress={() => handleExport('csv')} disabled={exporting} variant="outline" fullWidth={false} style={s.exportBtn} />
          </View>
        </>
      )}

      {/* Sin rango elegido */}
      {selectedLearner && (!dateFrom || !dateTo) && (
        <View style={s.emptyBox}>
          <Ionicons name="calendar-outline" size={28} color={muted} />
          <Text style={[s.emptyText, { color: muted }]}>{t('attendance.rf6.selectRangePrompt')}</Text>
        </View>
      )}

      {/* Rango sin registros */}
      {selectedLearner && dateFrom && dateTo && dateFrom <= dateTo && cells.length > 0 && cells.every(c => !c.status) && (
        <View style={s.emptyBox}>
          <Ionicons name="document-text-outline" size={28} color={muted} />
          <Text style={[s.emptyText, { color: muted }]}>{t('attendance.rf6.noRecordsRange')}</Text>
        </View>
      )}

      {/* Estado inicial */}
      {!selectedLearner && query.trim().length < 2 && (
        <View style={s.prompt}>
          <View style={[s.promptIcon, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="person-outline" size={32} color={theme.primary} />
          </View>
          <Text style={[s.promptText, { color: muted }]}>{t('attendance.rf6.searchPrompt')}</Text>
        </View>
      )}

      {/* ── Modal detalle de celda ── */}
      <Modal visible={!!cellDetail} transparent animationType="slide">
        <Pressable style={s.modalOverlay} onPress={() => setCellDetail(null)}>
          <Pressable style={[s.detailBox, { backgroundColor: cardBg, borderColor: border }]}>
            {cellDetail && (
              <>
                <View style={[s.detailBanner, {
                  backgroundColor: (cellDetail.status === 'absent' ? Colors.error : Colors.warning) + '15',
                }]}>
                  <Ionicons
                    name={cellDetail.status === 'absent' ? 'close-circle' : 'time'} size={36}
                    color={cellDetail.status === 'absent' ? Colors.error : Colors.warning}
                  />
                  <Text style={[s.detailStatus, {
                    color: cellDetail.status === 'absent' ? Colors.error : Colors.warning,
                  }]}>
                    {cellDetail.status === 'absent' ? t('attendance.statuses.absent') : t('attendance.statuses.late')}
                  </Text>
                </View>
                {([
                  ['calendar-outline',      t('attendance.fields.date'),        fmtDateLong(cellDetail.date)],
                  ['log-in-outline',        t('attendance.fields.entryTime'),   fmtTime(cellDetail.entryTime)],
                  ...(cellDetail.delayMinutes > 0
                    ? [['timer-outline', t('attendance.fields.delay'), `${cellDetail.delayMinutes} min`]]
                    : []),
                  ['business-outline',      t('attendance.fields.environment'), cellDetail.environmentName || '—'],
                  ['person-circle-outline', t('attendance.fields.instructor'),  cellDetail.instructorName  || '—'],
                  ['school-outline',        t('attendance.rf6.ficha'),          cellDetail.fichaNumber      || '—'],
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
  card:    { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  noMargin: { marginBottom: 0 },

  searchLabel:      { fontSize: FontSize.sm },
  searchRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 44 },
  searchInput:      { flex: 1, fontSize: FontSize.sm, outlineStyle: 'none' } as any,
  noResults:        { fontSize: FontSize.sm, textAlign: 'center', paddingVertical: 8 },
  resultItem:       { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, borderWidth: 1, padding: 10 },
  resultAvatar:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  resultAvatarText: { fontWeight: FontWeight.black, fontSize: FontSize.sm },
  resultName:       { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  resultDoc:        { fontSize: FontSize.xs },

  learnerHeader:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  learnerAvatar:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  learnerAvatarText: { fontWeight: FontWeight.black, fontSize: FontSize.base },
  learnerName:       { fontSize: FontSize.base, fontWeight: FontWeight.black },
  learnerDoc:        { fontSize: FontSize.xs },

  rangeLabel:    { fontSize: FontSize.sm },
  rangeRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' },
  dateFieldWrap: { flex: 1, minWidth: 130 },
  dateSepWrap:   { paddingTop: 34, alignItems: 'center' },
  dateSep:       { fontSize: FontSize.lg },
  dateError:     { fontSize: FontSize.xs, color: Colors.error },

  tableScroll:    { marginHorizontal: -16 },
  tableInner:     { paddingHorizontal: 16 },
  tableHeaderRow: { flexDirection: 'row' },
  tableRow:       { flexDirection: 'row' },
  thCell:         { justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, padding: 8 },
  thText:         { fontSize: FontSize.xs, fontWeight: FontWeight.black, textAlign: 'center' },
  cell:           { width: 56, height: 56, borderWidth: 0.5, alignItems: 'center', justifyContent: 'center' },
  dot:            { width: 10, height: 10, borderRadius: 5 },
  emptyCell:      { fontSize: FontSize.xs },

  legend:     { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: FontSize.xs },

  summaryRow:   { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 14 },
  summaryItem:  { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  summaryLabel: { fontSize: FontSize.xs, textAlign: 'center' },

  exportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  exportBtn: { flexGrow: 1, minWidth: 140 },

  emptyBox:   { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText:  { fontSize: FontSize.sm, textAlign: 'center' },
  prompt:     { alignItems: 'center', paddingVertical: 60, gap: 12 },
  promptIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  promptText: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  detailBox:    { width: '100%', maxWidth: 400, borderRadius: 16, borderWidth: 1, padding: 20 },
  detailBanner: { borderRadius: 12, padding: 20, alignItems: 'center', gap: 8, marginBottom: 16 },
  detailStatus: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  detailRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  detailLabel:  { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  detailLabelText: { fontSize: FontSize.sm },
  detailValue:  { fontSize: FontSize.sm, fontWeight: FontWeight.bold, flex: 1, textAlign: 'right' },
});
