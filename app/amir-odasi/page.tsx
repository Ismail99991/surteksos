'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import { 
  User, 
  Shield, 
  Search, 
  Package, 
  Home, 
  ArrowRightLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  Layers,
  MapPin,
  Building,
  Settings
} from 'lucide-react'
import KartelaSearch from '@/components/kartela/KartelaSearch'
import KartelaTransfer from '@/components/KartelaTransfer'

const supabase = createClient()

type UserType = Database['public']['Tables']['kullanicilar']['Row']
type RoomType = Database['public']['Tables']['odalar']['Row']

type ActiveTab = 'dashboard' | 'search' | 'transfer' | 'raflar' | 'raporlar'

export default function AmirOdasiPage() {
  const router = useRouter()
  const [roomData, setRoomData] = useState<RoomType | null>(null)
  const [userData, setUserData] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')
  const [amirRaflari, setAmirRaflari] = useState<any[]>([])
  const [selectedAmirRaf, setSelectedAmirRaf] = useState<any>(null)

  const amirDolaplari = [
    {
      id: 1,
      kod: 'AMIR-DOLAP-01',
      adi: 'Amir Onay Dolabı',
      aciklama: 'Onay bekleyen kartelalar',
      oda_id: 1,
      raflar: [
        { id: 101, kod: 'AMIR-RAF-A', adi: 'İnceleme Rafı', hucre_sayisi: 4 },
        { id: 102, kod: 'AMIR-RAF-B', adi: 'Onay Bekleyen Raf', hucre_sayisi: 6 },
        { id: 103, kod: 'AMIR-RAF-C', adi: 'Onaylanmış Raf', hucre_sayisi: 8 },
      ]
    },
    {
      id: 2,
      kod: 'AMIR-DOLAP-02',
      adi: 'Amir Arşiv Dolabı',
      aciklama: 'Arşivlenmiş kartelalar',
      oda_id: 1,
      raflar: [
        { id: 201, kod: 'AMIR-RAF-D', adi: 'Kalite Arşiv Rafı', hucre_sayisi: 10 },
        { id: 202, kod: 'AMIR-RAF-E', adi: 'Geçmiş Dönem Rafı', hucre_sayisi: 12 },
      ]
    }
  ]

  useEffect(() => {
    checkAccessAndLoadData()
  }, [])

  const checkAccessAndLoadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const sessionStr = localStorage.getItem('room_session')
      if (!sessionStr) {
        router.push('/access')
        return
      }

      const session = JSON.parse(sessionStr)

      if (session.roomCode !== 'amir_odasi') {
        setError('Amir Odasına erişim yetkiniz yok!')
        setTimeout(() => router.push('/access'), 2000)
        return
      }

      const { data: user } = await supabase
        .from('kullanicilar')
        .select('*')
        .eq('id', Number(session.userId))
        .single()

      if (!user || !user.sistem_yoneticisi) {
        setError('Amir Odası için yetkiniz bulunmamaktadır!')
        setTimeout(() => router.push('/access'), 2000)
        return
      }

      await Promise.all([
        loadUserData(session.userId),
        loadRoomData(session.roomId),
        loadAmirRaflari()
      ])

    } catch (error) {
      console.error('Hata:', error)
      setError('Yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const loadUserData = async (userId: string) => {
    const { data } = await supabase
      .from('kullanicilar')
      .select('*')
      .eq('id', Number(userId))
      .single()
    setUserData(data)
  }

  const loadRoomData = async (roomId: string) => {
    const { data } = await supabase
      .from('odalar')
      .select('*')
      .eq('id', Number(roomId))
      .single()
    setRoomData(data)
  }

  const loadAmirRaflari = async () => {
    const raflar = [
      { id: 1, kod: 'AMIR-RAF-ONAY', adi: 'Onay Rafı', dolap_kodu: 'AMIR-DOLAP-01', hucre_sayisi: 4, kapasite: 40, mevcut: 12 },
      { id: 2, kod: 'AMIR-RAF-KALITE', adi: 'Kalite Rafı', dolap_kodu: 'AMIR-DOLAP-01', hucre_sayisi: 6, kapasite: 60, mevcut: 25 },
      { id: 3, kod: 'AMIR-RAF-ARSIV', adi: 'Arşiv Rafı', dolap_kodu: 'AMIR-DOLAP-02', hucre_sayisi: 8, kapasite: 80, mevcut: 45 },
      { id: 4, kod: 'AMIR-RAF-GECICI', adi: 'Geçici Raf', dolap_kodu: 'AMIR-DOLAP-01', hucre_sayisi: 4, kapasite: 40, mevcut: 8 },
    ]
    setAmirRaflari(raflar)
  }

  const handleLogout = () => {
    localStorage.removeItem('room_session')
    router.push('/access')
  }

  const handleTransferSuccess = () => {
    // Transfer başarılı olduğunda raf listesini güncelle
    loadAmirRaflari()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Amir Odası yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Erişim Hatası</h2>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={() => router.push('/access')}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    )
  }

  if (!roomData || !userData) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      <header className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white shadow-xl">
        <div className="container mx-auto px-6 py-5">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Shield className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Amir Odası</h1>
                <p className="text-purple-200">
                  Sistem Yöneticisi: <span className="font-semibold">{userData.ad} {userData.soyad}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-sm bg-white/10 px-4 py-2 rounded-lg">
                <Building className="inline w-4 h-4 mr-2" />
                Oda: <span className="font-bold">{roomData.oda_kodu}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-3 px-6 py-4 font-medium whitespace-nowrap ${activeTab === 'dashboard' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Home className="h-5 w-5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-3 px-6 py-4 font-medium whitespace-nowrap ${activeTab === 'search' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Search className="h-5 w-5" />
              Kartela Ara
            </button>
            <button
              onClick={() => setActiveTab('transfer')}
              className={`flex items-center gap-3 px-6 py-4 font-medium whitespace-nowrap ${activeTab === 'transfer' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <ArrowRightLeft className="h-5 w-5" />
              Kartela Transfer
            </button>
            <button
              onClick={() => setActiveTab('raflar')}
              className={`flex items-center gap-3 px-6 py-4 font-medium whitespace-nowrap ${activeTab === 'raflar' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Layers className="h-5 w-5" />
              Amir Rafları
            </button>
            <button
              onClick={() => setActiveTab('raporlar')}
              className={`flex items-center gap-3 px-6 py-4 font-medium whitespace-nowrap ${activeTab === 'raporlar' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Settings className="h-5 w-5" />
              Raporlar
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Onay Bekleyen</p>
                    <p className="text-2xl font-bold text-gray-900">23</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Onaylanmış</p>
                    <p className="text-2xl font-bold text-gray-900">156</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Reddedilmiş</p>
                    <p className="text-2xl font-bold text-gray-900">8</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Layers className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amir Rafları</p>
                    <p className="text-2xl font-bold text-gray-900">4</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Building className="h-5 w-5 text-purple-600" />
                Amir Odası Dolapları
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {amirDolaplari.map((dolap) => (
                  <div key={dolap.id} className="border border-gray-200 rounded-lg p-5 hover:border-purple-300 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900">{dolap.kod}</h3>
                        <p className="text-gray-600">{dolap.adi}</p>
                        <p className="text-sm text-gray-500 mt-1">{dolap.aciklama}</p>
                      </div>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        {dolap.raflar.length} Raf
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500 font-medium">Raflar:</p>
                      {dolap.raflar.map((raf) => (
                        <div key={raf.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium text-gray-800">{raf.kod}</span>
                            <p className="text-xs text-gray-500">{raf.adi}</p>
                          </div>
                          <span className="text-sm text-gray-600">{raf.hucre_sayisi} hücre</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => setActiveTab('transfer')}
                className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-xl p-6 hover:shadow-lg transition-all text-left"
              >
                <ArrowRightLeft className="h-8 w-8 mb-4" />
                <h3 className="font-bold text-lg">Kartela Transfer</h3>
                <p className="text-sm opacity-90 mt-2">Amir rafları arasında transfer</p>
              </button>
              
              <button
                onClick={() => setActiveTab('search')}
                className="bg-gradient-to-r from-blue-600 to-cyan-700 text-white rounded-xl p-6 hover:shadow-lg transition-all text-left"
              >
                <Search className="h-8 w-8 mb-4" />
                <h3 className="font-bold text-lg">Kartela Ara</h3>
                <p className="text-sm opacity-90 mt-2">Tüm kartelaları görüntüle</p>
              </button>
              
              <button className="bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl p-6 hover:shadow-lg transition-all text-left">
                <CheckCircle className="h-8 w-8 mb-4" />
                <h3 className="font-bold text-lg">Toplu Onay</h3>
                <p className="text-sm opacity-90 mt-2">Çoklu kartela onayı</p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="bg-white rounded-xl shadow">
            <div className="p-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Search className="h-6 w-6 text-purple-600" />
                  Amir Kartela Arama
                </h2>
                <p className="text-gray-600 mt-2">
                  Tüm kartelaları görüntüleyebilir, onay/red işlemi yapabilirsiniz
                </p>
              </div>
              <KartelaSearch 
                currentRoom={roomData.oda_kodu}
                currentUserId={userData.id}
              />
            </div>
          </div>
        )}

        {activeTab === 'transfer' && (
          <div className="bg-white rounded-xl shadow">
            <div className="p-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <ArrowRightLeft className="h-6 w-6 text-purple-600" />
                  Kartela Transfer Sistemi
                </h2>
                <p className="text-gray-600 mt-2">
                  Kartelaları transfer edin - İşlemler <span className="font-bold text-purple-600">{roomData.oda_kodu}</span> odasına loglanacak
                </p>
              </div>
              
              <KartelaTransfer 
                currentOdaId={roomData.id}
                currentUserId={userData.id}
                onSuccess={handleTransferSuccess}
              />
            </div>
          </div>
        )}

        {activeTab === 'raflar' && (
          <div className="bg-white rounded-xl shadow">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Layers className="h-6 w-6 text-purple-600" />
                Amir Odası Rafları
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {amirRaflari.map((raf) => (
                  <div 
                    key={raf.id} 
                    onClick={() => setSelectedAmirRaf(raf)}
                    className={`border rounded-xl p-5 cursor-pointer transition-all hover:shadow-md ${selectedAmirRaf?.id === raf.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900">{raf.kod}</h3>
                        <p className="text-gray-600 text-sm">{raf.adi}</p>
                        <p className="text-xs text-gray-500 mt-1">{raf.dolap_kodu}</p>
                      </div>
                      <div className={`p-2 rounded-lg ${raf.mevcut / raf.kapasite > 0.8 ? 'bg-red-100' : 'bg-green-100'}`}>
                        <span className={`text-sm font-bold ${raf.mevcut / raf.kapasite > 0.8 ? 'text-red-800' : 'text-green-800'}`}>
                          {Math.round((raf.mevcut / raf.kapasite) * 100)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Hücre:</span>
                        <span className="font-medium">{raf.hucre_sayisi}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Kapasite:</span>
                        <span className="font-medium">{raf.kapasite}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Mevcut:</span>
                        <span className="font-medium">{raf.mevcut}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${raf.mevcut / raf.kapasite > 0.8 ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${(raf.mevcut / raf.kapasite) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedAmirRaf && (
                <div className="mt-8 p-6 bg-gray-50 rounded-xl border">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {selectedAmirRaf.kod} - {selectedAmirRaf.adi}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-sm text-gray-500">Toplam Kapasite</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedAmirRaf.kapasite}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-sm text-gray-500">Kullanılan</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedAmirRaf.mevcut}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-sm text-gray-500">Boş Kapasite</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedAmirRaf.kapasite - selectedAmirRaf.mevcut}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-sm text-gray-500">Doluluk Oranı</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.round((selectedAmirRaf.mevcut / selectedAmirRaf.kapasite) * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'raporlar' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Amir Raporları</h2>
            <p className="text-gray-600">Rapor modülü hazırlanıyor...</p>
          </div>
        )}
      </main>

      <footer className="mt-12 py-6 border-t bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-600" />
              <p>Amir Odası • Sistem Yönetim Paneli</p>
            </div>
            <div className="mt-2 md:mt-0">
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">
                Yetki Seviyesi: SİSTEM YÖNETİCİSİ
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
