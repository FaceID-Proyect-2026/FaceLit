# Requerimientos Funcionales y No Funcionales — Rol Aprendiz (APPRENTICE)

---

## RF-6 ASISTENCIAS Y VALIDACIONES (Vista Aprendiz)

### RF-6.1 Registrar entrada y salida del usuario

**Actor:** Aprendiz / Sistema / Módulo de Reconocimiento Facial (PC con cámara en ambiente)  
**Fuentes:** RF-5.2 Identificar usuario, RF-5.3 Enviar datos al servidor, RF-4 Gestión de horarios  

**Descripción:**  
El aprendiz NO registra manualmente su entrada/salida. El sistema lo hace automáticamente cuando el **módulo de reconocimiento facial (computador con cámara instalado en el ambiente)** detecta su rostro y envía el evento al servidor. El aprendiz solo visualiza el resultado en su historial.  
- La cámara del computador captura el rostro → compara con modelo local → si supera umbral, envía paquete (userId, ambiente, ficha, timestamp, tipo evento) al servidor.  
- El servidor determina si es entrada o salida según último registro y hora.  
- El aprendiz ve el registro en "Mi asistencia" con fecha, hora, ambiente y estado (entrada/salida).

**Precondición:**  
- El aprendiz tiene rostro registrado (RF-5.1 completado).  
- El computador con cámara del ambiente está operativo y conectado.  
- El aprendiz tiene horario asignado en su ficha para ese día/hora.  
- Existe conexión con el servidor (o modo offline activo en el módulo local).

**Qué NO puede hacer el Aprendiz:**  
- No puede forzar un registro manual de entrada/salida.  
- No puede editar, borrar o modificar registros ya generados.  
- No puede registrar entrada de otro aprendiz.  
- No accede a registros de otros usuarios.

**Criterios de aceptación:**  
- El registro aparece en "Mi asistencia" en < 5 segundos tras el reconocimiento facial.  
- Cada evento muestra: fecha, hora exacta (segundos), ambiente, tipo (entrada/salida).  
- Si el aprendiz no tiene horario ese día/hora, el sistema registra como "ingreso no programado" (anomalía visible en su historial).  
- Eventos duplicados (múltiples lecturas seguidas) se consolidan: primera entrada válida, resto marcados como duplicados.  
- Sin conexión: el módulo local almacena en cola y sincroniza al restablecer red; el aprendiz ve estado "pendiente de sincronización" hasta completar.

---

### RF-6.2 Cálculo de retrasos

**Actor:** Sistema (automático) → visible para Aprendiz  
**Fuentes:** RF-6.1 Entrada, RF-4 Horarios, Reglamento de asistencia institucional  

**Descripción:**  
El sistema calcula automáticamente si el aprendiz llegó tarde comparando la hora de entrada registrada por reconocimiento facial contra la hora de inicio de clase según su horario (incluyendo excepciones activas RF-4.4). El aprendiz visualiza el resultado en su reporte/lista.  
- Tolerancia configurable por institución (ej. 10 min).  
- Si supera tolerancia → marca "Retraso" en el registro del día.  
- Si llega antes o dentro de tolerancia → "Puntual".

**Precondición:**  
- El aprendiz tiene horario activo para ese día.  
- Existe registro de entrada (RF-6.1) para esa fecha/ambiente.

**Qué NO puede hacer el Aprendiz:**  
- No puede modificar la tolerancia ni la hora de inicio de clase.  
- No puede apelar/editar el cálculo desde la app (eso lo gestiona Instructor/Admin vía excusas RF-7.4.1).  
- No ve retrasos de otros aprendices.

**Criterios de aceptación:**  
- Cálculo automático y preciso (diferencia en minutos entre hora real y hora programada).  
- Tolerancia configurable desde backend (no hardcodeada).  
- En "Mi asistencia": registro marcado con etiqueta "Retraso: X min" y color amarillo.  
- Si hay excepción de horario activa (cambio de ambiente/instructor), el cálculo usa el horario modificado.  
- Evidencia del retraso queda registrada en bitácora para auditoría.

---

## RF-7 REPORTES Y CONSULTAS (Vista Aprendiz)

### RF-7.1 Reporte de asistencia por usuario (Propio)

