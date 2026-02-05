// lib/api.ts
import { createClient } from './supabase/client'

const supabase = createClient()

export const api = {
  // ODA GİRİŞ KONTROLÜ - Supabase'den kontrol et
  checkRoomAccess: async (userQrCode: string, roomQrCode: string) => {
    try {
      console.log('🔍 Supabase oda kontrolü:', { userQrCode, roomQrCode })
      
      // 1. Kullanıcıyı bul (qr_kodu ile)
      const { data: userData, error: userError } = await supabase
        .from('kullanicilar')
        .select('*')
        .eq('qr_kodu', userQrCode)
        .eq('aktif', true)
        .single()
      
      if (userError || !userData) {
        throw new Error('Kullanıcı bulunamadı veya aktif değil')
      }
      
      // 2. Odayı bul (qr_kodu ile)
      const { data: roomData, error: roomError } = await supabase
        .from('odalar')
        .select('*')
        .eq('qr_kodu', roomQrCode)
        .eq('aktif', true)
        .single()
      
      if (roomError || !roomData) {
        throw new Error('Oda bulunamadı veya aktif değil')
      }
      
      // 3. Yetki kontrolü (kullanici_yetkileri tablosu)
      const { data: yetkiData, error: yetkiError } = await supabase
        .from('kullanici_yetkileri')
        .select('*')
        .eq('kullanici_id', (userData as any).id)  // ⭐ DÜZELTİLDİ
        .eq('oda_id', (roomData as any).id)        // ⭐ DÜZELTİLDİ
        .single()
      
      if (yetkiError || !yetkiData) {
        throw new Error(`${(userData as any).ad} ${(userData as any).soyad} bu odaya erişim iznine sahip değil`)
      }
      
      // 4. Log kaydı
      //await supabase.from('erişim_loglari').insert([{
        //kullanici_id: (userData as any).id,
        //oda_id: (roomData as any).id,
        //islem: 'giris',
       // ip_adresi: '127.0.0.1' // Gerçek IP backend'de alınacak
      //}])
      
      return {
        success: true,
        user: {
          id: (userData as any).id,
          name: `${(userData as any).ad} ${(userData as any).soyad}`,
          role: (userData as any).unvan || 'Kullanıcı',
          allowedRooms: [(roomData as any).oda_kodu]
        },
        room: {
          id: (roomData as any).id,
          name: (roomData as any).oda_adi,
          type: (roomData as any).oda_tipi || 'standart',
          code: (roomData as any).oda_kodu,
          oda_kodu: (roomData as any).oda_kodu
        },
        timestamp: new Date().toISOString(),
        accessCode: `ACC-${Date.now()}`
      }
      
    } catch (error: any) {
      console.error('❌ Oda giriş hatası:', error)
      throw new Error(error.message || 'Oda giriş kontrolü başarısız')
    }
  },
  
  // KARTELA SORGULAMA - Supabase'den
  searchKartela: async (renkKodu: string) => {
    try {
      console.log('🔍 Supabase kartela arama:', renkKodu)
      
      let query = supabase
        .from('kartelalar')
        .select(`
          *,
          renk_masalari (*),
          hucreler (*),
          hareketler (*)
        `)
        .eq('silindi', false)
        .or(`renk_kodu.ilike.%${renkKodu}%,kartela_no.ilike.%${renkKodu}%`)
        .limit(1)
      
      const { data, error } = await query
      
      if (error) {
        throw new Error(`Veritabanı hatası: ${error.message}`)
      }
      
      if (!data || data.length === 0) {
        throw new Error(`Kartela bulunamadı: ${renkKodu}`)
      }
      
      const kartela = data[0]
      
      return {
        success: true,
        kartela,
        mesaj: 'Kartela başarıyla bulundu'
      }
      
    } catch (error: any) {
      console.error('❌ Kartela arama hatası:', error)
      throw new Error(error.message || 'Kartela arama başarısız')
    }
  },
  
   logAccess: async (userId: string, roomId: string, action: 'entry' | 'exit') => {
   console.log('📝 Log kaydı (tablo yok):', { userId, roomId, action })
   return { success: true }  // ⭐ SADECE BUNU DÖNDÜR
 }
}