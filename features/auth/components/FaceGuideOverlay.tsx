// ─────────────────────────────────────────────
//  features/auth/components/FaceGuideOverlay.tsx
//  Marco guía oval + mensajes dinámicos.
//
//  Prioridad de mensajes (mayor a menor):
//  1. Modal de confirmación (bloqueante)
//  2. Advertencia en tiempo real del frame
//     (luz, contraste, posición, pantalla)
//  3. Posicionando → instrucciones rotativas
//  4. "Posición correcta" (cuando todo OK)
// ─────────────────────────────────────────────
import type { LiveWarning } from '@/features/auth/components/WebCamera';
import type { CaptureQuality, ScreenState } from '@/features/auth/hooks/useFacialRegistration';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FaceGuideOverlayProps {
  primaryColor:  string;
  isPositioning: boolean;
  screenState:   ScreenState;
  quality:       CaptureQuality;
  liveWarning?:  LiveWarning;
  requiresLiveness?: boolean;
  livenessCaptureActive?: boolean;
  livenessInstruction?: string;
  /** Frames consecutivos sin advertencias acumulados */
  stableFrames?:   number;
  /** Frames necesarios para habilitar captura */
  requiredFrames?: number;
  onConfirm?:    () => void;
  onCancel?:     () => void;
}

// ── Mapeo de advertencia → mensaje + icono ────
const STATE_RED = Colors.error;
const STATE_YELLOW = Colors.warning;
const STATE_BLUE = Colors.info;
const STATE_GREEN = Colors.success;

const WARNING_CONFIG: Record<LiveWarning, { icon: string; key: string; color: string; fallback: string }> = {
  none:          { icon: 'checkmark-circle',         key: 'facialReg.goodPosition',  color: STATE_BLUE,   fallback: 'Posición correcta'                        },
  lowLight:      { icon: 'sunny-outline',             key: 'facialReg.goodLighting',  color: STATE_YELLOW, fallback: 'Mantenga una iluminación adecuada'        },
  highLight:     { icon: 'sunny',                     key: 'facialReg.goodLighting',  color: STATE_YELLOW, fallback: 'Demasiada luz. Evita la luz directa'      },
  lowContrast:   { icon: 'phone-portrait-outline',    key: 'facialReg.noScreenPhoto', color: STATE_RED,    fallback: 'No fotografíes una pantalla o foto impresa'},
  noSkin:        { icon: 'person-outline',            key: 'facialReg.noFaceDetected',color: STATE_RED,    fallback: 'No se detecta ningún rostro'              },
  skinTooClose:  { icon: 'arrow-back-circle-outline', key: 'facialReg.faceTooCLose',  color: STATE_BLUE,   fallback: 'Aléjate un poco de la cámara'             },
  skinOffCenter: { icon: 'scan-outline',              key: 'facialReg.faceOffCenter', color: STATE_BLUE,   fallback: 'Centra tu rostro dentro del óvalo'        },
  moving:        { icon: 'move-outline',              key: 'facialReg.moving',        color: STATE_BLUE,   fallback: 'Mantente quieto para capturar'            },
  stabilizing:   { icon: 'timer-outline',             key: 'facialReg.stabilizing',   color: STATE_BLUE,   fallback: 'Mantén la posición…'                     },
};

const ROTATION_MS = 2000;

// Instrucciones rotativas durante posicionamiento (sin advertencia activa)
const POSITIONING_KEYS = [
  { icon: 'person-outline',         key: 'facialReg.instr1'        },
  { icon: 'sunny-outline',          key: 'facialReg.instr2'        },
  { icon: 'eye-outline',            key: 'facialReg.instr3'        },
  { icon: 'glasses-outline',        key: 'facialReg.instr4'        },
  { icon: 'phone-portrait-outline', key: 'facialReg.noPhonePhoto'  },
  { icon: 'camera-outline',         key: 'facialReg.instr5'        },
] as const;

const POSITIONING_FALLBACKS = [
  'Ubíquese frente a la cámara',
  'Mantenga una iluminación adecuada',
  'Mire directamente a la cámara',
  'Evite usar gafas oscuras o sombreros',
  'No fotografíes una pantalla o foto impresa',
  'El sistema capturará una imagen frontal del rostro',
] as const;

