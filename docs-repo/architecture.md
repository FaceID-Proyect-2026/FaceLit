# Arquitectura Frontend

## Arquitectura Híbrida: Módulos + Componentes Compartidos

```
┌─────────────────────────────────────────────┐
│                  app/ (Expo Router)          │
│  Pantallas organizadas por módulo funcional  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │  auth/   │ │  admin/  │ │instructor│    │
│  │ (Mód 1)  │ │ (Mód 2-7)│ │  views   │    │
│  └──────────┘ └──────────┘ └──────────┘    │
├─────────────────────────────────────────────┤
│               features/ (Lógica)            │
│  Hooks + Tipos por módulo                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │  auth/   │ │environments│ │academic/ │   │
│  └──────────┘ └──────────┘ └──────────┘    │
├─────────────────────────────────────────────┤
│               shared/ (Compartido)          │
│  Componentes UI, constantes, contextos      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │components│ │constants │ │contexts  │    │
│  │  /ui/    │ │• colors  │ │• Theme   │    │
│  │  /layout/│ │• routes  │ │• Auth    │    │
│  └──────────┘ └──────────┘ └──────────┘    │
└─────────────────────────────────────────────┘
```

## Principios

1. **Separación de responsabilidades**: UI (app/) → Lógica (features/) → Shared (shared/)
2. **Componentes reutilizables**: AppButton, InputField, PasswordField, Sidebar
3. **Rutas centralizadas**: shared/constants/routes.ts
4. **Tema unificado**: ThemeContext + colors.ts + typography.ts
5. **i18n desde el inicio**: shared/i18n/locales/
