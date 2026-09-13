# Requerimientos Funcionales y No Funcionales â€” Rol Aprendiz (APPRENTICE)

---

## FACELIT V4 â€” Restablecimiento de registro facial: separado por vista

---

# RF-5.4 â€” Mi reconocimiento facial (vista Aprendiz)

**VersiÃ³n** 4.0

**Actores:** Aprendiz / Sistema

**Objetivos asociados**
Que el aprendiz tenga un Ãºnico apartado, **"Mi reconocimiento facial"**, donde ve el estado de su registro y, si ya registrÃ³ su rostro antes, cuenta con un solo botÃ³n para pedir que se lo vuelvan a habilitar â€” sin formularios ni pasos adicionales.

**DescripciÃ³n**

- El aprendiz entra a **"Mi reconocimiento facial"** desde su perfil.
- Si **todavÃ­a no ha registrado su rostro**, ve el botÃ³n normal "Registrar rostro" (RF-5.1).
- Si **ya lo registrÃ³**, ve un solo botÃ³n: **"Solicitar registro nuevamente"**. No hay campo de motivo ni ningÃºn otro paso â€” al tocarlo se envÃ­a la solicitud de una vez.
- Mientras esa solicitud siga sin resolver, el botÃ³n cambia a un estado informativo: **"Solicitud enviada, esperando respuesta"** (deshabilitado, para que no pueda volver a tocarlo y mandar una segunda solicitud).
- Cuando el Coordinador la resuelve:
  - Si la aceptÃ³: el botÃ³n vuelve a mostrar "Registrar rostro" (habilitado una sola vez).
  - Si la rechazÃ³: el botÃ³n vuelve a mostrar "Solicitar registro nuevamente" (puede volver a intentarlo cuando quiera, sin lÃ­mite).

**PrecondiciÃ³n** El aprendiz debe tener un registro facial previo para ver el botÃ³n de "Solicitar registro nuevamente" (si no, ve el registro normal en su lugar).

**Secuencia Normal**

| Pasos | Actor | AcciÃ³n | Sistema |
|---|---|---|---|
| 1 | Aprendiz | Entra a "Mi reconocimiento facial". | Muestra su estado actual: registrado, o pendiente de respuesta. |
| 2 | Aprendiz | Toca "Solicitar registro nuevamente". | EnvÃ­a la solicitud de inmediato y cambia el botÃ³n a "Solicitud enviada, esperando respuesta". |

**Escenario Alternativo**

| Pasos | Actor | AcciÃ³n | Sistema |
|---|---|---|---|
| 1.1 | Aprendiz | No tiene registro facial previo. | Ve el botÃ³n normal "Registrar rostro" en vez de este. |
| 1.2 | Aprendiz | Ya tiene una solicitud enviada sin resolver. | El botÃ³n permanece deshabilitado en "Solicitud enviada, esperando respuesta" â€” no puede tocarlo de nuevo. |

**Postcondiciones** El aprendiz nunca puede reabrir la cÃ¡mara por sÃ­ mismo â€” solo cuando el Coordinador acepta la solicitud.

**Criterios de aceptaciÃ³n**
1. Un solo botÃ³n, sin formulario ni campos adicionales.
2. Un aprendiz nunca puede tener dos solicitudes enviadas al mismo tiempo.
3. Tras un rechazo, puede volver a tocar el botÃ³n sin ninguna espera obligatoria.

**Controles de seguridad asociados**
- El aprendiz nunca puede activar la cÃ¡mara por sÃ­ mismo sin pasar por esta solicitud.
- Trazabilidad de cada solicitud enviada (quiÃ©n y cuÃ¡ndo).

---

# RF-6: ASISTENCIA

## Requerimientos especÃ­ficos para el rol APRENDIZ

### Regla general de alcance â€” Aprendiz

El **Aprendiz** Ãºnicamente puede consultar informaciÃ³n correspondiente a su propia cuenta.

El Aprendiz:

* Puede consultar Ãºnicamente **su propio historial de asistencia**.
* Puede consultar sus propios estados de asistencia:
  * Asistencia puntual.
  * Retrasos.
  * Inasistencias.
* Puede consultar sus propios porcentajes de asistencia, retrasos e inasistencias.
* No puede consultar informaciÃ³n de otros aprendices.
* No puede buscar por programa para consultar otras fichas.
* No puede buscar por ficha para consultar otros aprendices.
* No puede consultar informaciÃ³n de otros usuarios mediante nombre o nÃºmero de documento.
* No puede acceder a registros que pertenezcan a otras personas, aunque conozca su nombre o documento.
* El servidor debe validar siempre que la informaciÃ³n consultada corresponda al aprendiz autenticado.

El registro de entrada y salida continÃºa realizÃ¡ndose mediante el dispositivo de reconocimiento facial. Este mÃ³dulo Ãºnicamente permite al Aprendiz consultar y revisar la informaciÃ³n de asistencia ya registrada.

---

## RF-6.1 â€” Consulta de asistencia propia

**VersiÃ³n:** 4.0

**Actor:** Aprendiz / Sistema

### Objetivo

Permitir que el Aprendiz consulte de forma rÃ¡pida el estado de su propia asistencia y pueda revisar detalladamente sus registros dentro de un rango de fechas.

### DescripciÃ³n

Para el rol **Aprendiz**, la consulta no inicia mediante un buscador de programa ni mediante la selecciÃ³n de una ficha.

El sistema identifica automÃ¡ticamente al Aprendiz autenticado y muestra Ãºnicamente su informaciÃ³n.

### Pantalla â€” Resumen de asistencia propia

Al ingresar a la consulta de asistencia, el sistema debe mostrar la informaciÃ³n correspondiente exclusivamente al Aprendiz autenticado.

Debe permitir visualizar:

* Porcentaje de asistencia.
* Porcentaje de inasistencias.
* Porcentaje de retrasos.
* Cantidad de asistencias.
* Cantidad de inasistencias.
* Cantidad de retrasos.

El Aprendiz no debe poder seleccionar otro usuario, programa o ficha para modificar la informaciÃ³n mostrada.

### Detalle de asistencia

El Aprendiz puede seleccionar un **rango de fechas**:

* Fecha de inicio.
* Fecha de fin.

El sistema muestra una tabla con sus registros correspondientes al rango seleccionado.

La tabla debe mostrar, como mÃ­nimo:

* Fecha.
* Estado de asistencia.

Los estados se representan de la siguiente manera:

* **Inasistencia:** celda en rojo.
* **Retraso:** celda en amarillo.
* **Asistencia puntual:** sin color especial.

