'use client'

import { useState } from 'react'
import { Factory, LogOut, User, DoorOpen } from 'lucide-react'
import RoomAccess from '@/components/room/RoomAccess'
import { LOCATIONS } from '@/types/location'
import { USERS, User as UserType } from '@/types/user'

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [currentRoom, setCurrentRoom] = useState<string | null>(null)
  const [accessLog, setAccessLog] = useState<string[]>([])

  const handleAccessGranted = (user: UserType, roomCode: string) => {
    setCurrentUser(user)
    setCurrentRoom(roomCode)
    
    const logEntry = `${new Date().toLocaleTimeString('tr-TR')} - ${user.name}, ${roomCode} odasına giriş yaptı`
    setAccessLog(prev => [logEntry, ...prev.slice(0, 9)]) // Son 10 kayıt
  }

  const handleAccessDenied = (reason: string) => {
    const logEntry = `${new Date().toLocaleTimeString('tr-TR')} - Yetkisiz giriş denemesi: ${reason}`
    setAccessLog(prev => [logEntry, ...prev.slice(0, 9)])
  }

  const handleLogout = () => {
    if (currentUser && currentRoom) {
      const logEntry = `${new Date().toLocaleTimeString('tr-TR')} - ${currentUser.name}, ${currentRoom} odasından çıkış yaptı`
      setAccessLog(prev => [logEntry, ...prev.slice(0, 9)])
    }
    setCurrentUser(null)
    setCurrentRoom(null)
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
                <p className="text-gray-600 text-sm">Oda Erişim Kontrolü</p>
              </div>
            </div>
            
            {currentUser && currentRoom && (
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-5 py-3 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">{currentUser.name}</p>
                      <p className="text-green-600 text-sm">
                        <DoorOpen className="inline w-4 h-4 mr-1" />
                        {LOCATIONS[currentRoom as keyof typeof LOCATIONS]?.name}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-5 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Çıkış Yap
                </button>
              </div>
            )}
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
                Sistem yetkinizi otomatik kontrol edecektir.
              </p>
            </div>

            {/* Oda Giriş Bileşeni */}
            <RoomAccess
              onAccessGranted={handleAccessGranted}
              onAccessDenied={handleAccessDenied}
            />

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
          /* KARTELA ARAMA EKRANI (Odaya girdikten sonra) */
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
                  {LOCATIONS[currentRoom as keyof typeof LOCATIONS]?.name}
                </span> odasındasınız.
              </p>
              <p className="text-gray-500 mt-2">
                Kartela aramak için aşağıdaki arama kutusunu kullanın.
              </p>
            </div>

            {/* Kartela Arama */}
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto border border-gray-200">
              <div className="text-center mb-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  KARTELA SORGULAMA
                </h3>
                <p className="text-gray-600">
                  Renk no son 4 hanesini giriniz yada kare kodu okutunuz
                </p>
              </div>

              {/* Arama Input */}
              <div className="mb-8">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Örn: 0001.1, 0002.1, 0003.1..."
                    className="w-full px-8 py-5 text-xl border-3 border-blue-300 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none text-center tracking-widest"
                    autoFocus
                  />
                  <div className="absolute right-6 top-1/2 transform -translate-y-1/2 text-2xl">
                    🔍
                  </div>
                </div>
                <p className="text-center text-gray-500 mt-4">
                  💡 Barkod tarayıcınızı yukarıdaki kutuya odaklayın ve kartela barkodunu taratın
                </p>
              </div>

              {/* Hızlı Örnekler */}
              <div className="mb-10">
                <p className="text-center text-gray-700 font-medium mb-4">
                  🚀 Hızlı Test İçin:
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  {[
                    '231010001.1', '231010002.1', '231010003.1', 
                    '231010004.1', '231010005.1', '231010006.1'
                  ].map((code) => (
                    <button
                      key={code}
                      onClick={() => alert(`Aranacak: ${code}\n(Backend bağlantısı henüz yok)`)}
                      className="px-5 py-3 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 text-blue-700 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sonuç Alanı */}
              <div className="border-3 border-dashed border-gray-300 rounded-2xl p-16 text-center bg-gray-50">
                <div className="text-5xl mb-6">🔍</div>
                <h4 className="text-xl font-semibold text-gray-700 mb-3">
                  Kartela Sorgulama Hazır
                </h4>
                <p className="text-gray-500">
                  Bir renk kodu girdiğinizde veya tarattığınızda,<br/>
                  kartelanın son konumu burada görünecektir.
                </p>
              </div>
            </div>

            {/* Bilgi Paneli */}
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-3">📋 Kullanım Kılavuzu</h4>
                <ul className="text-blue-700 text-sm space-y-2">
                  <li>• Kartela barkodu direkt taratılabilir</li>
                  <li>• Manuel giriş için son 4 hane yeterli</li>
                  <li>• Sistem otomatik tamamlayacak: 0001.1 → 231010001.1</li>
                  <li>• Sonuç: Kartela konumu ve hareket geçmişi</li>
                </ul>
              </div>
              
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <h4 className="font-bold text-green-800 mb-3">✅ Yetkileriniz</h4>
                <ul className="text-green-700 text-sm space-y-2">
                  <li>• Aktif Oda: {LOCATIONS[currentRoom as keyof typeof LOCATIONS]?.name}</li>
                  <li>• Erişebileceğiniz Odalar:</li>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentUser.canAccessRooms.map(roomCode => (
                      <span 
                        key={roomCode}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                      >
                        {LOCATIONS[roomCode as keyof typeof LOCATIONS]?.name}
                      </span>
                    ))}
                  </div>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-300">
                🏭 Kartela Takip Sistemi • Oda Erişim Kontrolü v1.1
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {currentUser 
                  ? `Aktif: ${currentUser.name} - ${LOCATIONS[currentRoom as keyof typeof LOCATIONS]?.name}`
                  : 'Lütfen odaya giriş yapın'}
              </p>
            </div>
            <div className="text-gray-400 text-sm">
              Son güncelleme: {new Date().toLocaleDateString('tr-TR')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
