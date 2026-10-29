import FichaFormModal from '@/features/academic/components/FichaFormModal';
import ProgramFormModal from '@/features/academic/components/ProgramFormModal';
import { getProgramDisplayName } from '@/features/academic/types';
import { Colors } from '@/shared/constants/colors';
import { formatDateTime, isRecent, wasEditedRecently } from '@/shared/utils/dates';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { aps } from '@/features/academic/components/AcademicProgramsStyles';
import { OnboardingModern } from '@/features/academic/components/AcademicPrograms/OnboardingModern';

import { useAcademicProgramsScreen } from '@/features/academic/hooks/useAcademicProgramsScreen';

export default function AcademicProgramsScreen() {
  const {
    theme,
    isDark,
    t,
    programs,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    loading,
    loadError,
    DialogUI,
    isMobile,
    viewMode,
    programModalOpen,
    setProgramModalOpen,
    fichaModalOpen,
    setFichaModalOpen,
    text,
    muted,
    cardBg,
    border,
    inputBg,
    bg,
    filterOptions,
    handleDeactivate,
    handleDeleteCompletely,
    handleReactivate,
    hasData,
    tabTitles,
    tabSubtitles,
  } = useAcademicProgramsScreen();
return (
    <View style={[aps.safe, { backgroundColor: bg }]}>
      {loading && !hasData && (
        <View style={aps.loadingState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[aps.loadingText, { color: muted }]}>{t('academic.syncingAcademicInfo')}</Text>
        </View>
      )}

      {!loading && loadError && !hasData && (
        <View style={aps.loadingState}>
          <Ionicons name="alert-circle-outline" size={42} color={Colors.error} />
          <Text style={[aps.loadingText, { color: muted }]}>{loadError}</Text>
        </View>
      )}
      {/* ── Onboarding: primer uso sin datos ── */}
      {!loading && !loadError && !hasData && (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <OnboardingModern isDark={isDark} theme={theme} />
        </ScrollView>
      )}

      {/* ── Vista normal con datos ── */}
      {hasData && (
      <>
      <View style={[aps.header, isMobile && aps.headerMobile]}>
        <View style={aps.headingCopy}>
          <Text style={[aps.title, { color: text }]}>{tabTitles[viewMode]}</Text>
          <Text style={[aps.subtitle, { color: muted }]}>{tabSubtitles[viewMode]}</Text>
        </View>
        <View style={[aps.headerButtons, isMobile && aps.headerButtonsMobile]}>
          <TouchableOpacity onPress={() => router.push('/admin/academic/instructors' as any)} style={[aps.addBtn, isMobile && aps.addBtnMobile, { backgroundColor: theme.primary + '18', borderWidth: 1.5, borderColor: theme.primary }]} activeOpacity={0.85}>
            <Ionicons name="people-outline" size={18} color={theme.primary} />
          <Text style={[aps.addBtnText, { color: theme.primary }]} numberOfLines={1}>{t('academic.instructors')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/admin/academic/assignments' as any)} style={[aps.addBtn, isMobile && aps.addBtnMobile, { backgroundColor: theme.primary + '18', borderWidth: 1.5, borderColor: theme.primary }]} activeOpacity={0.85}>
            <Ionicons name="swap-horizontal-outline" size={18} color={theme.primary} />
            <Text style={[aps.addBtnText, { color: theme.primary }]} numberOfLines={1}>{t('academic.learners')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/admin/academic/csv-upload' as any)} style={[aps.addBtn, isMobile && aps.addBtnMobile, { backgroundColor: isDark ? '#1A2E1A' : '#E8F5E9', borderWidth: 1.5, borderColor: theme.primary }]} activeOpacity={0.85}>
            <Ionicons name="cloud-upload-outline" size={18} color={theme.primary} />
            <Text style={[aps.addBtnText, { color: theme.primary }]} numberOfLines={1}>{t('academic.csvUploadShort')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setProgramModalOpen(true)} style={[aps.addBtn, isMobile && aps.addBtnMobile, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={aps.addBtnText} numberOfLines={1}>{t('academic.programRegister')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFichaModalOpen(true)} style={[aps.addBtn, isMobile && aps.addBtnMobile, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={aps.addBtnText} numberOfLines={1}>{t('academic.fichaRegister')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'programs' && (
        <>
          <View style={[aps.searchWrap, { backgroundColor: inputBg, borderColor: border }]}>
            <Ionicons name="search-outline" size={18} color={muted} />
            <TextInput style={[aps.searchInput, { color: text }] as any} value={search} onChangeText={setSearch}
              placeholder={t('academic.searchProgram')} placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'} />
          </View>

          <View style={aps.filterRow}>
            {filterOptions.map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setStatusFilter(opt.value)}
                style={[
                  aps.filterChip,
                  {
                    backgroundColor: statusFilter === opt.value ? theme.primary + '20' : inputBg,
                    borderColor: statusFilter === opt.value ? theme.primary : border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[aps.filterChipText, { color: statusFilter === opt.value ? theme.primary : muted }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList data={programs} keyExtractor={p => p.id}
            contentContainerStyle={aps.list}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => router.push(`/admin/academic/programs/${item.id}` as any)}
                style={[aps.card, { backgroundColor: cardBg, borderColor: border }]} activeOpacity={0.7}>
                <View style={aps.cardHeader}>
                  <View style={[aps.typeBadge, { backgroundColor: theme.primary + '20' }]}>
                    <Ionicons name="school-outline" size={16} color={theme.primary} />
                    <Text style={[aps.typeText, { color: theme.primary }]}>{item.fichas.length} {t('academic.fichas').toLowerCase()}</Text>
                  </View>
                  <View style={aps.statusWrap}>
                    <View style={[aps.statusDot, { backgroundColor: item.status === 'active' ? Colors.success : Colors.error }]} />
                    <Text style={[aps.statusLabel, { color: item.status === 'active' ? Colors.success : Colors.error }]}>{t(`environments.statuses.${item.status}`)}</Text>
                  </View>
                </View>
                {(isRecent(item.createdAt) || wasEditedRecently(item.createdAt, item.updatedAt)) && (
                  <View style={aps.badgeRow}>
                    {isRecent(item.createdAt) && <View style={[aps.infoBadge, { backgroundColor: theme.primary + '18' }]}>
                      <Ionicons name="sparkles-outline" size={12} color={theme.primary} />
                      <Text style={[aps.infoBadgeText, { color: theme.primary }]}>{t('environments.recentBadge')}</Text>
                    </View>}
                    {wasEditedRecently(item.createdAt, item.updatedAt) && <View style={[aps.infoBadge, { backgroundColor: '#8A6D3B18' }]}>
                      <Ionicons name="create-outline" size={12} color="#B8860B" />
                      <Text style={[aps.infoBadgeText, { color: '#B8860B' }]}>{t('environments.editedRecentlyBadge')}</Text>
                    </View>}
                  </View>
                )}
                <View style={aps.titleRow}>
                  <Text style={[aps.cardTitle, { color: text }]}>{getProgramDisplayName(item, t)}</Text>
                </View>
                <Text style={[aps.cardSub, { color: muted }]}>{t('environments.detail.createdAt')}: {formatDateTime(item.createdAt)}</Text>
                <Text style={[aps.cardDates, { color: muted }]}>{t('environments.detail.updatedAt')}: {formatDateTime(item.updatedAt)}</Text>
                <View style={aps.cardActions}>
                  <TouchableOpacity onPress={() => router.push(`/admin/academic/programs/${item.id}` as any)} style={[aps.actionBtn, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="eye-outline" size={16} color={theme.primary} />
                  </TouchableOpacity>
                  {item.status === 'active' && (
                    <TouchableOpacity onPress={() => handleDeactivate(item.id, getProgramDisplayName(item, t))} style={[aps.actionBtn, { backgroundColor: Colors.error + '15' }]}>
                      <Ionicons name="trash-outline" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  )}
                  {item.status === 'inactive' && (
                    <><TouchableOpacity onPress={() => handleReactivate(item.id, getProgramDisplayName(item, t))} style={[aps.actionBtn, { backgroundColor: theme.primary + '15' }]}><Ionicons name="refresh-outline" size={16} color={theme.primary} /></TouchableOpacity><TouchableOpacity onPress={() => handleDeleteCompletely(item.id, getProgramDisplayName(item, t))} style={[aps.actionBtn, { backgroundColor: Colors.error + '15' }]}><Ionicons name="trash" size={16} color={Colors.error} /></TouchableOpacity></>
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<View style={aps.empty}><Ionicons name="school-outline" size={48} color={muted} /><Text style={[aps.emptyText, { color: muted }]}>{t('academic.programEmpty')}</Text></View>}
          />
        </>
      )}

      {DialogUI}
      <ProgramFormModal visible={programModalOpen} onClose={() => setProgramModalOpen(false)} />
      <FichaFormModal visible={fichaModalOpen} onClose={() => setFichaModalOpen(false)} />
      </> /* cierra hasData */
      )}
    </View>
  );

}