La asistencia puntual no necesita mostrar informaciÃ³n adicional.

Cuando el Aprendiz consulta un registro marcado como **inasistencia o retraso**, puede visualizar:

* Hora exacta en que se registrÃ³, cuando exista registro.
* DÃ­a.
* Ambiente donde debÃ­a presentarse.
* Instructor responsable de la sesiÃ³n.

La misma lÃ³gica de colores y detalle definida para RF-6.1 del documento original se mantiene para el Aprendiz.

### ExportaciÃ³n

El Aprendiz puede exportar **sus propios registros de asistencia** a:

* Excel.
* CSV.

El archivo exportado debe identificar claramente que la informaciÃ³n corresponde al Aprendiz consultado.

No se debe permitir que el Aprendiz genere reportes de otros usuarios, fichas o programas.

### Precondiciones

* El Aprendiz debe tener una sesiÃ³n iniciada.
* Debe existir un usuario correspondiente al Aprendiz autenticado.
* El sistema debe poder identificar al Aprendiz mediante su sesiÃ³n.

### Secuencia normal

| Paso | Actor    | AcciÃ³n                                                    | Sistema                                                                                 |
| ---- | -------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1    | Aprendiz | Ingresa a la consulta de asistencia.                      | Identifica automÃ¡ticamente al Aprendiz autenticado y muestra Ãºnicamente su informaciÃ³n. |
| 2    | Aprendiz | Selecciona fecha de inicio y fecha de fin.                | Genera la tabla con los registros correspondientes al rango seleccionado.               |
| 3    | Aprendiz | Consulta un registro marcado como retraso o inasistencia. | Muestra hora, dÃ­a, ambiente e instructor cuando corresponda.                            |
| 4    | Aprendiz | Selecciona "Exportar".                                    | Genera el archivo Excel o CSV con Ãºnicamente sus registros.                             |

### Escenarios alternativos

| Paso | AcciÃ³n                                                     | Sistema                                                                  |
| ---- | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1.1  | El Aprendiz no tiene registros de asistencia.              | "No hay registros de asistencia para este aprendiz."                     |
| 1.2  | El rango de fechas seleccionado no contiene registros.     | "No hay registros de asistencia para el rango de fechas seleccionado."   |
| 1.3  | El Aprendiz intenta consultar informaciÃ³n de otro usuario. | El sistema rechaza la consulta y no permite acceder a informaciÃ³n ajena. |

### Criterios de aceptaciÃ³n

1. El Aprendiz Ãºnicamente puede consultar su propia asistencia.
2. No existe una bÃºsqueda que permita seleccionar otros aprendices.
3. El Aprendiz puede seleccionar un rango de fechas.
4. Las inasistencias se muestran en rojo.
5. Los retrasos se muestran en amarillo.
6. Las asistencias puntuales no tienen color especial.
7. Los registros de retraso o inasistencia permiten consultar hora, dÃ­a, ambiente e instructor cuando corresponda.
8. El Aprendiz puede exportar Ãºnicamente sus propios registros.
9. El servidor valida el alcance del Aprendiz y no depende Ãºnicamente de restricciones visuales.

---

## RF-6.2 â€” Consulta de asistencia individual del Aprendiz

**VersiÃ³n:** 4.0

**Actor:** Aprendiz / Sistema

### Objetivo

Permitir que el Aprendiz consulte directamente su propia asistencia sin tener que realizar una bÃºsqueda por nombre, documento, programa o ficha.

### DescripciÃ³n

A diferencia del Coordinador o Instructor, el Aprendiz **no necesita ni debe utilizar un buscador de usuarios**.

El sistema identifica automÃ¡ticamente al Aprendiz autenticado.

Por lo tanto:

* No existe bÃºsqueda por nombre.
* No existe bÃºsqueda por nÃºmero de documento.
* No existe selector de otro aprendiz.
* No existe acceso a registros de terceros.

El sistema muestra directamente el historial de asistencia correspondiente al usuario autenticado.

El Aprendiz puede seleccionar un rango de fechas y consultar:

* Asistencias puntuales.
* Retrasos.
* Inasistencias.
* Hora del registro cuando corresponda.
* DÃ­a.
* Ambiente.
* Instructor responsable de la sesiÃ³n.

Se mantienen las reglas de colores definidas en RF-6.1:

* Rojo = inasistencia.
* Amarillo = retraso.
* Sin color = asistencia puntual.

TambiÃ©n puede exportar sus registros a Excel o CSV.

### PrecondiciÃ³n

El Aprendiz debe tener una sesiÃ³n iniciada.

### Secuencia normal

| Paso | Actor    | AcciÃ³n                                          | Sistema                                                              |
| ---- | -------- | ----------------------------------------------- | -------------------------------------------------------------------- |
| 1    | Aprendiz | Ingresa a su consulta de asistencia.            | Identifica automÃ¡ticamente al Aprendiz autenticado.                  |
| 2    | Aprendiz | Define fecha de inicio y fecha de fin.          | Genera la tabla de asistencia correspondiente al rango seleccionado. |
| 3    | Aprendiz | Consulta un registro de retraso o inasistencia. | Muestra el detalle correspondiente.                                  |
| 4    | Aprendiz | Selecciona "Exportar".                          | Genera el archivo con sus propios registros.                         |

### Escenarios alternativos

| Paso | AcciÃ³n                                    | Sistema                                                                |
| ---- | ----------------------------------------- | ---------------------------------------------------------------------- |
| 1.1  | El Aprendiz no posee registros.           | "No hay registros de asistencia para este aprendiz."                   |
| 1.2  | El rango seleccionado no posee registros. | "No hay registros de asistencia para el rango de fechas seleccionado." |

### Criterios de aceptaciÃ³n

1. El sistema identifica automÃ¡ticamente al Aprendiz autenticado.
2. No se permite seleccionar otro usuario.
3. No se permite consultar informaciÃ³n de otros aprendices.
4. El Aprendiz puede filtrar sus registros mediante rango de fechas.
5. Los colores y detalles son idÃ©nticos a los establecidos en RF-6.1.
6. La exportaciÃ³n contiene Ãºnicamente informaciÃ³n del Aprendiz autenticado.

---

## RF-6.3 â€” Historial de asistencia del Aprendiz

**VersiÃ³n:** 4.0

**Actor:** Aprendiz / Sistema

### Objetivo

Dar al Aprendiz una vista general y navegable de su propio historial de asistencia.

### DescripciÃ³n

El historial se presenta como una lista de **tarjetas**, organizadas cronolÃ³gicamente.

