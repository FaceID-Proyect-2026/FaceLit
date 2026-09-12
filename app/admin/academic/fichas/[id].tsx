import FichaFormModal from '@/features/academic/components/FichaFormModal';
import { getProgramDisplayName } from '@/features/academic/types';
import { useAcademic } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
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
  const modalBg   = isDark ? '#0A1A0F' : Colors.white;
  const overlayBg = 'rgba(0,0,0,0.55)';

  const handleSave = () => {
    if (!name.trim() || !lastname.trim()) { setError('Nombre y apellido son obligatorios.'); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Correo inválido.'); return; }
    if (!document.trim() || !/^\d{10}$/.test(document.trim())) { setError('El documento debe tener 10 dígitos.'); return; }
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
              { label: 'Documento (10 dígitos)', value: document, onChange: setDoc, keyboard: 'numeric' as const },
            ].map(f => (
              <View key={f.label} style={{ marginBottom: 14 }}>
                <Text style={[elm.label, { color: text }]}>{f.label}</Text>
                <TextInput
                  style={[elm.input, { backgroundColor: inputBg, borderColor: inputBorder, color: text } as any]}
                  value={f.value}
                  onChangeText={v => { f.onChange(v); setError(''); }}
                  keyboardType={f.keyboard}
                  maxLength={f.keyboard === 'numeric' ? 10 : 80}
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
    getFicha, programs,
    deactivateLearner, reactivateLearner, updateLearnerInfo,
    moveLearnerToOrphanPool, regenerateTransferCode,
  } = useAcademic();
  const { alert, DialogUI } = useAppDialog();

  const [editFichaOpen, setEditFichaOpen]       = useState(false);
  const [copyMsg, setCopyMsg]                   = useState(false);
  const [editingLearner, setEditingLearner]     = useState<string | null>(null);

  const ficha = getFicha(id ?? '');
  const text    = isDark ? Colors.dark.text       : Colors.light.text;
  const muted   = isDark ? Colors.dark.textMuted   : Colors.light.textMuted;
  const cardBg  = isDark ? '#0D1F14'               : Colors.white;
  const border  = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg      = isDark ? Colors.dark.background  : Colors.light.background;

  if (!ficha) return (
    <View style={[fds.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: muted }}>Ficha no encontrada</Text>
    </View>
  );

  const program = programs.find(p => p.id === ficha.programId);
  const editingLearnerData = editingLearner ? ficha.learners.find(l => l.id === editingLearner) : null;

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
              const result = moveLearnerToOrphanPool(ficha.id, learnerId);
              if (result.success) alert(t('academic.transferMovedTitle') ?? '', t('academic.transferMovedMessage') ?? '');
              else if (result.error) alert(t('common.error'), t(result.error as any, { defaultValue: result.error }));
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
        data={ficha.learners}
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
              <View style={fds.infoRow}><Text style={[fds.infoLabel, { color: muted }]}>Jornada</Text><Text style={[fds.infoValue, { color: text }]}>{t(`academic.jornadas.${ficha.jornada}`)}</Text></View>
              <View style={fds.infoRow}><Text style={[fds.infoLabel, { color: muted }]}>{t('academic.fichaCode')}</Text><Text style={[fds.infoValue, { color: theme.primary, fontWeight: '800' }]}>{ficha.code}</Text></View>
              <View style={fds.infoRow}><Text style={[fds.infoLabel, { color: muted }]}>Estado</Text><Text style={{ color: ficha.status === 'active' ? Colors.success : Colors.error, fontWeight: '700' }}>{t(`environments.statuses.${ficha.status}`)}</Text></View>
              <View style={fds.infoRow}><Text style={[fds.infoLabel, { color: muted }]}>{t('environments.detail.createdAt')}</Text><Text style={[fds.infoValue, { color: text }]}>{new Date(ficha.createdAt).toLocaleString()}</Text></View>
              <View style={fds.infoRow}><Text style={[fds.infoLabel, { color: muted }]}>{t('environments.detail.updatedAt')}</Text><Text style={[fds.infoValue, { color: text }]}>{new Date(ficha.updatedAt).toLocaleString()}</Text></View>
            </View>

            {/* ── Código de traslado RF-3.3 ── */}
            <View style={[fds.transferCard, { backgroundColor: theme.primary + '0D', borderColor: theme.primary + '33' }]}>
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

            <Text style={[fds.sectionTitle, { color: text }]}>
              {t('academic.learners')} ({ficha.learners.length})
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

  learnerCard: { borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  learnerName: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  learnerMeta: { fontSize: FontSize.sm, marginTop: 2 },
  iconBtn: { width: 34, height: 34, borderRadius: 9, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center' },

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
