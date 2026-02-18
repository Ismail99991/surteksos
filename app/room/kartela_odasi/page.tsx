'use client'

import { useRouter } from 'next/navigation'
import RaporAlma from '@/components/rapor/RaporAlma'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import KartelaSearch from '@/components/kartela/KartelaSearch'
import KartelaTransfer from '@/components/KartelaTransfer'
import KartelaCRUD from '@/components/kartela/KartelaCRUD' // YENİ: Import ettik!
import { QrCode, ClipboardList, Sheet, Search, Package, Home, ArrowRightLeft, X } from 'lucide-react'

// Supabase client
const supabase = createClient()

// Tür tanımlamaları
type UserType = Database['public']['Tables']['kullanicilar']['Row']
type RoomType = Database['public']['Tables']['odalar']['Row']

type ActiveTab = 'search' | 'transfer' | 'dashboard' | 'rapor' | 'kartela-crud' // YENİ: 'kartela-crud' eklendi

export default function KartelaOdasiPage() {
  const router = useRouter()
  
  const [roomData, setRoomData] = useState<RoomType | null>(null)
  const [userData, setUserData] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')
  const [fullscreenTransfer, setFullscreenTransfer] = useState(false)
  
  // YENİ: Başarı mesajları için state
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  useEffect(() => {
    checkSessionAndLoadData()
  }, [])
  
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
      
      // 3. Oda uyumluluğu kontrolü - KARTELA ODASI MI?
      if (session.roomCode !== 'kartela_odasi') {
        setError('Kartela Odasına erişim yetkiniz yok!')
        setTimeout(() => router.push('/access'), 2000)
        return
      }
      
      // 4. Kullanıcı ve oda verilerini Supabase'den çek
      await Promise.all([
        loadUserData(session.userId),
        loadRoomData(session.roomId)
      ])
      
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
  
  const handleLogout = () => {
    localStorage.removeItem('room_session')
    router.push('/access')
  }
  
  const openFullscreenTransfer = () => {
    setFullscreenTransfer(true)
    setActiveTab('transfer')
  }
  
  const closeFullscreenTransfer = () => {
    setFullscreenTransfer(false)
    setActiveTab('dashboard')
  }
  
  // YENİ: Başarı mesajını temizle
  const clearSuccessMessage = () => {
    setSuccessMessage(null)
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Kartela Odası yükleniyor...</p>
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
  
  // TAM EKRAN TRANSFER MODU
  if (fullscreenTransfer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        {/* Transfer Header */}
        <header className="bg-white shadow-lg border-b sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <ArrowRightLeft className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Kartela Transfer Sistemi</h1>
                  <p className="text-gray-600">
                    Personel: <span className="font-semibold">{userData.ad}</span> • 
                    Oda: <span className="font-semibold">{roomData.oda_adi}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={closeFullscreenTransfer}
                  className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Kapat ve Ana Ekrana Dön
                </button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Tam Ekran Transfer */}
        <main className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <KartelaTransfer 
              currentOdaId={roomData.id}
              currentUserId={userData.id}
              onSuccess={() => {
                console.log('Transfer başarılı!')
              }}
            />
          </div>
        </main>
        
        {/* Transfer Footer */}
        <footer className="mt-8 py-6 border-t bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center text-sm text-gray-500">
              <p>Kartela Transfer Sistemi • QR Bazlı Kartela Al/Ver • V1.0</p>
              <p className="mt-2">Her işlem loglanır ve izlenebilir</p>
            </div>
          </div>
        </footer>
      </div>
    )
  }
  
  // NORMAL KARTELA ODASI EKRANI
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">K</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Kartela Odası</h1>
                  <p className="text-gray-600 text-sm">
                    Personel: <span className="font-semibold">{userData.ad}</span> • 
                    Oda: <span className="font-semibold">{roomData.oda_adi}</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-sm text-gray-500">
                Oda Kodu: <code className="bg-gray-100 px-2 py-1 rounded">KARTELA</code>
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
      
      {/* YENİ: Başarı Mesajı */}
      {successMessage && (
        <div className="container mx-auto px-4 mt-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {successMessage}
            </div>
            <button onClick={clearSuccessMessage} className="text-green-700 hover:text-green-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Navigation Tabs - GÜNCELLENDİ */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap ${
                activeTab === 'dashboard' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Home className="h-4 w-4" />
              Dashboard
            </button>
            
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap ${
                activeTab === 'search' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Search className="h-4 w-4" />
              Kartela Arama
            </button>
            
            {/* YENİ: Kartela CRUD Sekmesi */}
            <button
              onClick={() => setActiveTab('kartela-crud')}
              className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap ${
                activeTab === 'kartela-crud' 
                  ? 'text-green-600 border-b-2 border-green-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Sheet className="h-4 w-4" />
              Kartela Yönetimi
            </button>
            
            <button
              onClick={openFullscreenTransfer}
              className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap ${
                activeTab === 'transfer' 
                  ? 'text-purple-600 border-b-2 border-purple-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ArrowRightLeft className="h-4 w-4" />
              Transfer (Tam Ekran)
            </button>
            
            <button
              onClick={() => setActiveTab('rapor')}
              className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap ${
                activeTab === 'rapor' 
                  ? 'text-orange-600 border-b-2 border-orange-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              Raporlar
            </button>
          </div>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <QrCode className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Toplam Tarama</p>
                    <p className="text-2xl font-bold text-gray-900">1,248</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Package className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Günlük Transfer</p>
                    <p className="text-2xl font-bold text-gray-900">47</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Home className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Aktif Hücre</p>
                    <p className="text-2xl font-bold text-gray-900">156</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Hızlı İşlemler</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={openFullscreenTransfer}
                  className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all text-left"
                >
                  <ArrowRightLeft className="h-8 w-8 mb-4" />
                  <h3 className="font-bold text-lg">Kartela Transfer</h3>
                  <p className="text-sm opacity-90 mt-2">QR ile al/ver işlemi</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('search')}
                  className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all text-left"
                >
                  <Search className="h-8 w-8 mb-4" />
                  <h3 className="font-bold text-lg">Kartela Ara</h3>
                  <p className="text-sm opacity-90 mt-2">Detaylı arama yap</p>
                </button>
                
                {/* YENİ: Kartela Yönetimi Hızlı Butonu */}
                <button
                  onClick={() => setActiveTab('kartela-crud')}
                  className="p-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all text-left"
                >
                  <Package className="h-8 w-8 mb-4" />
                  <h3 className="font-bold text-lg">Kartela Yönetimi</h3>
                  <p className="text-sm opacity-90 mt-2">Ekle, düzenle, sil, listele</p>
                </button>
                
                <button className="p-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all text-left">
                  <QrCode className="h-8 w-8 mb-4" />
                  <h3 className="font-bold text-lg">QR Üret</h3>
                  <p className="text-sm opacity-90 mt-2">{"Yeni kartela QR'ı"}</p>
                </button>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Son Transferler</h2>
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">KRT-2024-00123</p>
                      <p className="text-sm text-gray-500">Kırmızı • 23011737.1</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">HCR-045 → HCR-102</p>
                      <p className="text-xs text-gray-500">10 dakika önce</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Kartela Arama Tab */}
        {activeTab === 'search' && (
          <div className="bg-white rounded-xl shadow p-1">
            <div className="p-5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Search className="h-5 w-5 text-blue-600" />
                    Kartela Arama ve Detay Görüntüleme
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Kartela numarası, renk kodu veya barkod ile arama yapın
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('kartela-crud')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Yönetime Git
                </button>
              </div>
              <KartelaSearch 
                currentRoom={roomData.oda_kodu} 
                currentUserId={userData.id} 
              />
            </div>
          </div>
        )}
        
        {/* YENİ: Kartela CRUD Tab */}
        {activeTab === 'kartela-crud' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Package className="h-6 w-6 text-green-600" />
                    Kartela Yönetim Paneli
                  </h2>
                  <p className="text-gray-600">
                    Kartela ekleme, düzenleme, silme, arşivleme ve listeleme işlemleri
                  </p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                  <span className="text-sm text-gray-600">Personel:</span>
                  <span className="ml-2 font-semibold text-green-700">{userData.ad}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {/* KartelaCRUD Component'i */}
              <KartelaCRUD 
                currentUserId={userData.id}
                currentOdaId={roomData.id}
                onKartelaEklendi={() => {
                  setSuccessMessage('Kartela başarıyla eklendi!')
                }}
                onKartelaGuncellendi={() => {
                  setSuccessMessage('Kartela başarıyla güncellendi!')
                }}
                onKartelaSilindi={() => {
                  setSuccessMessage('Kartela arşive alındı!')
                }}
              />
            </div>
          </div>
        )}
        
        {/* Rapor Tab */}
        {activeTab === 'rapor' && (
          <div className="bg-white rounded-xl shadow p-1">
            <div className="p-5">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Raporlar</h2>
              <RaporAlma 
                currentOdaId={roomData.id} 
                currentUserId={userData.id} 
              />
            </div>
          </div>
        )}
      </main>
      
      <footer className="mt-12 py-6 border-t bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <p>Kartela Takip Sistemi • Kartela Odası</p>
            <p className="mt-2 md:mt-0">
              QR Kodu: <code className="bg-gray-100 px-2 py-1 rounded">{roomData.qr_kodu || 'KARTELA-001'}</code>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
