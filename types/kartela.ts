export interface Kartela {
  id: string
  renk_kodu: string
  musteri: string | null
  tip: 'ozel' | 'genel' | 'standart'
  durum: 'arsivde' | 'sef_masasinda' | 'uretimde' | 'kayip'
  mevcut_lokasyon: string | null
  son_erisim: Date
  olusturma_tarihi: Date
  sorumlu_kisi: string | null
  telefon: string | null
  notlar: string | null
  recete_no: string | null
}
