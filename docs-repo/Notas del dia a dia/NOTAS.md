# MODULO 1     ----- (ACCESO AL SISTEMA )
# ¿Dónde estamos ahora mismo? (Checklist real)

- ✅ **Login funcionando completo** (todas las capas de arriba, para login).
- ✅ **Sidebar mostrando datos del usuario** sin romperse.
- ✅ **Inicio de sesión y definición de rol** sin romperse.
- ✅ **Registro de usuario nuevo** (estábamos empezando esto cuando te perdiste).
- ✅ **Derechos de acceso y aceptación de términos** 

- ✅ **Consentimiento de acudiente** (menores de edad).
- ✅ **Verificación de email con código**.
- 🔲 **Restablecimiento de contraseña** 



------------------------------
-------------------------

## 17 julio 
## Unificación registro + términos
- Antes: 2 llamadas separadas (register → aceptar-terminos)
- Ahora: register() hace ambas cosas en una sola transacción
- RegisterRequestDTO ganó el campo `accepted: boolean`
- RegisterServiceImpl reutiliza AcceptanceTermsRepository (ya existía)
- No se tocó ningún esquema de BD, solo se conectó lo que ya existía

-------------------------------------
------------------------

## 18 julio 
## Se puede realizar el Consentimiento de acudiente
- Falta por validar algunas pantallas que salen error
- ya se pueden registrar menores y mayores de edad 
- ya se puede registrar el acudiente 
- OJO FALTA  VALIDAR QUE NO FALLE POR QUE A VECES FALLA