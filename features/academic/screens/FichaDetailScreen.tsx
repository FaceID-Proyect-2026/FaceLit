import FichaFormModal from '@/features/academic/components/FichaFormModal';
import PersonDetailsModal from '@/features/academic/components/PersonDetailsModal';
import { getProgramDisplayName } from '@/features/academic/types';
import { Colors } from '@/shared/constants/colors';
import { formatDateTime } from '@/shared/utils/dates';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { fds } from '@/features/academic/components/FichaDetailStyles';
import { EditLearnerModal } from '@/features/academic/components/FichaDetail/EditLearnerModal';

import { useFichaDetailScreen } from '@/features/academic/hooks/useFichaDetailScreen';

export default function FichaDetailScreen() {
  const {
    theme,
    isDark,
    t,
    programs,
    allFichas,
    deactivateLearner,
    reactivateLearner,
    updateLearnerInfo,
    transferLearner,
    regenerateTransferCode,
    alert,
    DialogUI,
    editFichaOpen,
    setEditFichaOpen,
    copyMsg,
    setCopyMsg,
    editingLearner,
    setEditingLearner,
    selectedLearner,
    setSelectedLearner,
    transferLearnerId,
    setTransferLearnerId,
    destinationFichaId,
    setDestinationFichaId,
    transferBusy,
    setTransferBusy,
    learnerSearch,
    setLearnerSearch,
    ficha,
    text,
    muted,
    cardBg,
    border,
    bg,
  } = useFichaDetailScreen();
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
            onPress: async () => {
              const r = await deactivateLearner(ficha.id, learnerId);
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
            onPress: async () => {
              const r = await reactivateLearner(ficha.id, learnerId);
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