A diferencia del Coordinador, el Aprendiz Ãºnicamente puede visualizar las tarjetas correspondientes a sus propios registros.

El historial puede consultarse principalmente mediante:

* Fecha.
* Rango de fechas.

No se requiere bÃºsqueda por nombre o nÃºmero de documento, debido a que el sistema ya conoce al Aprendiz autenticado y no debe permitir seleccionar otros usuarios.

Cada tarjeta debe mostrar informaciÃ³n resumida del registro de asistencia.

Cuando la tarjeta corresponda a un:

* **Retraso**, se debe identificar visualmente como retraso.
* **Inasistencia**, se debe identificar visualmente como inasistencia.
* **Registro puntual**, se muestra como asistencia normal.

Al seleccionar una tarjeta correspondiente a un retraso o inasistencia, se muestra el detalle disponible:

* Hora.
* DÃ­a.
* Ambiente.
* Instructor responsable de la sesiÃ³n.

### PrecondiciÃ³n

El Aprendiz debe tener registros de asistencia para mostrar informaciÃ³n en el historial.

### Secuencia normal

| Paso | Actor    | AcciÃ³n                              | Sistema                                                         |
| ---- | -------- | ----------------------------------- | --------------------------------------------------------------- |
| 1    | Aprendiz | Ingresa al historial de asistencia. | Muestra sus registros mÃ¡s recientes.                            |
| 2    | Aprendiz | Busca o filtra por fecha.           | Filtra Ãºnicamente sus registros segÃºn el criterio seleccionado. |
| 3    | Aprendiz | Selecciona una tarjeta.             | Muestra el detalle del registro correspondiente.                |

### Escenario alternativo

| Paso | AcciÃ³n                                            | Sistema                                                     |
| ---- | ------------------------------------------------- | ----------------------------------------------------------- |
| 1.1  | El Aprendiz no tiene registros de asistencia.     | "No se encontraron registros de asistencia."                |
| 1.2  | El rango o fecha seleccionada no tiene registros. | "No se encontraron registros con ese criterio de bÃºsqueda." |

### Criterios de aceptaciÃ³n

1. El historial contiene Ãºnicamente registros del Aprendiz autenticado.
2. Los registros se presentan mediante tarjetas.
3. Las tarjetas se organizan cronolÃ³gicamente.
4. El historial puede filtrarse por fecha.
5. No existe bÃºsqueda de otros aprendices.
6. No existe acceso mediante nombre o documento a otros usuarios.
7. El detalle de retrasos e inasistencias muestra hora, dÃ­a, ambiente e instructor cuando corresponda.
8. El alcance del Aprendiz es validado en el servidor.

---

## Controles de seguridad del rol Aprendiz

El control de acceso del Aprendiz debe aplicarse en el servidor.

No es suficiente con ocultar botones, selectores o buscadores en la interfaz.

El servidor debe garantizar que un Aprendiz:

* Solo pueda consultar sus propios registros.
* No pueda modificar el identificador de usuario de la consulta para acceder a otra persona.
* No pueda consultar otros aprendices mediante nombre.
* No pueda consultar otros aprendices mediante documento.
* No pueda consultar otras fichas.
* No pueda consultar otros programas.
* No pueda exportar informaciÃ³n perteneciente a terceros.

El alcance por rol debe mantenerse independientemente de cÃ³mo se realice la solicitud desde el frontend. Esta validaciÃ³n de servidor es consistente con el control de seguridad definido para RF-6.

---

## RF-7 REPORTES Y CONSULTAS (Vista Aprendiz)

### RF-7.1 Reporte de asistencia por usuario (Propio)

**Actor:** Aprendiz / Sistema / MÃ³dulo de Reconocimiento Facial (PC con cÃ¡mara en ambiente)  
**Fuentes:** RF-5.2 Identificar usuario, RF-5.3 Enviar datos al servidor, RF-4 GestiÃ³n de horarios  

**DescripciÃ³n:**  
El aprendiz NO registra manualmente su entrada/salida. El sistema lo hace automÃ¡ticamente cuando el **mÃ³dulo de reconocimiento facial (computador con cÃ¡mara instalado en el ambiente)** detecta su rostro y envÃ­a el evento al servidor. El aprendiz solo visualiza el resultado en su historial.  
- La cÃ¡mara del computador captura el rostro â†’ compara con modelo local â†’ si supera umbral, envÃ­a paquete (userId, ambiente, ficha, timestamp, tipo evento) al servidor.  
- El servidor determina si es entrada o salida segÃºn Ãºltimo registro y hora.  
- El aprendiz ve el registro en "Mi asistencia" con fecha, hora, ambiente y estado (entrada/salida).

**PrecondiciÃ³n:**  
- El aprendiz tiene rostro registrado (RF-5.1 completado).  
- El computador con cÃ¡mara del ambiente estÃ¡ operativo y conectado.  
- El aprendiz tiene horario asignado en su ficha para ese dÃ­a/hora.  
- Existe conexiÃ³n con el servidor (o modo offline activo en el mÃ³dulo local).

**QuÃ© NO puede hacer el Aprendiz:**  
- No puede forzar un registro manual de entrada/salida.  
- No puede editar, borrar o modificar registros ya generados.  
- No puede registrar entrada de otro aprendiz.  
- No accede a registros de otros usuarios.

**Criterios de aceptaciÃ³n:**  
- El registro aparece en "Mi asistencia" en < 5 segundos tras el reconocimiento facial.  
- Cada evento muestra: fecha, hora exacta (segundos), ambiente, tipo (entrada/salida).  
- Si el aprendiz no tiene horario ese dÃ­a/hora, el sistema registra como "ingreso no programado" (anomalÃ­a visible en su historial).  
- Eventos duplicados (mÃºltiples lecturas seguidas) se consolidan: primera entrada vÃ¡lida, resto marcados como duplicados.  
- Sin conexiÃ³n: el mÃ³dulo local almacena en cola y sincroniza al restablecer red; el aprendiz ve estado "pendiente de sincronizaciÃ³n" hasta completar.

---

### RF-6.2 CÃ¡lculo de retrasos

**Actor:** Sistema (automÃ¡tico) â†’ visible para Aprendiz  
**Fuentes:** RF-6.1 Entrada, RF-4 Horarios, Reglamento de asistencia institucional  

