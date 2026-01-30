import { Kartela, Lokasyon } from '@/types/kartela';
import { mockUsers } from './mockUsers';

// Mock lokasyonlar (TÜM ODALAR DAHİL)
export const mockLokasyonlar: Record<string, Lokasyon> = {
  'KARTELA-ODA-001-A1': {
    oda: 'Kartela Odası',
    raf: 'A Rafı',
    hucre: 'A1',
    tamAdres: 'Kartela Odası - A Rafı - A1'
  },
  'KARTELA-ODA-001-B3': {
    oda: 'Kartela Odası',
    raf: 'B Rafı',
    hucre: 'B3',
    tamAdres: 'Kartela Odası - B Rafı - B3'
  },
  'URETIM-ALAN-001-C2': {
    oda: 'Üretim Alanı',
    raf: 'C Rafı',
    hucre: 'C2',
    tamAdres: 'Üretim Alanı - C Rafı - C2'
  },
  'AMIR-ODA-001-D1': {
    oda: 'Amir Odası',
    raf: 'D Rafı',
    hucre: 'D1',
    tamAdres: 'Amir Odası - D Rafı - D1'
  },
  'DEPO-001-E4': {
    oda: 'Depo',
    raf: 'E Rafı',
    hucre: 'E4',
    tamAdres: 'Depo - E Rafı - E4'
  },
  'YONETICI-ODA-001-F1': {
    oda: 'Yönetici Odası',
    raf: 'F Rafı',
    hucre: 'F1',
    tamAdres: 'Yönetici Odası - F Rafı - F1'
  },
  'KALITE-ODA-001-G2': {
    oda: 'Kalite Kontrol Odası',
    raf: 'G Rafı',
    hucre: 'G2',
    tamAdres: 'Kalite Kontrol Odası - G Rafı - G2'
  }
};

// Mock personeller - mockUsers'dan al
const mockPersoneller = mockUsers.map(user => ({
  id: user.id,
  ad: user.ad,
  unvan: user.unvan
}));

