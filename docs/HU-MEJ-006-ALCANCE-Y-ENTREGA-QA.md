# HU-MEJ-006 — Alcance y entrega para revisión de QA

Fecha: 25 de octubre de 2026.

## Solicitud de revisión

Se solicita evaluar HU-MEJ-006 por su responsabilidad de **crear CI, automatizar pruebas y recopilar cobertura y evidencia en los cuatro repositorios**, asociada a H-16/H-18. La implementación de reglas de seguridad por rol, pertenencia y recuperación se asigna a HU-MEJ-001/HU-MEJ-002. CI debe ejecutar las pruebas de esas historias cuando estén integradas; esta entrega no declara cerrados sus hallazgos funcionales.

La propuesta inicial citaba H-16/H-18/H-17. La responsable solicita esta delimitación para evitar duplicar trabajo entre historias. Debe quedar reflejada en la HU/tablero y ser contrastada por QA; este documento no representa una aprobación ya concedida ni elimina la trazabilidad de H-17.

**H-17 es un hallazgo, no HU-MEJ-017.** La historia indicada para autorización es **HU-MEJ-001 — Autorizar eventos faciales por rol y pertenencia**.

## Responsabilidades

| Historia | Alcance y evidencia que le corresponde |
|---|---|
| HU-MEJ-001, H-01/H-17 | Autorizar por rol y pertenencia. Aprendiz sin capacidad de registrar/justificar asistencias ajenas, instructor ajeno a sesión rechazado con 403, acceso anónimo rechazado con 401. Pruebas HTTP con la seguridad real del backend y pruebas de acceso de interfaz que correspondan. |
| HU-MEJ-002, H-02/H-32 y relación con H-17 | Códigos y autorización de recuperación seguros, límites de intentos, expiración/consumo y rechazo de JWT invalidado en recursos protegidos. |
| HU-MEJ-006, H-16/H-18 | Workflow por repo, build/comprobaciones adecuadas a su tecnología, ejecución de pruebas en PR, npm test en frontend, informes de cobertura donde corresponda, evidencia de ejecución y checks obligatorios. |

La separación de responsabilidades no permite ignorar pruebas fallidas, debilitar controles ni afirmar que una regla de seguridad ya está comprobada. Las brechas de seguridad se conservan en sus historias responsables.

## Qué se implementó

- Frontend: Node 22, instalación reproducible con `npm ci`, cinco scripts existentes conectados a `npm test`, TypeScript, lint y exportación web. Se añadieron cuatro suites Jest/Testing Library (47 casos) y cobertura HTML/LCOV/JSON, conservando los scripts existentes.
- Backend: Java 17 en GitHub Actions, Maven `verify` sin omitir pruebas, JaCoCo e informes Surefire/JaCoCo como artefactos.
- BD: PostgreSQL temporal, Liquibase `validate`, `update` desde cero y `status`, logs y limpieza del entorno temporal.
- Micro: Python 3.11, instalación de dependencias, `pip check`, lint de errores Python, compilación de fuentes, pytest, cobertura e informes XML/HTML.
- GitHub: checks específicos obligatorios en los cuatro rulesets CI, una aprobación requerida y lista de bypass vacía. Ramas configuradas: dev/qa/main; develop no está incluida.

Los workflows corren al abrir/actualizar PR; también se configuraron ejecuciones en ramas de integración y ejecución manual. No se añadió despliegue automático.

## Archivos intervenidos

Las rutas de esta tabla son relativas al repositorio indicado.

| Repositorio | Archivos | Cambio |
|---|---|---|
| FaceLit | `.github/workflows/ci.yml` | Automatización y artefactos V8/Jest. Se conserva el nombre del check obligatorio `Frontend tests and lint`. |
| FaceLit | `package.json`, `package-lock.json` | Scripts `test`, `test:scripts`, `test:components`; dependencias de desarrollo y resolución bloqueada. |
| FaceLit | `jest.config.cjs` | Preset Expo, alias, selección de suites y cobertura. |
| FaceLit | `tests/components.test.js` | Renderizado de estados de carga/error/reintento. |
| FaceLit | `tests/login.test.js` | Formulario de login mediante su hook real: validación, consentimiento, éxito, fallos, bloqueo y doble envío. |
| FaceLit | `tests/guards.test.js` | Contrato de las guardas existentes, sesión y matriz de roles. No acredita su integración en todos los layouts. |
| FaceLit | `tests/services.test.js` | Servicios reales del cliente con adaptador HTTP simulado: login y asistencia, payloads y propagación de errores. |
| FaceLit | `.gitignore` | Excluir informes `coverage/` y `coverage-v8/`. |
| FaceLit | `app/apprentice/facial.tsx` | Ajuste mínimo anterior autorizado: dependencias del callback de `[resetState?.requestId]` a `[resetState]`. El cuerpo no cambió; no modifica recuperación de contraseña. |
| FaceLit | `docs/HU-MEJ-006-CI.md`, `docs/HU-MEJ-006-PRUEBAS-FRONTEND.md`, este documento | Motivo del ajuste, pruebas, límites y delimitación para QA. |
| FaceLit-Backend | `.github/workflows/ci.yml`, `docs/HU-MEJ-006-CI.md` | CI de Maven/JaCoCo y explicación. No se agregaron reglas de autorización en esta entrega. |
| FaceLit-DB | `.github/workflows/ci.yml`, `docs/HU-MEJ-006-CI.md` | CI de migraciones y explicación; no se editaron changesets aplicados. |
| micro-facial | `.github/workflows/ci.yml`, `requirements-ci.txt`, `docs/HU-MEJ-006-CI.md` | CI, herramientas de pruebas/cobertura/lint y explicación. |