**DescripciÃ³n:**  
El sistema calcula automÃ¡ticamente si el aprendiz llegÃ³ tarde comparando la hora de entrada registrada por reconocimiento facial contra la hora de inicio de clase segÃºn su horario (incluyendo excepciones activas RF-4.4). El aprendiz visualiza el resultado en su reporte/lista.  
- Tolerancia configurable por instituciÃ³n (ej. 10 min).  
- Si supera tolerancia â†’ marca "Retraso" en el registro del dÃ­a.  
- Si llega antes o dentro de tolerancia â†’ "Puntual".

**PrecondiciÃ³n:**  
- El aprendiz tiene horario activo para ese dÃ­a.  
- Existe registro de entrada (RF-6.1) para esa fecha/ambiente.

**QuÃ© NO puede hacer el Aprendiz:**  
- No puede modificar la tolerancia ni la hora de inicio de clase.  
- No ve retrasos de otros aprendices.

**Criterios de aceptaciÃ³n:**  
- CÃ¡lculo automÃ¡tico y preciso (diferencia en minutos entre hora real y hora programada).  
- Tolerancia configurable desde backend (no hardcodeada).  
- En "Mi asistencia": registro marcado con etiqueta "Retraso: X min" y color amarillo.  
- Si hay excepciÃ³n de horario activa (cambio de ambiente/instructor), el cÃ¡lculo usa el horario modificado.  
- Evidencia del retraso queda registrada en bitÃ¡cora para auditorÃ­a.

---

## RF-7 REPORTES Y CONSULTAS (Vista Aprendiz)

### RF-7.1 Reporte de asistencia por usuario (Propio)

**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-6.1 Entradas y salidas, RF-6.2 CÃ¡lculo de retrasos  

**DescripciÃ³n:**  
Pantalla **"Mi Asistencia"** (lista cronolÃ³gica) donde el aprendiz consulta SOLO su propio historial con filtros.  
Datos visibles por registro: fecha, hora entrada, hora salida, ambiente, retrasos (min), estado (puntual/retraso/ausente/no programado), tiempo total en clase.  
Filtros disponibles: rango de fechas, ficha (si ha estado en varias), ambiente, programa.

**PrecondiciÃ³n:**  
- El aprendiz tiene al menos un registro de asistencia en BD.  
- Usuario autenticado con rol aprendiz.

**QuÃ© NO puede hacer el Aprendiz:**  
- NO ve reporte de otros aprendices.  
- NO ve reporte consolidado de ficha completa (eso es RF-7.2 para Instructor/Admin).  
- NO exporta a PDF/Excel (solo visualizaciÃ³n en app).  
- NO modifica ni elimina registros.

**Criterios de aceptaciÃ³n:**  
- Lista ordenada por fecha descendente (mÃ¡s reciente primero).  
- Filtros aplican en tiempo real (< 2 seg).  
- Si no hay registros para el filtro: mensaje "No existen registros para este perÃ­odo".  
- Cada fila muestra Ã­cono/color segÃºn estado: verde=puntual, amarillo=retraso, rojo=ausente, gris=no programado.  
- Tiempo total en clase calculado (salida - entrada) solo si ambas existen.

---

### RF-7.2 Reporte de asistencia por ficha (Vista Aprendiz = SOLO SU FICHA ACTUAL)

**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-3 GestiÃ³n de fichas, RF-6 Asistencia  

**DescripciÃ³n:**  
El aprendiz puede consultar un resumen grupal LIMITADO a su ficha actual:  
- Porcentaje de asistencia total de la ficha (promedio grupal).  
- Su posiciÃ³n relativa (ej. "Tu asistencia: 92% | Promedio ficha: 85%").  
- NO lista individual de compaÃ±eros, NO nombres, NO datos personales de otros.  
- Solo estadÃ­sticas agregadas anonimizadas.

**PrecondiciÃ³n:**  
- El aprendiz tiene ficha activa asociada.  
- Existen registros de asistencia para al menos un estudiante de la ficha.

**QuÃ© NO puede hacer el Aprendiz:**  
- NO ve listado de estudiantes con sus porcentajes individuales.  
- NO ve retrasos/ausencias de compaÃ±eros.  
- NO filtra por otros aprendices.  
- NO exporta el reporte.  
- Si no tiene ficha (huÃ©rfano/traslado pendiente): mensaje "No tienes ficha activa asignada".

**Criterios de aceptaciÃ³n:**  
- Carga en < 2 segundos.  
- Muestra: % asistencia ficha, % asistencia propio, total clases del perÃ­odo, clases asistidas propio.  
- GrÃ¡fico simple (barra o dona) comparando propio vs promedio ficha.  
- Datos anonimizados: ningÃºn nombre, documento o email de terceros.

---

### RF-7.3 Historial de asistencia â€” Vista en Lista Agrupada por Mes (REEMPLAZA CALENDARIO)

**Actor:** Aprendiz / Sistema  

**DescripciÃ³n:**  
**Se elimina la vista de calendario mensual** por ser tediosa y de difÃ­cil escaneo. Se reemplaza por una **Lista Agrupada por Mes** (tipo "timeline" colapsable), optimizada para escaneo rÃ¡pido y acciÃ³n directa sobre ausencias.

**Estructura de la pantalla "Mi Historial":**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Mi Historial                    [Filtro: Ãšltimo aÃ±o â–¼] â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  â–¼ SEPTIEMBRE 2026 (18 clases)          â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚ Lun 01  ðŸŸ¢ Puntual   06:58  SalÃ³n 101    â”‚  â”‚
â”‚  â”‚ Mar 02  ðŸŸ¡ Retraso 12m  07:12  SalÃ³n 101  â”‚  â”‚
â”‚  â”‚ Jue 04  ðŸŸ¢ Puntual   06:55  SalÃ³n 101    â”‚  â”‚
â”‚  â”‚ Vie 05  âšª Sin clase                                    â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚  â–¼ AGOSTO 2026 (20 clases)              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚ ... (colapsado por defecto)       â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Estados visuales por dÃ­a:**
- ðŸŸ¢ **Verde / "Puntual"**: Entrada registrada dentro de tolerancia.
- ðŸŸ¡ **Amarillo / "Retraso X min"**: Entrada fuera de tolerancia.
- ðŸ”´ **Rojo / "Ausente"**: DÃ­a con clase programada SIN registro de entrada.
- âšª **Gris / "Sin clase"**: DÃ­a sin horario (fin de semana, festivo, dÃ­a libre).
- ðŸ”µ **Azul / "Ingreso no programado"**: Entrada registrada en dÃ­a/hora sin horario.

