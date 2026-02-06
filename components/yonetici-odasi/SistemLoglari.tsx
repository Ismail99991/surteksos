'use client';

import { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Shield,
  Download,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter as FilterIcon,
  ExternalLink
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database as SupabaseDatabase } from '@/types/supabase';

const supabase = createClient();

type LogType = SupabaseDatabase['public']['Tables']['sistem_loglari']['Row'];
type KullaniciType = SupabaseDatabase['public']['Tables']['kullanicilar']['Row'];
type KullaniciSummary = Pick<KullaniciType, 'id' | 'ad' | 'soyad'>;

interface SistemLoglariProps {
  refreshTrigger?: boolean;
  itemsPerPage?: number;
}

// Log türlerine göre renk ve icon mapping
const logTypeConfig: Record<string, { color: string; bgColor: string; icon: any }> = {
  'KULLANICI_OLUSTURULDU': { color: 'text-green-400', bgColor: 'bg-green-500/20', icon: CheckCircle },
  'KULLANICI_GUNCELLENDI': { color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: Info },
  'KULLANICI_SILINDI': { color: 'text-red-400', bgColor: 'bg-red-500/20', icon: XCircle },
  'KULLANICI_AKTIF_YAPILDI': { color: 'text-green-400', bgColor: 'bg-green-500/20', icon: CheckCircle },
  'KULLANICI_PASIF_YAPILDI': { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: AlertCircle },
  'ODA_OLUSTURULDU': { color: 'text-green-400', bgColor: 'bg-green-500/20', icon: CheckCircle },
  'ODA_GUNCELLENDI': { color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: Info },
  'ODA_SILINDI': { color: 'text-red-400', bgColor: 'bg-red-500/20', icon: XCircle },
  'YETKI_OLUSTURULDU': { color: 'text-green-400', bgColor: 'bg-green-500/20', icon: Shield },
  'YETKI_GUNCELLENDI': { color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: Shield },
  'YETKI_SILINDI': { color: 'text-red-400', bgColor: 'bg-red-500/20', icon: Shield },
  'GIRIS_BASARILI': { color: 'text-green-400', bgColor: 'bg-green-500/20', icon: CheckCircle },
  'GIRIS_BASARISIZ': { color: 'text-red-400', bgColor: 'bg-red-500/20', icon: XCircle },
  'ODA_COMPONENT_OLUSTURULDU': { color: 'text-green-400', bgColor: 'bg-green-500/20', icon: CheckCircle },
  'ODA_COMPONENT_GUNCELLENDI': { color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: Info },
  'ODA_COMPONENT_SILINDI': { color: 'text-red-400', bgColor: 'bg-red-500/20', icon: XCircle },
  'DEFAULT': { color: 'text-gray-400', bgColor: 'bg-gray-500/20', icon: Info }
};

