'use client'

import { useState, useEffect } from 'react'
import { QrCode, User, DoorOpen, CheckCircle, XCircle } from 'lucide-react'
import { mockUsers } from '@/utils/mockUsers'

interface RoomAccessProps {
  onAccessGranted: (userData: any, roomData: any) => void
  onAccessDenied: (reason: string) => void
}

// Oda QR Kodları - YÖNETİCİ ODASI EKLENDİ
const roomQRCodes: Record<string, string> = {
  'Amir Odası': 'AMIR-ODA-001',
  'Kartela Odası': 'KARTELA-ODA-001',
  'Üretim Alanı': 'URETIM-ALAN-001',
  'Depo': 'DEPO-001',
  'Yönetici Odası': 'YONETICI-ODA-001', // YENİ
  'Kalite Kontrol Odası': 'KALITE-ODA-001' // YENİ
}

// Oda bilgileri
const roomDataMap: Record<string, any> = {
  'AMIR-ODA-001': { 
    id: 'room_amir', 
    name: 'Amir Odası', 
    type: 'management',
    description: 'Yönetim ve izleme odası'
  },
  'KARTELA-ODA-001': { 
    id: 'room_kartela', 
    name: 'Kartela Odası', 
    type: 'storage',
    description: 'Kartela depolama ve yönetim'
  },
  'URETIM-ALAN-001': { 
    id: 'room_uretim', 
    name: 'Üretim Alanı', 
    type: 'production',
    description: 'Üretim ve işleme alanı'
  },
  'DEPO-001': { 
    id: 'room_depo', 
    name: 'Depo', 
    type: 'warehouse',
    description: 'Stok ve depolama alanı'
  },
  'YONETICI-ODA-001': { 
    id: 'room_yonetici', 
    name: 'Yönetici Odası', 
    type: 'admin',
    description: 'Sistem yönetimi ve yetki kontrolü',
    restricted: true
  },
  'KALITE-ODA-001': { 
    id: 'room_kalite', 
    name: 'Kalite Kontrol Odası', 
    type: 'quality',
    description: 'Kalite test ve onay odası'
  }
}

