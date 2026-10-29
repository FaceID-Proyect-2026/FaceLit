import { Colors } from '@/shared/constants/colors';
import { StyleSheet } from 'react-native';

export const sm = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.70)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  card:       { width: '100%', maxWidth: 420, borderRadius: 26, paddingHorizontal: 26, paddingVertical: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 12 },
  iconWrap:   { marginBottom: 16 },
  icon:       { width: 84, height: 84 },
  title:      { fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  subtitle:   { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 4 },
  log:        { width: '100%', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 20 },
  logTitle:   { fontSize: 12, fontWeight: '800', color: '#65B361', marginBottom: 10 },
  logRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 5 },
  logItem:    { flex: 1, fontSize: 12, lineHeight: 18 },
  btn:        { width: '85%', borderRadius: 14, overflow: 'hidden' },
  btnGradient:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
  btnText:    { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

export const ai = StyleSheet.create({
  row:   { height: 52, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, fontSize: 15, outlineStyle: 'none' } as any,
});

export const s = StyleSheet.create({
  gradient:  { flex: 1 },
  safe:      { flex: 1 },
  arcTop:    { position: 'absolute', width: 300, height: 420, right: -120, top: -90,    borderRadius: 200 },
  arcBottom: { position: 'absolute', width: 420, height: 220, left:  -120, bottom: -30, borderRadius: 180 },
  scroll:    { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 32 },

  card: {
    width: '100%', maxWidth: 680,
    borderRadius: 28, paddingHorizontal: 36, paddingVertical: 34,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16, shadowRadius: 18, elevation: 8,
  },

  // ── Volver ──
  backRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  backIconWrap: { width: 38, height: 38, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  backText:     { fontSize: 16, fontWeight: '800' },

  // ── Ícono ──
  iconWrap:   { alignItems: 'center', marginBottom: 18, position: 'relative' },
  iconCircle: { width: 84, height: 84, borderRadius: 42, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  iconHalo:   { position: 'absolute', bottom: -6, width: 60, height: 12, borderRadius: 30 },
  icon:       { width: 46, height: 46 },

  // ── Título ──
  title:    { fontSize: 27, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },

  // ── Requisitos ──
  reqBox:   { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 18 },
  reqTitle: { fontSize: 11, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
  reqGrid:  { gap: 6 },
  reqRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  reqText:  { fontSize: 13 },

  // ── Error token ──
  tokenError:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },
  tokenErrorText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },

  // ── Campos ──
  fieldGroup: { marginBottom: 16 },
  label:      { fontSize: 14, fontWeight: '700', marginBottom: 7 },
  errorText:  { color: Colors.error, fontSize: 12, fontWeight: '700', marginTop: 5 },

  // ── Botón ──
  submitBtn:         { marginTop: 8 },
  submitBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 16 },
  submitBtnText:     { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
