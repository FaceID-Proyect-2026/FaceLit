import { FontSize, FontWeight } from '@/shared/constants/typography';
import { Platform, StyleSheet } from 'react-native';

export const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: 20, paddingBottom: 56 },

  // Header
  topBar:         { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn:        { padding: 4 },
  pageTitle:      { fontSize: FontSize.xl,  fontWeight: FontWeight.black },
  pageSubtitle:   { fontSize: FontSize.xs,  marginTop: 2 },
  templatePill:   { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  templatePillText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  // Error alert
  alertBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  alertText: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, lineHeight: 18 },

  // Drop zone
  dropZone: {
    borderRadius: 20, borderWidth: 2, borderStyle: 'dashed',
    marginBottom: 14, overflow: 'hidden',
  },
  dropInner:      { alignItems: 'center', justifyContent: 'center', paddingVertical: 44, paddingHorizontal: 24, gap: 10 },
  dropIconCircle: { width: 68, height: 68, borderRadius: 34, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  dropMain:       { fontSize: FontSize.base, fontWeight: FontWeight.bold, textAlign: 'center', lineHeight: 22 },
  dropSub:        { fontSize: FontSize.xs, textAlign: 'center' },

  // Guide
  guideCard:      { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14 },
  guideToggle:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  guideToggleText:{ fontSize: FontSize.base, fontWeight: FontWeight.bold, flex: 1 },
  guideBody:      { marginTop: 14 },
  fileSizeNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 16 },
  fileSizeNoticeText: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, lineHeight: 18 },
  guideSection:   { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  colRow:         { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, gap: 12 },
  colLeft:        { width: 130, gap: 4 },
  colName:        { fontSize: FontSize.sm, fontWeight: FontWeight.bold, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined },
  whenBadge:      { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start' },
  whenText:       { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  colWhat:        { flex: 1, fontSize: FontSize.sm, lineHeight: 18 },
  tipRow:         { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 6 },
  tipText:        { flex: 1, fontSize: FontSize.sm, lineHeight: 18 },
  csvExample:     { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 11, lineHeight: 17, padding: 10, borderWidth: 1, borderRadius: 8, marginTop: 8, overflow: 'hidden' },
  templateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginTop: 12, alignSelf: 'flex-start' },
  templateButtonText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  // Stats
  statsRow:  { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard:  { flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 12, alignItems: 'center', gap: 4 },
  statNum:   { fontSize: FontSize['2xl'], fontWeight: FontWeight.black },
  statLbl:   { fontSize: FontSize.xs, textAlign: 'center', lineHeight: 15 },
  resultToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 10 },
  fileChip:  { fontSize: FontSize.xs, marginBottom: 10 },

  // Result rows
  resultHeader: { fontSize: FontSize.base, fontWeight: FontWeight.black, marginBottom: 10 },
  resultRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 10, borderBottomWidth: 1 },
  resultId:     { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  resultMsg:    { fontSize: FontSize.xs, lineHeight: 17, marginTop: 2 },
  credentialsHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  downloadBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  passwordRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  passwordIdentity: { flex: 1, minWidth: 0 },
  passwordDocument: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  passwordMeta: { fontSize: FontSize.xs, lineHeight: 16, marginTop: 2 },
  passwordValue: { fontSize: FontSize.sm, fontWeight: FontWeight.black },
  fixBtn:       { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, flexShrink: 0 },
  fixBtnText:   { fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  // Reload
  reloadBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, alignSelf: 'center', marginTop: 16 },
  reloadText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
