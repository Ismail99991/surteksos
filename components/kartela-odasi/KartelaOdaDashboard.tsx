'use client'

import { useState } from 'react'
import { 
  PlusCircle, 
  RefreshCw, 
  UserPlus, 
  Search,
  BarChart3,
  Package,
  Users,
  Clock,
  ArrowUpRight
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/common/Button'
import CreateKartelaForm from './CreateKartelaForm'
import ResetKartelaModal from './ResetKartelaModal'
import AssignToCustomer from './AssignToCustomer'

interface KartelaOdaDashboardProps {
  roomName: string
}

export default function KartelaOdaDashboard({ roomName }: KartelaOdaDashboardProps) {
  const [activeModal, setActiveModal] = useState<'create' | 'reset' | 'assign' | null>(null)
  const [stats, setStats] = useState({
    totalKartelalar: 3472,
    bosKartelalar: 156,
    doluKartelalar: 84,
    musteriKartelalari: 3232,
    son24Saat: 12,
  })

  const recentActivity = [
    { id: 1, action: 'Kartela Oluşturuldu', kartela: '231010045.1', user: 'Ahmet', time: '10:30' },
    { id: 2, action: 'Kartela Sıfırlandı', kartela: '231010012.1', user: 'Mehmet', time: '09:15' },
    { id: 3, action: 'Müşteriye Atandı', kartela: '231010078.1', user: 'Ayşe', time: 'Yesterday' },
    { id: 4, action: 'Arşive Verildi', kartela: '231010003.1', user: 'Ali', time: 'Yesterday' },
  ]

  const handleCreateKartela = (data: any) => {
    console.log('Yeni kartela:', data)
    alert(`✅ Yeni kartela oluşturuldu: ${data.renk_kodu}`)
    setStats(prev => ({ ...prev, totalKartelalar: prev.totalKartelalar + 1 }))
  }

  const handleResetKartela = (kartelaNo: string, reason: string) => {
    console.log('Kartela sıfırlandı:', kartelaNo, reason)
    alert(`✅ Kartela sıfırlandı: ${kartelaNo}`)
    setStats(prev => ({ ...prev, doluKartelalar: prev.doluKartelalar - 1 }))
  }

  const handleAssignToCustomer = (data: any) => {
    console.log('Müşteriye atandı:', data)
    alert(`✅ Kartela ${data.kartela.renk_kodu} ${data.customer.name} müşterisine atandı!`)
    setStats(prev => ({ ...prev, musteriKartelalari: prev.musteriKartelalari + 1 }))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          🏢 {roomName} Dashboard
        </h1>
        <p className="text-gray-600 text-lg">
          Kartela yönetimi, oluşturma ve müşteri atama işlemleri
        </p>
      </div>

      {/* Hızlı İşlemler */}
      <Card className="p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">⚡ Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => setActiveModal('create')}
            className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-lg">
                <PlusCircle className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900 text-lg">Yeni Kartela</h3>
                <p className="text-gray-600 text-sm">Yeni renk kartelası oluştur</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-blue-600 text-sm">
              <span>Hemen oluştur</span>
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </div>
          </button>

          <button
            onClick={() => setActiveModal('reset')}
            className="p-6 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-xl hover:from-amber-100 hover:to-amber-200 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-lg">
                <RefreshCw className="w-8 h-8 text-amber-600" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900 text-lg">Kartela Sıfırla</h3>
                <p className="text-gray-600 text-sm">Dolu kartelayı sıfırla</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-amber-600 text-sm">
              <span>{stats.doluKartelalar} dolu var</span>
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </div>
          </button>

          <button
            onClick={() => setActiveModal('assign')}
            className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-lg">
                <UserPlus className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900 text-lg">Müşteriye Ata</h3>
                <p className="text-gray-600 text-sm">Kartelayı müşteriye özel yap</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-purple-600 text-sm">
              <span>{stats.musteriKartelalari} müşteri kartelası</span>
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </div>
          </button>
        </div>
      </Card>

      {/* İstatistikler */}
      <Card className="p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Kartela İstatistikleri
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-700">Toplam</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalKartelalar}</p>
            <p className="text-sm text-gray-500">Kartela</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700">Boş</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.bosKartelalar}</p>
            <p className="text-sm text-gray-500">Kullanıma hazır</p>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-amber-700">Dolu</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.doluKartelalar}</p>
            <p className="text-sm text-gray-500">14 göz dolu</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-purple-700">Müşteri</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.musteriKartelalari}</p>
            <p className="text-sm text-gray-500">Özel kartela</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700">24 Saat</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">+{stats.son24Saat}</p>
            <p className="text-sm text-gray-500">Yeni işlem</p>
          </div>
        </div>
      </Card>

      {/* Son Aktiviteler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">📋 Son Aktiviteler</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.kartela}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{activity.user}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">🔍 Hızlı Arama</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kartela Ara
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Renk kodu, müşteri adı..."
                  className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">💡 İpuçları</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Dolu kartelaları sıfırlamadan önce kontrol edin</li>
                <li>• Yeni kartela oluştururken format: YYMMXXXX.X</li>
                <li>• Müşteri atamaları geri alınamaz</li>
                <li>• Günlük backup otomatik alınır</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Modals */}
      {activeModal === 'create' && (
        <CreateKartelaForm
          onClose={() => setActiveModal(null)}
          onCreate={handleCreateKartela}
        />
      )}
      
      {activeModal === 'reset' && (
        <ResetKartelaModal
          onClose={() => setActiveModal(null)}
          onReset={handleResetKartela}
        />
      )}
      
      {activeModal === 'assign' && (
        <AssignToCustomer
          onClose={() => setActiveModal(null)}
          onAssign={handleAssignToCustomer}
        />
      )}
    </div>
  )
}
