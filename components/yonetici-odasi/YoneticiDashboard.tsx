// app/yonetici-odasi/page.tsx - GÜNCELLENMİŞ VERSİYON
'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldCheck,
  Server,
  Cpu,
  Users,
  Building,
  KeyRound,
  Database,
  BarChart3,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Settings,
  Package, // YENİ: Dolap icon'u
  ChevronRight // YENİ: Ok icon'u
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import YoneticiIstatistikler from './YoneticiIstatistikler';
import KullaniciYonetimi from './KullaniciYonetimi';
import OdaYonetimi from './OdaYonetimi';
import YetkiYonetimi from './YetkiYonetimi';
import DolapYonetimi from '@/components/DolapYonetimi'; // YENİ IMPORT

const supabase = createClient();

interface YoneticiDashboardProps {
  currentUserId?: number;
}

// TabType'a 'dolaplar' ekleyin
type TabType = 'dashboard' | 'kullanicilar' | 'odalar' | 'yetkiler' | 'loglar' | 'sistem' | 'dolaplar';

export default function YoneticiDashboard({ currentUserId }: YoneticiDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sistemDurumu, setSistemDurumu] = useState({
    database: 'connected',
    api: 'online',
    uptime: '99.9%',
    lastBackup: '2 saat önce',
    activeSessions: 0,
    memoryUsage: '45%',
    cpuUsage: '12%',
    totalDolap: 24, // YENİ: Dolap istatistiği
    activeDolap: 15, // YENİ: Aktif dolap sayısı
    dolapDoluluk: '68%' // YENİ: Ortalama doluluk
  });
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('kullanicilar')
        .select('count')
        .limit(1)
        .single();

      const databaseStatus = error ? 'disconnected' : 'connected';
      const apiStatus = 'online';

      const { count: activeSessions } = await supabase
        .from('sistem_loglari')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

      // YENİ: Dolap istatistiklerini çek
      const { data: dolapData } = await supabase
        .from('dolaplar')
        .select('id, aktif, doluluk_orani');

      const totalDolap = dolapData?.length || 0;
      const activeDolap = dolapData?.filter(d => d.aktif).length || 0;
      const avgDoluluk = dolapData && dolapData.length > 0 
        ? Math.round(dolapData.reduce((sum, d) => sum + (d.doluluk_orani || 0), 0) / dolapData.length)
        : 0;

      setSistemDurumu(prev => ({
        ...prev,
        database: databaseStatus,
        api: apiStatus,
        activeSessions: activeSessions || 0,
        totalDolap,
        activeDolap,
        dolapDoluluk: `${avgDoluluk}%`
      }));
    } catch (error) {
      console.error('Sistem durumu kontrol hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    checkSystemStatus();
  };

  const tabContents = {
    dashboard: (
      <div className="space-y-8">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                SİSTEM YÖNETİCİ PANELİ
              </h1>
              <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
                Tüm kullanıcıları, odaları, yetkileri ve sistem kaynaklarını yönetin
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleRefresh}
                className="p-2.5 sm:p-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors active:scale-[0.98]"
                title="Yenile"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <div className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium">
                YÖNETİCİ MODU
              </div>
            </div>
          </div>
        </div>

        {/* İstatistikler */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Sistem İstatistikleri</h2>
            <div className="text-xs sm:text-sm text-gray-400">
              Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
            </div>
          </div>
          <YoneticiIstatistikler refreshTrigger={refreshKey % 2 === 0} />
        </div>

        {/* Sistem Durumu */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Sistem Durumu</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Veritabanı */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${sistemDurumu.database === 'connected' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  <Database className={`h-5 w-5 ${sistemDurumu.database === 'connected' ? 'text-green-400' : 'text-red-400'}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Veritabanı</p>
                  <p className="text-xl font-bold text-white">
                    {sistemDurumu.database === 'connected' ? 'Bağlı' : 'Bağlantı Yok'}
                  </p>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>PostgreSQL 15</span>
                <span className={`${sistemDurumu.database === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
                  {sistemDurumu.database === 'connected' ? '● Aktif' : '● Kapalı'}
                </span>
              </div>
            </div>

            {/* API */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Server className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">API Servisi</p>
                  <p className="text-xl font-bold text-white">Çevrimiçi</p>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Uptime: {sistemDurumu.uptime}</span>
                <span className="text-green-400">● Stabil</span>
              </div>
            </div>

            {/* CPU */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Cpu className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">CPU Kullanımı</p>
                  <p className="text-xl font-bold text-white">{sistemDurumu.cpuUsage}</p>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Sunucu: VPS-1</span>
                <span className={parseInt(sistemDurumu.cpuUsage) > 80 ? 'text-amber-400' : 'text-green-400'}>
                  {parseInt(sistemDurumu.cpuUsage) > 80 ? '● Yüksek' : '● Normal'}
                </span>
              </div>
            </div>

            {/* YENİ: DOLAP İSTATİSTİĞİ */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Package className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Fiziksel Dolaplar</p>
                  <p className="text-xl font-bold text-white">{sistemDurumu.totalDolap}</p>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{sistemDurumu.activeDolap} Aktif</span>
                <span>{sistemDurumu.dolapDoluluk} doluluk</span>
              </div>
              <button
                onClick={() => setActiveTab('dolaplar')}
                className="mt-3 w-full py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm transition-colors"
              >
                Yönet
              </button>
            </div>
          </div>
        </div>

        {/* Hızlı İşlemler */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Hızlı İşlemler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Kullanıcı Ekle */}
            <button
              onClick={() => setActiveTab('kullanicilar')}
              className="p-4 sm:p-5 bg-gray-800 border border-gray-700 rounded-xl hover:border-blue-500 transition-colors text-left group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div className="text-xs text-gray-400 font-medium">KULLANICI</div>
              </div>
              <h3 className="font-bold text-white mb-1">Kullanıcı Ekle</h3>
              <p className="text-sm text-gray-400">
                Yeni sistem kullanıcısı oluştur
              </p>
              <div className="mt-3 text-xs text-blue-400 flex items-center gap-1">
                Hemen ekle <ChevronRight className="h-3 w-3" />
              </div>
            </button>

            {/* Oda Oluştur */}
            <button
              onClick={() => setActiveTab('odalar')}
              className="p-4 sm:p-5 bg-gray-800 border border-gray-700 rounded-xl hover:border-green-500 transition-colors text-left group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Building className="h-5 w-5 text-green-400" />
                </div>
                <div className="text-xs text-gray-400 font-medium">ODA</div>
              </div>
              <h3 className="font-bold text-white mb-1">Oda Oluştur</h3>
              <p className="text-sm text-gray-400">
                Yeni fiziksel oda tanımla
              </p>
              <div className="mt-3 text-xs text-green-400 flex items-center gap-1">
                Tanımla <ChevronRight className="h-3 w-3" />
              </div>
            </button>

            {/* YENİ: DOLAP YÖNETİMİ BUTONU */}
            <button
              onClick={() => setActiveTab('dolaplar')}
              className="p-4 sm:p-5 bg-gray-800 border border-gray-700 rounded-xl hover:border-yellow-500 transition-colors text-left group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Package className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="text-xs text-gray-400 font-medium">DOLAP</div>
              </div>
              <h3 className="font-bold text-white mb-1">Dolap Yönetimi</h3>
              <p className="text-sm text-gray-400">
                Fiziksel dolap yapısını yönet
              </p>
              <div className="mt-3 text-xs text-yellow-400 flex items-center gap-1">
                Yönetici <ChevronRight className="h-3 w-3" />
              </div>
            </button>

            {/* Sistem Ayarları */}
            <button
              onClick={() => setActiveTab('sistem')}
              className="p-4 sm:p-5 bg-gray-800 border border-gray-700 rounded-xl hover:border-purple-500 transition-colors text-left group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Settings className="h-5 w-5 text-purple-400" />
                </div>
                <div className="text-xs text-gray-400 font-medium">SİSTEM</div>
              </div>
              <h3 className="font-bold text-white mb-1">Sistem Ayarları</h3>
              <p className="text-sm text-gray-400">
                Genel sistem ayarlarını yap
              </p>
              <div className="mt-3 text-xs text-purple-400 flex items-center gap-1">
                Yapılandır <ChevronRight className="h-3 w-3" />
              </div>
            </button>
          </div>
        </div>

        {/* Son Aktivite */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-white">Son Sistem Aktiviteleri</h3>
            <button
              onClick={() => setActiveTab('loglar')}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm"
            >
              Tüm Logları Gör
            </button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Activity className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Admin giriş yaptı</p>
                    <p className="text-sm text-gray-400">IP: 192.168.1.{item} • Yönetici paneli</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-300">10 dakika önce</p>
                  <p className="text-xs text-gray-500">Başarılı</p>
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
        <Database className="h-14 w-14 mx-auto text-gray-700 mb-3" />
        <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Sistem Logları</h3>
        <p className="text-gray-400">Bu özellik yakında eklenecek</p>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="mt-4 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 active:scale-[0.98]"
        >
          Dashboard'a Dön
        </button>
      </div>
    ),

    sistem: (
      <div className="text-center py-12">
        <Settings className="h-14 w-14 mx-auto text-gray-700 mb-3" />
        <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Sistem Ayarları</h3>
        <p className="text-gray-400">Bu özellik yakında eklenecek</p>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="mt-4 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 active:scale-[0.98]"
        >
          Dashboard'a Dön
        </button>
      </div>
    ),

    // YENİ: DOLAP YÖNETİMİ TAB'I
    dolaplar: (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <Package className="h-7 w-7 sm:h-8 sm:w-8 text-yellow-400" />
                Dolap Yönetim Sistemi
              </h2>
              <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
                Fiziksel dolapların, rafların ve hücrelerin tam yetkili yönetimi
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-amber-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                TAM YETKİLİ MOD
              </div>
              <button
                onClick={handleRefresh}
                className="p-2.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                title="Yenile"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
        
        {/* YÖNETİCİ UYARISI */}
        <div className="bg-gradient-to-r from-red-900/30 to-amber-900/30 border border-red-700 rounded-xl p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-400 mt-0.5" />
            <div>
              <p className="font-bold text-red-300 text-base sm:text-lg">YÖNETİCİ MODU - YÜKSEK DİKKAT!</p>
              <p className="text-red-200 mt-1 sm:mt-2 text-sm sm:text-base">
                Bu panelde yapacağınız değişiklikler (dolap ekleme/silme/düzenleme) tüm fiziksel yapıyı etkiler.
                Her işlem loglanır ve geri alınamaz.
              </p>
              <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-amber-300 space-y-1">
                <p className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Dolap yapısı değişirse, kartela yerleştirme işlemleri etkilenir
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Raf veya hücre silinirse, içindeki kartelalar sistemden çıkarılır
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Kapasite değişiklikleri stok hesaplamalarını etkiler
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* DOLAP YÖNETİMİ COMPONENT'İ */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <DolapYonetimi isAdmin={true} />
        </div>

        {/* Footer Note */}
        <div className="text-center text-sm text-gray-500">
          <p>Her işlem otomatik olarak loglanır ve izlenebilir • Son güncelleme: {new Date().toLocaleString('tr-TR')}</p>
        </div>
      </div>
    )
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Top Bar */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                <ShieldCheck className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                  SİSTEM YÖNETİCİ PANELİ
                </h1>
                <p className="text-gray-400 text-sm sm:text-base">
                  {activeTab === 'dashboard' && 'Sistem genel görünümü'}
                  {activeTab === 'kullanicilar' && 'Kullanıcı yönetimi'}
                  {activeTab === 'odalar' && 'Oda yönetimi'}
                  {activeTab === 'yetkiler' && 'Yetki yönetimi'}
                  {activeTab === 'loglar' && 'Sistem logları'}
                  {activeTab === 'sistem' && 'Sistem ayarları'}
                  {activeTab === 'dolaplar' && 'Dolap yönetimi'} {/* YENİ */}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-xs sm:text-sm text-gray-400">
                V.1.0.0 • {new Date().toLocaleDateString('tr-TR')}
              </div>
              <button
                onClick={handleRefresh}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 flex items-center gap-2 active:scale-[0.98]"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Yenile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - YENİ DOLAP TAB'I EKLENDİ */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto">
          <div className="flex overflow-x-auto no-scrollbar -mx-4 px-4">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'dolaplar', label: 'Dolaplar', icon: Package, color: 'yellow' }, // YENİ TAB
              { id: 'kullanicilar', label: 'Kullanıcılar', icon: Users, color: 'blue' },
              { id: 'odalar', label: 'Odalar', icon: Building, color: 'green' },
              { id: 'yetkiler', label: 'Yetkiler', icon: KeyRound, color: 'purple' },
              { id: 'loglar', label: 'Loglar', icon: Database, color: 'gray' },
              { id: 'sistem', label: 'Sistem', icon: Settings, color: 'gray' }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const colorClass = tab.color || 'blue';

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? `border-${colorClass}-500 text-white bg-gray-800`
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="font-medium">{tab.label}</span>
                  {isActive && (
                    <div className={`w-2 h-2 rounded-full bg-${colorClass}-500 ml-1`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {tabContents[activeTab]}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-6 sm:mt-8 py-5 sm:py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs sm:text-sm text-gray-500">
            <div>
              <p>© 2024 Kartela Takip Sistemi • Yönetici Paneli</p>
              <p className="mt-1 text-xs">
                Son erişim: {new Date().toLocaleTimeString('tr-TR')} • 
                Aktif dolaplar: {sistemDurumu.activeDolap}/{sistemDurumu.totalDolap}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
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