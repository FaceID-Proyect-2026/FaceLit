// ─────────────────────────────────────────────
//  app/apprentice/transfer-request.tsx
//  RF-3.3 V4 — Solicitud de traslado de ficha
//
//  El aprendiz ingresa el transferCode (8 chars) que le entregó
//  el Coordinador fuera del sistema. El sistema crea la solicitud
//  con status 'pending' y el Coordinador la aprueba o rechaza.
// ─────────────────────────────────────────────
import { useAcademic } from '@/features/academic/useAcademic';
import { useTransferRequests } from '@/features/academic/useTransferRequests';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// ── Badge de estado de la solicitud ──────────
function StatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const color =
    status === 'approved' ? Colors.success :
    status === 'rejected' ? Colors.error :
    Colors.warning;

  const icon =
    status === 'approved' ? 'checkmark-circle-outline' :
    status === 'rejected' ? 'close-circle-outline' :
    'time-outline';

  const labels: Record<string, string> = {
    pending:  'Pendiente',
    approved: 'Aprobada',
    rejected: 'Rechazada',
  };

  return (
    <View style={[sb.wrap, { backgroundColor: color + '18', borderColor: color + '40' }]}>
      <Ionicons name={icon as any} size={13} color={color} />
      <Text style={[sb.text, { color }]}>{labels[status]}</Text>
    </View>
  );
}

const sb = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  text:  { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
});