**Interacciones:**
- **Tap en cualquier fila** â†’ Detalle expandido: ambiente, hora entrada/salida, estado, retraso si aplica.
- **AcordeÃ³n por mes**: Colapsado/expandido (estado persistido en preferencias).
- **Filtro rÃ¡pido**: "Ãšltimo mes / Ãšltimo trimestre / Ãšltimo aÃ±o / Personalizado".
- **Buscador**: Por ambiente, estado, rango de fechas.
- **Pull-to-refresh** para sincronizar.

**PrecondiciÃ³n:**  
- Usuario autenticado como aprendiz.  
- Existe al menos un registro de asistencia (aunque sea uno).

**QuÃ© NO puede hacer el Aprendiz:**  
- NO modifica colores ni estados.  
- NO ve historial de otros usuarios.  
- NO edita horarios ni excepciones (eso es Admin/Instructor).  
- NO elimina dÃ­as del historial.

**Criterios de aceptaciÃ³n:**  
- Lista carga en < 2 seg para 12 meses de datos.  
- Scroll fluido (60 fps) sin paginaciÃ³n (virtualizaciÃ³n).  
- Mes actual expandido por defecto; anteriores colapsados.  
- Filtros actualizan vista inmediatamente.  
- Coherencia total con registros reales en BD.  
- DÃ­as futuros no se muestran (solo pasado y hoy).

---

---\n
## RF-8 NOTIFICACIONES (Vista Aprendiz)

### RF-8.1 GeneraciÃ³n automÃ¡tica de notificaciones (Dirigidas al aprendiz)

**Actor:** Sistema (principal) â†’ Aprendiz (destinatario)  
**Fuentes:** RF-6 Asistencia, RF-7 Reportes, RF-4 Horarios, RF-5 Facial, RF-5.4 Restablecimiento facial  

**DescripciÃ³n:**  
El sistema genera notificaciones automÃ¡ticas SIN intervenciÃ³n humana para eventos que afectan al aprendiz:  
- "Llegaste tarde al ambiente X" (retraso detectado RF-6.2).  
- "Cambio de ambiente para tu clase de maÃ±ana" (excepciÃ³n RF-4.4 ENVIRONMENT_CHANGE).  
- "Cambio de instructor para tu clase" (excepciÃ³n INSTRUCTOR_CHANGE).  
- "Intentaste ingresar a ambiente no asignado" (anomalÃ­a RF-6.2).  
- "Tu registro facial estÃ¡ pendiente/por vencer" (vigencia 12 meses RNF-2).  
- "Expira tu cÃ³digo de ficha" / "Solicitud de traslado aprobada/rechazada" (RF-3.3, transfer-request).  
- "Tu solicitud de restablecimiento facial fue aprobada/rechazada" (RF-5.4).


**PrecondiciÃ³n:**  
- El aprendiz existe y tiene sesiÃ³n activa o token vÃ¡lido.  
- Eventos fuente estÃ¡n correctamente registrados.  
- Motor de notificaciones activo en backend.

**QuÃ© NO puede hacer el Aprendiz:**  
- NO genera notificaciones manualmente.  
- NO configura reglas de generaciÃ³n (eso es Admin).  
- NO recibe notificaciones de otros usuarios.

**Criterios de aceptaciÃ³n:**  
- NotificaciÃ³n generada < 1 segundo tras el evento disparador.  
- ClasificaciÃ³n correcta (alerta/recordatorio/aviso).  
- NingÃºn evento vÃ¡lido se pierde.  
- Registro en BD con: tipo, mensaje, usuario destino, fecha/hora, estado (leÃ­da/no leÃ­da), categorÃ­a.

---

### RF-8.2 VisualizaciÃ³n de notificaciones en la interfaz

**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-8.1 GeneraciÃ³n, RF-9 Perfil  

**DescripciÃ³n:**  
Pantalla "Notificaciones" (accesible desde icono campana en header del Dashboard):  
- Lista cronolÃ³gica (mÃ¡s reciente arriba).  
- Cada Ã­tem: Ã­cono/category color, tÃ­tulo, mensaje, fecha/hora, estado (leÃ­da/no leÃ­da con punto azul).  
- CategorÃ­as visuales con colores: **Asistencia** (verde), **Horario** (amarillo), **Ambiente** (azul), **Sistema** (pÃºrpura), **Facial** (primario).  
- Filtros: Todas / No leÃ­das / LeÃ­das (contador en pestaÃ±a "No leÃ­das").  
- Acciones: tap para marcar como leÃ­da, botÃ³n "Marcar todas como leÃ­das" si hay no leÃ­das.  
- Pull-to-refresh para actualizar.  
- Empty state: "No tienes notificaciones".

**PrecondiciÃ³n:**  
- Usuario autenticado.  
- Existen notificaciones generadas para ese usuario (o none â†’ empty state).

**QuÃ© NO puede hacer el Aprendiz:**  
- NO ve notificaciones de otros usuarios.  
- NO elimina notificaciones (solo marca leÃ­das; polÃ­tica de retenciÃ³n la define Admin).  
- NO cambia categorÃ­a ni prioridad.  
- NO configura quÃ© eventos generan notificaciÃ³n.

**Criterios de aceptaciÃ³n:**  
- Lista ordenada por fecha descendente.  
- Filtros aplican instantÃ¡neamente.  
- Marcar como leÃ­da: inmediato, persiste al cerrar app.  
- Contador "No leÃ­das" en icono campana del header (badge).  
- BitÃ¡cora registra visualizaciÃ³n (fecha/hora, notificaciÃ³nId).

---

### RF-8.3 EnvÃ­o de notificaciones por correo electrÃ³nico (Al aprendiz)

**Actor:** Sistema â†’ Aprendiz (email)  
**Fuentes:** RF-8 Notificaciones, ConfiguraciÃ³n SMTP institucional  

**DescripciÃ³n:**  
Para notificaciones marcadas como "crÃ­ticas" o "informativas importantes", el sistema envÃ­a copia al email verificado del aprendiz:  
- Cambio de ambiente de Ãºltimo minuto (< 1 hora antes de clase).  
- AnomalÃ­a de ingreso (ambiente incorrecto).  
- Retraso registrado.  
- Solicitud completar registro facial (prÃ³ximo a vencer 12 meses).  
- Solicitud restablecimiento facial aprobada/rechazada (RF-5.4).  

Email: asunto claro, cuerpo con detalle, sin datos sensibles (no password, no documento). Enlace directo a app (deep link) si aplica.  
Registro en bitÃ¡cora: enviado / fallido / pendiente reintento.

**PrecondiciÃ³n:**  
- Aprendiz tiene email verificado en perfil.  
- Servidor SMTP configurado y operativo.  
- NotificaciÃ³n generada con flag "enviar_email=true".

