-- ============================================
-- EL PASTORCITO PARRIPOLLO - SUPABASE SETUP
-- ============================================

-- 1. Tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  accepted_terms boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. Tabla de items del menú
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  category text,
  image_url text,
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

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

-- Configuración inicial
INSERT INTO config (key, value) VALUES
('business_name', 'El Pastorcito Parripollo'),
('slogan', '🔥 Pollos a la parrilla · Empanadas · Platos'),
('logo_url', ''),
('color_primary', '#E85D04'),
('color_secondary', '#FAA307'),
('admin_user', 'admin'),
('admin_password', 'admin123')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Políticas para clients: cualquiera puede insertar, solo admin puede leer todo
CREATE POLICY "Allow public insert" ON clients
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public read own" ON clients
  FOR SELECT TO anon USING (true);

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
-- Crear bucket 'images' desde la UI de Supabase Storage
-- Configurar como público y permitir uploads anonimos para la carpeta menu/
-- O crear políticas de storage apropiadas
