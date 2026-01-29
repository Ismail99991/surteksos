'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Palette } from 'lucide-react';

// Mock (sahte) RENK kartela verileri
const mockRenkKartelalari = [
  { id: 1, kartelaNo: '23011737.1', renkKodu: '1737', renkAdi: 'Siyah', durum: 'Aktif' },
  { id: 2, kartelaNo: '23011892.1', renkKodu: '1892', renkAdi: 'Beyaz', durum: 'Aktif' },
  { id: 3, kartelaNo: '23011543.2', renkKodu: '1543', renkAdi: 'Kırmızı', durum: 'Pasif' },
  { id: 4, kartelaNo: '23011208.1', renkKodu: '1208', renkAdi: 'Mavi', durum: 'Aktif' },
  { id: 5, kartelaNo: '23011999.1', renkKodu: '1999', renkAdi: 'Sarı', durum: 'Beklemede' },
  { id: 6, kartelaNo: '23011737.2', renkKodu: '1737', renkAdi: 'Siyah Mat', durum: 'Aktif' },
  { id: 7, kartelaNo: '23012015.1', renkKodu: '2015', renkAdi: 'Yeşil', durum: 'Aktif' },
];

interface RenkKartelasi {
  id: number;
  kartelaNo: string;
  renkKodu: string;
  renkAdi: string;
  durum: string;
}

interface KartelaSearchProps {
  onKartelalarBulundu?: (kartelalar: RenkKartelasi[]) => void;
  onAramaYapiliyor?: (aramaYapiliyor: boolean) => void;
}

export default function KartelaSearch({ 
  onKartelalarBulundu, 
  onAramaYapiliyor 
}: KartelaSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDurum, setFilterDurum] = useState<string>('');

  // Otomatik arama (500ms debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2 || filterDurum) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, filterDurum]);

  const handleSearch = () => {
    if (onAramaYapiliyor) onAramaYapiliyor(true);

    // Mock arama
    const filtered = mockRenkKartelalari.filter(kartela => {
      const queryMatch = 
        kartela.renkKodu.includes(searchQuery) ||
        kartela.kartelaNo.includes(searchQuery) ||
        kartela.renkAdi.toLowerCase().includes(searchQuery.toLowerCase());
      
      const durumMatch = filterDurum ? kartela.durum === filterDurum : true;
      
      return queryMatch && durumMatch;
    });

    if (onKartelalarBulundu) {
      onKartelalarBulundu(filtered);
    }

    if (onAramaYapiliyor) onAramaYapiliyor(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatKartelaNo = (no: string) => {
    // 23011737.1 -> 1737 şeklinde göster
    const kod = no.substring(4, 8);
    return kod;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Renk Kartelası Arama</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        {/* Arama Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Renk kodu (1737), kartela no veya renk adı ara..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800"
          />
        </div>

        {/* Durum Filtresi */}
        <div className="relative min-w-[180px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            value={filterDurum}
            onChange={(e) => setFilterDurum(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white text-gray-800"
          >
            <option value="">Tüm Durumlar</option>
            <option value="Aktif">✅ Aktif</option>
            <option value="Pasif">⭕ Pasif</option>
            <option value="Beklemede">⏳ Beklemede</option>
          </select>
        </div>

        {/* Arama Butonu */}
        <button
          onClick={handleSearch}
          className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition whitespace-nowrap"
        >
          Ara
        </button>
      </div>

      {/* Format Açıklaması */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">📌 Arama Formatı:</span> 
          <br/>
          • <code className="bg-white px-2 py-1 rounded border">23011737.1</code> → "1737" ile ara
          <br/>
          • <code className="bg-white px-2 py-1 rounded border">1737</code> → Siyah rengini bulur
          <br/>
          • <code className="bg-white px-2 py-1 rounded border">siyah</code> → Siyah rengini bulur
        </p>
      </div>

      {/* Örnek Aramalar */}
      <div className="mt-3">
        <p className="text-sm text-gray-600 mb-2">Hızlı arama:</p>
        <div className="flex flex-wrap gap-2">
          {['1737', '1892', '1543', '1208', '1999', '2015'].map((kod) => (
            <button
              key={kod}
              onClick={() => setSearchQuery(kod)}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition"
            >
              {kod}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
