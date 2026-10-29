import { Colors } from '@/shared/constants/colors';
import { formatDateTime } from '@/shared/utils/dates';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { s } from '@/features/academic/components/InstructorManagementStyles';
import { InstructorFormModal } from '@/features/academic/components/InstructorManagement/InstructorFormModal';

import { useInstructorManagementScreen } from '@/features/academic/hooks/useInstructorManagementScreen';

export default function InstructorManagementScreen() {
  const {
    t,
    theme,
    isDark,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    items,
    loading,
    error,
    modalOpen,
    editingItem,
    text,
    muted,
    cardBg,
    border,
    inputBg,
    bg,
    activePrograms,
    load,
    openCreateModal,
    openEditModal,
    closeModal,
    handleDeactivateInstructor,
    handleActivateInstructor,
    handleBack,
  } = useInstructorManagementScreen();
return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]}>
      {/* Cabecera */}
      <View style={[s.header, { borderBottomColor: border }]}>
        <TouchableOpacity onPress={handleBack} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: text }]}>{t('academic.instructors')}</Text>
          <Text style={[s.subtitle, s.subtitleEmphasis, { color: muted }]}>{t('academic.instructorScreenSubtitle')}</Text>
        </View>
        <TouchableOpacity
          onPress={openCreateModal}
          style={[s.addBtn, { backgroundColor: theme.primary }]}
          activeOpacity={0.85}
        >
          <Ionicons name="person-add-outline" size={18} color={Colors.white} />
          <Text style={s.addBtnText}>{t('academic.instructorNewBtn')}</Text>
        </TouchableOpacity>
      </View>

      {/* Búsqueda y filtro */}
      <View style={s.filters}>
        <View style={[s.searchWrap, { backgroundColor: inputBg, borderColor: border }]}>
          <Ionicons name="search-outline" size={16} color={muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('academic.instructorSearchPlaceholder')}
            placeholderTextColor={muted}
            style={[s.searchInput, { color: text }] as any}
            keyboardType="default"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={muted} />
            </TouchableOpacity>
          )}
        </View>
        <View style={s.typeFilters}>
          {(['ALL', 'TRANSVERSAL', 'ESPECIFICO'] as const).map(opt => (
            <TouchableOpacity
              key={opt}
              onPress={() => setTypeFilter(opt)}
              style={[s.typeChip, {
                backgroundColor: typeFilter === opt ? theme.primary + '20' : inputBg,
                borderColor:     typeFilter === opt ? theme.primary : border,
              }]}
              activeOpacity={0.7}
            >
              <Text style={[s.typeChipText, { color: typeFilter === opt ? theme.primary : muted }]}>
                {opt === 'ALL' ? t('academic.instructorFilterAll') : opt === 'TRANSVERSAL' ? t('academic.instructorFilterTransversal') : t('academic.instructorFilterEspecifico')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error ? (
        <View style={[s.errorBanner, { backgroundColor: Colors.error + '12', borderColor: Colors.error + '44' }]}>
          <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
          <Text style={[s.errorText, { color: Colors.error }]}>{error}</Text>
        </View>
      ) : null}

      {loading
        ? <ActivityIndicator color={theme.primary} style={{ marginTop: 32 }} />
        : (
          <FlatList
            data={items}
            keyExtractor={item => item.idInstructor}
            contentContainerStyle={s.list}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="people-outline" size={52} color={muted} />
                <Text style={[s.emptyText, { color: muted }]}>
                  {search ? t('academic.instructorNoResultsDoc') : t('academic.instructorEmpty')}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const fullName = `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || t('academic.instructorNoName');
              const isEsp = item.instructorType === 'ESPECIFICO';
              const isInactive = item.status === 'INACTIVE';
              return (
                <View style={[s.card, { backgroundColor: cardBg, borderColor: border }]}>
                  {/* Cabecera tarjeta */}
                  <View style={s.cardHeader}>
                    <View style={[s.avatar, { backgroundColor: theme.primary + '20' }]}>
                      <Ionicons name="person-outline" size={22} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[s.cardName, { color: text }]}>{fullName}</Text>
                      {item.document
                        ? <Text style={[s.cardDoc,  { color: muted }]}>{t('academic.instructorDocPrefix')}: {item.document}</Text>
                        : null
                      }
                      {item.email
                        ? <Text style={[s.cardEmail, { color: muted }]}>{item.email}</Text>
                        : null
                      }
                      {item.createdAt ? (
                        <Text style={[s.cardEmail, { color: muted }]}>{t('academic.instructorCreatedPrefix')}: {formatDateTime(item.createdAt)}</Text>
                      ) : null}
                      {item.updatedAt ? (
                        <Text style={[s.cardEmail, { color: muted }]}>{t('academic.instructorLastEditPrefix')}: {formatDateTime(item.updatedAt)}</Text>
                      ) : null}
                    </View>
                    <View style={[s.typeBadge, {
                      backgroundColor: isInactive ? Colors.error + '15' : isEsp ? theme.primary + '20' : Colors.info + '20',
                    }]}>
                      <Text style={[s.typeBadgeText, { color: isInactive ? Colors.error : isEsp ? theme.primary : Colors.info }]}>
                        {isInactive ? t('academic.instructorStatusInactive') : isEsp ? t('academic.instructorTypeEspecificoShort') : t('academic.instructorTypeTransversalShort')}
                      </Text>
                    </View>
                  </View>

                  {/* Programas */}
                  {item.programNames && item.programNames.length > 0 && (
                    <View style={s.progRow}>
                      <Ionicons name="school-outline" size={13} color={muted} />
                      <Text style={[s.progText, { color: muted }]} numberOfLines={2}>
                        {item.programNames.join(' · ')}
                      </Text>
                    </View>
                  )}

                  {/* Acciones */}
                  <View style={s.actions}>
                    <TouchableOpacity
                      onPress={() => openEditModal(item)}
                      style={[s.actionBtn, { borderColor: theme.primary }]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="create-outline" size={14} color={theme.primary} />
                      <Text style={[s.actionBtnText, { color: theme.primary }]}>{t('academic.instructorActionEdit')}</Text>
                    </TouchableOpacity>
                    {isInactive ? (
                      <TouchableOpacity
                        onPress={() => handleActivateInstructor(item, fullName)}
                        style={[s.actionBtn, { borderColor: theme.primary }]}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="checkmark-circle-outline" size={14} color={theme.primary} />
                        <Text style={[s.actionBtnText, { color: theme.primary }]}>{t('academic.instructorActionActivate')}</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleDeactivateInstructor(item, fullName)}
                        style={[s.actionBtn, { borderColor: Colors.error }]}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="ban-outline" size={14} color={Colors.error} />
                        <Text style={[s.actionBtnText, { color: Colors.error }]}>{t('academic.instructorActionDeactivate')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
          />
        )
      }

      <InstructorFormModal
        visible={modalOpen}
        onClose={closeModal}
        onSaved={load}
        editItem={editingItem}
        programs={activePrograms}
        theme={theme}
        isDark={isDark}
      />
    </SafeAreaView>
  );

}
