'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import KartelaSearch from '@/components/kartela/KartelaSearch'
import KartelaSearchModal from '@/components/kartela/KartelaSearchModal'

// Supabase client
const supabase = createClient()

// Tür tanımlamaları
type UserType = Database['public']['Tables']['kullanicilar']['Row']
type RoomType = Database['public']['Tables']['odalar']['Row']

// Oda kodları -> görünen ad
const ROOM_NAMES: Record<string, string> = {
  'kartela_odasi': 'Kartela Odası',
  'yonetici_odasi': 'Yönetici Odası', 
  'amir_odasi': 'Amir Odası',
  'lab_odasi': 'Lab Odası',
  'kalite_kontrol': 'Kalite Kontrol Odası'
}

// Dinamik import için oda component'leri
const ROOM_COMPONENT_IMPORTS: Record<string, () => Promise<{ default: React.ComponentType<any> }>> = {
  'yonetici_odasi': () => import('@/components/yonetici-odasi/YoneticiDashboard'),
  'kartela_odasi': () => import('@/components/kartela-odasi/KartelaOdaDashboard'),
}

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = (params.roomId as string)?.toLowerCase()
  
  const [roomData, setRoomData] = useState<RoomType | null>(null)
  const [userData, setUserData] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [roomSpecificComponents, setRoomSpecificComponents] = useState<React.ReactNode[]>([])
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    checkSessionAndLoadData()
  }, [roomId])
  
  const checkSessionAndLoadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 1. Session kontrolü
      const sessionStr = localStorage.getItem('room_session')
      if (!sessionStr) {
        router.push('/access')
        return
      }
      
      const session = JSON.parse(sessionStr)
      
      // 2. Session süresi kontrolü
      const expiresAt = new Date(session.expiresAt)
      if (expiresAt <= new Date()) {
        localStorage.removeItem('room_session')
        router.push('/access')
        return
      }
      
      // 3. Oda uyumluluğu kontrolü
      if (session.roomCode !== roomId) {
        setError('Bu odaya erişim yetkiniz yok!')
        setTimeout(() => router.push('/access'), 2000)
        return
      }
      
      // 4. Kullanıcı ve oda verilerini Supabase'den çek
      await Promise.all([
        loadUserData(session.userId),
        loadRoomData(session.roomId)
      ])
      
      // 5. Odaya özel component'leri yükle
      loadRoomSpecificComponents()
      
    } catch (error) {
      console.error('Veri yükleme hatası:', error)
      setError('Veri yüklenirken bir hata oluştu')
      router.push('/access')
    } finally {
      setLoading(false)
    }
  }
  
  const loadUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('kullanicilar')
        .select('*')
        .eq('id', Number(userId))
        .eq('aktif', true)
        .single()
      
      if (error) throw error
      if (!data) throw new Error('Kullanıcı bulunamadı')
      
      setUserData(data)
    } catch (error) {
      console.error('Kullanıcı yükleme hatası:', error)
      throw error
    }
  }
  
  const loadRoomData = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('odalar')
        .select('*')
        .eq('id', Number(roomId))
        .eq('aktif', true)
        .single()
      
      if (error) throw error
      if (!data) throw new Error('Oda bulunamadı')
      
      setRoomData(data)
    } catch (error) {
      console.error('Oda yükleme hatası:', error)
      throw error
    }
  }
  
  const loadRoomSpecificComponents = async () => {
    try {
      if (!roomId) return
      
      const importFunc = ROOM_COMPONENT_IMPORTS[roomId]
      if (!importFunc) {
        setRoomSpecificComponents([])
        return
      }
      
      const module = await importFunc()
      const Component = module.default
      
      // Odaya özel component'leri oluştur
      const components: React.ReactNode[] = []
      
      if (roomId === 'yonetici_odasi') {
        components.push(
          <div key="dashboard" className="bg-white rounded-xl shadow p-6 border col-span-full">
            <Component />
          </div>
        )
      } else if (roomId === 'kartela_odasi') {
        // Kartela odası için birden fazla component yükleyebiliriz
        // Geçici olarak sadece KartelaOdaDashboard kullanıyoruz
        // AssignToCustomer ve ResetKartelaModal sonra eklenecek
        components.push(
          <div key="dashboard" className="bg-white rounded-xl shadow p-6 border col-span-full">
            <Component roomName="Kartela Odası" currentUserId={userData?.id} />
          </div>
        )
      }
      
      setRoomSpecificComponents(components)
    } catch (error) {
      console.error('Component yükleme hatası:', error)
      setRoomSpecificComponents([])
    }
  }
  
  const handleLogout = () => {
    localStorage.removeItem('room_session')
    router.push('/access')
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Oda yükleniyor...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-800 mb-2">Erişim Hatası</h2>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={() => router.push('/access')}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    )
  }
  
  if (!roomData || !userData) {
    return null
  }
  
  const roomName = ROOM_NAMES[roomId] || roomData.oda_adi
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">
                    {roomData.oda_kodu.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{roomName}</h1>
                  <p className="text-gray-600 text-sm">
                    Personel: <span className="font-semibold">{userData.ad}</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-sm text-gray-500">
                Oda Kodu: <code className="bg-gray-100 px-2 py-1 rounded">{roomData.oda_kodu}</code>
              </div>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Odayı Terk Et
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Ortak: Kartela Arama (HER ODADA VAR) */}
        <div className="mb-12">
          <div className="bg-white rounded-xl shadow p-1 mb-6">
            <div className="p-5">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Kartela Arama
              </h2>
              <p className="text-gray-600 mb-6 text-sm">
                Kartela numarası, müşteri adı veya barkod ile arama yapın
              </p>
              <KartelaSearchModal
                currentRoom={roomData.oda_kodu} 
                currentUserId={userData.id} 
              />
            </div>
          </div>
        </div>
        
        {/* Odaya Özel Component'ler */}
        {roomSpecificComponents.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {roomName} Araçları
              </h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {roomSpecificComponents.length} araç
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roomSpecificComponents}
            </div>
          </div>
        )}
        
        {/* Oda Bilgileri (Debug için) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-12 p-6 bg-gray-50 rounded-xl border">
            <h3 className="font-bold text-gray-900 mb-4">🔍 Oda Bilgileri (Geliştirme)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Oda ID:</p>
                <code className="bg-white p-2 rounded border block truncate">{roomData.id}</code>
              </div>
              <div>
                <p className="text-gray-600">QR Kodu:</p>
                <code className="bg-white p-2 rounded border block">{roomData.qr_kodu || 'Yok'}</code>
              </div>
              <div>
                <p className="text-gray-600">Kullanıcı ID:</p>
                <code className="bg-white p-2 rounded border block truncate">{userData.id}</code>
              </div>
              <div>
                <p className="text-gray-600">Kullanıcı Barkodu:</p>
                <code className="bg-white p-2 rounded border block">{userData.qr_kodu}</code>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className="mt-12 py-6 border-t bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <p>Kartela Takip Sistemi • {roomData.oda_adi}</p>
            <p className="mt-2 md:mt-0">
              Session: {new Date().toLocaleTimeString('tr-TR')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
