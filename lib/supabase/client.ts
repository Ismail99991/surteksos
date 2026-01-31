// lib/supabase/client.ts - SADE VE TEMİZ
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Ana createClient fonksiyonu
export const createClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please ensure NEXT_PUBLIC_SUPABASE_URL and ' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    )
  }
  
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Default export olarak bir instance
const supabase = createClient()
export default supabase

// Named export olarak da supabase
export { supabase }