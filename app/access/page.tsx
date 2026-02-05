'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RoomAccess from './components/RoomAccess'

export default function AccessPage() {
  const router = useRouter()
  
  // Eğer zaten geçerli bir session varsa, direkt odaya yönlendir
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const sessionStr = localStorage.getItem('room_session')
        if (!sessionStr) return false
        
        const session = JSON.parse(sessionStr)
        
        // Session süresi kontrolü
        const expiresAt = new Date(session.expiresAt)
        const now = new Date()
        
        if (expiresAt > now) {
          // Geçerli session var, odaya yönlendir
          router.push(`/room/${session.roomCode}`)
          return true
        } else {
          // Session süresi dolmuş, temizle
          localStorage.removeItem('room_session')
          return false
        }
      } catch (error) {
        console.error('Session kontrol hatası:', error)
        localStorage.removeItem('room_session')
        return false
      }
    }
    
    checkExistingSession()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Başlık Bölümü */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Kartela Takip Sistemine Hoş Geldiniz
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Odaya erişmek için lütfen personel barkodunuzu ve oda QR kodunu sırayla taratın
          </p>
        </div>

        {/* Ana İçerik */}
        <div className="max-w-4xl mx-auto">
          {/* Oda Giriş Bileşeni */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
            <div className="p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  🚪 Oda Giriş Kontrolü
                </h2>
                <p className="text-gray-500">
                  Güvenli erişim için iki adımlı kimlik doğrulama
                </p>
              </div>
              
              {/* RoomAccess Component'i */}
              <RoomAccess />
            </div>
            
            {/* Bilgi Paneli */}
            <div className="bg-gray-50 border-t border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                ℹ️ Nasıl Çalışır?
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Personel Barkodu</p>
                    <p className="text-sm text-gray-500">Kimlik kartınızın barkodunu taratın</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Oda QR Kodu</p>
                    <p className="text-sm text-gray-500">Oda girişindeki QR kodu taratın</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Yetki Kontrolü</p>
                    <p className="text-sm text-gray-500">Sistem erişim iznini kontrol eder</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alt Bilgi */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 text-gray-500 text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Supabase ile güvenli veritabanı bağlantısı • Gerçek zamanlı yetki kontrolü</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
