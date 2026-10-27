import { CsvRowResult } from '@/features/academic/types';
import { Colors } from '@/shared/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { s } from '@/features/academic/components/AcademicCsvUploadStyles';
import {
  MAX_FILE_LABEL,
  catColor,
  catIcon,
  catLabel,
  translateCsvType,
} from '@/features/academic/components/AcademicCsvUploadSupport';

import { useAcademicCsvUploadScreen } from '@/features/academic/hooks/useAcademicCsvUploadScreen';

export default function AcademicCsvUploadScreen() {
  const {
    t,
    theme,
    isDark,
    columnGuide,
    tips,
    loading,
    summary,
    fileError,
    postUploadWarning,
    fileName,
    guideOpen,
    setGuideOpen,
    text,
    muted,
    cardBg,
    border,
    soft,
    downloadTemplate,
    downloadCredentials,
    downloadResultReport,
    handlePickFile,
    reset,
    goBack,
  } = useAcademicCsvUploadScreen();
return (
    <SafeAreaView style={[s.safe, { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Encabezado ── */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={goBack} style={s.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[s.pageTitle, { color: text }]}>{t('academic.csvV4Title')}</Text>
            <Text style={[s.pageSubtitle, { color: muted }]}>{t('academic.csvV4Subtitle')}</Text>
          </View>
        </View>

        {/* ── Zona de carga (arriba, protagonista) ── */}
        {!summary && (
          <>
            {fileError && (
              <View style={[s.alertBox, { backgroundColor: Colors.error + '12', borderColor: Colors.error + '44' }]}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                <Text style={[s.alertText, { color: Colors.error }]}>{fileError}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handlePickFile}
              disabled={loading}
              activeOpacity={0.85}
              style={[s.dropZone, { borderColor: theme.primary + '80', backgroundColor: soft }]}
            >
              {loading ? (
                <View style={s.dropInner}>
                  <ActivityIndicator color={theme.primary} size="large" />
                  <Text style={[s.dropMain, { color: muted }]}>{t('academic.csvV4Processing')}</Text>
                </View>
              ) : (
                <View style={s.dropInner}>
                  <View style={[s.dropIconCircle, { backgroundColor: theme.primary + '1A', borderColor: theme.primary + '44' }]}>
                    <Ionicons name="cloud-upload-outline" size={34} color={theme.primary} />
                  </View>
                  <Text style={[s.dropMain, { color: text }]}>
                    {t(Platform.OS === 'web' ? 'academic.csvV4DropWeb' : 'academic.csvV4DropNative')}
                  </Text>
                  <Text style={[s.dropSub, { color: muted }]}>{t('academic.csvV4DropHint', { maxSize: MAX_FILE_LABEL, maxRows: '5,000' })}</Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* ── Guía de columnas (colapsable, debajo de la zona de carga) ── */}
        <View style={[s.guideCard, { backgroundColor: cardBg, borderColor: border }]}>
          <TouchableOpacity onPress={() => setGuideOpen(v => !v)} style={s.guideToggle} activeOpacity={0.7}>
            <Ionicons name="help-circle-outline" size={18} color={theme.primary} />
            <Text style={[s.guideToggleText, { color: theme.primary }]}>{t('academic.csvV4GuideTitle')}</Text>
            <Ionicons name={guideOpen ? 'chevron-up' : 'chevron-down'} size={16} color={muted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {guideOpen && (
            <View style={s.guideBody}>
              <View style={[s.fileSizeNotice, { backgroundColor: theme.primary + '12', borderColor: theme.primary + '44' }]}>
                <Ionicons name="information-circle-outline" size={16} color={theme.primary} />
                <Text style={[s.fileSizeNoticeText, { color: text }]}>{t('academic.csvV4FileSizeNotice', { maxSize: MAX_FILE_LABEL })}</Text>
              </View>

              {/* Chips de columnas */}
              <Text style={[s.guideSection, { color: muted }]}>{t('academic.csvV4ColumnsTitle')}</Text>
              {columnGuide.map(row => (
                <View key={row.col} style={[s.colRow, { borderBottomColor: border }]}>
                  <View style={s.colLeft}>
                    <Text style={[s.colName, { color: theme.primary }]}>{row.col}</Text>
                    <View style={[s.whenBadge, { backgroundColor: row.required ? theme.primary + '22' : border + '80' }]}>
                      <Text style={[s.whenText, { color: row.required ? theme.primary : muted }]}>{row.badge}</Text>
                    </View>
                  </View>
                  <Text style={[s.colWhat, { color: text }]}>{row.what}</Text>
                </View>
              ))}

              <Text style={[s.guideSection, { color: muted, marginTop: 14 }]}>{t('academic.csvV4ExamplesTitle')}</Text>
              <Text style={[s.tipText, { color: text }]}>{t('academic.csvV4ExamplesIntro')}</Text>
              <Text selectable style={[s.csvExample, { color: text, backgroundColor: soft, borderColor: border }]}>
                {t('academic.csvV4ExampleRows')}
              </Text>

              {/* Tips */}
              <Text style={[s.guideSection, { color: muted, marginTop: 14 }]}>{t('academic.csvV4TipsTitle')}</Text>
              {tips.map((tip, i) => (
                <View key={i} style={s.tipRow}>
                  <Ionicons name={tip.icon as any} size={14} color={theme.primary} style={{ marginTop: 1 }} />
                  <Text style={[s.tipText, { color: text }]}>{tip.text}</Text>
                </View>
              ))}

              <TouchableOpacity onPress={downloadTemplate} style={[s.templateButton, { borderColor: theme.primary, backgroundColor: theme.primary + '12' }]} activeOpacity={0.8}>
                <Ionicons name="download-outline" size={16} color={theme.primary} />
                <Text style={[s.templateButtonText, { color: theme.primary }]}>{t('academic.csvV4DownloadTemplate')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Resumen de resultados ── */}
        {summary && (
          <>
            {postUploadWarning && (
              <View style={[s.alertBox, { backgroundColor: Colors.warning + '12', borderColor: Colors.warning + '44' }]}>
                <Ionicons name="information-circle-outline" size={16} color={Colors.warning} />
                <Text style={[s.alertText, { color: Colors.warning }]}>{postUploadWarning}</Text>
              </View>
            )}
            {/* Contadores */}
            <View style={s.statsRow}>
              {(['created', 'updated', 'blocked', 'errors'] as const).map(key => {
                const count = key === 'errors' ? summary.errors : summary[key as 'created'|'updated'|'blocked'];
                const cat   = key === 'errors' ? 'error' : key as CsvRowResult['category'];
                return (
                  <View key={key} style={[s.statCard, { backgroundColor: cardBg, borderColor: catColor(cat) + '55' }]}>
                    <Ionicons name={catIcon(cat) as any} size={20} color={catColor(cat)} />
                    <Text style={[s.statNum, { color: catColor(cat) }]}>{count}</Text>
                    <Text style={[s.statLbl, { color: muted }]}>{catLabel(cat, t)}</Text>
                  </View>
                );
              })}
            </View>

            {/* Nombre de archivo */}
            <View style={s.resultToolbar}>
              {fileName ? <Text style={[s.fileChip, { color: muted }]}>{t('academic.csvV4FileLabel', { fileName })}</Text> : <View />}
              <TouchableOpacity onPress={downloadResultReport} style={[s.downloadBtn, { borderColor: theme.primary, backgroundColor: theme.primary + '12' }]} activeOpacity={0.8}>
                <Ionicons name="download-outline" size={16} color={theme.primary} />
                <Text style={[s.downloadBtnText, { color: theme.primary }]}>{t('academic.csvV4DownloadReport')}</Text>
              </TouchableOpacity>
            </View>

            {summary.generatedPasswords.length > 0 && (
              <View style={[s.guideCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={s.credentialsHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.resultHeader, { color: text }]}>{t('academic.csvV4CredentialsTitle')}</Text>
                    <Text style={[s.resultMsg, { color: muted }]}>{t('academic.csvV4CredentialsSubtitle')}</Text>
                  </View>
                  <TouchableOpacity onPress={downloadCredentials} style={[s.downloadBtn, { borderColor: theme.primary, backgroundColor: theme.primary + '12' }]} activeOpacity={0.8}>
                    <Ionicons name="download-outline" size={16} color={theme.primary} />
                    <Text style={[s.downloadBtnText, { color: theme.primary }]}>{t('academic.csvV4Excel')}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[s.resultMsg, { color: muted }]}>{t('academic.csvV4CredentialsNotice')}</Text>
                {summary.generatedPasswords.map((item) => (
                  <View key={item.document} style={[s.passwordRow, { borderBottomColor: border }]}>
                    <View style={s.passwordIdentity}>
                      <Text style={[s.passwordDocument, { color: text }]}>{item.document}</Text>
                      <Text style={[s.passwordMeta, { color: muted }]}>{item.name || t('academic.csvV4UnknownName')} · {item.role || t('academic.csvV4UnknownRole')}</Text>
                      <Text style={[s.passwordMeta, { color: muted }]}>{t('academic.csvV4FichaLabel')}: {item.ficha || t('academic.csvV4NotApplicable')} · {t('academic.csvV4ProgramLabel')}: {item.program || t('academic.csvV4NotReported')}</Text>
                    </View>
                    <Text selectable style={[s.passwordValue, { color: theme.primary }]}>{item.password}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Lista de filas */}
            <View style={[s.guideCard, { backgroundColor: cardBg, borderColor: border }]}>
              <Text style={[s.resultHeader, { color: text }]}>{t('academic.csvV4RowDetails')}</Text>
              {summary.rows.map(row => (
                <View key={row.rowIndex} style={[s.resultRow, { borderLeftColor: catColor(row.category), borderBottomColor: border }]}>
                  <Ionicons name={catIcon(row.category) as any} size={14} color={catColor(row.category)} style={{ marginTop: 2, flexShrink: 0 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.resultId, { color: text }]}>{t('academic.csvV4RowNumber', { row: row.rowIndex })} · <Text style={{ color: theme.primary }}>{translateCsvType(row.tipo, t)}</Text> · {row.identifier}</Text>
                    <Text style={[s.resultMsg, { color: muted }]}>{row.message}</Text>
                  </View>
                  {row.category === 'blocked' && row.conflictRecordId && (
                    <TouchableOpacity
                      onPress={() => router.push(row.conflictRecordType === 'ficha' ? `/admin/academic/fichas/${row.conflictRecordId}` as any : '/admin/academic' as any)}
                      style={[s.fixBtn, { borderColor: Colors.warning }]}
                    >
                      <Text style={[s.fixBtnText, { color: Colors.warning }]}>{t('academic.csvV4Fix')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Nuevo archivo */}
            <TouchableOpacity onPress={reset} style={[s.reloadBtn, { borderColor: theme.primary }]} activeOpacity={0.8}>
              <Ionicons name="reload-outline" size={16} color={theme.primary} />
              <Text style={[s.reloadText, { color: theme.primary }]}>{t('academic.csvV4UploadAnother')}</Text>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );

}
