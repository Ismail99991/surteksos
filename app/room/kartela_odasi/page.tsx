'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import KartelaSearch from '@/components/kartela/KartelaSearch'
import KartelaOdaDashboard from '@/components/kartela-odasi/KartelaOdaDashboard'

// Supabase client
const supabase = createClient()

// Tür tanımlamaları
type UserType = Database['public']['Tables']['kullanicilar']['Row']
type RoomType = Database['public']['Tables']['odalar']['Row']

export default function KartelaOdasiPage() {
  const router = useRouter()
  
  const [roomData, setRoomData] = useState<RoomType | null>(null)
  const [userData, setUserData] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
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
        .eq('id', userId)
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
        .eq('id', roomId)
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
                    Personel: <span className="font-semibold">{userData.ad}</span>
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
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Kartela Odası Dashboard */}
        <div className="mb-8">
          <KartelaOdaDashboard 
            roomName="Kartela Odası"
            currentUserId={userData.id}
          />
        </div>
        
        {/* Ortak: Kartela Arama */}
        <div className="mt-12">
          <div className="bg-white rounded-xl shadow p-1 mb-6">
            <div className="p-5">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Kartela Arama ve Detay Görüntüleme
              </h2>
              <p className="text-gray-600 mb-6 text-sm">
                Kartela numarası, müşteri adı veya barkod ile detaylı arama yapın
              </p>
              <KartelaSearch 
                currentRoom={roomData.oda_kodu} 
                currentUserId={userData.id} 
              />
            </div>
          </div>
        </div>
        
        {/* Ek Kartela Odası Component'leri */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Kartela Yönetim Araçları
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Buraya diğer Kartela Odası component'leri gelecek */}
            {/* Örnek: CreateKartelaForm, AssignToCustomer, ResetKartelaModal */}
          </div>
        </div>
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
