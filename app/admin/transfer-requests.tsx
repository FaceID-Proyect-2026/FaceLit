// ─────────────────────────────────────────────
//  app/admin/transfer-requests.tsx
//  RF-3.3 V4 — Revisión de solicitudes de traslado
//
//  El Coordinador ve las solicitudes pendientes de los aprendices
//  y las aprueba (el aprendiz pasa a la ficha destino) o rechaza
//  (el aprendiz permanece en su ficha actual).
// ─────────────────────────────────────────────
import { useTransferRequests } from '@/features/academic/useTransferRequests';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { TransferRequest } from '@/features/academic/types';

// ── Tipos de filtro ───────────────────────────
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

// ── Badge de estado ───────────────────────────
function StatusBadge({ status }: { status: TransferRequest['status'] }) {
  const color =
    status === 'approved' ? Colors.success :
    status === 'rejected' ? Colors.error :
    Colors.warning;
  const icon =
    status === 'approved' ? 'checkmark-circle-outline' :
    status === 'rejected' ? 'close-circle-outline' :
    'time-outline';
  const label =
    status === 'approved' ? 'Aprobada' :
    status === 'rejected' ? 'Rechazada' :
    'Pendiente';

  return (
    <View style={[bds.wrap, { backgroundColor: color + '18', borderColor: color + '40' }]}>
      <Ionicons name={icon as any} size={13} color={color} />
      <Text style={[bds.text, { color }]}>{label}</Text>
    </View>
  );
}
const bds = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  text: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
});

