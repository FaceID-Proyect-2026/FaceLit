# Frontend documentation inventory

Scope: HU-MEJ-016 QA corrections, 2026-10-25. Owner: HU-MEJ-016 assignee for cleanup, setup and evidence. Detailed design-record reconciliation is a HU-MEJ-018 dependency; its owner must be assigned by the team.

| Original path | Current destination | Decision |
| --- | --- | --- |
| `INSTRUCCIONES.txt` | [INSTRUCCIONES.txt](../INSTRUCCIONES.txt) | Replace obsolete setup, sample credentials and fixed verification code with current README pointer |
| `Instrucciones.md` | [frontend-implementation-notes.md](historical/frontend-implementation-notes.md) | Preserve narrative as explicitly historical; keep original entry as pointer |
| `README.md` | [README.md](../README.md) | Update current setup/index against package.json |
| `docs-repo/Notas del dia a dia/Las capas ( Frond - Backend).md` | [Las capas ( Frond - Backend).md](../docs-repo/Notas%20del%20dia%20a%20dia/Las%20capas%20%28%20Frond%20-%20Backend%29.md) | Retain; detailed content review assigned to HU-MEJ-018 |
| `docs-repo/Notas del dia a dia/NOTAS.md` | [NOTAS.md](../docs-repo/Notas%20del%20dia%20a%20dia/NOTAS.md) | Retain; detailed content review assigned to HU-MEJ-018 |
| `docs-repo/README.md` | [README.md](../docs-repo/README.md) | Update current setup/index against package.json |
| `docs-repo/RF_RNF_APRENDIZ.md` | [RF_RNF_APRENDIZ.md](../docs-repo/RF_RNF_APRENDIZ.md) | Retain; detailed content review assigned to HU-MEJ-018 |
| `docs-repo/architecture.md` | [architecture.md](../docs-repo/architecture.md) | Retain; detailed content review assigned to HU-MEJ-018 |
| `docs-repo/conventions.md` | [conventions.md](../docs-repo/conventions.md) | Retain; detailed content review assigned to HU-MEJ-018 |
| `docs-repo/i18n.md` | [i18n.md](../docs-repo/i18n.md) | Retain; detailed content review assigned to HU-MEJ-018 |
| `docs-repo/modules/HU-01.md` | [HU-01.md](../docs-repo/modules/HU-01.md) | Retain; detailed content review assigned to HU-MEJ-018 |
| `docs-repo/modules/HU-02.md` | [HU-02.md](../docs-repo/modules/HU-02.md) | Retain; detailed content review assigned to HU-MEJ-018 |
| `docs-repo/modules/HU-03.md` | [HU-03.md](../docs-repo/modules/HU-03.md) | Retain; detailed content review assigned to HU-MEJ-018 |
| `docs-repo/modules/HU-04.md` | [HU-04.md](../docs-repo/modules/HU-04.md) | Retain; detailed content review assigned to HU-MEJ-018 |
| `docs-repo/modules/HU-05.md` | [HU-05.md](../docs-repo/modules/HU-05.md) | Retain; detailed content review assigned to HU-MEJ-018 |
| `docs-repo/modules/HU-06.md` | [HU-06.md](../docs-repo/modules/HU-06.md) | Retain; detailed content review assigned to HU-MEJ-018 |
| `docs-repo/modules/HU-07.md` | [HU-07.md](../docs-repo/modules/HU-07.md) | Retain; detailed content review assigned to HU-MEJ-018 |
| `docs-repo/modules/HU-08.md` | [HU-08.md](../docs-repo/modules/HU-08.md) | Retain; detailed content review assigned to HU-MEJ-018 |
| `docs-repo/modules/HU-09.md` | [HU-09.md](../docs-repo/modules/HU-09.md) | Retain; detailed content review assigned to HU-MEJ-018 |
| `docs-repo/roles.md` | [roles.md](../docs-repo/roles.md) | Retain; detailed content review assigned to HU-MEJ-018 |
| `docs-repo/styles.md` | [styles.md](../docs-repo/styles.md) | Retain; detailed content review assigned to HU-MEJ-018 |
| `docs-repo/validation.md` | [validation.md](../docs-repo/validation.md) | Retain; detailed content review assigned to HU-MEJ-018 |
| `docs/media-assets.md` | [media-assets.md](media-assets.md) | Retain published asset URLs, hashes and existing playback evidence |
| `docs/mobile-entry-validation.md` | [mobile-entry-validation.md](mobile-entry-validation.md) | Retain; detailed content review assigned to HU-MEJ-018 |

Module HU records and daily notes stay in their existing locations to preserve team traceability. They are design/history material, not verified current route or feature contracts. Existing architecture, conventions, translation, role and style guides are retained; a full rewrite is not claimed by this cleanup. No screen, store, API adapter or translation file is changed.

The root README is the single operating entry. The historical frontend narrative retains its original payload after an English status notice. Old machine paths and dependency versions inside that record must not be used for installation.

The tracked .env is removed from the Git index only. The local file and its values are retained; .env.example lists public variable names with local placeholders. Deployment environment configuration and successful login still need verification with the environment owner. Removing .env does not remove previously committed objects or make EXPO_PUBLIC values private.

Related deliveries: [frontend PR #75](https://github.com/FaceID-Proyect-2026/FaceLit/pull/75) and [backend PR #66](https://github.com/FaceID-Proyect-2026/FaceLit-Backend/pull/66). Neither documentation changes nor local exports alone certify a production deployment.
