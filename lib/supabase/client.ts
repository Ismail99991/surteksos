// lib/supabase/client.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// TÜM uygulamada TEK bir instance kullanmak için bu yöntemi kullanın
let supabaseInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null

// Ana createClient fonksiyonu - Singleton pattern
export const createClient = () => {
  // Eğer zaten bir instance varsa, onu döndür
  if (supabaseInstance) {
    return supabaseInstance
  }
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase ortam değişkenleri eksik. ' +
      'Lütfen NEXT_PUBLIC_SUPABASE_URL ve ' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY değişkenlerinin ayarlandığından emin olun.'
    )
  }
  
  // Yeni instance oluştur
  supabaseInstance = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  })
  
  return supabaseInstance
}

// Önceden oluşturulmuş instance'ı döndüren fonksiyon
export const getSupabase = () => {
  if (!supabaseInstance) {
    return createClient()
  }
  return supabaseInstance
}

// Default instance
const supabase = createClient()
export default supabase

// Named export
export { supabase }