// ── Modal de rechazo (motivo) ─────────────────
function RejectModal({
  visible, onConfirm, onCancel, isDark, theme,
}: {
  visible: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isDark: boolean;
  theme: any;
}) {
  const [reason, setReason] = useState('');
  const text    = isDark ? Colors.dark.text      : Colors.light.text;
  const muted   = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg  = isDark ? Colors.dark.surface   : Colors.white;
  const border  = isDark ? Colors.dark.border    : Colors.light.border;

  if (!visible) return null;

  return (
    <View style={rm.overlay}>
      <View style={[rm.card, { backgroundColor: cardBg, borderColor: border }]}>
        <Text style={[rm.title, { color: text }]}>Rechazar solicitud</Text>
        <Text style={[rm.sub, { color: muted }]}>
          Indica el motivo del rechazo (el aprendiz podrá verlo).
        </Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Motivo del rechazo…"
          placeholderTextColor={muted}
          multiline
          style={[rm.input, { color: text, borderColor: border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFA' } as any]}
        />
        <View style={rm.actions}>
          <TouchableOpacity onPress={onCancel} style={[rm.btn, { borderColor: border }]} activeOpacity={0.8}>
            <Text style={{ color: muted, fontWeight: FontWeight.bold }}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { onConfirm(reason.trim()); setReason(''); }}
            style={[rm.btn, rm.destructBtn]}
            activeOpacity={0.8}
          >
            <Text style={{ color: Colors.white, fontWeight: FontWeight.bold }}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
const rm = StyleSheet.create({
  overlay:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 50, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card:        { width: '100%', maxWidth: 440, borderRadius: 18, borderWidth: 1, padding: 24, gap: 12 },
  title:       { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  sub:         { fontSize: FontSize.sm, lineHeight: 19 },
  input:       { minHeight: 88, borderWidth: 1.2, borderRadius: 12, padding: 12, fontSize: FontSize.base, textAlignVertical: 'top' },
  actions:     { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn:         { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 12, alignItems: 'center' },
  destructBtn: { backgroundColor: Colors.error, borderColor: Colors.error },
});

// ── Tarjeta de solicitud ──────────────────────
function RequestCard({
  item, onApprove, onReject, text, muted, cardBg, border, theme,
}: {
  item: TransferRequest;
  onApprove: () => void;
  onReject: () => void;
  text: string; muted: string; cardBg: string; border: string; theme: any;
}) {
  return (
    <View style={[rc.card, { backgroundColor: cardBg, borderColor: border }]}>
      {/* Header: nombre + badge */}
      <View style={rc.header}>
        <View style={[rc.avatar, { backgroundColor: theme.primary + '20' }]}>
          <Ionicons name="person-outline" size={20} color={theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[rc.name, { color: text }]}>{item.learnerName}</Text>
          <Text style={[rc.doc,  { color: muted }]}>Doc: {item.learnerDocument}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      {/* Datos del traslado */}
      <View style={[rc.transferRow, { backgroundColor: theme.primary + '08', borderColor: theme.primary + '20' }]}>
        <View style={rc.fichaBox}>
          <Text style={[rc.fichaLabel, { color: muted }]}>Ficha actual</Text>
          <Text style={[rc.fichaNum, { color: text }]}>{item.currentFichaNumber}</Text>
        </View>
        <Ionicons name="arrow-forward" size={20} color={theme.primary} />
        <View style={rc.fichaBox}>
          <Text style={[rc.fichaLabel, { color: muted }]}>Ficha destino</Text>
          <Text style={[rc.fichaNum, { color: text }]}>{item.requestedFichaNumber}</Text>
        </View>
      </View>

      {/* Fechas */}
      <Text style={[rc.meta, { color: muted }]}>
        Solicitado: {new Date(item.requestedAt).toLocaleString()}
      </Text>
      {item.decidedAt && (
        <Text style={[rc.meta, { color: muted }]}>
          Decidido: {new Date(item.decidedAt).toLocaleString()}
          {item.decidedBy ? ` · por ${item.decidedBy}` : ''}
        </Text>
      )}
      {item.status === 'rejected' && item.reason && (
        <View style={[rc.reasonBox, { backgroundColor: Colors.error + '0D', borderColor: Colors.error + '25' }]}>
          <Ionicons name="information-circle-outline" size={14} color={Colors.error} />
          <Text style={[rc.reasonText, { color: muted }]}>Motivo: {item.reason}</Text>
        </View>
      )}

      {/* Acciones — solo si está pendiente */}
      {item.status === 'pending' && (
        <View style={rc.actions}>
          <TouchableOpacity
            onPress={onReject}
            style={[rc.btn, { borderColor: Colors.error + '50', backgroundColor: Colors.error + '0D' }]}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={16} color={Colors.error} />
            <Text style={[rc.btnText, { color: Colors.error }]}>Rechazar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onApprove}
            style={[rc.btn, { borderColor: Colors.success + '50', backgroundColor: Colors.success + '0D' }]}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color={Colors.success} />
            <Text style={[rc.btnText, { color: Colors.success }]}>Aprobar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
const rc = StyleSheet.create({
  card:        { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:      { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  name:        { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  doc:         { fontSize: FontSize.xs, marginTop: 1 },
  transferRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, borderRadius: 12, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 16 },
  fichaBox:    { alignItems: 'center', gap: 2 },
  fichaLabel:  { fontSize: FontSize.xs },
  fichaNum:    { fontSize: FontSize.lg, fontWeight: FontWeight.black },
  meta:        { fontSize: FontSize.xs },
  reasonBox:   { flexDirection: 'row', alignItems: 'flex-start', gap: 6, borderRadius: 8, borderWidth: 1, padding: 10 },
  reasonText:  { fontSize: FontSize.xs, flex: 1, lineHeight: 17 },
  actions:     { flexDirection: 'row', gap: 10, marginTop: 2 },
  btn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, borderWidth: 1.2, paddingVertical: 11 },
  btnText:     { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});

// ── Pantalla principal ────────────────────────
export default function TransferRequestsScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { requests, pendingCount, approve, reject } = useTransferRequests();
  const { alert, DialogUI } = useAppDialog();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [search, setSearch]             = useState('');
  const [rejectingId, setRejectingId]   = useState<string | null>(null);

  const bg      = isDark ? Colors.dark.background : Colors.light.background;
  const text    = isDark ? Colors.dark.text        : Colors.light.text;
  const muted   = isDark ? Colors.dark.textMuted   : Colors.light.textMuted;
  const cardBg  = isDark ? '#0D1F14'               : Colors.white;
  const border  = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)': '#FAFAFA';

  // Solicitudes filtradas
  const filtered = useMemo(() => {
    let list = requests;
    if (statusFilter !== 'all') list = list.filter(r => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        r =>
          r.learnerName.toLowerCase().includes(q) ||
          r.learnerDocument.includes(q) ||
          r.currentFichaNumber.includes(q) ||
          r.requestedFichaNumber.includes(q),
      );
    }
    return [...list].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  }, [requests, statusFilter, search]);

  // ── Aprobar ───────────────────────────────
  const handleApprove = (item: TransferRequest) => {
    alert(
      'Aprobar traslado',
      `¿Confirmas el traslado de ${item.learnerName} de la ficha ${item.currentFichaNumber} a la ficha ${item.requestedFichaNumber}?\n\nEsta acción es inmediata e irreversible.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar',
          style: 'default',
          onPress: () => {
            const result = approve(item.id, user?.firstName ?? user?.email ?? 'Coordinador');
            if (result.success) {
              alert('✓ Traslado aplicado', `${item.learnerName} ahora está activo en la ficha ${item.requestedFichaNumber}.`);
            } else {
              const msgs: Record<string, string> = {
                'academic.fichaInactive':    'La ficha destino ya no está activa.',
                'academic.learnerNotFound':  'No se encontró al aprendiz en su ficha actual.',
                'academic.transferAlreadyDecided': 'Esta solicitud ya fue decidida.',
              };
              alert('Error', msgs[result.error!] ?? 'No se pudo aplicar el traslado. Intenta de nuevo.');
            }
          },
        },
      ],
    );
  };

  // ── Rechazar ──────────────────────────────
  const handleRejectConfirm = (reason: string) => {
    if (!rejectingId) return;
    const result = reject(rejectingId, user?.firstName ?? user?.email ?? 'Coordinador', reason || 'Sin motivo especificado.');
    setRejectingId(null);
    if (result.success) {
      alert('Solicitud rechazada', 'El aprendiz permanece en su ficha actual. Se notificará la decisión.');
    } else {
      alert('Error', 'No se pudo rechazar la solicitud. Intenta de nuevo.');
    }
  };

  const filterOptions: { value: StatusFilter; label: string; count?: number }[] = [
    { value: 'pending',  label: 'Pendientes', count: pendingCount },
    { value: 'approved', label: 'Aprobadas' },
    { value: 'rejected', label: 'Rechazadas' },
    { value: 'all',      label: 'Todas' },
  ];

  return (
    <View style={[trs.safe, { backgroundColor: bg }]}>

      {/* Encabezado */}
      <View style={trs.pageHeader}>
        <TouchableOpacity onPress={() => router.back()} style={trs.backRow} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={text} />
          <Text style={[trs.backText, { color: text }]}>Volver</Text>
        </TouchableOpacity>
        <View style={trs.titleRow}>
          <View>
            <Text style={[trs.title, { color: text }]}>Solicitudes de traslado</Text>
            <Text style={[trs.subtitle, { color: muted }]}>
              Revisa y decide las solicitudes de traslado enviadas por los aprendices.
            </Text>
          </View>
          {pendingCount > 0 && (
            <View style={[trs.pendingBadge, { backgroundColor: Colors.warning }]}>
              <Text style={trs.pendingBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Buscador */}
      <View style={[trs.searchWrap, { backgroundColor: inputBg, borderColor: border }]}>
        <Ionicons name="search-outline" size={18} color={muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre, documento o ficha…"
          placeholderTextColor={muted}
          style={[trs.searchInput, { color: text } as any]}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={17} color={muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros de estado */}
      <View style={trs.filterRow}>
        {filterOptions.map(opt => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setStatusFilter(opt.value)}
            style={[
              trs.filterChip,
              {
                backgroundColor: statusFilter === opt.value ? theme.primary + '20' : inputBg,
                borderColor:     statusFilter === opt.value ? theme.primary : border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[trs.filterChipText, { color: statusFilter === opt.value ? theme.primary : muted }]}>
              {opt.label}{opt.count !== undefined ? ` (${opt.count})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={trs.list}
        renderItem={({ item }) => (
          <RequestCard
            item={item}
            onApprove={() => handleApprove(item)}
            onReject={() => setRejectingId(item.id)}
            text={text} muted={muted} cardBg={cardBg} border={border} theme={theme}
          />
        )}
        ListEmptyComponent={
          <View style={trs.empty}>
            <Ionicons name="swap-horizontal-outline" size={48} color={muted} />
            <Text style={[trs.emptyTitle, { color: muted }]}>
              {statusFilter === 'pending'
                ? 'No hay solicitudes pendientes'
                : 'No hay solicitudes en esta categoría'}
            </Text>
          </View>
        }
      />

      {/* Modal de rechazo */}
      <RejectModal
        visible={!!rejectingId}
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectingId(null)}
        isDark={isDark}
        theme={theme}
      />

      {DialogUI}
    </View>
  );
}

const trs = StyleSheet.create({
  safe:             { flex: 1 },
  pageHeader:       { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 6 },
  backRow:          { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  backText:         { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  titleRow:         { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  title:            { fontSize: FontSize['2xl'], fontWeight: FontWeight.black },
  subtitle:         { fontSize: FontSize.sm, lineHeight: 19, marginTop: 2 },
  pendingBadge:     { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  pendingBadgeText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.black },
  searchWrap:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginVertical: 10, height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  searchInput:      { flex: 1, fontSize: FontSize.md, outlineStyle: 'none' } as any,
  filterRow:        { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 8, flexWrap: 'wrap' },
  filterChip:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.2 },
  filterChipText:   { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  list:             { padding: 16, gap: 12, paddingBottom: 32 },
  empty:            { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle:       { fontSize: FontSize.base, textAlign: 'center' },
});
