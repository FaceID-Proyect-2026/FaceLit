# Requerimientos Funcionales y No Funcionales — Rol Aprendiz (APPRENTICE)
## Proyecto FaceLit · SENA · Programación de Software 3145555

> **Versión:** 1.0 · **Fecha:** 2026-09-11  
> **Basado en:** SRS_V1.pdf · Estado del código en rama `feature/instructor`  
> **Alcance:** Exclusivamente las pantallas y acciones del rol `APPRENTICE`.  
> No incluye vistas de Administrador, Coordinador ni Instructor.

---

## Índice de pantallas del Aprendiz

| Pantalla | Ruta |
|---|---|
| Dashboard | `/apprentice` |
| Mi Asistencia | `/apprentice/attendance` *(pendiente de implementación)* |
| Reconocimiento Facial | `/auth/verify-identity` + flujo de registro |
| Perfil | `/profile` |
| Notificaciones | `/notifications` |

---

## RF-5 — RECONOCIMIENTO FACIAL (Rol Aprendiz)

### RF-5.1 — Pantalla de confirmación de identidad (paso previo a la cámara)

**Versión:** 1.0 – 11/09/2026  
**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-5.1 SRS_V1 · Instrucciones de la lider de proyecto

**Descripción:**  
Antes de abrir la cámara, el sistema muestra una pantalla informativa con el nombre completo del aprendiz autenticado y un aviso de responsabilidad. El propósito es que la persona que se va a registrar confirme que efectivamente es el usuario de la cuenta.

- El sistema muestra: *"La persona que se va a registrar es: **[Nombre Apellido]**. Si otra persona realiza el registro en su lugar, la responsabilidad del registro incorrecto recaerá sobre usted."*
- El aprendiz debe marcar una casilla de confirmación antes de poder continuar.
- Si quien se registra es diferente al usuario autenticado (detectado por análisis de similitud o por denuncia posterior), el registro queda guardado pero el afectado es el aprendiz dueño de la cuenta.
- Para volver a registrar el rostro después de un registro incorrecto, el aprendiz debe solicitar autorización al Coordinador, quien tiene la facultad de resetear el estado biométrico.

**Precondición:**
- El aprendiz debe haber iniciado sesión con sus credenciales.
- El sistema debe conocer el nombre completo del usuario (`firstName`, `lastName` del JWT).

**Secuencia Normal:**

| Paso | Actor | Acción | Sistema |
|---|---|---|---|
| 1 | Sistema | — | Muestra pantalla con nombre del aprendiz y aviso de responsabilidad. |
| 2 | Aprendiz | Lee el aviso y marca la casilla de confirmación. | Habilita el botón "Continuar al registro". |
| 3 | Aprendiz | Pulsa "Continuar". | Navega a la pantalla de captura facial (RF-5.2). |

**Escenarios Alternativos:**

| Paso | Actor | Acción | Sistema |
|---|---|---|---|
| 2.1 | Aprendiz | No marca la casilla. | El botón "Continuar" permanece deshabilitado. |
| 2.2 | Aprendiz | Pulsa atrás sin confirmar. | Regresa al dashboard sin iniciar el flujo biométrico. |

**Postcondición:** El aprendiz ha aceptado explícitamente que el registro que está por realizar es bajo su responsabilidad. Se registra la acción en auditoría (fecha, hora, userId).

**Criterios de aceptación:**
- El nombre mostrado proviene del token JWT activo — nunca hardcodeado.
- El botón "Continuar" solo se habilita si la casilla está marcada.
- La trazabilidad del consentimiento queda guardada en base de datos.
- El texto del aviso está disponible en los 4 idiomas del sistema (ES, EN, DE, FR).

---

### RF-5.2 — Captura facial con validación de calidad (cámara del dispositivo)

**Versión:** 1.0 – 11/09/2026  
**Actor:** Aprendiz / Sistema / Cámara del dispositivo (web o nativa)  
**Fuentes:** RF-5.1 SRS_V1 · `useFacialRegistration.ts` · instrucciones de la lider

> **Nota:** El hardware Raspberry Pi fue eliminado del alcance para el frontend.  
> El reconocimiento se realiza con la cámara integrada del computador o dispositivo móvil.

