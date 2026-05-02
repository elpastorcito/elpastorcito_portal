# 🐓 El Pastorcito Parripollo - WiFi Portal PWA

Captive portal WiFi con panel de administración para restaurantes.

## 📦 Stack
- React 18 + Vite
- Supabase (PostgreSQL + Storage)
- Netlify (hosting + serverless functions)

## 🚀 Deploy paso a paso

### 1. Supabase Setup
1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a SQL Editor → New query
3. Pegar todo el contenido de `supabase-setup.sql` y ejecutar
4. Ir a Storage → New bucket → Crear `Images` como **público** (importante: la 'I' debe ser mayúscula)
5. En Storage → Policies → Add policies para `Images`:
   - `anon` puede: `SELECT` (read)
   - `service_role` puede: `ALL` (full access)

### 2. Variables de entorno en Netlify
Ir a Site settings → Environment variables:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=tu-service-role-key
```

> ⚠️ **IMPORTANTE**: El `SERVICE_KEY` nunca va al frontend. Solo Netlify Functions lo usa.

### 3. Deploy
```bash
# Local (desarrollo)
npm install
npm run dev

# Build para producción
npm run build
```

Subir a Netlify:
- Conectar repo GitHub, o
- Drag & drop la carpeta `dist` después de `npm run build`

### 4. URLs
- **Portal cliente**: `https://tu-site.netlify.app`
- **Admin panel**: `https://tu-site.netlify.app?admin`

## 🔐 Primer acceso admin

El sistema ahora usa **Supabase Auth** para autenticación segura.

### Configurar tu usuario admin:

1. Ir a Supabase Dashboard → Authentication → Users
2. Click en "Add user" y crear un usuario con email y contraseña segura
3. Copiar el UID del usuario creado
4. Ejecutar este SQL en Supabase SQL Editor:

```sql
INSERT INTO admins (id, email) 
VALUES ('PEGAR_AQUI_EL_UID', 'tu_email@ejemplo.com');
```

5. Usar ese email y contraseña para ingresar al panel admin

> ⚠️ **IMPORTANTE**: El sistema legacy con `admin`/`admin123` ya no funciona. Ahora se requiere configurar un usuario real en Supabase Auth.

## 📁 Estructura
```
pastorcito-portal/
├── public/
│   └── manifest.json
├── src/
│   ├── main.jsx
│   ├── supabase.js      ← Cliente público + wrapper admin API
│   └── App.jsx          ← Toda la app (single file)
├── netlify/
│   └── functions/
│       └── admin.mjs ← Protege SERVICE_KEY
├── index.html
├── vite.config.js
├── package.json
├── netlify.toml
└── supabase-setup.sql
```

## ⚠️ Notas importantes

1. **Service Key**: Nunca expongas `SUPABASE_SERVICE_KEY` en el frontend. La Netlify Function `admin.mjs` es el único lugar que lo usa.

2. **WiFi real**: Esta app es un portal web. Para que funcione como captive portal real necesitás configurar tu router (MikroTik, Ubiquiti, OpenWRT) para redirigir a esta URL después de autenticar.

3. **PWA**: Agregá iconos reales en `public/icon-192.png` y `public/icon-512.png` para que funcione como app instalable.

4. **Imágenes**: Las imágenes se suben a Supabase Storage bucket `Images` (con 'I' mayúscula).

## 🎨 Personalización
Todo es configurable desde el panel admin (tab **🎨 Apariencia**):
- Nombre del local
- Slogan
- Logo
- Colores primario y secundario

Los cambios se aplican en tiempo real en el panel admin. El portal cliente los verá en el próximo acceso.
