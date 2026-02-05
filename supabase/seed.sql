-- Örnek veriler - Oda-Component ilişkileri
INSERT INTO odalar_components (oda_id, component_adi, component_yolu, sira_no, aktif, yonetici_gorebilir, icon_adi, aciklama) VALUES
-- Kartela Odası için
((SELECT id FROM odalar WHERE oda_kodu = 'KARTELA_ODASI' LIMIT 1), 
 'KartelaOdaDashboard', '@/components/kartela-odasi/KartelaOdaDashboard', 1, true, true, 'Package', 'Ana kartela dashboard'),

((SELECT id FROM odalar WHERE oda_kodu = 'KARTELA_ODASI' LIMIT 1), 
 'CreateKartelaForm', '@/components/kartela-odasi/CreateKartelaForm', 2, true, true, 'PlusCircle', 'Yeni kartela oluşturma formu'),

((SELECT id FROM odalar WHERE oda_kodu = 'KARTELA_ODASI' LIMIT 1), 
 'AssignToCustomer', '@/components/kartela-odasi/AssignToCustomer', 3, true, true, 'UserCheck', 'Kartela müşteri atama'),

-- Yönetici Odası için
((SELECT id FROM odalar WHERE oda_kodu = 'YONETICI_ODASI' LIMIT 1), 
 'YoneticiDashboard', '@/components/yonetici-odasi/YoneticiDashboard', 1, true, true, 'Shield', 'Sistem yönetim dashboard'),

((SELECT id FROM odalar WHERE oda_kodu = 'YONETICI_ODASI' LIMIT 1), 
 'KullaniciYonetimi', '@/components/yonetici-odasi/KullaniciYonetimi', 2, true, true, 'Users', 'Kullanıcı yönetimi'),

((SELECT id FROM odalar WHERE oda_kodu = 'YONETICI_ODASI' LIMIT 1), 
 'OdaYonetimi', '@/components/yonetici-odasi/OdaYonetimi', 3, true, true, 'Building', 'Oda yönetimi'),

((SELECT id FROM odalar WHERE oda_kodu = 'YONETICI_ODASI' LIMIT 1), 
 'YetkiYonetimi', '@/components/yonetici-odasi/YetkiYonetimi', 4, true, true, 'Key', 'Yetki yönetimi'),

-- Amir Odası için
((SELECT id FROM odalar WHERE oda_kodu = 'AMIR_ODASI' LIMIT 1), 
 'AmirRaporlari', '@/components/amir-odasi/AmirRaporlari', 1, true, true, 'BarChart3', 'Amir raporları'),

-- Lab Odası için
((SELECT id FROM odalar WHERE oda_kodu = 'LAB_ODASI' LIMIT 1), 
 'LabTestleri', '@/components/lab-odasi/LabTestleri', 1, true, true, 'FlaskConical', 'Laboratuvar testleri'),

-- Kalite Kontrol için
((SELECT id FROM odalar WHERE oda_kodu = 'KALITE_KONTROL' LIMIT 1), 
 'KaliteKontrolRaporlari', '@/components/kalite-kontrol/KaliteKontrolRaporlari', 1, true, true, 'CheckCircle', 'Kalite kontrol raporları')
ON CONFLICT (oda_id, component_adi) DO NOTHING;
