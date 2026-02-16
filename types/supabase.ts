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
          tarih: string | null
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
          tarih?: string | null
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
          tarih?: string | null
        }
        Relationships: []
      }
      hareket_loglari: {
        Row: {
          id: number
          kartela_id: number | null
          kartela_no: string
          hareket_tipi: string | null
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
          tarih: string | null
        }
        Insert: {
          id?: number
          kartela_id?: number | null
          kartela_no: string
          hareket_tipi?: string | null
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
          tarih?: string | null
        }
        Update: {
          id?: number
          kartela_id?: number | null
          kartela_no?: string
          hareket_tipi?: string | null
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
          tarih?: string | null
        }
        Relationships: []
      }
      hucreler: {
        Row: {
          id: number
          hucre_kodu: string
          hucre_adi: string
          raf_id: number | null
          renk_no_baslangic: number
          renk_no_bitis: number
          kapasite: number | null
          mevcut_kartela_sayisi: number | null
          qr_kodu: string | null
          aktif: boolean | null
          olusturulma_tarihi: string | null
          musteri_id: number | null
        }
        Insert: {
          id?: number
          hucre_kodu: string
          hucre_adi: string
          raf_id?: number | null
          renk_no_baslangic: number
          renk_no_bitis: number
          kapasite?: number | null
          mevcut_kartela_sayisi?: number | null
          qr_kodu?: string | null
          aktif?: boolean | null
          olusturulma_tarihi?: string | null
          musteri_id?: number | null
        }
        Update: {
          id?: number
          hucre_kodu?: string
          hucre_adi?: string
          raf_id?: number | null
          renk_no_baslangic?: number
          renk_no_bitis?: number
          kapasite?: number | null
          mevcut_kartela_sayisi?: number | null
          qr_kodu?: string | null
          aktif?: boolean | null
          olusturulma_tarihi?: string | null
          musteri_id?: number | null
        }
        Relationships: []
      }
      kartelalar: {
        Row: {
          id: number
          kartela_no: string
          renk_kodu: string
          renk_adi: string
          goz_sayisi: number | null
          maksimum_goz: number | null
          goz_dolum_orani: number | null
          durum: string | null
          hucre_id: number | null
          hucre_kodu: string | null
          musteri_adi: string | null
          musteri_id: number | null
          proje_kodu: string | null
          rpt_calismasi: string | null
          toplam_kullanim_sayisi: number | null
          son_kullanim_tarihi: string | null
          son_kullanan_kullanici_id: number | null
          olusturan_kullanici_id: number | null
          olusturulma_tarihi: string | null
          arsive_alma_tarihi: string | null
          arsive_alan_kullanici_id: number | null
          silindi: boolean | null
          silinme_tarihi: string | null
          silen_kullanici_id: number | null
        }
        Insert: {
          id?: number
          kartela_no: string
          renk_kodu: string
          renk_adi: string
          goz_sayisi?: number | null
          maksimum_goz?: number | null
          goz_dolum_orani?: number | null
          durum?: string | null
          hucre_id?: number | null
          hucre_kodu?: string | null
          musteri_adi?: string | null
          musteri_id?: number | null
          proje_kodu?: string | null
          rpt_calismasi?: string | null
          toplam_kullanim_sayisi?: number | null
          son_kullanim_tarihi?: string | null
          son_kullanan_kullanici_id?: number | null
          olusturan_kullanici_id?: number | null
          olusturulma_tarihi?: string | null
          arsive_alma_tarihi?: string | null
          arsive_alan_kullanici_id?: number | null
          silindi?: boolean | null
          silinme_tarihi?: string | null
          silen_kullanici_id?: number | null
        }
        Update: {
          id?: number
          kartela_no?: string
          renk_kodu?: string
          renk_adi?: string
          goz_sayisi?: number | null
          maksimum_goz?: number | null
          goz_dolum_orani?: number | null
          durum?: string | null
          hucre_id?: number | null
          hucre_kodu?: string | null
          musteri_adi?: string | null
          musteri_id?: number | null
          proje_kodu?: string | null
          rpt_calismasi?: string | null
          toplam_kullanim_sayisi?: number | null
          son_kullanim_tarihi?: string | null
          son_kullanan_kullanici_id?: number | null
          olusturan_kullanici_id?: number | null
          olusturulma_tarihi?: string | null
          arsive_alma_tarihi?: string | null
          arsive_alan_kullanici_id?: number | null
          silindi?: boolean | null
          silinme_tarihi?: string | null
          silen_kullanici_id?: number | null
        }
        Relationships: []
      }
      kullanici_profilleri: {
        Row: {
          id: string
          barkod: string
          unvan: string | null
          departman: string | null
          odalar: string[] | null
          yetki_seviyesi: string | null
          foto_url: string | null
          son_giris: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          barkod: string
          unvan?: string | null
          departman?: string | null
          odalar?: string[] | null
          yetki_seviyesi?: string | null
          foto_url?: string | null
          son_giris?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barkod?: string
          unvan?: string | null
          departman?: string | null
          odalar?: string[] | null
          yetki_seviyesi?: string | null
          foto_url?: string | null
          son_giris?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      kullanici_yetkileri: {
        Row: {
          id: number
          kullanici_id: number
          oda_id: number
          kartela_olusturabilir: boolean | null
          kartela_silebilir: boolean | null
          rapor_gorebilir: boolean | null
          kullanici_yonetebilir: boolean | null
          raf_duzenleyebilir: boolean | null
          aktif: boolean | null
          sistem_yoneticisi: boolean | null
          created_at: string | null
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
          aktif?: boolean | null
          sistem_yoneticisi?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: number
          kullanici_id?: number
          oda_id?: number
          kartela_olusturabilir?: boolean | null
          kartela_silebilir?: boolean | null
          rapor_gorebilir?: boolean | null
          kullanici_yonetebilir?: boolean | null
          raf_duzenleyebilir?: boolean | null
          aktif?: boolean | null
          sistem_yoneticisi?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      kullanicilar: {
        Row: {
          id: number
          kullanici_kodu: string
          ad: string
          soyad: string
          unvan: string | null
          departman: string | null
          qr_kodu: string | null
          sifre_hash: string | null
          aktif: boolean | null
          olusturulma_tarihi: string | null
          email: string | null
          telefon: string | null
          sistem_yoneticisi: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: number
          kullanici_kodu: string
          ad: string
          soyad: string
          unvan?: string | null
          departman?: string | null
          qr_kodu?: string | null
          sifre_hash?: string | null
          aktif?: boolean | null
          olusturulma_tarihi?: string | null
          email?: string | null
          telefon?: string | null
          sistem_yoneticisi?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: number
          kullanici_kodu?: string
          ad?: string
          soyad?: string
          unvan?: string | null
          departman?: string | null
          qr_kodu?: string | null
          sifre_hash?: string | null
          aktif?: boolean | null
          olusturulma_tarihi?: string | null
          email?: string | null
          telefon?: string | null
          sistem_yoneticisi?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      musteriler: {
        Row: {
          id: number
          musteri_kodu: string
          musteri_adi: string
          durum: string | null
          toplam_kartela_sayisi: number | null
          aktif_kartela_sayisi: number | null
          olusturulma_tarihi: string | null
        }
        Insert: {
          id?: number
          musteri_kodu: string
          musteri_adi: string
          durum?: string | null
          toplam_kartela_sayisi?: number | null
          aktif_kartela_sayisi?: number | null
          olusturulma_tarihi?: string | null
        }
        Update: {
          id?: number
          musteri_kodu?: string
          musteri_adi?: string
          durum?: string | null
          toplam_kartela_sayisi?: number | null
          aktif_kartela_sayisi?: number | null
          olusturulma_tarihi?: string | null
        }
        Relationships: []
      }
      odalar: {
        Row: {
          id: number
          oda_kodu: string
          oda_adi: string
          qr_kodu: string | null
          aktif: boolean | null
          olusturulma_tarihi: string | null
          aciklama: string | null
          kat: string | null
          bina: string | null
          kapasite: number | null
          created_at: string | null
        }
        Insert: {
          id?: number
          oda_kodu: string
          oda_adi: string
          qr_kodu?: string | null
          aktif?: boolean | null
          olusturulma_tarihi?: string | null
          aciklama?: string | null
          kat?: string | null
          bina?: string | null
          kapasite?: number | null
          created_at?: string | null
        }
        Update: {
          id?: number
          oda_kodu?: string
          oda_adi?: string
          qr_kodu?: string | null
          aktif?: boolean | null
          olusturulma_tarihi?: string | null
          aciklama?: string | null
          kat?: string | null
          bina?: string | null
          kapasite?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      odalar_components: {
        Row: {
          id: number
          oda_id: number
          component_adi: string
          component_yolu: string
          sira_no: number | null
          aktif: boolean | null
          yonetici_gorebilir: boolean | null
          gerekli_yetki: string | null
          icon_adi: string | null
          aciklama: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          oda_id: number
          component_adi: string
          component_yolu: string
          sira_no?: number | null
          aktif?: boolean | null
          yonetici_gorebilir?: boolean | null
          gerekli_yetki?: string | null
          icon_adi?: string | null
          aciklama?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          oda_id?: number
          component_adi?: string
          component_yolu?: string
          sira_no?: number | null
          aktif?: boolean | null
          yonetici_gorebilir?: boolean | null
          gerekli_yetki?: string | null
          icon_adi?: string | null
          aciklama?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      raflar: {
        Row: {
          id: number
          raf_kodu: string
          raf_adi: string
          renk_no_baslangic: number
          renk_no_bitis: number
          oda_id: number | null
          dolap_id: number | null
          hucre_sayisi: number | null
          kapasite: number | null
          mevcut_kartela_sayisi: number | null
          musteri_id: number | null
          aktif: boolean | null
          olusturulma_tarihi: string | null
        }
        Insert: {
          id?: number
          raf_kodu: string
          raf_adi: string
          musteri_adi?: number | null
          musteri_id?: string | null
          renk_no_baslangic: number
          renk_no_bitis: number
          oda_id?: number | null
          dolap_id?: number | null
          hucre_sayisi?: number | null
          kapasite?: number | null
          mevcut_kartela_sayisi?: number | null
          aktif?: boolean | null
          olusturulma_tarihi?: string | null
        }
        Update: {
          id?: number
          raf_kodu?: string
          raf_adi?: string
          renk_no_baslangic?: number
          renk_no_bitis?: number
          oda_id?: number | null
          dolap_id?: number | null
          musteri_id?: string | null
          hucre_sayisi?: number | null
          kapasite?: number | null
          mevcut_kartela_sayisi?: number | null
          aktif?: boolean | null
          olusturulma_tarihi?: string | null
        }
        Relationships: []
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
          aktif: boolean | null
          olusturulma_tarihi: string | null
          pantone_atanan_kullanici_id: number | null
          pantone_atama_tarihi: string | null
          pantone_notu: string | null
        }
        Insert: {
          id?: number
          renk_kodu: string
          renk_adi: string
          pantone_kodu?: string | null
          hex_kodu?: string | null
          lab_giris_tarihi?: string | null
          lab_giren_kullanici_id?: number | null
          aktif?: boolean | null
          olusturulma_tarihi?: string | null
          pantone_atanan_kullanici_id?: number | null
          pantone_atama_tarihi?: string | null
          pantone_notu?: string | null
        }
        Update: {
          id?: number
          renk_kodu?: string
          renk_adi?: string
          pantone_kodu?: string | null
          hex_kodu?: string | null
          lab_giris_tarihi?: string | null
          lab_giren_kullanici_id?: number | null
          aktif?: boolean | null
          olusturulma_tarihi?: string | null
          pantone_atanan_kullanici_id?: number | null
          pantone_atama_tarihi?: string | null
          pantone_notu?: string | null
        }
        Relationships: []
      }
      sistem_loglari: {
        Row: {
          id: number
          kullanici_id: number | null
          islem_turu: string
          detay: string | null
          ip_adresi: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          kullanici_id?: number | null
          islem_turu: string
          detay?: string | null
          ip_adresi?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          kullanici_id?: number | null
          islem_turu?: string
          detay?: string | null
          ip_adresi?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      dolaplar: {
        Row: {
          oda_id: number
          id: number
          dolap_kodu: string
          dolap_adi: string
          raf_sayisi: number | null
          hucre_sayisi_raf: number | null
          kapasite_hucre: number | null
          toplam_hucre: number | null
          toplam_kapasite: number | null
          mevcut_kartela_sayisi: number | null
          doluluk_orani: number | null
          aktif: boolean | null
          qr_kodu: string | null
          aciklama: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          dolap_kodu: string
          dolap_adi: string
          raf_sayisi?: number | null
          hucre_sayisi_raf?: number | null
          kapasite_hucre?: number | null
          toplam_hucre?: number | null
          toplam_kapasite?: number | null
          mevcut_kartela_sayisi?: number | null
          doluluk_orani?: number | null
          aktif?: boolean | null
          qr_kodu?: string | null
          aciklama?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          dolap_kodu?: string
          dolap_adi?: string
          raf_sayisi?: number | null
          hucre_sayisi_raf?: number | null
          kapasite_hucre?: number | null
          toplam_hucre?: number | null
          toplam_kapasite?: number | null
          mevcut_kartela_sayisi?: number | null
          doluluk_orani?: number | null
          aktif?: boolean | null
          qr_kodu?: string | null
          aciklama?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [{
          foreignKeyName: "dolaplar_oda_id_fkey"
          columns: ["oda_id"]
          referencedRelation: "odalar"
          referencedColumns: ["id"]
        }
      ] 
    }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
