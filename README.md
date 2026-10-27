# FaceLit frontend

FaceLit is the SENA academic attendance application for apprentices, instructors and coordinators. This repository contains its Expo Router web and mobile interface. Academic data, accounts, attendance sessions and notifications are provided by the backend; PostgreSQL migrations and facial processing belong to separate repositories.

## Architecture and repository structure

The frontend keeps three logical layers: Expo Router entries and feature components
present the UI; feature hooks coordinate application flows; HTTP services and stores
provide external access and state. Large academic, attendance, facial and password
screens delegate to `features/*/screens`, `hooks` and `components`. Route URLs remain
the public boundary. `academicStore.ts` and `csvImport.ts` preserve their public
exports while separating state ownership, operations, parsing and preview rules.

Keep dependencies pointing from a view to its feature hook, then to services/state.
Feature hooks must not import their own screens. Reuse shared components and rules
instead of duplicating role-specific screens. The observer stores keep one state and
subscription lifecycle across the extracted operation modules.

```text
Expo Router screens -> feature hooks/stores -> API adapters -> FaceLit backend
                                |
                   shared UI, contexts and translations

app/                   Routes and role-specific layouts
features/              Authentication, academic, environment, facial,
                       attendance, notification and report features
shared/components/     Shared controls and layout
shared/contexts/       Authentication and theme state
shared/constants/      Routes, API configuration and platform media sources
shared/services/       HTTP adapters and token storage
shared/i18n/locales/   Spanish, English, German and French translations
assets/                Bundled application images and fonts
scripts/               Executable checks and development utilities
README.md              Single maintained documentation entry
```

Routes are centralized in [routes.ts](shared/constants/routes.ts). Backend HTTP calls use [api.js](shared/services/api.js), whose interceptor adds the stored JWT. Web token storage uses localStorage; native storage uses SecureStore. These are existing application behaviors, not a claim that every security finding has been closed.

Schedule management and schedule exceptions were removed from the project scope. Environment attendance sessions and their entry/exit times remain separate functionality. Unsupported environment mutations were left pending rather than backed by fabricated persistence; see the current environment API adapters and regression script for the supported operations. Historical design notes are not current feature contracts.

## Versions and prerequisites

[package.json](package.json) currently declares Expo `~57.0.25`, React `19.2.3`, React Native `0.86.3` and TypeScript `~6.0.3`. Use a compatible Node.js/npm environment and the committed [package-lock.json](package-lock.json). The documented platforms are Android and web. Android native builds also require the Android development toolchain.

The backend and its database must be available before testing authenticated flows. A real account must be provisioned through the project's current coordinator/CSV process; no shared password or fixed verification code is provided here.

## Install and run

From the repository root:

```bash
npm ci
```

Copy [.env.example](.env.example) to `.env` only when no local configuration exists. Preserve existing values when updating a checkout. Set addresses reachable from the browser/device, then use the existing scripts:

| Command | Purpose |
| --- | --- |
| `npm run web` | Web development server |
| `npm run start:lan` | Expo development over the local network |
| `npm start` | Existing tunnel workflow |
| `npm run android` | Android native development build |
| `npm run lint` | Existing Expo lint configuration |

On a physical device, localhost means the device itself. Address resolution and Android emulator handling are implemented in [shared/constants/api.js](shared/constants/api.js). Restart Expo after environment changes. The project-reset utility is not an installation or upgrade step.

## Public configuration and integration

| Variable in this branch | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Public backend base URL |
| `EXPO_PUBLIC_EMBEDDING_API_URL` | Legacy direct facial-service URL retained in this branch |
| `EXPO_PUBLIC_EMBEDDING_API_KEY` | Legacy client-visible field; the example contains no private value |

All `EXPO_PUBLIC_*` values are visible in delivered application code. Do not put a private service credential in them. The server-side facial gateway/security migration is a separate coordinated delivery; this README describes the checked-out code rather than silently claiming that migration is integrated.

`.env` and environment-specific variants are ignored; `.env.example` remains versioned. Configure the deployment's required public variables in its private build settings because an ignored local file is not sent by Git. The project owner identified `https://srv2068863.hstgr.cloud` as the deployment target. That declaration is not proof that this branch or its final commit is already deployed there.

## Entry behavior, appearance and translations

Desktop browsers display the landing page, including narrow desktop windows. Native devices and mobile/tablet browsers use the existing authentication entry logic. Initial rendering waits for device/session detection so the desktop landing is not flashed before a mobile redirect. Active sessions retain their role destination.

Use the shared components, theme context, route constants and `useTranslation()` rather than duplicating navigation or UI strings. Translation keys belong in all four files under `shared/i18n/locales/`. The quick language selector changes the current interface; profile settings use their existing backend save process for persisted account preferences.

