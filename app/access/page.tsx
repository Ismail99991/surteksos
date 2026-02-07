'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RoomAccess from './components/RoomAccess'

export default function AccessPage() {
  const router = useRouter()
  
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const sessionStr = localStorage.getItem('room_session')
        if (!sessionStr) return false
        
        const session = JSON.parse(sessionStr)
        const expiresAt = new Date(session.expiresAt)
        const now = new Date()
        
        if (expiresAt > now) {
          router.push(`/room/${session.roomCode}`)
          return true
        } else {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Dekoratif arkaplan elementleri */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-100/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="mb-12 md:mb-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 18V22H2V18C2 17.4477 2.44772 17 3 17H4V7C4 4.23858 6.23858 2 9 2H15C17.7614 2 20 4.23858 20 7V17H21C21.5523 17 22 17.4477 22 18ZM7 7C7 6.44772 7.44772 6 8 6C8.55228 6 9 6.44772 9 7V17H7V7ZM15 7C15 6.44772 15.4477 6 16 6C16.5523 6 17 6.44772 17 7V17H15V7Z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                  Kartela Takip Sistemi
                </h1>
                <p className="text-gray-500 text-sm md:text-base mt-1">
                  Akıllı oda erişim kontrolü
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200/50">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Bağlantı aktif</span>
              </div>
              <div className="text-xs text-gray-400 bg-white/30 px-3 py-1.5 rounded-lg border border-gray-200/30">
                v1.0.0
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 mb-6 md:mb-8">
            <svg className="w-10 h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Oda Erişim Kontrolü
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Personel barkodunuzu ve oda QR kodunu taratarak güvenli erişim sağlayın
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Process Steps */}
            <div className="lg:col-span-1">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 md:p-8 shadow-lg shadow-gray-200/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 2.049C7.501 2.551 3 7.368 3 13C3 18.523 7.477 23 13 23C18.632 23 23.449 18.499 23.951 13H21.938C21.448 17.174 17.617 20.5 13 20.5C8.037 20.5 4 16.463 4 11.5C4 6.882 7.326 3.052 11.5 2.562V13.414L8.464 10.379L7.05 11.793L12 16.743L16.95 11.793L15.536 10.379L12.5 13.415V2.049H13Z" />
                  </svg>
                  İşlem Akışı
                </h3>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center border border-blue-200/50">
                        <span className="text-blue-700 font-bold text-sm">1</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Personel Doğrulama</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Kimlik kartınızın barkodunu taratarak personel kimliğinizi doğrulayın
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl flex items-center justify-center border border-emerald-200/50">
                        <span className="text-emerald-700 font-bold text-sm">2</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Oda Yetkisi</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Girmek istediğiniz odanın QR kodunu taratarak erişim yetkinizi kontrol edin
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-violet-50 rounded-xl flex items-center justify-center border border-violet-200/50">
                        <span className="text-violet-700 font-bold text-sm">3</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Oturum Başlatma</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Doğrulama başarılıysa oturumunuz başlatılır ve odaya yönlendirilirsiniz
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-200/50">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z" />
                    </svg>
                    <span>Her oturum 8 saat geçerlidir</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column - RoomAccess Component */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-200/70 shadow-xl shadow-gray-200/10 overflow-hidden">
                {/* Component Header */}
                <div className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white p-6 md:p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Erişim Kontrol Paneli
                      </h3>
                      <p className="text-gray-500 mt-1">
                        İki adımlı kimlik doğrulama ile güvenli giriş
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span>Hazır</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* RoomAccess Component Container */}
                <div className="p-6 md:p-8">
                  <RoomAccess />
                </div>
                
                {/* Footer Info */}
                <div className="bg-gradient-to-r from-gray-50/50 to-white border-t border-gray-200/50 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 10H14V22H18C19.103 22 20 21.103 20 20V12C20 10.897 19.103 10 18 10Z" />
                          <path d="M4 10H10V22H4C2.897 22 2 21.103 2 20V12C2 10.897 2.897 10 4 10Z" />
                          <path d="M11 4H13V10H11z" />
                          <path d="M18 4H20V8H18z" />
                          <path d="M4 4H6V8H4z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Supabase Backend</p>
                        <p className="text-xs text-gray-500">Gerçek zamanlı veritabanı bağlantısı</p>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm1-8h4v2h-6V7h2v5z" />
                        </svg>
                        Son kontrol: {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 md:mt-16 pt-8 border-t border-gray-200/30">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">Kartela Takip Sistemi</span> • Tüm hakları saklıdır © {new Date().getFullYear()}
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">
                Yardım
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">
                Gizlilik
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">
                Destek
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}