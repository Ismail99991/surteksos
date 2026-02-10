// components/modals/DolapDetayModal.tsx
'use client';

import { X, Package, Layers, Grid, Eye, Edit, Trash2, Building, Plus, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

const supabase = createClient();

type DolapType = Database['public']['Tables']['dolaplar']['Row'];
type RafType = Database['public']['Tables']['raflar']['Row'];
type HucreType = Database['public']['Tables']['hucreler']['Row'];
type KartelaType = Database['public']['Tables']['kartelalar']['Row'];
type OdaType = Database['public']['Tables']['odalar']['Row'];
type MusteriType = Database['public']['Tables']['musteriler']['Row'];

interface DolapDetayModalProps {
  dolap: DolapType;
  odalar: OdaType[];
  musteriler: MusteriType[];
  onClose: () => void;
  onEdit: (dolap: DolapType) => void;
  onDelete: (dolapId: number) => void;
}

export default function DolapDetayModal({ 
  dolap, 
  odalar, 
  musteriler,
  onClose, 
  onEdit, 
  onDelete 
}: DolapDetayModalProps) {
  const [raflar, setRaflar] = useState<RafType[]>([]);
  const [hucreler, setHucreler] = useState<HucreType[]>([]);
  const [kartelalar, setKartelalar] = useState<KartelaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [hucreSearch, setHucreSearch] = useState('');
  const [selectedRafId, setSelectedRafId] = useState<number | 'all'>('all');

  useEffect(() => {
    loadDetayData();
  }, [dolap.id]);

  const loadDetayData = async () => {
    setLoading(true);
    
    const [raflarRes, hucrelerRes, ] = await Promise.all([
      supabase.from('raflar').select('*').eq('dolap_id', dolap.id).order('raf_kodu'),
      supabase.from('hucreler').select('*').eq('dolap_id', dolap.id).order('hucre_kodu')
    ]);

    setRaflar(raflarRes.data || []);
    setHucreler(hucrelerRes.data || []);

    if (hucrelerRes.data) {
      const hucreIds = hucrelerRes.data.map(h => h.id);
      if (hucreIds.length > 0) {
        const kartelalarRes = await supabase
          .from('kartelalar')
          .select('*')
          .in('hucre_id', hucreIds)
          .eq('silindi', false)
          .order('kartela_no');
        
        setKartelalar(kartelalarRes.data || []);
      }
    }

    setLoading(false);
  };

  const filteredHucreler = hucreler.filter(hucre => {
    if (selectedRafId !== 'all' && hucre.raf_id !== selectedRafId) return false;
    if (hucreSearch && !hucre.hucre_kodu.toLowerCase().includes(hucreSearch.toLowerCase())) return false;
    return true;
  });

  const oda = odalar.find(o => o.id === dolap.oda_id);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* HEADER */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-900/30 rounded-lg">
              <Package className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{dolap.dolap_kodu}</h2>
              <p className="text-gray-300">{dolap.dolap_adi}</p>
              {oda && (
                <p className="text-gray-500 text-sm flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {oda.oda_kodu} - {oda.oda_adi}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(dolap)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Düzenle
            </button>
            <button
              onClick={() => onDelete(dolap.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Sil
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* İSTATİSTİK KARTLARI */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="text-gray-400 text-sm">Toplam Raf</div>
                  <div className="text-2xl font-bold text-white">{raflar.length}</div>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="text-gray-400 text-sm">Toplam Hücre</div>
                  <div className="text-2xl font-bold text-white">{hucreler.length}</div>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="text-gray-400 text-sm">Kapasite</div>
                  <div className="text-2xl font-bold text-white">{dolap.mevcut_kartela_sayisi || 0}/{dolap.toplam_kapasite || 0}</div>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="text-gray-400 text-sm">Doluluk</div>
                  <div className="text-2xl font-bold text-white">{dolap.doluluk_orani?.toFixed(1) || 0}%</div>
                </div>
              </div>

              {/* RAF LİSTESİ */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Layers className="h-5 w-5 text-blue-400" />
                    Raflar ({raflar.length})
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {raflar.map(raf => (
                    <div key={raf.id} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-white">{raf.raf_kodu}</div>
                          <div className="text-sm text-gray-400">{raf.raf_adi}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Renk: {raf.renk_no_baslangic} - {raf.renk_no_bitis}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-green-400">
                            {raf.mevcut_kartela_sayisi || 0}/{raf.kapasite || 0}
                          </div>
                          <div className="text-xs text-gray-500">kartela</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-800">
                        <div className="text-xs">
                          <span className={`px-2 py-1 rounded ${raf.aktif ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                            {raf.aktif ? 'Aktif' : 'Pasif'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {raf.hucre_sayisi || 0} hücre
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* HÜCRE LİSTESİ */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Grid className="h-5 w-5 text-green-400" />
                    Hücreler ({hucreler.length})
                  </h3>
                  
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Hücre kodu ara..."
                        value={hucreSearch}
                        onChange={(e) => setHucreSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm w-48"
                      />
                    </div>
                    
                    <select
                      value={selectedRafId}
                      onChange={(e) => setSelectedRafId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                      className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
                    >
                      <option value="all">Tüm Raflar</option>
                      {raflar.map(raf => (
                        <option key={raf.id} value={raf.id}>Raf {raf.raf_kodu}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {filteredHucreler.map(hucre => {
                    const raf = raflar.find(r => r.id === hucre.raf_id);
                    const dolulukYuzde = hucre.kapasite ? ((hucre.mevcut_kartela_sayisi || 0) / hucre.kapasite) * 100 : 0;
                    
                    return (
                      <div key={hucre.id} className="bg-gray-900 rounded-lg p-3 border border-gray-800 hover:border-green-500 transition-colors">
                        <div className="font-mono text-sm text-white text-center truncate" title={hucre.hucre_kodu}>
                          {hucre.hucre_kodu}
                        </div>
                        
                        <div className="text-xs text-blue-300 font-medium text-center mt-1">
                          {hucre.renk_no_baslangic} - {hucre.renk_no_bitis}
                        </div>
                        
                        {raf && (
                          <div className="text-xs text-gray-500 text-center">Raf: {raf.raf_kodu}</div>
                        )}
                        
                        <div className="text-xs text-gray-400 text-center mt-1">
                          {hucre.mevcut_kartela_sayisi || 0}/{hucre.kapasite || 0}
                        </div>
                        
                        <div className={`text-xs text-center mt-1 ${hucre.aktif ? 'text-green-400' : 'text-red-400'}`}>
                          {hucre.aktif ? 'Aktif' : 'Pasif'}
                        </div>
                        
                        <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${dolulukYuzde > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(dolulukYuzde, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {filteredHucreler.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Hücre bulunamadı
                  </div>
                )}
              </div>

              {/* KARTELA LİSTESİ */}
              {kartelalar.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5 text-purple-400" />
                    Kartelalar ({kartelalar.length})
                  </h3>
                  
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {kartelalar.slice(0, 6).map(kartela => (
                        <div key={kartela.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                          <div className="font-mono text-sm text-white truncate" title={kartela.kartela_no}>
                            {kartela.kartela_no}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {kartela.renk_kodu} - {kartela.renk_adi}
                          </div>
                          <div className="flex justify-between text-xs mt-2">
                            <span className="text-gray-500">Göz: {kartela.goz_sayisi || 0}/{kartela.maksimum_goz || 0}</span>
                            <span className={`${
                              kartela.durum === 'AKTIF' ? 'text-green-400' :
                              kartela.durum === 'DOLU' ? 'text-red-400' :
                              'text-yellow-400'
                            }`}>
                              {kartela.durum}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {kartelalar.length > 6 && (
                      <div className="text-center text-gray-500 text-sm mt-3">
                        + {kartelalar.length - 6} kartela daha...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}