## Tutorial media

The web landing loads public MP4 attachments from [Tutorial media v1](https://github.com/FaceID-Proyect-2026/FaceLit/releases/tag/tutorial-media-v1). The mapping is [roleVideoSources.web.ts](shared/constants/roleVideoSources.web.ts). Native cards use the empty [native mapping](shared/constants/roleVideoSources.ts), preserving their existing behavior without loading web-only tutorials.

| Role | Permanent asset | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| Apprentice | [apprentice.mp4](https://github.com/FaceID-Proyect-2026/FaceLit/releases/download/tutorial-media-v1/apprentice.mp4) | 53,670,957 | `6b5bb8a1d27481009ca44c8659382e2009f53e0571ad57f9be2085156fd87f62` |
| Coordinator | [coordinator.mp4](https://github.com/FaceID-Proyect-2026/FaceLit/releases/download/tutorial-media-v1/coordinator.mp4) | 101,579,381 | `c7e41eb3bf0b38bdbf169d2c0b1253417416500b82883749244ce84ed06d4238` |
| Instructor | [instructor.mp4](https://github.com/FaceID-Proyect-2026/FaceLit/releases/download/tutorial-media-v1/instructor.mp4) | 89,375,791 | `4e9f728f34c263bd77a185cbaf8d17a44bf438cbf380833cc9c2489e153c5c02` |

The original files total 244,626,129 bytes. They are no longer application source assets. The web player retains autoplay, mute, loop and inline playback. GitHub serves the attachments as downloads; actual playback must be checked in the target browser instead of inferred from HTTP accessibility alone.

To replace a video, publish a new tagged release, compare file hashes, update only its permanent source URL and verify playback before releasing the app. Keep assets referenced by existing releases available. Do not commit local MP4 copies; `/assets/videos/` is ignored. Existing Git history retains older blobs.

## Build and automated checks

```bash
npm test
npm run lint
npx --no-install tsc --noEmit
npx --no-install expo export --platform web --output-dir dist
node scripts/test-apprentice-attendance-state.cjs
node scripts/test-attendance-module-removal.cjs
node scripts/test-entry-platform.cjs
node scripts/test-facial-registration-access.cjs
node scripts/test-notification-i18n.cjs
```

These checks cover types, compilation, entry/platform logic, account-isolated attendance state, supported API-backed screens, facial-registration access and notification translations. They use controlled dependencies where applicable. A build or simulated test does not certify physical devices, PostgreSQL persistence, SMTP delivery or camera recognition.

`npm test` runs the five existing scripts and four Jest/Testing Library suites. Use `npm run test:scripts` or `npm run test:components` to run either group separately. The suites cover shared loading/error UI, the login hook, authentication/role guard hooks and Axios service contracts. Coverage reports are generated in `coverage/`, including `coverage/lcov-report/index.html`; they cover six selected source files rather than the whole application. Generated reports stay ignored.

The [CI workflow](.github/workflows/ci.yml) runs on pull requests and pushes to dev, qa and main, with optional manual dispatch. Its `Frontend tests and lint` job uses Node.js 22, `npm ci`, tests, TypeScript, lint and a web export. It checks out a pinned backend fixture for the notification script and uploads the `frontend-test-coverage` artifact. The existing facial registration callback dependency correction from dev is preserved without disabling lint rules.

Tests use controlled authentication, navigation and HTTP dependencies. Role-guard hook tests do not prove that layouts currently using the authentication-only guard enforce role restrictions. Authorization/ownership and recovery fixes remain coordinated responsibilities of HU-MEJ-001/HU-MEJ-002; CI automation from HU-MEJ-006 does not close those findings. Check the exact head's run, artifacts, required-check rules and independent review before acceptance; historical runs do not certify a newer commit.

For a static web deployment, serve `dist/` with HTTPS and routing compatible with Expo's exported paths. Set the backend URL before exporting. Do not use a development tunnel as the production hosting process.

## Release acceptance

Verify the exact delivered commit and its required checks. In the target deployment, check desktop landing, mobile entry, real login per role, all three tutorial videos, environment/attendance data and the coordinated facial flows. Keep private configuration and biometrics out of shared evidence. A successful Vercel build is not evidence of successful login or video playback.

All maintained explanatory documentation is consolidated in this README. Removed implementation notes and reports remain recoverable through Git history and the separately retained delivery archive. Runtime assets, tests, configuration examples and executable scripts remain in their functional locations.

Related repositories: [backend](https://github.com/FaceID-Proyect-2026/FaceLit-Backend), [database](https://github.com/FaceID-Proyect-2026/FaceLit-DB), [facial service](https://github.com/FaceID-Proyect-2026/micro-facial).
