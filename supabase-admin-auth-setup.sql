-- ============================================
-- CONFIGURACIÓN DE ADMIN CON SUPABASE AUTH
-- ============================================
-- Este script debe ejecutarse DESPUÉS de supabase-setup.sql
-- Instrucciones:
-- 1. Ve a la UI de Supabase -> Authentication -> Users
-- 2. Click en "Add user" -> "Create new user"
-- 3. Ingresa tu email y contraseña segura
-- 4. Copia el UID del usuario creado
-- 5. Reemplaza 'TU_EMAIL' y 'TU_UID' abajo y ejecuta este script
-- ============================================

-- Insertar admin en la tabla admins (vinculado a auth.users)
-- REEMPLAZA ESTOS VALORES CON TU EMAIL Y UID DE SUPABASE:
INSERT INTO admins (id, email) 
VALUES (
  'TU_UID_AQUI', -- Ejemplo: 'a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8'
  'tu_email@ejemplo.com' -- Ejemplo: 'admin@elpastorcito.com.ar'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TRIGGER PARA LIMPIAR INTENTOS DE LOGIN VIEJOS
-- ============================================
-- (Opcional) Si querés implementar rate limiting persistente en BD

CREATE TABLE IF NOT EXISTS login_attempts (
  ip text NOT NULL,
  attempted_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip);
CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON login_attempts(attempted_at);

-- Función para limpiar intentos viejos (> 1 hora)
CREATE OR REPLACE FUNCTION clean_old_login_attempts()
RETURNS trigger AS $$
BEGIN
  DELETE FROM login_attempts WHERE attempted_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que limpia automáticamente cada cierto tiempo
-- (Se ejecuta cuando se insertan nuevos intentos)
CREATE TRIGGER trigger_clean_login_attempts
AFTER INSERT ON login_attempts
EXECUTE FUNCTION clean_old_login_attempts();

-- ============================================
-- FUNCIÓN PARA VERIFICAR SI UN USUARIO ES ADMIN
-- ============================================

CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admins WHERE id = user_id);
END;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- POLÍTICAS RLS ADICIONALES PARA TABLAS EXISTENTES
-- ============================================
-- Permitir que solo admins puedan hacer operaciones completas

-- Clients: Admins pueden leer todo
CREATE POLICY "Allow admins read all clients" ON clients
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- Menu: Admins pueden hacer CRUD completo
CREATE POLICY "Allow admins full menu" ON menu_items
  FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Social networks: Admins pueden hacer CRUD completo
CREATE POLICY "Allow admins full socials" ON social_networks
  FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Config: Admins pueden hacer CRUD completo (excepto leer todas las keys)
CREATE POLICY "Allow admins full config" ON config
  FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- ============================================
-- INSTRUCCIONES FINALES
-- ============================================
-- 1. Ejecutá este script en el SQL Editor de Supabase
-- 2. Reemplazá 'TU_UID_AQUI' y 'tu_email@ejemplo.com' con tus datos reales
-- 3. Para obtener el UID:
--    - Andá a Authentication -> Users en Supabase
--    - Creá un usuario nuevo o usá uno existente
--    - Copiá el "User ID (UUID)" que aparece en la lista
-- 4. El frontend ahora usará Supabase Auth para loguearse
-- 5. Las credenciales admin_user/admin_password en la tabla config YA NO SE USAN
