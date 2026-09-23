import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { api } from '@/shared/services/api';
import { useAuth } from '@/shared/contexts/AuthContext';
import { router } from 'expo-router';
import { ActiveChallenge, eyeOpenness, cosineSimilarity, validEmbedding, type FaceSample, type Pose } from '../liveness';

const instructions: Record<Pose, string> = {
  center: 'Mira de frente a la cámara',
  left: 'Gira despacio tu cara hacia tu izquierda',
  right: 'Gira despacio tu cara hacia tu derecha',
  blink: 'Mira de frente: abre los ojos, parpadea y vuelve a abrirlos',
  blink_twice: 'Mira de frente y parpadea dos veces, abriendo los ojos entre cada parpadeo',
  smile: 'Mira de frente con expresión neutra y luego sonríe',
};

export default function InstructorEnrollment() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState('Preparando registro…');
  const [step, setStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(7);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);
  const [savedPhoto, setSavedPhoto] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => stream?.getTracks().forEach(track => track.stop());
    const fail = (message: string) => {
      if (cancelled) return;
      stop(); setMessage(message); setError(true); setBusy(false);
    };
    function handleError(error: any) {
      const status = error?.response?.status;
      fail(status === 503 ? 'Verificación PAD no disponible. El registro está bloqueado hasta habilitarla.' :
        status === 422 ? 'No se confirmó una persona real. No se guardó el rostro. Vuelve a intentarlo.' :
        status === 409 ? 'Tu rostro ya está registrado.' : status === 410 ? 'La sesión venció. Vuelve a intentarlo.' :
        'No se pudo completar el registro. Revisa el permiso de cámara, la conexión y vuelve a intentarlo.');
    }
    const run = async () => {
      setError(false); setBusy(true); setDone(false); setStep(0); setSavedPhoto(undefined);
      setMessage('Cargando detector facial…');
      const status = await api.get('/api/facial/me');
      if (cancelled) return;
      const existingPhoto = status.data.registered && user?.role === 'APPRENTICE'
        ? (await api.get('/api/facial/profile-photo')).data.photo : undefined;
      const updatePhoto = status.data.registered && user?.role === 'APPRENTICE' && !existingPhoto;
      if (cancelled) return;
      setSavedPhoto(existingPhoto);
      if (status.data.registered && !updatePhoto) {
        setDone(true); setBusy(false); setMessage('Tu rostro ya está registrado.'); return;
      }
      if (!status.data.padAvailable) {
        fail('El registro está bloqueado: falta habilitar la verificación PAD en el servidor.'); return;
      }
      const { Human } = await import('@vladmandic/human/dist/human.esm.js');
      if (cancelled) return;
      const human = new Human({
        backend: 'webgl', modelBasePath: '/models/human/', cacheSensitivity: 0,
        validateModels: false, warmup: 'none',
        filter: { enabled: true, equalization: false, flip: false },
        face: {
          enabled: true,
          detector: { maxDetected: 2, minConfidence: 0.7, rotation: true, skipFrames: 0, skipTime: 0 },
          mesh: { enabled: true }, iris: { enabled: false }, emotion: { enabled: true, skipFrames: 0, skipTime: 0 },
          description: { enabled: true, skipFrames: 0, skipTime: 0 },
          antispoof: { enabled: true, skipFrames: 0, skipTime: 0 },
          liveness: { enabled: true, skipFrames: 0, skipTime: 0 },
        },
        body: { enabled: false }, hand: { enabled: false }, object: { enabled: false },
        gesture: { enabled: false },
      });
      await human.load();
      if (cancelled) return;
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false });
      if (cancelled) { stop(); return; }
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      const { data: challenge } = await api.post('/api/facial/challenge', null, { params: { updatePhoto: Boolean(updatePhoto) } });
      if (cancelled) { stop(); return; }
      const poses: Pose[] = challenge.poses;
      setTotalSteps(poses.length);
      setBusy(false);
      const samples: FaceSample[] = [];
      const evidence: { elapsedMs: number; jpeg: string }[] = [];
      const active = new ActiveChallenge();
      const started = performance.now();
      const capture = document.createElement('canvas');
      capture.width = 320; capture.height = 240;
      const captureContext = capture.getContext('2d');
      if (!captureContext) throw new Error('No se pudo iniciar la captura');
      let reference: number[] | undefined;
      let profilePhoto: string | undefined;
      let lastFrame = -1;
      const tick = async () => {
        if (cancelled) return;
        if (Date.now() >= Date.parse(challenge.expiresAt)) { fail('Se agotó el tiempo. Vuelve a intentarlo.'); return; }
        if (document.hidden || video.paused || video.readyState < 2 || video.currentTime === lastFrame) {
          fail('La captura se interrumpió. Vuelve a iniciar con la cámara activa y la aplicación visible.'); return;
        }
        lastFrame = video.currentTime;
        captureContext.drawImage(video, 0, 0, 320, 240);
        const elapsedMs = Math.floor(performance.now() - started);
        const jpeg = capture.toDataURL('image/jpeg', 0.8);
        if (evidence.length >= 240 || jpeg.length > 60000) { fail('La captura excedió el límite. Vuelve a intentarlo.'); return; }
        evidence.push({ elapsedMs, jpeg });
        const result = await human.detect(capture);
        if (cancelled) return;
        if (document.hidden || video.paused || stream?.getVideoTracks()[0]?.readyState !== 'live') {
          fail('La captura se interrumpió. Inicia un nuevo intento.'); return;
        }
        const face = result.face[0];
        let warning = '';
        if (result.face.length !== 1) warning = result.face.length > 1 ? 'Solo debe aparecer una persona.' : 'Coloca tu rostro dentro del óvalo.';
        else {
          const [x, y, w, h] = face.boxRaw;
          if (w < 0.20 || h < 0.25) warning = 'Acerca tu rostro; no puede estar al fondo.';
          else if (w > 0.88 || h > 0.95 || x < 0.01 || x + w > 0.99 || y < 0.01 || y + h > 0.99) warning = 'Centra tu rostro completo y aléjate un poco.';
          else if (!(face.real! >= 0.85 && face.live! >= 0.85)) warning = 'No se pudo confirmar presencia. Retira fotos o pantallas y mejora la iluminación.';
          else if (!validEmbedding(face.embedding) || !face.rotation) warning = 'Mantén tu rostro visible y bien iluminado.';
          else if (reference && cosineSimilarity(reference, face.embedding) < 0.45) warning = 'El rostro cambió. Repite la secuencia con la misma persona.';
        }
        if (warning) {
          if (reference) { fail(warning + ' Inicia un nuevo intento.'); return; }
          active.reset(); setMessage(warning);
        } else {
          const pose = poses[samples.length];
          const yaw = face.rotation!.angle.yaw;
          reference ??= face.embedding;
          setMessage(instructions[pose]);
          if (Math.abs(face.rotation!.angle.roll) < 0.40 && Math.abs(face.rotation!.angle.pitch) < 0.40) {
            const happy = face.emotion?.find(item => item.emotion === 'happy')?.score ?? 0;
            const completion = active.observe(pose, elapsedMs, yaw, eyeOpenness(face.mesh), happy);
            if (completion) {
              if (pose === 'center' && user?.role === 'APPRENTICE') {
                const canvas = document.createElement('canvas');
                canvas.width = 320; canvas.height = 320;
                const context = canvas.getContext('2d');
                if (!context) throw new Error('No se pudo capturar la foto');
                const [x, y, w, h] = face.boxRaw;
                const size = Math.min(Math.max(w * video.videoWidth, h * video.videoHeight) * 1.5, video.videoWidth, video.videoHeight);
                const left = Math.max(0, Math.min((x + w / 2) * video.videoWidth - size / 2, video.videoWidth - size));
                const top = Math.max(0, Math.min((y + h / 2) * video.videoHeight - size / 2, video.videoHeight - size));
                context.drawImage(video, left, top, size, size, 0, 0, 320, 320);
                profilePhoto = canvas.toDataURL('image/jpeg', 0.85);
              }
              samples.push({ pose, yaw, real: face.real!, live: face.live!, embedding: face.embedding!, elapsedMs, ...completion });
              active.reset(); setStep(samples.length);
            }
          } else { active.reset(); }
          if (samples.length === poses.length) {
            stop(); setBusy(true); setMessage('Verificando presencia antes de guardar…');
            await api.post('/api/facial/enrollment', { challengeId: challenge.id, samples, profilePhoto, evidence }, { timeout: 30000 });
            if (cancelled) return;
            setSavedPhoto(profilePhoto);
            setDone(true); setBusy(false); setMessage('Rostro registrado correctamente.'); return;
          }
        }
        timer = setTimeout(() => { void tick().catch(handleError); }, 40);
      };
      await tick();
    };
    void run().catch(handleError);
    return () => { cancelled = true; clearTimeout(timer); stop(); };
  }, [attempt, user?.id, user?.role]);

  return <View style={{ flex: 1, alignItems: 'center', padding: 20, gap: 16 }}>
    <Text style={{ color: 'white', fontSize: 22, fontWeight: '700', textAlign: 'center' }}>Registro de rostro</Text>
    <Text style={{ color: '#ddd', textAlign: 'center' }}>Busca buena luz. Mantén el celular quieto y mueve solo tu cabeza siguiendo las indicaciones.</Text>
    {!done && <View style={{ width: '100%', maxWidth: 560, aspectRatio: 4 / 3, overflow: 'hidden', borderRadius: 24 }}>
      <video ref={videoRef} muted playsInline autoPlay style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scaleX(-1)' }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: '22%', top: '8%', width: '56%', height: '84%', borderRadius: 200, borderWidth: 3, borderColor: error ? '#ff6b6b' : '#55dba0' }} />
    </View>}
    {busy && <ActivityIndicator color="#55dba0" />}
    {done && savedPhoto && <img src={savedPhoto} alt="Tu foto de perfil guardada" style={{ width: 120, height: 120, borderRadius: 60, objectFit: 'cover' }} />}
    {done && user?.role === 'APPRENTICE' && <TouchableOpacity onPress={() => router.push('/profile')} style={{ padding: 16, backgroundColor: '#167d54', borderRadius: 12 }}>
      <Text style={{ color: 'white' }}>Ver mi perfil</Text>
    </TouchableOpacity>}
    <Text accessibilityLiveRegion="polite" style={{ color: 'white', textAlign: 'center', fontSize: 19 }}>{message}</Text>
    {!done && <Text style={{ color: '#aaa' }}>Pasos completados: {step} / {totalSteps}</Text>}
    {error && <TouchableOpacity onPress={() => setAttempt(n => n + 1)} style={{ padding: 16, backgroundColor: '#167d54', borderRadius: 12 }}><Text style={{ color: 'white' }}>Intentar nuevamente</Text></TouchableOpacity>}
  </View>;
}
