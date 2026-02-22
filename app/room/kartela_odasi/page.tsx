'use client'

import { useRouter } from 'next/navigation'
import RaporAlma from '@/components/rapor/RaporAlma'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import KartelaSearch from '@/components/kartela/KartelaSearch'
import KartelaTransfer from '@/components/KartelaTransfer'
import KartelaCRUD from '@/components/kartela/KartelaCRUD'
import RenkCRUD from '@/components/kartela/RenkCRUD'
import { 
  QrCode, 
  ClipboardList, 
  Sheet, 
  Search, 
  Package, 
  Home, 
  ArrowRightLeft, 
  X, 
  Palette,
  Clock,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react'

// Supabase client
const supabase = createClient()

// Tür tanımlamaları
type UserType = Database['public']['Tables']['kullanicilar']['Row']
type RoomType = Database['public']['Tables']['odalar']['Row']
type ActiveTab = 'search' | 'transfer' | 'dashboard' | 'rapor' | 'kartela-crud' | 'renk-crud'

// Dashboard istatistik tipleri
interface DashboardStats {
  toplamHareket: number
  gunlukHareket: number
  aktifHucreSayisi: number
  toplamKartela: number
  bugunEklenen: number
  kritikStok: number
}

// Son hareket tipi
interface SonHareket {
  id: string
  kartela_no: string
  hareket_tipi: string
  eski_hucre_kodu: string | null
  yeni_hucre_kodu: string | null
  eski_goz_sayisi: number | null
  yeni_goz_sayisi: number | null
  eski_durum: string | null
  yeni_durum: string | null
  kullanici_kodu: string | null
  aciklama: string | null
  tarih: string
}

export default function KartelaOdasiPage() {
  const router = useRouter()
  
  const [roomData, setRoomData] = useState<RoomType | null>(null)
  const [userData, setUserData] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')
  const [fullscreenTransfer, setFullscreenTransfer] = useState(false)
  const [fullscreenKartela, setFullscreenKartela] = useState(false)
  const [fullscreenRenk, setFullscreenRenk] = useState(false)
  
  // Dashboard verileri için state'ler
  const [stats, setStats] = useState<DashboardStats>({
    toplamHareket: 0,
    gunlukHareket: 0,
    aktifHucreSayisi: 0,
    toplamKartela: 0,
    bugunEklenen: 0,
    kritikStok: 0
  })
  const [sonHareketler, setSonHareketler] = useState<SonHareket[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  
  // Başarı mesajları için state
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  useEffect(() => {
    checkSessionAndLoadData()
  }, [])
  
  // Dashboard verilerini yükle
  useEffect(() => {
    if (roomData && userData && activeTab === 'dashboard') {
      loadDashboardData()
    }
  }, [roomData, userData, activeTab])
  
  const loadDashboardData = async () => {
    try {
      setLoadingStats(true)
      
      // 1. Toplam hareket sayısı
      const { count: toplamHareket } = await supabase
        .from('hareket_loglari')
        .select('*', { count: 'exact', head: true })
      
      // 2. Günlük hareket (bugünkü loglar)
      const bugun = new Date()
      bugun.setHours(0, 0, 0, 0)
      
      const { count: gunlukHareket } = await supabase
        .from('hareket_loglari')
        .select('*', { count: 'exact', head: true })
        .gte('tarih', bugun.toISOString())
      
      // 3. Aktif hücre sayısı (dolu olan hücreler)
      const { count: hucreCount } = await supabase
        .from('hucreler')
        .select('*', { count: 'exact', head: true })
        .eq('durum', 'dolu')
        .eq('aktif', true)
      
      // 4. Toplam kartela sayısı
      const { count: kartelaCount } = await supabase
        .from('kartela')
        .select('*', { count: 'exact', head: true })
        .eq('aktif', true)
      
      // 5. Bugün eklenen kartela sayısı
      const { count: bugunEklenenCount } = await supabase
        .from('kartela')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', bugun.toISOString())
      
      // 6. Kritik stok (10'un altında)
      const { count: kritikCount } = await supabase
        .from('kartela')
        .select('*', { count: 'exact', head: true })
        .lt('miktar', 10)
        .gt('miktar', 0)
      
      setStats({
        toplamHareket: toplamHareket || 0,
        gunlukHareket: gunlukHareket || 0,
        aktifHucreSayisi: hucreCount || 0,
        toplamKartela: kartelaCount || 0,
        bugunEklenen: bugunEklenenCount || 0,
        kritikStok: kritikCount || 0
      })
      
      // 7. Son 10 hareketi getir
      const { data: hareketler } = await supabase
        .from('hareket_loglari')
        .select(`
          id,
          kartela_no,
          hareket_tipi,
          eski_hucre_kodu,
          yeni_hucre_kodu,
          eski_goz_sayisi,
          yeni_goz_sayisi,
          eski_durum,
          yeni_durum,
          kullanici_kodu,
          aciklama,
          tarih
        `)
        .order('tarih', { ascending: false })
        .limit(10)
      
      if (hareketler) {
        setSonHareketler(hareketler as SonHareket[])
      }
      
    } catch (error) {
      console.error('Dashboard verileri yüklenirken hata:', error)
    } finally {
      setLoadingStats(false)
    }
  }
  
  const checkSessionAndLoadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const sessionStr = localStorage.getItem('room_session')
      if (!sessionStr) {
        router.push('/access')
        return
      }
      
      const session = JSON.parse(sessionStr)
      
      const expiresAt = new Date(session.expiresAt)
      if (expiresAt <= new Date()) {
        localStorage.removeItem('room_session')
        router.push('/access')
        return
      }
      
      if (session.roomCode !== 'kartela_odasi') {
        setError('Kartela Odasına erişim yetkiniz yok!')
        setTimeout(() => router.push('/access'), 2000)
        return
      }
      
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
    setFullscreenKartela(false)
    setFullscreenRenk(false)
    setActiveTab('transfer')
  }
  
  const openFullscreenKartela = () => {
    setFullscreenKartela(true)
    setFullscreenTransfer(false)
    setFullscreenRenk(false)
    setActiveTab('kartela-crud')
  }
  
  const openFullscreenRenk = () => {
    setFullscreenRenk(true)
    setFullscreenTransfer(false)
    setFullscreenKartela(false)
    setActiveTab('renk-crud')
  }
  
  const closeFullscreen = () => {
    setFullscreenTransfer(false)
    setFullscreenKartela(false)
    setFullscreenRenk(false)
    setActiveTab('dashboard')
  }
  
  const clearSuccessMessage = () => {
    setSuccessMessage(null)
  }
  
  // Format tarih
  const formatTarih = (tarih: string) => {
    const now = new Date()
    const date = new Date(tarih)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Şimdi'
    if (diffMins < 60) return `${diffMins} dakika önce`
    if (diffHours < 24) return `${diffHours} saat önce`
    return `${diffDays} gün önce`
  }
  
  // Hareket tipine göre renk ve etiket
  const getHareketTipiInfo = (tip: string) => {
    switch(tip?.toLowerCase()) {
      case 'transfer':
        return { renk: 'bg-blue-100 text-blue-700', etiket: 'TRANSFER' }
      case 'alis':
      case 'giris':
        return { renk: 'bg-green-100 text-green-700', etiket: 'GİRİŞ' }
      case 'veris':
      case 'cikis':
        return { renk: 'bg-red-100 text-red-700', etiket: 'ÇIKIŞ' }
      case 'duzenle':
      case 'guncelle':
        return { renk: 'bg-yellow-100 text-yellow-700', etiket: 'DÜZENLE' }
      default:
        return { renk: 'bg-gray-100 text-gray-700', etiket: tip || 'İŞLEM' }
    }
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
                  onClick={closeFullscreen}
                  className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Kapat ve Ana Ekrana Dön
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <KartelaTransfer 
              currentOdaId={roomData.id}
              currentUserId={userData.id}
              onSuccess={() => {
                setSuccessMessage('Transfer başarıyla tamamlandı!')
                loadDashboardData()
              }}
            />
          </div>
        </main>
      </div>
    )
  }
  
  // TAM EKRAN KARTELA YÖNETİMİ MODU
  if (fullscreenKartela) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <header className="bg-white shadow-lg border-b sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Kartela Yönetim Sistemi</h1>
                  <p className="text-gray-600">
                    Personel: <span className="font-semibold">{userData.ad}</span> • 
                    Oda: <span className="font-semibold">{roomData.oda_adi}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={closeFullscreen}
                  className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Kapat ve Ana Ekrana Dön
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <KartelaCRUD 
              currentUserId={userData.id}
              currentOdaId={roomData.id}
              onKartelaEklendi={() => {
                setSuccessMessage('Kartela başarıyla eklendi!')
                loadDashboardData()
              }}
            />
          </div>
        </main>
      </div>
    )
  }
  
  // TAM EKRAN RENK MASASI MODU
  if (fullscreenRenk) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <header className="bg-white shadow-lg border-b sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Palette className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Renk Masası Yönetimi</h1>
                  <p className="text-gray-600">
                    Personel: <span className="font-semibold">{userData.ad}</span> • 
                    Oda: <span className="font-semibold">{roomData.oda_adi}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={closeFullscreen}
                  className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Kapat ve Ana Ekrana Dön
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <RenkCRUD 
              onRenkEklendi={() => {
                setSuccessMessage('Renk başarıyla eklendi!')
                loadDashboardData()
              }}
              onRenkGuncellendi={() => {
                setSuccessMessage('Renk başarıyla güncellendi!')
              }}
              onRenkSilindi={() => {
                setSuccessMessage('Renk başarıyla silindi!')
              }}
            />
          </div>
        </main>
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
      
      {/* Başarı Mesajı */}
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
      
      {/* Navigation Tabs */}
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
            
            <button
              onClick={openFullscreenKartela}
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
              onClick={openFullscreenRenk}
              className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap ${
                activeTab === 'renk-crud' 
                  ? 'text-purple-600 border-b-2 border-purple-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Palette className="h-4 w-4" />
              Renk Masası
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
              Transfer
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
        {/* Dashboard Tab - GERÇEK VERİLERLE */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Quick Stats - Gerçek veriler */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <QrCode className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Toplam Hareket</p>
                    {loadingStats ? (
                      <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <p className="text-xl font-bold text-gray-900">{stats.toplamHareket.toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ArrowRightLeft className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Günlük Hareket</p>
                    {loadingStats ? (
                      <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <p className="text-xl font-bold text-gray-900">{stats.gunlukHareket}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Aktif Hücre</p>
                    {loadingStats ? (
                      <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <p className="text-xl font-bold text-gray-900">{stats.aktifHucreSayisi}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Sheet className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Toplam Kartela</p>
                    {loadingStats ? (
                      <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <p className="text-xl font-bold text-gray-900">{stats.toplamKartela}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Clock className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Bugün Eklenen</p>
                    {loadingStats ? (
                      <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <p className="text-xl font-bold text-gray-900">{stats.bugunEklenen}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Kritik Stok</p>
                    {loadingStats ? (
                      <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <p className="text-xl font-bold text-gray-900">{stats.kritikStok}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions - Aynı kalsın */}
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
                
                <button
                  onClick={openFullscreenKartela}
                  className="p-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all text-left"
                >
                  <Sheet className="h-8 w-8 mb-4" />
                  <h3 className="font-bold text-lg">Kartela Yönetimi</h3>
                  <p className="text-sm opacity-90 mt-2">Ekle, arşivle, listele</p>
                </button>
                
                <button
                  onClick={openFullscreenRenk}
                  className="p-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all text-left"
                >
                  <Palette className="h-8 w-8 mb-4" />
                  <h3 className="font-bold text-lg">Renk Masası</h3>
                  <p className="text-sm opacity-90 mt-2">Renk ekle, düzenle, listele</p>
                </button>
              </div>
            </div>
            
            {/* Recent Activity - Gerçek son hareketler */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Son Hareketler</h2>
                <button 
                  onClick={() => setActiveTab('rapor')}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Tümünü Gör
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
              
              {loadingStats ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="h-5 w-32 bg-gray-200 animate-pulse rounded mb-2"></div>
                        <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 w-28 bg-gray-200 animate-pulse rounded mb-2"></div>
                        <div className="h-3 w-20 bg-gray-200 animate-pulse rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : sonHareketler.length > 0 ? (
                <div className="space-y-4">
                  {sonHareketler.map((hareket) => {
                    const tipInfo = getHareketTipiInfo(hareket.hareket_tipi)
                    return (
                      <div key={hareket.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {hareket.kartela_no}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${tipInfo.renk}`}>
                              {tipInfo.etiket}
                            </span>
                          </p>
                          <p className="text-sm text-gray-500">
                            {hareket.eski_hucre_kodu || '-'} → {hareket.yeni_hucre_kodu || '-'}
                            {hareket.aciklama && ` • ${hareket.aciklama}`}
                          </p>
                          {(hareket.eski_goz_sayisi !== null || hareket.yeni_goz_sayisi !== null) && (
                            <p className="text-xs text-gray-400 mt-1">
                              Göz: {hareket.eski_goz_sayisi || 0} → {hareket.yeni_goz_sayisi || 0}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {hareket.kullanici_kodu || 'Bilinmiyor'} • {formatTarih(hareket.tarih)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Henüz hiç hareket kaydı yok
                </div>
              )}
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
                  onClick={openFullscreenKartela}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Sheet className="h-4 w-4" />
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
              Son Güncelleme: {new Date().toLocaleTimeString('tr-TR')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
