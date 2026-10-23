# Diagnóstico Técnico y Plan de Mejoras: FaceLit Mobile

## 1. Resumen Ejecutivo
La aplicación **FaceLit Mobile** presenta una estructura de proyecto robusta e intencionalmente diseñada para separar responsabilidades mediante un esquema de `features`, `shared` y `app` (basado en Expo Router). Sin embargo, se identificaron áreas críticas de mejora en el acoplamiento a estado local simulado (mocks), vulnerabilidades y debilidades funcionales en validaciones y seguridad de red. Existe inconsistencia en la nomenclatura (mezcla de español e inglés en variables de dominio) y carencia total de un entorno de pruebas automatizadas.

**Fortalezas verificadas:** Uso de React Native / Expo, estructuración de carpetas modularizada, buena implementación de internacionalización (i18n), diseño de UI unificado.
**Principales riesgos:** Ausencia de pruebas (unitarias y E2E), uso persistente de mocks sin mecanismos de integración validados al 100%, exposición a inconsistencias de estado local, mezcla de idiomas en variables core.

## 2. Alcance y limitaciones
- **Revisado:** Estructura de carpetas (`app`, `features`, `shared`), archivos clave de configuración (`package.json`, `tsconfig.json`, `eslint.config.js`, `.env`), dependencias y contextos principales (`AuthContext`, `ThemeContext`).
- **Ejecutado:** Instalación de paquetes (`npm install`), validación de tipos (`npx tsc --noEmit`), análisis estático (`npx eslint .`).
- **Limitaciones:** No fue posible ejecutar pruebas (`npm test`) ya que no existen scripts ni configuración de pruebas (Jest, Testing Library) en el proyecto. No se revisó el backend, el análisis se limitó estrictamente al frontend.

## 3. Arquitectura
La arquitectura actual es un modelo **híbrido** de Módulos (en `features`) y Componentes Compartidos (`shared`), con enrutamiento basado en archivos (Expo Router en `app`).
- **Aciertos:** Centralización de rutas, configuración de UI (Themes, Colors) unificada, separación entre la vista y la lógica de negocio (Hooks personalizados como `useLoginForm`).
- **Problemas:** El uso de `useSyncExternalStore` con objetos globales (p.ej., `environmentsStore.ts`) actúa como un gestor de estado improvisado, lo que puede causar problemas de ciclo de vida e hidratación. Existen servicios (`api.js`) y contextos (`AuthContext.tsx`) que mezclan manipulación directa de tokens (almacenamiento) y lógica de presentación, rompiendo parcialmente la separación de responsabilidades. Se recomienda estandarizar el consumo de la API mediante React Query o Redux/Zustand si la complejidad aumenta, en vez del store manual.

## 4. Evaluación SOLID

| Principio | Estado | Evidencia | Impacto |
|-----------|--------|-----------|---------|
| **SRP** (Responsabilidad Única) | Parcial | `AuthContext` gestiona sesión, decodificación manual de JWT, llamadas API y logs de auditoría al mismo tiempo. | Alto - Complica el mantenimiento y testeo del Auth. |
| **OCP** (Abierto/Cerrado) | Cumple | Los hooks (ej. `useEnvironments`) y el diseño UI permiten extender funcionalidades sin modificar componentes base. | Bajo |
| **LSP** (Sustitución de Liskov) | No Aplica | Enfoque funcional de React, poca herencia tradicional. | - |
| **ISP** (Segregación de Interfaces) | Cumple | Las interfaces en TypeScript (ej. en `types.ts`) están bien definidas y separadas por dominio. | Bajo |
| **DIP** (Inversión de Dependencias) | Parcial | `shared/services/api.js` está acoplado a `axios` directamente. Funciones exportadas no permiten fácil inyección de un cliente HTTP mockeado. | Medio - Impide buenas prácticas de testing de servicios. |

## 5. Hallazgos priorizados

### ID: ERR-001 | Falta de configuración de pruebas (Jest/RNTL)
- **Severidad:** Alta
- **Certeza:** Confirmado
- **Archivo y líneas relevantes:** `package.json` (línea 6).
- **Evidencia y explicación:** Ejecución de `npm test` arroja `Missing script: "test"`. No hay archivos `.test.ts` de negocio (solo los de dependencias en `node_modules`).
- **Impacto y condiciones en que ocurre:** Alto. Impide validar regresiones automáticamente. Afecta cualquier modificación futura.
- **Recomendación concreta:** Instalar y configurar `jest`, `jest-expo` y `@testing-library/react-native`.
- **Forma de verificar la corrección:** Ejecutar `npm test` y verificar que corran los test de ejemplo creados en el boilerplate inicial.

### ID: ERR-002 | `axios` importado de forma incorrecta
- **Severidad:** Media
- **Certeza:** Confirmado
- **Archivo y líneas relevantes:** `shared/services/api.js` (línea 5), `shared/services/facialEmbeddingService.ts` (línea 60)
- **Evidencia y explicación:** Advertencias del linter: `Caution: axios also has a named export create`.
- **Impacto y condiciones en que ocurre:** Medio. Puede generar problemas de resolución de módulos dependiendo de la configuración de empaquetado.
- **Recomendación concreta:** Cambiar `import axios from 'axios'` a una importación de default validada o verificar la configuración del compilador.
- **Forma de verificar la corrección:** Ejecutar `npx eslint .` y validar que el warning haya desaparecido.

