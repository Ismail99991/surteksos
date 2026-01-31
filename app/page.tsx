'use client'

import { useState, useEffect } from 'react'
import { Factory, LogOut, User, DoorOpen, Database } from 'lucide-react'
import RoomAccess from '@/components/room/RoomAccess'
import KartelaSearch from '@/components/kartela/KartelaSearch'
import KartelaOdaDashboard from '@/components/kartela-odasi/KartelaOdaDashboard'
import YoneticiDashboard from '@/components/yonetici-odasi/YoneticiDashboard'
import AppPreloader from '@/components/AppPreloader'
import { api } from '@/lib/api'

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentRoom, setCurrentRoom] = useState<any>(null)
  const [accessLog, setAccessLog] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    // 3 saniye sonra preloader'ı kapat
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleLoadingComplete = () => {
    setIsLoading(false)
  }

  const handleAccessGranted = async (userData: any, roomData: any) => {
    setCurrentUser(userData)
    setCurrentRoom(roomData)
    
    const logEntry = `${new Date().toLocaleTimeString('tr-TR')} - ${userData.name}, ${roomData.name} odasına giriş yaptı`
    setAccessLog(prev => [logEntry, ...prev.slice(0, 9)])
  }

  const handleAccessDenied = (reason: string) => {
    const logEntry = `${new Date().toLocaleTimeString('tr-TR')} - Yetkisiz giriş denemesi: ${reason}`
    setAccessLog(prev => [logEntry, ...prev.slice(0, 9)])
  }

  const handleLogout = async () => {
    if (currentUser && currentRoom) {
      const logEntry = `${new Date().toLocaleTimeString('tr-TR')} - ${currentUser.name}, ${currentRoom.name} odasından çıkış yaptı`
      setAccessLog(prev => [logEntry, ...prev.slice(0, 9)])
      
      await api.logAccess(currentUser.id, currentRoom.id, 'exit')
    }
    setCurrentUser(null)
    setCurrentRoom(null)
  }

  // Preloader gösteriliyorsa
  if (isLoading) {
    return <AppPreloader onLoadingComplete={handleLoadingComplete} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Factory className="w-9 h-9 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Kartela Takip Sistemi</h1>
                <p className="text-gray-600 text-sm">
                  {currentUser ? currentRoom?.name : 'Oda Erişim Kontrolü'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {currentUser && currentRoom ? (
                <>
                  <div className="hidden md:flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{currentUser.name}</p>
                      <p className="text-gray-600 text-sm">{currentUser.role}</p>
                    </div>
                  </div>
                  
                  <div className="hidden md:flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <DoorOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{currentRoom.name}</p>
                      <p className="text-gray-600 text-sm">Aktif Oda</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="px-5 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Çıkış Yap
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 text-gray-600">
                  <Database className="w-5 h-5" />
                  <span className="text-sm">Mock Backend Aktif</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {!currentUser || !currentRoom ? (
          /* ODA GİRİŞ EKRANI */
          <div className="space-y-12">
            {/* Hero */}
            <div className="text-center py-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Odaya Giriş Yapın
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                Personel barkodunuzu ve oda QR kodunu sırayla taratın.
                Backend API yetkinizi otomatik kontrol edecektir.
              </p>
            </div>

            {/* Oda Giriş Bileşeni */}
            <RoomAccess
              onAccessGranted={handleAccessGranted}
              onAccessDenied={handleAccessDenied}
            />

            {/* Backend Bilgisi */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-4">
                <Database className="w-10 h-10 text-blue-600" />
                <div>
                  <h3 className="font-bold text-blue-800 mb-2">
                    🔧 Backend Entegrasyonu
                  </h3>
                  <p className="text-blue-700">
                    Şu anda <strong>Mock Backend API</strong> kullanılıyor. 
                    Backend repository hazır olduğunda gerçek API'ye geçilecek.
                  </p>
                  <div className="flex gap-4 mt-4 text-sm">
                    <div className="px-3 py-1 bg-white rounded-lg border">
                      🎯 Oda Kontrolü: <strong>Mock</strong>
                    </div>
                    <div className="px-3 py-1 bg-white rounded-lg border">
                      🗄️ Kartela Sorgu: <strong>Mock</strong>
                    </div>
                    <div className="px-3 py-1 bg-white rounded-lg border">
                      📊 Log Kaydı: <strong>Mock</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Erişim Log'u */}
            {accessLog.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  📋 Son Erişim Kayıtları
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {accessLog.map((log, index) => (
                    <div 
                      key={index} 
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm"
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ODALARA ÖZEL İÇERİK */
          <div>
            {currentRoom.name === 'Kartela Odası' ? (
              <KartelaOdaDashboard roomName={currentRoom.name} />
            ) : currentRoom.name === 'Yönetici Odası' ? (
              <YoneticiDashboard
                roomId={currentRoom.id}  // ← BU EKLENMELİ!
                roomName={currentRoom.name} />
            ) : (
              <div className="space-y-8">
                {/* Hoş Geldin */}
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-6">
                    <div className="text-4xl">🎨</div>
                  </div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Hoş Geldiniz, {currentUser.name}!
                  </h2>
                  <p className="text-gray-600 text-xl">
                    Şu anda <span className="font-semibold text-blue-600">
                      {currentRoom.name}
                    </span> odasındasınız.
                  </p>
                  <p className="text-gray-500 mt-2">
                    Kartela barkodunu taratın veya renk kodunu girin.
                  </p>
                </div>

                {/* Kartela Arama Bileşeni */}
                <KartelaSearch currentRoom={currentRoom.name} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-300">
                🏭 Kartela Takip Sistemi • Frontend v1.0
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {currentUser 
                  ? `Aktif: ${currentUser.name} - ${currentRoom?.name}`
                  : 'Lütfen odaya giriş yapın'}
              </p>
            </div>
            <div className="text-gray-400 text-sm">
              Backend: <span className="text-amber-300">Mock API Aktif</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}