**QuÃ© NO puede hacer el Aprendiz:**  
- NO configura quÃ© notificaciones van a email (definido por Admin/Sistema).  
- NO desactiva envÃ­o email individualmente (solo notificaciones push en RF-9.3).  
- NO ve bitÃ¡cora de envÃ­os.

**Criterios de aceptaciÃ³n:**  
- Email enviado < 5 seg tras generaciÃ³n de notificaciÃ³n.  
- Contenido claro, sin datos sensibles.  
- Fallos SMTP: reintento 3 veces (exponencial), luego marca "pendiente de envÃ­o" en bitÃ¡cora.  
- BitÃ¡cora registra: destinatario, asunto, estado, timestamp, intentos.

---

## RF-9 PERFIL Y PERSONALIZACIÃ“N (Datos propios)

### RF-9.1 VisualizaciÃ³n del perfil

**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-1 Accesos, BD usuarios, RF-5.4 Facial  

**DescripciÃ³n:**  
Pantalla "Perfil" â€” SOLO LECTURA de datos propios:  
- Nombre, apellido.  
- Tipo y nÃºmero de documento.  
- Correo electrÃ³nico.  
- Rol actual (etiqueta "Aprendiz" con badge visual).  
- Ficha activa (nombre, cÃ³digo, programa) o "Pendiente por ficha" si huÃ©rfano.  
- Avatar con iniciales (gradiente institucional).  
- Acceso directo a **"Mi reconocimiento facial"** (navega a RF-5.4).  
- Acceso directo a **ConfiguraciÃ³n** (navega a RF-9.3).  
- NO ediciÃ³n de campos (eso es Admin en RF-10.2).

**PrecondiciÃ³n:**  
- Usuario autenticado.  
- Registro previo en BD.

**QuÃ© NO puede hacer el Aprendiz:**  
- NO modifica nombre, apellido, documento, email, rol, ficha.  
- NO ve datos de otros usuarios.  
- NO ve hash de contraseÃ±a ni tokens.

**Criterios de aceptaciÃ³n:**  
- Datos consistentes con BD (getMyProfile).  
- Carga < 2 seg.  
- No muestra datos sensibles innecesarios.  
- BitÃ¡cora registra consulta de perfil.  
- Avatar muestra iniciales nombre+apellido o email.  
- Badge rol visible y coherente con token.

---

### RF-9.2 Cerrar sesiÃ³n

**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-1 Accesos  

**DescripciÃ³n:**  
BotÃ³n "Cerrar sesiÃ³n" en Perfil (y accesible desde ConfiguraciÃ³n):  
- Confirma con dialog ("Â¿Cerrar sesiÃ³n?").  
- Invalida token/sesiÃ³n activa en backend.  
- Limpia almacenamiento local (AsyncStorage/secure store).  
- Redirige a Login.

**PrecondiciÃ³n:**  
- SesiÃ³n iniciada.

**QuÃ© NO puede hacer el Aprendiz:**  
- NO cierra sesiÃ³n de otros dispositivos (eso es Admin / seguridad).  
- NO accede a Ã¡reas protegidas tras cerrar sesiÃ³n.

**Criterios de aceptaciÃ³n:**  
- Tras cerrar, ningÃºn endpoint protegido accesible sin re-login.  
- Token destruido completamente (client + server).  
- RedirecciÃ³n inmediata a /auth/login.

---

### RF-9.3 ConfiguraciÃ³n (Preferencias generales)

**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-9 ConfiguraciÃ³n, PolÃ­ticas del sistema  

**DescripciÃ³n:**  
Pantalla "ConfiguraciÃ³n" (accesible desde Perfil):  
- **Idioma**: Selector desplegable con 4 idiomas (EspaÃ±ol, English, Deutsch, FranÃ§ais) â€” cambio inmediato sin reiniciar (i18n).  
- **Tema**: Toggle Claro / Oscuro (vista previa inmediata, persiste al guardar).  
- **Notificaciones push**: Toggle activar/desactivar (afecta RF-8.2 push local; NO afecta email RF-8.3).  
- BotÃ³n **"Guardar cambios"** Ãºnico para persistir todo el borrador.  
- Estados: guardando / guardado / error.

**PrecondiciÃ³n:**  
- Usuario autenticado.  
- ConfiguraciÃ³n previa existente o primera vez (valores por defecto).

**QuÃ© NO puede hacer el Aprendiz:**  
- NO configura permisos, roles, horarios, ambientes.  
- NO ve/edita configuraciÃ³n de otros usuarios.  
- NO desactiva notificaciones email crÃ­ticas (RF-8.3).  
- NO personaliza colores del dashboard (RF-9.5 pendiente de implementar).

**Criterios de aceptaciÃ³n:**  
- Cambios de tema/idioma aplican en tiempo real (preview) antes de guardar.  
- Guardado: una sola llamada API con todo el borrador.  
- Persistencia tras cerrar sesiÃ³n y reiniciar app.  
- BitÃ¡cora registra modificaciÃ³n (campo, valor anterior, nuevo, timestamp, usuario).

---

### RF-9.4 ConfiguraciÃ³n de idioma

**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-9 ConfiguraciÃ³n, Soporte multilenguaje (i18n)  

**DescripciÃ³n:**  
Selector en ConfiguraciÃ³n con idiomas soportados: EspaÃ±ol (es), English (en), Deutsch (de), FranÃ§ais (fr).  
- Cambio aplica inmediato en toda la app (i18n.changeLanguage).  
- Persiste en perfil de usuario (backend).  
- Textos, botones, mensajes, fechas, listas se traducen automÃ¡ticamente.  
- UI: lista desplegable expansible desde fila "Idioma" con checkmark en idioma activo.

**PrecondiciÃ³n:**  
- Usuario autenticado.  
- Paquetes de idioma cargados en app.

**QuÃ© NO puede hacer el Aprendiz:**  
- NO agrega nuevos idiomas.  
- NO edita traducciones.  
- NO fuerza idioma a otros usuarios.

**Criterios de aceptaciÃ³n:**  
- Cambio sin reiniciar sesiÃ³n ni app.  
- Todos los textos visibles traducidos correctamente.  
- Error si selecciona idioma no soportado: "Idioma no soportado".  
- Persistencia: al reabrir app, mantiene Ãºltimo idioma elegido.

---

### RF-9.5 PersonalizaciÃ³n del Dashboard (Colores) â€” *Pendiente de implementar*

**Actor:** Aprendiz / Sistema  
**Fuentes:** RF-9 ConfiguraciÃ³n, Preferencias visuales  

