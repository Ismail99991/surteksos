export interface Kartela {
  id: string
  renk_kodu: string
  musteri: string | null
  tip: 'ozel' | 'genel' | 'standart'
  durum: 'arsivde' | 'sef_masasinda' | 'uretimde' | 'kayip'
  mevcut_lokasyon: string | null
  son_erisim: Date | string
  olusturma_tarihi: Date | string
  sorumlu_kisi: string | null
  telefon: string | null
  notlar: string | null
  recete_no: string | null
}

export interface Hareket {
  id: string
  kartela_id: string
  renk_kodu: string
  islem: 'ALINDI' | 'VERILDI' | 'KAYIP' | 'BULUNDU'
  kullanici: string
  lokasyon: string | null
  aciklama: string | null
  tarih: Date | string
}

export interface SearchResult {
  kartela: Kartela
  hareketler: Hareket[]
  mesaj: string
}
