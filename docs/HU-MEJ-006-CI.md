# HU-MEJ-006 — Corrección de lint en registro facial

Este documento conserva la evidencia del ajuste inicial de lint. La ampliación posterior a Jest/Testing Library, sus resultados y pendientes se documenta en [Pruebas automatizadas del frontend](HU-MEJ-006-PRUEBAS-FRONTEND.md).

## Motivo y autorización

Durante la preparación de CI, `npm run lint` encontró en `app/apprentice/facial.tsx:100` el error «Compilation Skipped: Existing memoization could not be preserved». React Compiler infiere que `handleRegistrationSaved` depende de `resetState`, porque el cuerpo de la función lee ese objeto. La lista manual solo declaraba `resetState?.requestId`.

La usuaria autorizó expresamente esta corrección mínima para permitir la ejecución de lint sin desactivar reglas ni ocultar errores.

## Cambio

En el `useCallback` de `handleRegistrationSaved`, se sustituyó `[resetState?.requestId]` por `[resetState]`. No se modificó el cuerpo de la función.

## Por qué conserva el comportamiento funcional

Las mismas instrucciones siguen marcando la solicitud como consumida, actualizando el estado local del registro y limpiando los indicadores de la pantalla después de guardar. No se cambiaron endpoints, payloads, permisos, autorizaciones, retos de vida, comparación de rostros, asistencia ni base de datos.

La diferencia técnica es que React puede crear una nueva referencia de la función cuando cambia el objeto `resetState`, incluso si su `requestId` sigue siendo el mismo. Recrear la función no la ejecuta ni registra un rostro: el hook existente continúa llamándola después de guardar el embedding en el servidor. El hook también puede recalcular sus callbacks dependientes; no se garantiza una identidad idéntica ni se afirma que el cambio tenga costo cero de renderizado.

Esto alinea las dependencias declaradas con el objeto leído por el callback y permite conservar su memoización según React Compiler. No se deshabilitaron reglas de ESLint.

## Validación

- `npm run lint`: 0 errores y 48 advertencias previas; desapareció el error de memoización sin desactivar reglas.
- `tsc --noEmit`: código de salida 0.
- `npm test`: código de salida 0; pasaron los cinco scripts existentes, incluidos los 13 casos de acceso a captura facial y las 168 combinaciones de notificaciones/idioma.
- `git diff --check`: aprobado.

Estas verificaciones no sustituyen una prueba manual del registro facial ni una ejecución verde en GitHub Actions. Los scripts incluyen comprobaciones con respuestas y almacenamiento simulados; no acreditan un registro biométrico real.
