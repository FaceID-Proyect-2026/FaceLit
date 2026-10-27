import { Colors } from "@/shared/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { AttendanceByFichaModel } from '@/features/attendance/hooks/useAttendanceByFicha';
import {
  s,
  CELL_ABSENT,
  CELL_LATE,
  BORDER_ABSENT,
  BORDER_LATE,
} from '@/features/attendance/components/attendanceByFichaStyles';

export function AttendanceLearnerGrid({ model }: { model: Pick<AttendanceByFichaModel,
    | "theme"
    | "t"
    | "setCellDetail"
    | "loadingMatrix"
    | "matrixError"
    | "setExcuseError"
    | "learnerHeaderRef"
    | "learnerGridRef"
    | "text"
    | "muted"
    | "cardBg"
    | "border"
    | "tableRows"
    | "dates"
    | "fmtDateLong"
    | "handleLearnerGridScroll"
    | "learnerGridWheelProps"
  > }) {
  const {
    theme,
    t,
    setCellDetail,
    loadingMatrix,
    matrixError,
    setExcuseError,
    learnerHeaderRef,
    learnerGridRef,
    text,
    muted,
    cardBg,
    border,
    tableRows,
    dates,
    fmtDateLong,
    handleLearnerGridScroll,
    learnerGridWheelProps,
  } = model;
  return (<>{!loadingMatrix && !matrixError && tableRows.length > 0 && dates.length > 0 && (
            <View style={[s.tableShell, { borderColor: border, backgroundColor: cardBg }]}>
              <View style={s.tableHeaderPinned}>
                <View style={[s.dateRowLabel, s.transposedHeaderCell, { backgroundColor: theme.primary + "20", borderColor: border }]}>
                  <Text style={[s.thText, { color: theme.primary }]}>{t("reports.table.date")}</Text>
                </View>
                <ScrollView
                  ref={learnerHeaderRef}
                  horizontal
                  scrollEnabled={false}
                  showsHorizontalScrollIndicator={false}
                  style={s.learnerGridScroll}
                >
                  <View style={s.tableHeaderRow}>
                    {tableRows.map((row) => (
                      <View key={row.learnerId} style={[s.learnerHeaderCell, s.transposedHeaderCell, { backgroundColor: theme.primary + "20", borderColor: border }]}>
                        <Text style={[s.thText, { color: theme.primary }]} numberOfLines={2}>{row.learnerName}</Text>
                        <Text style={[s.cellDocText, { color: muted }]} numberOfLines={1}>{row.learnerDocument}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
              <ScrollView style={s.tableBodyScroll} nestedScrollEnabled showsVerticalScrollIndicator>
                <View style={s.tableBodyRow}>
                  <View style={s.fixedDates}>
                    {dates.map((date, dateIdx) => (
                      <View
                        key={date}
                        style={[
                          s.dateRowLabel,
                          {
                            borderColor: border,
                            backgroundColor: dateIdx % 2 === 0 ? cardBg : theme.primary + "08",
                          },
                        ]}
                      >
                        <Text style={[s.cellNameText, { color: text }]}>{fmtDateLong(date)}</Text>
                      </View>
                    ))}
                  </View>
                  <ScrollView
                    ref={learnerGridRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={s.learnerGridScroll}
                    onScroll={handleLearnerGridScroll}
                    scrollEventThrottle={16}
                    {...learnerGridWheelProps}
                  >
                    <View>
                      {dates.map((date, dateIdx) => (
                        <View key={date} style={[s.tableRow, { backgroundColor: dateIdx % 2 === 0 ? cardBg : theme.primary + "08" }]}>
                          {tableRows.map((row) => {
                            const cell = row.days[dateIdx];
                            if (!cell) return null;
                            const isAbsent = cell.status === "absent";
                            const isLate = cell.status === "late";
                            const isClickable = isAbsent || isLate;
                            return (
                              <TouchableOpacity
                                key={row.learnerId}
                                disabled={!isClickable}
                                onPress={() => {
                                  if (!isClickable) return;
                                  setExcuseError(null);
                                  setCellDetail({ cell, learnerName: row.learnerName });
                                }}
                                style={[
                                  s.learnerAttendanceCell,
                                  { borderColor: border },
                                  isAbsent && { backgroundColor: CELL_ABSENT, borderColor: BORDER_ABSENT },
                                  isLate && { backgroundColor: CELL_LATE, borderColor: BORDER_LATE },
                                ]}
                                accessibilityRole={isClickable ? "button" : "none"}
                              >
                                {isAbsent && cell.excuse === true && (
                                  <Text style={[s.excuseMark, { color: Colors.error }]}>E</Text>
                                )}
                                {isAbsent && cell.excuse !== true && <Ionicons name="close-circle" size={16} color={Colors.error} />}
                                {isLate && <Ionicons name="time" size={16} color={Colors.warning} />}
                                {cell.status === "punctual" && <View style={[s.punctualDot, { backgroundColor: Colors.success + "60" }]} />}
                                {!cell.status && <Text style={[s.cellEmpty, { color: muted }]}>-</Text>}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </ScrollView>
            </View>
          )}</>);
}