// Mock hareket geçmişi oluşturma
function hareketOlustur(
  kartelaNo: string,
  hareketTipi: 'alindi' | 'iade' | 'transfer' | 'yaratildi',
  personelIndex: number,
  yeniLokasyonKey: string,
  eskiLokasyonKey?: string,
  not?: string
) {
  return {
    id: `hareket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    kartelaNo,
    hareketTipi,
    personel: mockPersoneller[personelIndex],
    tarih: new Date().toISOString(),
    eskiLokasyon: eskiLokasyonKey ? mockLokasyonlar[eskiLokasyonKey] : undefined,
    yeniLokasyon: mockLokasyonlar[yeniLokasyonKey],
    not
  };
}

// Mock kartelalar
export const mockKartelalar: Kartela[] = [
  {
    id: '1',
    kartelaNo: '23011737.1',
    renkKodu: '1737',
    renkAdi: 'Siyah',
    musteri: 'Nike',
    tip: 'ozel',
    durum: 'aktif',
    mevcutLokasyon: mockLokasyonlar['KARTELA-ODA-001-A1'],
    hareketGeçmişi: [
      hareketOlustur('23011737.1', 'yaratildi', 1, 'KARTELA-ODA-001-A1', undefined, 'Yeni kartela oluşturuldu'),
      hareketOlustur('23011737.1', 'alindi', 2, 'URETIM-ALAN-001-C2', 'KARTELA-ODA-001-A1', 'Üretim için alındı'),
      hareketOlustur('23011737.1', 'iade', 2, 'KARTELA-ODA-001-B3', 'URETIM-ALAN-001-C2', 'Üretim tamamlandı, iade edildi')
    ],
    olusturmaTarihi: '2024-01-15T10:30:00Z',
    guncellemeTarihi: '2024-01-25T14:20:00Z',
    notlar: 'Premium siyah renk',
    receteNo: 'REC-2024-001',
    kumasTipi: 'Pamuk 100%'
  },
  {
    id: '2',
    kartelaNo: '23011892.1',
    renkKodu: '1892',
    renkAdi: 'Beyaz',
    musteri: 'Zara',
    tip: 'ozel',
    durum: 'aktif',
    mevcutLokasyon: mockLokasyonlar['KARTELA-ODA-001-B3'],
    hareketGeçmişi: [
      hareketOlustur('23011892.1', 'yaratildi', 1, 'KARTELA-ODA-001-A1', undefined, 'Yeni kartela oluşturuldu'),
      hareketOlustur('23011892.1', 'alindi', 0, 'AMIR-ODA-001-D1', 'KARTELA-ODA-001-A1', 'Amir kontrolü için alındı'),
      hareketOlustur('23011892.1', 'iade', 0, 'KARTELA-ODA-001-B3', 'AMIR-ODA-001-D1', 'Kontrol tamamlandı')
    ],
    olusturmaTarihi: '2024-01-16T09:15:00Z',
    guncellemeTarihi: '2024-01-24T16:45:00Z'
  },
  {
    id: '3',
    kartelaNo: '23011543.2',
    renkKodu: '1543',
    renkAdi: 'Kırmızı',
    musteri: 'LC Waikiki',
    tip: 'ozel',
    durum: 'kullanımda',
    mevcutLokasyon: mockLokasyonlar['URETIM-ALAN-001-C2'],
    hareketGeçmişi: [
      hareketOlustur('23011543.2', 'yaratildi', 1, 'KARTELA-ODA-001-A1', undefined, 'Yeni kartela oluşturuldu'),
      hareketOlustur('23011543.2', 'alindi', 2, 'URETIM-ALAN-001-C2', 'KARTELA-ODA-001-A1', 'Aktif üretimde kullanılıyor')
    ],
    olusturmaTarihi: '2024-01-10T14:20:00Z',
    guncellemeTarihi: '2024-01-23T11:30:00Z',
    notlar: 'Canlı kırmızı - Özel sipariş'
  },
  {
    id: '4',
    kartelaNo: '23011208.1',
    renkKodu: '1208',
    renkAdi: 'Mavi',
    tip: 'genel',
    durum: 'aktif',
    mevcutLokasyon: mockLokasyonlar['DEPO-001-E4'],
    hareketGeçmişi: [
      hareketOlustur('23011208.1', 'yaratildi', 1, 'KARTELA-ODA-001-B3', undefined, 'Genel kullanım kartelası'),
      hareketOlustur('23011208.1', 'transfer', 3, 'DEPO-001-E4', 'KARTELA-ODA-001-B3', 'Depoya transfer edildi')
    ],
    olusturmaTarihi: '2024-01-18T13:45:00Z',
    guncellemeTarihi: '2024-01-22T10:15:00Z'
  },
  {
    id: '5',
    kartelaNo: '23011999.1',
    renkKodu: '1999',
    renkAdi: 'Sarı',
    musteri: 'Mavi',
    tip: 'ozel',
    durum: 'arsivde',
    mevcutLokasyon: mockLokasyonlar['KARTELA-ODA-001-A1'],
    hareketGeçmişi: [
      hareketOlustur('23011999.1', 'yaratildi', 1, 'KARTELA-ODA-001-A1', undefined, 'Yeni kartela oluşturuldu'),
      hareketOlustur('23011999.1', 'alindi', 0, 'AMIR-ODA-001-D1', 'KARTELA-ODA-001-A1', 'Arşivlenmek üzere alındı'),
      hareketOlustur('23011999.1', 'iade', 0, 'KARTELA-ODA-001-A1', 'AMIR-ODA-001-D1', 'Arşive kaldırıldı')
    ],
    olusturmaTarihi: '2024-01-20T16:30:00Z',
    guncellemeTarihi: '2024-01-21T09:45:00Z',
    notlar: 'Eski koleksiyon - Arşiv'
  }
];

// Kartela arama fonksiyonu
export function kartelaAra(query: string): Kartela[] {
  return mockKartelalar.filter(kartela => 
    kartela.renkKodu.includes(query) ||
    kartela.kartelaNo.includes(query) ||
    kartela.renkAdi.toLowerCase().includes(query.toLowerCase()) ||
    (kartela.musteri && kartela.musteri.toLowerCase().includes(query.toLowerCase()))
  );
}