**Descripción:**  
El sistema abre la cámara del dispositivo y guía al aprendiz para tomar una foto válida. La cámara aplica validaciones en tiempo real para rechazar capturas de baja calidad. El aprendiz **no puede** subir fotos desde galería ni desde otro dispositivo.

**Validaciones que la cámara debe aplicar (cámara inteligente):**

| Condición detectada | Mensaje al usuario | Acción del sistema |
|---|---|---|
| Luz insuficiente (brillo < 60) | "Iluminación insuficiente. Busca mejor luz." | Bloquea el botón de captura. |
| Rostro cubierto con gorra | "Quítate la gorra para continuar." | Bloquea el botón de captura. |
| Rostro cubierto con gafas / lentes | "Quítate las gafas para continuar." | Bloquea el botón de captura. |
| Rostro no frontal / girado | "Mira directamente a la cámara." | Bloquea el botón de captura. |
| Imagen de pantalla de celular detectada | "No se permite capturar fotos de celular u otra pantalla." | Rechaza la captura y solicita nueva toma. |
| Imagen de foto impresa detectada | "No se permiten fotos impresas." | Rechaza la captura. |
| Múltiples rostros en el encuadre | "Solo debe aparecer una persona en el encuadre." | Bloquea el botón de captura. |
| Rostro muy pequeño / lejos de la cámara | "Acércate más a la cámara." | Guía visual en pantalla. |

**Precondición:**
- RF-5.1 completado (casilla de responsabilidad marcada).
- El dispositivo tiene cámara disponible y permisos concedidos.
- El aprendiz existe en la base de datos.

**Secuencia Normal:**

| Paso | Actor | Acción | Sistema |
|---|---|---|---|
| 1 | Sistema | — | Muestra vista de cámara con guía visual (óvalo centrado). |
| 2 | Sistema | — | Analiza en tiempo real la imagen: iluminación, posición, obstrucciones. |
| 3 | Aprendiz | Se posiciona correctamente. | Todas las validaciones pasan → botón "Capturar" habilitado. |
| 4 | Aprendiz | Pulsa "Capturar". | Toma la foto y muestra vista previa. |
| 5 | Aprendiz | Confirma la foto. | Envía vector biométrico al servidor. Muestra modal de éxito. |
| 6 | Sistema | — | Guarda el registro facial, actualiza estado a `registered`. |

**Escenarios Alternativos:**

| Paso | Actor | Acción | Sistema |
|---|---|---|---|
| 2.x | Sistema | Detecta cualquier fallo de calidad. | Muestra el mensaje correspondiente de la tabla de validaciones. |
| 4.1 | Aprendiz | Decide retomar. | Limpia la foto y regresa al paso 1. |
| 5.1 | Sistema | Error al guardar en servidor. | Muestra mensaje: "No fue posible guardar el registro. Intenta nuevamente." |
| 5.2 | Sistema | El aprendiz ya tiene un rostro registrado. | Muestra advertencia y solicita autorización del Coordinador para reemplazarlo. |

**Postcondición:**
- El aprendiz queda con estado facial `registered`.
- Se registra auditoría del registro biométrico (userId, fecha, hora).
- Solo se almacena **una** captura frontal válida por usuario.

**Criterios de aceptación:**
- No se puede capturar desde galería, solo desde cámara en vivo.
- La detección de pantalla de celular/foto impresa debe rechazar la captura.
- La detección de gorra, gafas y poca luz debe bloquear el botón de captura en tiempo real.
- Tiempo de análisis de calidad: < 500 ms por frame.
- El aprendiz puede retomar la captura ilimitadas veces en la misma sesión.
- Para reemplazar un rostro ya registrado, se requiere autorización explícita del Coordinador.

**Lo que el Aprendiz NO puede hacer en este módulo:**
- No puede ver ni gestionar registros faciales de otros usuarios.
- No puede eliminar su propio registro facial sin autorización del Coordinador.
- No puede subir imágenes desde galería.

---

## RF-6 — ASISTENCIAS Y VALIDACIONES (Rol Aprendiz)

