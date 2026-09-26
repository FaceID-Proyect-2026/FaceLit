// ─────────────────────────────────────────────
//  app/admin/academic/index.tsx — Programas (Admin)
// ─────────────────────────────────────────────
import FichaFormModal from '@/features/academic/components/FichaFormModal';
import ProgramFormModal from '@/features/academic/components/ProgramFormModal';
import { getProgramDisplayName } from '@/features/academic/types';
import { ProgramStatusFilter, useAcademic } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { formatDateTime, isRecent, wasEditedRecently } from '@/shared/utils/dates';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Animated,
    Easing,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';

type ViewMode = 'programs' | 'unlinked' | 'orphans';

// ─────────────────────────────────────────────
//  OnboardingEmpty — se muestra cuando no hay ningún programa
//  registrado. Explica al Coordinador que debe cargar el CSV
//  primero, con pasos animados y botón de acceso directo.
// ─────────────────────────────────────────────
function OnboardingEmpty({ isDark, theme, t }: { isDark: boolean; theme: any; t: (k: string) => string }) {
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const fadeIn  = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(24)).current;
  const pulse   = useRef(new Animated.Value(1)).current;
  const arrowY  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrada suave
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // Pulso del ícono central
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(pulse, { toValue: 1.00, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    ).start();

    // Flecha que baja
    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowY, { toValue: 6,  duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
        Animated.timing(arrowY, { toValue: 0,  duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      ])
    ).start();
  }, []);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted= isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const soft = theme.primary + '14';
  const border = theme.primary + '33';

  const STEPS = [
    {
      icon: 'document-text-outline',
      title: '1. Descarga la plantilla',
      desc: 'Desde la pantalla de carga CSV hay un botón para descargar un archivo de ejemplo ya armado.',
    },
    {
      icon: 'create-outline',
      title: '2. Completa con tus datos',
      desc: 'Abre el archivo en Excel, reemplaza los datos de ejemplo por los programas, fichas, aprendices e instructores reales de tu institución.',
    },
    {
      icon: 'cloud-upload-outline',
      title: '3. Sube el archivo',
      desc: 'Vuelve aquí y pulsa "Cargar CSV". El sistema procesa el archivo y te muestra qué se creó, actualizó o necesita corrección.',
    },
  ];

  return (
    <Animated.View style={[ob.wrap, { opacity: fadeIn, transform: [{ translateY: slideY }] }]}>

      {/* Ícono central animado */}
      <Animated.View style={[ob.iconCircle, { backgroundColor: soft, borderColor: border, transform: [{ scale: pulse }] }]}>
        <Ionicons name="school-outline" size={48} color={theme.primary} />
      </Animated.View>

      <Text style={[ob.title, { color: text }]}>Bienvenido a Gestión Académica</Text>
      <Text style={[ob.subtitle, { color: muted }]}>
        Aquí administrarás los programas, fichas, aprendices e instructores del centro de formación.
        Para empezar, carga la información desde un archivo CSV.
      </Text>

      {/* Pasos */}
      <View style={ob.stepsWrap}>
        {STEPS.map((step, i) => (
          <View key={i} style={ob.stepRow}>
            <View style={[ob.stepIcon, { backgroundColor: soft, borderColor: border }]}>
              <Ionicons name={step.icon as any} size={22} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[ob.stepTitle, { color: text }]}>{step.title}</Text>
              <Text style={[ob.stepDesc, { color: muted }]}>{step.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Flecha + botón */}
      <Animated.View style={{ transform: [{ translateY: arrowY }] }}>
        <Ionicons name="arrow-down-outline" size={22} color={theme.primary} style={{ alignSelf: 'center', marginBottom: 10 }} />
      </Animated.View>

      <TouchableOpacity
        onPress={() => router.push('/admin/academic/csv-upload' as any)}
        activeOpacity={0.85}
        style={ob.btnWrap}
      >
        <LinearGradient
          colors={['#72C96D', '#65B361', '#4FA14B']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={ob.btn}
        >
          <Ionicons name="cloud-upload-outline" size={20} color={Colors.white} />
          <Text style={ob.btnText}>Cargar información por CSV</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Text style={[ob.hint, { color: muted }]}>
        Tambien puedes crear programas y fichas manualmente con el boton + en la parte superior una vez que hayas cargado el archivo.
      </Text>
    </Animated.View>
  );
}

const ob = StyleSheet.create({
  wrap:       { flex: 1, alignItems: 'center', padding: 28, paddingTop: 32 },
  iconCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title:      { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, textAlign: 'center', marginBottom: 10 },
  subtitle:   { fontSize: FontSize.base, lineHeight: 22, textAlign: 'center', marginBottom: 28, maxWidth: 480 },
  stepsWrap:  { width: '100%', maxWidth: 520, gap: 14, marginBottom: 28 },
  stepRow:    { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  stepIcon:   { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  stepTitle:  { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: 3 },
  stepDesc:   { fontSize: FontSize.sm, lineHeight: 19 },
  btnWrap:    { borderRadius: 16, overflow: 'hidden', width: '100%', maxWidth: 320, marginBottom: 18 },
  btn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15 },
  btnText:    { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  hint:       { fontSize: FontSize.xs, textAlign: 'center', lineHeight: 18, maxWidth: 400 },
});

function OnboardingModern({ isDark, theme }: { isDark: boolean; theme: any }) {
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(22)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const soft = theme.primary + '14';
  const border = theme.primary + '33';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.045, duration: 1100, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
    ])).start();
  }, []);

  const steps = [
    ['document-text-outline', 'Descarga la plantilla', 'Obtén un archivo de ejemplo con la estructura correcta y todos los campos necesarios.'],
    ['create-outline', 'Completa tus datos', 'Ábrelo en Excel y agrega los programas, fichas, aprendices e instructores de tu centro.'],
    ['cloud-upload-outline', 'Sube y valida', 'FaceLit procesa la información y te muestra claramente qué se creó o necesita corrección.'],
  ];

  return (
    <Animated.View style={[modern.wrap, { opacity: fade, transform: [{ translateY: lift }] }]}>
      <LinearGradient colors={isDark ? ['#10281B', '#08150F', '#050B08'] : ['#EAF8EC', '#F8FCF8', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[modern.panel, { borderColor: border }]}>
        <View style={[modern.glow, { backgroundColor: theme.primary + '18' }]} />
        <View style={[modern.hero, compact && modern.heroCompact]}>
          <View style={modern.heroCopy}>
            <View style={[modern.eyebrow, { backgroundColor: soft, borderColor: border }]}>
              <Ionicons name={'sparkles-outline'} size={15} color={theme.primary} />
              <Text style={[modern.eyebrowText, { color: theme.primary }]}>CONFIGURACIÓN INICIAL</Text>
            </View>
            <Text style={[modern.title, { color: text }]}>Tu gestión académica, lista en minutos</Text>
            <Text style={[modern.subtitle, { color: muted }]}>Importa programas, fichas, aprendices e instructores en un solo archivo. Te acompañamos paso a paso para que todo quede organizado.</Text>
            <View style={modern.benefits}>
              {['Carga masiva de archivos de 31 KB', 'Validación antes de guardar', 'Resumen claro de resultados'].map(item => (
                <View key={item} style={modern.benefit}><Ionicons name={'checkmark-circle'} size={18} color={theme.primary} /><Text style={[modern.benefitText, { color: text }]}>{item}</Text></View>
              ))}
            </View>
          </View>
          <Animated.View style={[modern.iconScene, { backgroundColor: soft, borderColor: border, transform: [{ scale: pulse }] }]}>
            <View style={[modern.iconRing, { borderColor: theme.primary + '55' }]}><Ionicons name={'school-outline'} size={58} color={theme.primary} /></View>
            <View style={[modern.fileBadge, { backgroundColor: theme.primary }]}><Ionicons name={'document-text'} size={20} color={Colors.white} /><Text style={modern.fileBadgeText}>CSV</Text></View>
          </Animated.View>
        </View>
        <Text style={[modern.kicker, { color: theme.primary }]}>CÓMO FUNCIONA</Text>
        <Text style={[modern.sectionTitle, { color: text }]}>Tres pasos, sin complicaciones</Text>
        <View style={[modern.steps, compact && modern.stepsCompact]}>
          {steps.map((step, index) => (
            <View key={step[1]} style={[modern.stepCard, { backgroundColor: isDark ? '#0B1711' : '#FFFFFF', borderColor: border }]}>
              <Text style={[modern.stepNumber, { color: theme.primary + '55' }]}>0{index + 1}</Text>
              <View style={[modern.stepIcon, { backgroundColor: soft, borderColor: border }]}><Ionicons name={step[0] as any} size={24} color={theme.primary} /></View>
              <Text style={[modern.stepTitle, { color: text }]}>{step[1]}</Text>
              <Text style={[modern.stepDesc, { color: muted }]}>{step[2]}</Text>
            </View>
          ))}
        </View>
        <View style={[modern.action, { backgroundColor: isDark ? '#0A1A11' : '#F1FAF2', borderColor: border }]}>
          <View style={modern.actionCopy}><Text style={[modern.actionTitle, { color: text }]}>¿Listo para comenzar?</Text><Text style={[modern.actionDesc, { color: muted }]}>Descarga la plantilla, complétala y deja que FaceLit haga el resto.</Text></View>
          <TouchableOpacity onPress={() => router.push('/admin/academic/csv-upload' as any)} activeOpacity={0.85} style={modern.buttonWrap}>
            <LinearGradient colors={['#72C96D', '#55AD52', '#3D8F43']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={modern.button}>
              <Ionicons name={'cloud-upload-outline'} size={21} color={Colors.white} /><Text style={modern.buttonText}>Cargar información por CSV</Text><Ionicons name={'arrow-forward'} size={19} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={modern.hint}><Ionicons name={'information-circle-outline'} size={17} color={muted} /><Text style={{ color: muted, fontSize: FontSize.xs }}>También puedes registrar programas y fichas manualmente desde los botones superiores.</Text></View>
      </LinearGradient>
    </Animated.View>
  );
}

const modern = StyleSheet.create({
  wrap: { flex: 1, padding: 24, alignItems: 'center' },
  panel: { width: '100%', maxWidth: 1180, borderRadius: 28, borderWidth: 1, padding: 32, overflow: 'hidden' },
  glow: { position: 'absolute', width: 360, height: 360, borderRadius: 180, right: -100, top: -180 },
  hero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 36, padding: 18, paddingBottom: 42 },
  heroCompact: { flexDirection: 'column-reverse', paddingHorizontal: 0 },
  heroCopy: { flex: 1, maxWidth: 650 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 18 },
  eyebrowText: { fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2 },
  title: { fontSize: 36, lineHeight: 43, fontWeight: FontWeight.black, marginBottom: 13 },
  subtitle: { fontSize: FontSize.base, lineHeight: 24, marginBottom: 21, maxWidth: 610 },
  benefits: { gap: 9 }, benefit: { flexDirection: 'row', alignItems: 'center', gap: 9 }, benefitText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  iconScene: { width: 190, height: 190, borderRadius: 52, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconRing: { width: 126, height: 126, borderRadius: 63, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  fileBadge: { position: 'absolute', right: 16, bottom: 16, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 12 },
  fileBadgeText: { color: Colors.white, fontSize: 12, fontWeight: FontWeight.black },
  kicker: { fontSize: 11, letterSpacing: 1.4, fontWeight: FontWeight.bold, marginBottom: 5 },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, marginBottom: 18 },
  steps: { width: '100%', flexDirection: 'row', gap: 14, marginBottom: 22 }, stepsCompact: { flexDirection: 'column' },
  stepCard: { flex: 1, minHeight: 190, borderRadius: 20, borderWidth: 1, padding: 20, overflow: 'hidden' },
  stepNumber: { position: 'absolute', right: 14, top: 5, fontSize: 44, fontWeight: FontWeight.black },
  stepIcon: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  stepTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: 7 }, stepDesc: { fontSize: FontSize.sm, lineHeight: 20 },
  action: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 18, borderRadius: 20, borderWidth: 1, padding: 20 },
  actionCopy: { flex: 1, minWidth: 230 }, actionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black, marginBottom: 4 }, actionDesc: { fontSize: FontSize.sm, lineHeight: 20 },
  buttonWrap: { borderRadius: 14, overflow: 'hidden' }, button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, paddingHorizontal: 22 },
  buttonText: { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  hint: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, marginTop: 17 },
});

