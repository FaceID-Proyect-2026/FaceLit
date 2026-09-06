# FaceLit — Documentación del Frontend

> **Versión:** 1.0 | **Fecha:** Julio 2026  
> **Repositorio:** [FaceLit en GitHub](https://github.com/FaceID-Proyect-2026/FaceLit)

## Resumen General

FaceLit es un sistema inteligente de registro y control de asistencia académica mediante reconocimiento facial para el SENA. La aplicación usa arquitectura híbrida **React 19 + React Native + Spring Boot** y está diseñada para ser responsive (web y Android).

### Stack Tecnológico

- **Lenguaje:** TypeScript sobre JavaScript
- **Framework:** React Native 0.81 + Expo SDK 54
- **Navegación:** Expo Router (file-based routing)
- **UI:** StyleSheet de React Native + expo-linear-gradient + Ionicons
- **i18n:** i18next + react-i18next (4 idiomas: ES, EN, DE, FR)
- **Estado:** Hooks + Context API (AuthContext, ThemeContext)

### Cómo Ejecutar

```bash
cd FaceLit-fixed
npm install
npx expo start --web
```

Para Android: `npx expo start --android` (requiere emulador o dispositivo)