### RF-6.1 — Ver el registro de entrada y salida propio

**Versión:** 1.0 – 11/09/2026  
**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-6.1 SRS_V1

**Descripción:**  
El aprendiz puede consultar su propio historial de entradas y salidas de ambientes registradas automáticamente por el sistema de reconocimiento facial. No puede crear, editar ni eliminar registros de asistencia.

**Precondición:**
- El aprendiz debe estar autenticado.
- Deben existir al menos un registro de asistencia para ese usuario.

**Secuencia Normal:**

| Paso | Actor | Acción | Sistema |
|---|---|---|---|
| 1 | Aprendiz | Accede a "Mi Asistencia". | Muestra el historial de asistencias del aprendiz autenticado. |
| 2 | Sistema | — | Presenta: fecha, hora de entrada, hora de salida, ambiente, ficha, estado (puntual / tarde / ausente). |
| 3 | Aprendiz | Aplica filtros por fecha (opcional). | Actualiza la lista según los filtros. |

**Escenarios Alternativos:**

| Paso | Actor | Acción | Sistema |
|---|---|---|---|
| 1.1 | Sistema | No hay registros. | Muestra: "No tienes registros de asistencia aún." |

**Postcondición:** Solo visualización — ningún registro se modifica.

**Criterios de aceptación:**
- Solo se muestran los registros del aprendiz autenticado (filtrado por `userId`).
- El estado de cada registro se muestra con colores semánticos: verde (puntual), amarillo (tarde), rojo (ausente).
- La lista está ordenada por fecha, más reciente primero.

**Lo que el Aprendiz NO puede hacer:**
- No puede ver asistencias de otros aprendices o de la ficha completa.
- No puede modificar ni eliminar registros de asistencia.
- No puede registrar manualmente su propia entrada/salida.

---

### RF-6.2 — Ver el cálculo de retrasos propios

**Versión:** 1.0 – 11/09/2026  
**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-6.3 SRS_V1 (referenciado como RF-6.2 en la vista del aprendiz)

**Descripción:**  
El aprendiz puede ver en su historial cuántos minutos llegó tarde en cada sesión. El cálculo lo realiza el backend (`horaIngreso - horaProgramada`). El aprendiz solo consulta el resultado; no puede modificar la tolerancia ni el umbral de retraso.

**Precondición:**
- Existen registros de asistencia con campo `delayMinutes > 0` para el usuario.

**Secuencia Normal:**

| Paso | Actor | Acción | Sistema |
|---|---|---|---|
| 1 | Aprendiz | Visualiza un registro con estado "Tarde". | Muestra los minutos de retraso junto al registro. |
| 2 | Sistema | — | Resumen en pantalla: total de retrasos del mes, promedio de minutos de retraso. |

**Criterios de aceptación:**
- Los minutos de retraso se muestran solo en registros con estado `late`.
- El resumen mensual suma todos los `delayMinutes` del período seleccionado.
- No se muestra información de otros aprendices.

**Lo que el Aprendiz NO puede hacer:**
- No puede modificar el umbral de tolerancia de retrasos.
- No puede cambiar el estado de un registro de "tarde" a "puntual".

---

## RF-7 — REPORTES Y CONSULTAS (Rol Aprendiz)

> El aprendiz accede únicamente a reportes de **sus propios datos**. No tiene acceso a reportes de la ficha completa ni de otros usuarios.

### RF-7.1 — Reporte de asistencia personal

**Versión:** 1.0 – 11/09/2026  
**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-7.1 SRS_V1

**Descripción:**  
El aprendiz puede consultar un informe de su propia asistencia con filtros por rango de fechas y exportarlo.

La vista muestra:
- Fecha
- Hora de entrada y salida
- Ambiente
- Estado (puntual / tarde / ausente)
- Minutos de retraso
- Tiempo total en clase por sesión

**Precondición:**
- Deben existir registros de asistencia del aprendiz.

**Secuencia Normal:**