// ── Pantalla principal ────────────────────────
export default function TransferRequestScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { allFichas } = useAcademic();
  const { create, requests } = useTransferRequests();

  const [code, setCode]   = useState('');
  const [error, setError] = useState('');
  const [sent, setSent]   = useState(false);

  const bg      = isDark ? Colors.dark.background : Colors.light.background;
  const text    = isDark ? Colors.dark.text        : Colors.light.text;
  const muted   = isDark ? Colors.dark.textMuted   : Colors.light.textMuted;
  const cardBg  = isDark ? '#0D1F14'               : Colors.white;
  const border  = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)': '#FAFAFA';

  // Ficha activa actual del aprendiz
  const currentFicha = allFichas.find(
    f => f.status === 'active' && f.learners.some(l => l.id === user?.id && l.status === 'active'),
  );

  // Historial de solicitudes del aprendiz (más reciente primero)
  const myRequests = requests
    .filter(r => r.learnerId === user?.id)
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));

  const hasPending = myRequests.some(r => r.status === 'pending');

  const handleSubmit = () => {
    setError('');
    if (!currentFicha) return;
    if (!code.trim()) { setError('El código no puede estar vacío.'); return; }

    const result = create(user?.id ?? '', currentFicha.id, code.trim());
    if (!result.success) {
      const errorMessages: Record<string, string> = {
        'academic.transferCodeNotFound': 'El código ingresado no corresponde a ninguna ficha. Verifica que lo hayas escrito correctamente.',
        'academic.fichaInactive':        'Esta ficha no está disponible para recibir nuevos aprendices en este momento.',
        'academic.sameFicha':            'Ya perteneces a esta ficha.',
        'academic.transferAlreadyPending': 'Ya tienes una solicitud de traslado pendiente. Espera a que el Coordinador la revise.',
        'academic.learnerNotFound':      'No se encontró tu información en la ficha actual. Contacta al Coordinador.',
        'academic.fichaNotFound':        'No se encontró tu ficha actual. Contacta al Coordinador.',
      };
      setError(errorMessages[result.error!] ?? 'Ocurrió un error. Intenta de nuevo.');
      return;
    }
    setCode('');
    setSent(true);
  };

  // ── Sin ficha activa ──────────────────────
  if (!currentFicha) {
    return (
      <View style={[trs.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <Ionicons name="alert-circle-outline" size={52} color={Colors.warning} />
        <Text style={[trs.emptyTitle, { color: text }]}>Sin ficha activa</Text>
        <Text style={[trs.emptySub, { color: muted }]}>
          Para solicitar un traslado debes estar activo en una ficha. Si crees que esto es un error, contacta al Coordinador.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={[trs.backBtn, { borderColor: theme.primary }]}>
          <Text style={{ color: theme.primary, fontWeight: FontWeight.bold }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[trs.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={trs.scroll} showsVerticalScrollIndicator={false}>

        {/* Encabezado */}
        <View style={trs.header}>
          <TouchableOpacity onPress={() => router.back()} style={trs.backRow} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={text} />
            <Text style={[trs.backText, { color: text }]}>Volver</Text>
          </TouchableOpacity>
          <Text style={[trs.title, { color: text }]}>Solicitar traslado de ficha</Text>
          <Text style={[trs.subtitle, { color: muted }]}>
            Si acordaste un traslado con tu Coordinador, ingresa aquí el código que te entregó para la ficha destino.
          </Text>
        </View>

        {/* Ficha actual */}
        <View style={[trs.card, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={trs.cardRow}>
            <Ionicons name="school-outline" size={20} color={theme.primary} />
            <Text style={[trs.cardLabel, { color: muted }]}>Tu ficha actual</Text>
          </View>
          <Text style={[trs.fichaNumber, { color: text }]}>Ficha {currentFicha.number}</Text>
          <Text style={[trs.fichaMeta, { color: muted }]}>
            Código interno: {currentFicha.code} · {currentFicha.learners.filter(l => l.status === 'active').length} aprendices activos
          </Text>
        </View>

        {/* Formulario de solicitud */}
        {sent ? (
          <View style={[trs.successCard, { backgroundColor: Colors.success + '12', borderColor: Colors.success + '30' }]}>
            <Ionicons name="checkmark-circle" size={40} color={Colors.success} />
            <Text style={[trs.successTitle, { color: text }]}>¡Solicitud enviada!</Text>
            <Text style={[trs.successSub, { color: muted }]}>
              Tu Coordinador revisará la solicitud. Te notificaremos cuando haya una decisión.
            </Text>
            <TouchableOpacity onPress={() => setSent(false)} style={[trs.newRequestBtn, { borderColor: theme.primary }]} activeOpacity={0.8}>
              <Text style={{ color: theme.primary, fontWeight: FontWeight.bold }}>Hacer otra solicitud</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[trs.card, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[trs.sectionTitle, { color: text }]}>Código de traslado</Text>
            <Text style={[trs.fieldHint, { color: muted }]}>
              El Coordinador te entregó este código (8 caracteres) fuera del sistema.
            </Text>

            <TextInput
              value={code}
              onChangeText={v => { setCode(v.toUpperCase()); setError(''); }}
              placeholder="Ej: A1B2C3D4"
              placeholderTextColor={muted}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
              style={[
                trs.input,
                {
                  color: text,
                  backgroundColor: inputBg,
                  borderColor: error ? Colors.error : border,
                } as any,
              ]}
            />

            {!!error && (
              <View style={trs.errorRow}>
                <Ionicons name="alert-circle-outline" size={15} color={Colors.error} />
                <Text style={trs.errorText}>{error}</Text>
              </View>
            )}

            {hasPending && (
              <View style={[trs.warnBox, { backgroundColor: Colors.warning + '12', borderColor: Colors.warning + '30' }]}>
                <Ionicons name="time-outline" size={16} color={Colors.warning} />
                <Text style={[trs.warnText, { color: muted }]}>
                  Ya tienes una solicitud pendiente. Solo puedes tener una activa a la vez.
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={hasPending}
              style={[
                trs.submitBtn,
                { backgroundColor: hasPending ? muted : theme.primary },
              ]}
            >
              <Ionicons name="swap-horizontal-outline" size={18} color={Colors.white} />
              <Text style={trs.submitBtnText}>Enviar solicitud de traslado</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Historial de solicitudes */}
        {myRequests.length > 0 && (
          <View style={trs.historySection}>
            <Text style={[trs.sectionTitle, { color: text }]}>Mis solicitudes</Text>
            {myRequests.map(req => (
              <View key={req.id} style={[trs.historyCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={trs.historyHeader}>
                  <View>
                    <Text style={[trs.historyFichas, { color: text }]}>
                      Ficha {req.currentFichaNumber} → Ficha {req.requestedFichaNumber}
                    </Text>
                    <Text style={[trs.historyDate, { color: muted }]}>
                      Solicitado: {new Date(req.requestedAt).toLocaleString()}
                    </Text>
                  </View>
                  <StatusBadge status={req.status} />
                </View>

                {req.status === 'rejected' && req.reason && (
                  <View style={[trs.reasonBox, { backgroundColor: Colors.error + '0D', borderColor: Colors.error + '25' }]}>
                    <Ionicons name="information-circle-outline" size={14} color={Colors.error} />
                    <Text style={[trs.reasonText, { color: muted }]}>Motivo: {req.reason}</Text>
                  </View>
                )}

                {req.decidedAt && (
                  <Text style={[trs.historyDate, { color: muted, marginTop: 4 }]}>
                    Decidido: {new Date(req.decidedAt).toLocaleString()}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Info sobre el proceso */}
        <View style={[trs.infoBox, { backgroundColor: theme.primary + '0D', borderColor: theme.primary + '25' }]}>
          <Ionicons name="information-circle-outline" size={18} color={theme.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[trs.infoTitle, { color: text }]}>¿Cómo funciona el traslado?</Text>
            <Text style={[trs.infoText, { color: muted }]}>
              1. Solicita el traslado al Coordinador fuera del sistema.{'\n'}
              2. Si lo aprueba, te entregará un código de 8 caracteres.{'\n'}
              3. Ingresa ese código aquí para enviar la solicitud formal.{'\n'}
              4. Una vez que el Coordinador confirme, quedarás activo en la nueva ficha automáticamente.
            </Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const trs = StyleSheet.create({
  safe:          { flex: 1 },
  scroll:        { padding: 16, paddingBottom: 40, gap: 16, maxWidth: 600, alignSelf: 'center', width: '100%' },
  header:        { gap: 6 },
  backRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  backText:      { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  title:         { fontSize: FontSize['2xl'], fontWeight: FontWeight.black },
  subtitle:      { fontSize: FontSize.sm, lineHeight: 20 },

  card:          { borderRadius: 16, borderWidth: 1, padding: 18, gap: 6 },
  cardRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardLabel:     { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  fichaNumber:   { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  fichaMeta:     { fontSize: FontSize.xs },

  sectionTitle:  { fontSize: FontSize.lg, fontWeight: FontWeight.black, marginBottom: 4 },
  fieldHint:     { fontSize: FontSize.sm, lineHeight: 18, marginBottom: 10 },
  input:         { height: 52, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, fontSize: FontSize.xl, fontWeight: FontWeight.bold, letterSpacing: 3, textAlign: 'center' },
  errorRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 6 },
  errorText:     { color: Colors.error, fontSize: FontSize.sm, flex: 1, lineHeight: 18 },
  warnBox:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginTop: 8 },
  warnText:      { fontSize: FontSize.sm, flex: 1, lineHeight: 18 },
  submitBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14, marginTop: 12 },
  submitBtnText: { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.bold },

  successCard:   { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center', gap: 10 },
  successTitle:  { fontSize: FontSize.xl, fontWeight: FontWeight.black, textAlign: 'center' },
  successSub:    { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
  newRequestBtn: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },

  historySection:{ gap: 10 },
  historyCard:   { borderRadius: 14, borderWidth: 1, padding: 16, gap: 4 },
  historyHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  historyFichas: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  historyDate:   { fontSize: FontSize.xs },
  reasonBox:     { flexDirection: 'row', alignItems: 'flex-start', gap: 6, borderRadius: 8, borderWidth: 1, padding: 10, marginTop: 6 },
  reasonText:    { fontSize: FontSize.xs, flex: 1, lineHeight: 17 },

  infoBox:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, borderWidth: 1, padding: 16 },
  infoTitle:     { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: 6 },
  infoText:      { fontSize: FontSize.sm, lineHeight: 20 },

  emptyTitle:    { fontSize: FontSize.xl, fontWeight: FontWeight.black, textAlign: 'center', marginTop: 16 },
  emptySub:      { fontSize: FontSize.base, textAlign: 'center', lineHeight: 22, marginTop: 8, marginBottom: 20 },
  backBtn:       { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 },
});
