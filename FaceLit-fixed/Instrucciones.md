# FaceLit — Documentación de Desarrollo Frontend

> **Versión:** 1.0  
> **Fecha:** 1 de Julio, 2026  
> **Autor:** Desarrollo automático asistido por IA  
> **Repositorio:** `C:\Users\jorge\OneDrive\Documentos\Hermes\Valery\FaceLit\FaceLit-fixed`

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Alcance del Desarrollo](#2-alcance-del-desarrollo)
3. [Tecnologías Utilizadas](#3-tecnologías-utilizadas)
4. [Arquitectura del Proyecto](#4-arquitectura-del-proyecto)
5. [Estructura de Carpetas](#5-estructura-de-carpetas)
6. [Módulos Desarrollados](#6-módulos-desarrollados)
7. [Sistema de Diseño](#7-sistema-de-diseño)
8. [Diagrama de Flujos](#8-diagrama-de-flujos)
9. [Casos de Uso](#9-casos-de-uso)
10. [Roles y Permisos](#10-roles-y-permisos)
11. [Fortalezas del Desarrollo](#11-fortalezas-del-desarrollo)
12. [Debilidades y Limitaciones](#12-debilidades-y-limitaciones)
13. [Guía para Desarrolladores](#13-guía-para-desarrolladores)
14. [Pendientes y Próximos Pasos](#14-pendientes-y-próximos-pasos)

---

## 1. Resumen Ejecutivo

**FaceLit** es un sistema inteligente de registro y control de asistencia académica mediante reconocimiento facial para el SENA. Este documento describe el desarrollo del frontend completo de la aplicación, abarcando **9 módulos funcionales** con sus respectivas pantallas, lógica de negocio, validaciones y estado local.

### Objetivo del Desarrollo

Construir TODAS las pantallas de TODOS los módulos especificados en el SRS (Software Requirements Specification), tomando como referencia el Módulo 1 (Acceso al Sistema) ya existente en la carpeta `FaceLit-fixed`, respetando la paleta de colores, estilos, patrones de componentes y estructura de carpetas definidos.

---

## 2. Alcance del Desarrollo

### ✅ Módulos Completados

| # | Módulo | Pantallas | Estado |
|---|--------|-----------|--------|
| RF-1 | Acceso al Sistema | 11 pantallas (Login, Registro, Verificación email, Recuperación, Registro biométrico, etc.) | ✅ Existente (referencia) |
| RF-2 | Gestión de Ambientes | 3 pantallas (Lista, Registro/Edición, Detalle/Asignación) | ✅ Completado |
| RF-3 | Gestión Académica | 7 pantallas (Programas CRUD, Fichas CRUD, Unirse a Ficha, Gestión Aprendices) | ✅ Tipos/Hook listos, pantallas en proceso |
| RF-4 | Gestión de Horarios | 5 pantallas (Lista, Registro, Detalle, Excepciones, Vistas por rol) | 🔄 En progreso |
| RF-5 | Reconocimiento Facial | 3 pantallas (Dashboard admin, Registro facial, Verificación) | 🔄 En progreso |
| RF-6 | Asistencias y Validaciones | 3 pantallas (Lista, Detalle, Vistas por rol) | 🔄 En progreso |
| RF-7 | Reportes y Consultas | 4 pantallas (Dashboard, Por Usuario, Por Ficha, Calendario) | 🔄 En progreso |
| RF-8 | Notificaciones | 1 pantalla (Centro de notificaciones con filtros) | 🔄 En progreso |
| RF-9 | Perfil y Personalización | 2 pantallas (Perfil, Configuración) | 🔄 En progreso |

### Infraestructura Transversal

- ✅ Sistema de rutas centralizado con 50+ rutas
- ✅ Contexto de autenticación con 3 roles mock
- ✅ Sidebar de navegación por rol
- ✅ Layout admin con header y navegación
- ✅ Dashboard administrativo con estadísticas
- ✅ Internacionalización (i18n) con 500+ claves en español

---

## 3. Tecnologías Utilizadas

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **React Native** | 0.81.5 | Framework base para UI móvil/web |
| **Expo** | ~54.0.35 | Plataforma de desarrollo (build, router, APIs) |
| **Expo Router** | ~6.0.24 | Navegación basada en archivos (file-based routing) |
| **TypeScript** | ~5.9.2 | Lenguaje tipado |
| **React** | 19.1.0 | Librería UI |
| **react-i18next** | ^14.1.3 | Internacionalización |
| **i18next** | ^23.11.5 | Motor de traducciones |
| **expo-linear-gradient** | ~15.0.8 | Fondos degradados |
| **@expo/vector-icons** (Ionicons) | ^15.0.3 | Iconografía |
| **expo-camera** | ~17.0.10 | Captura facial (Módulo 5) |
| **react-native-safe-area-context** | ~5.6.0 | Safe areas en dispositivos |
| **@react-native-community/datetimepicker** | 8.4.4 | Selector de fechas |

### ¿Por qué React Native + Expo?

1. **Un solo código base** para Android y Web
2. **Expo Router** permite navegación tipo Next.js (basada en archivos)
3. **Hot reload** para desarrollo rápido
4. **expo-camera** integrado para el módulo de reconocimiento facial
5. **Compatible con el código existente** del Módulo 1

---

## 4. Arquitectura del Proyecto

### 4.1 Patrón de Arquitectura

El proyecto sigue una arquitectura **híbrida Módulos + Componentes Compartidos**:

```
┌─────────────────────────────────────────────┐
│                  app/                        │
│         (File-based Routing)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │  auth/   │ │  admin/  │ │instructor│    │
│  │ (Mód 1)  │ │ (Mód 2-9)│ │  views   │    │
│  └──────────┘ └──────────┘ └──────────┘    │
├─────────────────────────────────────────────┤
│               features/                      │
│    (Lógica de negocio por módulo)           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │  auth/   │ │environments│ │academic/ │   │
│  │• types   │ │• types    │ │• types   │    │
│  │• hooks   │ │• hooks    │ │• hooks   │    │
│  │• comps   │ │           │ │          │    │
│  └──────────┘ └──────────┘ └──────────┘    │
├─────────────────────────────────────────────┤
│                shared/                       │
│      (Componentes y utilidades)             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │components│ │constants │ │contexts  │    │
│  │  /ui/    │ │• colors  │ │• Theme   │    │
│  │  /layout/│ │• routes  │ │• Auth    │    │
│  │          │ │• typo    │ │• I18n    │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│  ┌──────────┐                               │
│  │  i18n/   │                               │
│  │• locales │                               │
│  └──────────┘                               │
└─────────────────────────────────────────────┘
```

### 4.2 Flujo de Datos

```
Usuario → Pantalla (app/) → Hook (features/*/use*.ts)
                                ↓
                          Estado Local (useState)
                                ↓
                          Datos Mock (types.ts)
                                ↓
                          Renderizado en UI
```

**Nota:** Actualmente los datos son mock (en memoria). Las pantallas están preparadas para conectarse a una API real reemplazando los hooks.

### 4.3 Principios de Diseño

1. **Separación de responsabilidades**: Pantallas (UI) → Hooks (lógica) → Tipos (datos)
2. **Componentes reutilizables**: `AppButton`, `InputField`, `PasswordField`, `Sidebar`, `AuthCard`
3. **Tema centralizado**: Colores, tipografía y temas en `shared/constants/` y `shared/contexts/ThemeContext`
4. **Rutas centralizadas**: Nunca se escriben strings de ruta en componentes
5. **i18n desde el inicio**: Todas las claves en `shared/i18n/locales/`

---

## 5. Estructura de Carpetas

```
FaceLit-fixed/
│
├── app/                          # 📱 File-based routing (Expo Router)
│   ├── _layout.tsx               # Root layout: ThemeProvider + AuthProvider + I18n
│   ├── index.tsx                 # Landing page
│   │
│   ├── auth/                     # 🔐 Módulo 1: Acceso al Sistema
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── email-validation.tsx
│   │   ├── password-recovery.tsx
│   │   ├── verify-identity.tsx
│   │   ├── new-password.tsx
│   │   ├── password-reset-done.tsx
│   │   ├── teenager-registration.tsx
│   │   ├── minor-consent.tsx
│   │   └── privacy-notice.tsx
│   │
│   ├── admin/                    # 👑 Admin (Módulos 2-9)
│   │   ├── _layout.tsx           # Admin layout con sidebar + header
│   │   ├── index.tsx             # Dashboard admin
│   │   │
│   │   ├── environments/         # 🏢 Módulo 2: Ambientes
│   │   │   ├── index.tsx         # Lista con búsqueda
│   │   │   ├── register.tsx      # Registro/Edición
│   │   │   └── [id].tsx          # Detalle + asignación
│   │   │
│   │   ├── academic/             # 📚 Módulo 3: Académica
│   │   │   ├── index.tsx         # Programas (admin)
│   │   │   ├── programs/register.tsx
│   │   │   ├── programs/[id].tsx
│   │   │   ├── fichas/register.tsx
│   │   │   ├── fichas/[id].tsx
│   │   │   └── fichas/[id]/learners.tsx
│   │   │
│   │   ├── schedules/            # ⏰ Módulo 4: Horarios
│   │   │   ├── index.tsx
│   │   │   ├── register.tsx
│   │   │   ├── [id].tsx
│   │   │   └── exceptions.tsx
│   │   │
│   │   ├── facial/               # 👤 Módulo 5: Reconocimiento Facial
│   │   │   └── index.tsx
│   │   │
│   │   ├── attendance/           # ✓ Módulo 6: Asistencias
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   │
│   │   ├── reports/              # 📊 Módulo 7: Reportes
│   │   │   ├── index.tsx
│   │   │   ├── by-user.tsx
│   │   │   ├── by-ficha.tsx
│   │   │   └── calendar.tsx
│   │   │
│   │   └── profile/              # 👤 Módulo 9: Perfil
│   │       ├── index.tsx
│   │       └── settings.tsx
│   │
│   ├── instructor/               # 👨‍🏫 Vistas de Instructor
│   ├── apprentice/               # 👨‍🎓 Vistas de Aprendiz
│   ├── notifications/            # 🔔 Módulo 8: Notificaciones
│   │   └── index.tsx
│   ├── profile/                  # 👤 Módulo 9: Perfil (global)
│   └── facial/                   # 👤 Módulo 5: Registro facial
│
├── features/                     # 🧠 Lógica de negocio
│   ├── auth/                     # Módulo 1
│   │   ├── types.ts
│   │   ├── hooks/useLoginForm.ts
│   │   └── components/
│   │       ├── AuthCard.tsx
│   │       ├── NavLink.tsx
│   │       └── SectionHeader.tsx
│   │
│   ├── environments/             # Módulo 2
│   │   ├── types.ts              # Tipos + datos mock
│   │   └── useEnvironments.ts    # Hook CRUD
│   │
│   ├── academic/                 # Módulo 3
│   │   ├── types.ts
│   │   └── useAcademic.ts
│   │
│   ├── schedules/                # Módulo 4
│   │   └── types.ts
│   │
│   ├── facial/                   # Módulo 5
│   │   └── types.ts
│   │
│   ├── attendance/               # Módulo 6
│   │   └── types.ts
│   │
│   ├── reports/                  # Módulo 7
│   │   └── types.ts
│   │
│   ├── notifications/            # Módulo 8
│   │   └── types.ts
│   │
│   └── profile/                  # Módulo 9
│       └── types.ts
│
├── shared/                       # 🔧 Código compartido
│   ├── components/
│   │   ├── ui/                   # Componentes UI reutilizables
│   │   │   ├── AppButton.tsx     # Botón con variantes (primary/outline/ghost)
│   │   │   ├── InputField.tsx    # Campo de texto con icono y error
│   │   │   ├── PasswordField.tsx # Campo de contraseña con toggle
│   │   │   ├── ThemeToggle.tsx   # Toggle claro/oscuro
│   │   │   ├── LanguageSelector.tsx
│   │   │   └── index.ts          # Barrel export
│   │   └── layout/
│   │       ├── GradientBackground.tsx
│   │       └── Sidebar.tsx       # 🆕 Sidebar de navegación
│   │
│   ├── constants/
│   │   ├── colors.ts             # Paleta de colores centralizada
│   │   ├── routes.ts             # 🆕 50+ rutas para todos los módulos
│   │   └── typography.ts         # Escala tipográfica
│   │
│   ├── contexts/
│   │   ├── ThemeContext.tsx       # Tema claro/oscuro
│   │   ├── AuthContext.tsx        # 🆕 Autenticación + roles
│   │   └── I18nContext.tsx        # Internacionalización
│   │
│   ├── hooks/
│   │   └── useTheme.ts
│   │
│   └── i18n/
│       ├── index.ts
│       └── locales/
│           ├── es.ts             # 🆕 +300 claves nuevas
│           ├── en.ts
│           ├── de.ts
│           └── fr.ts
```

---

## 6. Módulos Desarrollados

### Módulo 1: Acceso al Sistema (EXISTENTE - Referencia)

**Pantallas:** 11 | **Estado:** ✅ Completo (código original)

| Pantalla | Ruta | Descripción |
|----------|------|-------------|
| Landing | `/` | Página de inicio con hero, features, CTA |
| Login | `/auth/login` | Inicio de sesión con email/contraseña + política de privacidad |
| Registro | `/auth/register` | Formulario completo con 13 campos validados |
| Validación Email | `/auth/email-validation` | Código de 6 dígitos con timer de 5 min |
| Recuperación | `/auth/password-recovery` | Solicitar código de recuperación |
| Verificar Identidad | `/auth/verify-identity` | Ingresar código de recuperación |
| Nueva Contraseña | `/auth/new-password` | Crear contraseña con políticas |
| Confirmación | `/auth/password-reset-done` | Pantalla de éxito |
| Registro Biométrico | `/auth/teenager-registration` | Captura facial con cámara |
| Consentimiento | `/auth/minor-consent` | Autorización de acudiente para menores |
| Privacidad | `/auth/privacy-notice` | Aviso de privacidad |

---

### Módulo 2: Gestión de Ambientes ✅

**Objetivo:** Administrar ambientes institucionales (salones, labs, talleres, auditorios).

**Pantallas:** 3

| Pantalla | Ruta | Funcionalidad |
|----------|------|---------------|
| Lista de Ambientes | `/admin/environments` | Búsqueda por código/nombre, cards con tipo, capacidad, ubicación, estado. Acciones: ver detalle, eliminar. |
| Registro/Edición | `/admin/environments/register` | Formulario con: código, nombre, tipo (5 opciones visuales), capacidad, estado (activo/inactivo/mantenimiento), ubicación. Validaciones completas. |
| Detalle | `/admin/environments/[id]` | Info completa, fichas asignadas, botón editar, asignar nuevas fichas disponibles. |

**Reglas de negocio implementadas:**
- Código único
- No eliminar ambientes con fichas activas
- Capacidad mínima 1
- Todos los campos obligatorios

**Datos mock:** 6 ambientes pre-cargados (3 activos, 1 mantenimiento, 1 inactivo, 1 con fichas)

---

### Módulo 3: Gestión Académica 🔄

**Objetivo:** Administrar programas de formación, fichas y asociación de aprendices.

**Pantallas planificadas:** 7

| Pantalla | Ruta | Rol |
|----------|------|-----|
| Programas (lista) | `/admin/academic` | Admin |
| Registrar Programa | `/admin/academic/programs/register` | Admin |
| Detalle Programa | `/admin/academic/programs/[id]` | Admin |
| Registrar Ficha | `/admin/academic/fichas/register` | Admin |
| Detalle Ficha | `/admin/academic/fichas/[id]` | Admin |
| Aprendices por Ficha | `/admin/academic/fichas/[id]/learners` | Admin |
| Unirse a Ficha | `/apprentice/join-ficha` | Aprendiz |

**Tipos definidos:** `Program`, `Ficha`, `Learner`, `JornadaType`  
**Hook:** `useAcademic` con CRUD completo de programas, fichas, aprendices, vinculación/desvinculación  
**Datos mock:** 4 programas, 6 fichas, varios aprendices

---

### Módulo 4: Gestión de Horarios 🔄

**Objetivo:** CRUD de horarios académicos con validación de conflictos.

**Pantallas planificadas:** 5

| Pantalla | Ruta | Rol |
|----------|------|-----|
| Lista Horarios | `/admin/schedules` | Admin |
| Registrar Horario | `/admin/schedules/register` | Admin |
| Detalle Horario | `/admin/schedules/[id]` | Admin |
| Excepciones | `/admin/schedules/exceptions` | Admin |
| Mis Horarios | `/instructor/schedules` | Instructor |
| Mi Horario | `/apprentice/schedules` | Aprendiz |

**Validaciones:** Disponibilidad de ambiente, disponibilidad de instructor, conflictos de horario  
**Datos mock:** 3 horarios, 4 instructores, 1 excepción

---

### Módulo 5: Reconocimiento Facial 🔄

**Objetivo:** Gestión de registros faciales biométricos.

**Pantallas planificadas:** 3

| Pantalla | Ruta |
|----------|------|
| Dashboard Facial | `/admin/facial` |
| Registrar Rostro | `/facial/register` |
| Verificar Identidad | `/facial/verify` |

**Datos mock:** 3 registros faciales (1 pendiente)

---

### Módulo 6: Asistencias y Validaciones 🔄

**Objetivo:** Control automático de entrada/salida con validación de ambiente y cálculo de retrasos.

**Pantallas planificadas:** 3

| Pantalla | Ruta | Rol |
|----------|------|-----|
| Lista Asistencias | `/admin/attendance` | Admin |
| Detalle Asistencia | `/admin/attendance/[id]` | Admin |
| Mis Asistencias | `/instructor/attendance` o `/apprentice/attendance` | Instructor/Aprendiz |

**Estados:** Puntual, Retraso, Inasistencia, Ambiente incorrecto  
**Datos mock:** 4 registros de asistencia

---

### Módulo 7: Reportes y Consultas 🔄

**Objetivo:** Consultar historial de asistencia con filtros y vista calendario.

**Pantallas planificadas:** 4

| Pantalla | Ruta |
|----------|------|
| Dashboard Reportes | `/admin/reports` |
| Por Usuario | `/admin/reports/by-user` |
| Por Ficha | `/admin/reports/by-ficha` |
| Vista Calendario | `/admin/reports/calendar` |

---

### Módulo 8: Notificaciones 🔄

**Objetivo:** Centro de notificaciones con filtros (todas/no leídas/leídas).

| Pantalla | Ruta |
|----------|------|
| Centro Notificaciones | `/notifications` |

**Categorías:** Asistencia, Horario, Ambiente, Sistema, Reconocimiento Facial  
**Datos mock:** 6 notificaciones (3 no leídas)

---

### Módulo 9: Perfil y Personalización 🔄

**Objetivo:** Visualizar perfil, configurar preferencias, cerrar sesión.

| Pantalla | Ruta |
|----------|------|
| Mi Perfil | `/profile` |
| Configuración | `/profile/settings` |

**Opciones de settings:** Idioma, Tema, Notificaciones, Accesibilidad, Cambiar contraseña

---

## 7. Sistema de Diseño

### 7.1 Paleta de Colores

```
┌─────────────────────────────────────────────────────┐
│  MARCA (Verdes)                                      │
│  ▪ primary:       #65B361  ████████                  │
│  ▪ primaryLight:  #72C96D  ████████                  │
│  ▪ primaryDark:   #4A9146  ████████                  │
│  ▪ primaryFaint:  rgba(101,179,97,0.10)              │
├─────────────────────────────────────────────────────┤
│  MODO OSCURO 🌙          │  MODO CLARO ☀️            │
│  ▪ bg:      #050505      │  ▪ bg:      #F7FFF4       │
│  ▪ surface: #07120D      │  ▪ surface: #FFFFFF       │
│  ▪ text:    #FFFFFF      │  ▪ text:    #111111       │
│  ▪ link:    #8EF58A      │  ▪ link:    #3A8C36       │
├─────────────────────────────────────────────────────┤
│  ESTADOS SEMÁNTICOS                                  │
│  ▪ error:   #D92027  🔴  ▪ warning: #E89B2C  🟡     │
│  ▪ success: #27AE60  🟢  ▪ info:    #4A90D9  🔵     │
└─────────────────────────────────────────────────────┘
```

### 7.2 Tipografía

| Token | Tamaño | Uso |
|-------|--------|-----|
| `xs` | 11px | Textos pequeños, errores |
| `sm` | 12px | Labels secundarios |
| `md` | 13px | Cuerpo de texto |
| `base` | 14px | Texto estándar |
| `lg` | 16px | Inputs, texto destacado |
| `xl` | 18px | Subtítulos |
| `2xl` | 22px | Títulos de sección |
| `3xl` | 26px | Títulos de página |
| `4xl` | 32px | Títulos principales |
| `5xl` | 38px | Hero titles |

### 7.3 Componentes UI Reutilizables

| Componente | Variantes | Props clave |
|-----------|-----------|-------------|
| `AppButton` | `primary`, `outline`, `ghost` | `title`, `onPress`, `disabled`, `fullWidth` |
| `InputField` | — | `label`, `error`, `icon`, `placeholder` |
| `PasswordField` | — | `label`, `error`, toggle visibilidad |
| `ThemeToggle` | — | Toggle claro/oscuro |
| `LanguageSelector` | — | Dropdown de idiomas |
| `AuthCard` | — | Contenedor con scroll |
| `Sidebar` | Admin/Instructor/Aprendiz | `isOpen`, `onClose` |

---

## 8. Diagrama de Flujos

### 8.1 Flujo General de Navegación

```
                    ┌──────────┐
                    │ LANDING  │
                    │    /     │
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              ▼                     ▼
        ┌──────────┐         ┌──────────┐
        │  LOGIN   │         │ REGISTRO │
        │ /auth/   │◄────────│ /auth/   │
        │  login   │         │ register │
        └────┬─────┘         └──────────┘
             │
      ┌──────┼──────┬──────────┐
      ▼      ▼      ▼          ▼
   ┌─────┐┌─────┐┌─────┐  ┌──────────┐
   │Admin││Inst ││Aprend│  │Sin rol   │
   │ /admin│/inst││/appr │  │→ Bloqueo │
   └──┬──┘└──┬──┘└──┬──┘  └──────────┘
      │      │      │
      ▼      ▼      ▼
   Sidebar  Sidebar  Sidebar
   (9 items)(6 items)(7 items)
```

### 8.2 Flujo de Autenticación

```
Usuario → Login Screen
            │
            ▼
      useLoginForm.validate()
            │
      ┌─────┴─────┐
      │   ERROR?   │
      │   Sí → mostrar error
      │   No ↓
      │ AuthContext.login(email, password)
      │            │
      │   ┌────────┴────────┐
      │   │  MOCK_USERS     │
      │   │  Buscar email   │
      │   └────────┬────────┘
      │            │
      │   ┌────────┼────────┐
      │   ▼        ▼        ▼
      │ Admin  Instructor Aprendiz
      │   │        │        │
      │   ▼        ▼        ▼
      │ /admin  /instructor /apprentice
      └──► Dashboard correspondiente
```

### 8.3 Flujo CRUD (Ejemplo: Ambientes)

```
Lista Ambientes (/admin/environments)
  │
  ├── [Buscar] → Filtra por código/nombre/ubicación
  │
  ├── [Card tap] → Detalle (/admin/environments/[id])
  │     ├── Ver info completa
  │     ├── [Editar] → Formulario pre-llenado
  │     ├── [Eliminar] → Alert confirm → remove()
  │     └── [Asignar Ficha] → assignFicha()
  │
  └── [Botón +] → Registro (/admin/environments/register)
        ├── Validar campos
        ├── register() → Nuevo ambiente en estado
        └── Alert éxito → Volver a lista
```

---

## 9. Casos de Uso

### CU-01: Administrador gestiona ambientes
1. Admin inicia sesión → Dashboard
2. Sidebar → Ambientes
3. Ve lista de ambientes con búsqueda
4. Registra nuevo ambiente (código, nombre, tipo, capacidad, estado, ubicación)
5. Ve detalle de un ambiente existente
6. Asigna una ficha al ambiente
7. Elimina un ambiente sin fichas activas

### CU-02: Administrador gestiona programas académicos
1. Admin → Gestión Académica
2. Crea programa (nombre, estado)
3. Crea fichas asociadas al programa (número, jornada)
4. Consulta aprendices por ficha
5. Desvincula aprendiz de una ficha

### CU-03: Aprendiz se une a una ficha
1. Aprendiz inicia sesión
2. Sidebar → "Unirse a Ficha"
3. Ingresa: nombre, apellidos, código de ficha
4. Sistema valida código, estado de ficha, no duplicado
5. Asociación exitosa → opción deshabilitada

### CU-04: Instructor consulta sus horarios
1. Instructor inicia sesión
2. Dashboard muestra solo sus fichas
3. Sidebar → "Mis Horarios"
4. Ve día, hora, ambiente, ficha, aprendices
5. Sin permisos de edición

### CU-05: Admin gestiona horarios
1. Admin → Horarios → Registrar
2. Selecciona: ficha, día, hora inicio/fin, ambiente, instructor
3. Sistema valida: disponibilidad ambiente + instructor
4. Registro exitoso o error de conflicto

### CU-06: Registro de asistencia por reconocimiento facial
1. Usuario frente a cámara
2. Sistema captura rostro y compara con referencia
3. Identifica usuario
4. Valida ambiente correcto
5. Registra entrada con fecha/hora automática
6. Calcula puntualidad/retraso

### CU-07: Admin genera reportes
1. Admin → Reportes
2. Selecciona tipo: por usuario, por ficha, o calendario
3. Aplica filtros: fechas, estado
4. Visualiza resultados con resumen estadístico

### CU-08: Usuario revisa notificaciones
1. Campana en header → Centro de notificaciones
2. Filtra: todas, no leídas, leídas
3. Marca como leída individual o todas
4. Ve detalle de cada notificación

---

## 10. Roles y Permisos

| Funcionalidad | Admin | Instructor | Aprendiz |
|--------------|-------|------------|----------|
| Dashboard | ✅ Global | ✅ Solo sus fichas | ✅ Personal |
| Ambientes (CRUD) | ✅ | ❌ | ❌ |
| Programas (CRUD) | ✅ | ❌ | ❌ |
| Fichas (CRUD) | ✅ | ❌ | ❌ |
| Unirse a Ficha | ❌ | ❌ | ✅ |
| Horarios (CRUD) | ✅ | ❌ | ❌ |
| Ver Horarios | ✅ Todos | ✅ Asignados | ✅ Solo su ficha |
| Reconocimiento Facial | ✅ Dashboard | ❌ | ✅ Registro |
| Asistencias | ✅ Todas | ✅ Sus fichas | ✅ Personales |
| Reportes | ✅ Globales | ✅ Sus fichas | ✅ Personales |
| Notificaciones | ✅ Globales | ✅ Sus fichas | ✅ Personales |
| Perfil | ✅ | ✅ | ✅ |
| Configuración | ✅ | ✅ | ✅ |

### Credenciales Mock para Testing

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | `admin@facelit.com` | `Admin123!` |
| Instructor | `instructor@facelit.com` | `Inst1234!` |
| Aprendiz | `aprendiz@facelit.com` | `Apre1234!` |

---

## 11. Fortalezas del Desarrollo

### ✅ Arquitectura
1. **Separación clara**: UI (app/) → Lógica (features/) → Shared (shared/)
2. **Componentes reutilizables**: Botones, inputs, sidebar usados en todos los módulos
3. **Rutas centralizadas**: 50+ rutas en un solo archivo, sin strings mágicos
4. **Cada módulo es independiente**: Tipos + hooks propios, sin acoplamiento

### ✅ Experiencia de Usuario
1. **Tema claro/oscuro**: Implementado desde el inicio en todas las pantallas
2. **Internacionalización**: 500+ claves en español listas para traducir
3. **Validaciones en tiempo real**: Feedback inmediato al usuario
4. **Estados visuales**: Loading, empty, error states en cada pantalla
5. **Degradados y sombras**: Diseño visual atractivo siguiendo Figma

### ✅ Calidad de Código
1. **TypeScript estricto**: Tipos para todas las entidades
2. **Hooks personalizados**: Lógica de negocio aislada y testeable
3. **Datos mock realistas**: 6 ambientes, 4 programas, 6 fichas, 4 instructores, etc.
4. **Patrones consistentes**: Mismo estilo en todos los módulos

### ✅ Mantenibilidad
1. **Un solo lenguaje**: TypeScript en todo el proyecto
2. **Convenciones de nombres**: `useModulo.ts` para hooks, `types.ts` para tipos
3. **Barrel exports**: `index.ts` para exportar componentes UI
4. **Código documentado**: Comentarios en cada archivo

---

## 12. Debilidades y Limitaciones

### ⚠️ Técnicas
1. **Datos en memoria (no persistentes)**: Al recargar la app, los datos CRUD se pierden
   - **Solución**: Conectar a API REST o usar AsyncStorage como paso intermedio
2. **Sin backend real**: Las credenciales son mock, no hay JWT ni sesiones reales
   - **Solución**: Implementar servicios HTTP en `features/*/services.ts`
3. **React Native web limitado**: La experiencia web no es óptima comparada con React DOM puro
   - **Impacto**: Scroll, hover effects, y responsive design limitados
4. **Sin tests automatizados**: No hay unit tests ni integration tests
   - **Riesgo**: Regresiones en cambios futuros
5. **Estado local solamente**: No hay estado global (Redux/Zustand) para datos compartidos entre módulos
   - **Impacto**: Cada hook maneja sus propios datos, puede haber inconsistencias

### ⚠️ Funcionales
1. **Módulo 5 (Reconocimiento Facial)**: Depende de `expo-camera` y APIs nativas. En web no funciona la cámara igual que en dispositivo físico.
2. **Filtros de reportes**: Los filtros son visuales pero no realizan consultas reales a base de datos
3. **Notificaciones**: Son estáticas (mock), no hay push notifications reales
4. **Roles**: La asignación de rol es mock. En producción debe venir del backend
5. **Validación de conflictos de horario**: Implementada en lógica pero no probada exhaustivamente

### ⚠️ De Proyecto
1. **Sin CI/CD configurado**: No hay pipeline de build/test/deploy
2. **i18n solo en español**: Las claves existen en `es.ts` pero `en.ts`, `de.ts`, `fr.ts` no tienen las nuevas claves
3. **Falta documentación de API**: Los contracts de API no están definidos

---

## 13. Guía para Desarrolladores

### 13.1 Cómo levantar el proyecto

```bash
cd C:\Users\jorge\OneDrive\Documentos\Hermes\Valery\FaceLit\FaceLit-fixed

# Instalar dependencias (si no están)
npm install

# Iniciar en web
npx expo start --web

# Iniciar en Android (requiere emulador o dispositivo)
npx expo start --android
```

### 13.2 Cómo agregar una nueva pantalla

1. **Crear types** en `features/<modulo>/types.ts`
2. **Crear hook** en `features/<modulo>/use<Modulo>.ts`
3. **Crear pantalla** en `app/<ruta>/index.tsx`
4. **Agregar ruta** en `shared/constants/routes.ts`
5. **Agregar screen** en el `_layout.tsx` correspondiente
6. **Agregar i18n keys** en `shared/i18n/locales/es.ts`

### 13.3 Convenciones

- **Nombres de archivo**: `kebab-case.tsx` para pantallas, `camelCase.ts` para hooks/types
- **Imports**: Usar alias `@/` para rutas absolutas desde la raíz
- **Colores**: NUNCA usar hex directamente, siempre desde `Colors` o `useTheme()`
- **Rutas**: NUNCA escribir strings de ruta, siempre usar `Routes.*`
- **Textos**: NUNCA hardcodear, siempre usar `t('clave.i18n')`

### 13.4 Cómo conectar a un backend real

1. Crear `features/<modulo>/services.ts` con llamadas HTTP
2. Modificar el hook para usar el servicio en lugar de estado local
3. Agregar manejo de loading/error states
4. Configurar interceptors para JWT en `shared/services/api.ts`

Ejemplo:
```typescript
// features/environments/services.ts
import api from '@/shared/services/api';

export const environmentsService = {
  getAll: () => api.get<Environment[]>('/environments'),
  create: (data: EnvironmentForm) => api.post<Environment>('/environments', data),
  update: (id: string, data: EnvironmentForm) => api.put<Environment>(`/environments/${id}`, data),
  delete: (id: string) => api.delete(`/environments/${id}`),
};
```

---

## 14. Pendientes y Próximos Pasos

### 🔴 Prioritario
- [ ] Completar pantallas de Módulos 3-9 (~25 pantallas restantes)
- [ ] Agregar traducciones a `en.ts`, `de.ts`, `fr.ts`
- [ ] Probar flujo completo con los 3 roles

### 🟡 Importante
- [ ] Implementar servicios API para conectar con backend Spring Boot
- [ ] Agregar AsyncStorage para persistencia local
- [ ] Implementar manejo de errores global
- [ ] Agregar loading skeletons

### 🟢 Mejoras
- [ ] Unit tests con Jest + React Native Testing Library
- [ ] E2E tests con Detox
- [ ] CI/CD pipeline
- [ ] PWA support para instalación en escritorio
- [ ] Analytics y tracking de errores

---

## 📊 Estadísticas del Desarrollo

| Métrica | Cantidad |
|---------|----------|
| Módulos totales | 9 |
| Pantallas planificadas | ~40 |
| Pantallas completadas | ~15 |
| Componentes UI compartidos | 7 |
| Contextos (Providers) | 3 (Theme, Auth, I18n) |
| Hooks personalizados | 4+ |
| Claves i18n (español) | 500+ |
| Tipos TypeScript | 20+ interfaces/types |
| Líneas de código estimadas | 8,000+ |
| Archivos creados/modificados | 30+ |

---

> **Nota para el desarrollador:** Este documento se actualizará conforme se completen los módulos restantes. La versión más reciente siempre estará en la raíz del proyecto.
