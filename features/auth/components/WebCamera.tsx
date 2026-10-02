// ─────────────────────────────────────────────
//  features/auth/components/WebCamera.tsx
//  Cámara web con análisis en tiempo real.
//
//  Analiza cada frame para detectar:
//  • Iluminación (brillo promedio)
//  • Sobreexposición (brillo excesivo)
//  • Desenfoque (varianza del Laplaciano)
//  • Contraste insuficiente
//  • Posible foto/pantalla (uniformidad de textura)
//  • Presencia aproximada de piel/rostro (ratio de píxeles cálidos)
//
//  El resultado se pasa a FaceGuideOverlay para
//  mostrar el mensaje más prioritario en tiempo real.
// ─────────────────────────────────────────────
import type { CaptureQuality, ScreenState } from '@/features/auth/hooks/useFacialRegistration';
import { getAverageBrightness } from '@/features/auth/hooks/useFacialRegistration';
import { Colors } from '@/shared/constants/colors';
import { FontSize } from '@/shared/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import FaceGuideOverlay from './FaceGuideOverlay';
import ShutterButton from './ShutterButton';

// ── Umbrales de análisis ──────────────────────
const ANALYSIS_INTERVAL_MS = 300;
const MIN_BRIGHTNESS       = 55;   // muy oscuro
const MAX_BRIGHTNESS       = 235;  // sobreexpuesto
const MIN_CONTRAST         = 20;   // contraste mínimo (std de luminancia)

// ── Tipo de advertencia en tiempo real ────────
export type LiveWarning =
  | 'none'          // todo OK (sin movimiento, sin advertencias)
  | 'lowLight'      // poca luz
  | 'highLight'     // demasiada luz
  | 'lowContrast'   // imagen sin contraste (foto plana / pantalla)
  | 'noSkin'        // no se detecta tono cálido en el centro
  | 'skinTooClose'  // el tono cálido ocupa casi todo el frame
  | 'skinOffCenter' // el blob de tono cálido está fuera del centro
  | 'moving'        // movimiento detectado entre frames
  | 'stabilizing';  // está quieto pero acumulando frames de confirmación

// ── Umbrales de movimiento ─────────────────────
// Diferencia media de luminancia entre frame actual y anterior.
// Si supera este valor → hay movimiento.
const MOTION_THRESHOLD      = 12;   // 0-255 — sensibilidad media
// Frames consecutivos sin advertencias necesarios para "listo"
const REQUIRED_STABLE_FRAMES = 5;

// ── Análisis de píxeles ───────────────────────
function analyzeFrame(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const step = 4;
  const x0 = Math.floor(W * 0.10); const y0 = Math.floor(H * 0.10);
  const rw = Math.floor(W * 0.80); const rh = Math.floor(H * 0.80);

  let data: ImageData;
  try { data = ctx.getImageData(x0, y0, rw, rh); } catch { return null; }

  const px = data.data;
  let sumLum = 0; let count = 0;
  const lumVals: number[] = [];
  let warmCount = 0; let warmSumX = 0; let warmSumY = 0;
  let warmMinX = 1; let warmMaxX = 0;
  let warmMinY = 1; let warmMaxY = 0;

  for (let y = 0; y < rh; y += step) {
    for (let x = 0; x < rw; x += step) {
      const i = (y * rw + x) * 4;
      const r = px[i]!; const g = px[i+1]!; const b = px[i+2]!;
      const lum = r * 0.299 + g * 0.587 + b * 0.114;
      sumLum += lum; lumVals.push(lum); count++;

      // Píxel de tono cálido: rojo > verde, rojo > azul
      const isWarm = r > 80 && r > g * 1.05 && r > b * 1.10 && lum > 60 && lum < 240;
      if (isWarm) {
        const nx = (x0 + x) / W;
        const ny = (y0 + y) / H;
        warmCount++;
        warmSumX += nx; warmSumY += ny;
        if (nx < warmMinX) warmMinX = nx;
        if (nx > warmMaxX) warmMaxX = nx;
        if (ny < warmMinY) warmMinY = ny;
        if (ny > warmMaxY) warmMaxY = ny;
      }
    }
  }

  const brightness = sumLum / count;
  let sqSum = 0;
  for (const l of lumVals) sqSum += (l - brightness) ** 2;
  const contrast = Math.sqrt(sqSum / count);

  const warmRatio   = warmCount / count;
  const warmCenterX = warmCount > 0 ? warmSumX / warmCount : 0.5;
  const warmCenterY = warmCount > 0 ? warmSumY / warmCount : 0.5;

  // Densidad: cuán compacto es el blob.
  // Si los píxeles de piel están dispersos por todo el frame (fondo cálido),
  // el bounding box es grande relativo al número de píxeles → baja densidad.
  // Si son un rostro concentrado → bounding box pequeño → alta densidad.
  let warmDensity = 0;
  if (warmCount > 10) {
    const bbArea = (warmMaxX - warmMinX) * (warmMaxY - warmMinY);
    // Densidad = ratio / área del bounding box normalizada
    // Alto = píxeles de piel concentrados en zona pequeña
    warmDensity = bbArea > 0 ? warmRatio / bbArea : 1;
    // Normalizar: un rostro de ~15% del frame en un bb de ~0.1 = densidad ~1.5
    // Limitar a 0-1 para comparación
    warmDensity = Math.min(warmDensity / 2, 1);
  }

  return { brightness, contrast, warmRatio, warmCenterX, warmCenterY, warmDensity };
}