En la última validación de backend/BD/micro solo se revisó y ejecutó el código versionado; no se cambiaron sus fuentes ni workflows. Los scripts auxiliares de ejecución, logs, copias y reportes se guardaron fuera de los repositorios, en `ci-evidence/` del directorio de trabajo.

El borrado local preexistente de `FaceLit/docs/mobile-entry-validation.md` y los borrados/cachés locales del backend no forman parte de los cambios propuestos para HU-MEJ-006. No deben añadirse mediante un `git add .` indiscriminado.

## Pruebas y porcentajes reales

| Repositorio | Resultado obtenido | Cobertura y alcance |
|---|---|---|
| Frontend | Cinco scripts previos y **47/47 casos Jest aprobados**; TypeScript correcto; lint 0 errores/48 advertencias previas | **82,18 % de líneas (143/174)** de los seis archivos seleccionados en Jest, no de toda la aplicación. |
| Backend | **123 pruebas aprobadas**, 0 fallos/errores/omitidas; Maven BUILD SUCCESS, empaquetado y JaCoCo | **62,72 % de líneas (2857/4555)** en esa ejecución local. |
| Base de datos | `validate`, `update`, `status` correctos; **41 changesets aplicados** desde cero, sin pendientes | No se calculó porcentaje de cobertura SQL. Se acredita ejecución y estado de migraciones. |
| Microservicio | Suite habitual: **27 aprobadas y 1 omitida**; prueba PostgreSQL opcional ejecutada aparte: **1 aprobada** | **48,33 % de líneas (406/840)** de la suite habitual. La segunda invocación no se sumó a ese porcentaje. |

Los casos aprobados y el porcentaje de cobertura son métricas distintas:

- **Resultado de pruebas:** indica si las aserciones de los casos ejecutados se cumplieron. En Jest pasaron 47/47; eso no demuestra que se probaran todos los comportamientos posibles.
- **Cobertura:** indica qué líneas, sentencias, funciones o alternativas recorrieron esas pruebas. No es una nota de calidad, disponibilidad o funcionamiento global.
- **Cobertura menor al 100 %:** no demuestra por sí sola que el código falle; identifica partes sin evidencia de ejecución en esa medición. Tampoco permite garantizar que las partes sin probar funcionen.
- La HU proporcionada **no define un umbral mínimo**. No corresponde inventar 100 % como criterio de rechazo; sí corresponde revisar si las pruebas son relevantes y si CI falla cuando fallan sus aserciones.

El 50 % de sentencias de `shared/services` se obtiene sumando `authService.js` (13/35) y `facialAttendanceService.ts` (9/9): 22/44. El servicio de asistencia tiene 100 % de líneas; el de autenticación, 40,62 % porque varias funciones fuera del login no se ejercitaron en Jest. El cliente central `api.js` está simulado en esos casos, por lo que el reporte no certifica conectividad con un servidor real.

## Restricciones y límites

- Se mantuvieron lógica de negocio, endpoints, payloads y migraciones existentes; las suites nuevas no implementan autorización ni recuperación.
- No se utilizaron credenciales reales, correos de usuarios ni biometría de producción.
- Backend local: JDK 21 compilando para Java 17, perfil test/H2. GitHub Actions usa JDK 17; no se afirma identidad entre entornos.
- No se ejecutó `FacialRegistrationConfirmationPostgresIT` dentro de las 123 pruebas Maven. No se atribuye a esa ejecución una integración PostgreSQL inexistente.
- La prueba opcional del micro sí pasó en PostgreSQL temporal con datos sintéticos y rollback. Su workflow actual continúa omitiéndola por falta de opt-in: la evidencia adicional es local.
- La validación de BD prueba el commit de CI con 41 changesets. La migración posterior de HU-002 con `security.auth_rate_limit` no está en esa rama. No se acreditó rollback de todas las migraciones en esta validación.
- Las guardas se probaron como hooks. Los layouts actuales usan `useAuthGuard`, no la guarda por rol; esa integración funcional se deriva a HU-MEJ-001 y no se presenta como implementada por esta entrega.
- Los mocks HTTP acreditan contratos del cliente, no respuestas reales de Spring Security, E2E completo, cámara real ni aceptación Android.
- Los reportes/cachés generados no se deben incluir como código fuente. Las fuentes de pruebas y configuración sí son archivos legítimos del proyecto.

