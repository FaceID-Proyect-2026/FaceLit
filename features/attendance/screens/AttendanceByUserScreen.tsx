import {
  setByUserDateFrom,
  setByUserDateTo,
  setByUserLearner,
  setByUserQuery,
} from '@/features/attendance/attendanceUIStore';
import AppButton from '@/shared/components/ui/AppButton';
import DateField from '@/shared/components/ui/DateField';
import { Colors } from '@/shared/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { s } from '@/features/attendance/components/AttendanceByUserStyles';

import { useAttendanceByUserScreen } from '@/features/attendance/hooks/useAttendanceByUserScreen';

export default function AttendanceByUserScreen({ allowedFichaIds }: { allowedFichaIds?: string[] } = {}) {
  const {
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
  } = useAttendanceByUserScreen({ allowedFichaIds });
return (
    <ScrollView
      style={[s.root, { backgroundColor: bg }]}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Buscador */}
      <View style={[s.card, { backgroundColor: cardBg, borderColor: border }]}>
        <Text style={[s.searchLabel, { color: muted }]}>{t('attendance.rf6.searchLearner')}</Text>

        {selectedLearner ? (
          <View style={[s.selectedSummary, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '45' }]}>
            <View style={[s.resultAvatar, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[s.resultAvatarText, { color: theme.primary }]}>
                {selectedLearner.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.resultName, { color: text }]}>{selectedLearner.name}</Text>
              <Text style={[s.resultDoc, { color: muted }]}>{selectedLearner.document} - {t('academic.ficha')} {selectedLearner.fichaNumber}</Text>
            </View>
            <TouchableOpacity
              style={[s.selectedChangeBtn, { borderColor: theme.primary + '60' }]}
              onPress={() => setByUserQuery('')}
              accessibilityRole="button"
            >
              <Ionicons name="swap-horizontal-outline" size={16} color={theme.primary} />
              <Text style={[s.selectedChangeText, { color: theme.primary }]}>{t('common.change')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
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
        )}

        {!selectedLearner && query.trim().length >= 2 && searchResults.length === 0 && (
          <Text style={[s.noResults, { color: muted }]}>{t('attendance.rf6.noLearnerFound')}</Text>
        )}

        {!selectedLearner && searchResults.map(r => (
          <TouchableOpacity
            key={r.learnerId}
            style={[s.resultItem, { borderColor: border }]}
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
              <Text style={[s.resultDoc,  { color: muted }]}>{r.document} - {t('academic.ficha')} {r.fichaNumber}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Rango de fechas con DateField; solo si hay aprendiz seleccionado */}
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
              <Text style={[s.learnerDoc,  { color: muted }]}>{selectedLearner.document} - {t('academic.ficha')} {selectedLearner.fichaNumber}</Text>
            </View>
          </View>

          <Text style={[s.rangeLabel, { color: muted }]}>{t('attendance.rf6.selectRange')}</Text>
          <View style={s.rangeRow}>
            <View style={s.dateFieldWrap}>
              <DateField
                label={t('reports.filters.dateFrom')}
                value={dateFrom}
                onChange={setByUserDateFrom}
                placeholder="YYYY-MM-DD"
                containerStyle={s.noMargin}
              />
            </View>
            <View style={s.dateSepWrap}>
              <Text style={[s.dateSep, { color: muted }]}>-&gt;</Text>
            </View>
            <View style={s.dateFieldWrap}>
              <DateField
                label={t('reports.filters.dateTo')}
                value={dateTo}
                onChange={setByUserDateTo}
                minDate={dateFrom || undefined}
                placeholder="YYYY-MM-DD"
                containerStyle={s.noMargin}
              />
            </View>
          </View>
          {dateFrom.length > 0 && dateTo.length > 0 && dateFrom > dateTo && (
            <Text style={[s.dateError, { color: Colors.error }]}>{t('reports.invalidDateRange')}</Text>
          )}
        </View>
      )}

      {/* Tabla de asistencia por fecha */}
      {selectedLearner && loadingMatrix && (
        <View style={s.emptyBox}>
          <Ionicons name="sync-outline" size={28} color={muted} />
          <Text style={[s.emptyText, { color: muted }]}>{t('common.loading')}</Text>
        </View>
      )}

      {selectedLearner && matrixError && (
        <View style={s.emptyBox}>
          <Ionicons name="alert-circle-outline" size={28} color={Colors.error} />
          <Text style={[s.emptyText, { color: Colors.error }]}>{matrixError}</Text>
        </View>
      )}

      {cells.length > 0 && (
        <>
          <View style={[s.exitTable, { borderColor: border, backgroundColor: cardBg }]}>
            <View style={[s.exitHeaderRow, { backgroundColor: theme.primary + '20', borderColor: border }]}>
              <View style={[s.exitDateCell, { borderColor: border }]}>
                <Text style={[s.thText, { color: theme.primary }]}>{t('attendance.fields.date')}</Text>
              </View>
              <View style={[s.exitStatusCell, { borderColor: border }]}>
                <Text style={[s.thText, { color: theme.primary }]}>{t('attendance.fields.status')}</Text>
              </View>
              <View style={[s.exitMarkCell, { borderColor: border }]}>
                <Text style={[s.thText, { color: theme.primary }]}>Salida</Text>
              </View>
            </View>
            {cells.map((cell, index) => (
              <View
                key={`${cell.date}-${index}`}
                style={[
                  s.exitDataRow,
                  {
                    backgroundColor: index % 2 === 0 ? cardBg : theme.primary + '08',
                    borderColor: border,
                  },
                ]}
              >
                <View style={[s.exitDateCell, { borderColor: border }]}>
                  <Text style={[s.exitDateText, { color: text }]}>{fmtDateLong(cell.date)}</Text>
                </View>
                <View style={[s.exitStatusCell, { borderColor: border }]}>
                  <TouchableOpacity
                    activeOpacity={cell.status === 'absent' || cell.status === 'late' ? 0.75 : 1}
                    disabled={cell.status !== 'absent' && cell.status !== 'late'}
                    onPress={() => (cell.status === 'absent' || cell.status === 'late') && setCellDetail(cell)}
                    style={[
                      s.statusBox,
                      {
                        backgroundColor: getStatusColor(cell) + '30',
                        borderColor: getStatusColor(cell) + '80',
                      },
                    ]}
                    accessibilityRole={cell.status === 'absent' || cell.status === 'late' ? 'button' : 'none'}
                  >
                    {cell.status === 'absent' && cell.excuse === true ? (
                      <Text style={[s.statusMark, { color: Colors.error }]}>E</Text>
                    ) : cell.status === 'absent' ? (
                      <Ionicons name="close-circle" size={15} color={Colors.error} />
                    ) : cell.status === 'late' ? (
                      <Ionicons name="time" size={15} color={Colors.warning} />
                    ) : cell.status === 'punctual' ? (
                      <View style={[s.statusDot, { backgroundColor: Colors.success }]} />
                    ) : (
                      <Text style={[s.emptyCell, { color: muted }]}>-</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <View style={[s.exitMarkCell, { borderColor: border }]}>
                  <Text style={[s.exitMarkText, { color: cell.exitRegistered ? Colors.success : muted }]}>
                    {cell.exitRegistered ? 'x' : '-'}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Resumen */}
          <View style={[s.summaryRow, { backgroundColor: cardBg, borderColor: border }]}>
            {[
              { label: t('attendance.statuses.absent'), value: cells.filter(c => c.status === 'absent').length, color: Colors.error },
              { label: 'Salidas registradas', value: cells.filter(c => c.exitRegistered).length, color: Colors.success },
              { label: 'Sin salida', value: cells.filter(c => !c.exitRegistered).length, color: muted },
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
      {selectedLearner && dateFrom.length > 0 && dateTo.length > 0 && dateFrom <= dateTo && !loadingMatrix && !matrixError && cells.length === 0 && (
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

      {/* Modal detalle de celda */}
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
                  ['business-outline',      t('attendance.fields.environment'), cellDetail.environmentName || '-'],
                  ['person-circle-outline', t('attendance.fields.instructor'),  cellDetail.instructorName  || '-'],
                  ['school-outline',        t('attendance.rf6.ficha'),          cellDetail.fichaNumber      || '-'],
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
