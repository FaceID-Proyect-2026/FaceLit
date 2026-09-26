# Validaciones de Formularios

## Registro de Usuario (Módulo 1)

| Campo | Validación |
|-------|-----------|
| Nombre | Solo letras (incluye acentos y ñ). Sin números ni símbolos. |
| Apellidos | Solo letras. Sin números ni símbolos. |
| Tipo Documento | Selección obligatoria: TI, CC, CE, PA |
| N° Documento | Solo números. Exactamente 10 dígitos. |
| Email | Formato válido. No duplicado. Verificado con código 6 dígitos. |
| Contraseña | 8-15 caracteres. 1 mayúscula + 1 número + 1 símbolo. |
| Fecha Nacimiento | 8-100 años. Consistencia con tipo documento (TI<18, CC≥18). |
| Políticas | Aceptación obligatoria de privacidad y derechos. |

## Ambientes (Módulo 2)

| Campo | Validación |
|-------|-----------|
| Código | Único. Obligatorio. |
| Nombre | Obligatorio. |
| Tipo | Selección obligatoria (salón, lab, taller, auditorio, oficina). |
| Capacidad | Número ≥ 1. |
| Eliminación | Bloqueada si tiene fichas activas asignadas. |

## Gestión Académica (Módulo 3)

| Regla | Descripción |
|-------|------------|
| Programa | No eliminar si tiene fichas asociadas. |
| Ficha | Debe pertenecer a un programa activo. Código único. |
| Aprendiz | Solo 1 ficha activa a la vez. Código de ficha debe existir y estar activo. |
| Desvinculación | Solo admin. No elimina al aprendiz, solo la relación. |

## Horarios (Módulo 4)

| Conflicto | Validación |
|-----------|-----------|
| Ambiente ocupado | No puede haber 2 horarios mismo ambiente + misma franja. |
| Instructor ocupado | No puede estar en 2 horarios que se crucen. |
| Ficha requerida | No registrar sin ficha. |
| Instructor requerido | No registrar sin instructor. |

## Asistencias (Módulo 6)

| Validación | Descripción |
|-----------|------------|
| Ambiente correcto | El usuario debe estar en el ambiente asignado según su horario. |
| Cálculo retraso | `HoraIngreso - HoraProgramada`. Si > 0 = retraso. |
| Registro automático | Fecha y hora se registran sin intervención manual. |
