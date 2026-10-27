import AppButton from "@/shared/components/ui/AppButton";
import { Colors } from "@/shared/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import type { AttendanceByFichaModel } from '@/features/attendance/hooks/useAttendanceByFicha';
import { s } from '@/features/attendance/components/attendanceByFichaStyles';

export function AttendanceCellDetailDialog({ model }: { model: Pick<AttendanceByFichaModel,
    | "theme"
    | "t"
    | "cellDetail"
    | "setCellDetail"
    | "excuseError"
    | "setExcuseError"
    | "savingExcuse"
    | "text"
    | "muted"
    | "cardBg"
    | "border"
    | "fmtDateLong"
    | "fmtTime"
    | "canEditExcuse"
    | "handleUpdateExcuse"
  > }) {
  const {
    theme,
    t,
    cellDetail,
    setCellDetail,
    excuseError,
    setExcuseError,
    savingExcuse,
    text,
    muted,
    cardBg,
    border,
    fmtDateLong,
    fmtTime,
    canEditExcuse,
    handleUpdateExcuse,
  } = model;
  return (<Modal visible={!!cellDetail} transparent animationType="slide">
        <Pressable
          style={s.modalOverlay}
          onPress={() => {
            setCellDetail(null);
            setExcuseError(null);
          }}
        >
          <Pressable
            style={[
              s.detailBox,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            {cellDetail && (
              <>
                <View
                  style={[
                    s.detailBanner,
                    {
                      backgroundColor:
                        (cellDetail.cell.status === "absent"
                          ? Colors.error
                          : Colors.warning) + "15",
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      cellDetail.cell.status === "absent"
                        ? "close-circle"
                        : "time"
                    }
                    size={36}
                    color={
                      cellDetail.cell.status === "absent"
                        ? Colors.error
                        : Colors.warning
                    }
                  />
                  {cellDetail.cell.status === "absent" && cellDetail.cell.excuse === true && (
                    <Text style={[s.detailExcuseMark, { color: Colors.error }]}>E</Text>
                  )}
                  <Text
                    style={[
                      s.detailStatus,
                      {
                        color:
                          cellDetail.cell.status === "absent"
                            ? Colors.error
                            : Colors.warning,
                      },
                    ]}
                  >
                    {cellDetail.cell.status === "absent"
                      ? t("attendance.statuses.absent")
                      : t("attendance.statuses.late")}
                  </Text>
                </View>
                {(
                  [
                    [
                      "person-outline",
                      t("attendance.rf6.learner"),
                      cellDetail.learnerName,
                    ],
                    [
                      "calendar-outline",
                      t("attendance.fields.date"),
                      fmtDateLong(cellDetail.cell.date),
                    ],
                    [
                      "log-in-outline",
                      t("attendance.fields.entryTime"),
                      fmtTime(cellDetail.cell.entryTime),
                    ],
                    ...(cellDetail.cell.delayMinutes > 0
                      ? [
                          [
                            "timer-outline",
                            t("attendance.fields.delay"),
                            `${cellDetail.cell.delayMinutes} min`,
                          ],
                        ]
                      : []),
                    [
                      "business-outline",
                      t("attendance.fields.environment"),
                      cellDetail.cell.environmentName || "—",
                    ],
                    [
                      "person-circle-outline",
                      t("attendance.fields.instructor"),
                      cellDetail.cell.instructorName || "—",
                    ],
                  ] as [string, string, string][]
                ).map(([icon, label, value]) => (
                  <View
                    key={label}
                    style={[s.detailRow, { borderBottomColor: border }]}
                  >
                    <View style={s.detailLabel}>
                      <Ionicons name={icon as any} size={15} color={muted} />
                      <Text style={[s.detailLabelText, { color: muted }]}>
                        {label}
                      </Text>
                    </View>
                    <Text style={[s.detailValue, { color: text }]}>
                      {value}
                    </Text>
                  </View>
                ))}
                {cellDetail.cell.status === "absent" && (
                  <View style={[s.excusePanel, { borderColor: border, backgroundColor: theme.primary + "08" }]}>
                    <View style={s.excuseHeader}>
                      <View style={s.detailLabel}>
                        <Ionicons name="document-text-outline" size={15} color={muted} />
                        <Text style={[s.detailLabelText, { color: muted }]}>Excusa</Text>
                      </View>
                      <Text style={[s.detailValue, { color: text }]}>
                        {cellDetail.cell.excuse === null || cellDetail.cell.excuse === undefined
                          ? "-"
                          : cellDetail.cell.excuse
                            ? "Sí"
                            : "No"}
                      </Text>
                    </View>
                    {canEditExcuse && (
                      <View style={s.excuseActions}>
                        <TouchableOpacity
                          activeOpacity={0.75}
                          disabled={savingExcuse}
                          onPress={() => handleUpdateExcuse(true)}
                          style={[
                            s.excuseOption,
                            {
                              borderColor: cellDetail.cell.excuse === true ? Colors.error : border,
                              backgroundColor: cellDetail.cell.excuse === true ? Colors.error + "15" : cardBg,
                            },
                          ]}
                        >
                          <Text style={[s.excuseOptionText, { color: cellDetail.cell.excuse === true ? Colors.error : text }]}>Sí</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          activeOpacity={0.75}
                          disabled={savingExcuse}
                          onPress={() => handleUpdateExcuse(false)}
                          style={[
                            s.excuseOption,
                            {
                              borderColor: cellDetail.cell.excuse === false ? Colors.error : border,
                              backgroundColor: cellDetail.cell.excuse === false ? Colors.error + "15" : cardBg,
                            },
                          ]}
                        >
                          <Text style={[s.excuseOptionText, { color: cellDetail.cell.excuse === false ? Colors.error : text }]}>No</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {savingExcuse && <Text style={[s.excuseFeedback, { color: muted }]}>Guardando...</Text>}
                    {excuseError && <Text style={[s.excuseFeedback, { color: Colors.error }]}>{excuseError}</Text>}
                  </View>
                )}
                <AppButton
                  title={t("common.close")}
                  onPress={() => {
                    setCellDetail(null);
                    setExcuseError(null);
                  }}
                  variant="outline"
                  style={{ marginTop: 14 }}
                />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>);
}
