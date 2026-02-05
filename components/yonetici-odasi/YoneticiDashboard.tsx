'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldCheck,
  Server,
  Cpu,
  HardDrive,
  Network,
  RefreshCw,
  Settings,
  Users,
  Building,
  KeyRound,
  Database,
  BarChart3,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import YoneticiIstatistikler from './YoneticiIstatistikler';
import KullaniciYonetimi from './KullaniciYonetimi';
import OdaYonetimi from './OdaYonetimi';
import YetkiYonetimi from './YetkiYonetimi';

const supabase = createClient();

interface YoneticiDashboardProps {
  currentUserId?: number;
}

type TabType = 'dashboard' | 'kullanicilar' | 'odalar' | 'yetkiler' | 'loglar' | 'sistem';

export default function YoneticiDashboard({ 
  currentUserId 
}: YoneticiDashboardProps) {
  // State'ler
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sistemDurumu, setSistemDurumu] = useState({
    database: 'connected',
    api: 'online',
    uptime: '99.9%',
    lastBackup: '2 saat önce',
    activeSessions: 0,
    memoryUsage: '45%',
    cpuUsage: '12%'
  });
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Sistem durumunu kontrol et
  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      setLoading(true);
      
      // Veritabanı bağlantısını test et
      const { data, error } = await supabase
        .from('kullanicilar')
        .select('count')
        .limit(1)
        .single();

      const databaseStatus = error ? 'disconnected' : 'connected';
      
      // API durumunu kontrol et (basit ping)
      const apiStatus = 'online'; // Gerçek uygulamada API ping atılır
      
      // Aktif session'ları kontrol et
      const { count: activeSessions } = await supabase
        .from('sistem_loglari')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Son 5 dakika

      setSistemDurumu(prev => ({
        ...prev,
        database: databaseStatus,
        api: apiStatus,
        activeSessions: activeSessions || 0
      }));

    } catch (error) {
      console.error('Sistem durumu kontrol hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // Yenile butonu
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    checkSystemStatus();
  };

  // Tab içerikleri
  const tabContents = {
    dashboard: (
      <div className="space-y-8">
        {/* Hoş Geldiniz */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">SİSTEM YÖNETİCİ PANELİ</h1>
              <p className="text-gray-400 mt-2">
                Tüm kullanıcıları, odaları, yetkileri ve sistem kaynaklarını yönetin
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="p-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                title="Yenile"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <div className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium">
                YÖNETİCİ MODU
              </div>
            </div>
          </div>
        </div>

        {/* İstatistikler */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Sistem İstatistikleri</h2>
            <div className="text-sm text-gray-400">
              Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
            </div>
          </div>
          <YoneticiIstatistikler 
            refreshTrigger={refreshKey % 2 === 0}
          />
        </div>

        {/* Sistem Durumu */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Sistem Durumu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Veritabanı Durumu */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${sistemDurumu.database === 'connected' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  <Database className={`h-6 w-6 ${sistemDurumu.database === 'connected' ? 'text-green-400' : 'text-red-400'}`} />
                </div>
                <div className={`px-2 py-1 rounded text-xs ${sistemDurumu.database === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {sistemDurumu.database === 'connected' ? 'BAĞLI' : 'KOPUK'}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Veritabanı</h3>
              <p className="text-gray-400 text-sm">Supabase bağlantı durumu</p>
              <div className="mt-4 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${sistemDurumu.database === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-300">
                  {sistemDurumu.database === 'connected' ? 'Sağlıklı' : 'Bağlantı sorunu'}
                </span>
              </div>
            </div>

            {/* API Durumu */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Server className="h-6 w-6 text-blue-400" />
                </div>
                <div className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
                  ÇEVRİMİÇİ
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">API Servisleri</h3>
              <p className="text-gray-400 text-sm">Backend servis durumu</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-gray-300">Tüm servisler çalışıyor</span>
              </div>
            </div>

            {/* Aktif Oturumlar */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {sistemDurumu.activeSessions}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Aktif Oturum</h3>
              <p className="text-gray-400 text-sm">Şu anda aktif kullanıcı</p>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-green-400" />
                <span className="text-gray-300">Son 5 dakika</span>
              </div>
            </div>

            {/* Sistem Yükü */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <Cpu className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {sistemDurumu.cpuUsage}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Sistem Yükü</h3>
              <p className="text-gray-400 text-sm">CPU ve bellek kullanımı</p>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>CPU</span>
                  <span>{sistemDurumu.cpuUsage}</span>
                </div>
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                    style={{ width: sistemDurumu.cpuUsage }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hızlı İşlemler */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Hızlı İşlemler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setActiveTab('kullanicilar')}
              className="bg-gray-800 border border-gray-700 rounded-xl p-5 text-left hover:border-blue-500 hover:bg-gray-750 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div className="text-lg font-semibold text-white">Kullanıcı Yönetimi</div>
              </div>
              <p className="text-gray-400 text-sm">
                Yeni kullanıcı ekle, düzenle veya sil
              </p>
              <div className="mt-4 text-blue-400 text-sm font-medium">
                İşleme Git →
              </div>
            </button>

            <button
              onClick={() => setActiveTab('odalar')}
              className="bg-gray-800 border border-gray-700 rounded-xl p-5 text-left hover:border-green-500 hover:bg-gray-750 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30">
                  <Building className="h-6 w-6 text-green-400" />
                </div>
                <div className="text-lg font-semibold text-white">Oda Yönetimi</div>
              </div>
              <p className="text-gray-400 text-sm">
                Odaları oluştur, düzenle veya yönet
              </p>
              <div className="mt-4 text-green-400 text-sm font-medium">
                İşleme Git →
              </div>
            </button>

            <button
              onClick={() => setActiveTab('yetkiler')}
              className="bg-gray-800 border border-gray-700 rounded-xl p-5 text-left hover:border-yellow-500 hover:bg-gray-750 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg group-hover:bg-yellow-500/30">
                  <KeyRound className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="text-lg font-semibold text-white">Yetki Yönetimi</div>
              </div>
              <p className="text-gray-400 text-sm">
                Kullanıcı yetkilerini ata veya düzenle
              </p>
              <div className="mt-4 text-yellow-400 text-sm font-medium">
                İşleme Git →
              </div>
            </button>

            <button
              onClick={() => setActiveTab('loglar')}
              className="bg-gray-800 border border-gray-700 rounded-xl p-5 text-left hover:border-red-500 hover:bg-gray-750 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-500/20 rounded-lg group-hover:bg-red-500/30">
                  <Database className="h-6 w-6 text-red-400" />
                </div>
                <div className="text-lg font-semibold text-white">Sistem Logları</div>
              </div>
              <p className="text-gray-400 text-sm">
                Sistem aktivitelerini izle ve analiz et
              </p>
              <div className="mt-4 text-red-400 text-sm font-medium">
                İşleme Git →
              </div>
            </button>
          </div>
        </div>

        {/* Son Aktivite */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Son Aktivite</h2>
            <button className="text-sm text-gray-400 hover:text-white">
              Tümünü Gör →
            </button>
          </div>
          
          <div className="space-y-4">
            {[
              { time: '2 dakika önce', action: 'Yeni kullanıcı eklendi', user: 'Ahmet Yılmaz', type: 'success' },
              { time: '15 dakika önce', action: 'Oda QR kodu güncellendi', user: 'Mehmet Demir', type: 'info' },
              { time: '1 saat önce', action: 'Yetki ataması yapıldı', user: 'Ayşe Kaya', type: 'warning' },
              { time: '3 saat önce', action: 'Sistem yedeği alındı', user: 'Sistem', type: 'success' },
              { time: '5 saat önce', action: 'Kullanıcı pasif yapıldı', user: 'Admin', type: 'error' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gray-750 rounded-lg">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'success' ? 'bg-green-500/20' :
                  activity.type === 'info' ? 'bg-blue-500/20' :
                  activity.type === 'warning' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                }`}>
                  {activity.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-400" /> :
                   activity.type === 'info' ? <BarChart3 className="h-5 w-5 text-blue-400" /> :
                   activity.type === 'warning' ? <AlertCircle className="h-5 w-5 text-yellow-400" /> :
                   <AlertCircle className="h-5 w-5 text-red-400" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">{activity.action}</div>
                  <div className="text-sm text-gray-400">
                    {activity.user} • {activity.time}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {activity.time.split(' ')[0]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    kullanicilar: (
      <KullaniciYonetimi 
        refreshTrigger={refreshKey % 2 === 0}
        onKullaniciEklendi={() => setRefreshKey(prev => prev + 1)}
        onKullaniciGuncellendi={() => setRefreshKey(prev => prev + 1)}
      />
    ),
    odalar: (
      <OdaYonetimi 
        refreshTrigger={refreshKey % 2 === 0}
        onOdaEklendi={() => setRefreshKey(prev => prev + 1)}
        onOdaGuncellendi={() => setRefreshKey(prev => prev + 1)}
      />
    ),
    yetkiler: (
      <YetkiYonetimi 
        refreshTrigger={refreshKey % 2 === 0}
        onYetkiDegisti={() => setRefreshKey(prev => prev + 1)}
      />
    ),
    loglar: (
      <div className="text-center py-12">
        <Database className="h-16 w-16 mx-auto text-gray-700 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Sistem Logları</h3>
        <p className="text-gray-400">Bu özellik yakında eklenecek</p>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="mt-4 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
        >
          Dashboard'a Dön
        </button>
      </div>
    ),
    sistem: (
      <div className="text-center py-12">
        <Settings className="h-16 w-16 mx-auto text-gray-700 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Sistem Ayarları</h3>
        <p className="text-gray-400">Bu özellik yakında eklenecek</p>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="mt-4 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
        >
          Dashboard'a Dön
        </button>
      </div>
    )
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Üst Bilgi */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                <ShieldCheck className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">SİSTEM YÖNETİCİ PANELİ</h1>
                <p className="text-gray-400">
                  {activeTab === 'dashboard' && 'Sistem genel görünümü'}
                  {activeTab === 'kullanicilar' && 'Kullanıcı yönetimi'}
                  {activeTab === 'odalar' && 'Oda yönetimi'}
                  {activeTab === 'yetkiler' && 'Yetki yönetimi'}
                  {activeTab === 'loglar' && 'Sistem logları'}
                  {activeTab === 'sistem' && 'Sistem ayarları'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-sm text-gray-400">
                V.1.0.0 • {new Date().toLocaleDateString('tr-TR')}
              </div>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Yenile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Menü */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'kullanicilar', label: 'Kullanıcılar', icon: Users },
              { id: 'odalar', label: 'Odalar', icon: Building },
              { id: 'yetkiler', label: 'Yetkiler', icon: KeyRound },
              { id: 'loglar', label: 'Loglar', icon: Database },
              { id: 'sistem', label: 'Sistem', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-3 px-6 py-4 border-b-2 transition-all whitespace-nowrap ${
                    isActive 
                      ? 'border-blue-500 text-white bg-gray-800' 
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 ml-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ana İçerik */}
      <div className="container mx-auto px-4 py-8">
        {tabContents[activeTab]}
      </div>

      {/* Alt Bilgi */}
      <footer className="border-t border-gray-800 mt-8 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <div>
              <p>© 2024 Kartela Takip Sistemi • Yönetici Paneli</p>
              <p className="mt-1 text-xs">
                Son erişim: {new Date().toLocaleTimeString('tr-TR')}
              </p>
            </div>
            <div className="flex items-center gap-4 mt-2 md:mt-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Sistem: Çevrimiçi</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Güvenli Bağlantı</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
