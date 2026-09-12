// ─────────────────────────────────────────────
//  features/auth/components/FaceGuideOverlay.tsx
//  Vista pura: marco guía + mensaje dinámico de
//  estado durante el registro facial.
//
//  Mensajes priorizados (un solo mensaje visible):
//  1. Confirmación de responsabilidad (modal bloqueante)
//  2. Luz insuficiente (detección real de brillo)
//  3. Posicionándose (simulación de acercamiento)
//  4. Ciclo de instrucciones preventivas
//  5. Posición correcta → listo para capturar
// ─────────────────────────────────────────────
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
  /** Llamado cuando el usuario acepta la confirmación de responsabilidad */
  onConfirm?: () => void;
  /** Llamado cuando el usuario cancela — cierra la cámara y vuelve atrás */
  onCancel?:  () => void;
}

// Instrucciones preventivas que rotan durante el posicionamiento
// (no implican detección real — son guías visuales para el usuario)
const INSTRUCTION_KEYS = [
  { icon: 'eye-outline',            key: 'lookAtCamera'    }, // Mire directamente a la cámara
  { icon: 'sunny-outline',          key: 'goodLighting'    }, // Iluminación adecuada
  { icon: 'glasses-outline',        key: 'avoidGlassesHats'}, // Sin gafas oscuras/sombreros
  { icon: 'phone-portrait-outline', key: 'noScreenPhoto'   }, // No fotografíes pantalla/foto impresa
  { icon: 'person-outline',         key: 'frontalCapture'  }, // Captura frontal
] as const;

const ROTATION_INTERVAL_MS = 2200;

export default function FaceGuideOverlay({
  primaryColor, isPositioning, screenState, quality, onConfirm, onCancel,
}: FaceGuideOverlayProps) {
  const { t } = useTranslation();
  const [instructionIdx, setInstructionIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rotar instrucciones solo mientras se está posicionando
  useEffect(() => {
    if (isPositioning) {
      timerRef.current = setInterval(() => {
        setInstructionIdx(i => (i + 1) % INSTRUCTION_KEYS.length);
      }, ROTATION_INTERVAL_MS);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setInstructionIdx(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPositioning]);

  // ── 1. Modal de confirmación de responsabilidad ───────────────────────
  // Bloqueante: el usuario DEBE aceptar explícitamente para poder capturar.
  // No se puede cerrar haciendo clic fuera ni con otro mecanismo.
  if (screenState === 'confirmationRequired') {
    return (
      <View style={s.confirmOverlay}>
        <View style={s.confirmCard}>
          {/* Icono */}
          <View style={[s.confirmIconWrap, { backgroundColor: Colors.warning + '20' }]}>
            <Ionicons name="warning-outline" size={32} color={Colors.warning} />
          </View>

          {/* Título */}
          <Text style={s.confirmTitle}>
            {t('facialReg.confirmTitle', 'Aviso de responsabilidad')}
          </Text>

          {/* Mensaje de responsabilidad */}
          <Text style={s.confirmBody}>
            {t(
              'facialReg.responsibilityWarning',
              'Si otra persona realiza el registro en tu lugar, la responsabilidad recaerá sobre tu cuenta. Para corregir un registro incorrecto deberás solicitar autorización al Coordinador.',
            )}
          </Text>

          {/* Botones */}
          <View style={s.confirmButtons}>
            <TouchableOpacity
              style={[s.confirmBtn, s.cancelBtn]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={s.cancelBtnText}>
                {t('facialReg.cancel', 'Cancelar')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.confirmBtn, s.acceptBtn, { backgroundColor: primaryColor }]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={s.acceptBtnText}>
                {t('facialReg.accept', 'Aceptar')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ── Prioridad de mensajes (estados no bloqueantes) ──────────────────
  const isReady    = screenState === 'ready';
  const isLowLight = quality === 'lowLight';

  const badgeColor = isLowLight    ? Colors.warning
                   : isPositioning ? Colors.warning
                   : primaryColor;

  let icon: string;
  let message: string;

  if (isLowLight) {
    icon    = 'sunny-outline';
    message = t('facialReg.goodLighting', 'Mantenga una iluminación adecuada');
  } else if (isPositioning) {
    const instr = INSTRUCTION_KEYS[instructionIdx];
    icon    = instr.icon;
    message = t(`facialReg.${instr.key}`);
  } else if (isReady) {
    icon    = 'checkmark-circle';
    message = t('facialReg.goodPosition', 'Posición correcta, puedes capturar');
  } else {
    // estado idle/captured — solo el óvalo guía, sin badge
    return (
      <View style={s.container} pointerEvents="none">
        <View style={[s.oval, { borderColor: primaryColor }]} />
      </View>
    );
  }

  return (
    <View style={s.container} pointerEvents="none">
      <View style={[s.oval, { borderColor: badgeColor }]} />
      <View style={[s.badge, { backgroundColor: badgeColor }]}>
        <Ionicons name={icon as any} size={14} color={Colors.white} />
        <Text style={s.badgeText} numberOfLines={2}>{message}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  // ── Overlay de guía (estados normales) ──────
  container: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  oval: {
    width: 170, height: 210,
    borderRadius: 90,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  badge: {
    position: 'absolute',
    bottom: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    maxWidth: '80%',
  },
  badgeText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    flexShrink: 1,
  },

  // ── Overlay modal de confirmación ───────────
  confirmOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    // pointerEvents: 'auto' por defecto — bloquea interacción con la cámara
  },
  confirmCard: {
    backgroundColor: '#0D1F14',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(101,179,97,0.20)',
  },
  confirmIconWrap: {
    width: 60, height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitle: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    textAlign: 'center',
  },
  confirmBody: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    width: '100%',
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  cancelBtnText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  acceptBtn: {
    // backgroundColor viene de primaryColor via prop
  },
  acceptBtnText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.black,
  },
});
