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
      kartelalar: {
        Row: {
          id: string
          kartela_no: string
          renk_kodu: string
          renk_adi: string
          durum: string
          goz_sayisi: number
          musteri_adi: string | null
          proje_kodu: string | null
          olusturulma_tarihi: string
          guncellenme_tarihi: string
          silindi: boolean
          hucre_id: string | null
          renk_masasi_id: string | null
        }
        Insert: {
          id?: string
          kartela_no: string
          renk_kodu: string
          renk_adi: string
          durum?: string
          goz_sayisi?: number
          musteri_adi?: string | null
          proje_kodu?: string | null
          olusturulma_tarihi?: string
          guncellenme_tarihi?: string
          silindi?: boolean
          hucre_id?: string | null
          renk_masasi_id?: string | null
        }
        Update: {
          id?: string
          kartela_no?: string
          renk_kodu?: string
          renk_adi?: string
          durum?: string
          goz_sayisi?: number
          musteri_adi?: string | null
          proje_kodu?: string | null
          olusturulma_tarihi?: string
          guncellenme_tarihi?: string
          silindi?: boolean
          hucre_id?: string | null
          renk_masasi_id?: string | null
        }
      }
      renk_masalari: {
        Row: {
          id: string
          pantone_kodu: string | null
          hex_kodu: string | null
          olusturulma_tarihi: string
        }
      }
      hucreler: {
        Row: {
          id: string
          hucre_kodu: string
          hucre_adi: string
          kapasite: number
          mevcut_kartela_sayisi: number
        }
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
  }
}
