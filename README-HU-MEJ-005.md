# HU-05 / HU-MEJ-005 — Retirar secretos del frontend y proteger micro-facial

Responsable: **Mariana Valenzuela Penagos**. Rama: `hu-40-dev`.
Hallazgos: **H-03, H-15, H-48**. Plan de cierre: **punto 4**.

El cliente usa el interceptor JWT existente de [api.ts](shared/services/api.ts) para
registrar el rostro propio y validar vida a través del backend. La identidad y el
actor se resuelven en el servidor. Se conserva la autorización de reemplazo y el
timeout de 180 segundos. La asistencia sigue usando su endpoint de backend existente.

Se eliminaron las funciones sin consumidores de actualización y verificación directa
al microservicio. No se agregó un proxy genérico para leer, listar o borrar plantillas.
Las respuestas del servicio de registro contienen metadatos, sin vectores.

## Configuración y ejecución

Copiar [.env.example](.env.example) a `.env` y configurar únicamente la URL pública
del backend. El archivo local se retiró del índice y sus variantes se ignoran.
No agregar claves de servicio a variables públicas de Expo.

La configuración biométrica se define en los servidores. Reiniciar Metro con
`npx expo start --clear` y reconstruir las aplicaciones distribuidas para retirar
los valores de bundles anteriores. Retirar esos bundles del canal de distribución.

## Evidencia automatizada

- `node node_modules/typescript/bin/tsc --noEmit`: sin errores.
- `node scripts/test-hu005-facial-gateway.cjs`: contrato hacia backend, identidad
  no enviada, autorización conservada, vida y tratamiento de errores.
- Los cinco scripts de regresión anteriores pasan: acceso al registro, entrada,
  persistencia del período de asistencia, módulo de asistencia y traducciones.
- `git ls-files -- .env`: sin resultados; existe el ejemplo público.

Ver el informe consolidado de entrega en el repositorio FaceLit-Backend:
[INFORME-HU-MEJ-005.md](../FaceLit-Backend/INFORME-HU-MEJ-005.md).
