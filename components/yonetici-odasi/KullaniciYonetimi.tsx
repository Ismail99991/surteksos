'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  Edit, 
  Trash2, 
  Search, 
  Check, 
  X, 
  QrCode,
  Lock,
  Unlock,
  Shield,
  Mail,
  Phone,
  Building
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import KullaniciModal from './modals/KullaniciModal';

const supabase = createClient();

type KullaniciType = Database['public']['Tables']['kullanicilar']['Row'];

interface KullaniciYonetimiProps {
  onKullaniciEklendi?: () => void;
  onKullaniciGuncellendi?: () => void;
  refreshTrigger?: boolean;
}

export default function KullaniciYonetimi({ 
  onKullaniciEklendi,
  onKullaniciGuncellendi,
  refreshTrigger = false
}: KullaniciYonetimiProps) {
  const [kullanicilar, setKullanicilar] = useState<KullaniciType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [aktifFiltre, setAktifFiltre] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedKullanici, setSelectedKullanici] = useState<KullaniciType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Kullanıcıları yükle
  useEffect(() => {
    loadKullanicilar();
  }, [refreshTrigger]);

  const loadKullanicilar = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('kullanicilar')
        .select('*')
        .order('olusturulma_tarihi', { ascending: false });

      // Aktif filtre uygula
      if (aktifFiltre === 'active') {
        query = query.eq('aktif', true);
      } else if (aktifFiltre === 'inactive') {
        query = query.eq('aktif', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setKullanicilar(data || []);

    } catch (error) {
      console.error('Kullanıcı yükleme hatası:', error);
      setError('Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Filtrelenmiş kullanıcılar
  const filteredKullanicilar = kullanicilar.filter(kullanici => {
    const searchLower = searchQuery.toLowerCase();
    return (
      kullanici.ad.toLowerCase().includes(searchLower) ||
      kullanici.soyad.toLowerCase().includes(searchLower) ||
      kullanici.kullanici_kodu.toLowerCase().includes(searchLower) ||
      (kullanici.unvan || '').toLowerCase().includes(searchLower) ||
      (kullanici.departman || '').toLowerCase().includes(searchLower)
    );
  });

  // Kullanıcı durumunu değiştir
  const toggleKullaniciDurum = async (kullanici: KullaniciType) => {
    try {
      const { error } = await (supabase as any)
        .from('kullanicilar')
        .update({ aktif: !kullanici.aktif })
        .eq('id', kullanici.id);

      if (error) throw error;

      // Yerel state'i güncelle
      setKullanicilar(prev => prev.map(k => 
        k.id === kullanici.id ? { ...k, aktif: !k.aktif } : k
      ));

      // Sistem logu ekle
      await (supabase as any).from('hareket_loglari').insert([{
        hareket_tipi: kullanici.aktif ? 'KULLANICI_PASIF_YAPILDI' : 'KULLANICI_AKTIF_YAPILDI',
        islem_detay: `${kullanici.ad} ${kullanici.soyad} ${kullanici.aktif ? 'pasif' : 'aktif'} yapıldı`,
        ip_adresi: '127.0.0.1',
        tarih: new Date().toISOString()
      }]);

      onKullaniciGuncellendi?.();

    } catch (error) {
      console.error('Kullanıcı durumu değiştirme hatası:', error);
      alert('İşlem başarısız oldu');
    }
  };

  // QR kodu oluştur
  const generateQRCode = async (kullanici: KullaniciType) => {
    try {
      const qrText = `USER-${kullanici.kullanici_kodu}-${Date.now()}`;
      
      const { error } = await (supabase as any)
        .from('kullanicilar')
        .update({ qr_kodu: qrText })
        .eq('id', kullanici.id);

      if (error) throw error;

      // Yerel state'i güncelle
      setKullanicilar(prev => prev.map(k => 
        k.id === kullanici.id ? { ...k, qr_kodu: qrText } : k
      ));

      alert('QR kodu oluşturuldu ve atandı!');

      // Sistem logu ekle
      await (supabase as any).from('hareket_loglari').insert([{
        hareket_tipi: 'KULLANICI_QR_OLUSTURULDU',
        islem_detay: `${kullanici.ad} ${kullanici.soyad} için QR kodu oluşturuldu`,
        ip_adresi: '127.0.0.1',
        tarih: new Date().toISOString()
      }]);

    } catch (error) {
      console.error('QR kod oluşturma hatası:', error);
      alert('QR kodu oluşturulamadı!');
    }
  };

  // Kullanıcı sil (soft delete)
 const deleteKullanici = async (kullanici: KullaniciType) => {
  if (!confirm(`${kullanici.ad} ${kullanici.soyad} kullanıcısını silmek istediğinize emin misiniz?`)) {
    return;
  }

  try {
    // 1. ÖNCE KULLANICIYI PASİF YAP (soft delete)
    const { error: updateError } = await (supabase as any)
      .from('kullanicilar')
      .update({ aktif: false })
      .eq('id', kullanici.id);

    if (updateError) throw updateError;

    // 2. SONRA YETKİLERİ SİL (foreign key hatasını önlemek için)
    const { error: yetkiError } = await (supabase as any)
      .from('kullanici_yetkileri')
      .delete()
      .eq('kullanici_id', kullanici.id);

    if (yetkiError) throw yetkiError;

    // 3. LİSTEDEN KALDIR (state güncelleme)
    setKullanicilar(prev => {
      const yeniListe = prev.filter(k => k.id !== kullanici.id);
      console.log('Eski liste:', prev.length, 'Yeni liste:', yeniListe.length);
      return yeniListe;
    });

    // 4. SİSTEM LOGU
    await (supabase as any).from('hareket_loglari').insert([{
      hareket_tipi: 'KULLANICI_SILINDI',
      islem_detay: `${kullanici.ad} ${kullanici.soyad} kullanıcısı silindi`,
      ip_adresi: '127.0.0.1',
      tarih: new Date().toISOString()
    }]);

    alert('Kullanıcı silindi!');
    onKullaniciGuncellendi?.();

  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    
    // HATA MESAJINI GÖSTER
    if (error.message?.includes('foreign key')) {
      alert('Bu kullanıcı silinemiyor! Önce yetkilerini kaldırın.');
    } else {
      alert('Kullanıcı silinemedi: ' + error.message);
    }
  }
};

  // Modal işlemleri
  const handleCreateClick = () => {
    setSelectedKullanici(null);
    setModalMode('create');
    setShowModal(true);
  };

  const handleEditClick = (kullanici: KullaniciType) => {
    setSelectedKullanici(kullanici);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    loadKullanicilar();
    modalMode === 'create' ? onKullaniciEklendi?.() : onKullaniciGuncellendi?.();
  };

  // İstatistikler
  const istatistikler = {
    toplam: kullanicilar.length,
    aktif: kullanicilar.filter(k => k.aktif).length,
    qrKoduOlan: kullanicilar.filter(k => k.qr_kodu).length
  };

  if (loading && kullanicilar.length === 0) {
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
          <h2 className="text-2xl font-bold text-white">Kullanıcı Yönetimi</h2>
          <p className="text-gray-400">Sistem kullanıcılarını yönetin</p>
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
            <span className="text-purple-400 text-sm">QR Kod: </span>
            <span className="text-purple-400 font-semibold">{istatistikler.qrKoduOlan}</span>
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
                placeholder="Kullanıcı ara..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white"
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
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Yeni Kullanıcı
            </button>
          </div>
        </div>
      </div>

      {/* Kullanıcı Listesi */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <div className="text-red-400 mb-4">⚠️ {error}</div>
            <button
              onClick={loadKullanicilar}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
            >
              Tekrar Dene
            </button>
          </div>
        ) : filteredKullanicilar.length === 0 ? (
          <div className="p-8 text-center">
            <User className="h-16 w-16 mx-auto text-gray-700 mb-4" />
            <p className="text-gray-500">Kullanıcı bulunamadı</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-blue-400 hover:text-blue-300"
              >
                Aramayı temizle
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-750">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Kullanıcı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">İletişim</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredKullanicilar.map((kullanici) => (
                  <tr key={kullanici.id} className="hover:bg-gray-750 transition-colors">
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
                            {kullanici.unvan || '-'} • {kullanici.departman || '-'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            <code className="bg-gray-900 px-2 py-1 rounded border border-gray-700">
                              {kullanici.kullanici_kodu}
                            </code>
                            {kullanici.qr_kodu && (
                              <span className="ml-2 text-green-400">✓ QR</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-400">
                          Unvan: {kullanici.unvan || '-'}
                        </div>
                        <div className="text-sm text-gray-400">
                          Departman: {kullanici.departman || '-'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${kullanici.aktif ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className={`text-sm ${kullanici.aktif ? 'text-green-400' : 'text-red-400'}`}>
                            {kullanici.aktif ? 'Aktif' : 'Pasif'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(kullanici.olusturulma_tarihi|| Date.now()).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(kullanici)}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                          title="Düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => generateQRCode(kullanici)}
                          className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg"
                          title="QR Üret"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleKullaniciDurum(kullanici)}
                          className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg"
                          title={kullanici.aktif ? 'Pasif Yap' : 'Aktif Yap'}
                        >
                          {kullanici.aktif ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => deleteKullanici(kullanici)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sayfalama Bilgisi */}
      {filteredKullanicilar.length > 0 && (
        <div className="flex justify-between items-center text-sm text-gray-400">
          <div>
            Toplam <span className="text-white font-semibold">{filteredKullanicilar.length}</span> kullanıcı
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={loadKullanicilar}
              className="px-3 py-1 bg-gray-700 rounded-lg hover:bg-gray-600"
            >
              Listeyi Yenile
            </button>
          </div>
        </div>
      )}

      {/* Kullanıcı Modal */}
      {showModal && (
        <KullaniciModal
          mode={modalMode}
          kullanici={selectedKullanici}
          onClose={() => setShowModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