export default function FaceGuideOverlay({
  primaryColor, isPositioning, screenState, quality,
  liveWarning, requiresLiveness = false, livenessCaptureActive = false,
  livenessInstruction,
  stableFrames = 0, requiredFrames = 5, onConfirm, onCancel,
}: FaceGuideOverlayProps) {
  const { t } = useTranslation();
  const [posIdx, setPosIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const renderOvalMessage = (
    color: string,
    icon: string,
    message: string,
    borderStyle: 'solid' | 'dashed' = 'solid',
    showStability = false,
  ) => {
    const pct = Math.round((stableFrames / requiredFrames) * 100);
    return (
      <View style={[s.container, { pointerEvents: 'none' } as any]}>
        <View style={s.ovalWrap}>
          <View style={[s.oval, { borderColor: color, borderStyle }]} />
          <View style={[s.badge, { backgroundColor: color + 'F2' }]}>
            <Ionicons name={icon as any} size={16} color={Colors.white} />
            <Text style={s.badgeText} numberOfLines={2}>{message}</Text>
          </View>
        </View>
        {showStability && (
          <View style={s.stabilityTrack}>
            <View style={[s.stabilityFill, { width: `${pct}%` as any, backgroundColor: Colors.success }]} />
          </View>
        )}
      </View>
    );
  };

  // Rotar instrucciones solo durante posicionamiento sin advertencia real
  const noActiveWarning = !liveWarning || liveWarning === 'none';
  useEffect(() => {
    if (isPositioning && noActiveWarning) {
      timer.current = setInterval(
        () => setPosIdx(i => (i + 1) % POSITIONING_KEYS.length),
        ROTATION_MS,
      );
    } else {
      if (timer.current) clearInterval(timer.current);
      setPosIdx(0);
    }
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [isPositioning, noActiveWarning]);

  // ── 1. Modal de confirmación (bloqueante) ────
  if (screenState === 'confirmationRequired') {
    return (
      <View style={s.confirmOverlay}>
        <View style={s.confirmCard}>
          <View style={[s.iconWrap, { backgroundColor: Colors.warning + '20' }]}>
            <Ionicons name="warning-outline" size={32} color={Colors.warning} />
          </View>
          <Text style={s.confirmTitle}>{t('facialReg.confirmTitle')}</Text>
          <Text style={s.confirmBody}>{t('facialReg.responsibilityWarning')}</Text>
          <View style={s.btnRow}>
            <TouchableOpacity
              style={[s.btn, s.cancelBtn]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={s.cancelText}>{t('facialReg.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: primaryColor, borderRadius: 12 }]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={s.acceptText}>{t('facialReg.accept')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (requiresLiveness && livenessCaptureActive) {
    return renderOvalMessage(
      STATE_GREEN,
      'sync-outline',
      livenessInstruction || t('facialReg.livenessCapturing', 'Mueve la cabeza suavemente hacia un lado'),
      'solid',
    );
  }

  if (screenState === 'idle') {
    return renderOvalMessage(
      STATE_RED,
      'person-outline',
      t('facialReg.noFaceDetected', 'No se detecta ningún rostro'),
      'dashed',
    );
  }

  if (screenState === 'captured') {
    return renderOvalMessage(
      STATE_GREEN,
      'scan-outline',
      livenessInstruction || t('facialReg.livenessCapturing', 'Validando prueba de vida'),
      'solid',
    );
  }

  // ── 2. Advertencia en tiempo real (máxima prioridad) ──
  if (liveWarning && liveWarning !== 'none') {
    const cfg      = WARNING_CONFIG[liveWarning];
    const badgeCol = cfg.color;
    const isStabilizing = liveWarning === 'stabilizing';

    return renderOvalMessage(
      badgeCol,
      cfg.icon,
      t(cfg.key, cfg.fallback),
      isStabilizing ? 'solid' : 'dashed',
      isStabilizing,
    );
  }

  // ── 3. Posicionando — instrucciones rotativas ─
  if (isPositioning) {
    const instr    = POSITIONING_KEYS[posIdx];
    return renderOvalMessage(
      STATE_BLUE,
      instr.icon,
      t(instr.key, POSITIONING_FALLBACKS[posIdx]),
      'dashed',
    );
  }

  // ── 4. Estado ready sin advertencias → "Posición correcta" ──
  if (screenState === 'ready') {
    if (requiresLiveness) {
      return renderOvalMessage(
        STATE_GREEN,
        'body-outline',
        livenessInstruction || t('facialReg.livenessReady', 'Pulsa capturar y mueve la cabeza suavemente'),
        'solid',
      );
    }

    return renderOvalMessage(
      STATE_BLUE,
      'checkmark-circle',
      t('facialReg.goodPosition', 'Posición correcta, puedes capturar'),
      'solid',
    );
  }

  // Fallback — solo óvalo
  return (
    <View style={[s.container, { pointerEvents: 'none' } as any]}>
      <View style={[s.oval, { borderColor: STATE_BLUE }]} />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  oval: {
    width: 240, height: 300,
    borderRadius: 130,
    borderWidth: 2.5,
    borderStyle: 'dashed',
  },
  ovalWrap: {
    width: '100%',
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position:          'absolute',
    bottom:            56,
    alignSelf:         'center',
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               8,
    paddingHorizontal: 18,
    paddingVertical:   10,
    borderRadius:      24,
    width:             '76%',
    maxWidth:          430,
    shadowColor:       '#000',
    shadowOffset:      { width: 0, height: 2 },
    shadowOpacity:     0.4,
    shadowRadius:      6,
    elevation:         6,
  },
  livenessBadge: {
    bottom: 56,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  livenessHint: {
    position: 'absolute',
    bottom: 78,
    backgroundColor: 'rgba(0,0,0,0.58)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
    maxWidth: '86%',
  },
  livenessHintText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  badgeText: {
    color:      Colors.white,
    fontSize:   FontSize.base,
    fontWeight: FontWeight.black,
    flexShrink: 1,
    lineHeight: 18,
    textAlign: 'center',
  },

  // Modal de confirmación
  confirmOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  confirmCard: {
    backgroundColor: '#0D1F14', borderRadius: 20, padding: 24,
    width: '100%', maxWidth: 380, alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: 'rgba(101,179,97,0.20)',
  },
  iconWrap:    { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  confirmTitle:{ color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.black, textAlign: 'center' },
  confirmBody: { color: Colors.dark.textMuted, fontSize: FontSize.sm, lineHeight: 20, textAlign: 'center' },
  btnRow:      { flexDirection: 'row', gap: 12, marginTop: 4, width: '100%' },
  btn:         { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  cancelBtn:   { backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)' },
  cancelText:  { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  acceptText:  { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.black },

  // Barra de progreso de estabilidad — entre el badge y el botón
  stabilityTrack: {
    position:        'absolute',
    bottom:          96,          // encima del botón (bottom:20 + 64px + margen), debajo del badge
    width:           '50%',
    height:          5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius:    3,
    overflow:        'hidden',
  },
  stabilityFill: {
    height:       '100%',
    borderRadius: 2,
  },
});