**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-6.1 Entradas y salidas, RF-6.2 Cálculo de retrasos  

**Descripción:**  
Pantalla **"Mi Asistencia"** (lista cronológica) donde el aprendiz consulta SOLO su propio historial con filtros.  
Datos visibles por registro: fecha, hora entrada, hora salida, ambiente, retrasos (min), estado (puntual/retraso/ausente/no programado), tiempo total en clase.  
Filtros disponibles: rango de fechas, ficha (si ha estado en varias), ambiente, programa.

**Precondición:**  
- El aprendiz tiene al menos un registro de asistencia en BD.  
- Usuario autenticado con rol aprendiz.

**Qué NO puede hacer el Aprendiz:**  
- NO ve reporte de otros aprendices.  
- NO ve reporte consolidado de ficha completa (eso es RF-7.2 para Instructor/Admin).  
- NO exporta a PDF/Excel (solo visualización en app).  
- NO modifica ni elimina registros.

**Criterios de aceptación:**  
- Lista ordenada por fecha descendente (más reciente primero).  
- Filtros aplican en tiempo real (< 2 seg).  
- Si no hay registros para el filtro: mensaje "No existen registros para este período".  
- Cada fila muestra ícono/color según estado: verde=puntual, amarillo=retraso, rojo=ausente, gris=no programado.  
- Tiempo total en clase calculado (salida - entrada) solo si ambas existen.

---

### RF-7.2 Reporte de asistencia por ficha (Vista Aprendiz = SOLO SU FICHA ACTUAL)

**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-3 Gestión de fichas, RF-6 Asistencia  

**Descripción:**  
El aprendiz puede consultar un resumen grupal LIMITADO a su ficha actual:  
- Porcentaje de asistencia total de la ficha (promedio grupal).  
- Su posición relativa (ej. "Tu asistencia: 92% | Promedio ficha: 85%").  
- NO lista individual de compañeros, NO nombres, NO datos personales de otros.  
- Solo estadísticas agregadas anonimizadas.

**Precondición:**  
- El aprendiz tiene ficha activa asociada.  
- Existen registros de asistencia para al menos un estudiante de la ficha.

**Qué NO puede hacer el Aprendiz:**  
- NO ve listado de estudiantes con sus porcentajes individuales.  
- NO ve retrasos/ausencias de compañeros.  
- NO filtra por otros aprendices.  
- NO exporta el reporte.  
- Si no tiene ficha (huérfano/traslado pendiente): mensaje "No tienes ficha activa asignada".

**Criterios de aceptación:**  
- Carga en < 2 segundos.  
- Muestra: % asistencia ficha, % asistencia propio, total clases del período, clases asistidas propio.  
- Gráfico simple (barra o dona) comparando propio vs promedio ficha.  
- Datos anonimizados: ningún nombre, documento o email de terceros.

---

### RF-7.3 Historial de asistencia — Vista en Lista Agrupada por Mes (REEMPLAZA CALENDARIO)

**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-7 Reportes, RF-7.4.1 Envío de excusas  

**Descripción:**  
**Se elimina la vista de calendario mensual** por ser tediosa y de difícil escaneo. Se reemplaza por una **Lista Agrupada por Mes** (tipo "timeline" colapsable), optimizada para escaneo rápido y acción directa sobre ausencias.