### ID: SEC-001 | Manejo de bloqueo de login en cliente
- **Severidad:** Media
- **Certeza:** Potencial
- **Archivo y líneas relevantes:** `shared/contexts/AuthContext.tsx` (líneas 192-201).
- **Evidencia y explicación:** Se verifica el bloqueo localmente con `isLocked(normalizedDocument)` guardado en la memoria de la aplicación.
- **Impacto y condiciones en que ocurre:** Medio. Si un atacante recarga la app (en web) o limpia datos, el bloqueo temporal en la UI se resetea permitiendo ataques de fuerza bruta si el backend no es estricto.
- **Recomendación concreta:** El bloqueo **debe** depender exclusivamente de la respuesta HTTP 429/401 del backend, aunque se use el estado local como *debounce* visual.
- **Forma de verificar la corrección:** Intentar más de 5 inicios de sesión fallidos, limpiar estado local y confirmar que el servidor devuelve un 401 o 429 que mantiene bloqueada la UI.

### ID: MNT-001 | Reglas del Linter desatendidas (useCallback dependencies)
- **Severidad:** Baja
- **Certeza:** Confirmado
- **Archivo y líneas relevantes:** `features/environments/useEnvironments.ts` (líneas 48-54), `features/schedules/useSchedules.ts` (múltiples líneas).
- **Evidencia y explicación:** Múltiples errores y advertencias de ESLint por `react-hooks/use-memo` y `react-hooks/exhaustive-deps`.
- **Impacto y condiciones en que ocurre:** Bajo. Ocurre durante la edición. En el futuro puede producir stale closures o renders innecesarios.
- **Recomendación concreta:** Revisar el arreglo de dependencias en los hooks e incluir lo marcado por ESLint (o refactorizar).
- **Forma de verificar la corrección:** Ejecutar `npx eslint .` y confirmar 0 errores de la regla react-hooks.

## 6. Idioma y nomenclatura

Existe inconsistencia entre el dominio funcional y los identificadores en código. Se usan palabras en español integradas en convenciones inglesas (Spanglish).

**Inconsistencias detectadas:**
- Mezcla de `Apprentice` (49 menciones en UI) y `Learner` (338 menciones en tipos) para denotar al mismo rol de "Aprendiz".
- Uso extendido de la palabra `ficha` (1502 menciones) en el código en inglés (ej. `fromFichaNumber`, `assignFichaToEnvironment`, `join-ficha`).
- Comentarios y docs en español, código mayormente en inglés.

| Ubicación / Módulo | Nombre actual | Alternativa sugerida (Inglés) |
|--------------------|---------------|-------------------------------|
| `app/apprentice/join-ficha.tsx` | `join-ficha` / `fichaNumber` | `join-cohort` / `cohortNumber` |
| `features/academic/components/FichaFormModal.tsx` | `FichaFormModal` | `CohortFormModal` |
| `shared/contexts/AuthContext.tsx` | `APRENDIZ` | `LEARNER` (Mapeo Backend) |
| Todo el código | `aprendiz` (en comentarios y vars) | `learner` / `apprentice` |

**Nota:** Renombrar `ficha` a `cohort` podría requerir alineación con el backend para no afectar los contratos de la API ni base de datos.

## 7. Verificación técnica

- **Comando:** `npm install`
  - **Resultado:** Instalación exitosa. (908 paquetes instalados, 39 vulnerabilidades reportadas por npm audit).
- **Comando:** `npx tsc --noEmit`
  - **Resultado:** 0 errores de compilación. Tipado estricto.
- **Comando:** `npx eslint .`
  - **Resultado:** 13 errores y 85 warnings, mayormente de react-hooks y unused-vars.
- **Comando:** `npm test`
  - **Resultado:** Error - Missing script: "test".

## 8. Plan de acción

### Correcciones inmediatas (Alto impacto, bajo esfuerzo)
1. **Resolver dependencias en hooks de React (Linter):** Corregir las dependencias de `useCallback` en `useEnvironments.ts` y `useSchedules.ts` para evitar bugs de estado obsoleto.
2. **Corregir advertencias de importación de Axios:** Cambiar el tipo de importación para evitar fallos de resolución de módulos.

### Mejoras a corto plazo (Alto impacto, medio esfuerzo)
1. **Implementar marco de pruebas:** Configurar Jest y React Native Testing Library. Crear un script `test` en `package.json` y cubrir `AuthContext` y validaciones en los formularios principales.
2. **Desacoplar AuthContext:** Extraer la lógica de decodificación JWT, auditoría y bloqueos de cliente en un hook/manager especializado para mejorar su testeo y mantenimiento.

### Mejoras opcionales (Medio impacto, alto esfuerzo)
1. **Migración de gestor de estado:** Reemplazar el patrón de `useSyncExternalStore` con Zustand o RTK, mejorando herramientas de debugging y consistencia.
2. **Refactorización de nomenclatura:** Traducir `ficha` a `cohort` y unificar `Apprentice`/`Learner` en una sola palabra clave.
