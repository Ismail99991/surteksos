// types/supabase.ts - TÜM TÜRKÇE KARAKTERLER LATİNCE
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // 1. KULLANICILAR
      kullanicilar: {
        Row: {
          id: number
          kullanici_kodu: string
          ad: string
          soyad: string
          unvan: string | null
          departman: string | null
          qr_kodu: string | null
          sifre_hash: string
          aktif: boolean
          olusturulma_tarihi: string
        }
        Insert: {
          id?: number
          kullanici_kodu: string
          ad: string
          soyad: string
          unvan?: string | null
          departman?: string | null
          qr_kodu?: string | null
          sifre_hash?: string
          aktif?: boolean
          olusturulma_tarihi?: string
        }
        Update: {
          id?: number
          kullanici_kodu?: string
          ad?: string
          soyad?: string
          unvan?: string | null
          departman?: string | null
          qr_kodu?: string | null
          sifre_hash?: string
          aktif?: boolean
          olusturulma_tarihi?: string
        }
      }
      
      // 2. ODALAR
      odalar: {
        Row: {
          id: number
          oda_kodu: string
          oda_adi: string
          qr_kodu: string | null
          aktif: boolean
          olusturulma_tarihi: string
        }
        Insert: {
          id?: number
          oda_kodu: string
          oda_adi: string
          qr_kodu?: string | null
          aktif?: boolean
          olusturulma_tarihi?: string
        }
        Update: {
          id?: number
          oda_kodu?: string
          oda_adi?: string
          qr_kodu?: string | null
          aktif?: boolean
          olusturulma_tarihi?: string
        }
      }
      
      // 3. KULLANICI YETKILERI
      kullanici_yetkileri: {
        Row: {
          id: number
          kullanici_id: number
          oda_id: number
          kartela_olusturabilir: boolean | null
          kartela_silebilir: boolean | null
          rapor_gorebilir: boolean| null
          kullanici_yonetebilir: boolean | null
          raf_duzenleyebilir: boolean | null
        }
        Insert: {
          id?: number
          kullanici_id: number
          oda_id: number
          kartela_olusturabilir?: boolean | null
          kartela_silebilir?: boolean | null
          rapor_gorebilir?: boolean | null
          kullanici_yonetebilir?: boolean | null
          raf_duzenleyebilir?: boolean | null
        }
        Update: {
          id?: number
          kullanici_id?: number
          oda_id?: number
          kartela_olusturabilir?: boolean
          kartela_silebilir?: boolean
          rapor_gorebilir?: boolean
          kullanici_yonetebilir?: boolean
          raf_duzenleyebilir?: boolean
        }
      }
      
      // 4. RENK MASALARI
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
        Insert: {
          id?: number
          renk_kodu: string
          renk_adi: string
          pantone_kodu?: string | null
          hex_kodu?: string | null
          lab_giris_tarihi?: string | null
          lab_giren_kullanici_id?: number | null
          aktif?: boolean
          olusturulma_tarihi?: string
        }
        Update: {
          id?: number
          renk_kodu?: string
          renk_adi?: string
          pantone_kodu?: string | null
          hex_kodu?: string | null
          lab_giris_tarihi?: string | null
          lab_giren_kullanici_id?: number | null
          aktif?: boolean
          olusturulma_tarihi?: string
        }
      }
      
      // 5. RAFLAR
      raflar: {
        Row: {
          id: number
          raf_kodu: string
          raf_adi: string
          renk_no_baslangic: number
          renk_no_bitis: number
          oda_id: number
          aktif: boolean
          olusturulma_tarihi: string
        }
        Insert: {
          id?: number
          raf_kodu: string
          raf_adi: string
          renk_no_baslangic: number
          renk_no_bitis: number
          oda_id: number
          aktif?: boolean
          olusturulma_tarihi?: string
        }
        Update: {
          id?: number
          raf_kodu?: string
          raf_adi?: string
          renk_no_baslangic?: number
          renk_no_bitis?: number
          oda_id?: number
          aktif?: boolean
          olusturulma_tarihi?: string
        }
      }
      
      // 6. HUCRELER
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
        Insert: {
          id?: number
          hucre_kodu: string
          hucre_adi: string
          raf_id: number
          renk_no_baslangic: number
          renk_no_bitis: number
          kapasite: number
          mevcut_kartela_sayisi?: number
          qr_kodu?: string | null
          aktif?: boolean
          olusturulma_tarihi?: string
        }
        Update: {
          id?: number
          hucre_kodu?: string
          hucre_adi?: string
          raf_id?: number
          renk_no_baslangic?: number
          renk_no_bitis?: number
          kapasite?: number
          mevcut_kartela_sayisi?: number
          qr_kodu?: string | null
          aktif?: boolean
          olusturulma_tarihi?: string
        }
      }
      
      // 7. KARTELALAR (ANA TABLO) - TÜM TÜRKÇE KARAKTERLER KALDIRILDI
      kartelalar: {
        Row: {
          id: number
          kartela_no: string
          renk_kodu: string
          renk_adi: string
          goz_sayisi: number
          maksimum_goz: number
          goz_dolum_orani: number
          durum: 'AKTIF' | 'DOLU' | 'KARTELA_ARSIV' | 'KALITE_ARSIV' | 'KULLANIM_DISI' | 'LAB_DEGERLENDIRME'
          hucre_id: number | null
          hucre_kodu: string | null
          musteri_adi: string | null
          proje_kodu: string | null
          rpt_calismasi: string | null
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
        Insert: {
          id?: number
          kartela_no?: string
          renk_kodu: string
          renk_adi: string
          goz_sayisi?: number
          maksimum_goz?: number
          goz_dolum_orani?: number
          durum?: 'AKTIF' | 'DOLU' | 'KARTELA_ARSIV' | 'KALITE_ARSIV' | 'KULLANIM_DISI' | 'LAB_DEGERLENDIRME'
          hucre_id?: number | null
          hucre_kodu?: string | null
          musteri_adi?: string | null
          proje_kodu?: string | null
          rpt_calismasi?: string | null
          toplam_kullanim_sayisi?: number
          son_kullanim_tarihi?: string | null
          son_kullanan_kullanici_id?: number | null
          olusturan_kullanici_id?: number | null
          olusturulma_tarihi?: string
          arsive_alma_tarihi?: string | null
          arsive_alan_kullanici_id?: number | null
          silindi?: boolean
          silinme_tarihi?: string | null
          silen_kullanici_id?: number | null
        }
        Update: {
          id?: number
          kartela_no?: string
          renk_kodu?: string
          renk_adi?: string
          goz_sayisi?: number
          maksimum_goz?: number
          goz_dolum_orani?: number
          durum?: 'AKTIF' | 'DOLU' | 'KARTELA_ARSIV' | 'KALITE_ARSIV' | 'KULLANIM_DISI' | 'LAB_DEGERLENDIRME'
          hucre_id?: number | null
          hucre_kodu?: string | null
          musteri_adi?: string | null
          proje_kodu?: string | null
          rpt_calismasi?: string | null
          toplam_kullanim_sayisi?: number
          son_kullanim_tarihi?: string | null
          son_kullanan_kullanici_id?: number | null
          olusturan_kullanici_id?: number | null
          olusturulma_tarihi?: string
          arsive_alma_tarihi?: string | null
          arsive_alan_kullanici_id?: number | null
          silindi?: boolean
          silinme_tarihi?: string | null
          silen_kullanici_id?: number | null
        }
      }
      
      // 8. HAREKET LOGLARI - TÜM TÜRKÇE KARAKTERLER KALDIRILDI
      hareket_loglari: {
        Row: {
          id: number
          kartela_id: number | null
          kartela_no: string
          hareket_tipi: 'OLUSTURMA' | 'HUCRE_YERLESTIRME' | 'GOZ_EKLEME' | 'DOLDU_ARSIV' | 'RENK_KAYMASI' | 'RAF_DUZENLEME' | 'SILINDI' | 'DURUM_DEGISIMI' | 'ODA_GIRIS' | 'ODA_CIKIS'  | 'KULLANICI_ISLEM'
          eski_hucre_kodu: string | null
          yeni_hucre_kodu: string | null
          eski_goz_sayisi: number | null
          yeni_goz_sayisi: number | null
          eski_durum: string | null
          yeni_durum: string | null
          kullanici_id: number | null
          kullanici_kodu: string | null
          aciklama: string | null
          ip_adresi: string | null
          tarih: string
        }
        Insert: {
          id?: number
          kartela_id?: number | null
          kartela_no: string
          hareket_tipi: 'OLUSTURMA' | 'HUCRE_YERLESTIRME' | 'GOZ_EKLEME' | 'DOLDU_ARSIV' | 'RENK_KAYMASI' | 'RAF_DUZENLEME' | 'SILINDI' | 'DURUM_DEGISIMI' | 'ODA_GIRIS' | 'ODA_CIKIS'  | 'KULLANICI_ISLEM'
          eski_hucre_kodu?: string | null
          yeni_hucre_kodu?: string | null
          eski_goz_sayisi?: number | null
          yeni_goz_sayisi?: number | null
          eski_durum?: string | null
          yeni_durum?: string | null
          kullanici_id?: number | null
          kullanici_kodu?: string | null
          aciklama?: string | null
          ip_adresi?: string | null
          tarih?: string
        }
        Update: {
          id?: number
          kartela_id?: number | null
          kartela_no?: string
          hareket_tipi?: 'OLUSTURMA' | 'HUCRE_YERLESTIRME' | 'GOZ_EKLEME' | 'DOLDU_ARSIV' | 'RENK_KAYMASI' | 'RAF_DUZENLEME' | 'SILINDI' | 'DURUM_DEGISIMI' | 'ODA_GIRIS' | 'ODA_CIKIS'  | 'KULLANICI_ISLEM'
          eski_hucre_kodu?: string | null
          yeni_hucre_kodu?: string | null
          eski_goz_sayisi?: number | null
          yeni_goz_sayisi?: number | null
          eski_durum?: string | null
          yeni_durum?: string | null
          kullanici_id?: number | null
          kullanici_kodu?: string | null
          aciklama?: string | null
          ip_adresi?: string | null
          tarih?: string
        }
      }
      
      // 9. AMIR OKEY TUSU LOGLARI
      amir_okey_loglari: {
        Row: {
          id: number
          renk_kodu: string
          renk_adi: string
          kartela_id: number | null
          kartela_no: string
          goz_ekleme_oncesi: number | null
          goz_ekleme_sonrasi: number | null
          amir_kullanici_id: number | null
          tarih: string
        }
        Insert: {
          id?: number
          renk_kodu: string
          renk_adi: string
          kartela_id?: number | null
          kartela_no: string
          goz_ekleme_oncesi?: number | null
          goz_ekleme_sonrasi?: number | null
          amir_kullanici_id?: number | null
          tarih?: string
        }
        Update: {
          id?: number
          renk_kodu?: string
          renk_adi?: string
          kartela_id?: number | null
          kartela_no?: string
          goz_ekleme_oncesi?: number | null
          goz_ekleme_sonrasi?: number | null
          amir_kullanici_id?: number | null
          tarih?: string
        }
      }
      
      // 10. MUSTERILER
      musteriler: {
        Row: {
          id: number
          musteri_kodu: string
          musteri_adi: string
          durum: string
          toplam_kartela_sayisi: number
          aktif_kartela_sayisi: number
          olusturulma_tarihi: string
        }
        Insert: {
          id?: number
          musteri_kodu: string
          musteri_adi: string
          durum?: string
          toplam_kartela_sayisi?: number
          aktif_kartela_sayisi?: number
          olusturulma_tarihi?: string
        }
        Update: {
          id?: number
          musteri_kodu?: string
          musteri_adi?: string
          durum?: string
          toplam_kartela_sayisi?: number
          aktif_kartela_sayisi?: number
          olusturulma_tarihi?: string
        }
      }
    }
    
    Views: {
      raf_doluluk_gorunumu: {
        Row: {
          raf_kodu: string
          raf_adi: string
          hucre_kodu: string
          hucre_adi: string
          renk_no_baslangic: number
          renk_no_bitis: number
          mevcut_kartela_sayisi: number
          kapasite: number
          doluluk_orani: number
          durum: string
        }
      }
      kartela_durum_raporu: {
        Row: {
          renk_kodu: string
          renk_adi: string
          toplam_kartela: number
          aktif_kartela: number
          dolu_kartela: number
          arsivde_kartela: number
          kullanim_disi_kartela: number
          toplam_dolu_goz: number
          aktif_dolu_goz: number
          ortalama_dolum_orani: number
        }
      }
      gunluk_amir_okey_raporu: {
        Row: {
          gun: string
          renk_kodu: string
          renk_adi: string
          toplam_tuslama: number
          toplam_eklenen_goz: number
        }
      }
      hucre_kapasite_alarmlari: {
        Row: {
          hucre_kodu: string
          hucre_adi: string
          mevcut_kartela_sayisi: number
          kapasite: number
          doluluk_yuzde: number
          alarm_seviyesi: string
          raf_kodu: string
          raf_adi: string
        }
      }
    }
    
    Functions: {
      otomatik_hucre_bul: {
        Args: { p_renk_no: number }
        Returns: string
      }
      kartela_yerlestir: {
        Args: { p_kartela_id: number; p_hucre_kodu: string; p_kullanici_id: number }
        Returns: Json
      }
      amir_okey_tusu: {
        Args: { p_renk_kodu: string; p_amir_kullanici_id: number }
        Returns: Json
      }
      dolu_kartela_arsivle: {
        Args: { p_kartela_id: number; p_kullanici_id: number }
        Returns: Json
      }
      hucre_kapasite_guncelle: {
        Args: { p_hucre_id: number; p_yeni_kapasite: number; p_kullanici_id: number }
        Returns: Json
      }
      renk_kaymasi_tum_kartelalari_sifirla: {
        Args: { p_renk_kodu: string; p_kullanici_id: number }
        Returns: Json
      }
      pantone_no_ata: {
        Args: { p_renk_kodu: string; p_pantone_kodu: string; p_not: string; p_kullanici_id: number }
        Returns: Json
      }
    }
  }
}