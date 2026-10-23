# Entrada de escritorio y movil — 22/10/2026

## Cambio realizado

- `app/index.tsx`: un control de entrada decide si muestra la landing existente o redirige. El cuerpo original de la landing, sus estilos y el boton al login se conservan.
- `shared/utils/entryPlatform.ts`: deteccion por plataforma nativa e informacion del navegador; no usa el ancho de la ventana. Incluye celulares Android/iPhone y tabletas Android/iPad, incluido iPadOS que se identifica como Mac con pantalla tactil.
- Se conserva una pantalla neutra durante la deteccion inicial, tambien en el HTML estatico, para no mostrar primero la landing en moviles. La redireccion espera la restauracion de sesion y que el router este listo.
- Los usuarios moviles sin sesion van a `/auth/login`; con sesion valida van al destino existente de su rol. No se borran tokens ni se modifica la autenticacion.
- Se mantiene el registro del coordinador y CSV, segun la aclaracion del usuario. No se agrega registro publico ni se modifican el Backend, la base de datos o el almacenamiento de contrasenas.

## Validacion automatica

`node scripts/test-entry-platform.cjs` comprueba:

- Computadores Windows/macOS/Linux, incluida ventana estrecha y computador tactil: conservan landing.
- Android/iOS nativos, navegadores Android/iPhone, tabletas Android/iPad e iPadOS: destino movil.
- El primer render y el HTML previo a la deteccion no contienen la landing; se espera la sesion y el router antes de redirigir.
- Sesiones activas conservan su destino por rol; el login sigue siendo la ruta existente.
- El cuerpo de la landing se compara con Git, normalizando solamente saltos de linea de Windows: permanece intacto, incluido el boton de acceso.
- Los servicios existentes de creacion administrativa, login, perfil y cierre de sesion funcionan con respuestas simuladas del Backend. Propagan rechazos por duplicados y credenciales incorrectas.
- El token se guarda usando los adaptadores existentes: localStorage en web y SecureStore en Android/iOS. La prueba recrea los modulos para comprobar que leen el token almacenado al volver a abrir, sin almacenar la contrasena.

Tambien se ejecutan TypeScript (`tsc --noEmit`) y ESLint sobre los archivos del cambio. La landing mantiene una advertencia previa de dependencias de sus animaciones.

Resultados obtenidos:

- TypeScript: sin errores.
- Pruebas de entrada y servicios: correctas en los tres adaptadores de plataforma simulados (web, Android, iOS).
- ESLint: sin errores; una advertencia previa en las animaciones de la landing. Detector y script de prueba sin advertencias.
- Exportacion web con Expo: correcta en `.expo/entry-validation`. La comprobacion `node scripts/test-entry-platform.cjs --exported-web` confirma que el HTML inicial no incluye la landing y que `/auth/login` conserva el campo de contrasena.
- Exportacion Android con Expo: correcta en `.expo/entry-native-validation`, con paquete Hermes generado. Esto verifica compilacion, no una instalacion o sesion real en un dispositivo fisico.
- `git diff --check`: correcto.

Estas pruebas no crean cuentas reales, no envian correos y no demuestran por si solas persistencia en PostgreSQL. La prueba de una cuenta real recien registrada, su login en dispositivos fisicos y su permanencia en la base de datos requiere ejecutar el sistema conectado al Backend correspondiente. No se ha realizado esa prueba de extremo a extremo.

## Cambios de la companera

Se comprobaron los SHA-256 antes y despues. No se modificaron:

- `features/auth/components/FaceGuideOverlay.tsx`
- `features/auth/components/WebCamera.tsx`
- `features/auth/hooks/useFacialRegistration.ts`
- `features/facial/useSessionAttendanceCapture.ts`

## Comprobacion manual al ejecutar la aplicacion

1. En computador, abrir `/`: comprobar landing, tema, idioma y ambos botones existentes. Reducir la ventana y confirmar que no redirige.
2. En celular/tableta sin sesion, abrir `/` y recargar: comprobar login directo sin ver la landing. Entrar tambien directamente a `/auth/login`.
3. Iniciar sesion con una cuenta de prueba creada mediante los flujos actuales de coordinador o CSV; comprobar el destino de su rol y la recuperacion existente.
4. Cerrar y volver a abrir la aplicacion con una sesion aun vigente: comprobar restauracion. Confirmar mediante los servicios administrativos que el usuario sigue registrado.

No se han hecho commit, push ni despliegue de este ajuste.
