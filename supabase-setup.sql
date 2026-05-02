-- ============================================
-- EL PASTORCITO PARRIPOLLO - SUPABASE SETUP
-- ============================================
-- Este script configura toda la base de datos necesaria para el portal WiFi.
-- Ejecutar en el SQL Editor de Supabase.

-- 1. Tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  accepted_terms boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Índices para mejorar rendimiento en búsquedas
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email) WHERE email IS NOT NULL;

-- 2. Tabla de items del menú
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price > 0),
  category text,
  image_url text,
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Índices para menú
CREATE INDEX IF NOT EXISTS idx_menu_available ON menu_items(available);
CREATE INDEX IF NOT EXISTS idx_menu_category ON menu_items(category) WHERE category IS NOT NULL;

-- 3. Tabla de redes sociales
CREATE TABLE IF NOT EXISTS social_networks (
  id text PRIMARY KEY,
  name text NOT NULL,
  url text DEFAULT '',
  active boolean DEFAULT false,
  color text,
  sort_order int DEFAULT 0
);

-- 4. Tabla de configuración
CREATE TABLE IF NOT EXISTS config (
  key text PRIMARY KEY,
  value text
);

-- 5. Tabla de administradores (vinculada a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Índice para búsqueda por email
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- ============================================
-- SEED DATA
-- ============================================

-- Redes sociales
INSERT INTO social_networks (id, name, url, active, color, sort_order) VALUES
('fb', 'Facebook', '', false, '#1877F2', 1),
('ig', 'Instagram', '', false, '#E1306C', 2),
('tt', 'TikTok', '', false, '#000000', 3),
('wa', 'WhatsApp', '', false, '#25D366', 4)
ON CONFLICT (id) DO NOTHING;

-- Configuración inicial (sin contraseña - ahora se usa Supabase Auth)
INSERT INTO config (key, value) VALUES
('business_name', 'El Pastorcito Parripollo'),
('slogan', '🔥 Pollos a la parrilla · Empanadas · Platos'),
('logo_url', ''),
('color_primary', '#E85D04'),
('color_secondary', '#FAA307')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Políticas para clients: cualquiera puede insertar, solo admin puede leer todo
CREATE POLICY "Allow public insert" ON clients
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public read own" ON clients
  FOR SELECT TO anon USING (true);

-- Política para admins: solo usuarios autenticados pueden ver admins
CREATE POLICY "Allow authenticated read admins" ON admins
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow service insert admins" ON admins
  FOR INSERT TO service_role WITH CHECK (true);

-- Políticas para menu_items: lectura pública, admin full
CREATE POLICY "Allow public read menu" ON menu_items
  FOR SELECT TO anon USING (available = true);

-- Políticas para social_networks: lectura pública de activas
CREATE POLICY "Allow public read active socials" ON social_networks
  FOR SELECT TO anon USING (active = true);

-- Políticas para config: lectura pública de ciertas keys
CREATE POLICY "Allow public read config" ON config
  FOR SELECT TO anon USING (key IN ('business_name', 'slogan', 'logo_url', 'color_primary', 'color_secondary'));

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- IMPORTANTE: El nombre del bucket debe ser 'Images' (con 'I' mayúscula)
-- 1. Ir a Supabase Dashboard → Storage
-- 2. Click en "New bucket"
-- 3. Nombre: Images (exactamente así, con I mayúscula)
-- 4. Marcar como público
-- 5. Click en "Create bucket"
-- 6. Luego ir a Policies y agregar:
--    - Policy para anon: SELECT (read)
--    - Policy para service_role: ALL (full access)
