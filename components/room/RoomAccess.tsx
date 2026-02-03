'use client'

import { useState, useEffect } from 'react'
import { QrCode, User, DoorOpen, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client' // ← Gerçek Supabase
import type { Database } from '@/types/supabase'

interface RoomAccessProps {
  onAccessGranted: (userData: any, roomData: any) => void
  onAccessDenied: (reason: string) => void
}

type UserType = Database['public']['Tables']['kullanicilar']['Row']
type RoomType = Database['public']['Tables']['odalar']['Row']
type UserPermissionType = Database['public']['Tables']['kullanici_yetkileri']['Row']

export default function RoomAccess({ onAccessGranted, onAccessDenied }: RoomAccessProps) {
  const [step, setStep] = useState<'user' | 'room'>('user')
  const [userInput, setUserInput] = useState('')
  const [roomInput, setRoomInput] = useState('')
  const [scannedUser, setScannedUser] = useState<UserType | null>(null)
  const [scannedRoom, setScannedRoom] = useState<RoomType | null>(null)
  const [status, setStatus] = useState<'idle' | 'checking' | 'granted' | 'denied'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [allRooms, setAllRooms] = useState<RoomType[]>([])



  // Odaları yükle
  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('odalar')
        .select('*')
        .eq('aktif', true)
        .order('oda_kodu')

      if (error) throw error
      setAllRooms(data || [])
    } catch (error) {
      console.error('Odalar yüklenemedi:', error)
    }
  }

  // Kullanıcı barkodu kontrolü - GERÇEK VERİTABANI
  const checkUserBarcode = async (barcode: string) => {
    setStatus('checking')
    setStatusMessage('Kullanıcı kontrol ediliyor...')

    try {
      const { data: user, error } = await supabase
        .from('kullanicilar')
        .select('*')
        .eq('qr_kodu', barcode)
        .eq('aktif', true)
        .single()

      if (error) throw error

      if (user) {
        setScannedUser(user)
        setStep('room')
        setStatus('idle')
        setStatusMessage('')
      } else {
        setStatus('denied')
        setStatusMessage('❌ Geçersiz kullanıcı barkodu')
        onAccessDenied('Geçersiz kullanıcı barkodu')
      }
    } catch (error) {
      console.error('Kullanıcı kontrol hatası:', error)
      setStatus('denied')
      setStatusMessage('❌ Kullanıcı bulunamadı veya pasif durumda')
      onAccessDenied('Kullanıcı bulunamadı')
    }
  }

  // Oda QR kodu kontrolü - GERÇEK VERİTABANI
  const checkRoomQRCode = async (qrCode: string) => {
    if (!scannedUser) return

    setStatus('checking')
    setStatusMessage('Oda yetkisi kontrol ediliyor...')

    try {
      // 1. Odayı bul
      const { data: roomData, error: roomError } = await supabase
        .from('odalar')
        .select('*')
        .eq('qr_kodu', qrCode)
        .eq('aktif', true)
        .single()

      if (roomError || !roomData) {
        setStatus('denied')
        setStatusMessage('❌ Geçersiz oda QR kodu')
        onAccessDenied('Geçersiz oda QR kodu')
        return
      }
      
      const room: RoomType = roomData

      // 2. Kullanıcının bu odaya yetkisi var mı?
      const { data: permission, error: permError } = await supabase
        .from('kullanici_yetkileri')
        .select('*')
        .eq('kullanici_id', scannedUser.id)
        .eq('oda_id', room.id)
        .single()

      if (permError || !permission) {
        setStatus('denied')
        setStatusMessage(`⛔ ${scannedUser.ad} bu odaya erişim yetkisine sahip değil`)
        onAccessDenied(`Yetkisiz oda erişimi: ${room.oda_adi}`)
        return
      }

      // 3. Erişim izni ver
      setScannedRoom(room)
      setStatus('granted')
      setStatusMessage('✅ Erişim izni verildi!')

      // 4. Log kaydı oluştur (hareket_loglari)
      await supabase
        .from('hareket_loglari')
        .insert({
              kartela_no: 'ODA_GIRIS',
          hareket_tipi: 'ODA_GIRIS' as any,
          kullanici_id: scannedUser.id,
          kullanici_kodu: scannedUser.kullanici_kodu,
          aciklama: `${scannedUser.ad} ${room.oda_adi} odasına giriş yaptı`,
          tarih: new Date().toISOString()
        } as any)

      // 5. Callback çağır
      setTimeout(() => {
        onAccessGranted(scannedUser, room)
        resetScanner()
      }, 1500)

    } catch (error) {
      console.error('Oda kontrol hatası:', error)
      setStatus('denied')
      setStatusMessage('❌ Sistem hatası, lütfen tekrar deneyin')
      onAccessDenied('Sistem hatası')
    }
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

  // Test için hızlı barkodlar (opsiyonel - geliştirme için)
  const quickUserBarcodes = [
    { name: 'Test User 1', barcode: 'USER-001' },
    { name: 'Test User 2', barcode: 'USER-002' },
    { name: 'Test User 3', barcode: 'USER-003' },
  ]

  const quickRoomQRCodes = allRooms.slice(0, 4).map(room => ({
    name: room.oda_adi,
    code: room.qr_kodu || ''
  }))

  return (
    <div className="max-w-4xl mx-auto">
      {/* Adım Göstergesi (Aynı) */}
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

      {/* Scanner Alanı (Aynı UI, sadece fonksiyonlar değişti) */}
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
                Personel kimlik kartınızın barkodunu taratın
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
                  placeholder="Kullanıcı QR kodunu taratın"
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

            {/* Test Barkodları (opsiyonel) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-3">Test barkodları:</p>
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
            )}
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
                  placeholder="Oda QR kodunu taratın"
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

            {/* Test QR Kodları (opsiyonel) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-3">Test QR kodları:</p>
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
            )}

            <button
              onClick={resetScanner}
              className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              ← Farklı Kullanıcı ile Giriş Yap
            </button>
          </div>
        )}

        {/* Durum Mesajı (Aynı) */}
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

      {/* Oda Listesi (Gerçek veritabanından) */}
      <div className="mt-8 bg-white rounded-xl p-6 border">
        <h5 className="font-bold text-gray-900 mb-3">🚪 SİSTEMDEKİ ODALAR</h5>
        <div className="space-y-3">
          {allRooms.map((room) => (
            <div key={room.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">{room.oda_adi}</div>
                <div className="text-sm text-gray-500">{room.oda_kodu}</div>
              </div>
              <code className="text-sm bg-white px-2 py-1 rounded border">
                {room.qr_kodu || 'QR Yok'}
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}