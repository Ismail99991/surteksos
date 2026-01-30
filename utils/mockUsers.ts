// Mock kullanıcı verileri
export const mockUsers = [
  {
    id: 'USER-AHMET-001',
    ad: 'Ahmet Amir',
    unvan: 'Amir',
    odalar: ['Amir Odası', 'Kartela Odası', 'Üretim Alanı', 'Depo', 'Yönetici Odası'],
    yetkiler: ['tum_oda_giris', 'kartela_olustur', 'kartela_sifirla', 'rapor_al', 'yonetici_panel'],
    durum: 'aktif',
    sonGiris: '2024-01-25T14:30:00Z',
    barkod: 'USER-AHMET-001',
    sifre: 'ahmet123',
    eposta: 'ahmet@surteksos.com',
    telefon: '+90 555 111 2233'
  },
  {
    id: 'USER-MEHMET-001',
    ad: 'Mehmet Kartela',
    unvan: 'Kartela Sorumlusu',
    odalar: ['Kartela Odası', 'Depo'],
    yetkiler: ['kartela_olustur', 'kartela_sifirla', 'kartela_ara'],
    durum: 'aktif',
    sonGiris: '2024-01-25T10:15:00Z',
    barkod: 'USER-MEHMET-001',
    sifre: 'mehmet123',
    eposta: 'mehmet@surteksos.com',
    telefon: '+90 555 222 3344'
  },
  {
    id: 'USER-AYSE-001',
    ad: 'Ayşe Üretim',
    unvan: 'Üretim Sorumlusu',
    odalar: ['Üretim Alanı'],
    yetkiler: ['kartela_ara', 'uretim_kaydi'],
    durum: 'aktif',
    sonGiris: '2024-01-24T16:45:00Z',
    barkod: 'USER-AYSE-001',
    sifre: 'ayse123',
    eposta: 'ayse@surteksos.com',
    telefon: '+90 555 333 4455'
  },
  {
    id: 'USER-ALI-001',
    ad: 'Ali Depo',
    unvan: 'Depo Sorumlusu',
    odalar: ['Depo'],
    yetkiler: ['kartela_ara', 'depo_kaydi'],
    durum: 'pasif',
    sonGiris: '2024-01-20T09:30:00Z',
    barkod: 'USER-ALI-001',
    sifre: 'ali123',
    eposta: 'ali@surteksos.com',
    telefon: '+90 555 444 5566'
  },
  {
    id: 'USER-YONETICI-001',
    ad: 'Sistem Yöneticisi',
    unvan: 'Yönetici',
    odalar: ['Amir Odası', 'Kartela Odası', 'Üretim Alanı', 'Depo', 'Yönetici Odası'],
    yetkiler: ['tum_oda_giris', 'kullanici_yonet', 'yetki_ata', 'rapor_al', 'sistem_ayar', 'oda_olustur', 'kullanici_sil', 'log_goruntule', 'backup_al'],
    durum: 'aktif',
    sonGiris: '2024-01-25T08:00:00Z',
    barkod: 'USER-YONETICI-001',
    sifre: 'admin123',
    eposta: 'admin@surteksos.com',
    telefon: '+90 555 000 0001'
  },
  // YENİ: EMEL HANIM - Kalite Kontrol Sorumlusu
  {
    id: 'USER-EMEL-001',
    ad: 'Emel Kalite',
    unvan: 'Kalite Kontrol Sorumlusu',
    odalar: ['Kalite Kontrol Odası', 'Kartela Odası', 'Üretim Alanı'],
    yetkiler: [
      'kartela_ara',
      'kalite_onay',
      'renk_olustur',
      'renk_onay',
      'kalite_rapor',
      'arsiv_goruntule'
    ],
    durum: 'aktif',
    sonGiris: '2024-01-25T09:45:00Z',
    barkod: 'USER-EMEL-001',
    sifre: 'emel123',
    eposta: 'emel.kalite@surteksos.com',
    telefon: '+90 555 555 6677',
    aciklama: 'Kalite kontrol ve renk onay sorumlusu',
    uzmanlik: ['Renk kalibrasyonu', 'Kumaş testi', 'Kartela standardizasyonu']
  }
];

// Oda listesi (Kalite Kontrol Odası eklendi)
export const odalar = [
  'Amir Odası',
  'Kartela Odası',
  'Üretim Alanı',
  'Depo',
  'Yönetici Odası',
  'Kalite Kontrol Odası'  // YENİ
];