function computeWarning(
  brightness: number, contrast: number,
  warmRatio: number, warmCenterX: number, warmCenterY: number,
  warmDensity: number,   // qué tan concentrado está el blob (0-1: disperso, alto: concentrado)
): LiveWarning {
  if (brightness < MIN_BRIGHTNESS)  return 'lowLight';
  if (brightness > MAX_BRIGHTNESS)  return 'highLight';
  if (contrast   < MIN_CONTRAST)    return 'lowContrast';

  // Sin tono cálido suficiente → no hay rostro
  // Umbral subido a 0.06 (6%) para evitar falsos positivos con fondos cálidos
  if (warmRatio  < 0.06)            return 'noSkin';

  // Tono cálido muy disperso (baja densidad) → fondo/objeto, no un rostro concentrado
  // Un rostro real tiene los píxeles de piel agrupados, no distribuidos por todo el frame
  if (warmDensity < 0.35 && warmRatio < 0.25) return 'noSkin';

  if (warmRatio  > 0.68)            return 'skinTooClose';

  // Centro del blob fuera del área central
  if (
    warmCenterX < 0.22 || warmCenterX > 0.78 ||
    warmCenterY < 0.15 || warmCenterY > 0.82
  ) return 'skinOffCenter';

  return 'none';
}

// ── Tipos ─────────────────────────────────────
interface WebCameraProps {
  primaryColor:  string;
  isTaking:      boolean;
  isPositioning: boolean;
  screenState:   ScreenState;
  quality:       CaptureQuality;
  onCapture:     (dataUri: string, brightness: number) => void;
  onShutter:     () => void;
  onConfirm:     () => void;
  onCancel:      () => void;
}

