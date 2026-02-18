'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Building, 
  User, 
  Eye, 
  X, 
  MapPin, 
  BarChart3, 
  Package, 
  Layers, 
  Home, 
  ChevronRight,
  CheckCircle,
  Circle,
  Archive,
  Inbox,
  Tag,
  XCircle,
  Beaker,
  Sparkles,
  Calendar,
  Clock,
  Map,
  Key,
  Folder,
  Activity
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import KartelaDetay from './KartelaDetay';
import type { Database } from '@/types/supabase';

type Kartela = Database['public']['Tables']['kartelalar']['Row'] & {
  renk_masalari?: {
    pantone_kodu: string | null;
    hex_kodu: string | null;
  };
  hucreler?: {
    id: number;
    hucre_kodu: string;
    hucre_adi: string;
    kapasite: number | null;
    mevcut_kartela_sayisi: number | null;
    raf_id: number | null;
    aktif: boolean | null;
  };
};

interface KartelaSearchProps {
  currentRoom: string;
  currentUserId?: string | number;
}

export default function KartelaSearch({ currentRoom, currentUserId }: KartelaSearchProps) {
  console.log('🔵 KartelaSearch RENDER OLUYOR');
  console.log('🔵 currentRoom:', currentRoom);
  console.log('🔵 currentUserId:', currentUserId);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDurum, setFilterDurum] = useState<string>('');
  const [sonuclar, setSonuclar] = useState<Kartela[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKartela, setSelectedKartela] = useState<Kartela | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    aktif: 0,
    dolu: 0,
    arsiv: 0,
    kalite: 0,
    kullanim_disi: 0
  });

  // Odaya göre başlık ve açıklama
  const odaBilgileri = {
    'AMIR_ODASI': {
      icon: User,
      title: 'Amir Kartela İzleme',
      description: 'Tüm kartelaları görüntüleyebilir ve analiz edebilirsiniz.',
      yetki: 'Tam Yetki',
      color: 'purple'
    },
    'KARTELA_ODASI': {
      icon: Building,
      title: 'Kartela Arama Sistemi',
      description: 'Kartela barkodlarını taratın veya renk kodları ile arama yapın.',
      yetki: 'Operasyonel Yetki',
      color: 'blue'
    },
    'LAB_ODASI': {
      icon: Beaker,
      title: 'Lab Renk Analizi',
      description: 'Renk analizi ve pantone atama.',
      yetki: 'Lab Yetkisi',
      color: 'pink'
    },
    'YONETICI_ODASI': {
      icon: User,
      title: 'Yönetici Dashboard',
      description: 'Sistem yönetimi ve raporlama.',
      yetki: 'Yönetici Yetkisi',
      color: 'red'
    },
    'KALITE_KONTROL': {
      icon: CheckCircle,
      title: 'Kalite Kontrol',
      description: 'Kalite kontrol ve onay işlemleri.',
      yetki: 'Kalite Yetkisi',
      color: 'indigo'
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
      // Toplam kartela
      const { count: total, error: totalError } = await supabase
        .from('kartelalar')
        .select('*', { count: 'exact', head: true })
        .eq('silindi', false);

      // Aktif kartelalar
      const { count: aktif, error: aktifError } = await supabase
        .from('kartelalar')
        .select('*', { count: 'exact', head: true })
        .eq('silindi', false)
        .eq('durum', 'AKTIF');

      // Dolu kartelalar
      const { count: dolu, error: doluError } = await supabase
        .from('kartelalar')
        .select('*', { count: 'exact', head: true })
        .eq('silindi', false)
        .eq('durum', 'DOLU');

      // Arşiv kartelalar
      const { count: arsiv, error: arsivError } = await supabase
        .from('kartelalar')
        .select('*', { count: 'exact', head: true })
        .eq('silindi', false)
        .eq('durum', 'KARTELA_ARSIV');

      // Kalite arşivi
      const { count: kalite, error: kaliteError } = await supabase
        .from('kartelalar')
        .select('*', { count: 'exact', head: true })
        .eq('silindi', false)
        .eq('durum', 'KALITE_ARSIV');

      // Kullanım dışı
      const { count: kullanim_disi, error: kdError } = await supabase
        .from('kartelalar')
        .select('*', { count: 'exact', head: true })
        .eq('silindi', false)
        .eq('durum', 'KULLANIM_DISI');

      setStats({
        total: total || 0,
        aktif: aktif || 0,
        dolu: dolu || 0,
        arsiv: arsiv || 0,
        kalite: kalite || 0,
        kullanim_disi: kullanim_disi || 0
      });
    } catch (error) {
      console.error('İstatistik yüklenemedi:', error);
    }
  };

  // Son 4 hane kontrolü için yardımcı fonksiyon
  const getLast4Digits = (text: string): string | null => {
    // Sadece sayısal olan kısmı al
    const numbersOnly = text.replace(/[^\d]/g, '');
    
    if (numbersOnly.length >= 4) {
      // Son 4 haneyi al
      return numbersOnly.slice(-4);
    }
    
    return null;
  };

  // Renk kodu formatı kontrolü için yardımcı fonksiyon
  const isRenkKoduFormat = (text: string): boolean => {
    // 23011737.1 gibi formatları kontrol et
    const pattern = /^\d{8}\.\d+$/;
    return pattern.test(text);
  };

  const handleSearch = async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('kartelalar')
        .select(`
          *,
          renk_masalari!left (
            pantone_kodu,
            hex_kodu
          ),
          hucreler!left (
            id,
            hucre_kodu,
            hucre_adi,
            kapasite,
            mevcut_kartela_sayisi,
            raf_id,
            aktif
          )
        `)
        .eq('silindi', false)
        .order('olusturulma_tarihi', { ascending: false })
        .limit(50);

      // Arama sorgusu - GÜNCELLENDİ (son 4 hane desteği eklendi)
      if (searchQuery.trim()) {
        const queryLower = searchQuery.toLowerCase();
        
        // SON 4 HANE ARAMA: Kullanıcı sadece 4 hane girdiyse (örn: 1737)
        if (/^\d{4}$/.test(searchQuery)) {
          const last4Digits = searchQuery;
          query = query.or(`renk_kodu.ilike.%${last4Digits}%,renk_kodu.ilike.%.${last4Digits}.%,renk_kodu.eq.${last4Digits},kartela_no.ilike.%${last4Digits}%`);
        } 
        // TAM RENK KODU ARAMA (örn: 23011737.1)
        else if (isRenkKoduFormat(searchQuery)) {
          // Tam kod için arama
          query = query.or(`renk_kodu.ilike.%${queryLower}%,renk_kodu.eq.${queryLower},kartela_no.ilike.%${queryLower}%`);
          
          // Ayrıca son 4 haneyi de kontrol et (23011737.1 için 1737'yi ara)
          const last4Digits = getLast4Digits(queryLower);
          if (last4Digits) {
            query = query.or(`renk_kodu.ilike.%${last4Digits}%,renk_kodu.ilike.%.${last4Digits}.%,renk_kodu.eq.${last4Digits},kartela_no.ilike.%${last4Digits}%`);
          }
        }
        // DİĞER ARAMALAR (genel arama)
        else {
          query = query.or(`renk_kodu.ilike.%${queryLower}%,renk_adi.ilike.%${queryLower}%,kartela_no.ilike.%${queryLower}%,musteri_adi.ilike.%${queryLower}%,proje_kodu.ilike.%${queryLower}%`);
          
          // Eğer arama terimi sayısal bir içeriğe sahipse, son 4 haneyi de ara
          const last4Digits = getLast4Digits(queryLower);
          if (last4Digits && last4Digits !== queryLower) {
            query = query.or(`renk_kodu.ilike.%${last4Digits}%,renk_kodu.ilike.%.${last4Digits}.%,renk_kodu.eq.${last4Digits},kartela_no.ilike.%${last4Digits}%`);
          }
        }
      }

      // Durum filtresi
      if (filterDurum) {
        const durumMap: Record<string, string> = {
          'aktif': 'AKTIF',
          'dolu': 'DOLU',
          'arsivde': 'KARTELA_ARSIV',
          'kalitede': 'KALITE_ARSIV',
          'kullanim_disi': 'KULLANIM_DISI'
        };
        const dbDurum = durumMap[filterDurum];
        if (dbDurum) {
          query = query.eq('durum', dbDurum);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase arama hatası:', error);
        throw error;
      }

      setSonuclar((data || []) as unknown as Kartela[]);
      
      console.log(`[${currentRoom}] Arama:`, {
        arama: searchQuery,
        filtredurum: filterDurum,
        bulunan: data?.length || 0,
        son4hane: getLast4Digits(searchQuery) || 'yok'
      });

    } catch (error) {
      console.error('Arama hatası:', error);
      setSonuclar([]);
      alert('Arama sırasında hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  // Hücre konum bilgisini render et
  const renderHucreKonumu = (kartela: Kartela) => {
    if (!kartela.hucreler) {
      return (
        <div className="flex items-center text-gray-400">
          <MapPin className="h-4 w-4 mr-2" />
          <span className="text-sm flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Hücreye yerleştirilmemiş
          </span>
        </div>
      );
    }

    const hucre = kartela.hucreler;

    return (
      <div className="space-y-2">
        <div className="flex items-center text-sm">
          <MapPin className="h-3 w-3 mr-2 text-purple-500" />
          <span className="font-medium">{hucre.hucre_kodu} • {hucre.hucre_adi}</span>
          <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
            {hucre.mevcut_kartela_sayisi || 0}/{hucre.kapasite || 0}
          </span>
        </div>
        
        {/* Hücre Durumu */}
        <div className="mt-1">
          {!hucre.aktif ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
              <XCircle className="h-3 w-3" />
              Hücre Pasif
            </span>
          ) : hucre.kapasite && hucre.mevcut_kartela_sayisi && 
             hucre.mevcut_kartela_sayisi >= hucre.kapasite ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
              <XCircle className="h-3 w-3" />
              Dolu
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
              <CheckCircle className="h-3 w-3" />
              Uygun
            </span>
          )}
        </div>
      </div>
    );
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
    try {
      return new Date(tarih).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return tarih;
    }
  };

  const getDurumBadge = (durum: string) => {
    const durumlar = {
      'AKTIF': { bg: 'bg-green-100', text: 'text-green-800', label: 'Aktif', icon: CheckCircle },
      'DOLU': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Dolu (Arşiv Bekliyor)', icon: Archive },
      'KARTELA_ARSIV': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Kartela Arşivi', icon: Folder },
      'KALITE_ARSIV': { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Kalite Arşivi', icon: Sparkles },
      'KULLANIM_DISI': { bg: 'bg-red-100', text: 'text-red-800', label: 'Kullanım Dışı', icon: XCircle },
      'LAB_DEGERLENDIRME': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Lab Değerlendirme', icon: Beaker }
    };

    const durumBilgi = durumlar[durum as keyof typeof durumlar] || 
      { bg: 'bg-gray-100', text: 'text-gray-800', label: durum, icon: Circle };
    
    const Icon = durumBilgi.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${durumBilgi.bg} ${durumBilgi.text}`}>
        <Icon className="h-3 w-3" />
        {durumBilgi.label}
      </span>
    );
  };

  const getGozDurumu = (goz_sayisi: number, maksimum_goz: number) => {
    const oran = (goz_sayisi / maksimum_goz) * 100;
    
    if (goz_sayisi === 0) {
      return { text: `Yeni (0/${maksimum_goz})`, color: 'text-gray-600', icon: Sparkles };
    } else if (oran < 50) {
      return { text: `${goz_sayisi}/${maksimum_goz}`, color: 'text-green-600', icon: CheckCircle };
    } else if (oran < 100) {
      return { text: `${goz_sayisi}/${maksimum_goz}`, color: 'text-yellow-600', icon: Clock };
    } else {
      return { text: `DOLU (${maksimum_goz}/${maksimum_goz})`, color: 'text-red-600', icon: Archive };
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        {/* Oda Başlığı */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${odaBilgi.color === 'purple' ? 'bg-purple-100' : 
                                 odaBilgi.color === 'blue' ? 'bg-blue-100' : 
                                 odaBilgi.color === 'pink' ? 'bg-pink-100' :
                                 odaBilgi.color === 'red' ? 'bg-red-100' :
                                 odaBilgi.color === 'indigo' ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                <odaBilgi.icon className={`h-6 w-6 ${odaBilgi.color === 'purple' ? 'text-purple-600' : 
                                     odaBilgi.color === 'blue' ? 'text-blue-600' : 
                                     odaBilgi.color === 'pink' ? 'text-pink-600' :
                                     odaBilgi.color === 'red' ? 'text-red-600' :
                                     odaBilgi.color === 'indigo' ? 'text-indigo-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{odaBilgi.title}</h3>
                <p className="text-gray-600">{odaBilgi.description}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                <MapPin className="h-3 w-3" />
                {currentRoom}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <Key className="h-3 w-3" />
                {odaBilgi.yetki}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                <Package className="h-3 w-3" />
                {stats.total}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <CheckCircle className="h-3 w-3" />
                {stats.aktif}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                <Archive className="h-3 w-3" />
                {stats.dolu}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                <Folder className="h-3 w-3" />
                {stats.arsiv}
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
                currentRoom === 'AMIR_ODASI' 
                  ? "Renk kodu (örn: 1737, 23011737.1), kartela no, renk adı ara..."
                  : currentRoom === 'KARTELA_ODASI'
                  ? "Son 4 hane (1737) veya tam renk kodu (23011737.1) girin"
                  : "Renk kodu (1737), tam renk kodu (23011737.1) veya renk adı girin"
              }
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800"
            />
            {/* Arama İpucu */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {searchQuery.length === 4 && /^\d{4}$/.test(searchQuery) && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  <Search className="h-3 w-3" />
                  Son 4 hane aranıyor: {searchQuery}
                </span>
              )}
            </div>
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
              <option value="aktif">Aktif</option>
              <option value="dolu">Dolu</option>
              <option value="arsivde">Kartela Arşivi</option>
              <option value="kalitede">Kalite Arşivi</option>
              <option value="kullanim_disi">Kullanım Dışı</option>
            </select>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 transition whitespace-nowrap ${
              odaBilgi.color === 'purple' ? 'bg-purple-600 focus:ring-purple-500' :
              odaBilgi.color === 'blue' ? 'bg-blue-600 focus:ring-blue-500' :
              odaBilgi.color === 'pink' ? 'bg-pink-600 focus:ring-pink-500' :
              odaBilgi.color === 'red' ? 'bg-red-600 focus:ring-red-500' :
              odaBilgi.color === 'indigo' ? 'bg-indigo-600 focus:ring-indigo-500' :
              'bg-gray-600 focus:ring-gray-500'
            }`}
          >
            <Search className="h-4 w-4" />
            {loading ? 'Aranıyor...' : 'Ara'}
          </button>
        </div>

        {/* Son 4 Hane Arama Bilgilendirme */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium inline-flex items-center gap-1">
            <Search className="h-4 w-4" />
            <strong>Son 4 Hane Arama:</strong>
            <span className="ml-2 text-blue-600">
              &quot;23011737.1&quot; kodunu sadece &quot;1737&quot; yazarak arayabilirsiniz
            </span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-200 text-blue-700 text-xs rounded">
              <Package className="h-3 w-3" />
              Örnek 1: 1737 → 23011737.1 ve 24011737.2&apos;yi bulur
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-200 text-blue-700 text-xs rounded">
              <Tag className="h-3 w-3" />
              Örnek 2: 23011737.1 → Tam kod araması
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-200 text-blue-700 text-xs rounded">
              <Sparkles className="h-3 w-3" />
              Örnek 3: KIRMIZI → Renk adı araması
            </span>
          </div>
        </div>

        {/* Yükleme */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-14 w-14 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 font-medium">Supabase&apos;den kartelalar aranıyor...</p>
            <p className="text-sm text-gray-500 mt-2 inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {currentRoom} • {searchQuery.length === 4 ? `Son 4 hane: ${searchQuery}` : `Tam kod: ${searchQuery}`}
            </p>
          </div>
        )}

        {/* Sonuçlar */}
        {!loading && sonuclar.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-semibold text-gray-900 inline-flex items-center gap-2">
                {currentRoom === 'AMIR_ODASI' ? <BarChart3 className="h-5 w-5" /> : 
                 currentRoom === 'KARTELA_ODASI' ? <Package className="h-5 w-5" /> :
                 currentRoom === 'LAB_ODASI' ? <Beaker className="h-5 w-5" /> :
                 <Folder className="h-5 w-5" />}
                {currentRoom === 'AMIR_ODASI' ? 'Analiz Sonuçları' : 
                 currentRoom === 'KARTELA_ODASI' ? 'Bulunan Kartelalar' :
                 currentRoom === 'LAB_ODASI' ? 'Lab Kartelaları' :
                 'Kartelalar'}
                <span className="ml-3 text-blue-600">({sonuclar.length})</span>
              </h4>
              <div className="text-sm text-green-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Supabase • Gerçek Veritabanı
                {searchQuery.length === 4 && (
                  <span className="ml-2 text-blue-600 inline-flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Son 4 hane: {searchQuery}
                  </span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sonuclar.map((kartela) => {
                const gozDurumu = getGozDurumu(kartela.goz_sayisi || 0, kartela.maksimum_goz || 14);
                const GozIcon = gozDurumu.icon;
                
                return (
                  <div 
                    key={kartela.id} 
                    onClick={() => handleKartelaClick(kartela)}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 cursor-pointer transition-all group bg-white"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-mono font-bold text-gray-900 group-hover:text-blue-600">
                          {kartela.kartela_no || `KRT-${kartela.id}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          Renk: {kartela.renk_kodu}
                          {kartela.renk_masalari?.pantone_kodu && (
                            <span className="ml-2 inline-flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              Pantone: {kartela.renk_masalari.pantone_kodu}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getDurumBadge(kartela.durum || 'AKTIF')}
                        <div className={`text-xs font-medium inline-flex items-center gap-1 ${gozDurumu.color}`}>
                          <GozIcon className="h-3 w-3" />
                          {gozDurumu.text}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="text-xl font-bold text-gray-800 group-hover:text-blue-700">
                        {kartela.renk_adi}
                      </div>
                      {kartela.musteri_adi && (
                        <div className="text-gray-600 mt-1 text-sm inline-flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {kartela.musteri_adi}
                        </div>
                      )}
                      {kartela.proje_kodu && (
                        <div className="text-gray-500 text-xs mt-1 inline-flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          Proje: {kartela.proje_kodu}
                        </div>
                      )}
                    </div>
                    
                    {/* HÜCRE KONUMU BÖLÜMÜ */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-500 font-medium mb-2 inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        KONUM BİLGİSİ
                      </div>
                      {renderHucreKonumu(kartela)}
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <span className="text-gray-500 text-xs inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatTarih(kartela.olusturulma_tarihi || '')}
                      </span>
                      <span className="text-blue-600 font-medium text-sm inline-flex items-center gap-1">
                        Detay
                        <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 p-3 bg-gray-50 rounded-lg border text-center">
              <p className="text-sm text-gray-600 inline-flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                Kartelaya tıklayarak <strong>detay bilgilerini</strong> ve <strong>hareket geçmişini</strong> görüntüleyin.
              </p>
              {getLast4Digits(searchQuery) && (
                <p className="text-sm text-blue-600 mt-2 inline-flex items-center gap-1">
                  <Search className="h-4 w-4" />
                  <strong>{getLast4Digits(searchQuery)}</strong> son 4 hanesi ile <strong>{sonuclar.length}</strong> kartela bulundu
                </p>
              )}
            </div>
          </div>
        )}

        {!loading && searchQuery && sonuclar.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-medium">&quot;{searchQuery}&quot; için sonuç bulunamadı</p>
            <p className="text-gray-600 mt-2">
              {searchQuery.length === 4 ?
                `${searchQuery} son 4 hanesi ile eşleşen kartela bulunamadı` :
                'Farklı bir renk kodu, kartela no veya renk adı deneyin'}
            </p>
            <div className="mt-6 text-sm text-green-600 inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {currentRoom} • Supabase • Gerçek Veritabanı
            </div>
          </div>
        )}

        {!loading && !searchQuery && sonuclar.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            {currentRoom === 'AMIR_ODASI' ? <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" /> :
             currentRoom === 'KARTELA_ODASI' ? <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" /> :
             currentRoom === 'LAB_ODASI' ? <Beaker className="h-16 w-16 mx-auto mb-4 text-gray-300" /> :
             <Folder className="h-16 w-16 mx-auto mb-4 text-gray-300" />}
            <p className="text-xl font-medium">
              {currentRoom === 'AMIR_ODASI'
                ? 'Kartela analizi için arama yapın'
                : currentRoom === 'KARTELA_ODASI'
                ? 'Son 4 hane (1737) veya tam renk kodu (23011737.1) girin'
                : currentRoom === 'LAB_ODASI'
                ? 'Lab analizi için renk kodu ara'
                : 'Kartela aramak için renk kodu veya adı yazın'}
            </p>
            <p className="text-gray-600 mt-2">
              Örnek: &quot;1737&quot; (son 4 hane), &quot;23011737.1&quot; (tam kod) veya &quot;KIRMIZI&quot;
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                handleSearch();
              }}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
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
                  <p className="text-gray-600 inline-flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {selectedKartela.kartela_no || `KRT-${selectedKartela.id}`} • {selectedKartela.renk_adi}
                  </p>
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
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition inline-flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Kapat
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(selectedKartela.kartela_no || `KRT-${selectedKartela.id}`);
                    alert('Kartela no kopyalandı!');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
                >
                  <Tag className="h-4 w-4" />
                  Kartela No Kopyala
                </button>
                {(currentRoom === 'KARTELA_ODASI' || currentRoom === 'YONETICI_ODASI') && (
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Lokasyon Güncelle
                  </button>
                )}
                {currentRoom === 'LAB_ODASI' && (
                  <button className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition inline-flex items-center gap-2">
                    <Tag className="h-4 w-4" />
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