// Yetki listesi (Kalite yetkileri eklendi)
export const yetkiler = [
  // Temel Yetkiler
  { id: 'tum_oda_giris', ad: 'Tüm Odalara Giriş', aciklama: 'Tüm odalara erişim izni', kategori: 'temel' },
  { id: 'kartela_olustur', ad: 'Kartela Oluştur', aciklama: 'Yeni kartela oluşturabilir', kategori: 'kartela' },
  { id: 'kartela_sifirla', ad: 'Kartela Sıfırla', aciklama: 'Kartela sıfırlayabilir', kategori: 'kartela' },
  { id: 'kartela_ara', ad: 'Kartela Arama', aciklama: 'Kartela araması yapabilir', kategori: 'kartela' },
  { id: 'musteri_ata', ad: 'Müşteri Ata', aciklama: 'Kartelaya müşteri atayabilir', kategori: 'kartela' },
  
  // Kullanıcı Yönetimi
  { id: 'kullanici_yonet', ad: 'Kullanıcı Yönet', aciklama: 'Kullanıcı ekleyebilir/silebilir', kategori: 'kullanici' },
  { id: 'yetki_ata', ad: 'Yetki Ata', aciklama: 'Kullanıcılara yetki atayabilir', kategori: 'kullanici' },
  { id: 'kullanici_sil', ad: 'Kullanıcı Sil', aciklama: 'Kullanıcı hesabını silebilir', kategori: 'kullanici' },
  { id: 'sifre_sifirla', ad: 'Şifre Sıfırla', aciklama: 'Kullanıcı şifresini sıfırlayabilir', kategori: 'kullanici' },
  
  // Oda Yönetimi
  { id: 'oda_olustur', ad: 'Oda Oluştur', aciklama: 'Yeni oda oluşturabilir', kategori: 'oda' },
  { id: 'oda_duzenle', ad: 'Oda Düzenle', aciklama: 'Oda bilgilerini düzenleyebilir', kategori: 'oda' },
  { id: 'oda_sil', ad: 'Oda Sil', aciklama: 'Odayı silebilir', kategori: 'oda' },
  
  // Sistem Yönetimi
  { id: 'sistem_ayar', ad: 'Sistem Ayarları', aciklama: 'Sistem ayarlarını değiştirebilir', kategori: 'sistem' },
  { id: 'rapor_al', ad: 'Rapor Al', aciklama: 'Sistem raporları alabilir', kategori: 'sistem' },
  { id: 'log_goruntule', ad: 'Log Görüntüle', aciklama: 'Sistem loglarını görüntüleyebilir', kategori: 'sistem' },
  { id: 'backup_al', ad: 'Backup Al', aciklama: 'Sistem yedeği alabilir', kategori: 'sistem' },
  { id: 'yonetici_panel', ad: 'Yönetici Paneli', aciklama: 'Yönetici paneline erişebilir', kategori: 'sistem' },
  
  // Kalite Kontrol Yetkileri
  { id: 'kalite_onay', ad: 'Kalite Onay', aciklama: 'Renk kalitesini onaylayabilir', kategori: 'kalite' },
  { id: 'renk_olustur', ad: 'Renk Oluştur', aciklama: 'Yeni renk standardı oluşturabilir', kategori: 'kalite' },
  { id: 'renk_onay', ad: 'Renk Onay', aciklama: 'Renk uygunluğunu onaylayabilir', kategori: 'kalite' },
  { id: 'kalite_rapor', ad: 'Kalite Raporu', aciklama: 'Kalite raporları oluşturabilir', kategori: 'kalite' },
  { id: 'arsiv_goruntule', ad: 'Arşiv Görüntüle', aciklama: 'Kalite arşivini görüntüleyebilir', kategori: 'kalite' },
  
  // Operasyonel Yetkiler
  { id: 'uretim_kaydi', ad: 'Üretim Kaydı', aciklama: 'Üretim kaydı oluşturabilir', kategori: 'operasyon' },
  { id: 'depo_kaydi', ad: 'Depo Kaydı', aciklama: 'Depo kaydı oluşturabilir', kategori: 'operasyon' },
  { id: 'stok_yonet', ad: 'Stok Yönetimi', aciklama: 'Stok yönetimi yapabilir', kategori: 'operasyon' }
];

// Kullanıcı bulma fonksiyonu
export function findUserByBarkod(barkod: string) {
  return mockUsers.find(user => user.barkod === barkod);
}

// Odaya erişim kontrolü
export function checkRoomAccess(userId: string, roomName: string) {
  const user = mockUsers.find(u => u.id === userId);
  return user ? user.odalar.includes(roomName) : false;
}
