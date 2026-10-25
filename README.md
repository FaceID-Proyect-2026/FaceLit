# FaceLit frontend

FaceLit is the SENA academic attendance application. This repository contains the Expo Router web and mobile interface for apprentices, instructors and coordinators. The REST API, PostgreSQL migrations and facial embedding service are maintained in separate repositories.

## Requirements and versions

Use Node.js and npm compatible with the versions declared in [package.json](package.json) and the committed lockfile. The current manifest declares Expo ~57.0.25, React 19.2.3, React Native 0.86.3 and TypeScript ~6.0.3. Do not downgrade dependencies using historical setup notes.

## Local setup

1. Run `npm ci` from this repository to install the locked dependency tree.
2. Copy [.env.example](.env.example) to `.env` only if no local file exists. Set the API URLs for your environment; keep your existing local values when updating a checkout.
3. Start the configured backend and required facial service. Database migrations belong to FaceLit-DB.
4. Run `npm run web` for web, `npm run start:lan` for a device on the same network, or `npm start` for the tunnel workflow. Native builds use `npm run android` or `npm run ios` with their platform toolchains.

On a physical device, use reachable server addresses rather than the device's own localhost. URL resolution is implemented in [shared/constants/api.js](shared/constants/api.js). Login requires an account provisioned in the target environment; no shared test credentials are documented here.

## Public environment configuration

All EXPO_PUBLIC variables are visible in the delivered client. They are not a private secret store. The example preserves the existing variable names without copying local values. The legacy embedding API key field remains for compatibility; changing authentication or migrating that integration belongs to the security workstream.

`.env` and environment-specific variants are ignored. For a fresh CI or Vercel build, configure the required values in that environment before building; an ignored local file is not uploaded by Git. Restart Expo after changing environment values. Before accepting a deployment, verify login and the three tutorial videos against its configured services.

## Validation and build

- `npm run lint`: existing lint command.
- `npx expo export --platform web`: static web export to `dist/`.
- `npm run web`: interactive web verification.

An export is a build check, not proof of successful login or every application flow. The landing tutorials are public [release assets](https://github.com/FaceID-Proyect-2026/FaceLit/releases/tag/tutorial-media-v1), not tracked MP4 files. See [media maintenance and playback evidence](docs/media-assets.md).

## Structure and documentation

- `app/`: Expo Router screens and layouts.
- `features/`: feature hooks, stores, API adapters and components.
- `shared/`: shared UI, contexts, translations, configuration and services.
- `assets/`: application images, fonts and other bundled resources.
- [Documentation inventory](docs/documentation-inventory.md): current guides, preserved notes and HU-MEJ-018 follow-up.
- [Frontend architecture](docs-repo/architecture.md) and [translation guide](docs-repo/i18n.md).
- [Backend](https://github.com/FaceID-Proyect-2026/FaceLit-Backend), [database](https://github.com/FaceID-Proyect-2026/FaceLit-DB) and [facial service](https://github.com/FaceID-Proyect-2026/micro-facial).

Historical notes do not define current routes, implemented features or supported versions. Application source and manifests take precedence; this cleanup does not change application permissions or business logic.
