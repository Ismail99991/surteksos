export interface Lokasyon {
  oda: string;
  raf: string;
  hucre: string;
  tamAdres: string;
}

export interface Hareket {
  id: string;
  kartelaNo: string;
  hareketTipi: 'alindi' | 'iade' | 'transfer' | 'yaratildi';
  personel: {
    id: string;
    ad: string;
    unvan: string;
  };
  tarih: string;
  eskiLokasyon?: Lokasyon;
  yeniLokasyon: Lokasyon;
  not?: string;
}

export interface Kartela {
  id: string;
  kartelaNo: string; // 23011737.1
  renkKodu: string;  // 1737
  renkAdi: string;
  musteri?: string;
  tip: 'ozel' | 'genel' | 'standart';
  durum: 'aktif' | 'pasif' | 'arsivde' | 'kullanımda';
  mevcutLokasyon: Lokasyon;
  hareketGeçmişi: Hareket[];
  olusturmaTarihi: string;
  guncellemeTarihi: string;
  notlar?: string;
  receteNo?: string;
  kumasTipi?: string;
}