## SHA, PR y evidencia remota

Última consulta verificada el 25 de octubre de 2026: PR abiertos, runs verdes de los SHA siguientes y sin revisiones registradas en esa consulta. Esta es una fotografía de evidencia, no una afirmación sobre revisiones que puedan añadirse después.

| Repo / rama | SHA publicado revisado | PR | Run verde |
|---|---|---|---|
| FaceLit / hu-38-dev | cd0b02f6912b5156df1897112f4a87b3242586ea | [#74](https://github.com/FaceID-Proyect-2026/FaceLit/pull/74) | [40195788689](https://github.com/FaceID-Proyect-2026/FaceLit/actions/runs/40195788689) |
| Backend / hu-39-dev | 0e6666b3f726746b8026df8eb83b7941bf7849fa | [#67](https://github.com/FaceID-Proyect-2026/FaceLit-Backend/pull/67) | [40195794058](https://github.com/FaceID-Proyect-2026/FaceLit-Backend/actions/runs/40195794058) |
| BD / hu-11-db | d328a074f93c93396dabbbe596aea40c54d9005f | [#60](https://github.com/FaceID-Proyect-2026/FaceLit-DB/pull/60) | [40196918463](https://github.com/FaceID-Proyect-2026/FaceLit-DB/actions/runs/40196918463) |
| Micro / hu-02-dev | 9e60c34f70875b9bff470d5313b4a90609804ab0 | [#4](https://github.com/FaceID-Proyect-2026/micro-facial/pull/4) | [40195796057](https://github.com/FaceID-Proyect-2026/micro-facial/actions/runs/40195796057) |

**La tabla registra los SHA base y sus runs verificados antes de esta ampliación.** Las suites y documentos nuevos se entregan mediante el head actualizado del PR #74; el run verde anterior no acredita esos cambios. Debe consultarse el último SHA del PR y su ejecución antes de aprobar la ampliación. Las actualizaciones documentales de los otros repositorios también requieren verificar sus nuevos heads; sus enlaces de la tabla son evidencia histórica exacta, no sustitutos del último CI.

Los informes locales HTML y logs se ubican en el directorio de trabajo, fuera del repo frontend:

- `ci-evidence/hu006-validation-20261025/backend-verify.log` y `FaceLit-Backend/target/site/jacoco/index.html` dentro de esa carpeta.
- `ci-evidence/hu006-validation-20261025/database.log` y `database-counts.log`.
- `ci-evidence/hu006-validation-20261025/micro-validation.log`, `micro-postgres-results.xml` y `micro-htmlcov/index.html`.
- `FaceLit/coverage/lcov-report/index.html` para las nuevas suites frontend.
- `ci-evidence/hu006-required-checks-20261025-164331/` para respuestas de GitHub antes/después de configurar checks obligatorios.

Estos archivos locales no estarán disponibles para QA remoto solo por enlazar este Markdown: deben entregarse los artefactos de Actions del commit final o un paquete de evidencia revisado.

## Condiciones de cierre de HU-MEJ-006 delimitada

- [x] CI configurado en cuatro repositorios, scripts frontend conectados a npm test y ejecuciones verdes de los commits publicados revisados.
- [x] Checks concretos obligatorios guardados en los cuatro rulesets activos.
- [x] Suites nuevas frontend aprobadas localmente y validaciones locales backend/BD/micro exitosas.
- [ ] Verificar la publicación y el CI verde del último SHA de los PR actualizados; registrar esa evidencia en la revisión final.
- [ ] Adjuntar la evidencia del bloqueo de fusión con CI rojo que la responsable informa haber realizado; validar que el check era obligatorio. No repetir si ya existe evidencia suficiente.
- [ ] Adjuntar aprobaciones independientes de los PR correspondientes después de los cambios finales.
- [ ] Reflejar esta delimitación en la HU/tablero y mantener SHA, PR y runs finales actualizados.

La ausencia de nuevas reglas de autorización dentro de HU-MEJ-006 no debe confundirse con incumplimiento de su alcance delimitado: se evalúan en las historias responsables. Conservar y automatizar sus pruebas al integrarlas sí corresponde a CI.

**Conclusión para QA:** implementación de automatización preparada y resultados verificables disponibles. Se solicita revisar con el alcance delimitado H-16/H-18. El estado final Done queda sujeto a publicación de los últimos cambios, evidencia y aprobación independiente; este documento no suplanta esa decisión.