**Estructura de la pantalla "Mi Historial":**
```
┌─────────────────────────────────────────┐
│  Mi Historial                    [Filtro: Último año ▼] │
├─────────────────────────────────────────┤
│  ▼ SEPTIEMBRE 2026 (18 clases)          │
│  ┌───────────────────────────────────┐  │
│  │ Lun 01  🟢 Puntual   06:58  Salón 101    │  │
│  │ Mar 02  🟡 Retraso 12m  07:12  Salón 101  │  │
│  │ Mié 03  🔴 Ausente                │  │  ← Tap → "Enviar excusa"
│  │ Jue 04  🟢 Puntual   06:55  Salón 101    │  │
│  │ Vie 05  ⚪ Sin clase                                    │  │
│  └───────────────────────────────────┘  │
│  ▼ AGOSTO 2026 (20 clases)              │
│  ┌───────────────────────────────────┐  │
│  │ ... (colapsado por defecto)       │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Estados visuales por día:**
- 🟢 **Verde / "Puntual"**: Entrada registrada dentro de tolerancia.
- 🟡 **Amarillo / "Retraso X min"**: Entrada fuera de tolerancia.
- 🔴 **Rojo / "Ausente"**: Día con clase programada SIN registro de entrada.
- ⚪ **Gris / "Sin clase"**: Día sin horario (fin de semana, festivo, día libre).
- 🔵 **Azul / "Ingreso no programado"**: Entrada registrada en día/hora sin horario.

**Interacciones:**
- **Tap en fila 🔴 Ausente** → Abre modal "Enviar excusa" (RF-7.4.1) directamente.
- **Tap en cualquier fila** → Detalle expandido: ambiente, hora entrada/salida, estado, retraso si aplica.
- **Acordeón por mes**: Colapsado/expandido (estado persistido en preferencias).
- **Filtro rápido**: "Último mes / Último trimestre / Último año / Personalizado".
- **Buscador**: Por ambiente, estado, rango de fechas.
- **Pull-to-refresh** para sincronizar.

**Precondición:**  
- Usuario autenticado como aprendiz.  
- Existe al menos un registro de asistencia (aunque sea uno).

**Qué NO puede hacer el Aprendiz:**  
- NO modifica colores ni estados.  
- NO ve historial de otros usuarios.  
- NO edita horarios ni excepciones (eso es Admin/Instructor).  
- NO elimina días del historial.

**Criterios de aceptación:**  
- Lista carga en < 2 seg para 12 meses de datos.  
- Scroll fluido (60 fps) sin paginación (virtualización).  
- Mes actual expandido por defecto; anteriores colapsados.  
- Tap en ausente → modal excusa en < 500 ms.  
- Filtros actualizan vista inmediatamente.  
- Coherencia total con registros reales en BD.  
- Días futuros no se muestran (solo pasado y hoy).

---

### RF-7.4.1 Envío de excusas por ausencia (Desde lista historial)

**Actor:** Aprendiz / Instructor / Coordinador / Administrador  
**Fuentes:** RF-7.3 Historial, RF-6 Asistencia, RF-4 Horarios  

**Descripción:**  
Al tocar una fila marcada como **Ausente (🔴)** en la lista agrupada por mes, el aprendiz puede enviar excusa formal:  
- Mensaje explicativo (texto libre, obligatorio, máx. 500 caracteres).  
- Archivo PDF adjunto (obligatorio, máx. 5 MB).  
- Fecha/hora de envío automática.  
- Estado inicial: "Pendiente".  
- Notificación automática a Instructor/Coordinador/Admin para revisión.  
- El aprendiz ve historial de sus excusas enviadas con estado (Pendiente/Aprobada/Rechazada) en misma pantalla (pestaña "Mis excusas").

**Precondición:**  
- Fila seleccionada tiene estado "Ausente" (día con clase programada sin entrada).  
- Usuario autenticado.  
- Pantalla "Mi Historial" cargada.

**Qué NO puede hacer el Aprendiz:**  
- NO envía excusa para días que no son ausencia (verde/amarillo/azul/gris).  
- NO envía sin adjuntar PDF.  
- NO modifica/elimina excusa ya enviada.  
- NO aprueba/rechaza excusas (eso es Instructor/Coordinador/Admin).  
- NO ve excusas de otros aprendices.

**Criterios de aceptación:**  
- Validación obligatoria de PDF (tipo MIME application/pdf y tamaño ≤ 5 MB).  
- Excusa queda almacenada con estado "Pendiente", fecha/hora, usuario.  
- Notificación automática a roles revisores (push + email si crítico).  
- Pestaña "Mis excusas" lista todas las propias con estado y fecha.  
- No permite duplicar excusa para mismo usuario+fecha.  
- Una vez enviada, el aprendiz NO puede alterar el contenido (inmutabilidad).

---

## RF-8 NOTIFICACIONES (Vista Aprendiz)

### RF-8.1 Generación automática de notificaciones (Dirigidas al aprendiz)

**Actor:** Sistema (principal) → Aprendiz (destinatario)  
**Fuentes:** RF-6 Asistencia, RF-7 Reportes, RF-4 Horarios, RF-5 Facial  

**Descripción:**  
El sistema genera notificaciones automáticas SIN intervención humana para eventos que afectan al aprendiz:  
- "Llegaste tarde al ambiente X" (retraso detectado RF-6.2).  
- "Cambio de ambiente para tu clase de mañana" (excepción RF-4.4 ENVIRONMENT_CHANGE).  
- "Cambio de instructor para tu clase" (excepción INSTRUCTOR_CHANGE).  
- "Intentaste ingresar a ambiente no asignado" (anomalía RF-6.2).  
- "Tu registro facial está pendiente/por vencer" (vigencia 12 meses RNF-2).  
- "Expira tu código de ficha" / "Solicitud de traslado aprobada/rechazada" (RF-3.3, transfer-request).  
- "Nueva excusa aprobada/rechazada" (RF-7.4.1).

Clasificación automática: Alerta (retraso, anomalía), Recordatorio (facial pendiente), Aviso (cambios horario, excusas).

**Precondición:**  
- El aprendiz existe y tiene sesión activa o token válido.  
- Eventos fuente están correctamente registrados.  
- Motor de notificaciones activo en backend.

**Qué NO puede hacer el Aprendiz:**  
- NO genera notificaciones manualmente.  
- NO configura reglas de generación (eso es Admin).  
- NO recibe notificaciones de otros usuarios.

**Criterios de aceptación:**  
- Notificación generada < 1 segundo tras el evento disparador.  
- Clasificación correcta (alerta/recordatorio/aviso).  
- Ningún evento válido se pierde.  
- Registro en BD con: tipo, mensaje, usuario destino, fecha/hora, estado (leída/no leída), categoría.

---

### RF-8.2 Visualización de notificaciones en la interfaz

**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-8.1 Generación, RF-9 Perfil  

**Descripción:**  
Pantalla "Notificaciones" (accesible desde icono campana en header del Dashboard):  
- Lista cronológica (más reciente arriba).  
- Cada ítem: ícono/category color, título, mensaje, fecha/hora, estado (leída/no leída con punto azul).  
- Filtros: Todas / No leídas / Leídas (contador en pestaña "No leídas").  
- Acciones: tap para marcar como leída, botón "Marcar todas como leídas" si hay no leídas.  
- Pull-to-refresh para actualizar.  
- Empty state: "No tienes notificaciones".

**Precondición:**  
- Usuario autenticado.  
- Existen notificaciones generadas para ese usuario (o none → empty state).

**Qué NO puede hacer el Aprendiz:**  
- NO ve notificaciones de otros usuarios.  
- NO elimina notificaciones (solo marca leídas; política de retención la define Admin).  
- NO cambia categoría ni prioridad.  
- NO configura qué eventos generan notificación.

**Criterios de aceptación:**  
- Lista ordenada por fecha descendente.  
- Filtros aplican instantáneamente.  
- Marcar como leída: inmediato, persiste al cerrar app.  
- Contador "No leídas" en icono campana del header (badge).  
- Bitácora registra visualización (fecha/hora, notificaciónId).

---

### RF-8.3 Envío de notificaciones por correo electrónico (Al aprendiz)

**Actor:** Sistema → Aprendiz (email)  
**Fuentes:** RF-8 Notificaciones, Configuración SMTP institucional  

**Descripción:**  
Para notificaciones marcadas como "críticas" o "informativas importantes", el sistema envía copia al email verificado del aprendiz:  
- Cambio de ambiente de último minuto (< 1 hora antes de clase).  
- Anomalía de ingreso (ambiente incorrecto).  
- Retraso registrado.  
- Solicitud completar registro facial (próximo a vencer 12 meses).  
- Excusa aprobada/rechazada.  

Email: asunto claro, cuerpo con detalle, sin datos sensibles (no password, no documento). Enlace directo a app (deep link) si aplica.  
Registro en bitácora: enviado / fallido / pendiente reintento.

**Precondición:**  
- Aprendiz tiene email verificado en perfil.  
- Servidor SMTP configurado y operativo.  
- Notificación generada con flag "enviar_email=true".

**Qué NO puede hacer el Aprendiz:**  
- NO configura qué notificaciones van a email (definido por Admin/Sistema).  
- NO desactiva envío email individualmente (solo notificaciones push en RF-9.3).  
- NO ve bitácora de envíos.

**Criterios de aceptación:**  
- Email enviado < 5 seg tras generación de notificación.  
- Contenido claro, sin datos sensibles.  
- Fallos SMTP: reintento 3 veces (exponencial), luego marca "pendiente de envío" en bitácora.  
- Bitácora registra: destinatario, asunto, estado, timestamp, intentos.

---

## RF-9 PERFIL Y PERSONALIZACIÓN (Datos propios)

### RF-9.1 Visualización del perfil

**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-1 Accesos, BD usuarios  

**Descripción:**  
Pantalla "Perfil" — SOLO LECTURA de datos propios:  
- Nombre, apellido.  
- Tipo y número de documento.  
- Correo electrónico.  
- Rol actual (etiqueta "Aprendiz").  
- Ficha activa (nombre, código, programa) o "Pendiente por ficha" si huérfano.  
- Foto/avatar (iniciales o imagen si aplica).  
- NO edición de campos (eso es Admin en RF-10.2).

**Precondición:**  
- Usuario autenticado.  
- Registro previo en BD.

**Qué NO puede hacer el Aprendiz:**  
- NO modifica nombre, apellido, documento, email, rol, ficha.  
- NO ve datos de otros usuarios.  
- NO ve hash de contraseña ni tokens.

**Criterios de aceptación:**  
- Datos consistentes con BD (getMyProfile).  
- Carga < 2 seg.  
- No muestra datos sensibles innecesarios.  
- Bitácora registra consulta de perfil.

---

### RF-9.2 Cerrar sesión

**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-1 Accesos  

**Descripción:**  
Botón "Cerrar sesión" en Perfil y en Settings:  
- Confirma con dialog ("¿Cerrar sesión?").  
- Invalida token/sesión activa en backend.  
- Limpia almacenamiento local (AsyncStorage/secure store).  
- Redirige a Login.

**Precondición:**  
- Sesión iniciada.

**Qué NO puede hacer el Aprendiz:**  
- NO cierra sesión de otros dispositivos (eso es Admin / seguridad).  
- NO accede a áreas protegidas tras cerrar sesión.

**Criterios de aceptación:**  
- Tras cerrar, ningún endpoint protegido accesible sin re-login.  
- Token destruido completamente (client + server).  
- Redirección inmediata a /auth/login.

---

### RF-9.3 Configuración (Preferencias generales)

**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-9 Configuración, Políticas del sistema  

**Descripción:**  
Pantalla "Configuración" (accesible desde Perfil):  
- Tema: Claro / Oscuro (toggle con vista previa inmediata, persiste al guardar).  
- Idioma: selector (RF-9.4).  
- Notificaciones push: activar/desactivar (toggle, afecta RF-8.2 push local; NO afecta email RF-8.3).  
- Botón "Guardar cambios" único para persistir todo el borrador.  
- Estados: guardando / guardado / error.

**Precondición:**  
- Usuario autenticado.  
- Configuración previa existente o primera vez (valores por defecto).

**Qué NO puede hacer el Aprendiz:**  
- NO configura permisos, roles, horarios, ambientes.  
- NO ve/edita configuración de otros usuarios.  
- NO desactiva notificaciones email críticas (RF-8.3).

**Criterios de aceptación:**  
- Cambios de tema/idioma aplican en tiempo real (preview) antes de guardar.  
- Guardado: una sola llamada API con todo el borrador.  
- Persistencia tras cerrar sesión y reiniciar app.  
- Bitácora registra modificación (campo, valor anterior, nuevo, timestamp, usuario).

---

### RF-9.4 Configuración de idioma

**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-9 Configuración, Soporte multilenguaje (i18n)  

**Descripción:**  
Selector en Configuración con idiomas soportados: Español (es), English (en), Deutsch (de), Français (fr).  
- Cambio aplica inmediato en toda la app (i18n.changeLanguage).  
- Persiste en perfil de usuario (backend).  
- Textos, botones, mensajes, fechas, listas se traducen automáticamente.

**Precondición:**  
- Usuario autenticado.  
- Paquetes de idioma cargados en app.

**Qué NO puede hacer el Aprendiz:**  
- NO agrega nuevos idiomas.  
- NO edita traducciones.  
- NO fuerza idioma a otros usuarios.

**Criterios de aceptación:**  
- Cambio sin reiniciar sesión ni app.  
- Todos los textos visibles traducidos correctamente.  
- Error si selecciona idioma no soportado: "Idioma no soportado".  
- Persistencia: al reabrir app, mantiene último idioma elegido.

---

### RF-9.5 Personalización del Dashboard (Colores)

**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-9 Configuración, Preferencias visuales  

**Descripción:**  
El aprendiz personaliza la apariencia de SU Dashboard (pantalla principal /apprentice):  
- Esquemas de color predefinidos (paleta institucional + variantes).  
- Selector visual con preview en tiempo real.  
- Guarda preferencia en perfil (backend).  
- Afecta: color primario de tarjetas, header, botones, badges en SU vista.  
- NO afecta a otros roles ni usuarios.

**Precondición:**  
- Usuario autenticado.  
- Plantillas/esquemas de color definidos en sistema.

**Qué NO puede hacer el Aprendiz:**  
- NO crea esquemas personalizados (solo elige de predefinidos).  
- NO aplica colores que rompan accesibilidad (contraste mínimo WCAG AA).  
- NO personaliza Dashboard de Instructor/Admin/Coordinador.

**Criterios de aceptación:**  
- Colores aplican sin recarga completa de pantalla (hot reload estilo).  
- Preferencia persiste tras cerrar sesión y entre dispositivos.  
- Combinaciones inválidas (bajo contraste) bloqueadas con advertencia.  
- Bitácora registra cambio de esquema.

---

## RNF — REQUERIMIENTOS NO FUNCIONALES APLICABLES A LAS 4 PANTALLAS DEL APRENDIZ

### RNF-AP-1 Seguridad de datos propios (Privacidad / Ley 1581/2012)
**Referencia SRS:** RNF-1, RNF-2, RNF-11, RNF-14, RNF-14.1, RNF-14.3  
- Datos biométricos (vector facial) y personales del aprendiz: cifrados en reposo y tránsito (TLS 1.2+).  
- Acceso SOLO al propio perfil (RBAC: learner read own).  
- Contraseñas: solo hash (bcrypt/argon2), nunca texto plano.  
- Sesiones: tokens JWT firmados, expiración 15 min inactividad, refresh token rotativo.  
- Auditoría: toda lectura/escritura de datos propios loggeada (usuario, acción, IP, timestamp).  
- Vigencia registro facial: 12 meses → notificación automática + bloqueo reconocimiento hasta renovar.

### RNF-AP-2 Rendimiento y tiempos de respuesta
**Referencia SRS:** RNF-3, RNF-17, RNF-21  
- Dashboard (inicial): < 2 seg carga completa.  
- Mi asistencia (lista + filtros): < 2 seg.  
- Mi Historial (lista agrupada 12 meses): < 2 seg; scroll virtualizado 60 fps.  
- Notificaciones (lista + filtros): < 1 seg.  
- Perfil / Configuración: < 1.5 seg.  
- Cambio tema/idioma/color: preview inmediato (< 200 ms), guardado backend < 3 seg.  
- Sincronización offline (módulo local → servidor): cola local, reintento automático, pérdida < 0.1%.

### RNF-AP-3 Usabilidad y Accesibilidad
**Referencia SRS:** RNF-3, RNF-11, RNF-16.2, RNF-21, RNF-25  
- Interfaz adaptada a rol aprendiz: solo muestra lo autorizado (menús, botones, datos).  
- Navegación intuitiva: bottom tabs / sidebar consistente.  
- Colores con contraste WCAG AA mínimo (4.5:1 texto, 3:1 UI).  
- Soporte multilenguaje completo (ES/EN/DE/FR) sin recarga.  
- Modo oscuro/claro nativo, persistente.  
- Feedback visual en acciones (loading, éxito, error, empty states).  
- Touch targets ≥ 44x44 dp.  
- Textos legales (privacidad, consentimiento) en lenguaje claro, sin tecnicismos.  
- **Lista agrupada por mes** en lugar de calendario: reduce carga cognitiva, escaneo lineal natural, acceso directo a acción (excusa) desde fila de ausencia.

### RNF-AP-4 Disponibilidad y Confiabilidad
**Referencia SRS:** RNF-3, RNF-17, RNF-21  
- Uptime objetivo 99% (excluyendo ventanas mantenimiento programado).  
- Modo offline en app: consulta de historial/lista/notificaciones cacheadas (últimos 30 días).  
- Sincronización automática al recuperar conexión.  
- Backups diarios de BD (incluyendo datos biométricos cifrados).  
- Recuperación ante desastre: RPO < 1 hora, RTO < 4 horas.

### RNF-AP-5 Integridad y Trazabilidad
**Referencia SRS:** RNF-8, RNF-9, RNF-18, RNF-25  
- Log de errores automático en tabla `LogErrores` (fecha, usuarioId, tipo, descripción, stack trace).  
- Auditoría en tabla `auditoria` para TODAS las acciones del aprendiz: login, logout, vista perfil, cambio config, envío excusa, marca notificación leída, consulta asistencia/historial.  
- Cada registro: usuarioId, acción, descripción, IP, timestamp, rolEnSesión.  
- Registros inmutables (append-only), retención mínima 2 años.

### RNF-AP-6 Control de Acceso Basado en Rol (RBAC Estricto)
**Referencia SRS:** RNF-10, RNF-16.1, RNF-16.3, RNF-16.4, RNF-18, RNF-23, RNF-24, RNF-25  
- Matriz de permisos en BD: aprendiz = read own (profile, attendance, notifications, settings), write own (settings, facial capture, excusa, transfer request).  
- Endpoints protegidos por middleware: `/api/apprentice/**` valida rol=aprendiz en token.  
- Intentos de acceso a rutas admin/instructor/coordinator → 403 Forbidden + log seguridad.  
- Rol NO modificable desde frontend (solo Admin via RF-10.2).  
- Rol registrado en sesión y logs para trazabilidad.

### RNF-AP-7 Protección de Datos Sensibles y Biométricos
**Referencia SRS:** RNF-2 (extenso), RNF-12, RNF-13  
- Vector facial: almacenado solo en servidor/módulo local autorizados, cifrado AES-256.  
- Consentimiento explícito registrado (fecha, hora, versión aviso, IP) para menores y mayores.  
- Menor de edad: flujo obligatorio con acudiente (email distinto, verificación 6 dígitos, consentimiento trazable).  
- Derecho ARCO (Acceso, Rectificación, Cancelación, Oposición) accesible desde Perfil → enlace a formulario.  
- Eliminación segura (crypto-shredding) al solicitar cancelación cuenta.

### RNF-AP-8 Validaciones de Entrada y Consistencia
**Referencia SRS:** RNF-4, RNF-5, RNF-6, RNF-7, RNF-12  
- Email único validado en registro y edición (solo Admin edita).  
- Documento único por usuario.  
- No duplicados de datos personales (nombre+apellido+doc combinados).  
- Campos: documento/teléfono=solo números; nombre/apellido=solo letras; email=formato RFC5322.  
- Edad válida: 8–100 años (fecha nacimiento).  
- Códigos ficha/transferencia: validación formato y existencia en BD antes de procesar.

---

## RESUMEN DE PANTALLAS Y RF/RNF ASOCIADOS (ROL APRENDIZ)

| Pantalla | RF Principales | RNF Clave |
|----------|----------------|-----------|
| **Dashboard** | RF-9.5 (personalización), RF-8.2 (badge notificaciones), RF-6.1/6.2 (estado rápido) | RNF-AP-2, AP-3, AP-6 |
| **Mi asistencia** | RF-7.1 (reporte propio), RF-7.2 (resumen ficha), RF-6.2 (retrasos visibles) | RNF-AP-1, AP-2, AP-3, AP-5 |
| **Mi Historial (Lista agrupada por mes)** | RF-7.3 (lista mensual), RF-7.4.1 (excusas desde fila ausente) | RNF-AP-1, AP-2, AP-3, AP-5, AP-7 |
| **Notificaciones** | RF-8.1 (generación), RF-8.2 (visualización), RF-8.3 (email) | RNF-AP-1, AP-2, AP-3, AP-5, AP-6 |
| **Perfil** | RF-9.1 (vista), RF-9.2 (logout) | RNF-AP-1, AP-3, AP-5, AP-6, AP-7 |
| **Configuración** | RF-9.3 (prefs), RF-9.4 (idioma), RF-9.5 (colores dashboard) | RNF-AP-1, AP-2, AP-3, AP-5, AP-6 |

---

## MATRIZ DE PERMISOS RESUMEN (APRENDIZ)

| Acción | Permitido | Restricción |
|--------|-----------|-------------|
| Ver propia asistencia | ✅ | Solo propios registros |
| Ver resumen ficha (agregado) | ✅ | Anonimizado, sin datos compañeros |
| Ver historial (lista por mes) | ✅ | Solo propios estados |
| Enviar excusa (ausencia) | ✅ | Solo filas 🔴, PDF obligatorio |
| Solicitar traslado ficha | ✅ | Si tiene ficha activa (transfer-request) |
| Unirse a ficha por código | ✅ | Solo si huérfano (join-ficha) |
| Ver notificaciones propias | ✅ | Solo destinatario = userId |
| Marcar notificación leída | ✅ | No eliminar |
| Ver perfil propio | ✅ | Solo lectura |
| Cambiar tema/idioma/colores | ✅ | Solo own profile |
| Cerrar sesión | ✅ | Invalida own token |
| Registrar rostro facial | ✅ | Una captura frontal válida |
| Ver reportes de otros | ❌ | Admin/Instructor only |
| Editar horarios/ambientes | ❌ | Admin/Instructor only |
| Gestionar usuarios | ❌ | Admin only |
| Aprobar/rechazar excusas | ❌ | Instructor/Coordinator/Admin |
| Configurar notificaciones email | ❌ | Sistema/Admin define criticidad |

---

## DECISIÓN DE DISEÑO: REEMPLAZO DE CALENDARIO POR LISTA AGRUPADA POR MES

**Problema identificado:**  
El calendario mensual tradicional genera fricción en el aprendiz:  
- Requiere navegación mes a mes para encontrar una ausencia antigua.  
- Días sin clase (fines de semana, festivos) añaden ruido visual.  
- Tap en día pequeño → modal → formulario excusa = 3+ taps.  
- Difícil comparar patrones (ej. "¿cuántos retrasos tuve en agosto?").

**Solución adoptada — Lista Agrupada por Mes (Timeline colapsable):**  
- **Escaneo lineal**: el ojo recorre una sola columna vertical, patrones saltan a la vista.  
- **Acción inmediata**: fila 🔴 Ausente → tap → modal excusa (1 tap).  
- **Densidad de información**: cada fila muestra estado + hora + ambiente sin abrir detalle.  
- **Colapso por mes**: meses pasados colapsados por defecto, mes actual expandido.  
- **Filtro + búsqueda**: "solo ausencias", "solo retrasos", "ambiente X", rango fechas.  
- **Virtualización**: renderiza solo filas visibles → 12 meses fluidos en móviles gama media.  
- **Accesibilidad**: mejor soporte lectores de pantalla (lista semántica vs grid de calendario).

**Estados visuales unificados** (consistentes en Mi Asistencia, Mi Historial, Notificaciones):  
- 🟢 Puntual  
- 🟡 Retraso X min  
- 🔴 Ausente (accionable → excusa)  
- ⚪ Sin clase  
- 🔵 Ingreso no programado  

**Métricas de usabilidad objetivo:**  
- Tiempo para encontrar última ausencia: < 5 seg (vs 15-20 seg en calendario).  
- Taps para enviar excusa: 2 (tap fila → tap "Enviar" en modal) vs 4+.  
- Carga cognitiva: lista única vs navegación espacial + temporal.

---

**Fin del documento — Requerimientos Rol Aprendiz (FaceLit SENA)**  
*Basado en SRS v1 y código actual rama `feature/instructor`*  
*Actualización: Módulo facial en PC con cámara | Historial = Lista agrupada por mes (no calendario)*