| Paso | Actor | Acción | Sistema |
|---|---|---|---|
| 1 | Aprendiz | Accede a "Mi Rendimiento" o "Mi Asistencia → Reporte". | Muestra formulario de filtros (rango de fechas). |
| 2 | Aprendiz | Selecciona rango y confirma. | Genera tabla con el historial filtrado. |
| 3 | Aprendiz | Pulsa "Exportar" (opcional). | Ofrece descarga en PDF o Excel. |

**Escenarios Alternativos:**

| Paso | Actor | Acción | Sistema |
|---|---|---|---|
| 2.1 | Sistema | Sin registros en el rango. | Muestra: "No existen registros para este período." |
| 3.1 | Sistema | Error al generar archivo. | Muestra: "No se pudo generar el archivo. Intenta nuevamente." |

**Criterios de aceptación:**
- Solo muestra datos del usuario autenticado.
- Los datos están ordenados por fecha descendente.
- La exportación PDF debe ser legible y contener los mismos datos de pantalla.
- La exportación Excel debe tener columnas organizadas.
- El tiempo de exportación no supera 5 segundos.

**Lo que el Aprendiz NO puede hacer:**
- No puede ver ni exportar el reporte de asistencia de la ficha completa.
- No puede ver datos de otros aprendices, aunque pertenezcan a su ficha.

---

### RF-7.2 — Estadísticas personales de asistencia

**Versión:** 1.0 – 11/09/2026  
**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-7.3 SRS_V1

**Descripción:**  
El aprendiz puede visualizar sus indicadores personales de asistencia en la pantalla "Mi Rendimiento":
- Porcentaje de asistencia total
- Número de retrasos
- Días sin asistencia
- Promedio de minutos de retraso
- Gráfico mensual (barras o línea)

**Precondición:**
- Deben existir al menos un registro de asistencia del usuario.

**Criterios de aceptación:**
- Los gráficos son claros y se adaptan al tema (claro/oscuro).
- Si no hay datos suficientes: "No existen registros suficientes para generar estadísticas."
- Las estadísticas solo reflejan los datos del aprendiz autenticado.

---

### RF-7.3 — Historial de asistencia en lista (estilo bandeja)

**Versión:** 2.0 – 11/09/2026 *(reemplaza la vista calendario)*  
**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-7.4 SRS_V1 · Instrucciones de la lider de proyecto

**Descripción:**  
El aprendiz visualiza su historial de asistencia como una **lista de filas estilo bandeja de entrada (Gmail)**, ordenada por fecha descendente. Es una vista de **solo lectura** — no hay interacción de click para abrir un detalle, no hay calendario visual, no hay celdas por día.

Cada fila muestra en una sola línea horizontal:

| Campo visible | Ejemplo |
|---|---|
| Indicador de color (estado) | 🟢 / 🟡 / 🔴 |
| Fecha | Vie, 11 sep 2026 |
| Hora de entrada | 07:00 |
| Hora de salida | 12:05 |
| Ambiente | Salón 101 |
| Estado | Puntual / Tarde (15 min) / Ausente |

Codificación visual del estado en cada fila:
- 🟢 **Verde** — Asistencia puntual
- 🟡 **Amarillo** — Llegada tarde (se muestra además cuántos minutos)
- 🔴 **Rojo** — Ausencia

El aprendiz puede filtrar la lista por rango de fechas (selector de mes o rango libre). El filtro actualiza la lista pero no cambia el formato — siempre es lista, nunca calendario.

**Precondición:**
- El aprendiz debe estar autenticado.
- Deben existir al menos un registro para mostrar filas (si no hay, se muestra mensaje vacío).

**Secuencia Normal:**

| Paso | Actor | Acción | Sistema |
|---|---|---|---|
| 1 | Aprendiz | Accede a "Mi Asistencia → Historial". | Muestra la lista de registros ordenada por fecha descendente. |
| 2 | Aprendiz | Aplica filtro de mes/rango (opcional). | Actualiza la lista con los registros del período seleccionado. |
| 3 | Aprendiz | Lee las filas. | No hay acción adicional — es visualización pura. |

**Escenario Alternativo:**

| Paso | Actor | Acción | Sistema |
|---|---|---|---|
| 1.1 | Sistema | No hay registros en el período. | Muestra: "No hay registros para este período." |

**Postcondición:** Solo visualización — ningún registro se modifica.

