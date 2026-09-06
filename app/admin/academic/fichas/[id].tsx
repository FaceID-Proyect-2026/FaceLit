import CsvUploadZone from '@/features/academic/components/CsvUploadZone';
import FichaFormModal from '@/features/academic/components/FichaFormModal';
import { normalizeDocument, normalizeText, parseInstitutionalCsv } from '@/features/academic/csvImport';
import { getProgramDisplayName } from '@/features/academic/types';
import { useAcademic } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { getSystemUsers } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FichaDetailScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getFicha, programs, removeLearner, addLearner, allFichas, moveLearnerToOrphanPool } = useAcademic();
  const { alert, DialogUI } = useAppDialog();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const ficha = getFicha(id ?? '');
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  if (!ficha) return <View style={[fds.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: muted }}>Ficha no encontrada</Text></View>;

  const program = programs.find(p => p.id === ficha.programId);

  // Desvincular a un aprendiz puede deberse a dos motivos distintos:
  // 1) Ya no pertenece al SENA ni a ninguna ficha → se elimina por completo.
  // 2) Traslado a otra ficha → se guarda en el pool de "sin ficha" y el
  //    Coordinador le comparte el código de la ficha destino para que el
  //    propio aprendiz se una desde su cuenta ("Unirse a Ficha").
  const handleDesvincular = (learnerId: string, name: string) => {
    alert(t('academic.desvincularConfirm') ?? '', name, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('academic.desvincularReasonNoSena'), style: 'destructive', onPress: () => removeLearner(ficha.id, learnerId) },
      { text: t('academic.desvincularReasonTransfer'), style: 'default', onPress: () => {
        const result = moveLearnerToOrphanPool(ficha.id, learnerId);
        if (result.success) alert(t('academic.transferMovedTitle') ?? '', t('academic.transferMovedMessage') ?? '');
        else if (result.error) alert(t('common.error'), t(result.error));
      } },
    ]);
  };

  // Carga del listado institucional (CSV) directamente sobre esta ficha —
  // RF-3.3. Por cada fila válida busca si el documento ya pertenece a
  // algún aprendiz existente (en esta u otra ficha) para no duplicarlo ni
  // reasignarlo por encima de una ficha activa distinta; si no existe,
  // lo crea y lo asocia automáticamente a esta ficha como VALIDATED.
  const handleCsvFile = (csvText: string) => {
    const result = parseInstitutionalCsv(csvText);
    if (result.error) {
      alert(t('academic.csvImportTitle') ?? '', t(result.error) ?? '');
      return;
    }

    let added = 0;
    let alreadyLinked = 0;
    let conflict = 0;
    let fichaMismatch = 0;
    let inconsistencies = 0;
    const systemUsers = getSystemUsers();

    result.rows.forEach((row, index) => {
      if (row.fichaCode) {
        const target = normalizeText(row.fichaCode);
        const matchesThisFicha = target === normalizeText(ficha.number) || target === normalizeText(ficha.code);
        if (!matchesThisFicha) { fichaMismatch += 1; return; }
      }

      const existingFicha = allFichas.find(f => f.learners.some(l => normalizeDocument(l.document) === row.document));
      const existingLearner = existingFicha?.learners.find(l => normalizeDocument(l.document) === row.document);

      if (existingFicha && existingLearner) {
        if (existingFicha.id === ficha.id) { alreadyLinked += 1; return; }
        if (existingFicha.status === 'active' && existingLearner.status === 'active') { conflict += 1; return; }
      }

      // Si el documento del CSV coincide con una cuenta de usuario ya
      // registrada en el sistema, el aprendiz se asocia a esa cuenta
      // (mismo id) para saber siempre quién ingresa a la ficha — esto es
      // clave para el flujo de traslado ("Unirse a Ficha"). Si además el
      // nombre no coincide con lo registrado, queda como INCONSISTENCY
      // para revisión de un Coordinador, tal como indica el RF-3.3.
      const matchedUser = systemUsers.find(u => normalizeDocument(u.document) === row.document);
      let validationStatus: 'validated' | 'inconsistency' = 'validated';
      if (matchedUser) {
        const nameMatches = normalizeText(matchedUser.name) === normalizeText(row.name) && normalizeText(matchedUser.lastname) === normalizeText(row.lastname);
        if (!nameMatches) validationStatus = 'inconsistency';
      }
      if (validationStatus === 'inconsistency') { inconsistencies += 1; return; }

      const learner = {
        id: matchedUser?.id ?? `csv-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
        name: row.name,
        lastname: row.lastname,
        document: row.document,
        email: matchedUser?.email ?? '',
        role: 'aprendiz',
        status: 'active' as const,
        validationStatus,
      };
      const outcome = addLearner(ficha.id, learner);
      if (outcome.success) added += 1; else conflict += 1;
    });

    const parts = [
      `${t('academic.csvAdded')}: ${added}`,
      `${t('academic.csvAlreadyLinked')}: ${alreadyLinked}`,
      `${t('academic.csvConflict')}: ${conflict}`,
    ];
    if (inconsistencies > 0) parts.push(`${t('academic.csvInconsistency')}: ${inconsistencies}`);
    if (fichaMismatch > 0) parts.push(`${t('academic.csvFichaMismatch')}: ${fichaMismatch}`);
    if (result.invalidRows > 0) parts.push(`${t('academic.csvInvalidRows')}: ${result.invalidRows}`);

    alert(t('academic.csvImportTitle') ?? '', parts.join('\n'), [{ text: 'OK' }]);
  };

  return (
    <View style={[fds.safe, { backgroundColor: bg }]}>
      <FlatList
        data={ficha.learners}
        keyExtractor={l => l.id}
        contentContainerStyle={fds.scroll}
        ListHeaderComponent={
          <View>
            <TouchableOpacity onPress={() => router.back()} style={fds.backBtn}><Ionicons name="arrow-back" size={20} color={text} /><Text style={[fds.backText, { color: text }]}>{t('common.back')}</Text></TouchableOpacity>
            <View style={[fds.card, { backgroundColor: cardBg, borderColor: border }]}>
              <Text style={[fds.fichaTitle, { color: text }]}>Ficha {ficha.number}</Text>
              <Text style={[fds.fichaSubtitle, { color: muted }]}>{t('academic.fichaDetailSubtitle')}</Text>
              <View style={fds.infoRow}><Text style={[fds.infoLabel, { color: muted }]}>Programa</Text><Text style={[fds.infoValue, { color: text }]}>{program ? getProgramDisplayName(program, t) : 'Sin programa'}</Text></View>
              <View style={fds.infoRow}><Text style={[fds.infoLabel, { color: muted }]}>Jornada</Text><Text style={[fds.infoValue, { color: text }]}>{t(`academic.jornadas.${ficha.jornada}`)}</Text></View>
              <View style={fds.infoRow}><Text style={[fds.infoLabel, { color: muted }]}>{t('academic.fichaCode')}</Text><Text style={[fds.infoValue, { color: theme.primary, fontWeight: '800' }]}>{ficha.code}</Text></View>
              <View style={fds.infoRow}><Text style={[fds.infoLabel, { color: muted }]}>Estado</Text><Text style={{ color: ficha.status==='active'?Colors.success:Colors.error, fontWeight:'700' }}>{t(`environments.statuses.${ficha.status}`)}</Text></View>
              <View style={fds.infoRow}><Text style={[fds.infoLabel, { color: muted }]}>{t('environments.detail.createdAt')}</Text><Text style={[fds.infoValue, { color: text }]}>{new Date(ficha.createdAt).toLocaleString()}</Text></View>
              <View style={fds.infoRow}><Text style={[fds.infoLabel, { color: muted }]}>{t('environments.detail.updatedAt')}</Text><Text style={[fds.infoValue, { color: text }]}>{new Date(ficha.updatedAt).toLocaleString()}</Text></View>
            </View>
            <View style={fds.headerActions}>
              <TouchableOpacity onPress={() => setEditModalOpen(true)} style={[fds.actionBtn, { borderColor: theme.primary }]} activeOpacity={0.7}>
                <Ionicons name="create-outline" size={16} color={theme.primary} /><Text style={{ color: theme.primary, fontWeight:'700', fontSize: 13 }}>{t('academic.fichaEdit')}</Text>
              </TouchableOpacity>
            </View>
            <CsvUploadZone isDark={isDark} disabled={ficha.status !== 'active'} onFileRead={(csvText) => handleCsvFile(csvText)} />
            <Text style={[fds.sectionTitle, { color: text }]}>{t('academic.learners')} ({ficha.learners.length})</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[fds.learnerCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[fds.learnerName, { color: text }]}>{item.name} {item.lastname}</Text>
              <Text style={[fds.learnerMeta, { color: muted }]}>Doc: {item.document}{item.email ? ` · ${item.email}` : ''}</Text>
              {item.createdAt ? <Text style={[fds.learnerMeta, { color: muted }]}>{t('academic.addedOn')}: {new Date(item.createdAt).toLocaleString()}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <Text style={{ color: muted, fontSize: 12 }}>{item.role}</Text>
                <Text style={{ color: item.status==='active'?Colors.success:Colors.error, fontSize: 12, fontWeight:'700' }}>{t(`environments.statuses.${item.status}`)}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleDesvincular(item.id, item.name)} style={{ padding: 8 }}>
              <Ionicons name="person-remove-outline" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<View style={fds.empty}><Text style={{ color: muted }}>{t('academic.learnerEmpty')}</Text></View>}
      />
      {DialogUI}
      <FichaFormModal visible={editModalOpen} editId={ficha.id} onClose={() => setEditModalOpen(false)} />
    </View>
  );
}

const fds = StyleSheet.create({
  safe: { flex: 1 }, scroll: { padding: 16, paddingBottom: 40 },
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
  empty: { alignItems: 'center', paddingVertical: 40 },
});

