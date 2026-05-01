-- ============================================
-- CONFIGURACIÓN DE CREDENCIALES DE ADMIN
-- ============================================
-- Ejecuta este script en el SQL Editor de Supabase
-- para configurar o actualizar las credenciales del admin

-- 1. Verificar si existen las claves de configuración
SELECT key, value FROM config WHERE key IN ('admin_user', 'admin_password');

-- 2. Insertar o actualizar usuario admin (por defecto: "admin")
INSERT INTO config (key, value) 
VALUES ('admin_user', 'admin')
ON CONFLICT (key) DO UPDATE SET value = 'admin';

-- 3. Insertar o actualizar contraseña admin 
-- ¡CAMBIA 'admin123' POR UNA CONTRASEÑA SEGURA!
INSERT INTO config (key, value) 
VALUES ('admin_password', 'admin123')
ON CONFLICT (key) DO UPDATE SET value = 'admin123';

-- 4. Verificar configuración final
SELECT key, value FROM config WHERE key IN ('admin_user', 'admin_password');

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. CAMBIA la contraseña 'admin123' por una segura
-- 2. Las contraseñas se guardan en texto plano (mejora futura: hashearlas)
-- 3. El usuario por defecto es 'admin'
-- 4. Después de ejecutar esto, usa esas credenciales para login
