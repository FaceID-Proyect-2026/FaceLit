// ─────────────────────────────────────────────
//  features/auth/components/WebCamera.tsx
//  Vista pura: acceso a cámara del navegador para
//  web (getUserMedia). No contiene reglas de
//  negocio del flujo de registro, solo expone la
//  captura vía props (onCapture / onShutter).
// ─────────────────────────────────────────────
import { Colors } from '@/shared/constants/colors';
import { FontSize } from '@/shared/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { getAverageBrightness } from '@/features/auth/hooks/useFacialRegistration';
import FaceGuideOverlay from './FaceGuideOverlay';
import ShutterButton from './ShutterButton';

interface WebCameraProps {
  primaryColor: string;
  isTaking: boolean;
  isPositioning: boolean;
  onCapture: (dataUri: string, brightness: number) => void;
  onShutter: () => void;
}

export default function WebCamera({
  primaryColor, isTaking, isPositioning, onCapture, onShutter,
}: WebCameraProps) {
  const { t } = useTranslation();
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setReady(true);
          };
        }
      })
      .catch(() => {
        if (!cancelled) setError(t('facialReg.permissionDenied'));
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [t]);

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
    const dataUri = canvas.toDataURL('image/jpeg', 0.85);

    onCapture(dataUri, brightness);
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

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* @ts-ignore — elemento HTML nativo */}
      <video
        ref={videoRef}
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          transform: 'scaleX(-1)',
          display: ready ? 'block' : 'none',
        }}
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
        <FaceGuideOverlay primaryColor={primaryColor} isPositioning={isPositioning} />
      )}

      {ready && (
        <ShutterButton
          primaryColor={primaryColor}
          disabled={isTaking || isPositioning}
          loading={isTaking}
          onPress={capture}
        />
      )}
    </View>
  );
}

const wc = StyleSheet.create({
  centerBox:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 },
  errorText:   { color: Colors.error, fontSize: FontSize.md, textAlign: 'center', lineHeight: 19 },
  loadingText: { color: '#AAAAAA', fontSize: FontSize.md },
});
