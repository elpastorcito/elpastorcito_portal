# 🔧 Guía de Configuración y Solución de Problemas

## 🚨 PROBLEMA: "Usuario o contraseña incorrectos"

### Causa Principal
Las credenciales de administrador se guardan en la tabla `config` de Supabase, pero es posible que no estén configuradas correctamente.

### ✅ SOLUCIÓN PASO A PASO

#### Paso 1: Configurar credenciales en Supabase

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Abre el **SQL Editor** (en el menú izquierdo)
3. Copia y ejecuta el contenido del archivo `supabase-admin-setup.sql`:

```sql
-- Verificar si existen las credenciales
SELECT key, value FROM config WHERE key IN ('admin_user', 'admin_password');

-- Insertar/actualizar usuario admin
INSERT INTO config (key, value) 
VALUES ('admin_user', 'admin')
ON CONFLICT (key) DO UPDATE SET value = 'admin';

-- Insertar/actualizar contraseña (¡CAMBIALA POR UNA SEGURA!)
INSERT INTO config (key, value) 
VALUES ('admin_password', 'admin123')
ON CONFLICT (key) DO UPDATE SET value = 'admin123';

-- Verificar configuración final
SELECT key, value FROM config WHERE key IN ('admin_user', 'admin_password');
```

4. **¡IMPORTANTE!** Cambia `'admin123'` por una contraseña segura antes de ejecutar

#### Paso 2: Verificar variables de entorno en Netlify

1. Ve a [Netlify Dashboard](https://app.netlify.com)
2. Selecciona tu sitio
3. Ve a **Site settings** → **Environment variables**
4. Agrega estas variables (si no existen):

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://tu-proyecto.supabase.co` |
| `SUPABASE_SERVICE_KEY` | `tu-service-role-key` (la encuentras en Supabase → Settings → API) |
| `ALLOWED_ORIGIN` | `https://tu-sitio.netlify.app` (opcional, para CORS) |

#### Paso 3: Verificar variables de entorno locales (desarrollo)

Crea un archivo `.env` en la raíz del proyecto con:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=tu-service-role-key-secreta
```

#### Paso 4: Redeploy en Netlify

Después de configurar las variables de entorno:

1. Ve a Netlify Dashboard → Tu sitio
2. **Deploys** tab
3. Click en **Trigger deploy** → **Deploy site**

---

## 🔐 NUEVA FUNCIONALIDAD: Ver contraseña

Ahora puedes ver la contraseña mientras la escribes:

- Haz click en el ícono 👁️ dentro del campo de contraseña
- El ícono cambiará a 🙈 cuando la contraseña sea visible
- Haz click nuevamente para ocultarla

---

## 📋 Credenciales por Defecto

| Campo | Valor |
|-------|-------|
| Usuario | `admin` |
| Contraseña | `admin123` (¡cámbiala!) |

---

## 🛠️ Debugging Adicional

### Ver logs de Netlify Functions

1. Netlify Dashboard → Tu sitio
2. **Functions** → Selecciona `admin`
3. Revisa los logs para ver errores detallados

### Ver consola del navegador

1. Abre tu sitio en Chrome/Firefox
2. Presiona F12 para abrir DevTools
3. Ve a la pestaña **Console**
4. Intenta hacer login y revisa los errores

### Verificar conexión a Supabase

Ejecuta esto en la consola del navegador:

```javascript
fetch('/api/admin/config-all')
  .then(r => r.json())
  .then(d => console.log('Config:', d))
  .catch(e => console.error('Error:', e))
```

---

## ❓ Problemas Comunes

### "Error de conexión. Verifica tu configuración."

**Causa:** Las Netlify Functions no pueden conectarse a Supabase

**Solución:**
1. Verifica que `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` estén configuradas en Netlify
2. Asegúrate de que la URL sea correcta (sin typos)
3. Verifica que el Service Role Key sea el correcto

### Rate Limiting (Demasiados intentos)

El sistema limita a **5 intentos por hora** por IP para seguridad.

**Solución:** Espera 1 hora o intenta desde otra IP/red.

### CORS Error

**Causa:** El origen no está permitido

**Solución:** Agrega la variable `ALLOWED_ORIGIN` en Netlify con tu dominio completo.

---

## 📞 Soporte

Si después de seguir estos pasos el problema persiste:

1. Revisa los logs de Netlify Functions
2. Verifica que la tabla `config` exista en Supabase
3. Confirma que las credenciales estén guardadas correctamente
4. Revisa la consola del navegador para errores específicos