**Criterios de aceptación:**
- La vista es exclusivamente una lista de filas (no un calendario con celdas por día).
- Las filas no son clickeables — no abren ningún detalle al tocarlas.
- El indicador de color (punto o barra lateral) distingue visualmente el estado sin necesidad de leer el texto.
- Registros con estado `late` muestran los minutos de retraso en la misma fila: "Tarde · 15 min".
- La lista está ordenada por fecha descendente (más reciente arriba), igual que una bandeja de correo.
- Los filtros actualizan la lista sin recargar la pantalla completa.
- Los colores semánticos usan `Colors.success` (verde), `Colors.warning` (amarillo) y `Colors.error` (rojo) — nunca hex directos.
- Si no hay registros: mensaje vacío con ícono, sin mostrar filas en blanco.

**Lo que el Aprendiz NO puede hacer:**
- No puede abrir ni expandir el detalle de un registro tocando la fila.
- No puede modificar ni eliminar registros desde esta vista.
- No puede ver registros de otros aprendices.
- No existe vista de calendario en esta pantalla.

---

## RF-8 — NOTIFICACIONES (Rol Aprendiz)

### RF-8.1 — Notificaciones automáticas dirigidas al aprendiz

**Versión:** 1.0 – 11/09/2026  
**Actor:** Sistema  
**Fuentes:** RF-8.1 SRS_V1

**Descripción:**  
El sistema genera automáticamente notificaciones para el aprendiz según los siguientes eventos. El aprendiz solo las recibe — no las genera ni las gestiona.

**Catálogo completo de notificaciones para el Aprendiz:**

| Categoría | Evento | Mensaje de ejemplo |
|---|---|---|
| `attendance` | Asistencia registrada correctamente | "Tu asistencia del [fecha] en [Ambiente] fue registrada." |
| `attendance` | Llegada tarde | "Registraste llegada tarde: [N] min de retraso en [Ambiente]." |
| `attendance` | Ausencia registrada automáticamente | "Quedaste marcado como ausente en la clase del [fecha]." |
| `schedule` | Cambio de horario en su ficha | "El horario del [día] fue modificado: ahora es de [H inicio] a [H fin]." |
| `schedule` | Excepción de horario activa | "La clase del [fecha] cambia de horario temporalmente." |
| `environment` | Cambio de ambiente | "Tu clase del [fecha] se dicta en [Nuevo Ambiente] en lugar de [Ambiente original]." |
| `environment` | Ingreso a ambiente incorrecto detectado | "Ingresaste a [Ambiente], pero tu clase corresponde a [Ambiente correcto]." |
| `facial` | Registro facial pendiente | "Aún no has completado tu registro facial. Complétalo para poder registrar asistencia." |
| `facial` | Registro facial completado | "Tu registro facial fue guardado correctamente." |
| `facial` | Registro facial incorrecto (otra persona) | "Se detectó un posible error en tu registro biométrico. Contacta a tu Coordinador para corregirlo." |
| `facial` | Solicitud de re-registro aprobada por Coordinador | "Tu Coordinador aprobó el re-registro facial. Ya puedes volver a registrar tu rostro." |
| `system` | Mantenimiento programado del sistema | "El sistema estará en mantenimiento el [fecha] de [H] a [H]." |
| `academic` | Desvinculación de ficha (traslado) | "Fuiste desvinculado de la ficha [número]. Ingresa el código de tu nueva ficha para continuar." |
| `academic` | Vinculación exitosa a nueva ficha | "Te uniste exitosamente a la ficha [número] del programa [Programa]." |

**Criterios de aceptación:**
- Las notificaciones se generan automáticamente sin intervención manual del aprendiz.
- Cada notificación incluye: título, mensaje, categoría, fecha y hora.
- Las notificaciones no leídas muestran un indicador visual (punto verde en el ícono de la campana).

---

### RF-8.2 — Visualización de notificaciones en la interfaz

**Versión:** 1.0 – 11/09/2026  
**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-8.2 SRS_V1

**Descripción:**  
El aprendiz accede al centro de notificaciones desde cualquier pantalla (ícono de campana en el header). Puede filtrar por estado (todas / no leídas / leídas) y marcar como leídas.

