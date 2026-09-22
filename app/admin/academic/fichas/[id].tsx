import FichaFormModal from '@/features/academic/components/FichaFormModal';
import { getProgramDisplayName } from '@/features/academic/types';
import { useAcademic } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { formatDateTime } from '@/shared/utils/dates';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// ── Modal de edición de aprendiz ──────────────
interface EditLearnerModalProps {
  visible: boolean;
  fichaId: string;
  learnerId: string;
  initialName: string;
  initialLastname: string;
  initialEmail: string;
  initialDocument: string;
  onClose: () => void;
  onSave: (data: { name: string; lastname: string; email: string; document: string }) => { success: boolean; error?: string };
}

function EditLearnerModal({
  visible, fichaId, learnerId,
  initialName, initialLastname, initialEmail, initialDocument,
  onClose, onSave,
}: EditLearnerModalProps) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const [name, setName]         = useState(initialName);
  const [lastname, setLastname] = useState(initialLastname);
  const [email, setEmail]       = useState(initialEmail);
  const [document, setDoc]      = useState(initialDocument);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setLastname(initialLastname);
      setEmail(initialEmail);
      setDoc(initialDocument);
      setError('');
    }
  }, [visible, initialName, initialLastname, initialEmail, initialDocument]);

  const text      = isDark ? Colors.dark.text       : Colors.light.text;
  const muted     = isDark ? Colors.dark.textMuted   : Colors.light.textMuted;
  const inputBg   = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const inputBorder = isDark ? 'rgba(255,255,255,0.25)' : '#BBBBBB';
  const modalBg   = theme.surface;
  const overlayBg = 'rgba(0,0,0,0.55)';

  const handleSave = () => {
    if (!name.trim() || !lastname.trim()) { setError('Nombre y apellido son obligatorios.'); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Correo inválido.'); return; }
    if (!document.trim() || !/^\d{6,15}$/.test(document.trim())) { setError('El documento debe tener entre 6 y 15 dígitos.'); return; }
    const result = onSave({ name: name.trim(), lastname: lastname.trim(), email: email.trim(), document: document.trim() });
    if (!result.success) { setError(result.error ? t(result.error as any, { defaultValue: result.error }) : 'Error al guardar.'); return; }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[elm.overlay, { backgroundColor: overlayBg }]}>
        <View style={[elm.sheet, { backgroundColor: modalBg }]}>
          <View style={elm.modalHeader}>
            <Text style={[elm.modalTitle, { color: text }]}>Editar aprendiz</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={22} color={muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {[
              { label: 'Nombre', value: name, onChange: setName, keyboard: 'default' as const },
              { label: 'Apellido', value: lastname, onChange: setLastname, keyboard: 'default' as const },
              { label: 'Correo', value: email, onChange: setEmail, keyboard: 'email-address' as const },
              { label: 'Documento (6 a 15 dígitos)', value: document, onChange: setDoc, keyboard: 'numeric' as const },
            ].map(f => (
              <View key={f.label} style={{ marginBottom: 14 }}>
                <Text style={[elm.label, { color: text }]}>{f.label}</Text>
                <TextInput
                  style={[elm.input, { backgroundColor: inputBg, borderColor: inputBorder, color: text } as any]}
                  value={f.value}
                  onChangeText={v => { f.onChange(v); setError(''); }}
                  keyboardType={f.keyboard}
                  maxLength={f.keyboard === 'numeric' ? 15 : 80}
                  placeholderTextColor={muted}
                  autoCapitalize={f.keyboard === 'default' ? 'words' : 'none'}
                />
              </View>
            ))}
            {error ? <Text style={elm.errorText}>{error}</Text> : null}
          </ScrollView>

          <View style={elm.footer}>
            <TouchableOpacity onPress={onClose} style={[elm.btn, { borderColor: inputBorder, borderWidth: 1.2 }]} activeOpacity={0.7}>
              <Text style={{ color: text, fontWeight: '700' }}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={[elm.btn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
              <Text style={{ color: Colors.white, fontWeight: '700' }}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Pantalla principal ────────────────────────
export default function FichaDetailScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getFicha, programs, allFichas,
    deactivateLearner, reactivateLearner, updateLearnerInfo,
    transferLearner, regenerateTransferCode,
  } = useAcademic();
  const { alert, DialogUI } = useAppDialog();

  const [editFichaOpen, setEditFichaOpen]       = useState(false);
  const [copyMsg, setCopyMsg]                   = useState(false);
  const [editingLearner, setEditingLearner]     = useState<string | null>(null);
  const [transferLearnerId, setTransferLearnerId] = useState<string | null>(null);
  const [destinationFichaId, setDestinationFichaId] = useState('');
  const [transferBusy, setTransferBusy] = useState(false);
  // Búsqueda de aprendices — filtra por nombre, documento o correo
  const [learnerSearch, setLearnerSearch]       = useState('');

  const ficha = getFicha(id ?? '');
  const text    = isDark ? Colors.dark.text       : Colors.light.text;
  const muted   = isDark ? Colors.dark.textMuted   : Colors.light.textMuted;
  const cardBg  = theme.surface;
  const border  = theme.border;
  const bg      = isDark ? Colors.dark.background  : Colors.light.background;

  if (!ficha) return (
    <View style={[fds.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: muted }}>Ficha no encontrada</Text>
    </View>
  );

  const program = programs.find(p => p.id === ficha.programId);
  const editingLearnerData = editingLearner ? ficha.learners.find(l => l.id === editingLearner) : null;
  const transferLearnerData = transferLearnerId ? ficha.learners.find(l => l.id === transferLearnerId) : null;
  const availableTransferFichas = allFichas.filter(target =>
    target.programId === ficha.programId && target.id !== ficha.id && target.status === 'active'
  );

  // Filtrar aprendices según búsqueda (nombre, documento, correo)
  const filteredLearners = learnerSearch.trim()
    ? ficha.learners.filter(l => {
        const q = learnerSearch.trim().toLowerCase();
        return (
          `${l.name} ${l.lastname}`.toLowerCase().includes(q) ||
          l.document.includes(q) ||
          l.email.toLowerCase().includes(q)
        );
      })
    : ficha.learners;

  // ── RF-3.3 §10 — Regenerar código de traslado ──
  const handleRegenerate = () => {
    alert(
      t('academic.transferCodeGenerate'),
      t('academic.transferCodeGenerateConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('academic.transferCodeGenerate'),
          onPress: () => {
            const r = regenerateTransferCode(ficha.id);
            if (!r.success) alert(t('common.error'), t('academic.fichaNotFound'));
          },
        },
      ],
    );
  };

  const copyTransferCode = () => {
    if (Platform.OS === 'web' && ficha.transferCode) {
      navigator.clipboard?.writeText(ficha.transferCode).catch(() => {});
    }
    setCopyMsg(true);
    setTimeout(() => setCopyMsg(false), 2000);
  };

  // ── RF-3.2 — Aprendices: solo desactivar / reactivar, NUNCA eliminar ──
  const handleToggleLearner = (learnerId: string, currentStatus: string, name: string) => {
    if (currentStatus === 'active') {
      alert(
        'Desactivar aprendiz',
        `¿Desactivar a ${name}? El aprendiz conserva su historial y puede reactivarse.`,
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: 'Desactivar',
            style: 'destructive',
            onPress: () => {
              const r = deactivateLearner(ficha.id, learnerId);
              if (!r.success && r.error) alert(t('common.error'), t(r.error as any, { defaultValue: r.error }));
            },
          },
          {
            text: 'Trasladar a otra ficha',
            style: 'default',
            onPress: () => {
              setTransferLearnerId(learnerId);
              setDestinationFichaId('');
            },
          },
        ],
      );
    } else {
      alert(
        'Reactivar aprendiz',
        `¿Reactivar a ${name}?`,
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: 'Reactivar',
            onPress: () => {
              const r = reactivateLearner(ficha.id, learnerId);
              if (!r.success && r.error) alert(t('common.error'), t(r.error as any, { defaultValue: r.error }));
            },
          },
        ],
      );
    }
  };

  return (
    <View style={[fds.safe, { backgroundColor: bg }]}>
      <FlatList
        data={filteredLearners}
        keyExtractor={l => l.id}
        contentContainerStyle={fds.scroll}
        ListHeaderComponent={
          <View>
            <TouchableOpacity onPress={() => router.back()} style={fds.backBtn}>
              <Ionicons name="arrow-back" size={20} color={text} />
              <Text style={[fds.backText, { color: text }]}>{t('common.back')}</Text>
            </TouchableOpacity>

            {/* ── Info de la ficha ── */}
            <View style={[fds.card, { backgroundColor: cardBg, borderColor: border }]}>
              <Text style={[fds.fichaTitle, { color: text }]}>Ficha {ficha.number}</Text>
              <Text style={[fds.fichaSubtitle, { color: muted }]}>{t('academic.fichaDetailSubtitle')}</Text>
              <View style={fds.infoRow}><Text style={[fds.infoLabel, { color: muted }]}>Programa</Text><Text style={[fds.infoValue, { color: text }]}>{program ? getProgramDisplayName(program, t) : 'Sin programa'}</Text></View>
              <View style={fds.infoRow}><Text style={[fds.infoLabel, { color: muted }]}>Estado</Text><Text style={{ color: ficha.status === 'active' ? Colors.success : Colors.error, fontWeight: '700' }}>{t(`environments.statuses.${ficha.status}`)}</Text></View>
              <View style={fds.infoRow}><Text style={[fds.infoLabel, { color: muted }]}>{t('environments.detail.createdAt')}</Text><Text style={[fds.infoValue, { color: text }]}>{formatDateTime(ficha.createdAt)}</Text></View>
              <View style={fds.infoRow}><Text style={[fds.infoLabel, { color: muted }]}>{t('environments.detail.updatedAt')}</Text><Text style={[fds.infoValue, { color: text }]}>{formatDateTime(ficha.updatedAt)}</Text></View>
            </View>

            {/* ── Código de traslado RF-3.3 ── */}
            <View style={[fds.transferCard, { display: 'none', backgroundColor: theme.primary + '0D', borderColor: theme.primary + '33' }]}>
              <View style={fds.transferHeader}>
                <Ionicons name="key-outline" size={18} color={theme.primary} />
                <Text style={[fds.transferTitle, { color: theme.primary }]}>{t('academic.transferCode')}</Text>
              </View>
              <Text style={[fds.transferHint, { color: muted }]}>{t('academic.transferCodeHint')}</Text>
              <View style={fds.transferCodeRow}>
                <Text style={[fds.transferCodeText, { color: theme.primary }]} selectable>
                  {ficha.transferCode ?? '—'}
                </Text>
                <TouchableOpacity onPress={copyTransferCode} style={fds.copyBtn} activeOpacity={0.7}>
                  <Ionicons name={copyMsg ? 'checkmark' : 'copy-outline'} size={16} color={theme.primary} />
                  {copyMsg && <Text style={[fds.copyMsg, { color: theme.primary }]}>{t('academic.transferCodeCopied')}</Text>}
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={handleRegenerate} style={[fds.regenBtn, { borderColor: theme.primary }]} activeOpacity={0.8}>
                <Ionicons name="refresh-circle-outline" size={15} color={theme.primary} />
                <Text style={[fds.regenText, { color: theme.primary }]}>{t('academic.transferCodeGenerate')}</Text>
              </TouchableOpacity>
            </View>

            <View style={fds.headerActions}>
              <TouchableOpacity onPress={() => setEditFichaOpen(true)} style={[fds.actionBtn, { borderColor: theme.primary }]} activeOpacity={0.7}>
                <Ionicons name="create-outline" size={16} color={theme.primary} />
                <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>{t('academic.fichaEdit')}</Text>
              </TouchableOpacity>
            </View>

            {/* ── Buscador de aprendices ── */}
            <View style={[fds.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F2F2F2', borderColor: border }]}>
              <Ionicons name="search-outline" size={16} color={muted} />
              <TextInput
                style={[fds.searchInput, { color: text }] as any}
                value={learnerSearch}
                onChangeText={setLearnerSearch}
                placeholder="Buscar por nombre, documento o correo…"
                placeholderTextColor={muted}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              {learnerSearch.length > 0 && (
                <TouchableOpacity onPress={() => setLearnerSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={16} color={muted} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={[fds.sectionTitle, { color: text }]}>
              {t('academic.learners')} ({filteredLearners.length}{learnerSearch ? ` de ${ficha.learners.length}` : ''})
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[fds.learnerCard, { backgroundColor: cardBg, borderColor: border, opacity: item.status === 'inactive' ? 0.65 : 1 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[fds.learnerName, { color: text }]}>{item.name} {item.lastname}</Text>
              <Text style={[fds.learnerMeta, { color: muted }]}>Doc: {item.document}{item.email ? ` · ${item.email}` : ''}</Text>
              {item.createdAt ? (
                <Text style={[fds.learnerMeta, { color: muted }]}>
                  {t('academic.addedOn')}: {new Date(item.createdAt).toLocaleString()}
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <Text style={{ color: muted, fontSize: 12 }}>{item.role}</Text>
                <Text style={{ color: item.status === 'active' ? Colors.success : Colors.error, fontSize: 12, fontWeight: '700' }}>
                  {t(`environments.statuses.${item.status}`)}
                </Text>
              </View>
              {/* Contraseña inicial — solo visible mientras no ha sido cambiada */}
              {item.initialPassword ? (
                <View style={[fds.pwdBadge, { backgroundColor: Colors.warning + '18', borderColor: Colors.warning + '55' }]}>
                  <Ionicons name="key-outline" size={12} color={Colors.warning} />
                  <Text style={[fds.pwdLabel, { color: Colors.warning }]}>Contraseña inicial: </Text>
                  <Text style={[fds.pwdValue, { color: Colors.warning }]} selectable>{item.initialPassword}</Text>
                </View>
              ) : (
                <View style={[fds.pwdBadge, { backgroundColor: Colors.success + '14', borderColor: Colors.success + '44' }]}>
                  <Ionicons name="checkmark-circle-outline" size={12} color={Colors.success} />
                  <Text style={[fds.pwdLabel, { color: Colors.success }]}>Contraseña propia activa</Text>
                </View>
              )}
            </View>

            {/* Botón editar */}
            <TouchableOpacity
              onPress={() => setEditingLearner(item.id)}
              style={[fds.iconBtn, { borderColor: theme.primary + '60', marginRight: 4 }]}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={17} color={theme.primary} />
            </TouchableOpacity>

            {/* Botón desactivar / reactivar */}
            <TouchableOpacity
              onPress={() => handleToggleLearner(item.id, item.status, item.name)}
              style={[fds.iconBtn, { borderColor: item.status === 'active' ? Colors.error + '60' : Colors.success + '60' }]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.status === 'active' ? 'person-remove-outline' : 'person-add-outline'}
                size={17}
                color={item.status === 'active' ? Colors.error : Colors.success}
              />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={fds.empty}>
            <Text style={{ color: muted }}>{t('academic.learnerEmpty')}</Text>
          </View>
        }
      />

      {DialogUI}

      <Modal visible={!!transferLearnerData} transparent animationType={'fade'} onRequestClose={() => setTransferLearnerId(null)}>
        <View style={fds.modalOverlay}>
          <View style={[fds.transferModal, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={fds.transferModalHeader}>
              <View style={[fds.transferModalIcon, { backgroundColor: theme.primary + '18' }]}><Ionicons name={'swap-horizontal'} size={22} color={theme.primary} /></View>
              <View style={{ flex: 1 }}><Text style={[fds.transferModalTitle, { color: text }]}>Trasladar aprendiz</Text><Text style={[fds.transferModalSubtitle, { color: muted }]}>{transferLearnerData?.name} {transferLearnerData?.lastname} · Ficha actual {ficha.number}</Text></View>
            </View>
            <Text style={[fds.transferModalLabel, { color: text }]}>Selecciona una ficha del mismo programa</Text>
            <ScrollView style={fds.transferOptions}>
              {availableTransferFichas.map(target => (
                <TouchableOpacity key={target.id} onPress={() => setDestinationFichaId(target.id)} style={[fds.transferOption, { borderColor: destinationFichaId === target.id ? theme.primary : border, backgroundColor: destinationFichaId === target.id ? theme.primary + '14' : 'transparent' }]}>
                  <Ionicons name={destinationFichaId === target.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={destinationFichaId === target.id ? theme.primary : muted} />
                  <View><Text style={[fds.transferOptionTitle, { color: text }]}>Ficha {target.number}</Text><Text style={[fds.transferOptionMeta, { color: muted }]}>{program ? getProgramDisplayName(program, t) : ''}</Text></View>
                </TouchableOpacity>
              ))}
              {availableTransferFichas.length === 0 && <Text style={[fds.transferEmpty, { color: muted }]}>No hay otra ficha activa disponible dentro de este programa.</Text>}
            </ScrollView>
            <View style={fds.transferModalActions}>
              <TouchableOpacity onPress={() => setTransferLearnerId(null)} style={[fds.transferModalButton, { borderColor: border }]}><Text style={{ color: text, fontWeight: '700' }}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity disabled={!destinationFichaId || transferBusy} onPress={() => alert('Confirmar traslado', `¿Estás seguro de trasladar a ${transferLearnerData?.name} de la ficha ${ficha.number} a la ficha ${availableTransferFichas.find(target => target.id === destinationFichaId)?.number}?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sí, trasladar', onPress: async () => { if (!transferLearnerData) return; setTransferBusy(true); try { await transferLearner(transferLearnerData.id, destinationFichaId); setTransferLearnerId(null); alert('Traslado exitoso', 'El aprendiz fue asignado a la nueva ficha correctamente.'); } catch (error: any) { alert(t('common.error'), error?.response?.data?.message ?? 'No se pudo realizar el traslado.'); } finally { setTransferBusy(false); } } }])} style={[fds.transferModalButton, { backgroundColor: destinationFichaId ? theme.primary : muted, borderColor: 'transparent', opacity: transferBusy ? 0.7 : 1 }]}><Text style={{ color: Colors.white, fontWeight: '700' }}>{transferBusy ? 'Trasladando...' : 'Continuar'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FichaFormModal
        visible={editFichaOpen}
        editId={ficha.id}
        onClose={() => setEditFichaOpen(false)}
      />

      {editingLearnerData && (
        <EditLearnerModal
          visible={!!editingLearner}
          fichaId={ficha.id}
          learnerId={editingLearnerData.id}
          initialName={editingLearnerData.name}
          initialLastname={editingLearnerData.lastname}
          initialEmail={editingLearnerData.email}
          initialDocument={editingLearnerData.document}
          onClose={() => setEditingLearner(null)}
          onSave={(data) => updateLearnerInfo(ficha.id, editingLearnerData.id, data)}
        />
      )}
    </View>
  );
}

const fds = StyleSheet.create({
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
  transferModalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  transferModalButton: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },

  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  fichaTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 8 },
  fichaSubtitle: { fontSize: FontSize.sm, marginBottom: 12, lineHeight: 19 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  infoLabel: { fontSize: FontSize.md },
  infoValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold },

  headerActions: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },

  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, marginBottom: 10 },

  learnerCard: { borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  learnerName: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  learnerMeta: { fontSize: FontSize.sm, marginTop: 2 },
  iconBtn: { width: 34, height: 34, borderRadius: 9, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center' },

  // ── Contraseña inicial ──
  pwdBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5, marginTop: 7, flexWrap: 'wrap' },
  pwdLabel:  { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  pwdValue:  { fontSize: FontSize.xs, fontWeight: FontWeight.black, letterSpacing: 0.5 },

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

// ── Estilos del modal de edición ─────────────
const elm = StyleSheet.create({
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
