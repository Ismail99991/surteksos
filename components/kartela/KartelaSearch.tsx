'use client';

import { useState } from 'react';
import { Search, Filter, Building, User, Eye, X, MapPin } from 'lucide-react';
import { mockKartelalar } from '@/utils/mockKartelalar';
import KartelaDetay from './KartelaDetay';
import type { Kartela } from '@/types/kartela';

interface KartelaSearchProps {
  currentRoom: string;
}

export default function KartelaSearch({ currentRoom }: KartelaSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDurum, setFilterDurum] = useState<string>('');
  const [sonuclar, setSonuclar] = useState<Kartela[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKartela, setSelectedKartela] = useState<Kartela | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Odaya göre başlık ve açıklama
  const odaBilgileri = {
    'Amir Odası': {
      icon: User,
      title: 'Amir Kartela İzleme',
      description: 'Tüm kartelaları görüntüleyebilir ve analiz edebilirsiniz.',
      yetki: 'Tam Yetki'
    },
    'Kartela Odası': {
      icon: Building,
      title: 'Kartela Arama Sistemi',
      description: 'Kartela barkodlarını taratın veya renk kodları ile arama yapın.',
      yetki: 'Operasyonel Yetki'
    },
    'Üretim Alanı': {
      icon: Eye,
      title: 'Üretim Kartela Kontrol',
      description: 'Üretimdeki kartelaları kontrol edin.',
      yetki: 'Üretim Yetkisi'
    },
    'Depo': {
      icon: MapPin,
      title: 'Depo Kartela Takip',
      description: 'Depodaki kartelaları görüntüleyin.',
      yetki: 'Depo Yetkisi'
    }
  };

  const odaBilgi = odaBilgileri[currentRoom as keyof typeof odaBilgileri] || {
    icon: Eye,
    title: 'Kartela Arama',
    description: 'Kartela bilgilerini görüntüleyin.',
    yetki: 'Sınırlı Yetki'
  };

  const handleSearch = () => {
    if (searchQuery.length < 1 && !filterDurum) {
      // Boş arama - tümünü getir
      setSonuclar(mockKartelalar.slice(0, 6));
      return;
    }
    
    setLoading(true);
    
    setTimeout(() => {
      const filtered = mockKartelalar.filter(kartela => {
        const renkKoduMatch = kartela.renkKodu.includes(searchQuery);
        const tamKartelaMatch = kartela.kartelaNo.includes(searchQuery);
        const renkAdiMatch = kartela.renkAdi.toLowerCase().includes(searchQuery.toLowerCase());
        const durumMatch = filterDurum ? kartela.durum === filterDurum : true;
        
        return (renkKoduMatch || tamKartelaMatch || renkAdiMatch) && durumMatch;
      });
      
      setSonuclar(filtered);
      setLoading(false);
      
      console.log(`[${currentRoom}] Arama:`, {
        arama: searchQuery,
        bulunan: filtered.length
      });
      
    }, 500);
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
    return new Date(tarih).toLocaleDateString('tr-TR');
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        {/* Oda Başlığı */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${
                currentRoom === 'Amir Odası' ? 'bg-purple-100' :
                currentRoom === 'Kartela Odası' ? 'bg-blue-100' :
                currentRoom === 'Üretim Alanı' ? 'bg-green-100' :
                'bg-amber-100'
              }`}>
                <odaBilgi.icon className={`h-6 w-6 ${
                  currentRoom === 'Amir Odası' ? 'text-purple-600' :
                  currentRoom === 'Kartela Odası' ? 'text-blue-600' :
                  currentRoom === 'Üretim Alanı' ? 'text-green-600' :
                  'text-amber-600'
                }`} />
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
                🎯 {mockKartelalar.length} Mock Kartela
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
                  ? "Renk kodu, kartela no, renk adı veya durum ara..."
                  : "Kartela barkodu taratın veya renk kodu girin (örn: 1737)"
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
              <option value="kullanımda">🔵 Kullanımda</option>
              <option value="pasif">⭕ Pasif</option>
              <option value="arsivde">📦 Arşivde</option>
            </select>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            className={`px-6 py-3 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 transition whitespace-nowrap ${
              currentRoom === 'Amir Odası' ? 'bg-purple-600 focus:ring-purple-500' :
              currentRoom === 'Kartela Odası' ? 'bg-blue-600 focus:ring-blue-500' :
              currentRoom === 'Üretim Alanı' ? 'bg-green-600 focus:ring-green-500' :
              'bg-amber-600 focus:ring-amber-500'
            }`}
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
              <div className="text-green-600 text-xs mt-1">→ Siyah rengini bul</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="font-mono text-gray-900">siyah</div>
              <div className="text-green-600 text-xs mt-1">→ Siyah rengini bul</div>
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
            <p className="mt-4 text-gray-600 font-medium">Kartelalar aranıyor...</p>
            <p className="text-sm text-gray-500 mt-2">{currentRoom} • Mock veritabanı</p>
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
                 '📦 Depo Kartelaları'}
                <span className="ml-3 text-blue-600">({sonuclar.length})</span>
              </h4>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Mock veritabanı
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sonuclar.map((kartela) => (
                <div 
                  key={kartela.id} 
                  onClick={() => handleKartelaClick(kartela)}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 cursor-pointer transition-all group bg-white"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-mono font-bold text-gray-900 group-hover:text-blue-600">
                        {kartela.kartelaNo}
                      </div>
                      <div className="text-xs text-gray-500">
                        Kod: {kartela.renkKodu}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      kartela.durum === 'aktif' ? 'bg-green-100 text-green-800' :
                      kartela.durum === 'kullanımda' ? 'bg-blue-100 text-blue-800' :
                      kartela.durum === 'arsivde' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {kartela.durum}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-xl font-bold text-gray-800 group-hover:text-blue-700">
                      {kartela.renkAdi}
                    </div>
                    {kartela.musteri && (
                      <div className="text-gray-600 mt-1 text-sm">
                        🏢 {kartela.musteri}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="truncate">{kartela.mevcutLokasyon.oda} - {kartela.mevcutLokasyon.raf}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-xs">
                        📅 {formatTarih(kartela.guncellemeTarihi)}
                      </span>
                      <span className="text-blue-600 font-medium text-sm">
                        Detay →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
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
              📍 {currentRoom} • Mock veritabanı
            </div>
          </div>
        )}

        {!loading && !searchQuery && sonuclar.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-6">
              {currentRoom === 'Amir Odası' ? '📊' :
               currentRoom === 'Kartela Odası' ? '🎨' :
               currentRoom === 'Üretim Alanı' ? '🏭' : '📦'}
            </div>
            <p className="text-xl font-medium">
              {currentRoom === 'Amir Odası' 
                ? 'Kartela analizi için arama yapın' 
                : currentRoom === 'Kartela Odası'
                ? 'Kartela barkodu taratın veya renk kodu girin'
                : 'Kartela aramak için renk kodu veya adı yazın'}
            </p>
            <p className="text-gray-600 mt-2">
              {currentRoom === 'Amir Odası'
                ? 'Tüm kartelaları görüntülemek için arama yapabilirsiniz'
                : 'Renk kodu (1737) veya renk adı (siyah) ile arama yapabilirsiniz'}
            </p>
            <button
              onClick={() => {
                setSonuclar(mockKartelalar.slice(0, 6));
              }}
              className="mt-6 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
            >
              Tüm Kartelaları Göster (Mock)
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
                  <p className="text-gray-600">{selectedKartela.kartelaNo} • {selectedKartela.renkAdi}</p>
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
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  QR Kod Göster
                </button>
                {currentRoom === 'Kartela Odası' && (
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    Lokasyon Güncelle
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