**Funcionalidades disponibles para el Aprendiz:**
- Ver listado de notificaciones ordenadas por fecha (más reciente primero).
- Filtrar por: Todas · No leídas · Leídas.
- Marcar una notificación como leída al tocarla.
- Marcar todas como leídas con un botón "Marcar todo como leído".
- El contador de no leídas se muestra en el ícono de campana del header.

**Precondición:**
- El aprendiz debe estar autenticado.

**Criterios de aceptación:**
- Las notificaciones de otros usuarios no son visibles (filtrado estricto por `userId`).
- El contador de no leídas se actualiza inmediatamente al marcar como leída.
- Si no hay notificaciones: "No tienes notificaciones por ahora."
- Las notificaciones no leídas se distinguen visualmente de las leídas (mayor peso de fuente, indicador circular).

**Lo que el Aprendiz NO puede hacer:**
- No puede crear notificaciones.
- No puede eliminar notificaciones.
- No puede ver notificaciones de otros usuarios.
- No puede configurar qué tipo de notificaciones recibe (configuración de sistema).

---

### RF-8.3 — Envío de notificaciones por correo electrónico

**Versión:** 1.0 – 11/09/2026  
**Actor:** Sistema / Aprendiz (receptor)  
**Fuentes:** RF-8.3 SRS_V1

**Descripción:**  
Algunos eventos críticos generan adicionalmente un correo electrónico al aprendiz, al correo registrado en su cuenta. Esta funcionalidad es responsabilidad del backend; el frontend solo muestra el estado de la notificación.

**Eventos que generan correo al Aprendiz:**
- Desvinculación de ficha (traslado).
- Detección de registro facial incorrecto.
- Aprobación de solicitud de re-registro facial.
- Ausencia acumulada que supere el umbral institucional (si el backend lo implementa).

**Criterios de aceptación (frontend):**
- El aprendiz no puede configurar ni cambiar su correo de notificaciones desde la app (el correo se establece en el registro y solo se puede cambiar desde el perfil con verificación).
- La pantalla de notificaciones no diferencia visualmente si una notificación también fue enviada por correo — esa es información del backend.

---

## RF-9 — PERFIL Y PERSONALIZACIÓN (Rol Aprendiz)

### RF-9.1 — Visualización del perfil

**Versión:** 1.0 – 11/09/2026  
**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-9.1 SRS_V1 · Instrucciones de la lider de proyecto

**Descripción:**  
El aprendiz puede ver sus datos personales registrados. El perfil es de **solo visualización** para los 4 datos base; no existe edición de datos desde esta pantalla.

**Datos que se muestran:**
1. Nombre
2. Apellido
3. Número de documento
4. Correo electrónico

> **Nota de la lider del proyecto:** "En mi perfil, solamente guarda cuatro datos, no más."

La ficha académica a la que pertenece el aprendiz se muestra de forma informativa (solo lectura) si existe vínculo activo.

**Precondición:**
- El aprendiz debe estar autenticado.

**Criterios de aceptación:**
- Los 4 datos provienen del token JWT y/o del endpoint del perfil del usuario.
- Los campos se muestran en modo lectura — no hay inputs editables.
- Si algún dato está vacío en el servidor, se muestra "—" o "Sin registrar".

**Lo que el Aprendiz NO puede hacer:**
- No puede editar ninguno de sus datos de perfil desde esta pantalla.
- No puede ver datos de otros usuarios.

---

### RF-9.2 — Cerrar sesión

**Versión:** 1.0 – 11/09/2026  
**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-9.2 SRS_V1

**Descripción:**  
El aprendiz puede cerrar sesión desde el perfil o desde el sidebar. Al cerrar sesión, el token JWT se elimina del almacenamiento seguro y el usuario es redirigido al login.

**Precondición:**
- El aprendiz debe tener una sesión activa.

**Secuencia Normal:**

| Paso | Actor | Acción | Sistema |
|---|---|---|---|
| 1 | Aprendiz | Pulsa "Cerrar sesión". | Muestra diálogo de confirmación: "¿Deseas cerrar sesión?" |
| 2 | Aprendiz | Confirma. | Elimina el token del almacenamiento seguro, limpia el estado de AuthContext, redirige a `/auth/login`. |

