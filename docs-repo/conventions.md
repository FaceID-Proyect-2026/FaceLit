# Convenciones de Código

## Estructura de Carpetas

```
features/<modulo>/
├── types.ts          # Interfaces, tipos, datos mock
├── use<Modulo>.ts    # Hook con lógica de negocio
└── components/       # Componentes específicos del módulo

app/<ruta>/
├── _layout.tsx       # Layout con header/sidebar
├── index.tsx         # Pantalla principal (lista)
├── register.tsx      # Formulario de registro/edición
└── [id].tsx          # Pantalla de detalle
```

## Nombrado

- **Archivos**: `kebab-case.tsx` para pantallas, `camelCase.ts` para hooks/types
- **Componentes**: `PascalCase`
- **Hooks**: `use<Nombre>` (ej. `useEnvironments`)
- **Tipos**: `PascalCase` interfaces (ej. `Environment`, `Ficha`)

## Reglas

1. **NUNCA usar colores hexadecimales directamente** — usar `Colors` o `useTheme()`
2. **NUNCA escribir strings de ruta** — usar `Routes.*`
3. **NUNCA hardcodear textos** — usar `t('clave.i18n')`
4. **Imports**: usar alias `@/` para rutas absolutas
5. **Estado**: hooks personalizados en `features/`, estado local en componentes
6. **Componentes UI reutilizables**: en `shared/components/ui/`
