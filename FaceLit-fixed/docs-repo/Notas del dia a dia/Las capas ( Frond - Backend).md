# ¿Por qué y qué es cada cosa?

## La idea central (esto es lo único que hay que tener clarísimo)

Tu app tiene dos partes que **no se conocen entre sí por defecto**:

- **Backend (Spring Boot):** tiene la información real — usuarios, contraseñas, roles, base de datos. Vive en tu PC, puerto **8080**.
- **Frontend (Expo/React Native):** es lo que la persona ve y toca — botones, formularios, pantallas. No sabe nada de la base de datos, no puede validar nada por sí solo.

Para que funcionen juntos, el frontend tiene que pedirle cosas al backend por internet (aunque sea localhost) y esperar su respuesta. Eso se llama **petición HTTP**.

Todo lo que hemos hecho hasta ahora es construir el **"cablecito"** que conecta ambos mundos, y organizarlo en capas para que no sea un caos.

---

# Las capas que armamos, explicadas una por una

Piensa en esto como una cadena de responsabilidades, donde cada archivo tiene un solo trabajo:

```text
Pantalla (login.tsx)
   ↓ usa
Hook del formulario (useLoginForm.ts)
   ↓ usa
Contexto de autenticación (AuthContext.tsx)
   ↓ usa
Cliente HTTP (api.js)
   ↓ usa
Guardado del token (tokenStorage.js)
   ↓ le habla a
BACKEND (Spring Boot, puerto 8080)
```

## 1. `shared/services/api.js` — "el teléfono"

Es solo la configuración de cómo llamar al backend: la URL base (`http://localhost:8080`), y una regla automática que dice **"si tengo un token guardado, mándalo en cada llamada"**.

No sabe nada de login, ni de registro, ni de nada específico — solo sabe cómo marcar el teléfono.

---

## 2. `shared/services/tokenStorage.js` — "la caja fuerte"

Guarda el token (la credencial que prueba que ya iniciaste sesión) en el dispositivo.

Nada más.

No llama al backend, no valida nada — solo guarda y devuelve un texto.

---

## 3. `shared/services/authService.js` — "el traductor de auth"

Aquí están las funciones específicas:

- `login()`
- `registerUser()`
- `verifyEmail()`

Cada una sabe qué URL exacta del backend llamar y qué forma de datos mandar.

Usa el **"teléfono" (`api.js`)** para hacer la llamada real.

---

## 4. `shared/contexts/AuthContext.tsx` — "la memoria compartida de toda la app"

Esto es un **Context de React** — una forma de que cualquier pantalla de tu app (sidebar, login, perfil, donde sea) sepa **"¿quién está conectado ahora mismo?"** sin tener que pasarse esa información manualmente de pantalla en pantalla.

Aquí vive el **user actual**, y las funciones **`login()`** y **`logout()`** que cualquier parte de la app puede usar.

---

## 5. `features/auth/hooks/useLoginForm.ts` — "el cerebro del formulario"

Se encarga de:

- validar lo que el usuario escribe
- ¿el email tiene formato válido?
- ¿la contraseña es muy corta?
- mostrar errores

Y cuando todo está bien, llamar al **AuthContext** para hacer el login real.

---

## 6. `app/auth/login.tsx` — "la cara bonita"

Solo dibuja los inputs, botones, colores.

No tiene lógica de negocio — todo lo delega al hook.

---

# ¿Por qué tantas capas y no un solo archivo gigante?

Porque si mañana cambia algo (ejemplo: el backend cambia la URL del login, o quieren usar otra librería en vez de axios), solo tocas una capa, no todo el proyecto.

Esto se llama **"separación de responsabilidades"** — es una práctica estándar en programación profesional, no un capricho.