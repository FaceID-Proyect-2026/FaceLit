# HU-MEJ-006 — Pruebas automatizadas del frontend

Fecha: 25 de octubre de 2026.

## Rama y alcance

Entrega en `hu-38-dev`, sobre el SHA base `cd0b02f6912b5156df1897112f4a87b3242586ea`, mediante el PR de CI [#74](https://github.com/FaceID-Proyect-2026/FaceLit/pull/74). Este documento describe los cambios posteriores a ese SHA; la ejecución verde del SHA base no acredita automáticamente estas pruebas nuevas. Para la revisión final debe consultarse el head actualizado del PR y su propio run de CI.

Se conserva la lógica de producción. Se agregan dependencias de desarrollo, configuración Jest, pruebas y publicación de informes en CI. El ajuste anterior de memoización se conserva y se explica en [HU-MEJ-006-CI.md](HU-MEJ-006-CI.md).

Las correcciones posteriores de HU-002 están en otra rama (`hu-37-dev`). No se han mezclado automáticamente en esta entrega de CI.

La delimitación actual solicitada para HU-MEJ-006 es H-16/H-18: automatización y pruebas, sin implementar reglas de seguridad de otras historias. El reparto y el estado de entrega están en [alcance y entrega para QA](HU-MEJ-006-ALCANCE-Y-ENTREGA-QA.md). La propuesta original citaba también H-17; se conserva esta aclaración para trazabilidad.

## Cambios

| Archivo | Propósito |
|---|---|
| `package.json`, `package-lock.json` | Instalar Jest 29.7, jest-expo 57.0.6, Testing Library 14.1 y tipos de Jest como dependencias de desarrollo. Conservar los cinco scripts y agregar las suites a `npm test`. |
| `jest.config.cjs` | Preset Expo, alias de importación, pruebas fuera de `app/`, ejecución con cobertura de seis archivos seleccionados e informes HTML/LCOV/JSON. Timeout de prueba de 15 segundos para arranque nativo en Windows. |
| `tests/components.test.js` | Renderizado real de RemoteDataState: carga, error accesible, acción de reintento y desaparición del error. |
| `tests/login.test.js` | Hook de login con React: validación, consentimiento, éxito, credenciales incorrectas, bloqueo, fallo de red, privacidad no disponible y prevención de envíos simultáneos. |
| `tests/guards.test.js` | Restauración de sesión, pérdida de sesión, espera de navegación y matriz de cinco roles frente a tres contratos de acceso. |
| `tests/services.test.js` | Servicios reales y serialización de Axios: contrato de login, persistencia solo tras éxito, matriz de asistencia con datos o vacía, 401/403/500, timeout, registro, captura, ausencias y excusas. |
| `.github/workflows/ci.yml` | Mantener el nombre del check obligatorio `Frontend tests and lint`; ejecutar las nuevas suites desde `npm test` y adjuntar también `coverage/` al artefacto `frontend-test-coverage`. |
| `.gitignore` | Excluir `coverage/` y `coverage-v8/`. Los informes generados no son código fuente para un commit. |

No se cambiaron las versiones ya presentes en el lockfile. npm reorganizó entradas del lockfile al resolver las nuevas herramientas; las dependencias directas de producción se mantienen.

## Contratos contrastados

Se leyó el controlador existente `FaceLit-Backend/src/main/java/com/FaceLit/backend/facial/controller/FacialEventController.java` en la rama backend de CI local. Los servicios usan `/api/facial/events`, `/from-image`, `/initialize-absences`, `/attendance-matrix` y `/excuse` con sus métodos POST/GET/PATCH actuales. Las pruebas contrastan esos contratos del cliente, no ejecutan el controlador Java.

## Ejecutar y ver los resultados

Desde la carpeta del repositorio frontend:

```powershell
npm ci
npm test
npm run lint
npx --no-install tsc --noEmit
```

- `npm test`: cinco scripts previos y cuatro suites Jest; cualquier fallo devuelve código distinto de cero.
- `npm run test:scripts`: solo los cinco scripts conservados.
- `npm run test:components`: las cuatro suites Jest y cobertura.
- Abrir `coverage/lcov-report/index.html` después de ejecutar las pruebas para consultar archivos, líneas y ramas.
- En GitHub, después de publicar estos cambios, revisar PR → Checks → `Frontend tests and lint`, y Actions → ejecución → artefacto `frontend-test-coverage`.

No hace falta abrir la app para ejecutar estas pruebas. Abrirla y probar manualmente login/navegación sigue siendo una comprobación adicional; Jest no acredita una aceptación completa web/Android.

## Validación local

- Cuatro suites Jest: **47 pruebas aprobadas, 0 omitidas**.
- Cobertura de líneas: **82,18 % de los seis archivos seleccionados**, no de toda la aplicación. Hooks de guardas, RemoteDataState y servicio de asistencia alcanzaron 100 % de líneas; eso no implica 100 % de ramas ni integración de todas las pantallas.
- `npm run lint`: 0 errores y 48 advertencias previas.
- `tsc --noEmit`: salida 0.
- `npm ls --depth=0 --omit=optional`: salida 0.
- La primera ejecución de Jest no pudo escribir su caché en el sandbox (EPERM), antes de ejecutar casos. La repetición autorizada fuera del sandbox sí ejecutó las suites. Se corrigió la definición de un caso parametrizado vacío y se ajustó la tolerancia de arranque; no se omitieron pruebas ni se desactivaron aserciones.

## Límites y pendiente detectado

Se usan React y componentes/hook reales. Se simulan tema, traducciones y navegación. En login se simula AuthContext para probar el formulario de manera aislada. En servicios se mantiene Axios y se reemplaza únicamente su adaptador HTTP: son pruebas de contrato del cliente, sin backend en ejecución. No se envían correos ni se utiliza una imagen biométrica real.

**La matriz de roles prueba `useRoleGuard`, pero los layouts actuales `app/admin/_layout.tsx`, `app/instructor/_layout.tsx` y `app/apprentice/_layout.tsx` usan `useAuthGuard`. No debe presentarse esta suite como prueba de que esos layouts bloquean un rol equivocado.** La integración funcional de la guarda por rol y sus pruebas de navegación se deriva al trabajo de autorización de HU-MEJ-001, sin exigir su implementación dentro de HU-MEJ-006. Se conserva el hallazgo; este cambio de infraestructura y pruebas no altera esas pantallas.

Las respuestas 401/403 simuladas prueban propagación en el cliente; no prueban que Spring Security las emita ni cierran H-17. Tampoco acreditan el interceptor de sesión ni los arreglos de recuperación de HU-002 en otra rama.

Para cerrar HU-MEJ-006 con el alcance delimitado todavía se requieren publicación de estas suites y CI verde del nuevo commit, revisión independiente y evidencia de bloqueo. La usuaria informa haber realizado el experimento de bloqueo: falta adjuntar y contrastar esa evidencia, sin repetirlo si ya demuestra el criterio. Los cambios funcionales de autorización y recuperación se revisan en HU-MEJ-001/HU-MEJ-002, no como implementación pendiente de HU-MEJ-006. No se declara Done antes de completar publicación, evidencia y aprobación.

Referencia de configuración: [documentación oficial de pruebas de Expo](https://docs.expo.dev/develop/unit-testing/).
