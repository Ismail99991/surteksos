'use client'

import { useState } from 'react'
import { DoorOpen, User, Shield, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { LOCATIONS } from '@/types/location'
import { USERS, User as UserType } from '@/types/user'

interface RoomAccessProps {
  onAccessGranted: (user: UserType, roomCode: string) => void
  onAccessDenied: (reason: string) => void
}

export default function RoomAccess({ onAccessGranted, onAccessDenied }: RoomAccessProps) {
  const [scannedData, setScannedData] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info')

  const { inputRef, isScanning, handleInputChange, clearInput, focusInput } = useBarcodeScanner({
    onScan: handleScan,
    autoFocus: true,
    scanDelay: 50,
  })

  function handleScan(data: string) {
    setScannedData(data)
    clearInput()
    
    // 1. Kullanıcı barkodu mu? (USER- ile başlıyor)
    if (data.startsWith('USER-')) {
      const user = Object.values(USERS).find(u => u.qrCode === data)
      
      if (user) {
        setMessage(`${user.name} tanındı. Şimdi oda QR kodunu taratın.`)
        setMessageType('info')
        
        // 2 saniye sonra oda QR'ı beklemeye başla
        setTimeout(() => {
          setMessage('Oda QR kodunu taratın...')
        }, 2000)
      } else {
        setMessage('❌ Tanınmayan kullanıcı barkodu!')
        setMessageType('error')
        onAccessDenied('Geçersiz kullanıcı barkodu')
      }
      return
    }
    
    // 2. Oda QR kodu mu? (ODA- ile başlıyor)
    if (data.startsWith('AMIR-') || data.startsWith('KARTELA-') || 
        data.startsWith('URETIM-') || data.startsWith('DEPO-')) {
      
      const room = Object.values(LOCATIONS).find(r => r.qrCode === data)
      const lastUserScanned = Object.values(USERS).find(u => 
        scannedData.startsWith('USER-') && u.qrCode === scannedData
      )
      
      if (!room) {
        setMessage('❌ Geçersiz oda barkodu!')
        setMessageType('error')
        onAccessDenied('Geçersiz oda barkodu')
        return
      }
      
      if (!lastUserScanned) {
        setMessage('⏳ Önce kullanıcı barkodunuzu taratın!')
        setMessageType('error')
        return
      }
      
      // Kullanıcı bu odaya erişebilir mi?
      if (lastUserScanned.canAccessRooms.includes(room.qrCode)) {
        setMessage(`✅ ${lastUserScanned.name}, ${room.name} odasına giriş yaptı!`)
        setMessageType('success')
        onAccessGranted(lastUserScanned, room.qrCode)
      } else {
        setMessage(`❌ ${lastUserScanned.name} bu odaya erişim iznine sahip değil!`)
        setMessageType('error')
        onAccessDenied('Yetkisiz oda erişimi')
      }
      return
    }
    
    // 3. Tanımlanamayan barkod
    setMessage('❌ Tanımlanamayan barkod formatı!')
    setMessageType('error')
    onAccessDenied('Tanımlanamayan barkod')
  }

  return (
    <Card className="p-8 max-w-2xl mx-auto">
      {/* Başlık */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-6">
          <DoorOpen className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          ODAYA GİRİŞ
        </h2>
        <p className="text-gray-600">
          Personel barkodunuzu ve oda QR kodunu sırayla taratın
        </p>
      </div>

      {/* Barkod Giriş */}
      <div className="mb-8">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            onChange={handleInputChange}
            placeholder="Barkodu buraya taratın..."
            className="w-full px-6 py-4 text-xl border-3 border-blue-300 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none text-center tracking-widest bg-gray-50"
            disabled={isScanning}
          />
          {isScanning && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-pulse flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={clearInput}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Temizle
          </button>
          <button
            onClick={focusInput}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Odağa Al
          </button>
        </div>
      </div>

      {/* Mesaj Gösterimi */}
      {message && (
        <div className={`mb-8 p-5 rounded-xl border ${
          messageType === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : messageType === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-start gap-3">
            {messageType === 'success' ? '✅' : messageType === 'error' ? '❌' : 'ℹ️'}
            <div>
              <p className="font-medium">{message}</p>
              {scannedData && (
                <p className="text-sm mt-2 opacity-75">
                  Taratılan: <code className="bg-white px-2 py-1 rounded">{scannedData}</code>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Talimatlar */}
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-xl p-5">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <User className="w-5 h-5" />
            ADIM 1: Personel Barkodu
          </h4>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Personel kimlik kartınızın barkodunu taratın</li>
            <li>• Format: <code className="bg-gray-100 px-2 py-1 rounded">USER-AHMET-001</code></li>
            <li>• Sistem sizi tanıyacak ve yetkilerinizi kontrol edecek</li>
          </ul>
        </div>

        <div className="bg-gray-50 rounded-xl p-5">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <DoorOpen className="w-5 h-5" />
            ADIM 2: Oda QR Kodu
          </h4>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Oda girişindeki QR kodunu taratın</li>
            <li>• Format: <code className="bg-gray-100 px-2 py-1 rounded">AMIR-ODA-001</code></li>
            <li>• Sistem erişim izninizi kontrol edecek</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <h4 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Güvenlik Notu
          </h4>
          <p className="text-sm text-yellow-700">
            Her personel sadece yetkili olduğu odalara girebilir.
            Yetkisiz giriş denemeleri kayıt altına alınır.
          </p>
        </div>

        {/* Test Barkodları */}
        <div className="bg-gray-100 rounded-xl p-5">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            TEST İÇİN BARKODLAR
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Kullanıcılar:</p>
              <div className="space-y-2">
                {Object.values(USERS).map(user => (
                  <div key={user.id} className="text-sm">
                    <div className="font-medium">{user.name}</div>
                    <code className="text-xs bg-white px-2 py-1 rounded border">
                      {user.qrCode}
                    </code>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Odalar:</p>
              <div className="space-y-2">
                {Object.values(LOCATIONS).map(room => (
                  <div key={room.id} className="text-sm">
                    <div>{room.name}</div>
                    <code className="text-xs bg-white px-2 py-1 rounded border">
                      {room.qrCode}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            💡 Manuel test için yukarıdaki kodları input'a yazın
          </p>
        </div>
      </div>
    </Card>
  )
}
