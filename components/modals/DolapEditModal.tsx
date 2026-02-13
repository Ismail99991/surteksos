// components/modals/DolapEditModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  X, Package, Layers, Grid, Building, Users, 
  Save, RefreshCw, Trash2, Plus, Search,
  Lock, Unlock, Eye, Filter, Printer, QrCode
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import HucreQrPrint from '@/components/qr/HucreQrPrint';

const supabase = createClient();

type DolapType = Database['public']['Tables']['dolaplar']['Row'];
type RafType = Database['public']['Tables']['raflar']['Row'];
type HucreType = Database['public']['Tables']['hucreler']['Row'] & {
  aciklama?: string | null;
};
type OdaType = Database['public']['Tables']['odalar']['Row'];
type MusteriType = Database['public']['Tables']['musteriler']['Row'];

type HucreWithMusteriType = HucreType & {
  musteriler: MusteriType | null;
};

interface DolapEditModalProps {
  dolap: DolapType;
  odalar: OdaType[];
  onClose: () => void;
  onUpdate: (dolapId: number, updates: Partial<DolapType>) => Promise<void>;
}

export default function DolapEditModal({ 
  dolap, 
  odalar, 
  onClose, 
  onUpdate 
}: DolapEditModalProps) {
  const [form, setForm] = useState({
    dolap_adi: dolap.dolap_adi || '',
    oda_id: dolap.oda_id?.toString() || '',
    aktif: dolap.aktif || false,
    aciklama: dolap.aciklama || '',
  });

  const [raflar, setRaflar] = useState<RafType[]>([]);
  const [hucreler, setHucreler] = useState<HucreWithMusteriType[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Müşteriler dropdown için
  const [musteriler, setMusteriler] = useState<MusteriType[]>([]);
  
  // Hücre yönetimi
  const [selectedHucre, setSelectedHucre] = useState<HucreWithMusteriType | null>(null);
  const [hucreEditForm, setHucreEditForm] = useState({
    musteri_id: null as number | null,
    aktif: true,
    aciklama: ''
  });

  // QR kod için state'ler
  const [showQrPrint, setShowQrPrint] = useState(false);
  const [selectedQrHucreler, setSelectedQrHucreler] = useState<HucreWithMusteriType[]>([]);

  // Filtreler
  const [hucreFilter, setHucreFilter] = useState<'all' | 'empty' | 'occupied' | 'customer'>('all');
  const [rafFilter, setRafFilter] = useState<number | 'all'>('all');
  const [hucreSearch, setHucreSearch] = useState('');

  const loadDetayData = async () => {
    setDataLoading(true);
    
    try {
      const { data: hucrelerData, error: hucreError } = await supabase
        .from('hucreler')
        .select(`
          *,
          musteriler:musteri_id (
            id,
            musteri_kodu,
            musteri_adi,
            durum
          )
        `)
        .eq('dolap_id', dolap.id)
        .order('hucre_kodu');

      if (hucreError) throw hucreError;
      
      setHucreler(
        (hucrelerData || []).map((h) => ({
          ...h,
          musteriler:
            h.musteriler &&
            typeof h.musteriler === 'object' &&
            ('code' in h.musteriler || 'message' in h.musteriler)
              ? null
              : h.musteriler as unknown as MusteriType | null,
        }))
      );

      const { data: raflarData, error: rafError } = await supabase
        .from('raflar')
        .select('*')
        .eq('dolap_id', dolap.id)
        .order('raf_kodu');

      if (rafError) throw rafError;
      
      setRaflar(raflarData || []);

    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      alert('Veriler yüklenemedi');
    } finally {
      setDataLoading(false);
    }
  };

  const loadMusteriler = async () => {
    const { data, error } = await supabase
      .from('musteriler')
      .select('id, musteri_kodu, musteri_adi, durum, toplam_kartela_sayisi, aktif_kartela_sayisi, olusturulma_tarihi')
      .eq('durum', 'AKTIF')
      .order('musteri_adi');
    
    if (error) {
      console.error('Müşteriler yüklenemedi:', error);
    } else {
      setMusteriler(data || []);
    }
  };

  useEffect(() => {
    loadDetayData();
    loadMusteriler();
  }, [dolap.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const updates: Partial<DolapType> = {
        dolap_adi: form.dolap_adi,
        aktif: form.aktif,
        aciklama: form.aciklama,
      };

      if (form.oda_id && parseInt(form.oda_id) !== dolap.oda_id) {
        updates.oda_id = parseInt(form.oda_id);
      }

      await onUpdate(dolap.id, updates);
    } catch (error) {
      alert('Güncelleme başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleHucreUpdate = async (hucreId: number) => {
    if (!selectedHucre) return;
    
    try {
      const { error } = await supabase
        .from('hucreler')
        .update({
          musteri_id: hucreEditForm.musteri_id,
          aktif: hucreEditForm.aktif,
          aciklama: hucreEditForm.aciklama || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', hucreId);

      if (error) throw error;

      alert('Hücre güncellendi!');
      setSelectedHucre(null);
      loadDetayData();
    } catch (error) {
      alert('Hücre güncellenemedi');
    }
  };

  const handleHucreDelete = async (hucreId: number) => {
    if (!confirm('Bu hücreyi pasif yapmak istediğinize emin misiniz?')) return;
    
    try {
      const { error } = await supabase
        .from('hucreler')
        .update({ aktif: false })
        .eq('id', hucreId);

      if (error) throw error;

      alert('Hücre pasif yapıldı!');
      loadDetayData();
    } catch (error) {
      alert('Hücre silinemedi');
    }
  };

  // QR kod fonksiyonları
  const handlePrintAllQr = () => {
    setSelectedQrHucreler(hucreler);
    setShowQrPrint(true);
  };

  const handlePrintSingleQr = (hucre: HucreWithMusteriType, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedQrHucreler([hucre]);
    setShowQrPrint(true);
  };

  const filteredHucreler = hucreler.filter(hucre => {
    if (rafFilter !== 'all' && hucre.raf_id !== rafFilter) return false;
    
    if (hucreSearch && !hucre.hucre_kodu.toLowerCase().includes(hucreSearch.toLowerCase())) {
      return false;
    }
    
    switch (hucreFilter) {
      case 'empty':
        return (hucre.mevcut_kartela_sayisi || 0) === 0;
      case 'occupied':
        return (hucre.mevcut_kartela_sayisi || 0) > 0;
      case 'customer':
        return hucre.musteri_id != null;
      default:
        return true;
    }
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
              <h2 className="text-2xl font-bold text-white">Dolap Düzenle - {dolap.dolap_kodu}</h2>
              <p className="text-gray-300">{dolap.dolap_adi}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {/* QR BUTONU - Tüm hücreler için */}
            <button
              onClick={handlePrintAllQr}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              title="Tüm hücrelerin QR kodlarını yazdır"
            >
              <QrCode className="h-4 w-4" />
              <span className="hidden md:inline">Tüm QR'lar</span>
            </button>
            
            <button
              onClick={loadDetayData}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden md:inline">Yenile</span>
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
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* TEMEL BİLGİLER */}
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-400" />
                  Temel Bilgiler
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Dolap Adı *</label>
                    <input
                      type="text"
                      value={form.dolap_adi}
                      onChange={(e) => setForm({...form, dolap_adi: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Oda</label>
                    <select
                      value={form.oda_id}
                      onChange={(e) => setForm({...form, oda_id: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="">Oda Seçiniz</option>
                      {odalar.map(oda => (
                        <option key={oda.id} value={oda.id}>
                          {oda.oda_kodu} - {oda.oda_adi}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-300 text-sm mb-2">Açıklama</label>
                    <textarea
                      value={form.aciklama}
                      onChange={(e) => setForm({...form, aciklama: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[100px]"
                      placeholder="Dolap hakkında notlar..."
                    />
                  </div>
                </div>
                
                <div className="flex gap-6 mt-6">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.aktif}
                      onChange={(e) => setForm({...form, aktif: e.target.checked})}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 focus:ring-2"
                    />
                    <div>
                      <label className="text-gray-300">Aktif</label>
                      <p className="text-xs text-gray-500">Dolap kullanımda</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* HÜCRE YÖNETİMİ */}
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Grid className="h-5 w-5 text-green-400" />
                    Hücre Yönetimi ({hucreler.length} hücre)
                  </h3>
                  
                  <div className="flex gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Hücre ara..."
                        value={hucreSearch}
                        onChange={(e) => setHucreSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm w-48"
                      />
                    </div>
                    
                    <select
                      value={rafFilter}
                      onChange={(e) => setRafFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                      className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    >
                      <option value="all">Tüm Raflar</option>
                      {raflar.map(raf => (
                        <option key={raf.id} value={raf.id}>Raf {raf.raf_kodu}</option>
                      ))}
                    </select>
                    
                    <select
                      value={hucreFilter}
                      onChange={(e) => setHucreFilter(e.target.value as any)}
                      className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    >
                      <option value="all">Tüm Hücreler</option>
                      <option value="empty">Boş Hücreler</option>
                      <option value="occupied">Dolu Hücreler</option>
                      <option value="customer">Müşteriye Ayrılmış</option>
                    </select>
                  </div>
                </div>
                
                {dataLoading ? (
                  <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <>
                    {/* HÜCRE LİSTESİ */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                      {filteredHucreler.map(hucre => {
                        const raf = raflar.find(r => r.id === hucre.raf_id);
                        const isMusteri = hucre.musteri_id != null;
                        
                        return (
                          <div
                            key={hucre.id}
                            className={`rounded-lg p-3 border transition-all cursor-pointer relative group ${
                              selectedHucre?.id === hucre.id 
                                ? 'border-blue-500 bg-blue-900/20' 
                                : isMusteri 
                                  ? 'border-purple-500 bg-purple-900/10' 
                                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                            }`}
                            onClick={() => {
                              setSelectedHucre(hucre);
                              setHucreEditForm({
                                musteri_id: hucre.musteri_id || null,
                                aktif: hucre.aktif || true,
                                aciklama: hucre.aciklama || ''
                              });
                            }}
                          >
                            {/* QR BUTONU - Her hücre için */}
                            <button
                              onClick={(e) => handlePrintSingleQr(hucre, e)}
                              className="absolute top-1 right-1 p-1 bg-gray-700 rounded hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              title="QR Kod Yazdır"
                            >
                              <QrCode className="h-3 w-3 text-gray-300" />
                            </button>

                            <div className="flex justify-between items-start">
                              <div className="font-mono text-sm text-white truncate pr-6">
                                {hucre.hucre_kodu}
                              </div>
                              {isMusteri && (
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3 text-purple-400" />
                                </div>
                              )}
                            </div>
                            
                            {isMusteri && hucre.musteriler && (
                              <div className="text-xs text-purple-300 truncate mt-1">
                                {hucre.musteriler.musteri_adi}
                              </div>
                            )}
                            
                            <div className="text-xs text-blue-300 mt-1">
                              Renk: {hucre.renk_no_baslangic} - {hucre.renk_no_bitis}
                            </div>
                            
                            {raf && (
                              <div className="text-xs text-gray-500">Raf: {raf.raf_kodu}</div>
                            )}
                            
                            <div className="flex justify-between items-center mt-2">
                              <div className="text-xs">
                                <span className={`px-1 py-0.5 rounded ${
                                  hucre.aktif ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                                }`}>
                                  {hucre.aktif ? 'A' : 'P'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400">
                                {hucre.mevcut_kartela_sayisi || 0}/{hucre.kapasite || 0}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* HÜCRE DÜZENLEME FORMU */}
                    {selectedHucre && (
                      <div className="bg-gray-800 rounded-lg p-6 border border-blue-700">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-lg font-semibold text-white">
                            Hücre Düzenle: {selectedHucre.hucre_kodu}
                          </h4>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleHucreDelete(selectedHucre.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              Pasif Yap
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-gray-300 text-sm mb-2">Müşteri</label>
                            <select
                              value={hucreEditForm.musteri_id || ''}
                              onChange={(e) => setHucreEditForm({
                                ...hucreEditForm, 
                                musteri_id: e.target.value ? parseInt(e.target.value) : null
                              })}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                            >
                              <option value="">Müşteri Seçiniz</option>
                              {musteriler.map(musteri => (
                                <option key={musteri.id} value={musteri.id}>
                                  {musteri.musteri_kodu} - {musteri.musteri_adi}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={hucreEditForm.aktif}
                              onChange={(e) => setHucreEditForm({...hucreEditForm, aktif: e.target.checked})}
                              className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded"
                            />
                            <label className="text-gray-300 text-sm">Aktif</label>
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-gray-300 text-sm mb-2">Açıklama</label>
                            <textarea
                              value={hucreEditForm.aciklama}
                              onChange={(e) => setHucreEditForm({...hucreEditForm, aciklama: e.target.value})}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white min-h-[80px]"
                              placeholder="Hücre hakkında notlar..."
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-3 mt-6">
                          <button
                            type="button"
                            onClick={() => setSelectedHucre(null)}
                            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                          >
                            İptal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleHucreUpdate(selectedHucre.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                          >
                            <Save className="h-4 w-4" />
                            Hücreyi Kaydet
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* SABİT BİLGİLER */}
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">Sabit Bilgiler</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-gray-400 text-sm">Dolap Kodu</div>
                    <div className="text-white font-mono">{dolap.dolap_kodu}</div>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-gray-400 text-sm">Raflar</div>
                    <div className="text-white">{dolap.raf_sayisi} × {dolap.hucre_sayisi_raf}</div>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-gray-400 text-sm">Toplam Kapasite</div>
                    <div className="text-white">{dolap.toplam_kapasite?.toLocaleString('tr-TR')} kartela</div>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-gray-400 text-sm">Mevcut Kartela</div>
                    <div className="text-white">{dolap.mevcut_kartela_sayisi || 0} adet</div>
                  </div>
                </div>
              </div>

              {/* FOOTER BUTONLARI */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Güncelleniyor...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Değişiklikleri Kaydet
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* QR PRINT MODAL */}
      {showQrPrint && (
        <HucreQrPrint
          hucreler={selectedQrHucreler.map(h => ({
            id: h.id,
            hucre_kodu: h.hucre_kodu,
            dolap_kodu: dolap.dolap_kodu,
            raf_kodu: raflar.find(r => r.id === h.raf_id)?.raf_kodu
          }))}
          onClose={() => setShowQrPrint(false)}
        />
      )}
    </div>
  );
}