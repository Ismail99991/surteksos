import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Ana instance
const supabaseInstance = createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
})

// createClient fonksiyonu
export const createClient = () => supabaseInstance

// Named export
export const supabase = supabaseInstance

// Default export
export default supabaseInstance

// ============ YENİ ODA-COMPONENT FONKSİYONLARI ============

// 1. Odaya göre component'leri getir
export const getComponentsByOdaKodu = async (odaKodu: string) => {
  try {
    // Önce odayı bul
    const { data: oda } = await supabaseInstance
      .from('odalar')
      .select('id')
      .eq('oda_kodu', odaKodu)
      .single()

    if (!oda) return []

    const odaId = (oda as any).id

    // Sonra component'leri getir
    const { data: components } = await supabaseInstance
      .from('odalar_components')
      .select('*')
      .eq('oda_id', odaId)
      .eq('aktif', true)
      .order('sira_no', { ascending: true })

    return components || []
  } catch (error) {
    console.error('Component\'ler alınırken hata:', error)
    return []
  }
}

// 2. Tüm oda-component'leri getir (Yönetici paneli için)
export const getAllOdaComponents = async () => {
  try {
    const { data } = await supabaseInstance
      .from('odalar_components')
      .select(`
        *,
        odalar:oda_id (oda_kodu, oda_adi)
      `)
      .order('oda_id', { ascending: true })
      .order('sira_no', { ascending: true })

    return data || []
  } catch (error) {
    console.error('Tüm oda component\'leri alınırken hata:', error)
    return []
  }
}