**DescripciÃ³n:**  
El aprendiz personaliza la apariencia de SU Dashboard (pantalla principal /apprentice):  
- Esquemas de color predefinidos (paleta institucional + variantes).  
- Selector visual con preview en tiempo real.  
- Guarda preferencia en perfil (backend).  
- Afecta: color primario de tarjetas, header, botones, badges en SU vista.  
- NO afecta a otros roles ni usuarios.

**PrecondiciÃ³n:**  
- Usuario autenticado.  
- Plantillas/esquemas de color definidos en sistema.

**QuÃ© NO puede hacer el Aprendiz:**  
- NO crea esquemas personalizados (solo elige de predefinidos).  
- NO aplica colores que rompan accesibilidad (contraste mÃ­nimo WCAG AA).  
- NO personaliza Dashboard de Instructor/Admin/Coordinador.

**Criterios de aceptaciÃ³n:**  
- Colores aplican sin recarga completa de pantalla (hot reload estilo).  
- Preferencia persiste tras cerrar sesiÃ³n y entre dispositivos.  
- Combinaciones invÃ¡lidas (bajo contraste) bloqueadas con advertencia.  
- BitÃ¡cora registra cambio de esquema.

---

## RNF â€” REQUERIMIENTOS NO FUNCIONALES APLICABLES A LAS 4 PANTALLAS DEL APRENDIZ

### RNF-AP-1 Seguridad de datos propios (Privacidad / Ley 1581/2012)
**Referencia SRS:** RNF-1, RNF-2, RNF-11, RNF-14, RNF-14.1, RNF-14.3  
- Datos biomÃ©tricos (vector facial) y personales del aprendiz: cifrados en reposo y trÃ¡nsito (TLS 1.2+).  
- Acceso SOLO al propio perfil (RBAC: learner read own).  
- ContraseÃ±as: solo hash (bcrypt/argon2), nunca texto plano.  
- Sesiones: tokens JWT firmados, expiraciÃ³n 15 min inactividad, refresh token rotativo.  
- AuditorÃ­a: toda lectura/escritura de datos propios loggeada (usuario, acciÃ³n, IP, timestamp).  
- Vigencia registro facial: 12 meses â†’ notificaciÃ³n automÃ¡tica + bloqueo reconocimiento hasta renovar.

### RNF-AP-2 Rendimiento y tiempos de respuesta
**Referencia SRS:** RNF-3, RNF-17, RNF-21  
- Dashboard (inicial): < 2 seg carga completa.  
- Mi asistencia (lista + filtros): < 2 seg.  
- Mi Historial (lista agrupada 12 meses): < 2 seg; scroll virtualizado 60 fps.  
- Notificaciones (lista + filtros): < 1 seg.  
- Perfil / ConfiguraciÃ³n: < 1.5 seg.  
- Cambio tema/idioma/color: preview inmediato (< 200 ms), guardado backend < 3 seg.  
- SincronizaciÃ³n offline (mÃ³dulo local â†’ servidor): cola local, reintento automÃ¡tico, pÃ©rdida < 0.1%.

### RNF-AP-3 Usabilidad y Accesibilidad
**Referencia SRS:** RNF-3, RNF-11, RNF-16.2, RNF-21, RNF-25  
- Interfaz adaptada a rol aprendiz: solo muestra lo autorizado (menÃºs, botones, datos).  
- NavegaciÃ³n intuitiva: bottom tabs / sidebar consistente.  
- Colores con contraste WCAG AA mÃ­nimo (4.5:1 texto, 3:1 UI).  
- Soporte multilenguaje completo (ES/EN/DE/FR) sin recarga.  
- Modo oscuro/claro nativo, persistente.  
- Feedback visual en acciones (loading, Ã©xito, error, empty states).  
- Touch targets â‰¥ 44x44 dp.  
- Textos legales (privacidad, consentimiento) en lenguaje claro, sin tecnicismos.  

### RNF-AP-4 Disponibilidad y Confiabilidad
**Referencia SRS:** RNF-3, RNF-17, RNF-21  
- Uptime objetivo 99% (excluyendo ventanas mantenimiento programado).  
- Modo offline en app: consulta de historial/lista/notificaciones cacheadas (Ãºltimos 30 dÃ­as).  
- SincronizaciÃ³n automÃ¡tica al recuperar conexiÃ³n.  
- Backups diarios de BD (incluyendo datos biomÃ©tricos cifrados).  
- RecuperaciÃ³n ante desastre: RPO < 1 hora, RTO < 4 horas.

### RNF-AP-5 Integridad y Trazabilidad
**Referencia SRS:** RNF-8, RNF-9, RNF-18, RNF-25  
- Log de errores automÃ¡tico en tabla `LogErrores` (fecha, usuarioId, tipo, descripciÃ³n, stack trace).  
- Cada registro: usuarioId, acciÃ³n, descripciÃ³n, IP, timestamp, rolEnSesiÃ³n.  
- Registros inmutables (append-only), retenciÃ³n mÃ­nima 2 aÃ±os.

### RNF-AP-6 Control de Acceso Basado en Rol (RBAC Estricto)
**Referencia SRS:** RNF-10, RNF-16.1, RNF-16.3, RNF-16.4, RNF-18, RNF-23, RNF-24, RNF-25  
- Endpoints protegidos por middleware: `/api/apprentice/**` valida rol=aprendiz en token.  
- Intentos de acceso a rutas admin/instructor/coordinator â†’ 403 Forbidden + log seguridad.  
- Rol NO modificable desde frontend (solo Admin via RF-10.2).  
- Rol registrado en sesiÃ³n y logs para trazabilidad.

### RNF-AP-7 ProtecciÃ³n de Datos Sensibles y BiomÃ©tricos
**Referencia SRS:** RNF-2 (extenso), RNF-12, RNF-13  
- Vector facial: almacenado solo en servidor/mÃ³dulo local autorizados, cifrado AES-256.  
- Consentimiento explÃ­cito registrado (fecha, hora, versiÃ³n aviso, IP) para menores y mayores.  
- Menor de edad: flujo obligatorio con acudiente (email distinto, verificaciÃ³n 6 dÃ­gitos, consentimiento trazable).  
- Derecho ARCO (Acceso, RectificaciÃ³n, CancelaciÃ³n, OposiciÃ³n) accesible desde Perfil â†’ enlace a formulario.  
- EliminaciÃ³n segura (crypto-shredding) al solicitar cancelaciÃ³n cuenta.

