# Registro facial y Presentation Attack Detection (PAD)

## Estado de la integración

El guardado está **bloqueado por defecto**. Este repositorio no incluye un servicio
PAD independiente entrenado y validado ni captura de profundidad de un sensor.
Se implementó el adaptador del backend, no un proveedor PAD. No configurar un
servicio simulado que responda siempre REAL: anularía la protección.

Human aporta detección facial, malla estimada, embeddings y modelos rápidos
AntiSpoof/Liveness. Sus puntuaciones son controles preliminares, no un dictamen
confiable. Su malla no mide profundidad física. Documentación oficial:
https://github.com/vladmandic/human/tree/main/demo/faceid

## Captura web

Instructor y aprendiz comparten `InstructorEnrollment.web.tsx`. El servidor genera
siete acciones con `SecureRandom`: cinco posiciones (frente, un lado, frente, otro
lado, frente), más parpadeo simple o doble y sonrisa, insertados en posiciones
aleatorias. El desafío pertenece al usuario del JWT, vence a los 90 segundos y
se consume una sola vez, incluso si falla PAD.

Cada posición requiere al menos 650 ms y cuatro observaciones. El parpadeo exige
abiertos → cerrados → abiertos en 60–800 ms; la sonrisa exige transición neutra →
sonrisa mantenida. Una interrupción temporal reinicia la acción. Perder el rostro,
cambiar de persona, ocultar la pestaña o fallar las puntuaciones una vez iniciado
el seguimiento exige un intento nuevo. Los umbrales son provisionales y necesitan
calibración con cámaras, personas y ataques reales.

Se envían hasta 240 fotogramas JPEG de 320×240 con marcas temporales junto con las
muestras. El backend limita tamaño, orden, duración y cobertura por acción.
Las marcas y puntuaciones del cliente son datos no confiables. La inferencia en
el navegador usa el mismo fotograma que se adjunta como evidencia. PAD debe
comprobar también que los embeddings y la foto corresponden a la evidencia.

## Contrato del adaptador PAD

Configurar en el backend `facial.pad.url` (variable `FACIAL_PAD_URL`, HTTPS) y
`facial.pad.token` (`FACIAL_PAD_TOKEN`). No se agregaron credenciales ni se modificó
`.env`. El navegador nunca recibe el token. Sin configuración, la interfaz informa
el bloqueo antes de abrir la cámara. Un error o timeout bloquea el guardado.

El adaptador hace POST autenticado mediante Bearer, con este cuerpo:

```json
{
  "userId": "UUID del usuario autenticado",
  "challenge": { "id": "UUID", "poses": ["center", "..."], "expiresAt": "ISO-8601" },
  "enrollment": {
    "challengeId": "UUID",
    "samples": [{ "pose": "center", "yaw": 0, "real": 0.95, "live": 0.95,
      "embedding": ["1024 números"], "elapsedMs": 1000, "durationMs": 800,
      "frames": 4, "blinks": 0, "smileTransition": false }],
    "profilePhoto": "data:image/jpeg;base64,... o null",
    "evidence": [{ "elapsedMs": 0, "jpeg": "data:image/jpeg;base64,..." }]
  }
}
```

El servicio debe analizar los fotogramas y devolver para ESA solicitud:

```json
{
  "userId": "mismo UUID", "challengeId": "mismo UUID", "liveness": "REAL",
  "depth": true, "textureAndReflection": true, "activeChallenge": true,
  "temporal": true, "faceAntiSpoof": true, "identityAndEmbeddingMatch": true
}
```

Únicamente REAL con todos los controles afirmativos y ambos UUID coincidentes
permite escribir. PHOTO, VIDEO, SCREEN, PRINT, UNKNOWN, resultados incompletos y
fallos se rechazan. El servicio debe rechazar evidencia insuficiente, decodificar
y validar los JPEG, verificar los gestos en orden, analizar textura/reflejos y
movimiento, ejecutar un modelo facial anti-spoof y comprobar la vinculación de
identidad. No puede copiar puntuaciones aportadas por el cliente.

`depth` requiere evidencia válida para la política de profundidad adoptada; no
debe marcarse verdadero por la simple presencia de una malla facial. Si se exige
profundidad física, esta captura RGB web es insuficiente: falta implementar un
SDK/sensor compatible y transportar su evidencia verificable. El contrato actual
no transporta mapas de profundidad. Mantener el bloqueo hasta completar esa parte.

## Persistencia y compatibilidad

Solo tras PAD se guardan los cinco embeddings de posición, conservando el formato
FLH1: cabecera y cinco vectores de 1024 floats big endian (20484 bytes). Las dos
acciones adicionales no cambian ese formato. También se protege la actualización
de foto de perfil. El cliente no puede autorizarse enviando `liveness: REAL`.
Los fotogramas no se guardan en la base de datos de esta aplicación; el servicio
externo debe definir su tratamiento y retención de evidencia biométrica.
El registro local antiguo a partir de una foto queda deshabilitado. La versión
nativa sigue bloqueada hasta disponer de una integración compatible.

Los registros existentes no se eliminan ni pasan a considerarse verificados por
esta modificación. Las sesiones siguen en memoria; varias instancias requieren
almacenamiento compartido o afinidad de sesión.

## Comprobación

Frontend: `npm run prepare:face-models`, `npm run test:liveness`, `npx tsc --noEmit`.
Backend: `mvnw.cmd "-Dtest=FacialEnrollmentControllerTest,RemotePadVerifierTest" test`.
Los tests verifican transiciones, inmovilidad, interrupciones, secuencia, evidencia,
rechazo PAD, identidad, consumo de sesiones y bloqueo previo a escribir.

Antes de habilitar registros faltan pruebas físicas con persona real, fotos,
impresiones y videos en pantallas; iluminación, tonos de piel, gafas y cámaras
variadas; y medición de aceptación de ataques y rechazo de personas reales.
Los tests unitarios no prueban la eficacia de detección de ataques físicos.