export default function SistemLoglari({ 
  refreshTrigger = false,
  itemsPerPage = 20
}: SistemLoglariProps) {
  // State'ler
  const [loglar, setLoglar] = useState<LogType[]>([]);
  const [kullanicilar, setKullanicilar] = useState<KullaniciSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtreler
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogType, setSelectedLogType] = useState<string>('all');
  const [selectedKullanici, setSelectedKullanici] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 gün önce
    end: new Date().toISOString().split('T')[0] // Bugün
  });
  
  // Sayfalama
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Benzersiz log türlerini al
  const uniqueLogTypes = Array.from(new Set(loglar.map(log => log.islem_turu))).sort();

  // Verileri yükle
  useEffect(() => {
    loadData();
  }, [refreshTrigger, currentPage, dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Kullanıcıları yükle
      const { data: kullaniciData } = await supabase
        .from('kullanicilar')
        .select('id, ad, soyad')
        .eq('aktif', true);

      setKullanicilar(kullaniciData || []);

      // Logları yükle (sayfalama ile)
      let query = supabase
        .from('sistem_loglari')
        .select('*', { count: 'exact' })
        .gte('created_at', `${dateRange.start}T00:00:00`)
        .lte('created_at', `${dateRange.end}T23:59:59`)
        .order('created_at', { ascending: false });

      // Filtre uygula
      if (selectedLogType !== 'all') {
        query = query.eq('islem_turu', selectedLogType);
      }

      if (selectedKullanici !== 'all') {
        query = query.eq('kullanici_id', parseInt(selectedKullanici));
      }

      // Sayfalama
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data: logData, error: logError, count } = await query
        .range(from, to);

      if (logError) throw logError;

      setLoglar(logData || []);
      setTotalCount(count || 0);

    } catch (error) {
      console.error('Log yükleme hatası:', error);
      setError('Sistem logları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Filtrelenmiş loglar (arama için)
  const filteredLoglar = loglar.filter(log => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const kullanici = kullanicilar.find(k => k.id === log.kullanici_id);
    
    return (
      log.islem_turu.toLowerCase().includes(searchLower) ||
      log.detay?.toLowerCase().includes(searchLower) ||
      log.ip_adresi?.toLowerCase().includes(searchLower) ||
      (kullanici && (
        kullanici.ad.toLowerCase().includes(searchLower) ||
        kullanici.soyad.toLowerCase().includes(searchLower)
      ))
    );
  });

  // Log temizle
  const clearOldLogs = async () => {
    if (!confirm('30 günden eski tüm logları temizlemek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from('sistem_loglari')
        .delete()
        .lt('created_at', thirtyDaysAgo);

      if (error) throw error;

      alert('Eski loglar temizlendi!');
      loadData();

    } catch (error) {
      console.error('Log temizleme hatası:', error);
      alert('Loglar temizlenemedi!');
    }
  };

  // CSV export
  const exportToCSV = () => {
    const headers = ['Tarih', 'Saat', 'İşlem Türü', 'Detay', 'Kullanıcı', 'IP Adresi'];
    
    const csvData = loglar.map(log => {
      const kullanici = kullanicilar.find(k => k.id === log.kullanici_id);
      const tarih = new Date(log.created_at ?? new Date());
      
      return [
        tarih.toLocaleDateString('tr-TR'),
        tarih.toLocaleTimeString('tr-TR'),
        log.islem_turu,
        log.detay || '',
        kullanici ? `${kullanici.ad} ${kullanici.soyad}` : 'Sistem',
        log.ip_adresi || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sistem_loglari_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Log detayını formatla
  const formatLogDetail = (log: LogType) => {
    const kullanici = kullanicilar.find(k => k.id === log.kullanici_id);
    const tarih = new Date(log.created_at ?? new Date());
    
    return {
      tarih: tarih.toLocaleDateString('tr-TR'),
      saat: tarih.toLocaleTimeString('tr-TR'),
      kullanici: kullanici ? `${kullanici.ad} ${kullanici.soyad}` : 'Sistem',
      ip: log.ip_adresi || 'Bilinmiyor'
    };
  };

  // Sayfalama bilgisi
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (loading && loglar.length === 0) {
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
          <h2 className="text-2xl font-bold text-white">Sistem Logları</h2>
          <p className="text-gray-400">Sistem aktivitelerini izleyin ve analiz edin</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="px-3 py-1 bg-gray-800 rounded-lg">
            <span className="text-gray-400 text-sm">Toplam: </span>
            <span className="text-white font-semibold">{totalCount}</span>
          </div>
          <div className="px-3 py-1 bg-blue-500/20 rounded-lg">
            <span className="text-blue-400 text-sm">Sayfa: </span>
            <span className="text-blue-400 font-semibold">{currentPage}/{totalPages}</span>
          </div>
          <div className="px-3 py-1 bg-purple-500/20 rounded-lg">
            <span className="text-purple-400 text-sm">Filtre: </span>
            <span className="text-purple-400 font-semibold">{filteredLoglar.length}</span>
          </div>
        </div>
      </div>

      {/* Filtreler ve Kontroller */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex flex-col gap-4">
          {/* Üst Filtreler */}
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
                  placeholder="Log ara..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-white"
                />
              </div>
            </div>

            {/* Tarih Aralığı */}
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-white"
                  />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Alt Filtreler */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Log Türü Filtresi */}
            <div className="flex-1">
              <select
                value={selectedLogType}
                onChange={(e) => setSelectedLogType(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white"
              >
                <option value="all">Tüm İşlem Türleri</option>
                {uniqueLogTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Kullanıcı Filtresi */}
            <div className="flex-1">
              <select
                value={selectedKullanici}
                onChange={(e) => setSelectedKullanici(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white"
              >
                <option value="all">Tüm Kullanıcılar</option>
                <option value="system">Sistem</option>
                {kullanicilar.map(kullanici => (
                  <option key={kullanici.id} value={kullanici.id}>
                    {kullanici.ad} {kullanici.soyad}
                  </option>
                ))}
              </select>
            </div>

            {/* İşlem Butonları */}
            <div className="flex gap-2">
              <button
                onClick={loadData}
                className="px-4 py-2.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Yenile
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                CSV İndir
              </button>
              <button
                onClick={clearOldLogs}
                className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Temizle
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Log Listesi */}
      {error ? (
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-red-700">
          <div className="text-red-400 mb-4">⚠️ {error}</div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
          >
            Tekrar Dene
          </button>
        </div>
      ) : filteredLoglar.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
          <Database className="h-16 w-16 mx-auto text-gray-700 mb-4" />
          <p className="text-gray-500">Belirtilen kriterlerde log bulunamadı</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedLogType('all');
              setSelectedKullanici('all');
            }}
            className="mt-2 text-red-400 hover:text-red-300"
          >
            Filtreleri temizle
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLoglar.map((log) => {
            const config = logTypeConfig[log.islem_turu] || logTypeConfig.DEFAULT;
            const Icon = config.icon;
            const detail = formatLogDetail(log);
            const kullanici = kullanicilar.find(k => k.id === log.kullanici_id);

            return (
              <div key={log.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Icon ve Tür */}
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-lg ${config.bgColor}`}>
                      <Icon className={`h-6 w-6 ${config.color}`} />
                    </div>
                  </div>

                  {/* İçerik */}
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-3">
                      <div>
                        <h3 className={`text-lg font-semibold ${config.color}`}>
                          {log.islem_turu.replace(/_/g, ' ')}
                        </h3>
                        <p className="text-gray-300 mt-1">{log.detay}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">{detail.tarih}</div>
                        <div className="text-xs text-gray-500">{detail.saat}</div>
                      </div>
                    </div>

                    {/* Meta Bilgiler */}
                    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-700">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-300">
                          {kullanici ? `${kullanici.ad} ${kullanici.soyad}` : 'Sistem'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-300">
                          {new Date(log.created_at ?? new Date()).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      {log.ip_adresi && (
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-gray-500" />
                          <code className="text-xs bg-gray-900 px-2 py-1 rounded border border-gray-700">
                            {log.ip_adresi}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-400">
            Toplam <span className="text-white font-semibold">{totalCount}</span> log
            <span className="mx-2">•</span>
            Gösterilen: <span className="text-white">{(currentPage - 1) * itemsPerPage + 1}</span>-
            <span className="text-white">{Math.min(currentPage * itemsPerPage, totalCount)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="text-gray-500">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-8 h-8 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sistem Bilgileri */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-gray-400" />
            <div>
              <div className="text-sm text-gray-300">Log Arşivi</div>
              <div className="text-xs text-gray-500">
                Loglar otomatik olarak 30 gün saklanır
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
          </div>
        </div>
      </div>
    </div>
  );
}
