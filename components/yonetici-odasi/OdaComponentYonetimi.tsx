'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Grid, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Building,
  Component,
  Link,
  Unlink,
  Check,
  X,
  RefreshCw,
  Layers,
  Settings,
  Lock,
  Unlock
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import OdaComponentModal from './modals/OdaComponentModal';

const supabase = createClient();

type OdaComponentType = Database['public']['Tables']['odalar_components']['Row'];
type OdaType = Database['public']['Tables']['odalar']['Row'];

interface OdaComponentYonetimiProps {
  refreshTrigger?: boolean;
  onComponentDegisti?: () => void;
}

export default function OdaComponentYonetimi({ 
  refreshTrigger = false,
  onComponentDegisti 
}: OdaComponentYonetimiProps) {
  // State'ler
  const [odaComponents, setOdaComponents] = useState<OdaComponentType[]>([]);
  const [odalar, setOdalar] = useState<OdaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtreler
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOdaId, setSelectedOdaId] = useState<number | 'all'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [yoneticiFilter, setYoneticiFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  
  // Modal state'leri
  const [showModal, setShowModal] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<OdaComponentType | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Verileri yükle
  useEffect(() => {
    loadAllData();
  }, [refreshTrigger]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Paralel olarak tüm verileri çek
      const [
        { data: componentsData, error: componentsError },
        { data: odalarData, error: odalarError }
      ] = await Promise.all([
        supabase.from('odalar_components').select('*').order('sira_no'),
        supabase.from('odalar').select('*').eq('aktif', true).order('oda_kodu')
      ]);

      if (componentsError) throw componentsError;
      if (odalarError) throw odalarError;

      setOdaComponents(componentsData || []);
      setOdalar(odalarData || []);

    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      setError('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Filtrelenmiş component'ler
  const filteredComponents = odaComponents.filter(component => {
    // Oda filtresi - DEĞİŞTİRİLDİ
    if (selectedOdaId !== 'all' && component.oda_id !== selectedOdaId) {
      return false;
    }

    // Arama sorgusu
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const oda = odalar.find(o => o.id === component.oda_id);
      const matchesSearch = 
        component.component_adi.toLowerCase().includes(searchLower) ||
        component.component_yolu.toLowerCase().includes(searchLower) ||
        (component.aciklama || '').toLowerCase().includes(searchLower) ||
        (oda?.oda_adi || '').toLowerCase().includes(searchLower) ||
        (oda?.oda_kodu || '').toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Aktif/pasif filtresi
    if (activeFilter === 'active' && !component.aktif) return false;
    if (activeFilter === 'inactive' && component.aktif) return false;

    // Yönetici görünürlük filtresi
    if (yoneticiFilter === 'visible' && !component.yonetici_gorebilir) return false;
    if (yoneticiFilter === 'hidden' && component.yonetici_gorebilir) return false;

    return true;
  });

  // Sıralama işlemleri - DÜZELTİLDİ
  const moveComponentUp = async (component: OdaComponentType) => {
    try {
      // Aynı oda içindeki component'leri bul
      const sameRoomComponents = odaComponents
        .filter(c => c.oda_id === component.oda_id)
        .sort((a, b) => (a.sira_no|| 0) - (b.sira_no|| 0));

      const currentIndex = sameRoomComponents.findIndex(c => c.id === component.id);
      if (currentIndex <= 0) return; // Zaten en üstte

      const previousComponent = sameRoomComponents[currentIndex - 1];

      // Sıra numaralarını değiştir - DÜZELTİLDİ
      const { error: error1 } = await (supabase as any)
        .from('odalar_components')
        .update({ sira_no: component.sira_no } as any)
        .eq('id', previousComponent.id);

      const { error: error2 } = await (supabase as any)
        .from('odalar_components')
        .update({ sira_no: previousComponent.sira_no } as any)
        .eq('id', component.id);

      if (error1 || error2) throw error1 || error2;

      await loadAllData();
      onComponentDegisti?.();

    } catch (error) {
      console.error('Sıralama hatası:', error);
      alert('Sıralama yapılamadı!');
    }
  };

  const moveComponentDown = async (component: OdaComponentType) => {
    try {
      // Aynı oda içindeki component'leri bul
      const sameRoomComponents = odaComponents
        .filter(c => c.oda_id === component.oda_id)
        .sort((a, b) => (a.sira_no|| 0) - (b.sira_no|| 0));

      const currentIndex = sameRoomComponents.findIndex(c => c.id === component.id);
      if (currentIndex >= sameRoomComponents.length - 1) return; // Zaten en altta

      const nextComponent = sameRoomComponents[currentIndex + 1];

      // Sıra numaralarını değiştir - DÜZELTİLDİ
      const { error: error1 } = await (supabase as any)
        .from('odalar_components')
        .update({ sira_no: component.sira_no } as any)
        .eq('id', nextComponent.id);

      const { error: error2 } = await (supabase as any)
        .from('odalar_components')
        .update({ sira_no: nextComponent.sira_no } as any)
        .eq('id', component.id);

      if (error1 || error2) throw error1 || error2;

      await loadAllData();
      onComponentDegisti?.();

    } catch (error) {
      console.error('Sıralama hatası:', error);
      alert('Sıralama yapılamadı!');
    }
  };

  // Component durumunu değiştir - DÜZELTİLDİ
  const toggleComponentStatus = async (component: OdaComponentType, field: 'aktif' | 'yonetici_gorebilir') => {
    try {
      const { error } = await (supabase as any)
        .from('odalar_components')
        .update({ [field]: !component[field] } as any)
        .eq('id', component.id);

      if (error) throw error;

      // Yerel state'i güncelle
      setOdaComponents(prev => prev.map(c => 
        c.id === component.id ? { ...c, [field]: !component[field] } : c
      ));

      onComponentDegisti?.();

    } catch (error) {
      console.error('Durum değiştirme hatası:', error);
      alert('İşlem başarısız oldu');
    }
  };

  // Component sil - DÜZELTİLDİ
  const deleteComponent = async (component: OdaComponentType) => {
    if (!confirm(`${component.component_adi} component'ini silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('odalar_components')
        .delete()
        .eq('id', component.id);

      if (error) throw error;

      // Listeden kaldır
      setOdaComponents(prev => prev.filter(c => c.id !== component.id));

      // Sistem logu - DÜZELTİLDİ
      const oda = odalar.find(o => o.id === component.oda_id);
      await (supabase as any).from('hareket_loglari').insert([{
        hareket_tipi: 'ODA_COMPONENT_SILINDI',
        islem_detay: `${component.component_adi} → ${oda?.oda_adi} component'i silindi`,
        ip_adresi: '127.0.0.1',
        tarih: new Date().toISOString()
      }] as any);

      onComponentDegisti?.();

    } catch (error) {
      console.error('Component silme hatası:', error);
      alert('Component silinemedi!');
    }
  };

  // Modal işlemleri
  const handleCreateClick = () => {
    setSelectedComponent(null);
    setModalMode('create');
    setShowModal(true);
  };

  const handleEditClick = (component: OdaComponentType) => {
    setSelectedComponent(component);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    loadAllData();
    onComponentDegisti?.();
  };

  // İstatistikler
  const istatistikler = {
    toplam: odaComponents.length,
    aktif: odaComponents.filter(c => c.aktif).length,
    yoneticiGorebilir: odaComponents.filter(c => c.yonetici_gorebilir).length,
    farkliOda: Array.from(new Set(odaComponents.map(c => c.oda_id))).length
  };

  if (loading && odaComponents.length === 0) {
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
          <h2 className="text-2xl font-bold text-white">Oda Component Yönetimi</h2>
          <p className="text-gray-400">{"Odalara gösterilecek component'leri yönetin"}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="px-3 py-1 bg-gray-800 rounded-lg">
            <span className="text-gray-400 text-sm">Toplam: </span>
            <span className="text-white font-semibold">{istatistikler.toplam}</span>
          </div>
          <div className="px-3 py-1 bg-green-500/20 rounded-lg">
            <span className="text-green-400 text-sm">Aktif: </span>
            <span className="text-green-400 font-semibold">{istatistikler.aktif}</span>
          </div>
          <div className="px-3 py-1 bg-blue-500/20 rounded-lg">
            <span className="text-blue-400 text-sm">Görünür: </span>
            <span className="text-blue-400 font-semibold">{istatistikler.yoneticiGorebilir}</span>
          </div>
          <div className="px-3 py-1 bg-purple-500/20 rounded-lg">
            <span className="text-purple-400 text-sm">Oda: </span>
            <span className="text-purple-400 font-semibold">{istatistikler.farkliOda}</span>
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
                placeholder="Component veya oda ara..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white"
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

            <select
              value={yoneticiFilter}
              onChange={(e) => setYoneticiFilter(e.target.value as any)}
              className="px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            >
              <option value="all">Tüm Görünürlük</option>
              <option value="visible">Yönetici Görebilir</option>
              <option value="hidden">Yönetici Göremez</option>
            </select>

            <button
              onClick={handleCreateClick}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Yeni Component
            </button>
          </div>
        </div>
      </div>

      {/* Component Listesi */}
      {error ? (
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-red-700">
          <div className="text-red-400 mb-4">⚠️ {error}</div>
          <button
            onClick={loadAllData}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
          >
            Tekrar Dene
          </button>
        </div>
      ) : filteredComponents.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
          <Package className="h-16 w-16 mx-auto text-gray-700 mb-4" />
          <p className="text-gray-500">Component bulunamadı</p>
          <button
            onClick={handleCreateClick}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            {"İlk Component'i Oluştur"}
          </button>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-750">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Component</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Oda</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Sıra</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredComponents.map((component) => {
                  const oda = odalar.find(o => o.id === component.oda_id);
                  
                  return (
                    <tr key={component.id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${component.aktif ? 'bg-purple-500/20' : 'bg-gray-700'}`}>
                            <Component className={`h-5 w-5 ${component.aktif ? 'text-purple-400' : 'text-gray-500'}`} />
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {component.component_adi}
                              {!component.yonetici_gorebilir && (
                                <EyeOff className="h-3 w-3 text-gray-500 inline-block ml-2" />
                              )}
                            </div>
                            <div className="text-sm text-gray-400">
                              <code className="text-xs bg-gray-900 px-2 py-1 rounded border border-gray-700">
                                {component.component_yolu}
                              </code>
                            </div>
                            {component.aciklama && (
                              <div className="text-xs text-gray-500 mt-1">
                                {component.aciklama}
                              </div>
                            )}
                            {component.gerekli_yetki && (
                              <div className="text-xs text-yellow-400 mt-1">
                                <Lock className="h-3 w-3 inline mr-1" />
                                {component.gerekli_yetki}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {oda ? (
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${oda.aktif ? 'bg-green-500/20' : 'bg-gray-700'}`}>
                              <Building className={`h-5 w-5 ${oda.aktif ? 'text-green-400' : 'text-gray-500'}`} />
                            </div>
                            <div>
                              <div className="font-medium text-white">{oda.oda_adi}</div>
                              <div className="text-sm text-gray-400">{oda.oda_kodu}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">Oda bulunamadı</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-purple-400">
                            {component.sira_no}
                          </span>
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => moveComponentUp(component)}
                              className="p-1 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded"
                              title="Yukarı taşı"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => moveComponentDown(component)}
                              className="p-1 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded"
                              title="Aşağı taşı"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${component.aktif ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className={`text-sm ${component.aktif ? 'text-green-400' : 'text-red-400'}`}>
                              {component.aktif ? 'Aktif' : 'Pasif'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {component.yonetici_gorebilir ? (
                              <>
                                <Eye className="h-3 w-3 text-blue-400" />
                                <span className="text-xs text-blue-400">Yönetici</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3 text-gray-500" />
                                <span className="text-xs text-gray-500">Gizli</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClick(component)}
                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                            title="Düzenle"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleComponentStatus(component, 'aktif')}
                            className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg"
                            title={component.aktif ? 'Pasif Yap' : 'Aktif Yap'}
                          >
                            {component.aktif ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => toggleComponentStatus(component, 'yonetici_gorebilir')}
                            className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg"
                            title={component.yonetici_gorebilir ? 'Yönetici Gizle' : 'Yönetici Göster'}
                          >
                            {component.yonetici_gorebilir ? <Unlink className="h-4 w-4" /> : <Link className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => deleteComponent(component)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sayfalama ve İstatistik */}
      {filteredComponents.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <div>
            Toplam <span className="text-white font-semibold">{filteredComponents.length}</span> component
            <span className="mx-2">•</span>
            <span className="text-green-400">{istatistikler.aktif} aktif</span>
            <span className="mx-2">•</span>
            <span className="text-blue-400">{istatistikler.yoneticiGorebilir} görünür</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={loadAllData}
              className="px-3 py-1 bg-gray-700 rounded-lg hover:bg-gray-600 flex items-center gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Yenile
            </button>
          </div>
        </div>
      )}

      {/* Oda Component Modal */}
      {showModal && (
        <OdaComponentModal
          mode={modalMode}
          component={selectedComponent}
          odalar={odalar}
          onClose={() => setShowModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
