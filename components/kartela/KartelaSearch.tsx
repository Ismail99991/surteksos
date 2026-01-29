'use client';

import { useState } from 'react';
import { Search, Filter, Building, User, Eye } from 'lucide-react';

// Mock (sahte) RENK kartela verileri
const mockRenkKartelalari = [
  { id: 1, kartelaNo: '23011737.1', renkKodu: '1737', renkAdi: 'Siyah', durum: 'Aktif', tarih: '2024-01-15' },
  { id: 2, kartelaNo: '23011892.1', renkKodu: '1892', renkAdi: 'Beyaz', durum: 'Aktif', tarih: '2024-01-16' },
  { id: 3, kartelaNo: '23011543.2', renkKodu: '1543', renkAdi: 'Kırmızı', durum: 'Pasif', tarih: '2024-01-10' },
  { id: 4, kartelaNo: '23011208.1', renkKodu: '1208', renkAdi: 'Mavi', durum: 'Aktif', tarih: '2024-01-18' },
  { id: 5, kartelaNo: '23011999.1', renkKodu: '1999', renkAdi: 'Sarı', durum: 'Beklemede', tarih: '2024-01-20' },
  { id: 6, kartelaNo: '23011737.2', renkKodu: '1737', renkAdi: 'Siyah Mat', durum: 'Aktif', tarih: '2024-01-22' },
  { id: 7, kartelaNo: '23012015.1', renkKodu: '2015', renkAdi: 'Yeşil', durum: 'Aktif', tarih: '2024-01-25' },
];

interface RenkKartelasi {
  id: number;
  kartelaNo: string;
  renkKodu: string;
  renkAdi: string;
  durum: string;
  tarih: string;
}

interface KartelaSearchProps {
  currentRoom: string;
}

export default function KartelaSearch({ currentRoom }: KartelaSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDurum, setFilterDurum] = useState<string>('');
  const [sonuclar, setSonuclar] = useState<RenkKartelasi[]>([]);
  const [loading, setLoading] = useState(false);

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
    }
  };

  const odaBilgi = odaBilgileri[currentRoom as keyof typeof odaBilgileri] || {
    icon: Eye,
    title: 'Kartela Arama',
    description: 'Kartela bilgilerini görüntüleyin.',
    yetki: 'Sınırlı Yetki'
  };

  const handleSearch = () => {
    if (searchQuery.length < 1 && !filterDurum) return;
    
    setLoading(true);
    
    setTimeout(() => {
      const filtered = mockRenkKartelalari.filter(kartela => {
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
      
    }, 600);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const formatRenkKodu = (kartelaNo: string) => {
    return kartelaNo.substring(4, 8);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      {/* Oda Başlığı */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
              currentRoom === 'Amir Odası' ? 'bg-purple-100' : 'bg-blue-100'
            }`}>
              <odaBilgi.icon className={`h-6 w-6 ${
                currentRoom === 'Amir Odası' ? 'text-purple-600' : 'text-blue-600'
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
            <option value="Aktif">✅ Aktif</option>
            <option value="Pasif">⭕ Pasif</option>
            <option value="Beklemede">⏳ Beklemede</option>
          </select>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className={`px-6 py-3 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 transition whitespace-nowrap ${
            currentRoom === 'Amir Odası' 
              ? 'bg-purple-600 focus:ring-purple-500' 
              : 'bg-blue-600 focus:ring-blue-500'
          }`}
        >
          {loading ? '🔍 Aranıyor...' : 'Ara'}
        </button>
      </div>

      {/* Format Bilgisi */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-blue-600">🎯</div>
          <p className="text-sm text-blue-800 font-medium">Arama Formatı (Her iki odada da geçerli):</p>
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
              {currentRoom === 'Amir Odası' ? '📊 Analiz Sonuçları' : '📦 Bulunan Kartelalar'}
              <span className="ml-3 text-blue-600">({sonuclar.length})</span>
            </h4>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Mock veritabanı
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kartela No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Renk Kodu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Renk Adı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                  {currentRoom === 'Amir Odası' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlem</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sonuclar.map((kartela) => (
                  <tr key={kartela.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-gray-900">{kartela.kartelaNo}</div>
                      <div className="text-xs text-gray-500">Kod: {formatRenkKodu(kartela.kartelaNo)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {kartela.renkKodu}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{kartela.renkAdi}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                        kartela.durum === 'Aktif' ? 'bg-green-100 text-green-800' :
                        kartela.durum === 'Pasif' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {kartela.durum}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {kartela.tarih}
                    </td>
                    {currentRoom === 'Amir Odası' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition">
                          Detay
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
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
            {currentRoom === 'Amir Odası' ? '📊' : '🎨'}
          </div>
          <p className="text-xl font-medium">
            {currentRoom === 'Amir Odası' 
              ? 'Kartela analizi için arama yapın' 
              : 'Kartela barkodu taratın veya renk kodu girin'}
          </p>
          <p className="text-gray-600 mt-2">
            {currentRoom === 'Amir Odası'
              ? 'Tüm kartelaları görüntülemek için arama yapabilirsiniz'
              : 'Renk kodu (1737) veya renk adı (siyah) ile arama yapabilirsiniz'}
          </p>
        </div>
      )}
    </div>
  );
}
