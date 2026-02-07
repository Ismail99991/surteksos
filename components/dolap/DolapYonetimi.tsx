'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Grid, 
  Layers, 
  Building, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  RefreshCw,
  BarChart3,
  MapPin,
  Users,
  Settings,
  Check,
  X
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

const supabase = createClient();

type DolapType = Database['public']['Tables']['dolaplar']['Row'];
type RafType = Database['public']['Tables']['raflar']['Row'];
type OdaType = Database['public']['Tables']['odalar']['Row'];
type HucreType = Database['public']['Tables']['hucreler']['Row'];

interface DolapYonetimiProps {
  currentOdaId?: number;
}

export default function DolapYonetimi({ currentOdaId }: DolapYonetimiProps) {
  // State'ler
  const [dolaplar, setDolaplar] = useState<DolapType[]>([]);
  const [raflar, setRaflar] = useState<RafType[]>([]);
  const [hucreler, setHucreler] = useState<HucreType[]>([]);
  const [odalar, setOdalar] = useState<OdaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtreler
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOdaId, setSelectedOdaId] = useState<number | 'all'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Verileri yükle
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Paralel olarak tüm verileri çek
      const [
        { data: dolaplarData, error: dolaplarError },
        { data: raflarData, error: raflarError },
        { data: hucrelerData, error: hucrelerError },
        { data: odalarData, error: odalarError }
      ] = await Promise.all([
        supabase.from('dolaplar').select('*').order('dolap_kodu'),
        supabase.from('raflar').select('*').order('raf_kodu'),
        supabase.from('hucreler').select('*').order('hucre_kodu'),
        supabase.from('odalar').select('*').eq('aktif', true).order('oda_kodu')
      ]);

      if (dolaplarError) throw dolaplarError;
      if (raflarError) throw raflarError;
      if (hucrelerError) throw hucrelerError;
      if (odalarError) throw odalarError;

      setDolaplar(dolaplarData || []);
      setRaflar(raflarData || []);
      setHucreler(hucrelerData || []);
      setOdalar(odalarData || []);

    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      setError('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Filtrelenmiş dolaplar
  const filteredDolaplar = dolaplar.filter(dolap => {
    // Oda filtresi
    const dolapOdaId = (dolap as any).oda_id;
    if (selectedOdaId !== 'all' && dolapOdaId && dolapOdaId !== selectedOdaId) {
      return false;
    }

    // Aktif/pasif filtresi
    if (activeFilter === 'active' && !dolap.aktif) return false;
    if (activeFilter === 'inactive' && dolap.aktif) return false;

    // Arama sorgusu
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      const oda = odalar.find(o => o.id === dolap.oda_id);
      const matchesSearch = 
        dolap.dolap_kodu.toLowerCase().includes(queryLower) ||
        dolap.dolap_adi.toLowerCase().includes(queryLower) ||
        (oda?.oda_adi || '').toLowerCase().includes(queryLower) ||
        (oda?.oda_kodu || '').toLowerCase().includes(queryLower);

      if (!matchesSearch) return false;
    }

    return true;
  });

  // Bir dolabın raflarını getir
  const getDolapRaflari = (dolapId: number) => {
    return raflar.filter(raf => raf.dolap_id === dolapId);
  };

  // Bir rafın hücrelerini getir
  const getRafHucreleri = (rafId: number) => {
    return hucreler.filter(hucre => hucre.raf_id === rafId);
  };

  // İstatistikler
  const stats = {
    toplamDolap: dolaplar.length,
    aktifDolap: dolaplar.filter(d => d.aktif).length,
    toplamRaf: raflar.length,
    toplamHucre: hucreler.length,
    toplamKapasite: dolaplar.reduce((sum, dolap) => sum + (dolap.toplam_kapasite || 0), 0),
    kullanilanKapasite: dolaplar.reduce((sum, dolap) => sum + (dolap.mevcut_kartela_sayisi || 0), 0),
    ortalamaDoluluk: dolaplar.length > 0 
      ? dolaplar.reduce((sum, dolap) => sum + (dolap.doluluk_orani || 0), 0) / dolaplar.length 
      : 0
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-800 rounded-lg animate-pulse"></div>
        <div className="h-64 bg-gray-800 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık ve İstatistikler */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Dolap Yönetimi</h2>
          <p className="text-gray-400">Dolap → Raf → Hücre hiyerarşisi</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="px-3 py-1 bg-gray-800 rounded-lg">
            <span className="text-gray-400 text-sm">Dolap: </span>
            <span className="text-white font-semibold">{stats.toplamDolap}</span>
          </div>
          <div className="px-3 py-1 bg-blue-500/20 rounded-lg">
            <span className="text-blue-400 text-sm">Raf: </span>
            <span className="text-blue-400 font-semibold">{stats.toplamRaf}</span>
          </div>
          <div className="px-3 py-1 bg-green-500/20 rounded-lg">
            <span className="text-green-400 text-sm">Hücre: </span>
            <span className="text-green-400 font-semibold">{stats.toplamHucre}</span>
          </div>
          <div className="px-3 py-1 bg-purple-500/20 rounded-lg">
            <span className="text-purple-400 text-sm">Kapasite: </span>
            <span className="text-purple-400 font-semibold">
              {stats.kullanilanKapasite.toLocaleString()}/{stats.toplamKapasite.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Arama ve Filtreler */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Arama */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Dolap kodu, adı veya oda ara..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-white"
              />
            </div>
          </div>

          {/* Filtreler */}
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedOdaId}
              onChange={(e) => setSelectedOdaId(
                e.target.value === 'all' ? 'all' : parseInt(e.target.value)
              )}
              className="px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            >
              <option value="all">Tüm Odalar</option>
              {odalar.map(oda => (
                <option key={oda.id} value={oda.id}>
                  {oda.oda_adi} ({oda.oda_kodu})
                </option>
              ))}
            </select>

            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as any)}
              className="px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
            </select>

            <button
              onClick={loadAllData}
              className="px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Yenile
            </button>
          </div>
        </div>
      </div>

      {/* Hata Mesajı */}
      {error && (
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-red-700">
          <div className="text-red-400 mb-4">⚠️ {error}</div>
          <button
            onClick={loadAllData}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Dolaplar Listesi */}
      {filteredDolaplar.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
          <Package className="h-16 w-16 mx-auto text-gray-700 mb-4" />
          <p className="text-gray-500">Dolap bulunamadı</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDolaplar.map((dolap) => {
            const dolapRaflari = getDolapRaflari(dolap.id);
            const oda = odalar.find(o => o.id === dolap.oda_id);
            
            return (
              <div 
                key={dolap.id} 
                className="bg-gray-800 rounded-xl border border-gray-700 p-4 hover:border-yellow-500 transition-colors"
              >
                {/* Dolap Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Package className={`h-5 w-5 ${dolap.aktif ? 'text-yellow-400' : 'text-gray-500'}`} />
                      <h3 className="text-lg font-bold text-white">{dolap.dolap_kodu}</h3>
                      {!dolap.aktif && (
                        <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded">PASİF</span>
                      )}
                    </div>
                    <p className="text-gray-300">{dolap.dolap_adi}</p>
                    {oda && (
                      <p className="text-gray-500 text-sm mt-1">
                        <Building className="h-3 w-3 inline mr-1" />
                        {oda.oda_adi} ({oda.oda_kodu})
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-400">
                      {dolap.doluluk_orani?.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">Doluluk</div>
                  </div>
                </div>

                {/* Kapasite Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Kapasite</span>
                    <span>{dolap.mevcut_kartela_sayisi} / {dolap.toplam_kapasite}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-500 to-amber-500"
                      style={{ width: `${dolap.doluluk_orani || 0}%` }}
                    />
                  </div>
                </div>

                {/* Dolap Detayları */}
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="bg-gray-750 rounded p-2">
                    <div className="text-gray-400">Raf</div>
                    <div className="text-white font-semibold">
                      {dolap.raf_sayisi} × {dolap.hucre_sayisi_raf} hücre
                    </div>
                  </div>
                  <div className="bg-gray-750 rounded p-2">
                    <div className="text-gray-400">Hücre Kap.</div>
                    <div className="text-white font-semibold">{dolap.kapasite_hucre} kartela</div>
                  </div>
                </div>

                {/* Raflar Listesi */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-400 flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    Raflar ({dolapRaflari.length})
                  </div>
                  
                  {dolapRaflari.map(raf => {
                    const rafHucreleri = getRafHucreleri(raf.id);
                    
                    return (
                      <div key={raf.id} className="bg-gray-750 rounded p-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 font-medium">{raf.raf_kodu}</span>
                          <span className="text-gray-400 text-xs">
                            {rafHucreleri.length} hücre
                          </span>
                        </div>
                        {raf.kapasite && (
                          <div className="text-xs text-gray-500 mt-1">
                            {raf.mevcut_kartela_sayisi || 0} / {raf.kapasite || 0} kartela
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-4 border-t border-gray-700 flex gap-2">
                  <button className="flex-1 px-3 py-1.5 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600">
                    <Eye className="h-3 w-3 inline mr-1" />
                    Detay
                  </button>
                  <button className="px-3 py-1.5 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700">
                    <Settings className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* İstatistik Footer */}
      {filteredDolaplar.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <div>
            Toplam <span className="text-white font-semibold">{filteredDolaplar.length}</span> dolap
            <span className="mx-2">•</span>
            <span className="text-green-400">{stats.aktifDolap} aktif</span>
            <span className="mx-2">•</span>
            Ortalama doluluk: <span className="text-yellow-400">{stats.ortalamaDoluluk.toFixed(1)}%</span>
          </div>
          <div className="text-xs text-gray-500">
            Her raf: {dolaplar[0]?.hucre_sayisi_raf || 16} hücre × {dolaplar[0]?.kapasite_hucre || 50} kapasite = 800 kartela
          </div>
        </div>
      )}
    </div>
  );
}