export default function RoomAccess({ onAccessGranted, onAccessDenied }: RoomAccessProps) {
  const [step, setStep] = useState<'user' | 'room'>('user')
  const [userInput, setUserInput] = useState('')
  const [roomInput, setRoomInput] = useState('')
  const [scannedUser, setScannedUser] = useState<any>(null)
  const [scannedRoom, setScannedRoom] = useState<any>(null)
  const [status, setStatus] = useState<'idle' | 'checking' | 'granted' | 'denied'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  // Kullanıcı barkodu kontrolü
  const checkUserBarcode = (barcode: string) => {
    setStatus('checking')
    setStatusMessage('Kullanıcı kontrol ediliyor...')

    setTimeout(() => {
      const user = mockUsers.find(u => u.barkod === barcode)
      
      if (user) {
        if (user.durum === 'aktif') {
          setScannedUser(user)
          setStep('room')
          setStatus('idle')
          setStatusMessage('')
        } else {
          setStatus('denied')
          setStatusMessage('⚠️ Bu kullanıcı hesabı pasif durumda')
          onAccessDenied('Pasif kullanıcı hesabı')
        }
      } else {
        setStatus('denied')
        setStatusMessage('❌ Geçersiz kullanıcı barkodu')
        onAccessDenied('Geçersiz kullanıcı barkodu')
      }
    }, 1000)
  }

  // Oda QR kodu kontrolü
  const checkRoomQRCode = (qrCode: string) => {
    if (!scannedUser) return

    setStatus('checking')
    setStatusMessage('Oda yetkisi kontrol ediliyor...')

    setTimeout(() => {
      const roomData = roomDataMap[qrCode]
      
      if (!roomData) {
        setStatus('denied')
        setStatusMessage('❌ Geçersiz oda QR kodu')
        onAccessDenied('Geçersiz oda QR kodu')
        return
      }

      // Kullanıcının odaya erişim yetkisi var mı?
      const hasAccess = scannedUser.odalar.includes(roomData.name)
      
      if (hasAccess) {
        setScannedRoom(roomData)
        setStatus('granted')
        setStatusMessage('✅ Erişim izni verildi!')
        
        // 1.5 saniye sonra erişim ver
        setTimeout(() => {
          onAccessGranted(scannedUser, roomData)
          resetScanner()
        }, 1500)
      } else {
        setStatus('denied')
        setStatusMessage(`⛔ ${scannedUser.ad} bu odaya erişim yetkisine sahip değil`)
        onAccessDenied(`Yetkisiz oda erişimi: ${roomData.name}`)
      }
    }, 1000)
  }

  const resetScanner = () => {
    setStep('user')
    setUserInput('')
    setRoomInput('')
    setScannedUser(null)
    setScannedRoom(null)
    setStatus('idle')
    setStatusMessage('')
  }

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userInput.trim()) {
      checkUserBarcode(userInput.trim())
      setUserInput('')
    }
  }

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (roomInput.trim()) {
      checkRoomQRCode(roomInput.trim())
      setRoomInput('')
    }
  }

  // Test için hızlı barkodlar
  const quickUserBarcodes = mockUsers.slice(0, 4).map(u => ({
    name: u.ad.split(' ')[0],
    barcode: u.barkod
  }))

  const quickRoomQRCodes = Object.entries(roomQRCodes).slice(0, 4).map(([name, code]) => ({
    name,
    code
  }))

  return (
    <div className="max-w-4xl mx-auto">
      {/* Adım Göstergesi */}
      <div className="flex justify-center mb-12">
        <div className="flex items-center">
          <div className={`flex flex-col items-center ${step === 'user' ? 'text-blue-600' : 'text-green-600'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step === 'user' ? 'bg-blue-100' : 'bg-green-100'}`}>
              <User className="w-6 h-6" />
            </div>
            <span className="mt-2 font-medium">1. Personel Barkodu</span>
          </div>
          <div className="w-24 h-1 mx-4 bg-gray-300"></div>
          <div className={`flex flex-col items-center ${step === 'room' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step === 'room' ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <DoorOpen className="w-6 h-6" />
            </div>
            <span className="mt-2 font-medium">2. Oda QR Kodu</span>
          </div>
        </div>
      </div>

      {/* Scanner Alanı */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {step === 'user' ? (
          // PERSONEL BARKODU ADIMI
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Personel Barkodu</h3>
              <p className="text-gray-600 mt-2">
                Personel kimlik kartınızın barkodunu taratın veya aşağıdaki test barkodlarını kullanın
              </p>
            </div>

            <form onSubmit={handleUserSubmit} className="mb-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="USER-XXXX-XXX formatında barkod taratın"
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full mt-4 py-4 bg-blue-600 text-white text-lg font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                Barkodu Onayla
              </button>
            </form>

            {/* Test Barkodları */}
            <div className="mb-6">
              <p className="text-gray-600 text-sm mb-3">Test için hızlı barkodlar:</p>
              <div className="flex flex-wrap gap-2">
                {quickUserBarcodes.map((item) => (
                  <button
                    key={item.barcode}
                    onClick={() => {
                      setUserInput(item.barcode)
                      setTimeout(() => checkUserBarcode(item.barcode), 100)
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                  >
                    {item.name} ({item.barcode})
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // ODA QR KODU ADIMI
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <QrCode className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Oda QR Kodu</h3>
              <p className="text-gray-600 mt-2">
                Oda girişindeki QR kodunu taratın. 
                <span className="block text-sm text-gray-500 mt-1">
                  Aktif kullanıcı: <span className="font-semibold">{scannedUser?.ad}</span>
                </span>
              </p>
            </div>

            <form onSubmit={handleRoomSubmit} className="mb-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <QrCode className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  placeholder="XXX-ODA-XXX formatında QR kod taratın"
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full mt-4 py-4 bg-green-600 text-white text-lg font-medium rounded-xl hover:bg-green-700 transition-colors"
              >
                QR Kodu Onayla
              </button>
            </form>

            {/* Test QR Kodları */}
            <div className="mb-6">
              <p className="text-gray-600 text-sm mb-3">Test için hızlı QR kodlar:</p>
              <div className="flex flex-wrap gap-2">
                {quickRoomQRCodes.map((item) => (
                  <button
                    key={item.code}
                    onClick={() => {
                      setRoomInput(item.code)
                      setTimeout(() => checkRoomQRCode(item.code), 100)
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                  >
                    {item.name} ({item.code})
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={resetScanner}
              className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              ← Farklı Kullanıcı ile Giriş Yap
            </button>
          </div>
        )}

        {/* Durum Mesajı */}
        {status !== 'idle' && (
          <div className={`mt-6 p-4 rounded-xl border-2 ${
            status === 'granted' ? 'border-green-200 bg-green-50' :
            status === 'denied' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            <div className="flex items-center gap-3">
              {status === 'checking' && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              )}
              {status === 'granted' && <CheckCircle className="w-6 h-6 text-green-600" />}
              {status === 'denied' && <XCircle className="w-6 h-6 text-red-600" />}
              <div>
                <p className={`font-medium ${
                  status === 'granted' ? 'text-green-800' :
                  status === 'denied' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {statusMessage}
                </p>
                {status === 'checking' && (
                  <p className="text-sm text-blue-600 mt-1">Lütfen bekleyin...</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Kullanım Talimatları */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <h4 className="font-bold text-blue-800 mb-3">📋 Kullanım Talimatları</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <p className="font-medium mb-1">ADIM 1: Personel Barkodu</p>
            <p>• Personel kimlik kartınızın barkodunu taratın</p>
            <p>• Format: <code className="bg-white px-2 py-1 rounded">USER-AHMET-001</code></p>
          </div>
          <div>
            <p className="font-medium mb-1">ADIM 2: Oda QR Kodu</p>
            <p>• Oda girişindeki QR kodunu taratın</p>
            <p>• Format: <code className="bg-white px-2 py-1 rounded">AMIR-ODA-001</code></p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-sm text-blue-600">
            💡 <strong>Güvenlik Notu:</strong> Her personel sadece yetkili olduğu odalara girebilir. 
            Yetkisiz giriş denemeleri kayıt altına alınır.
          </p>
        </div>
      </div>

      {/* TEST KULLANICI ve ODALAR */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border">
          <h5 className="font-bold text-gray-900 mb-3">👥 TEST KULLANICILARI</h5>
          <div className="space-y-3">
            {mockUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{user.ad}</div>
                  <div className="text-sm text-gray-500">{user.unvan}</div>
                </div>
                <code className="text-sm bg-white px-2 py-1 rounded border">
                  {user.barkod}
                </code>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border">
          <h5 className="font-bold text-gray-900 mb-3">🚪 TEST ODALARI</h5>
          <div className="space-y-3">
            {Object.entries(roomQRCodes).map(([name, code]) => (
              <div key={code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{name}</div>
                  <div className="text-sm text-gray-500">{roomDataMap[code]?.description}</div>
                </div>
                <code className="text-sm bg-white px-2 py-1 rounded border">
                  {code}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
