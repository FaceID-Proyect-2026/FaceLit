import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { StyleSheet } from 'react-native';

export const fds = StyleSheet.create({
  safe: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  transferModal: { width: '100%', maxWidth: 520, maxHeight: '80%', borderRadius: 22, borderWidth: 1, padding: 22 },
  transferModalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  transferModalIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  transferModalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  transferModalSubtitle: { fontSize: FontSize.sm, marginTop: 3 },
  transferModalLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: 10 },
  transferOptions: { maxHeight: 300 },
  transferOption: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 13, padding: 14, marginBottom: 9 },
  transferOptionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  transferOptionMeta: { fontSize: FontSize.xs, marginTop: 2 },
  transferEmpty: { textAlign: 'center', paddingVertical: 24, lineHeight: 20 },
  transferModalActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  transferModalButton: { flex: 1, minWidth: 130, borderWidth: 1, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 8, alignItems: 'center' },
  transferModalButtonText: { fontWeight: '700', textAlign: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },

  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4 },
  fichaTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 8 },
  fichaSubtitle: { fontSize: FontSize.sm, marginBottom: 12, lineHeight: 19 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  infoLabel: { fontSize: FontSize.md },
  infoValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold },

  headerActions: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },

  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, marginBottom: 10 },

  learnerCard: { borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4 },
  learnerName: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  learnerMeta: { fontSize: FontSize.sm, marginTop: 2 },
  iconBtn: { width: 34, height: 34, borderRadius: 9, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center' },

  // ── Buscador de aprendices ──
  searchBar:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 42, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: FontSize.sm, outlineStyle: 'none' } as any,

  empty: { alignItems: 'center', paddingVertical: 40 },

  // RF-3.3 — Código de traslado
  transferCard:     { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 },
  transferHeader:   { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
  transferTitle:    { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  transferHint:     { fontSize: FontSize.sm, lineHeight: 18, marginBottom: 10 },
  transferCodeRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  transferCodeText: { fontSize: 22, fontWeight: FontWeight.black, letterSpacing: 3, flex: 1 },
  copyBtn:          { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 },
  copyMsg:          { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  regenBtn:         { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start' },
  regenText:        { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});

export const elm = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  sheet:   { width: '100%', maxWidth: 420, borderRadius: 20, padding: 22, gap: 0 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  modalTitle:  { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  label:       { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: 6 },
  input:       { height: 46, borderWidth: 1.2, borderRadius: 11, paddingHorizontal: 13, fontSize: FontSize.base, outlineStyle: 'none' } as any,
  errorText:   { color: Colors.error, fontSize: FontSize.xs, marginBottom: 8 },
  footer:      { flexDirection: 'row', gap: 10, marginTop: 18 },
  btn:         { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
});
