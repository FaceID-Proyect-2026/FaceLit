# Registro facial guiado de instructor

La ruta `/instructor/facial/register` usa Human (BlazeFace, FaceMesh,
FaceRes, AntiSpoof y Liveness). Sustituye el análisis de colores de piel por
detección de un único rostro, tamaño y encuadre, estimación de giro y
comprobación de continuidad de identidad. No utiliza selección de archivos.

El servidor genera una secuencia de cinco posiciones (frente, un lado,
frente, otro lado, frente), con orden lateral aleatorio, asociada al usuario
autenticado y válida durante 90 segundos. Cada posición requiere al menos
tres inferencias y 650 ms. Si desaparece el rostro, aparece otra persona,
la pestaña se oculta o fallan los controles, se reinicia la secuencia.

## Ejecución

- Instalar dependencias normalmente; `postinstall` copia los cinco modelos
  desde el paquete instalado a `public/models/human`. Para instalaciones
  existentes ejecutar `npm run prepare:face-models`.
- Ejecutar el backend con la base de datos habitual. Deben existir las tablas
  `security.user_app` y `facialrecognition.user_face` del DDL del proyecto.
- Abrir la aplicación web desde localhost o HTTPS y permitir la cámara.
- La app nativa muestra que esta validación aún no está disponible y no permite
  guardar una foto sin verificar. Se necesita un detector nativo o SDK de
  prueba de vida para habilitar ese entorno.

## Persistencia y alcance

Los endpoints autenticados `/api/facial/me`, `/api/facial/challenge` y
`/api/facial/enrollment` trabajan exclusivamente sobre el usuario del JWT.
La selección de instructor en la configuración del ambiente no cambia esa identidad.
El registro guarda cinco vectores de 1024 floats en `biometric_vector`, no
fotografías ni video. Formato big endian: cabecera `FLH1` y los cinco vectores,
en orden de captura. Una fila activa no se sobrescribe; el bloqueo de la fila
del usuario serializa solicitudes concurrentes. No se modifica `.env`.
Los registros anteriores simulados del store no se migran a la base de datos.
Este cambio implementa registro, no identificación ni asistencia automática.

## Límites que requieren validación antes de producción

La inferencia y los indicadores `real`/`live` se calculan en el navegador.
El servidor valida formato, secuencia, sesión y similitud, pero NO vuelve a
analizar imágenes. Un cliente modificado puede falsificar esos indicadores.
Esto no es prueba de vida certificada ni ofrece garantías equivalentes a Nequi;
para esa protección debe integrarse un proveedor PAD que emita un resultado
verificable por el servidor o un servicio de inferencia independiente.
Los umbrales son iniciales y requieren pruebas con cámaras y personas reales.
Las sesiones se mantienen en memoria del backend: un reinicio las invalida y
varias instancias necesitan almacenamiento compartido o afinidad de sesión.

Pruebas manuales pendientes: persona real con ambos órdenes de giro, foto
impresa, foto y video en otro teléfono, rostro lejano, dos personas, cambio de
persona entre pasos, iluminación variada, permisos denegados, ocultar pestaña,
recarga tras guardar y pérdida de conexión al guardar. Verificar también la
dirección percibida de los giros en cámaras frontales.

Referencia de la biblioteca: https://github.com/vladmandic/human/wiki
