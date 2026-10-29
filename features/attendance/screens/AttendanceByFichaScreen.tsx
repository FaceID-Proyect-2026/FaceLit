import { getProgramDisplayName } from "@/features/academic/types";
import { todayBogota } from "@/features/attendance/utils/attendanceDates";
import { SearchableSelect } from "@/shared/components/ui";
import AppButton from "@/shared/components/ui/AppButton";
import DateField from "@/shared/components/ui/DateField";
import { Colors } from "@/shared/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAttendanceByFicha, type AttendanceByFichaOptions } from '@/features/attendance/hooks/useAttendanceByFicha';
import { AttendanceLearnerGrid } from '@/features/attendance/components/AttendanceLearnerGrid';
import { AttendanceCellDetailDialog } from '@/features/attendance/components/AttendanceCellDetailDialog';
import { s } from '@/features/attendance/components/attendanceByFichaStyles';

export default function AttendanceByFichaScreen(props: AttendanceByFichaOptions) {
  const model = useAttendanceByFicha(props);
  const {
    theme,
    t,
    selectedProgramId,
    selectedFichaId,
    dateFrom,
    dateTo,
    loadingFichaCards,
    loadingMatrix,
    matrixError,
    exporting,
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
    handleExport,
    directFichaOnly,
    setByFichaProgram,
    setByFichaDirectFicha,
    setByFichaFicha,
    setByFichaDateFrom,
    setByFichaDateTo,
    clearByFichaFicha,
  } = model;
  return (
    <ScrollView
      style={[s.root, { backgroundColor: bg }]}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.contentInner}>
      {!Boolean(selectedFichaId) && !directFichaOnly && (
        <View style={[s.guideCard, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={[s.guideIcon, { backgroundColor: theme.primary + "18" }]}>
            <Ionicons name="map-outline" size={22} color={theme.primary} />
          </View>
          <View style={s.guideCopy}>
            <Text style={[s.guideTitle, { color: text }]}>{t("attendance.programFichaGuideTitle")}</Text>
            <Text style={[s.guideText, { color: muted }]}>
              {t("attendance.programFichaGuideDescription")}
            </Text>
          </View>
        </View>
      )}
      {/* ── Selector de programa — solo visible sin ficha activa ── */}
      {!Boolean(selectedFichaId) && !directFichaOnly && (
        <View
          style={[
            s.card,
            { backgroundColor: cardBg, borderColor: border, zIndex: 10 },
          ]}
        >
          <SearchableSelect
            label={t("attendance.selectProgram")}
            value={selectedProgramId}
            options={programOptions}
            onSelect={setByFichaProgram}
            placeholder={t("attendance.selectProgramPlaceholder")}
            emptyText={t("attendance.noProgramsFound")}
          />
        </View>
      )}

      {!Boolean(selectedFichaId) && directFichaOnly && (
        <View
          style={[
            s.card,
            { backgroundColor: cardBg, borderColor: border, zIndex: 10 },
          ]}
        >
          <SearchableSelect
            label={t("attendance.selectFicha")}
            value={selectedFichaId}
            options={fichaOptions}
            onSelect={(fichaId) => {
              const ficha = visibleFichas.find((item) => item.id === fichaId);
              if (ficha) setByFichaDirectFicha(ficha.id, ficha.programId);
            }}
            placeholder={t("attendance.selectFichaPlaceholder")}
            emptyText={t("attendance.noFichasInProgram")}
          />
        </View>
      )}

      {/* Estado inicial — sin programa */}
      {!Boolean(selectedProgramId) && !Boolean(selectedFichaId) && !directFichaOnly && (
        <View style={s.prompt}>
          <View
            style={[s.promptIcon, { backgroundColor: theme.primary + "15" }]}
          >
            <Ionicons name="albums-outline" size={32} color={theme.primary} />
          </View>
          <Text style={[s.promptText, { color: muted }]}>
            {t("attendance.rf6.selectProgramPrompt")}
          </Text>
        </View>
      )}

      {Boolean(selectedProgramId) && !Boolean(selectedFichaId) && loadingFichaCards && (
        <View style={s.emptyBox}>
          <Ionicons name="sync-outline" size={28} color={muted} />
          <Text style={[s.emptyText, { color: muted }]}>{t("common.loading")}</Text>
        </View>
      )}

      {/* Programa sin fichas */}
      {Boolean(selectedProgramId) && !Boolean(selectedFichaId) && !loadingFichaCards && fichaCards.length === 0 && (
        <View style={s.emptyBox}>
          <Ionicons name="document-outline" size={28} color={muted} />
          <Text style={[s.emptyText, { color: muted }]}>
            {t("attendance.noFichasInProgram")}
          </Text>
        </View>
      )}

      {/* ── Tarjetas de fichas ── */}
      {fichaCards.length > 0 && !Boolean(selectedFichaId) && !directFichaOnly && (
        <>
          <Text style={[s.sectionLabel, { color: text }]}>
            {t("attendance.rf6.fichasToday")}
          </Text>
          <View style={s.cardsGrid}>
            {fichaCards.map((card) => (
              <TouchableOpacity
                key={card.fichaId}
                activeOpacity={0.75}
                onPress={() => {
                  const today = todayBogota();
                  setByFichaFicha(card.fichaId);
                  setByFichaDateFrom(today);
                  setByFichaDateTo(today);
                }}
                style={[
                  s.fichaCard,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
                accessibilityRole="button"
              >
                <View
                  style={[
                    s.fichaCardHeader,
                    { backgroundColor: theme.primary + "18" },
                  ]}
                >
                  <Ionicons
                    name="people-outline"
                    size={18}
                    color={theme.primary}
                  />
                  <Text style={[s.fichaNumber, { color: theme.primary }]}>
                    {card.fichaNumber}
                  </Text>
                </View>
                <View style={s.fichaMetrics}>
                  <View style={s.fichaMetric}>
                    <View
                      style={[s.metricDot, { backgroundColor: Colors.error }]}
                    />
                    <Text style={[s.metricPct, { color: Colors.error }]}>
                      {card.absentPct}%
                    </Text>
                    <Text style={[s.metricLabel, { color: muted }]}>
                      {t("attendance.rf6.absent")}
                    </Text>
                  </View>
                  <View
                    style={[s.metricDivider, { backgroundColor: border }]}
                  />
                  <View style={s.fichaMetric}>
                    <View
                      style={[s.metricDot, { backgroundColor: Colors.warning }]}
                    />
                    <Text style={[s.metricPct, { color: Colors.warning }]}>
                      {card.latePct}%
                    </Text>
                    <Text style={[s.metricLabel, { color: muted }]}>
                      {t("attendance.rf6.late")}
                    </Text>
                  </View>
                </View>
                <Text style={[s.fichaTotal, { color: muted }]}>
                  {card.absentToday} {t("attendance.rf6.absentCount")} ·{" "}
                  {card.lateToday} {t("attendance.rf6.lateCount")} ·{" "}
                  {card.totalLearners} {t("attendance.rf6.total")}
                </Text>
                <View style={[s.fichaAction, { borderTopColor: border }]}>
                  <Text style={[s.fichaActionText, { color: theme.primary }]}>
                    {t("attendance.rf6.viewDetail")}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={theme.primary}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* ── Pantalla 2: Detalle de ficha ── */}
      {Boolean(selectedFichaId) && (
        <>
          {/* Breadcrumb */}
          <TouchableOpacity
            onPress={clearByFichaFicha}
            style={[
              s.backRow,
              { backgroundColor: cardBg, borderColor: border },
            ]}
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={16} color={theme.primary} />
            <Text style={[s.backProgram, { color: muted }]} numberOfLines={1}>
              {selectedProgram ? getProgramDisplayName(selectedProgram, t) : ""}
            </Text>
            <Ionicons name="chevron-forward" size={13} color={muted} />
            <Text style={[s.backFicha, { color: theme.primary }]}>
              {t("attendance.rf6.ficha")} {selectedFicha?.number}
            </Text>
          </TouchableOpacity>

          {Boolean(selectedFichaId) && (
            <View style={[s.responsibleRow, { backgroundColor: cardBg, borderColor: border }]}>
              <Ionicons name="person-circle-outline" size={18} color={theme.primary} />
              <Text style={[s.responsibleLabel, { color: muted }]}>
                {t("attendance.rf6.responsibleInstructor")}:
              </Text>
              <Text style={[s.responsibleName, { color: text }]} numberOfLines={2}>
                {responsibleInstructors.length
                  ? responsibleInstructors.map(instructor => `${instructor.name} ${instructor.lastname}`.trim()).join(", ")
                  : "—"}
              </Text>
            </View>
          )}

          {/* Selectores de fecha con DateField */}
          <View
            style={[s.card, { backgroundColor: cardBg, borderColor: border }]}
          >
            <Text style={[s.rangeLabel, { color: muted }]}>
              {t("attendance.rf6.selectRange")}
            </Text>
            <View style={s.rangeRow}>
              <View style={s.dateFieldWrap}>
                <DateField
                  label={t("reports.filters.dateFrom")}
                  value={dateFrom}
                  onChange={setByFichaDateFrom}
                  placeholder="YYYY-MM-DD"
                  containerStyle={s.noMargin}
                />
              </View>
              <View style={s.dateSepWrap}>
                <Text style={[s.dateSep, { color: muted }]}>→</Text>
              </View>
              <View style={s.dateFieldWrap}>
                <DateField
                  label={t("reports.filters.dateTo")}
                  value={dateTo}
                  onChange={setByFichaDateTo}
                  minDate={dateFrom || undefined}
                  placeholder="YYYY-MM-DD"
                  containerStyle={s.noMargin}
                />
              </View>
            </View>
            {Boolean(dateFrom) && Boolean(dateTo) && dateFrom > dateTo && (
              <Text style={[s.dateError, { color: Colors.error }]}>
                {t("reports.invalidDateRange")}
              </Text>
            )}
          </View>

          {/* ── Tabla ── */}
          {loadingMatrix && (
            <View style={s.emptyBox}>
              <Ionicons name="sync-outline" size={28} color={muted} />
              <Text style={[s.emptyText, { color: muted }]}>
                {t("common.loading")}
              </Text>
            </View>
          )}

          {matrixError && !loadingMatrix && (
            <View style={s.emptyBox}>
              <Ionicons name="alert-circle-outline" size={28} color={Colors.error} />
              <Text style={[s.emptyText, { color: Colors.error }]}>
                {matrixError}
              </Text>
            </View>
          )}

          <AttendanceLearnerGrid model={model} />
          {tableRows.length > 0 && dates.length > 0 && (
            <Text style={[s.tableHint, { color: muted }]}>
              {t("attendance.rf6.tableHint")}
            </Text>
          )}
          {tableRows.length > 0 && dates.length > 0 && (
            <>
              <View style={s.legend}>
                {[
                  { color: Colors.error, label: t("attendance.statuses.absent") },
                  { color: Colors.warning, label: t("attendance.statuses.late") },
                  { color: Colors.success, label: t("attendance.statuses.punctual") },
                ].map((item) => (
                  <View key={item.label} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: item.color }]} />
                    <Text style={[s.legendText, { color: muted }]}>{item.label}</Text>
                  </View>
                ))}
              </View>
              <View style={s.exportRow}>
                <AppButton
                  title={exporting ? t("common.loading") : t("attendance.rf6.exportExcel")}
                  onPress={() => handleExport("excel")}
                  disabled={exporting}
                  fullWidth={false}
                  style={s.exportBtn}
                />
                <AppButton
                  title={exporting ? t("common.loading") : t("attendance.rf6.exportCsv")}
                  onPress={() => handleExport("csv")}
                  disabled={exporting}
                  variant="outline"
                  fullWidth={false}
                  style={s.exportBtn}
                />
              </View>
            </>
          )}


          {(!Boolean(dateFrom) || !Boolean(dateTo)) && (
            <View style={s.emptyBox}>
              <Ionicons name="calendar-outline" size={28} color={muted} />
              <Text style={[s.emptyText, { color: muted }]}>
                {t("attendance.rf6.selectRangePrompt")}
              </Text>
            </View>
          )}

          {Boolean(dateFrom) &&
            Boolean(dateTo) &&
            dateFrom <= dateTo &&
            !loadingMatrix &&
            !matrixError &&
            tableRows.length === 0 && (
              <View style={s.emptyBox}>
                <Ionicons
                  name="document-text-outline"
                  size={28}
                  color={muted}
                />
                <Text style={[s.emptyText, { color: muted }]}>
                  {t("attendance.rf6.noRecordsRange")}
                </Text>
              </View>
            )}
        </>
      )}

      {/* ── Modal detalle de celda ── */}
      <AttendanceCellDetailDialog model={model} />
      </View>
    </ScrollView>
  );
}