export default function AcademicProgramsScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const {
    programs, allPrograms, allFichas, allInstructors, orphanLearners, search, setSearch, statusFilter, setStatusFilter, deactivateProgram, reactivateProgram, deleteProgram, deactivateFicha, reactivateFicha, deleteFicha,
    loading, loadError,
  } = useAcademic();
  const { alert, DialogUI } = useAppDialog();
  const { width } = useWindowDimensions();
  const isMobile = width < 480;
  const [viewMode] = useState<ViewMode>('programs');
  const [expandedFichaId, setExpandedFichaId] = useState<string | null>(null);
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [fichaModalOpen, setFichaModalOpen] = useState(false);

  // Programas activos disponibles para vincular una ficha desvinculada.
  const activePrograms = allPrograms.filter(p => p.status === 'active');

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = theme.surface;
  const border = theme.border;
  const inputBg = theme.inputBg;
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const filterOptions: { value: ProgramStatusFilter; label: string }[] = [
    { value: 'all', label: t('environments.filter.all') },
    { value: 'active', label: t('environments.filter.active') },
    { value: 'inactive', label: t('environments.filter.inactive') },
  ];

  // Eliminar (desactivación lógica) — solo disponible para programas Activos.
  const handleDeactivate = (id: string, name: string) => {
    alert(t('academic.programDelete'), `${name}\n\n${t('academic.programDeactivateConfirm')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('academic.programDelete'), style: 'destructive', onPress: async () => {
        try { await deactivateProgram(id); } catch (error: any) { alert(t('common.error'), error?.response?.data?.message ?? 'No se pudo actualizar el programa.'); }
      }},
    ]);
  };

  // Eliminar completamente — solo disponible para programas Inactivos.
  const handleDeleteCompletely = (id: string, name: string) => {
    alert(t('academic.programDeleteCompletely'), `${name}\n\n${t('academic.programDeleteCompletelyConfirm')}`, [
      { text: t('common.no'), style: 'cancel' },
      { text: t('common.yes'), style: 'destructive', onPress: async () => {
        try { await deleteProgram(id); alert('✓', t('academic.programDeleteCompletelySuccess')); }
        catch (error: any) { alert(t('common.error'), error?.response?.data?.message ?? 'No se pudo eliminar el programa.'); }
      }},
    ]);
  };

  const handleReactivate = (id: string, name: string) => {
    alert(t('academic.alreadyActive'), `${name}\n\n${t('environments.reactivateConfirm')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('environments.reactivate'), onPress: async () => {
        try { await reactivateProgram(id); } catch (error: any) { alert(t('common.error'), error?.response?.data?.message ?? 'No se pudo reactivar el programa.'); }
      } },
    ]);
  };

  const handleReactivateFicha = (id: string, number: string) => {
    alert(t('academic.alreadyActive'), `${number}\n\n${t('environments.reactivateConfirm')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('environments.reactivate'), onPress: async () => {
        try { await reactivateFicha(id); } catch (error: any) { alert(t('common.error'), error?.response?.data?.message ?? 'No se pudo reactivar la ficha.'); }
      } },
    ]);
  };

  const handleDeactivateFicha = (id: string, number: string) => {
    alert(t('academic.deactivateFicha'), `${number}\n\n${t('academic.confirmDeactivateFicha')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('academic.deactivateFicha'), style: 'destructive', onPress: async () => {
        try { await deactivateFicha(id); } catch (error: any) { alert(t('common.error'), error?.response?.data?.message ?? 'No se pudo actualizar la ficha.'); }
      } },
    ]);
  };

  // Eliminar completamente — solo disponible para fichas Inactivas.
  const handleDeleteFichaCompletely = (id: string, number: string) => {
    alert(t('academic.fichaDeleteCompletely'), `${number}\n\n${t('academic.fichaDeleteCompletelyConfirm')}`, [
      { text: t('common.no'), style: 'cancel' },
      { text: t('common.yes'), style: 'destructive', onPress: async () => {
        try { await deleteFicha(id); alert('✓', t('academic.fichaDeleteCompletelySuccess')); }
        catch (error: any) { alert(t('common.error'), error?.response?.data?.message ?? 'No se pudo eliminar la ficha.'); }
      }},
    ]);
  };

  const activeFichaRefs = allFichas.filter(f => f.status === 'active');

  // Muestra el onboarding solo si la base academica esta completamente vacia.
  const hasData =
    allPrograms.length > 0 ||
    allFichas.length > 0 ||
    allInstructors.length > 0 ||
    orphanLearners.length > 0 ||
    allFichas.some(ficha => ficha.learners.length > 0);

  const tabTitles: Record<ViewMode, string> = {
    programs: t('academic.programs'),
    unlinked: t('academic.unlinkedFichas'),
    orphans: t('academic.orphanLearners'),
  };
  const tabSubtitles: Record<ViewMode, string> = {
    programs: t('academic.programsListSubtitle', 'Consulta, filtra y administra los programas de formación y sus fichas asociadas.'),
    unlinked: t('academic.unlinkedListSubtitle', 'Fichas sin programa asociado. Vincúlalas a un programa activo o gestiona su ciclo de vida.'),
    orphans: t('academic.orphanLearnersSubtitle', 'Aprendices trasladados que quedaron sin ficha, a la espera de unirse a otra con un código.'),
  };

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
            <Text style={[aps.addBtnText, { color: theme.primary }]}>{t('academic.instructors')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/admin/academic/assignments' as any)} style={[aps.addBtn, isMobile && aps.addBtnMobile, { backgroundColor: theme.primary + '18', borderWidth: 1.5, borderColor: theme.primary }]} activeOpacity={0.85}>
            <Ionicons name="swap-horizontal-outline" size={18} color={theme.primary} />
            <Text style={[aps.addBtnText, { color: theme.primary }]}>{t('academic.learners')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/admin/academic/csv-upload' as any)} style={[aps.addBtn, isMobile && aps.addBtnMobile, { backgroundColor: isDark ? '#1A2E1A' : '#E8F5E9', borderWidth: 1.5, borderColor: theme.primary }]} activeOpacity={0.85}>
            <Ionicons name="cloud-upload-outline" size={18} color={theme.primary} />
            <Text style={[aps.addBtnText, { color: theme.primary }]}>{t('academic.csvUploadShort')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setProgramModalOpen(true)} style={[aps.addBtn, isMobile && aps.addBtnMobile, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={aps.addBtnText}>{t('academic.programRegister')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFichaModalOpen(true)} style={[aps.addBtn, isMobile && aps.addBtnMobile, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={aps.addBtnText}>{t('academic.fichaRegister')}</Text>
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

const aps = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerMobile: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  headerButtons: { flexDirection: 'row', gap: 8 },
  headerButtonsMobile: { flexDirection: 'column', alignSelf: 'stretch' },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 6 },
  headingCopy: { flex: 1 },
  subtitle: { fontSize: FontSize.sm, lineHeight: 19 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  addBtnMobile: { justifyContent: 'center', paddingVertical: 13, alignSelf: 'stretch' },
  addBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginVertical: 10, height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: FontSize.md, outlineStyle: 'none' } as any,
  tabRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginTop: 4, marginBottom: 8, flexWrap: 'wrap' },
  tabChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.2, flexShrink: 1 },
  tabChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, flexShrink: 1 },
  filterRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.2 },
  filterChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  infoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  infoBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  unlinkedCard: { flexDirection: 'column', alignItems: 'stretch' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: 2 },
  cardSub: { fontSize: FontSize.sm, marginBottom: 4 },
  cardMeta: { fontSize: FontSize.sm, marginTop: 2 },
  cardDates: { fontSize: FontSize.xs, marginBottom: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  recentBadge: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  cardActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  actionBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  programPicker: { marginTop: 12, gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(101,179,97,0.15)', paddingTop: 12 },
  hintBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 12 },
  programOption: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1.2, paddingHorizontal: 12, paddingVertical: 10 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: FontSize.base },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  loadingText: { fontSize: FontSize.sm, textAlign: 'center' },
});
