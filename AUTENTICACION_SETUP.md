# 🔐 Configuración de Autenticación con Supabase Auth

Este documento explica cómo configurar el sistema de login para administradores usando **email y UID de Supabase**.

## 📋 Resumen de Cambios

El sistema de autenticación ha sido actualizado para usar **Supabase Auth** en lugar de credenciales almacenadas en la base de datos. Ahora:

- ✅ Login con **email y contraseña** segura
- ✅ Validación por **UID de Supabase** 
- ✅ Tokens JWT para sesiones seguras
- ✅ Rate limiting persistente en base de datos
- ✅ Protección de endpoints con autenticación

---

## 🚀 Pasos de Configuración

### 1️⃣ Ejecutar Scripts SQL en Supabase

#### A. Primero ejecutá `supabase-setup.sql`

1. Andá al [Dashboard de Supabase](https://supabase.com)
2. Seleccioná tu proyecto
3. Andá a **SQL Editor** (en el menú lateral)
4. Creá un nuevo query
5. Copiá y pegá TODO el contenido de `supabase-setup.sql`
6. Hacé clic en **Run**

Esto creará:
- Tabla `admins` (vinculada a auth.users)
- Tabla `login_attempts` (para rate limiting)
- Función `is_admin()` 
- Índices para rendimiento
- Políticas RLS de seguridad

#### B. Después ejecutá `supabase-admin-auth-setup.sql`

1. En el mismo SQL Editor
2. Copiá y pegá el contenido de `supabase-admin-auth-setup.sql`
3. **IMPORTANTE**: Antes de ejecutar, reemplazá estos valores:
   ```sql
   INSERT INTO admins (id, email) 
   VALUES (
     'TU_UID_AQUI', -- ← Reemplazá con tu UID real
     'tu_email@ejemplo.com' -- ← Reemplazá con tu email real
   )
   ```

### 2️⃣ Crear Usuario Admin en Supabase Auth

1. Andá a **Authentication** → **Users** en Supabase
2. Clic en **"Add user"** → **"Create new user"**
3. Completá:
   - **Email**: Tu email de administrador
   - **Contraseña**: Una contraseña segura (mínimo 6 caracteres)
   - Desmarcar "Confirm email" si no querés verificar email
4. Clic en **"Create user"**
5. **Copiá el User ID (UUID)** que aparece en la lista (tiene este formato: `a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8`)

### 3️⃣ Registrar el Admin en la Tabla

Con el UID que copiaste, ejecutá este SQL en el editor:

```sql
INSERT INTO admins (id, email) 
VALUES (
  'PEGÁ_ACÁ_TU_UID_COPIADO',
  'el_mismo_email_que_usaste@ejemplo.com'
);
```

### 4️⃣ Configurar Variables de Entorno en Netlify

1. Andá a tu dashboard de **Netlify**
2. Seleccioná tu sitio
3. Andá a **Site settings** → **Environment variables**
4. Agregá estas variables:

| Variable | Valor |
|----------|-------|
| `SUPABASE_URL` | Tu URL de proyecto Supabase (ej: `https://xxxxx.supabase.co`) |
| `SUPABASE_SERVICE_KEY` | Tu service_role key (la encontrás en Supabase → Settings → API) |
| `ALLOWED_ORIGIN` | La URL de tu sitio (ej: `https://tupagina.netlify.app`) |

---

## 🔑 Cómo Usar el Login

### Para Ingresar al Panel Admin:

1. Abrí tu portal agregando `?admin` a la URL:
   ```
   https://tupagina.netlify.app/?admin
   ```

2. Ingresá tu **email** y **contraseña** de Supabase Auth

3. Si las credenciales son correctas Y tu usuario está en la tabla `admins`, vas a ingresar al panel

### Para Agregar Más Administradores:

1. Creá el usuario en Supabase Auth (paso 2)
2. Insertá el registro en la tabla `admins` (paso 3)

```sql
INSERT INTO admins (id, email) 
VALUES ('UID_DEL_NUEVO_ADMIN', 'nuevo@admin.com');
```

---

## 🛡️ Seguridad

- ✅ Las contraseñas se validan con Supabase Auth (hash seguro)
- ✅ Solo usuarios en la tabla `admins` pueden acceder
- ✅ Tokens JWT con expiración automática
- ✅ Rate limiting: máximo 5 intentos por hora por IP
- ✅ Todos los endpoints requieren autenticación

---

## 🧪 Testeo

Para probar que todo funciona:

1. **Login incorrecto**: Intentá con email/contraseña inválidos → Debería mostrar error
2. **Usuario no admin**: Creá un usuario en Auth pero NO lo agregues a la tabla `admins` → Debería rechazar el acceso
3. **Login correcto**: Usá tus credenciales → Deberías entrar al panel
4. **Rate limiting**: Intentá 6 veces seguidas con contraseña incorrecta → Debería bloquearte por 1 hora

---

## 📁 Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `src/supabase.js` | API ahora usa tokens JWT |
| `src/App.jsx` | Login con email/password, persistencia de sesión |
| `netlify/functions/admin.mjs` | Autenticación con Supabase Auth + validación por UID |
| `supabase-setup.sql` | Nueva tabla `admins` + índices + RLS |
| `supabase-admin-auth-setup.sql` | Script de configuración de admin |

---

## ❓ Solución de Problemas

### Error: "User is not an admin"
- Verificá que el usuario esté en la tabla `admins` con el UID correcto

### Error: "Email o contraseña incorrectos"
- Verificá en Supabase Auth que el usuario exista
- La contraseña debe tener al menos 6 caracteres

### Error: "Demasiados intentos"
- Esperá 1 hora o eliminá los registros de `login_attempts` para tu IP:
  ```sql
  DELETE FROM login_attempts WHERE ip = 'tu_ip';
  ```

### El login funciona pero los endpoints fallan
- Verificá que `SUPABASE_SERVICE_KEY` esté configurada en Netlify
- El token debe enviarse en el header `Authorization: Bearer <token>`

---

## 📞 Soporte

Si tenés problemas, revisá:
1. Logs de Netlify Functions (Deployments → Function logs)
2. Console del navegador (F12)
3. Logs de Supabase (Database → Query performance)
