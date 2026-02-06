'use client';

import { useState, useEffect } from 'react';
import { 
  Building, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Check, 
  X, 
  QrCode,
  Lock,
  Unlock,
  DoorOpen,
  Hash,
  FileText,
  Users,
  MapPin
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import OdaModal from './modals/OdaModal';

const supabase: any = createClient();


type OdaType = Database['public']['Tables']['odalar']['Row'];

interface OdaYonetimiProps {
  onOdaEklendi?: () => void;
  onOdaGuncellendi?: () => void;
  refreshTrigger?: boolean;
}

export default function OdaYonetimi({ 
  onOdaEklendi,
  onOdaGuncellendi,
  refreshTrigger = false
}: OdaYonetimiProps) {
  const [odalar, setOdalar] = useState<OdaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [aktifFiltre, setAktifFiltre] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedOda, setSelectedOda] = useState<OdaType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Odaları yükle
  useEffect(() => {
    loadOdalar();
  }, [refreshTrigger]);

  const loadOdalar = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('odalar')
        .select('*')
        .order('oda_kodu', { ascending: true });

      // Aktif filtre uygula
      if (aktifFiltre === 'active') {
        query = query.eq('aktif', true);
      } else if (aktifFiltre === 'inactive') {
        query = query.eq('aktif', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOdalar(data || []);

    } catch (error) {
      console.error('Oda yükleme hatası:', error);
      setError('Odalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Filtrelenmiş odalar
  const filteredOdalar = odalar.filter(oda => {
    const searchLower = searchQuery.toLowerCase();
    return (
      oda.oda_adi.toLowerCase().includes(searchLower) ||
      oda.oda_kodu.toLowerCase().includes(searchLower) ||
      oda.aciklama?.toLowerCase().includes(searchLower) ||
      oda.qr_kodu?.toLowerCase().includes(searchLower)
    );
  });

  // Oda durumunu değiştir
  const toggleOdaDurum = async (oda: OdaType) => {
    try {

      const updateData: OdaUpdate = { aktif: !oda.aktif }

      const { error } = await supabase
        .from('odalar')
        .update(updateData)
        .eq('id', oda.id);

      if (error) throw error;

      // Yerel state'i güncelle
      setOdalar(prev => prev.map(o => 
        o.id === oda.id ? { ...o, aktif: !oda.aktif } : o
      ));

      // Sistem logu ekle
      await (supabase as any).from('sistem_loglari').insert([{
        islem_turu: oda.aktif ? 'ODA_PASIF_YAPILDI' : 'ODA_AKTIF_YAPILDI',
        detay: `${oda.oda_adi} (${oda.oda_kodu}) ${oda.aktif ? 'pasif' : 'aktif'} yapıldı`,
        ip_adresi: '127.0.0.1'
      }]);

      onOdaGuncellendi?.();

    } catch (error) {
      console.error('Oda durumu değiştirme hatası:', error);
      alert('İşlem başarısız oldu');
    }
  };

  // QR kodu oluştur
  const generateQRCode = async (oda: OdaType) => {
    try {
      const qrText = `ROOM-${oda.oda_kodu}-${Date.now()}`;
      
      const updateData: OdaUpdate = { qr_kodu: qrText }

      const { error } = await supabase
        .from('odalar')
        .update(updateData)
        .eq('id', oda.id);

      if (error) throw error;

      // Yerel state'i güncelle
      setOdalar(prev => prev.map(o => 
        o.id === oda.id ? { ...o, qr_kodu: qrText } : o
      ));

      alert('Oda QR kodu oluşturuldu!');

      // Sistem logu ekle
      await supabase.from('sistem_loglari').insert([{
        islem_turu: 'ODA_QR_OLUSTURULDU',
        detay: `${oda.oda_adi} (${oda.oda_kodu}) için QR kodu oluşturuldu`,
        ip_adresi: '127.0.0.1'
      }]);

    } catch (error) {
      console.error('QR kod oluşturma hatası:', error);
      alert('QR kodu oluşturulamadı!');
    }
  };

  // Oda sil (soft delete)
  const deleteOda = async (oda: OdaType) => {
    if (!confirm(`${oda.oda_adi} (${oda.oda_kodu}) odasını silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      // Önce bu odaya ait yetkiler var mı kontrol et
      const { count: yetkiSayisi } = await supabase
        .from('kullanici_yetkileri')
        .select('*', { count: 'exact', head: true })
        .eq('oda_id', oda.id);

      if (yetkiSayisi && yetkiSayisi > 0) {
        if (!confirm(`Bu odaya ait ${yetkiSayisi} yetki kaydı var. Yine de silmek istiyor musunuz?`)) {
          return;
        }
      }

      const { error } = await supabase
        .from('odalar')
        .update({ 
          aktif: false,
          silindi: true,
          silinme_tarihi: new Date().toISOString()
        })
        .eq('id', oda.id);

      if (error) throw error;

      // Listeden kaldır
      setOdalar(prev => prev.filter(o => o.id !== oda.id));

      // Sistem logu ekle
      await supabase.from('sistem_loglari').insert([{
        islem_turu: 'ODA_SILINDI',
        detay: `${oda.oda_adi} (${oda.oda_kodu}) odası silindi`,
        ip_adresi: '127.0.0.1'
      }]);

      alert('Oda silindi!');
      onOdaGuncellendi?.();

    } catch (error) {
      console.error('Oda silme hatası:', error);
      alert('Oda silinemedi!');
    }
  };

  // Modal işlemleri
  const handleCreateClick = () => {
    setSelectedOda(null);
    setModalMode('create');
    setShowModal(true);
  };

  const handleEditClick = (oda: OdaType) => {
    setSelectedOda(oda);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    loadOdalar();
    modalMode === 'create' ? onOdaEklendi?.() : onOdaGuncellendi?.();
  };

  // İstatistikler
  const istatistikler = {
    toplam: odalar.length,
    aktif: odalar.filter(o => o.aktif).length,
    qrKoduOlan: odalar.filter(o => o.qr_kodu).length,
    aciklamaOlan: odalar.filter(o => o.aciklama).length
  };

  if (loading && odalar.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-800 rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-gray-800 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık ve İstatistikler */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Oda Yönetimi</h2>
          <p className="text-gray-400">Sistem odalarını yönetin</p>
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
            <span className="text-blue-400 text-sm">QR Kodlu: </span>
            <span className="text-blue-400 font-semibold">{istatistikler.qrKoduOlan}</span>
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
                placeholder="Oda ara..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-white"
              />
            </div>
          </div>

          {/* Filtreler */}
          <div className="flex flex-wrap gap-2">
            <select
              value={aktifFiltre}
              onChange={(e) => setAktifFiltre(e.target.value as any)}
              className="px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
            </select>

            <button
              onClick={handleCreateClick}
              className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
            >
              <Building className="h-4 w-4" />
              Yeni Oda
            </button>
          </div>
        </div>
      </div>

      {/* Oda Kartları */}
      {error ? (
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-red-700">
          <div className="text-red-400 mb-4">⚠️ {error}</div>
          <button
            onClick={loadOdalar}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
          >
            Tekrar Dene
          </button>
        </div>
      ) : filteredOdalar.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
          <Building className="h-16 w-16 mx-auto text-gray-700 mb-4" />
          <p className="text-gray-500">Oda bulunamadı</p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-green-400 hover:text-green-300"
            >
              Aramayı temizle
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOdalar.map((oda) => (
            <div 
              key={oda.id} 
              className={`bg-gray-800 border ${oda.aktif ? 'border-gray-700 hover:border-green-500' : 'border-gray-800'} rounded-xl p-5 transition-all`}
            >
              {/* Oda Başlık */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${oda.aktif ? 'bg-green-500/20' : 'bg-gray-700'}`}>
                    <Building className={`h-6 w-6 ${oda.aktif ? 'text-green-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{oda.oda_adi}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Hash className="h-3 w-3 text-gray-500" />
                      <code className="text-sm bg-gray-900 px-2 py-1 rounded border border-gray-700">
                        {oda.oda_kodu}
                      </code>
                      {oda.qr_kodu && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                          QR
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs ${oda.aktif ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {oda.aktif ? 'AÇIK' : 'KAPALI'}
                </div>
              </div>

              {/* Oda Açıklaması */}
              {oda.aciklama && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <FileText className="h-4 w-4" />
                    <span>Açıklama</span>
                  </div>
                  <p className="text-gray-300 text-sm line-clamp-2">{oda.aciklama}</p>
                </div>
              )}

              {/* QR Kodu Bilgisi */}
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <QrCode className="h-4 w-4" />
                  <span>QR Kodu</span>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-xs bg-gray-900 px-2 py-1 rounded border border-gray-700 truncate flex-1">
                    {oda.qr_kodu || 'QR kodu yok'}
                  </code>
                  {!oda.qr_kodu && (
                    <button
                      onClick={() => generateQRCode(oda)}
                      className="ml-2 text-xs text-green-400 hover:text-green-300"
                    >
                      Oluştur
                    </button>
                  )}
                </div>
              </div>

              {/* Oluşturulma Tarihi */}
              <div className="text-xs text-gray-500 mb-4">
                <MapPin className="h-3 w-3 inline mr-1" />
                Oluşturulma: {new Date(oda.created_at).toLocaleDateString('tr-TR')}
              </div>

              {/* İşlem Butonları */}
              <div className="flex gap-2 pt-4 border-t border-gray-700">
                <button
                  onClick={() => handleEditClick(oda)}
                  className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 text-sm flex items-center justify-center gap-2"
                >
                  <Edit className="h-3 w-3" />
                  Düzenle
                </button>
                <button
                  onClick={() => toggleOdaDurum(oda)}
                  className="flex-1 px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 text-sm flex items-center justify-center gap-2"
                >
                  {oda.aktif ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  {oda.aktif ? 'Kapat' : 'Aç'}
                </button>
                <button
                  onClick={() => deleteOda(oda)}
                  className="flex-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-sm flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-3 w-3" />
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sayfalama Bilgisi */}
      {filteredOdalar.length > 0 && (
        <div className="flex justify-between items-center text-sm text-gray-400">
          <div>
            Toplam <span className="text-white font-semibold">{filteredOdalar.length}</span> oda
            <span className="mx-2">•</span>
            <span className="text-green-400">{istatistikler.aktif} aktif</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={loadOdalar}
              className="px-3 py-1 bg-gray-700 rounded-lg hover:bg-gray-600"
            >
              Listeyi Yenile
            </button>
          </div>
        </div>
      )}

      {/* Oda Modal */}
      {showModal && (
        <OdaModal
          mode={modalMode}
          oda={selectedOda}
          onClose={() => setShowModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
