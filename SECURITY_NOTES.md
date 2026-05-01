# 🔒 Notas de Seguridad - El Pastorcito WiFi Portal

## Cambios Implementados

### 1. Rate Limiting en Login ✅
- **Ubicación**: `netlify/functions/admin.mjs`
- **Implementación**: Máximo 5 intentos por hora por dirección IP
- **Estado**: Activo desde el deploy

### 2. Validación de Variables de Entorno ✅
- **Ubicación**: `src/supabase.js`
- **Implementación**: Error explícito si faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY
- **Estado**: Activo

### 3. CORS Configurable ✅
- **Ubicación**: `netlify/functions/admin.mjs`
- **Implementación**: Variable `ALLOWED_ORIGIN` opcional en variables de entorno
- **Recomendación**: Configurar en Netlify: `ALLOWED_ORIGIN=https://tu-dominio.netlify.app`

## ⚠️ ACCIONES REQUERIDAS (Prioridad Alta)

### 1. Cambiar Contraseña por Defecto INMEDIATAMENTE
```sql
-- Ejecutar en Supabase SQL Editor después del deploy
UPDATE config 
SET value = 'tu_contraseña_segura_aqui' 
WHERE key = 'admin_password';
```

**Contraseña segura recomendada**: Mínimo 16 caracteres, mayúsculas, minúsculas, números y símbolos.

### 2. Configurar ALLOWED_ORIGIN en Netlify
Ir a Site Settings → Environment Variables y agregar:
```
ALLOWED_ORIGIN=https://tu-dominio-personalizado.com
```

### 3. Hashear Contraseñas (Pendiente - Requiere Aprobación)
Actualmente las contraseñas están en texto plano en la BD. Se recomienda:
- Implementar bcrypt en la Netlify Function
- Crear script de migración para hashear contraseñas existentes
- Actualizar el login para comparar hashes

**Nota**: Esta mejora requiere cambios adicionales. ¿Querés que los implemente?

## 📋 Checklist de Seguridad Post-Deploy

- [ ] Cambiar contraseña admin por defecto
- [ ] Configurar ALLOWED_ORIGIN en Netlify
- [ ] Verificar que el bucket `images` en Supabase sea público solo para lectura
- [ ] Revisar logs de Netlify Functions periódicamente
- [ ] Monitorear intentos de login fallidos (código 429 en logs)

## 🔍 Cómo Monitorear Intentos de Ataque

En Netlify Dashboard → Functions → Logs, buscar:
- Status 429: Intentos de brute force bloqueados
- Múltiples 401: Credenciales incorrectas

## 📞 Contacto de Emergencia

Si detectás actividad sospechosa:
1. Cambiar inmediatamente la contraseña en Supabase
2. Revisar logs de acceso
3. Considerar habilitar autenticación de dos factores (pendiente de implementación)
