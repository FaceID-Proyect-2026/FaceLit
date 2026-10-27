import { Colors } from "@/shared/constants/colors";
import { FontSize, FontWeight } from "@/shared/constants/typography";
import { StyleSheet } from "react-native";

export const CELL_ABSENT = Colors.error + "30";

export const CELL_LATE = Colors.warning + "30";

export const BORDER_ABSENT = Colors.error + "80";

export const BORDER_LATE = Colors.warning + "80";

export const s = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, paddingBottom: 48, gap: 12 },
  contentInner: { gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  noMargin: { marginBottom: 0 },
  guideCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  guideIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  guideCopy: { flex: 1, gap: 4 },
  guideTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black },
  guideText: { fontSize: FontSize.sm, lineHeight: 20 },

  prompt: { alignItems: "center", paddingVertical: 60, gap: 12 },
  promptIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  promptText: { fontSize: FontSize.sm, textAlign: "center", lineHeight: 20 },

  emptyBox: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: FontSize.sm, textAlign: "center" },

  sectionLabel: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },

  cardsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  fichaCard: {
    flexBasis: 230,
    flexGrow: 1,
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  fichaCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  fichaNumber: { fontSize: FontSize.base, fontWeight: FontWeight.black },
  fichaMetrics: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fichaMetric: { flex: 1, alignItems: "center", gap: 3 },
  metricDot: { width: 8, height: 8, borderRadius: 4 },
  metricPct: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  metricLabel: { fontSize: FontSize.xs, textAlign: "center" },
  metricDivider: { width: 1, height: 40, marginHorizontal: 8 },
  fichaTotal: {
    fontSize: FontSize.xs,
    textAlign: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  fichaAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderTopWidth: 1,
    padding: 10,
  },
  fichaActionText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  backProgram: { fontSize: FontSize.xs, flex: 1 },
  backFicha: { fontSize: FontSize.sm, fontWeight: FontWeight.black },

  responsibleRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 7, borderWidth: 1, borderRadius: 12, padding: 11 },
  responsibleLabel: { fontSize: FontSize.sm },
  responsibleName: { flexShrink: 1, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  rangeLabel: { fontSize: FontSize.sm, marginBottom: 10 },
  rangeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    flexWrap: "wrap",
  },
  dateFieldWrap: { flex: 1, minWidth: 150 },
  dateSepWrap: { paddingTop: 34, alignItems: "center" },
  dateSep: { fontSize: FontSize.lg },
  dateError: { fontSize: FontSize.xs, marginTop: 4 },

  tableScroll: { marginHorizontal: -16 },
  tableShell: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 4,
    maxHeight: 560,
  },
  tableHeaderPinned: {
    flexDirection: "row",
    flexShrink: 0,
    zIndex: 3,
  },
  tableBodyScroll: {
    maxHeight: 496,
  },
  tableBodyRow: {
    flexDirection: "row",
  },
  fixedLearners: {
    width: 190,
    zIndex: 2,
  },
  fixedDates: {
    width: 140,
    zIndex: 2,
  },
  dateGridScroll: { flex: 1 },
  learnerGridScroll: { flex: 1 },
  tableHint: { fontSize: FontSize.xs, lineHeight: 18, marginTop: -2 },
  tableHeaderRow: { flexDirection: "row" },
  tableRow: { flexDirection: "row" },
  thCell: {
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    padding: 8,
  },
  thText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.black,
    textAlign: "center",
  },
  transposedHeaderCell: { height: 76, justifyContent: "center", alignItems: "center", borderWidth: 0.5, padding: 8 },
  dateRowLabel: { width: 140, height: 60, borderWidth: 0.5, paddingHorizontal: 10, justifyContent: "center" },
  learnerHeaderCell: { width: 180 },
  learnerAttendanceCell: { width: 180, height: 60, borderWidth: 0.5, alignItems: "center", justifyContent: "center" },
  cellName: {
    width: 190,
    height: 64,
    borderWidth: 0.5,
    padding: 8,
    justifyContent: "center",
  },
  cellNameText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  cellDocText: { fontSize: 10 },
  cellDay: {
    width: 52,
    height: 64,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  excuseMark: { fontSize: FontSize.base, fontWeight: FontWeight.black },
  punctualDot: { width: 8, height: 8, borderRadius: 4 },
  cellEmpty: { fontSize: FontSize.xs },

  legend: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: FontSize.xs },

  exportRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  exportBtn: { flexGrow: 1, minWidth: 140 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  detailBox: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  detailBanner: {
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  detailExcuseMark: { fontSize: 34, fontWeight: FontWeight.black, lineHeight: 36 },
  detailStatus: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  detailLabel: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  detailLabelText: { fontSize: FontSize.sm },
  detailValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    flex: 1,
    textAlign: "right",
  },
  excusePanel: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12, gap: 10 },
  excuseHeader: { flexDirection: "row", alignItems: "center" },
  excuseActions: { flexDirection: "row", gap: 8 },
  excuseOption: {
    flex: 1,
    minHeight: 38,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  excuseOptionText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  excuseFeedback: { fontSize: FontSize.xs, textAlign: "center" },
});
