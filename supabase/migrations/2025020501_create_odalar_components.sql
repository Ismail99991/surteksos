-- Oda-Component ilişkisi için yeni tablo
CREATE TABLE IF NOT EXISTS odalar_components (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  oda_id UUID REFERENCES odalar(id) ON DELETE CASCADE,
  component_adi VARCHAR(100) NOT NULL,
  component_yolu VARCHAR(255) NOT NULL,
  sira_no INTEGER DEFAULT 0,
  aktif BOOLEAN DEFAULT true,
  yonetici_gorebilir BOOLEAN DEFAULT true,
  gerekli_yetki VARCHAR(50),
  icon_adi VARCHAR(50),
  aciklama TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(oda_id, component_adi)
);

-- Index'ler
CREATE INDEX idx_odalar_components_oda_id ON odalar_components(oda_id);
CREATE INDEX idx_odalar_components_aktif ON odalar_components(aktif);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_odalar_components_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_odalar_components_updated_at
BEFORE UPDATE ON odalar_components
FOR EACH ROW
EXECUTE FUNCTION update_odalar_components_updated_at();