**Escenario Alternativo:**

| Paso | Actor | Acción | Sistema |
|---|---|---|---|
| 2.1 | Aprendiz | Cancela el diálogo. | No realiza ninguna acción. |

**Criterios de aceptación:**
- El token se elimina completamente de `expo-secure-store` al cerrar sesión.
- Después del cierre, el usuario no puede volver atrás con el botón de regreso.
- La redirección ocurre solo después de que React confirme el nuevo estado (no inline).

---

### RF-9.3 — Configuración general

**Versión:** 1.0 – 11/09/2026  
**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-9.3 SRS_V1

**Descripción:**  
La pantalla de configuración (`/profile/settings`) permite al aprendiz ajustar preferencias de apariencia e idioma. No incluye configuración de cuenta ni datos personales.

**Opciones disponibles para el Aprendiz:**
- Cambiar tema visual (claro / oscuro).
- Cambiar idioma (ES / EN / DE / FR).

**Criterios de aceptación:**
- El cambio de tema se aplica inmediatamente en toda la app sin recargar.
- El cambio de idioma se aplica inmediatamente.
- Las preferencias persisten entre sesiones (guardadas en AsyncStorage o SecureStore).

**Lo que el Aprendiz NO puede hacer:**
- No puede cambiar su contraseña desde esta pantalla (el cambio de contraseña está en el flujo de recuperación de contraseña).
- No puede acceder a configuraciones del sistema ni de otros usuarios.

---

### RF-9.4 — Configuración de idioma

**Versión:** 1.0 – 11/09/2026  
**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-9.4 SRS_V1

**Descripción:**  
El aprendiz puede cambiar el idioma de la interfaz en cualquier momento desde la configuración o desde el selector de idioma del header (`LanguageSelector`). Idiomas disponibles: Español (ES), English (EN), Deutsch (DE), Français (FR).

**Criterios de aceptación:**
- Todos los textos de la app cambian al nuevo idioma sin recargar la pantalla.
- El idioma seleccionado se persiste para la próxima apertura de la app.
- Las claves de traducción inexistentes muestran la clave en lugar de un error en pantalla.

---

### RF-9.5 — Personalización del dashboard (colores / tema)

**Versión:** 1.0 – 11/09/2026  
**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-9.5 SRS_V1

**Descripción:**  
El aprendiz puede alternar entre modo claro y modo oscuro desde el dashboard (botón `ThemeToggle` en el header) o desde la pantalla de configuración. El tema afecta toda la aplicación uniformemente.

> **Estado actual:** El cambio de tema es global (claro/oscuro). La personalización de colores por usuario individual está pendiente de implementación según el SRS.

**Criterios de aceptación:**
- El toggle de tema está visible y accesible en el header de todas las pantallas del aprendiz.
- El cambio se aplica inmediatamente.
- La preferencia de tema persiste entre sesiones.
- El tema oscuro usa la paleta definida en `Colors.dark` y el claro usa `Colors.light`.

---

## RNF — Requerimientos No Funcionales (Rol Aprendiz)

> Basados en la sección 3.3 del SRS_V1 y aplicados específicamente a las 5 pantallas del aprendiz.

### RNF-A1 — Seguridad de datos propios

**Descripción:** El aprendiz solo puede acceder, visualizar y exportar sus propios datos. Ninguna consulta o llamada a API puede retornar datos de otros usuarios.

**Criterios de aceptación:**
- Todas las consultas al backend incluyen el `userId` del token JWT — no parámetros externos.
- El backend valida que el `userId` del token coincida con el recurso solicitado (RBAC).
- Si se intenta acceder a una ruta fuera del rol: respuesta `403 Forbidden`.

---

### RNF-A2 — Cifrado de credenciales y datos biométricos

**Descripción:** El token JWT y los datos biométricos se almacenan únicamente en almacenamiento seguro (`expo-secure-store`). Las contraseñas nunca se almacenan ni se transmiten en texto plano.

