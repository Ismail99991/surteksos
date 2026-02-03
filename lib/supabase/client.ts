// lib/supabase/client.ts - SON HALİ:
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

// 1. createClient fonksiyonu (diğer component'ler için)
export const createClient = () => supabaseInstance

// 2. Named export
export const supabase = supabaseInstance

// 3. Default export
export default supabaseInstance