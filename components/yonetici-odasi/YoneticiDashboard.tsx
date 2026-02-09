// app/yonetici-odasi/page.tsx - AYDINLIK TEMA & 100% WIDTH
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
  Package,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import YoneticiIstatistikler from './YoneticiIstatistikler';
import KullaniciYonetimi from './KullaniciYonetimi';
import OdaYonetimi from './OdaYonetimi';
import YetkiYonetimi from './YetkiYonetimi';
import DolapYonetimi from '@/components/DolapYonetimi';

const supabase = createClient();

interface YoneticiDashboardProps {
  currentUserId?: number;
}

type TabType = 'dashboard' | 'dolaplar' | 'kullanicilar' | 'odalar' | 'yetkiler' | 'loglar' | 'sistem';

export default function YoneticiDashboard({ currentUserId }: YoneticiDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sistemDurumu, setSistemDurumu] = useState({
    database: 'connected',
    api: 'online',
    uptime: '99.9%',
    lastBackup: '2 saat önce',
    activeSessions: 0,
    memoryUsage: '45%',
    cpuUsage: '12%',
    totalDolap: 24,
    activeDolap: 15,
    dolapDoluluk: '68%'
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

      const { count: activeSessions } = await supabase
        .from('sistem_loglari')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

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

  // MENÜ ÖĞELERİ
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'blue' },
    { id: 'dolaplar', label: 'Dolap Yönetimi', icon: Package, color: 'amber' },
    { id: 'kullanicilar', label: 'Kullanıcılar', icon: Users, color: 'green' },
    { id: 'odalar', label: 'Odalar', icon: Building, color: 'indigo' },
    { id: 'yetkiler', label: 'Yetkiler', icon: KeyRound, color: 'purple' },
    { id: 'loglar', label: 'Sistem Logları', icon: Database, color: 'gray' },
    { id: 'sistem', label: 'Sistem Ayarları', icon: Settings, color: 'gray' },
  ];

  const tabContents = {
    dashboard: (
      <div className="space-y-8">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Yönetici Kontrol Paneli
              </h1>
              <p className="text-gray-600 mt-2 text-base">
                Sistemin tamamını tek bir yerden yönetin ve izleyin
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                className="p-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                title="Yenile"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium shadow-sm">
                YÖNETİCİ MODU
              </div>
            </div>
          </div>
        </div>

        {/* İstatistikler */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📊 Sistem İstatistikleri</h2>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
              Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
            </div>
          </div>
          <YoneticiIstatistikler refreshTrigger={refreshKey % 2 === 0} />
        </div>

        {/* Sistem Durumu */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">🔧 Sistem Durumu</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Veritabanı */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Database className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Veritabanı</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {sistemDurumu.database === 'connected' ? 'Bağlı' : 'Bağlantı Yok'}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">PostgreSQL 15</span>
                <span className={`px-2 py-1 rounded-full text-xs ${sistemDurumu.database === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {sistemDurumu.database === 'connected' ? 'Aktif' : 'Kapalı'}
                </span>
              </div>
            </div>

            {/* API */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Server className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">API Servisi</p>
                  <p className="text-2xl font-bold text-gray-900">Çevrimiçi</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Uptime: {sistemDurumu.uptime}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  Stabil
                </span>
              </div>
            </div>

            {/* CPU */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Cpu className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">CPU Kullanımı</p>
                  <p className="text-2xl font-bold text-gray-900">{sistemDurumu.cpuUsage}</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Sunucu: VPS-1</span>
                <span className={`px-2 py-1 rounded-full text-xs ${parseInt(sistemDurumu.cpuUsage) > 80 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                  {parseInt(sistemDurumu.cpuUsage) > 80 ? 'Yüksek' : 'Normal'}
                </span>
              </div>
            </div>

            {/* DOLAP İSTATİSTİĞİ */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Package className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fiziksel Dolaplar</p>
                  <p className="text-2xl font-bold text-gray-900">{sistemDurumu.totalDolap}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{sistemDurumu.activeDolap} Aktif</span>
                  <span>{sistemDurumu.dolapDoluluk} doluluk</span>
                </div>
                <button
                  onClick={() => setActiveTab('dolaplar')}
                  className="w-full py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 text-sm font-medium transition-colors"
                >
                  Yönet
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hızlı İşlemler */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">🚀 Hızlı İşlemler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {menuItems.filter(item => item.id !== 'dashboard').map((item) => {
              const Icon = item.icon;
              const colorClasses = {
                amber: 'border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50',
                green: 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50',
                indigo: 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50',
                purple: 'border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50',
                blue: 'border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50',
                gray: 'border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100'
              };

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`p-5 border rounded-xl hover:shadow-lg transition-all text-left group ${colorClasses[item.color as keyof typeof colorClasses]}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-xl bg-white shadow-sm`}>
                      <Icon className={`h-6 w-6 text-${item.color}-600`} />
                    </div>
                    <div className="text-xs font-medium text-gray-500">{item.label.split(' ')[0].toUpperCase()}</div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.label}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {item.id === 'dolaplar' ? 'Fiziksel dolap yapısını yönet' :
                     item.id === 'kullanicilar' ? 'Sistem kullanıcılarını yönet' :
                     item.id === 'odalar' ? 'Fiziksel odaları yönet' :
                     item.id === 'yetkiler' ? 'Kullanıcı yetkilerini ayarla' :
                     'Sistem ayarlarını yapılandır'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Hemen eriş</span>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Son Aktivite */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-xl font-bold text-gray-900">📝 Son Sistem Aktiviteleri</h3>
            <button
              onClick={() => setActiveTab('loglar')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              Tüm Logları Gör
            </button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Admin giriş yaptı</p>
                    <p className="text-sm text-gray-600">IP: 192.168.1.{item} • Yönetici paneli</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-700">10 dakika önce</p>
                  <p className="text-xs text-green-600 font-medium">Başarılı</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),

    dolaplar: (
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <Package className="h-8 w-8 text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Dolap Yönetim Sistemi
                </h1>
                <p className="text-gray-600 mt-2 text-base">
                  Fiziksel dolapların, rafların ve hücrelerin tam yetkili yönetimi
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                className="p-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                title="Yenile"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <div className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg text-sm font-medium shadow-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                TAM YETKİLİ MOD
              </div>
            </div>
          </div>
        </div>
        
        {/* YÖNETİCİ UYARISI */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-800 text-lg mb-2">⚠️ YÖNETİCİ MODU - YÜKSEK DİKKAT!</p>
              <p className="text-red-700 mb-3">
                Bu panelde yapacağınız değişiklikler (dolap ekleme/silme/düzenleme) tüm fiziksel yapıyı etkiler.
                Her işlem loglanır ve geri alınamaz.
              </p>
              <div className="space-y-2 text-sm text-amber-800">
                <p className="flex items-center gap-2">
                  <span className="text-red-600">•</span>
                  Dolap yapısı değişirse, kartela yerleştirme işlemleri etkilenir
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-red-600">•</span>
                  Raf veya hücre silinirse, içindeki kartelalar sistemden çıkarılır
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-red-600">•</span>
                  Kapasite değişiklikleri stok hesaplamalarını etkiler
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* DOLAP YÖNETİMİ COMPONENT'İ */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <DolapYonetimi isAdmin={true} />
        </div>

        {/* Footer Note */}
        <div className="text-center text-sm text-gray-500">
          <p>Her işlem otomatik olarak loglanır ve izlenebilir • Son güncelleme: {new Date().toLocaleString('tr-TR')}</p>
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
      <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
        <Database className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Sistem Logları</h3>
        <p className="text-gray-600 mb-6">Bu özellik yakında eklenecek</p>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Dashboard'a Dön
        </button>
      </div>
    ),

    sistem: (
      <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
        <Settings className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Sistem Ayarları</h3>
        <p className="text-gray-600 mb-6">Bu özellik yakında eklenecek</p>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Dashboard'a Dön
        </button>
      </div>
    )
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ÜST BAR */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Yönetici Paneli</h1>
                  <p className="text-sm text-gray-600">Sistem yönetimi ve konfigürasyon</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm text-gray-500">Yönetici</p>
                <p className="font-bold text-gray-900">Admin Kullanıcı</p>
              </div>
              
              <button className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:shadow-md font-medium flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        {/* SİDEBAR */}
        {sidebarOpen && (
          <div className="w-64 bg-white border-r min-h-[calc(100vh-80px)] fixed lg:static top-20 z-40 lg:z-auto h-full lg:h-auto">
            <div className="p-4 h-full overflow-y-auto">
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-bold text-blue-800">YÖNETİCİ MODU</span>
                </div>
                <p className="text-xs text-blue-700">
                  Tam yetkili sistem yönetimi
                </p>
              </div>
              
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as TabType)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-left ${
                        isActive 
                          ? `bg-${item.color}-50 text-${item.color}-700 border border-${item.color}-200 shadow-sm` 
                          : 'text-gray-700 hover:bg-gray-50 hover:border hover:border-gray-200'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isActive ? `bg-white shadow` : 'bg-gray-100'}`}>
                        <Icon className={`h-4 w-4 ${isActive ? `text-${item.color}-600` : 'text-gray-500'}`} />
                      </div>
                      <span className="font-medium">{item.label}</span>
                      {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                    </button>
                  );
                })}
              </nav>
              
              {/* SİSTEM DURUMU */}
              <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <h3 className="font-bold text-gray-900 mb-3">Sistem Durumu</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Veritabanı</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Aktif</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">API</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Çalışıyor</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Güvenlik</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Aktif</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ANA İÇERİK - 100% WIDTH */}
        <main className={`flex-1 ${sidebarOpen ? 'lg:ml-0' : ''} w-full`}>
          <div className="p-6 w-full">
            {tabContents[activeTab]}
          </div>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="border-t bg-white py-6 mt-8">
        <div className="w-full px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-sm text-gray-600">
            <div>
              <p>© 2024 Kartela Takip Sistemi • Yönetici Paneli v1.0</p>
              <p className="mt-1 text-xs text-gray-500">
                Son erişim: {new Date().toLocaleTimeString('tr-TR')} • 
                Aktif dolaplar: {sistemDurumu.activeDolap}/{sistemDurumu.totalDolap}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Sistem: Çevrimiçi</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span>Güvenli Bağlantı</span>
              </div>
              <div className="text-xs text-gray-500">
                {new Date().toLocaleDateString('tr-TR')}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}