'use client';

import { useState, useEffect } from 'react';
import { 
  Key, 
  User, 
  Building, 
  Search, 
  Filter, 
  Check, 
  X, 
  Shield,
  Lock,
  Unlock,
  FileText,
  BarChart3,
  Users as UsersIcon,
  Edit3,
  Trash2,
  RefreshCw,
  Link,
  Unlink
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

const supabase = createClient();

type YetkiType = Database['public']['Tables']['kullanici_yetkileri']['Row'];
type KullaniciType = Database['public']['Tables']['kullanicilar']['Row'];
type OdaType = Database['public']['Tables']['odalar']['Row'];

interface YetkiYonetimiProps {
  refreshTrigger?: boolean;
  onYetkiDegisti?: () => void;
}

interface NewYetkiState {
  kullanici_id: number;
  oda_id: number;
  kartela_olusturabilir: boolean;
  kartela_silebilir: boolean;
  rapor_gorebilir: boolean;
  raf_duzenleyebilir: boolean;
  kullanici_yonetebilir: boolean;
  sistem_yoneticisi: boolean;
  aktif: boolean;
}
export default function YetkiYonetimi({ 
  refreshTrigger = false,
  onYetkiDegisti 
}: YetkiYonetimiProps) {
  // State'ler
  const [yetkiler, setYetkiler] = useState<YetkiType[]>([]);
  const [kullanicilar, setKullanicilar] = useState<KullaniciType[]>([]);
  const [odalar, setOdalar] = useState<OdaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtreler
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKullaniciId, setSelectedKullaniciId] = useState<string>('all');
  const [selectedOdaId, setSelectedOdaId] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Modal state'leri
  const [showYetkiModal, setShowYetkiModal] = useState(false);
  const [selectedYetki, setSelectedYetki] = useState<YetkiType | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  // Yeni yetki formu
  const [newYetki, setNewYetki] = useState({
    kullanici_id: 0,
    oda_id: 0,
    kartela_olusturabilir: false,
    kartela_silebilir: false,
    rapor_gorebilir: false,
    raf_duzenleyebilir: false,
    kullanici_yonetebilir: false,
    sistem_yoneticisi: false,
    aktif: true
  });

  // Tüm verileri yükle
  useEffect(() => {
    loadAllData();
  }, [refreshTrigger]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Paralel olarak tüm verileri çek
      const [
        { data: yetkiData, error: yetkiError },
        { data: kullaniciData, error: kullaniciError },
        { data: odaData, error: odaError }
      ] = await Promise.all([
        supabase.from('kullanici_yetkileri').select('*'),
        supabase.from('kullanicilar').select('*').eq('aktif', true),
        supabase.from('odalar').select('*').eq('aktif', true)
      ]);

      if (yetkiError) throw yetkiError;
      if (kullaniciError) throw kullaniciError;
      if (odaError) throw odaError;

      setYetkiler(yetkiData || []);
      setKullanicilar(kullaniciData || []);
      setOdalar(odaData || []);

    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      setError('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Filtrelenmiş yetkiler
  const filteredYetkiler = yetkiler.filter(yetki => {
    // Arama sorgusu
    if (searchQuery) {
      const kullanici = kullanicilar.find(k => k.id === yetki.kullanici_id);
      const oda = odalar.find(o => o.id === yetki.oda_id);
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        (kullanici?.ad?.toLowerCase().includes(searchLower)) ||
        (kullanici?.soyad?.toLowerCase().includes(searchLower)) ||
        (oda?.oda_adi?.toLowerCase().includes(searchLower)) ||
        (oda?.oda_kodu?.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }

    // Kullanıcı filtresi
    if (selectedKullaniciId !== 'all' && yetki.kullanici_id !== Number(selectedKullaniciId)) {
      return false;
    }

    // Oda filtresi
    if (selectedOdaId !== 'all' && yetki.oda_id !== Number(selectedOdaId)) {
      return false;
    }

    // Aktif/pasif filtresi
    if (activeFilter === 'active' && !yetki.aktif) return false;
    if (activeFilter === 'inactive' && yetki.aktif) return false;

    return true;
  });

  // Yetki ekle/güncelle
  const saveYetki = async () => {
    try {
      if (!newYetki.kullanici_id || !newYetki.oda_id) {
        alert('Lütfen kullanıcı ve oda seçin!');
        return;
      }

      if (modalMode === 'edit' && selectedYetki) {
        // Güncelleme
        const { error } = await supabase
          .from('kullanici_yetkileri')
          .update({
    kullanici_id: Number(newYetki.kullanici_id),  // STRING -> NUMBER
    oda_id: Number(newYetki.oda_id),              // STRING -> NUMBER
    kartela_olusturabilir: newYetki.kartela_olusturabilir,
    kartela_silebilir: newYetki.kartela_silebilir,
    rapor_gorebilir: newYetki.rapor_gorebilir,
    raf_duzenleyebilir: newYetki.raf_duzenleyebilir,
    kullanici_yonetebilir: newYetki.kullanici_yonetebilir,
    sistem_yoneticisi: newYetki.sistem_yoneticisi,
    aktif: newYetki.aktif
  })
          .eq('id', selectedYetki.id);

        if (error) throw error;

        // Sistem logu
        const kullanici = kullanicilar.find(k => k.id === Number(newYetki.kullanici_id));
        const oda = odalar.find(o => o.id === Number(newYetki.oda_id));
        await supabase.from('sistem_loglari').insert([{
          islem_turu: 'YETKI_GUNCELLENDI',
          detay: `${kullanici?.ad} ${kullanici?.soyad} → ${oda?.oda_adi} yetkileri güncellendi`,
          ip_adresi: '127.0.0.1'
        }]);

      } else {
        // Yeni yetki
        const { error } = await supabase
          .from('kullanici_yetkileri')
          .insert([{
  kullanici_id: Number(newYetki.kullanici_id),  // STRING -> NUMBER
  oda_id: Number(newYetki.oda_id),              // STRING -> NUMBER
  kartela_olusturabilir: newYetki.kartela_olusturabilir,
  kartela_silebilir: newYetki.kartela_silebilir,
  rapor_gorebilir: newYetki.rapor_gorebilir,
  raf_duzenleyebilir: newYetki.raf_duzenleyebilir,
  kullanici_yonetebilir: newYetki.kullanici_yonetebilir,
  sistem_yoneticisi: newYetki.sistem_yoneticisi,
  aktif: newYetki.aktif
}]);

        if (error) throw error;

        // Sistem logu
        const kullanici = kullanicilar.find(k => k.id === Number(newYetki.kullanici_id));
        const oda = odalar.find(o => o.id === Number(newYetki.oda_id));
        await supabase.from('sistem_loglari').insert([{
          islem_turu: 'YETKI_OLUSTURULDU',
          detay: `${kullanici?.ad} ${kullanici?.soyad} → ${oda?.oda_adi} yetkisi oluşturuldu`,
          ip_adresi: '127.0.0.1'
        }]);
      }

      await loadAllData();
      resetYetkiForm();
      setShowYetkiModal(false);
      onYetkiDegisti?.();

    } catch (error: any) {
      console.error('Yetki kaydetme hatası:', error);
      
      // Unique constraint hatası (aynı kullanıcı-oda çifti)
      if (error.code === '23505') {
        alert('Bu kullanıcı için bu odada zaten yetki kaydı var!');
      } else {
        alert('Yetki kaydedilemedi!');
      }
    }
  };

  // Yetki durumunu değiştir
  const toggleYetkiDurum = async (yetki: YetkiType) => {
    try {
      const { error } = await supabase
        .from('kullanici_yetkileri')
        .update({ aktif: !yetki.aktif })
        .eq('id', yetki.id);

      if (error) throw error;

      // Yerel state'i güncelle
      setYetkiler(prev => prev.map(y => 
        y.id === yetki.id ? { ...y, aktif: !yetki.aktif } : y
      ));

      // Sistem logu
      const kullanici = kullanicilar.find(k => k.id === yetki.kullanici_id);
      const oda = odalar.find(o => o.id === yetki.oda_id);
      await supabase.from('sistem_loglari').insert([{
        islem_turu: yetki.aktif ? 'YETKI_PASIF_YAPILDI' : 'YETKI_AKTIF_YAPILDI',
        detay: `${kullanici?.ad} ${kullanici?.soyad} → ${oda?.oda_adi} yetkisi ${yetki.aktif ? 'pasif' : 'aktif'} yapıldı`,
        ip_adresi: '127.0.0.1'
      }]);

      onYetkiDegisti?.();

    } catch (error) {
      console.error('Yetki durumu değiştirme hatası:', error);
      alert('İşlem başarısız oldu');
    }
  };

  // Yetki sil
  const deleteYetki = async (yetki: YetkiType) => {
    if (!confirm('Bu yetki kaydını silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('kullanici_yetkileri')
        .delete()
        .eq('id', yetki.id);

      if (error) throw error;

      // Listeden kaldır
      setYetkiler(prev => prev.filter(y => y.id !== yetki.id));

      // Sistem logu
      const kullanici = kullanicilar.find(k => k.id === yetki.kullanici_id);
      const oda = odalar.find(o => o.id === yetki.oda_id);
      await supabase.from('sistem_loglari').insert([{
        islem_turu: 'YETKI_SILINDI',
        detay: `${kullanici?.ad} ${kullanici?.soyad} → ${oda?.oda_adi} yetkisi silindi`,
        ip_adresi: '127.0.0.1'
      }]);

      onYetkiDegisti?.();

    } catch (error) {
      console.error('Yetki silme hatası:', error);
      alert('Yetki silinemedi!');
    }
  };

  // Yetki formunu sıfırla
  const resetYetkiForm = () => {
    setNewYetki({
      kullanici_id: 0,
      oda_id: 0,
      kartela_olusturabilir: false,
      kartela_silebilir: false,
      rapor_gorebilir: false,
      raf_duzenleyebilir: false,
      kullanici_yonetebilir: false,
      sistem_yoneticisi: false,
      aktif: true
    });
    setSelectedYetki(null);
  };

  // Modal açma işlemleri
  const handleCreateClick = () => {
    resetYetkiForm();
    setModalMode('create');
    setShowYetkiModal(true);
  };

  const handleEditClick = (yetki: YetkiType) => {
    setSelectedYetki(yetki);
    setNewYetki({
      kullanici_id: yetki.kullanici_id,
      oda_id: yetki.oda_id,
      kartela_olusturabilir: yetki.kartela_olusturabilir || false,
      kartela_silebilir: yetki.kartela_silebilir || false,
      rapor_gorebilir: yetki.rapor_gorebilir || false,
      raf_duzenleyebilir: yetki.raf_duzenleyebilir || false,
      kullanici_yonetebilir: yetki.kullanici_yonetebilir || false,
      sistem_yoneticisi: yetki.sistem_yoneticisi || false,
      aktif: yetki.aktif || false 
    });
    setModalMode('edit');
    setShowYetkiModal(true);
  };

  // İstatistikler
  const istatistikler = {
    toplam: yetkiler.length,
    aktif: yetkiler.filter(y => y.aktif).length,
    sistemYoneticisi: yetkiler.filter(y => y.sistem_yoneticisi).length,
    kartelaOlusturma: yetkiler.filter(y => y.kartela_olusturabilir).length,
    kullaniciYonetimi: yetkiler.filter(y => y.kullanici_yonetebilir).length
  };

  // Loading state
  if (loading && yetkiler.length === 0) {
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
          <h2 className="text-2xl font-bold text-white">Yetki Yönetimi</h2>
          <p className="text-gray-400">Kullanıcı-oda yetki ilişkilerini yönetin</p>
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
          <div className="px-3 py-1 bg-purple-500/20 rounded-lg">
            <span className="text-purple-400 text-sm">Sistem Yön.: </span>
            <span className="text-purple-400 font-semibold">{istatistikler.sistemYoneticisi}</span>
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
                placeholder="Kullanıcı veya oda ara..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-white"
              />
            </div>
          </div>

          {/* Filtreler */}
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedKullaniciId}
              onChange={(e) => setSelectedKullaniciId(e.target.value)}
              className="px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
            >
              <option value="all">Tüm Kullanıcılar</option>
              {kullanicilar.map(kullanici => (
                <option key={kullanici.id} value={kullanici.id}>
                  {kullanici.ad} {kullanici.soyad}
                </option>
              ))}
            </select>

            <select
              value={selectedOdaId}
              onChange={(e) => setSelectedOdaId(e.target.value)}
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
              onClick={handleCreateClick}
              className="px-4 py-2.5 bg-gradient-to-r from-yellow-600 to-amber-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
            >
              <Link className="h-4 w-4" />
              Yeni Yetki
            </button>
          </div>
        </div>
      </div>

      {/* Yetki Listesi */}
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
      ) : filteredYetkiler.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
          <Key className="h-16 w-16 mx-auto text-gray-700 mb-4" />
          <p className="text-gray-500">Yetki kaydı bulunamadı</p>
          <button
            onClick={handleCreateClick}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            İlk Yetkiyi Oluştur
          </button>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-750">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Kullanıcı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Oda</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Yetkiler</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredYetkiler.map((yetki) => {
                  const kullanici = kullanicilar.find(k => k.id === yetki.kullanici_id);
                  const oda = odalar.find(o => o.id === yetki.oda_id);
                  
                  if (!kullanici || !oda) return null;

                  return (
                    <tr key={yetki.id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${kullanici.aktif ? 'bg-blue-500/20' : 'bg-gray-700'}`}>
                            <User className={`h-5 w-5 ${kullanici.aktif ? 'text-blue-400' : 'text-gray-500'}`} />
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {kullanici.ad} {kullanici.soyad}
                            </div>
                            <div className="text-sm text-gray-400">
                              {kullanici.unvan || '-'}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              <code className="bg-gray-900 px-2 py-1 rounded border border-gray-700">
                                {kullanici.kullanici_kodu}
                              </code>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${oda.aktif ? 'bg-green-500/20' : 'bg-gray-700'}`}>
                            <Building className={`h-5 w-5 ${oda.aktif ? 'text-green-400' : 'text-gray-500'}`} />
                          </div>
                          <div>
                            <div className="font-semibold text-white">{oda.oda_adi}</div>
                            <div className="text-sm text-gray-400">{oda.oda_kodu}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {oda.kat || '-'} • {oda.bina || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {yetki.kartela_olusturabilir && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs" title="Kartela Oluşturabilir">
                              <FileText className="h-3 w-3 inline mr-1" />
                              Kartela
                            </span>
                          )}
                          {yetki.kartela_silebilir && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs" title="Kartela Silebilir">
                              <Trash2 className="h-3 w-3 inline mr-1" />
                              Sil
                            </span>
                          )}
                          {yetki.rapor_gorebilir && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs" title="Rapor Görebilir">
                              <BarChart3 className="h-3 w-3 inline mr-1" />
                              Rapor
                            </span>
                          )}
                          {yetki.raf_duzenleyebilir && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs" title="Raf Düzenleyebilir">
                              <Edit3 className="h-3 w-3 inline mr-1" />
                              Raf
                            </span>
                          )}
                          {yetki.kullanici_yonetebilir && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs" title="Kullanıcı Yönetebilir">
                              <UsersIcon className="h-3 w-3 inline mr-1" />
                              Kullanıcı
                            </span>
                          )}
                          {yetki.sistem_yoneticisi && (
                            <span className="px-2 py-1 bg-pink-500/20 text-pink-400 rounded text-xs" title="Sistem Yöneticisi">
                              <Shield className="h-3 w-3 inline mr-1" />
                              Sistem
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${yetki.aktif ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className={`text-sm ${yetki.aktif ? 'text-green-400' : 'text-red-400'}`}>
                              {yetki.aktif ? 'Aktif' : 'Pasif'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(yetki.created_at || '1970-01-01').toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClick(yetki)}
                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                            title="Düzenle"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleYetkiDurum(yetki)}
                            className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg"
                            title={yetki.aktif ? 'Pasif Yap' : 'Aktif Yap'}
                          >
                            {yetki.aktif ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => deleteYetki(yetki)}
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
      {filteredYetkiler.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <div>
            Toplam <span className="text-white font-semibold">{filteredYetkiler.length}</span> yetki kaydı
            <span className="mx-2">•</span>
            <span className="text-green-400">{istatistikler.aktif} aktif</span>
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

      {/* Yetki Modal */}
      {showYetkiModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {modalMode === 'edit' ? 'Yetki Düzenle' : 'Yeni Yetki'}
                  </h2>
                  <p className="text-gray-400">
                    {modalMode === 'edit' ? 'Yetki bilgilerini güncelleyin' : 'Yeni yetki ilişkisi oluşturun'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowYetkiModal(false);
                    resetYetkiForm();
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Yetki Formu */}
              <div className="space-y-6">
                {/* Kullanıcı ve Oda Seçimi */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Kullanıcı *
                    </label>
                    <select
                      value={newYetki.kullanici_id}
                      onChange={(e) => setNewYetki({...newYetki, kullanici_id: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-white"
                    >
                      <option value="">Kullanıcı seçin</option>
                      {kullanicilar.map(kullanici => (
                        <option key={kullanici.id} value={kullanici.id}>
                          {kullanici.ad} {kullanici.soyad} ({kullanici.kullanici_kodu})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Oda *
                    </label>
                    <select
                      value={newYetki.oda_id}
                      onChange={(e) => setNewYetki({...newYetki, oda_id: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-white"
                    >
                      <option value="">Oda seçin</option>
                      {odalar.map(oda => (
                        <option key={oda.id} value={oda.id}>
                          {oda.oda_adi} ({oda.oda_kodu})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Yetki Seçenekleri */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Yetki Seçenekleri</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 'kartela_olusturabilir', label: 'Kartela Oluşturabilir', icon: FileText, color: 'blue' },
                      { id: 'kartela_silebilir', label: 'Kartela Silebilir', icon: Trash2, color: 'red' },
                      { id: 'rapor_gorebilir', label: 'Rapor Görebilir', icon: BarChart3, color: 'green' },
                      { id: 'raf_duzenleyebilir', label: 'Raf Düzenleyebilir', icon: Edit3, color: 'yellow' },
                      { id: 'kullanici_yonetebilir', label: 'Kullanıcı Yönetebilir', icon: UsersIcon, color: 'purple' },
                      { id: 'sistem_yoneticisi', label: 'Sistem Yöneticisi', icon: Shield, color: 'pink' }
                    ].map((yetki) => {
                      const Icon = yetki.icon;
                      return (
                        <div key={yetki.id} className="flex items-center gap-3 p-3 bg-gray-750 rounded-lg">
                          <div className={`p-2 rounded-lg bg-${yetki.color}-500/20`}>
                            <Icon className={`h-5 w-5 text-${yetki.color}-400`} />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-300">{yetki.label}</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={newYetki[yetki.id as keyof typeof newYetki] as boolean}
                            onChange={(e) => setNewYetki({...newYetki, [yetki.id]: e.target.checked})}
                            className="h-5 w-5 rounded border-gray-700 bg-gray-900"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Durum Seçeneği */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="aktif"
                    checked={newYetki.aktif}
                    onChange={(e) => setNewYetki({...newYetki, aktif: e.target.checked})}
                    className="h-5 w-5 rounded border-gray-700 bg-gray-900 text-yellow-600 focus:ring-yellow-500"
                  />
                  <label htmlFor="aktif" className="text-gray-300">
                    Yetki aktif (kullanılabilir)
                  </label>
                </div>
              </div>

              {/* Form Butonları */}
              <div className="mt-8 pt-6 border-t border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowYetkiModal(false);
                    resetYetkiForm();
                  }}
                  className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  onClick={saveYetki}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-amber-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
                >
                  <Key className="h-4 w-4" />
                  {modalMode === 'edit' ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
