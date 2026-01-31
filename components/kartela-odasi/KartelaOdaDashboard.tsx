'use client';

import { useState, useEffect } from 'react'; // ← useEffect ekle
import { 
  PlusCircle, RefreshCw, Package, Search, 
  BarChart3, MapPin, Filter, Users,
  FileText, QrCode, Printer, Download
} from 'lucide-react';
import CreateKartelaForm from './CreateKartelaForm';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

type Kartela = Database['public']['Tables']['kartelalar']['Row'] & {
  renk_masalari?: {
    pantone_kodu: string | null;
    hex_kodu: string | null;
  };
  hucreler?: {
    hucre_kodu: string;
    hucre_adi: string;
    kapasite: number;
    mevcut_kartela_sayisi: number;
  };
};

interface KartelaOdaDashboardProps {
  roomName: string;
  currentUserId?: number;
}

export default function KartelaOdaDashboard({ roomName, currentUserId }: KartelaOdaDashboardProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [kartelalar, setKartelalar] = useState<Kartela[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    dolu: 0,
    archive: 0
  });

  // EN ÖNEMLİ DEĞİŞİKLİK: as any ekle
  const supabase = createClient() as any;

  // İstatistikleri getir
  const fetchStats = async () => {
    try {
      // Toplam kartela
      const { count: total, error: totalError } = await supabase
        .from('kartelalar')
        .select('*', { count: 'exact', head: true })
        .eq('silindi', false);

      // Aktif kartelalar
      const { count: active, error: activeError } = await supabase
        .from('kartelalar')
        .select('*', { count: 'exact', head: true })
        .eq('silindi', false)
        .eq('durum', 'AKTIF');

      // Dolu kartelalar
      const { count: dolu, error: doluError } = await supabase
        .from('kartelalar')
        .select('*', { count: 'exact', head: true })
        .eq('silindi', false)
        .eq('durum', 'DOLU');

      // Arşiv kartelalar
      const { count: archive, error: archiveError } = await supabase
        .from('kartelalar')
        .select('*', { count: 'exact', head: true })
        .eq('silindi', false)
        .eq('durum', 'KARTELA_ARSIV');

      setStats({
        total: total || 0,
        active: active || 0,
        dolu: dolu || 0,
        archive: archive || 0
      });
    } catch (error) {
      console.error('İstatistik yüklenemedi:', error);
    }
  };

  // Son kartelaları getir
  const fetchRecentKartelalar = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kartelalar')
        .select(`
          *,
          renk_masalari!inner (
            pantone_kodu,
            hex_kodu
          ),
          hucreler!left (
            hucre_kodu,
            hucre_adi,
            kapasite,
            mevcut_kartela_sayisi
          )
        `)
        .eq('silindi', false)
        .order('olusturulma_tarihi', { ascending: false })
        .limit(10);

      if (error) throw error;
      setKartelalar(data || []);
    } catch (error) {
      console.error('Kartelalar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme - useEffect ile düzelt
  useEffect(() => {
    fetchStats();
    fetchRecentKartelalar();
  }, []); // ← Boş dependency array

  const handleCreateSuccess = () => {
    fetchStats();
    fetchRecentKartelalar();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{roomName}</h1>
          <p className="text-gray-600 mt-2">
            Kartela oluşturma, arşivleme ve yönetim işlemleri
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchStats();
              fetchRecentKartelalar();
            }}
            className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            title="Yenile"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Toplam Kartela</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total}</p>
            </div>
            <Package className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Aktif Kartela</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{stats.active}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium">Dolu (Arşiv Bekliyor)</p>
              <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.dolu}</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 font-medium">Arşivde</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.archive}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <MapPin className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Hızlı Aksiyonlar */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Hızlı İşlemler</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            <PlusCircle className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">Yeni Kartela Oluştur</div>
              <div className="text-sm opacity-90">Renk masasından kartela aç</div>
            </div>
          </button>

          <button className="flex items-center gap-3 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition">
            <QrCode className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">QR Okut</div>
              <div className="text-sm opacity-90">Kartela barkodu tarat</div>
            </div>
          </button>

          <button className="flex items-center gap-3 px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition">
            <Search className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">Kartela Ara</div>
              <div className="text-sm opacity-90">Renk kodu veya adı ile</div>
            </div>
          </button>

          <button className="flex items-center gap-3 px-6 py-4 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition">
            <Printer className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">Etiket Yazdır</div>
              <div className="text-sm opacity-90">Kartela etiketi bas</div>
            </div>
          </button>
        </div>
      </div>

      {/* Son Kartelalar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Son Kartelalar</h2>
          <button className="text-blue-600 hover:text-blue-800 font-medium">
            Tümünü Gör →
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Kartelalar yükleniyor...</p>
          </div>
        ) : kartelalar.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kartelalar.map((kartela) => (
              <div key={kartela.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-gray-900">{kartela.kartela_no}</div>
                    <div className="text-sm text-gray-600">{kartela.renk_kodu}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    kartela.durum === 'AKTIF' ? 'bg-green-100 text-green-800' :
                    kartela.durum === 'DOLU' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {kartela.durum}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="font-medium text-gray-800">{kartela.renk_adi}</div>
                  {kartela.musteri_adi && (
                    <div className="text-sm text-gray-600 mt-1">🏢 {kartela.musteri_adi}</div>
                  )}
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Göz: {kartela.goz_sayisi}/14
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(kartela.olusturulma_tarihi).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">Henüz kartela bulunmuyor</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              İlk Kartelayı Oluştur
            </button>
          </div>
        )}
      </div>

      {/* Create Kartela Form Modal */}
      {showCreateForm && (
        <CreateKartelaForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleCreateSuccess}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}