**Criterios de aceptación:**
- El token se guarda en `expo-secure-store`, nunca en `AsyncStorage` plano.
- La captura facial se transmite cifrada al servidor.
- Las contraseñas usan hashing seguro en el backend.

---

### RNF-A3 — Sesiones seguras y expiración de token

**Descripción:** El sistema detecta la expiración del JWT al abrir la app y al recibir un `401` de la API. Cuando expira, el aprendiz es redirigido al login automáticamente.

**Criterios de aceptación:**
- Al restaurar sesión, se verifica `payload.exp * 1000 < Date.now()`. Si expira, se elimina el token y se redirige.
- El interceptor de Axios ante `401` llama a `logout()` automáticamente *(actualmente solo hace `console.warn` — esto es una brecha a corregir)*.
- El aprendiz no puede acceder a pantallas protegidas con token expirado.

---

### RNF-A4 — Tiempos de respuesta (usabilidad)

**Descripción:** Las pantallas del aprendiz deben responder dentro de los tiempos aceptables para garantizar una experiencia fluida.

| Acción | Tiempo máximo |
|---|---|
| Cargar el dashboard | < 2 segundos |
| Cargar historial de asistencia (filtrado) | < 2 segundos |
| Cargar calendario de asistencia | < 2 segundos |
| Análisis de calidad de imagen (cámara) | < 500 ms por frame |
| Exportar reporte PDF/Excel | < 5 segundos |
| Validación de ambiente correcto | < 1 segundo |
| Tiempo de reconocimiento facial | < 2 segundos |

---

### RNF-A5 — Usabilidad e interfaz dinámica

**Descripción:** La interfaz del aprendiz debe ser intuitiva, accesible y coherente con el sistema de diseño del proyecto.

**Criterios de aceptación:**
- Se usan los colores del sistema (`Colors`, `useTheme()`) — nunca hex directos.
- Los textos usan el sistema i18n (`t('clave')`) — nunca strings hardcodeados.
- Las rutas usan `Routes.*` — nunca strings de ruta directos.
- Los estados de carga muestran `ActivityIndicator` o skeleton.
- Los errores se presentan con `AppDialog` (nunca `alert()` nativo en producción).
- La app es usable en modo oscuro y claro.
- Los botones de acción destructiva (cerrar sesión) muestran diálogo de confirmación.

---

### RNF-A6 — Privacidad y protección de datos personales (Ley 1581 de 2012)

**Descripción:** El tratamiento de los datos personales del aprendiz (incluyendo datos biométricos) cumple con la Ley 1581 de 2012 y sus decretos reglamentarios.

**Criterios de aceptación:**
- El aprendiz acepta explícitamente la política de privacidad al registrarse.
- Los datos biométricos solo se usan para control de asistencia — propósito declarado en la política.
- Se muestra aviso de responsabilidad antes de registrar el rostro (RF-5.1).
- Los datos del aprendiz se cifran en tránsito (HTTPS) y en reposo.
- El aprendiz no puede ser suplantado en el sistema sin que quede trazabilidad del evento.

---

### RNF-A7 — Validación de datos del aprendiz

**Descripción:** Los datos propios del aprendiz que el sistema muestra (perfil) corresponden al JWT activo y al registro del backend — no a caché local desactualizada.

**Criterios de aceptación:**
- El nombre y rol mostrados en el perfil y en la pantalla de confirmación facial provienen del JWT decodificado y/o del endpoint de perfil.
- Si el backend no tiene datos para un campo, se muestra "—" en lugar de un error.

---

### RNF-A8 — Gestión de permisos por rol (RBAC)

**Descripción:** El aprendiz solo accede a las funcionalidades definidas para su rol. El sidebar y los menús muestran únicamente las opciones de su rol.

**Criterios de aceptación:**
- El `Sidebar` filtra los ítems de menú según el rol del usuario (`useAuth().role`).
- Un aprendiz que intenta acceder a una ruta de administrador es redirigido a su dashboard.
- El rol no puede ser modificado por el aprendiz (solo el backend/admin asigna roles).

---

*Documento generado el 2026-09-11 · FaceLit · SENA · Programación de Software 3145555*