### RNF-AP-8 Validaciones de Entrada y Consistencia
**Referencia SRS:** RNF-4, RNF-5, RNF-6, RNF-7, RNF-12  
- Email Ãºnico validado en registro y ediciÃ³n (solo Admin edita).  
- Documento Ãºnico por usuario.  
- No duplicados de datos personales (nombre+apellido+doc combinados).  
- Campos: documento/telÃ©fono=solo nÃºmeros; nombre/apellido=solo letras; email=formato RFC5322.  
- Edad vÃ¡lida: 8â€“100 aÃ±os (fecha nacimiento).  
- CÃ³digos ficha/transferencia: validaciÃ³n formato y existencia en BD antes de procesar.

---

## RESUMEN DE PANTALLAS Y RF/RNF ASOCIADOS (ROL APRENDIZ)

| Pantalla | RF Principales | RNF Clave |
|----------|----------------|-----------|
| **Dashboard** | RF-9.5 (personalizaciÃ³n - pendiente), RF-8.2 (badge notificaciones), RF-6.1/6.2 (estado rÃ¡pido) | RNF-AP-2, AP-3, AP-6 |
| **Mi reconocimiento facial** | RF-5.1 (registro inicial), RF-5.4 (restablecimiento) | RNF-AP-1, AP-3, AP-7 |
| **Mi asistencia** | RF-6.1 (consulta propia), RF-6.2 (consulta individual), RF-7.1 (reporte propio), RF-7.2 (resumen ficha) | RNF-AP-1, AP-2, AP-3, AP-5, AP-6 |
| **Notificaciones** | RF-8.1 (generaciÃ³n), RF-8.2 (visualizaciÃ³n), RF-8.3 (email) | RNF-AP-1, AP-2, AP-3, AP-5, AP-6 |
| **Perfil** | RF-9.1 (vista), RF-9.2 (logout), acceso RF-5.4 y RF-9.3 | RNF-AP-1, AP-3, AP-5, AP-6, AP-7 |
| **ConfiguraciÃ³n** | RF-9.3 (prefs), RF-9.4 (idioma), RF-9.5 (colores dashboard - pendiente) | RNF-AP-1, AP-2, AP-3, AP-5, AP-6 |
| **Solicitud Traslado** | RF-3.3 (transfer-request) | RNF-AP-1, AP-5, AP-6 |
| **Unirse a Ficha** | RF-3.3 (join-ficha) | RNF-AP-1, AP-5, AP-6 |

---

## MATRIZ DE PERMISOS RESUMEN (APRENDIZ)

| AcciÃ³n | Permitido | RestricciÃ³n |
|--------|-----------|-------------|
| Ver propia asistencia (resumen + detalle) | âœ… | Solo propios registros, validado en servidor |
| Ver resumen ficha (agregado) | âœ… | Anonimizado, sin datos compaÃ±eros |
| Ver historial (lista tarjetas / agrupado por mes) | âœ… | Solo propios estados, validado en servidor |
| Exportar propia asistencia (Excel/CSV) | âœ… | Solo propios registros |
| Solicitar traslado ficha | âœ… | Si tiene ficha activa (transfer-request) |
| Unirse a ficha por cÃ³digo | âœ… | Solo si huÃ©rfano (join-ficha) |
| Ver notificaciones propias | âœ… | Solo destinatario = userId |
| Marcar notificaciÃ³n leÃ­da | âœ… | No eliminar |
| Ver perfil propio | âœ… | Solo lectura |
| Cambiar tema/idioma/notificaciones push | âœ… | Solo own profile |
| Cerrar sesiÃ³n | âœ… | Invalida own token |
| Registrar rostro facial (inicial) | âœ… | Una captura frontal vÃ¡lida |
| Solicitar restablecimiento facial | âœ… | Solo si ya registrado, una solicitud a la vez |
| Ver reportes de otros | âŒ | Admin/Instructor only |
| Editar horarios/ambientes | âŒ | Admin/Instructor only |
| Gestionar usuarios | âŒ | Admin only |
| Configurar notificaciones email | âŒ | Sistema/Admin define criticidad |
| Acceder a registros ajenos (nombre/documento/ficha/programa) | âŒ | Servidor rechaza (RBAC estricto) |

---

## DECISIÃ“N DE DISEÃ‘O: REEMPLAZO DE CALENDARIO POR LISTA AGRUPADA POR MES

**Problema identificado:**  
El calendario mensual tradicional genera fricciÃ³n en el aprendiz:  
- Requiere navegaciÃ³n mes a mes para encontrar una ausencia antigua.  
- DÃ­as sin clase (fines de semana, festivos) aÃ±aden ruido visual.  
- DifÃ­cil comparar patrones (ej. "Â¿cuÃ¡ntos retrasos tuve en agosto?").

**SoluciÃ³n adoptada â€” Lista Agrupada por Mes (Timeline colapsable):**  
- **Escaneo lineal**: el ojo recorre una sola columna vertical, patrones saltan a la vista.  
- **Densidad de informaciÃ³n**: cada fila muestra estado + hora + ambiente sin abrir detalle.  
- **Colapso por mes**: meses pasados colapsados por defecto, mes actual expandido.  
- **Filtro + bÃºsqueda**: "solo ausencias", "solo retrasos", "ambiente X", rango fechas.  
- **VirtualizaciÃ³n**: renderiza solo filas visibles â†’ 12 meses fluidos en mÃ³viles gama media.  
- **Accesibilidad**: mejor soporte lectores de pantalla (lista semÃ¡ntica vs grid de calendario).

**Estados visuales unificados** (consistentes en Mi Asistencia, Mi Historial, Notificaciones):  
- ðŸŸ¢ Puntual  
- ðŸŸ¡ Retraso X min  
- âšª Sin clase  
- ðŸ”µ Ingreso no programado  

**MÃ©tricas de usabilidad objetivo:**  
- Tiempo para encontrar Ãºltima ausencia: < 5 seg (vs 15-20 seg en calendario).  
- Carga cognitiva: lista Ãºnica vs navegaciÃ³n espacial + temporal.

---

**Fin del documento â€” Requerimientos Rol Aprendiz (FaceLit SENA)**  
*Basado en SRS v1 y cÃ³digo actual rama `feature/instructor`*  
*ActualizaciÃ³n: MÃ³dulo facial en PC con cÃ¡mara | Historial = Lista agrupada por mes (no calendario) | RF-5.4 Restablecimiento facial | RF-6.1/6.2/6.3 Consulta asistencia propia con exportaciÃ³n | Notificaciones con categorÃ­as visuales | Perfil con avatar iniciales y accesos directos | RF-9.5 Colores dashboard pendiente*
