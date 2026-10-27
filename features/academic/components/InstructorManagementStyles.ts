import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { StyleSheet } from 'react-native';

export const fm = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  sheet:        { width: '100%', maxWidth: 520, borderRadius: 22, padding: 22, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title:        { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  field:        { marginBottom: 14 },
  label:        { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: 5 },
  input:        { height: 46, borderWidth: 1.2, borderRadius: 12, paddingHorizontal: 12, fontSize: FontSize.base, outlineStyle: 'none' } as any,
  typeRow:      { flexDirection: 'row', gap: 10 },
  typeBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1.5, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14 },
  programSearch:{ height: 42, borderWidth: 1.2, borderRadius: 11, paddingHorizontal: 12, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  programSearchInput: { flex: 1, fontSize: FontSize.sm, outlineStyle: 'none' } as any,
  programOption:{ flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1.2, borderRadius: 11, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 7 },
  error:        { color: Colors.error, fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: 10 },
  saveBtn:      { borderRadius: 14, overflow: 'hidden', marginTop: 4, marginBottom: 12 },
  saveBtnGrad:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  // Pantalla de contraseña generada
  pwdBox:       { alignItems: 'center', paddingVertical: 12 },
  pwdTitle:     { fontSize: FontSize.xl, fontWeight: FontWeight.black, marginBottom: 8 },
  pwdSub:       { fontSize: FontSize.sm, lineHeight: 20, textAlign: 'center', marginBottom: 18, paddingHorizontal: 8 },
  pwdCard:      { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 16, marginBottom: 12 },
  pwdValue:     { fontSize: 24, fontWeight: FontWeight.black, letterSpacing: 2, textAlign: 'center' },
  pwdHint:      { fontSize: FontSize.sm, marginBottom: 20 },
  pwdBtn:       { borderRadius: 14, paddingHorizontal: 32, paddingVertical: 13 },
});

export const s = StyleSheet.create({
  safe:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn:     { padding: 4 },
  title:       { fontSize: FontSize.xl,  fontWeight: FontWeight.black },
  subtitle:    { fontSize: FontSize.xs,  marginTop: 2 },
  subtitleEmphasis: { fontSize: FontSize.sm, lineHeight: 20, fontWeight: FontWeight.semibold },
  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  addBtnText:  { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.sm },

  filters:     { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, gap: 10 },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontSize: FontSize.base, outlineStyle: 'none' } as any,
  typeFilters: { flexDirection: 'row', gap: 8 },
  typeChip:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1.2 },
  typeChipText:{ fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, borderRadius: 10, borderWidth: 1, padding: 10 },
  errorText:   { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  list:        { padding: 16, gap: 12, paddingBottom: 40 },
  card:        { borderRadius: 16, borderWidth: 1, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  avatar:      { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardName:    { fontSize: FontSize.base, fontWeight: FontWeight.black },
  cardDoc:     { fontSize: FontSize.xs },
  cardEmail:   { fontSize: FontSize.xs },
  typeBadge:   { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  typeBadgeText:{ fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  progRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 10 },
  progText:    { flex: 1, fontSize: FontSize.xs, lineHeight: 17 },

  actions:     { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.2, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 7 },
  actionBtnText:{ fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  empty:       { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:   { fontSize: FontSize.base, textAlign: 'center' },
});
