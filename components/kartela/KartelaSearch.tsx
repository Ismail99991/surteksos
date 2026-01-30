'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Building, User, Eye, X, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import KartelaDetay from './KartelaDetay';
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

interface KartelaSearchProps {
  currentRoom: string;
  currentUserId?: string;
}

export default function KartelaSearch({ currentRoom, currentUserId }: KartelaSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDurum, setFilterDurum] = useState<string>('');
  const [sonuclar, setSonuclar] = useState<Kartela[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKartela, setSelectedKartela] = useState<Kartela | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    archive: 0
  });

  const supabase = createClient();

  // Odaya göre başlık ve açıklama
  const odaBilgileri = {
    'Amir Odası': {
      icon: User,
      title: 'Amir Kartela İzleme',
      description: 'Tüm kartelaları görüntüleyebilir ve analiz edebilirsiniz.',
      yetki: 'Tam Yetki',
      color: 'purple'
    },
    'Kartela Odası': {
      icon: Building,
      title: 'Kartela Arama Sistemi',
      description: 'Kartela barkodlarını taratın veya renk kodları ile arama yapın.',
      yetki: 'Operasyonel Yetki',
      color: 'blue'
    },
    'Üretim Alanı': {
      icon: Eye,
      title: 'Üretim Kartela Kontrol',
      description: 'Üretimdeki kartelaları kontrol edin.',
      yetki: 'Üretim Yetkisi',
      color: 'green'
    },
    'Depo': {
      icon: MapPin,
      title: 'Depo Kartela Takip',
      description: 'Depodaki kartelaları görüntüleyin.',
      yetki: 'Depo Yetkisi',
      color: 'amber'
    },
    'Lab Odası': {
      icon: Eye,
      title: 'Lab Renk Analizi',
      description: 'Renk analizi ve pantone atama.',
      yetki: 'Lab Yetkisi',
      color: 'pink'
    },
    'Kalite Kontrol': {
      icon: Eye,
      title: 'Kalite Kontrol',
      description: 'Kalite kontrol ve onay işlemleri.',
      yetki: 'Kalite Yetkisi',
      color: 'indigo'
    },
    'Yönetici Odası': {
      icon: User,
      title: 'Yönetici Dashboard',
      description: 'Sistem yönetimi ve raporlama.',
      yetki: 'Yönetici Yetkisi',
      color: 'red'
    }
  };

  const odaBilgi = odaBilgileri[currentRoom as keyof typeof odaBilgileri] || {
    icon: Eye,
    title: 'Kartela Arama',
    description: 'Kartela bilgilerini görüntüleyin.',
    yetki: 'Sınırlı Yetki',
    color: 'gray'
  };

  // İstatistikleri getir
  useEffect(() => {
    fetchStats();
  }, [currentRoom]);

  const fetchStats = async () => {
    try {
      // Mock stats for now
      setStats({
        total: 156,
        active: 89,
        archive: 42
      });
    } catch (error) {
      console.error("İstatistik yüklenemedi:", error);
      setStats({
        total: 0,
        active: 0,
        archive: 0
      });
    }
  };
      });
    } catch (error) {
      console.error('İstatistik yüklenemedi:', error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    
    try {
      let query = supabase
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
        .order('olusturulma_tarihi', { ascending: false });

      // Arama sorgusu
      if (searchQuery.trim()) {
        // Renk kodu ara (23011737.1'den 1737 çıkar)
        const extractedNumber = searchQuery.match(/\d{4}(\d{4})\.\d/);
        const searchNumber = extractedNumber ? extractedNumber[1] : searchQuery;
        
        query = query.or(`
          renk_kodu.ilike.%${searchQuery}%,
          renk_adi.ilike.%${searchQuery}%,
          kartela_no.ilike.%${searchQuery}%,
          renk_kodu.ilike.%${searchNumber}%,
          musteri_adi.ilike.%${searchQuery}%
        `);
      }

      // Durum filtresi
      if (filterDurum) {
        // Mapping: aktif -> AKTIF, arsivde -> KARTELA_ARSIV, vs.
        const durumMap: Record<string, string> = {
          'aktif': 'AKTIF',
          'dolu': 'DOLU',
          'arsivde': 'KARTELA_ARSIV',
          'kalitede': 'KALITE_ARSIV',
          'kullanim_disi': 'KULLANIM_DISI'
        };
        
        const dbDurum = durumMap[filterDurum] || filterDurum.toUpperCase();
        query = query.eq('durum', dbDurum);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      setSonuclar(data || []);
      
      console.log(`[${currentRoom}] Arama:`, {
        arama: searchQuery,
        bulunan: data?.length || 0
      });

    } catch (error) {
      console.error('Arama hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleKartelaClick = (kartela: Kartela) => {
    setSelectedKartela(kartela);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedKartela(null), 300);
  };

  const formatTarih = (tarih: string) => {
    return new Date(tarih).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDurumBadge = (durum: string) => {
    const durumlar = {
      'AKTIF': { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Aktif' },
      'DOLU': { bg: 'bg-blue-100', text: 'text-blue-800', label: '🔵 Dolu (Arşiv Bekliyor)' },
      'KARTELA_ARSIV': { bg: 'bg-gray-100', text: 'text-gray-800', label: '📦 Kartela Arşivi' },
      'KALITE_ARSIV': { bg: 'bg-indigo-100', text: 'text-indigo-800', label: '🏷️ Kalite Arşivi' },
      'KULLANIM_DISI': { bg: 'bg-red-100', text: 'text-red-800', label: '⛔ Kullanım Dışı' },
      'LAB_DEĞERLENDİRME': { bg: 'bg-pink-100', text: 'text-pink-800', label: '🔬 Lab Değerlendirme' }
    };

    const durumBilgi = durumlar[durum as keyof typeof durumlar] || 
      { bg: 'bg-gray-100', text: 'text-gray-800', label: durum };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${durumBilgi.bg} ${durumBilgi.text}`}>
        {durumBilgi.label}
      </span>
    );
  };

  const getGozDurumu = (goz_sayisi: number) => {
    const yuzde = (goz_sayisi / 14) * 100;
    
    if (goz_sayisi === 0) {
      return { text: '🆕 Yeni (0/14)', color: 'text-gray-600' };
    } else if (goz_sayisi < 7) {
      return { text: `🟢 ${goz_sayisi}/14`, color: 'text-green-600' };
    } else if (goz_sayisi < 14) {
      return { text: `🟡 ${goz_sayisi}/14`, color: 'text-yellow-600' };
    } else {
      return { text: `🔴 DOLU (14/14)`, color: 'text-red-600' };
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        {/* Oda Başlığı */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-${odaBilgi.color}-100`}>
                <odaBilgi.icon className={`h-6 w-6 text-${odaBilgi.color}-600`} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{odaBilgi.title}</h3>
                <p className="text-gray-600">{odaBilgi.description}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                📍 {currentRoom}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                🔑 {odaBilgi.yetki}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                📊 Toplam: {stats.total} Kartela
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                ✅ Aktif: {stats.active}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                📦 Arşiv: {stats.archive}
              </span>
            </div>
          </div>
        </div>

        {/* Arama Formu */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                currentRoom === 'Amir Odası' 
                  ? "Renk kodu, kartela no, renk adı veya müşteri ara..."
                  : currentRoom === 'Kartela Odası'
                  ? "Kartela barkodu taratın veya renk kodu girin (örn: 1737)"
                  : "Renk kodu (1737), renk adı veya kartela no girin"
              }
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800"
            />
          </div>

          <div className="relative min-w-[180px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={filterDurum}
              onChange={(e) => setFilterDurum(e.target.value)}
              className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white text-gray-800"
            >
              <option value="">Tüm Durumlar</option>
              <option value="aktif">✅ Aktif</option>
              <option value="dolu">🔵 Dolu (Arşiv Bekliyor)</option>
              <option value="arsivde">📦 Kartela Arşivi</option>
              <option value="kalitede">🏷️ Kalite Arşivi</option>
              <option value="kullanim_disi">⛔ Kullanım Dışı</option>
            </select>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            className={`px-6 py-3 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 transition whitespace-nowrap bg-${odaBilgi.color}-600 focus:ring-${odaBilgi.color}-500`}
          >
            {loading ? '🔍 Aranıyor...' : 'Ara'}
          </button>
        </div>

        {/* Format Bilgisi */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-blue-600">🎯</div>
            <p className="text-sm text-blue-800 font-medium">Arama Formatı (Tüm odalarda geçerli):</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="bg-white p-3 rounded border">
              <div className="font-mono text-gray-900">23011737.1</div>
              <div className="text-green-600 text-xs mt-1">→ "1737" ile ara</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="font-mono text-gray-900">1737</div>
              <div className="text-green-600 text-xs mt-1">→ "23011737.1" rengini bul</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="font-mono text-gray-900">KT-2024-0001</div>
              <div className="text-green-600 text-xs mt-1">→ Kartela no ile ara</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-blue-700">
              💡 Boş arama yaparsanız tüm kartelaları görüntüleyebilirsiniz.
            </p>
          </div>
        </div>

        {/* Yükleme */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-14 w-14 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 font-medium">Supabase veritabanında aranıyor...</p>
            <p className="text-sm text-gray-500 mt-2">{currentRoom} • PostgreSQL</p>
          </div>
        )}

        {/* Sonuçlar */}
        {!loading && sonuclar.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-semibold text-gray-900">
                {currentRoom === 'Amir Odası' ? '📊 Analiz Sonuçları' : 
                 currentRoom === 'Kartela Odası' ? '📦 Bulunan Kartelalar' :
                 currentRoom === 'Üretim Alanı' ? '🏭 Üretim Kartelaları' :
                 currentRoom === 'Lab Odası' ? '🔬 Lab Kartelaları' :
                 '📦 Kartelalar'}
                <span className="ml-3 text-blue-600">({sonuclar.length})</span>
              </h4>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Supabase PostgreSQL
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sonuclar.map((kartela) => {
                const gozDurumu = getGozDurumu(kartela.goz_sayisi);
                
                return (
                  <div 
                    key={kartela.id} 
                    onClick={() => handleKartelaClick(kartela)}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 cursor-pointer transition-all group bg-white"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-mono font-bold text-gray-900 group-hover:text-blue-600">
                          {kartela.kartela_no}
                        </div>
                        <div className="text-xs text-gray-500">
                          Renk: {kartela.renk_kodu}
                          {kartela.renk_masalari?.pantone_kodu && (
                            <span className="ml-2">• Pantone: {kartela.renk_masalari.pantone_kodu}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getDurumBadge(kartela.durum)}
                        <div className={`text-xs font-medium ${gozDurumu.color}`}>
                          {gozDurumu.text}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="text-xl font-bold text-gray-800 group-hover:text-blue-700">
                        {kartela.renk_adi}
                      </div>
                      {kartela.musteri_adi && (
                        <div className="text-gray-600 mt-1 text-sm">
                          🏢 {kartela.musteri_adi}
                        </div>
                      )}
                      {kartela.proje_kodu && (
                        <div className="text-gray-500 text-xs mt-1">
                          📋 Proje: {kartela.proje_kodu}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {kartela.hucreler ? (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          <div>
                            <div className="font-medium">{kartela.hucreler.hucre_kodu}</div>
                            <div className="text-xs text-gray-500">
                              Kapasite: {kartela.hucreler.mevcut_kartela_sayisi}/{kartela.hucreler.kapasite}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm">
                          📍 Hücreye yerleştirilmemiş
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs">
                          📅 {formatTarih(kartela.olusturulma_tarihi)}
                        </span>
                        <span className="text-blue-600 font-medium text-sm">
                          Detay →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* İpucu */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg border text-center">
              <p className="text-sm text-gray-600">
                💡 Bir kartelaya tıklayarak <strong>lokasyon bilgilerini</strong> ve <strong>hareket geçmişini</strong> görüntüleyin.
              </p>
            </div>
          </div>
        )}

        {!loading && searchQuery && sonuclar.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-6">🔍</div>
            <p className="text-xl font-medium">"{searchQuery}" için sonuç bulunamadı</p>
            <p className="text-gray-600 mt-2">Farklı bir renk kodu, kartela no veya renk adı deneyin</p>
            <div className="mt-6 text-sm text-gray-400">
              📍 {currentRoom} • Supabase PostgreSQL
            </div>
          </div>
        )}

        {!loading && !searchQuery && sonuclar.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-6">
              {currentRoom === 'Amir Odası' ? '📊' :
               currentRoom === 'Kartela Odası' ? '🎨' :
               currentRoom === 'Üretim Alanı' ? '🏭' : 
               currentRoom === 'Lab Odası' ? '🔬' : '📦'}
            </div>
            <p className="text-xl font-medium">
              {currentRoom === 'Amir Odası' 
                ? 'Kartela analizi için arama yapın' 
                : currentRoom === 'Kartela Odası'
                ? 'Kartela barkodu taratın veya renk kodu girin'
                : currentRoom === 'Lab Odası'
                ? 'Lab analizi için renk kodu ara'
                : 'Kartela aramak için renk kodu veya adı yazın'}
            </p>
            <p className="text-gray-600 mt-2">
              {currentRoom === 'Amir Odası'
                ? 'Tüm kartelaları görüntülemek için arama yapabilirsiniz'
                : 'Renk kodu (1737) veya renk adı (siyah) ile arama yapabilirsiniz'}
            </p>
            <button
              onClick={handleSearch}
              className="mt-6 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
            >
              Tüm Kartelaları Göster
            </button>
          </div>
        )}
      </div>

      {/* Modal - Kartela Detay */}
      {showModal && selectedKartela && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Kartela Detayları</h2>
                  <p className="text-gray-600">{selectedKartela.kartela_no} • {selectedKartela.renk_adi}</p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <KartelaDetay kartela={selectedKartela} />
              
              <div className="mt-6 pt-6 border-t flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Kapat
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(selectedKartela.kartela_no);
                    alert('Kartela no kopyalandı!');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Kartela No Kopyala
                </button>
                {(currentRoom === 'Kartela Odası' || currentRoom === 'Yönetici Odası') && (
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    Lokasyon Güncelle
                  </button>
                )}
                {currentRoom === 'Lab Odası' && (
                  <button className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition">
                    Pantone Ata
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}