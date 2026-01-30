// lib/supabase/client.ts - GERÇEK SUPABASE CLIENT
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Ana createClient fonksiyonu (KartelaSearch.tsx bunu kullanıyor)
export const createClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase environment variables missing. Using fallback.')
  }
  
  // Gerçek veya fallback client
  return supabaseUrl && supabaseAnonKey
    ? createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
    : {
        from: (table: string) => ({
          select: (columns?: string) => ({
            eq: (col: string, val: any) => Promise.resolve({ data: [], error: null }),
            ilike: (col: string, pattern: string) => Promise.resolve({ data: [], error: null }),
            limit: (count: number) => Promise.resolve({ data: [], error: null }),
            order: (column: string, options: { ascending: boolean }) => Promise.resolve({ data: [], error: null })
          }),
          insert: (data: any) => Promise.resolve({ data: [data], error: null }),
          update: (data: any) => ({
            eq: () => Promise.resolve({ data: [data], error: null })
          }),
          delete: () => ({
            eq: () => Promise.resolve({ data: [], error: null })
          })
        }),
        auth: {
          getUser: () => Promise.resolve({ 
            data: { user: null }, 
            error: null 
          })
        }
      }
}

// Default export olarak da bir instance
const supabase = createClient()
export default supabase

// Named export olarak da supabase
export { supabase }
