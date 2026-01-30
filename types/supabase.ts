export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Tables = {
  kartelalar: {
    Row: {
      id: number
      kartela_no: string
      renk_kodu: string
      renk_adi: string
      durum: string
      goz_sayisi: number
      maksimum_goz: number
      goz_dolum_orani: number
      musteri_adi: string | null
      proje_kodu: string | null
      rpt_calismasi: string | null
      hucre_id: number | null
      hucre_kodu: string | null
      toplam_kullanim_sayisi: number
      son_kullanim_tarihi: string | null
      son_kullanan_kullanici_id: number | null
      olusturan_kullanici_id: number | null
      olusturulma_tarihi: string
      arsive_alma_tarihi: string | null
      arsive_alan_kullanici_id: number | null
      silindi: boolean
      silinme_tarihi: string | null
      silen_kullanici_id: number | null
    }
  }
  renk_masalari: {
    Row: {
      id: number
      renk_kodu: string
      renk_adi: string
      pantone_kodu: string | null
      hex_kodu: string | null
      lab_giris_tarihi: string | null
      lab_giren_kullanici_id: number | null
      aktif: boolean
      olusturulma_tarihi: string
    }
  }
  hucreler: {
    Row: {
      id: number
      hucre_kodu: string
      hucre_adi: string
      raf_id: number
      renk_no_baslangic: number
      renk_no_bitis: number
      kapasite: number
      mevcut_kartela_sayisi: number
      qr_kodu: string | null
      aktif: boolean
      olusturulma_tarihi: string
    }
  }
}

export type Database = {
  public: {
    Tables: Tables
  }
}

// PostgREST response type için
export type PostgrestResponse<T> = {
  data: T
  error: Error | null
  count: number | null
  status: number
  statusText: string
}
