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

## Asistencias (Módulo 6)

| Validación | Descripción |
|-----------|------------|
| Environment validation | The user must belong to the configured environment session. |
| Delay calculation | Use the configured session entry time and attendance window. |
| Registro automático | Fecha y hora se registran sin intervención manual. |