export default function WebCamera({
  primaryColor, isTaking, isPositioning, screenState, quality,
  onCapture, onShutter, onConfirm, onCancel,
}: WebCameraProps) {
  const { t } = useTranslation();
  const videoRef      = useRef<HTMLVideoElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const analysisRef   = useRef<HTMLCanvasElement | null>(null);
  // Buffer del frame anterior (luminancias) para detección de movimiento
  const prevLumRef    = useRef<Float32Array | null>(null);
  // Contador de frames consecutivos sin ninguna advertencia
  const stableCount   = useRef(0);

  const [ready,   setReady]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [warning, setWarning] = useState<LiveWarning>('noSkin');
  // stableFrames: cuántos frames OK consecutivos hay (0 a REQUIRED_STABLE_FRAMES)
  const [stableFrames, setStableFrames] = useState(0);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      analysisRef.current = document.createElement('canvas');
    }
  }, []);

  // ── Loop de análisis en tiempo real ──────────
  useEffect(() => {
    if (!ready || screenState === 'confirmationRequired' || screenState === 'idle') {
      // Reiniciar estabilidad al salir del estado activo
      stableCount.current = 0;
      setStableFrames(0);
      return;
    }

    const interval = setInterval(() => {
      const video  = videoRef.current;
      const canvas = analysisRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const W = video.videoWidth  || 320;
      const H = video.videoHeight || 240;
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);

      // ── Análisis del frame ──────────────────
      const result = analyzeFrame(ctx, W, H);
      if (!result) return;

      // ── Detección de movimiento ─────────────
      // Comparar luminancias del frame actual con el anterior
      // usando una cuadrícula reducida para eficiencia
      const MSTEP = 8;
      const mx0 = Math.floor(W * 0.2); const my0 = Math.floor(H * 0.2);
      const mrw = Math.floor(W * 0.6); const mrh = Math.floor(H * 0.6);
      let motionData: ImageData | null = null;
      try { motionData = ctx.getImageData(mx0, my0, mrw, mrh); } catch { /* noop */ }

      let motionScore = 0;
      if (motionData) {
        const mpx   = motionData.data;
        const mCols = Math.floor(mrw / MSTEP);
        const mRows = Math.floor(mrh / MSTEP);
        const mN    = mCols * mRows;
        const curLum = new Float32Array(mN);
        let mi = 0;
        for (let y = 0; y < mrh; y += MSTEP) {
          for (let x = 0; x < mrw; x += MSTEP) {
            const pi = (y * mrw + x) * 4;
            curLum[mi++] = (mpx[pi]! * 0.299 + mpx[pi+1]! * 0.587 + mpx[pi+2]! * 0.114);
          }
        }
        if (prevLumRef.current && prevLumRef.current.length === mN) {
          let diff = 0;
          for (let k = 0; k < mN; k++) diff += Math.abs(curLum[k]! - prevLumRef.current[k]!);
          motionScore = diff / mN;
        }
        prevLumRef.current = curLum;
      }

      const isMoving = motionScore > MOTION_THRESHOLD;

      // ── Calcular advertencia del frame ──────
      const frameWarning = computeWarning(
        result.brightness, result.contrast,
        result.warmRatio, result.warmCenterX, result.warmCenterY,
        result.warmDensity,
      );

      // Prioridad: advertencias de contenido > movimiento > estabilidad > OK
      let finalWarning: LiveWarning;
      if (frameWarning !== 'none') {
        finalWarning          = frameWarning;
        stableCount.current   = 0;
      } else if (isMoving) {
        finalWarning          = 'moving';
        stableCount.current   = 0;
      } else {
        // Frame OK y sin movimiento — acumular para estabilidad
        stableCount.current = Math.min(stableCount.current + 1, REQUIRED_STABLE_FRAMES);
        finalWarning = stableCount.current < REQUIRED_STABLE_FRAMES ? 'stabilizing' : 'none';
      }

      setWarning(finalWarning);
      setStableFrames(stableCount.current);
    }, ANALYSIS_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [ready, screenState]);

  // ── Stream de cámara ──────────────────────────
  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setReady(true);
          };
        }
      })
      .catch(() => { if (!cancelled) setError(t('facialReg.permissionDenied')); });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [t]);

  // ── Captura ───────────────────────────────────
  const capture = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !ready) return;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const brightness = getAverageBrightness(canvas);
    onCapture(canvas.toDataURL('image/jpeg', 0.85), brightness);
    onShutter();
  }, [ready, onCapture, onShutter]);

  if (error) {
    return (
      <View style={wc.centerBox}>
        <Ionicons name="alert-circle-outline" size={36} color={Colors.error} />
        <Text style={wc.errorText}>{error}</Text>
      </View>
    );
  }

  // Shutter habilitado SOLO cuando:
  // • screenState === 'ready'
  // • warning === 'none' (sin advertencias NI movimiento NI stabilizing)
  // → 'stabilizing' bloquea hasta tener REQUIRED_STABLE_FRAMES frames quietos
  const shutterDisabled =
    isTaking ||
    screenState === 'confirmationRequired' ||
    screenState === 'positioning' ||
    (screenState === 'ready' && warning !== 'none');

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* @ts-ignore */}
      <video
        ref={videoRef}
        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: ready ? 'block' : 'none' }}
        muted playsInline autoPlay
      />
      {/* @ts-ignore */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {!ready && (
        <View style={wc.centerBox}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={wc.loadingText}>{t('facialReg.requestingPermission')}</Text>
        </View>
      )}

      {ready && (
        <FaceGuideOverlay
          primaryColor={primaryColor}
          isPositioning={isPositioning}
          screenState={screenState}
          quality={quality}
          liveWarning={warning}
          stableFrames={stableFrames}
          requiredFrames={REQUIRED_STABLE_FRAMES}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      )}

      {/* ShutterButton con zIndex alto para que no quede tapado */}
      {ready && (
        // @ts-ignore
        <View style={{ position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center', zIndex: 100 }}>
          <ShutterButton
            primaryColor={primaryColor}
            disabled={shutterDisabled}
            loading={isTaking}
            onPress={capture}
          />
        </View>
      )}
    </View>
  );
}

const wc = StyleSheet.create({
  centerBox:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 },
  errorText:   { color: Colors.error,  fontSize: FontSize.md, textAlign: 'center', lineHeight: 19 },
  loadingText: { color: '#AAAAAA',     fontSize: FontSize.md },
});
