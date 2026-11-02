import { FontSize, FontWeight } from '@/shared/constants/typography';
import { StyleSheet } from 'react-native';

export const notificationStyles = StyleSheet.create({
  // flex:1 + minHeight:0 es necesario en web para que el hijo con overflow
  // (la lista) pueda scrollear DENTRO del espacio restante, en vez de que
  // el contenido empuje/encoja a los hermanos de arriba (los filtros).
  root:   { flex: 1, minHeight: 0 },
  lightShadow: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  cardLightShadow: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 4,
  },

  header: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 22, borderBottomWidth: 1 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  title:  { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  badge:  { borderRadius: 10, minWidth: 20, height: 20, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  // ── Fix: altura fija que NUNCA se encoge (flexShrink:0), sin importar
  // cuánto contenido tenga la lista de abajo ──
  filterScroll: { flexShrink: 0, borderBottomWidth: 1, flexGrow: 0, height: 64, marginTop: 18, marginBottom: 2 },
  filterRow:    { flexDirection: 'row', gap: 14, paddingHorizontal: 16, alignItems: 'center' },
  filterBtn:    { borderRadius: 22, borderWidth: 1.5, paddingHorizontal: 18, paddingVertical: 10, minWidth: 90, alignItems: 'center', justifyContent: 'center', outlineStyle: 'none' } as any,

  // ── Fix: misma idea — altura fija, nunca se encoge ──
  catScroll: { flexShrink: 0, borderBottomWidth: 1, flexGrow: 0, height: 66, marginTop: 14, marginBottom: 4 },
  catRow:    { flexDirection: 'row', gap: 12, paddingHorizontal: 16, alignItems: 'center' },
  catBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, borderWidth: 1.2, paddingHorizontal: 16, paddingVertical: 10, minWidth: 82, justifyContent: 'center', outlineStyle: 'none' } as any,

  // ── La lista es la única sección "elástica": toma el resto del
  // espacio disponible y scrollea internamente (nunca empuja al resto) ──
  listWrap: { flex: 1, minHeight: 0 },
  list:   { padding: 16, paddingTop: 24, gap: 12, paddingBottom: 40 },

  card:   { flexDirection: 'row', borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  stripe: { width: 4 },
  cardBody: { flex: 1, padding: 12 },
  cardHead: { flexDirection: 'row', gap: 10 },

  iconCircle: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 2 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: FontSize.base, flex: 1 },
  badges:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  emailBadge:  { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  pendingBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  pendingText:  { fontSize: 10, fontWeight: '700' },
  unreadDot:   { width: 8, height: 8, borderRadius: 4 },

  cardMsg:    { fontSize: FontSize.sm, marginTop: 3 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  cardDate:   { fontSize: 11, flex: 1 },
  catChip:    { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 8, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, maxWidth: 120 },
  catChipText: { fontSize: 10, fontWeight: '700', flexShrink: 1 },

  // Detalle expandido
  detail:     { marginTop: 10, paddingTop: 10, gap: 2 },
  detailRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 0.5 },
  detailLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, minWidth: 0 },
  detailLabelText: { fontSize: FontSize.xs, flexShrink: 1 },
  detailValue: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, flex: 1, minWidth: 0, textAlign: 'right' },

  actionLink:     { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, borderWidth: 1, padding: 10, marginTop: 8 },
  actionLinkText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  facialActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  facialBtn:     { flex: 1 },

  empty:     { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: FontSize.base, textAlign: 'center' },
});
