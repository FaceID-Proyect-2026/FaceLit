# Foto de perfil desde el registro facial

Antes de iniciar el backend, aplicar la migración de FaceLit-DB
`01_ddl/04_alter/010_face_profile_photo.sql` mediante Liquibase o ejecutar:

```sql
ALTER TABLE facialrecognition.user_face ADD COLUMN IF NOT EXISTS profile_photo BYTEA;
```

El backend tiene Liquibase desactivado: reiniciarlo no aplica la migración.

En web, el aprendiz captura una foto frontal JPEG de 320 × 320 durante la
secuencia. Solo se persiste cuando el registro completo pasa las validaciones,
en la misma transacción que el embedding. Perfil y menú consultan la foto con
la sesión autenticada mediante GET /api/facial/profile-photo.

Si ya existe un embedding pero no una foto, la sección permite repetir los
giros y compara la nueva muestra frontal con la plantilla guardada antes de
añadir la foto. Conserva el embedding original. Los embeddings no permiten
recuperar la fotografía del registro anterior.

Prueba manual: registrar un aprendiz, abrir Perfil, recargar e iniciar sesión
de nuevo; comprobar la persistencia de la foto. Probar también un registro
anterior sin foto y una secuencia incompleta (no debe guardar fotografía).
