import FichaFormModal from '@/features/academic/components/FichaFormModal';
import PersonDetailsModal, { AcademicPersonDetails } from '@/features/academic/components/PersonDetailsModal';
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
    ActivityIndicator,
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
  onSave: (data: { name: string; lastname: string; email: string; document: string }) => Promise<{ success: boolean; error?: string }>;
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
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setLastname(initialLastname);
      setEmail(initialEmail);
      setDoc(initialDocument);
      setError('');
      setSaving(false);
    }
  }, [visible, initialName, initialLastname, initialEmail, initialDocument]);

  const text      = isDark ? Colors.dark.text       : Colors.light.text;
  const muted     = isDark ? Colors.dark.textMuted   : Colors.light.textMuted;
  const inputBg   = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const inputBorder = isDark ? 'rgba(255,255,255,0.25)' : '#BBBBBB';
  const modalBg   = theme.surface;
  const overlayBg = 'rgba(0,0,0,0.55)';

  const handleSave = async () => {
    if (!name.trim() || !lastname.trim()) { setError(t('academic.assignValidationName')); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError(t('academic.assignValidationEmail')); return; }
    if (!document.trim() || !/^\d{6,15}$/.test(document.trim())) { setError(t('academic.assignValidationDoc')); return; }

    setSaving(true);
    setError('');
    try {
      const result = await onSave({ name: name.trim(), lastname: lastname.trim(), email: email.trim(), document: document.trim() });
      if (!result.success) {
        setError(result.error ? t(result.error as any, { defaultValue: result.error }) : t('academic.assignError'));
        return;
      }
      onClose();
    } catch (saveError: any) {
      const message = saveError?.response?.data?.message ?? saveError?.message ?? t('academic.assignError');
      setError(t(message, { defaultValue: message }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[elm.overlay, { backgroundColor: overlayBg }]}>
        <View style={[elm.sheet, { backgroundColor: modalBg }]}>
          <View style={elm.modalHeader}>
            <Text style={[elm.modalTitle, { color: text }]}>{t('academic.editLearnerTitle')}</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={22} color={muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {[
              { label: t('academic.assignNameLabel'), value: name, onChange: setName, keyboard: 'default' as const },
              { label: t('academic.assignLastNameLabel'), value: lastname, onChange: setLastname, keyboard: 'default' as const },
              { label: t('academic.assignEmailLabel'), value: email, onChange: setEmail, keyboard: 'email-address' as const },
              { label: t('academic.assignDocLabel'), value: document, onChange: setDoc, keyboard: 'numeric' as const },
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
            <TouchableOpacity onPress={handleSave} disabled={saving} style={[elm.btn, { backgroundColor: theme.primary, opacity: saving ? 0.7 : 1 }]} activeOpacity={0.85}>
              {saving
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Text style={{ color: Colors.white, fontWeight: '700' }}>{t('common.save')}</Text>}
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
  const [selectedLearner, setSelectedLearner] = useState<AcademicPersonDetails | null>(null);
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
      <Text style={{ color: muted }}>{t('academic.fichaNotFound')}</Text>
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
        t('academic.deactivateLearnerTitle'),
        t('academic.deactivateLearnerConfirm', { name }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('academic.deactivateLearnerAction'),
            style: 'destructive',
            onPress: () => {
              const r = deactivateLearner(ficha.id, learnerId);
              if (!r.success && r.error) alert(t('common.error'), t(r.error as any, { defaultValue: r.error }));
            },
          },
          {
            text: t('academic.transferToAnotherFicha'),
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
        t('academic.reactivateLearnerTitle'),
        t('academic.reactivateLearnerConfirm', { name }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('academic.reactivateLearnerAction'),
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
              <Text style={[fds.fichaTitle, { color: text }]}>{t('academic.fields.fichaNumber')}: {ficha.number}</Text>
              <Text style={[fds.fichaSubtitle, { color: muted }]}>{t('academic.fichaDetailSubtitle')}</Text>
              <View style={fds.infoRow}><Text style={[fds.infoLabel, { color: muted }]}>{t('academic.program')}</Text><Text style={[fds.infoValue, { color: text }]}>{program ? getProgramDisplayName(program, t) : t('academic.assignNoProgram')}</Text></View>
              <View style={fds.infoRow}><Text style={[fds.infoLabel, { color: muted }]}>{t('academic.fields.status')}</Text><Text style={{ color: ficha.status === 'active' ? Colors.success : Colors.error, fontWeight: '700' }}>{t(`environments.statuses.${ficha.status}`)}</Text></View>
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

            {/* Los instructores se consultan desde el programa asociado. */}
            <View style={[fds.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F2F2F2', borderColor: border }]}>
              <Ionicons name="search-outline" size={16} color={muted} />
              <TextInput
                style={[fds.searchInput, { color: text }] as any}
                value={learnerSearch}
                onChangeText={setLearnerSearch}
                placeholder={t('academic.searchLearnerFull')}
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
              {t('academic.learners')} ({filteredLearners.length}{learnerSearch ? ` ${t('common.of')} ${ficha.learners.length}` : ''})
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[fds.learnerCard, { backgroundColor: cardBg, borderColor: border }]}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t('academic.openPersonDetails', { name: `${item.name} ${item.lastname}` })}
              onPress={() => setSelectedLearner(item)}
              activeOpacity={0.75}
              style={{ flex: 1 }}
            >
              <Text style={[fds.learnerName, { color: text }]}>{item.name} {item.lastname}</Text>
              {item.createdAt ? (
                <Text style={[fds.learnerMeta, { color: muted }]}>
                  {t('academic.personCreatedPrefix')}: {formatDateTime(item.createdAt)}
                </Text>
              ) : null}
              {item.updatedAt ? (
                <Text style={[fds.learnerMeta, { color: muted }]}>
                  {t('academic.personUpdatedPrefix')}: {formatDateTime(item.updatedAt)}
                </Text>
              ) : null}
            </TouchableOpacity>

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
              <View style={{ flex: 1 }}><Text style={[fds.transferModalTitle, { color: text }]}>{t('academic.transferLearnerTitle')}</Text><Text style={[fds.transferModalSubtitle, { color: muted }]}>{transferLearnerData?.name} {transferLearnerData?.lastname} · {t('academic.currentFicha')} {ficha.number}</Text></View>
            </View>
            <Text style={[fds.transferModalLabel, { color: text }]}>{t('academic.selectFichaSameProgram')}</Text>
            <ScrollView style={fds.transferOptions}>
              {availableTransferFichas.map(target => (
                <TouchableOpacity key={target.id} onPress={() => setDestinationFichaId(target.id)} style={[fds.transferOption, { borderColor: destinationFichaId === target.id ? theme.primary : border, backgroundColor: destinationFichaId === target.id ? theme.primary + '14' : 'transparent' }]}>
                  <Ionicons name={destinationFichaId === target.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={destinationFichaId === target.id ? theme.primary : muted} />
                  <View><Text style={[fds.transferOptionTitle, { color: text }]}>{t('academic.fields.fichaNumber')}: {target.number}</Text><Text style={[fds.transferOptionMeta, { color: muted }]}>{program ? getProgramDisplayName(program, t) : ''}</Text></View>
                </TouchableOpacity>
              ))}
              {availableTransferFichas.length === 0 && <Text style={[fds.transferEmpty, { color: muted }]}>{t('academic.noOtherActiveFicha')}</Text>}
            </ScrollView>
            <View style={fds.transferModalActions}>
              <TouchableOpacity onPress={() => setTransferLearnerId(null)} style={[fds.transferModalButton, { borderColor: border }]}><Text style={[fds.transferModalButtonText, { color: text }]} numberOfLines={1}>{t('common.cancel')}</Text></TouchableOpacity>
              <TouchableOpacity disabled={!destinationFichaId || transferBusy} onPress={() => alert(t('academic.confirmTransferTitle'), t('academic.confirmTransferMessage', { name: transferLearnerData?.name, from: ficha.number, to: availableTransferFichas.find(target => target.id === destinationFichaId)?.number }), [{ text: t('common.cancel'), style: 'cancel' }, { text: t('academic.confirmTransferAction'), onPress: async () => { if (!transferLearnerData) return; setTransferBusy(true); try { await transferLearner(transferLearnerData.id, destinationFichaId); setTransferLearnerId(null); alert(t('academic.transferSuccessTitle'), t('academic.transferSuccessMessage')); } catch (error: any) { alert(t('common.error'), error?.response?.data?.message ?? t('academic.transferError')); } finally { setTransferBusy(false); } } }])} style={[fds.transferModalButton, { backgroundColor: destinationFichaId ? theme.primary : muted, borderColor: 'transparent', opacity: transferBusy ? 0.7 : 1 }]}><Text style={[fds.transferModalButtonText, { color: Colors.white }]} numberOfLines={1}>{transferBusy ? t('academic.transferring') : t('common.continue')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <PersonDetailsModal
        visible={!!selectedLearner}
        title={t('academic.learnerDetails')}
        person={selectedLearner}
        onClose={() => setSelectedLearner(null)}
      />

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
