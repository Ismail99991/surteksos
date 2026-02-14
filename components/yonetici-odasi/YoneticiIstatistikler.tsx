'use client';

import { 
  LayoutGrid, 
  Box,
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
  Users,
  Building2,
  DoorOpen,
  Grid2x2,
  Layers,
  Archive,
  FolderOpen,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart,
  Square,
  Cuboid,
  ArchiveRestore,
  LayoutDashboard
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieLabelRenderProps
} from 'recharts';
import { format, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';

const supabase = createClient();

// ===========================================
// TYPESCRIPT INTERFACES
// ===========================================

interface DepolamaIstatistikleriProps {
  refreshTrigger?: boolean;
  onDataLoaded?: (data: DepolamaIstatistikleri) => void;
}

interface DepolamaIstatistikleri {
  toplamKartela: number;
  doluKartela: number;
  bosKartela: number;
  dolulukOraniKartela: number;
  
  toplamDolap: number;
  doluDolap: number;
  bosDolap: number;
  dolulukOraniDolap: number;
  
  toplamRaf: number;
  doluRaf: number;
  bosRaf: number;
  dolulukOraniRaf: number;
  
  toplamHücre: number;
  doluHücre: number;
  bosHücre: number;
  dolulukOraniHücre: number;
  
  toplamDepolamaBirimi: number;
  toplamDoluBirim: number;
  toplamBosBirim: number;
  genelDolulukOrani: number;
  
  son24SaatEklenen: number;
  son7GunEklenen: number;
  
  dolulukTrendi: { tarih: string; oran: number }[];
  birimDagilimi: BirimDagilim[];
}

interface BirimDagilim {
  name: string;
  dolu: number;
  bos: number;
  toplam: number;
}

interface OzetIstatistikler {
  toplamKullanici: number;
  aktifKullanici: number;
  toplamOda: number;
  aktifOda: number;
}

interface PieDataItem {
  name: string;
  value: number;
  color: string;
}

// ===========================================
// TOOLTIP FORMATTER
// ===========================================

type TooltipValue = number | string | Array<number | string> | undefined;

const formatTooltipValue = (value: TooltipValue): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (Array.isArray(value)) return value.length;
  return 0;
};

const barTooltipFormatter = (value: TooltipValue): [string, string] => {
  const num = formatTooltipValue(value);
  return [`%${num}`, 'Doluluk Oranı'];
};

const areaTooltipFormatter = (value: TooltipValue): [string, string] => {
  const num = formatTooltipValue(value);
  return [`%${num}`, 'Doluluk'];
};

const pieTooltipFormatter = (value: TooltipValue): [string, string] => {
  const num = formatTooltipValue(value);
  return [`${num}`, 'Adet'];
};

// ===========================================
// PIE LABEL RENDERER
// ===========================================

const renderPieLabel = (props: PieLabelRenderProps) => {
  const { name, percent } = props;
  
  if (typeof name !== 'string' || typeof percent !== 'number') {
    return '';
  }
  
  const yuzde = (percent * 100).toFixed(0);
  return `${name} %${yuzde}`;
};

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function DepolamaIstatistikleri({ 
  refreshTrigger = false,
  onDataLoaded 
}: DepolamaIstatistikleriProps) {
  
  const [depolama, setDepolama] = useState<DepolamaIstatistikleri | null>(null);
  const [ozet, setOzet] = useState<OzetIstatistikler | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'kartela' | 'dolap' | 'raf' | 'hucre' | 'genel'>('genel');

  useEffect(() => {
    loadIstatistikler();
  }, [refreshTrigger]);

  const loadIstatistikler = async () => {
    try {
      setLoading(true);

      // ===== KARTELA İSTATİSTİKLERİ (DOĞRU) =====
      const { count: toplamKartela } = await supabase
        .from('kartelalar')
        .select('*', { count: 'exact', head: true })
        .eq('silindi', false);

      // Dolu kartela = durumu 'DOLU' olanlar
      const { count: doluKartela } = await supabase
        .from('kartelalar')
        .select('*', { count: 'exact', head: true })
        .eq('silindi', false)
        .eq('durum', 'DOLU');

      // Aktif kartela = durumu 'AKTIF' olanlar (bunlar da dolu sayılır)
      const { count: aktifKartela } = await supabase
        .from('kartelalar')
        .select('*', { count: 'exact', head: true })
        .eq('silindi', false)
        .eq('durum', 'AKTIF');

      // Toplam dolu kartela = DOLU + AKTIF
      const toplamDoluKartela = (doluKartela || 0) + (aktifKartela || 0);

      // ===== DOLAP İSTATİSTİKLERİ (DOĞRU) =====
      const { count: toplamDolap } = await supabase
        .from('dolaplar')
        .select('*', { count: 'exact', head: true })
        .eq('silindi', false);

      // Dolu dolap = aktif olanlar (durum değil, aktif boolean)
      const { count: aktifDolap } = await supabase
        .from('dolaplar')
        .select('*', { count: 'exact', head: true })
        .eq('silindi', false)
        .eq('aktif', true);

      // ===== RAF İSTATİSTİKLERİ (DOĞRU) =====
      const { count: toplamRaf } = await supabase
        .from('raflar')
        .select('*', { count: 'exact', head: true })
        .eq('silindi', false);

      const { count: aktifRaf } = await supabase
        .from('raflar')
        .select('*', { count: 'exact', head: true })
        .eq('silindi', false)
        .eq('aktif', true);

      // ===== HÜCRE İSTATİSTİKLERİ (DOĞRU) =====
      const { count: toplamHücre } = await supabase
        .from('hucreler')
        .select('*', { count: 'exact', head: true })
        .eq('silindi', false);

      // Dolu hücre = mevcut_kartela_sayisi > 0 olanlar
      const { data: doluHücreler } = await supabase
        .from('hucreler')
        .select('id')
        .eq('silindi', false)
        .gt('mevcut_kartela_sayisi', 0);

      const doluHücre = doluHücreler?.length || 0;
      const bosHücre = (toplamHücre || 0) - doluHücre;

      // ===== SON EKLENENLER (DOĞRU: kartelalar tablosu) =====
      const now = new Date();
      const last24h = subDays(now, 1);
      const last7d = subDays(now, 7);

      const { count: son24SaatEklenen } = await supabase
        .from('kartelalar')
        .select('*', { count: 'exact', head: true })
        .eq('silindi', false)
        .gte('created_at', last24h.toISOString());

      const { count: son7GunEklenen } = await supabase
        .from('kartelalar')
        .select('*', { count: 'exact', head: true })
        .eq('silindi', false)
        .gte('created_at', last7d.toISOString());

      // ===== DOLULUK TRENDİ (DOĞRU: kapasite bazlı) =====
      const dolulukTrendi = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i);
        
        // O tarihte var olan hücrelerin kapasite ve doluluk bilgisi
        const { data: hucreler } = await supabase
          .from('hucreler')
          .select('kapasite, mevcut_kartela_sayisi')
          .eq('silindi', false)
          .lte('created_at', date.toISOString());

        const toplamKapasite = hucreler?.reduce((sum, h) => sum + (h.kapasite || 0), 0) || 0;
        const doluKapasite = hucreler?.reduce((sum, h) => sum + (h.mevcut_kartela_sayisi || 0), 0) || 0;

        dolulukTrendi.push({
          tarih: format(date, 'dd MMM', { locale: tr }),
          oran: toplamKapasite > 0 ? Math.round((doluKapasite / toplamKapasite) * 100) : 0
        });
      }

      // ===== ÖZET İSTATİSTİKLER =====
      const { count: toplamKullanici } = await supabase
        .from('kullanicilar')
        .select('*', { count: 'exact', head: true });

      const { count: aktifKullanici } = await supabase
        .from('kullanicilar')
        .select('*', { count: 'exact', head: true })
        .eq('aktif', true);

      const { count: toplamOda } = await supabase
        .from('odalar')
        .select('*', { count: 'exact', head: true });

      const { count: aktifOda } = await supabase
        .from('odalar')
        .select('*', { count: 'exact', head: true })
        .eq('aktif', true);

      // Null kontrolleri
      const tKartela = toplamKartela || 0;
      const tDolap = toplamDolap || 0;
      const tRaf = toplamRaf || 0;
      const tHücre = toplamHücre || 0;

      const toplamDepolamaBirimi = tKartela + tDolap + tRaf + tHücre;
      const toplamDoluBirim = toplamDoluKartela + (aktifDolap || 0) + (aktifRaf || 0) + doluHücre;

      const yeniDepolama: DepolamaIstatistikleri = {
        // Kartela
        toplamKartela: tKartela,
        doluKartela: toplamDoluKartela,
        bosKartela: tKartela - toplamDoluKartela,
        dolulukOraniKartela: tKartela > 0 ? Math.round((toplamDoluKartela / tKartela) * 100) : 0,
        
        // Dolap
        toplamDolap: tDolap,
        doluDolap: aktifDolap || 0,
        bosDolap: tDolap - (aktifDolap || 0),
        dolulukOraniDolap: tDolap > 0 ? Math.round(((aktifDolap || 0) / tDolap) * 100) : 0,
        
        // Raf
        toplamRaf: tRaf,
        doluRaf: aktifRaf || 0,
        bosRaf: tRaf - (aktifRaf || 0),
        dolulukOraniRaf: tRaf > 0 ? Math.round(((aktifRaf || 0) / tRaf) * 100) : 0,
        
        // Hücre
        toplamHücre: tHücre,
        doluHücre: doluHücre,
        bosHücre: bosHücre,
        dolulukOraniHücre: tHücre > 0 ? Math.round((doluHücre / tHücre) * 100) : 0,
        
        // Genel
        toplamDepolamaBirimi,
        toplamDoluBirim,
        toplamBosBirim: toplamDepolamaBirimi - toplamDoluBirim,
        genelDolulukOrani: toplamDepolamaBirimi > 0 ? Math.round((toplamDoluBirim / toplamDepolamaBirimi) * 100) : 0,
        
        // Aktivite
        son24SaatEklenen: son24SaatEklenen || 0,
        son7GunEklenen: son7GunEklenen || 0,
        
        // Grafikler
        dolulukTrendi,
        
        birimDagilimi: [
          { name: 'Kartela', dolu: toplamDoluKartela, bos: tKartela - toplamDoluKartela, toplam: tKartela },
          { name: 'Dolap', dolu: aktifDolap || 0, bos: tDolap - (aktifDolap || 0), toplam: tDolap },
          { name: 'Raf', dolu: aktifRaf || 0, bos: tRaf - (aktifRaf || 0), toplam: tRaf },
          { name: 'Hücre', dolu: doluHücre, bos: bosHücre, toplam: tHücre }
        ]
      };

      setDepolama(yeniDepolama);

      setOzet({
        toplamKullanici: toplamKullanici || 0,
        aktifKullanici: aktifKullanici || 0,
        toplamOda: toplamOda || 0,
        aktifOda: aktifOda || 0
      });

      if (onDataLoaded) {
        onDataLoaded(yeniDepolama);
      }

    } catch (error) {
      console.error('İstatistik yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = {
    dolu: '#10b981',
    bos: '#94a3b8',
    kartela: '#3b82f6',
    dolap: '#8b5cf6',
    raf: '#f59e0b',
    hucre: '#ec4899'
  } as const;

  const getPieData = (): PieDataItem[] => {
    if (!depolama) return [];

    switch (selectedView) {
      case 'kartela':
        return [
          { name: 'Dolu Kartela', value: depolama.doluKartela, color: COLORS.dolu },
          { name: 'Boş Kartela', value: depolama.bosKartela, color: COLORS.bos }
        ];
      case 'dolap':
        return [
          { name: 'Dolu Dolap', value: depolama.doluDolap, color: COLORS.dolu },
          { name: 'Boş Dolap', value: depolama.bosDolap, color: COLORS.bos }
        ];
      case 'raf':
        return [
          { name: 'Dolu Raf', value: depolama.doluRaf, color: COLORS.dolu },
          { name: 'Boş Raf', value: depolama.bosRaf, color: COLORS.bos }
        ];
      case 'hucre':
        return [
          { name: 'Dolu Hücre', value: depolama.doluHücre, color: COLORS.dolu },
          { name: 'Boş Hücre', value: depolama.bosHücre, color: COLORS.bos }
        ];
      default:
        return [
          { name: 'Dolu Birimler', value: depolama.toplamDoluBirim, color: COLORS.dolu },
          { name: 'Boş Birimler', value: depolama.toplamBosBirim, color: COLORS.bos }
        ];
    }
  };

  const getDolulukOrani = (): number => {
    if (!depolama) return 0;
    
    switch (selectedView) {
      case 'kartela': return depolama.dolulukOraniKartela;
      case 'dolap': return depolama.dolulukOraniDolap;
      case 'raf': return depolama.dolulukOraniRaf;
      case 'hucre': return depolama.dolulukOraniHücre;
      default: return depolama.genelDolulukOrani;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-80 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-80 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!depolama || !ozet) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="text-yellow-700">İstatistik verisi bulunamadı</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* === ÖZET KARTLAR - Lucide İkonlar === */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs">Toplam Kullanıcı</span>
          </div>
          <div className="text-lg font-bold">{ozet.toplamKullanici}</div>
          <div className="text-xs text-green-600">{ozet.aktifKullanici} aktif</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Building2 className="w-4 h-4" />
            <span className="text-xs">Toplam Oda</span>
          </div>
          <div className="text-lg font-bold">{ozet.toplamOda}</div>
          <div className="text-xs text-green-600">{ozet.aktifOda} aktif</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Archive className="w-4 h-4" />
            <span className="text-xs">Depolama Birimi</span>
          </div>
          <div className="text-lg font-bold">{depolama.toplamDepolamaBirimi}</div>
          <div className="text-xs text-blue-600">{depolama.toplamDoluBirim} dolu</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs">Genel Doluluk</span>
          </div>
          <div className="text-lg font-bold">%{depolama.genelDolulukOrani}</div>
          <div className="text-xs text-orange-600">+{depolama.son24SaatEklenen} bugün</div>
        </div>
      </div>

      {/* === BİRİM SEÇİCİ - Lucide İkonlar === */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'genel', label: 'Genel', icon: LayoutDashboard, color: 'blue' },
          { id: 'kartela', label: 'Kartela', icon: Grid2x2, color: 'blue' },
          { id: 'dolap', label: 'Dolap', icon: DoorOpen, color: 'purple' },
          { id: 'raf', label: 'Raf', icon: Layers, color: 'orange' },
          { id: 'hucre', label: 'Hücre', icon: Square, color: 'pink' }
        ].map((view) => {
          const Icon = view.icon;
          return (
            <button
              key={view.id}
              onClick={() => setSelectedView(view.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedView === view.id
                  ? view.id === 'genel' || view.id === 'kartela' ? 'bg-blue-600 text-white'
                    : view.id === 'dolap' ? 'bg-purple-600 text-white'
                    : view.id === 'raf' ? 'bg-orange-600 text-white'
                    : 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {view.label}
            </button>
          );
        })}
      </div>

      {/* === ANA GRAFİKLER === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. DOLULUK DAĞILIMI */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-4 h-4 text-gray-700" />
            <h3 className="text-sm font-semibold text-gray-700">
              {selectedView === 'genel' ? 'Toplam Doluluk Dağılımı' 
                : `${selectedView.charAt(0).toUpperCase() + selectedView.slice(1)} Doluluk Dağılımı`}
            </h3>
          </div>
          
          {getPieData().every(item => item.value === 0) ? (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Henüz veri bulunmuyor
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={getPieData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderPieLabel}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {getPieData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={pieTooltipFormatter} />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="mt-4 text-center">
                <span className="text-2xl font-bold text-gray-800">
                  %{getDolulukOrani()}
                </span>
                <span className="text-sm text-gray-500 ml-2">doluluk oranı</span>
              </div>
            </>
          )}
        </div>

        {/* 2. BİRİM BAZLI DOLULUK */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-gray-700" />
            <h3 className="text-sm font-semibold text-gray-700">
              Birim Bazlı Doluluk (%)
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={depolama.birimDagilimi}
              layout="vertical"
              margin={{ left: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="name" />
              <Tooltip formatter={barTooltipFormatter} />
              <Bar 
                dataKey={(item: BirimDagilim) => 
                  item.toplam > 0 ? Math.round((item.dolu / item.toplam) * 100) : 0
                } 
                radius={[0, 4, 4, 0]}
              >
                {depolama.birimDagilimi.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      entry.name === 'Kartela' ? COLORS.kartela
                      : entry.name === 'Dolap' ? COLORS.dolap
                      : entry.name === 'Raf' ? COLORS.raf
                      : COLORS.hucre
                    } 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3. DOLULUK TRENDİ */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <LineChart className="w-4 h-4 text-gray-700" />
            <h3 className="text-sm font-semibold text-gray-700">
              Doluluk Trendi (Son 7 Gün)
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={depolama.dolulukTrendi}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tarih" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={areaTooltipFormatter} />
              <Area 
                type="monotone" 
                dataKey="oran" 
                stroke={COLORS.dolu} 
                fill={COLORS.dolu} 
                fillOpacity={0.2}
                name="Doluluk"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 4. BİRİM SAYILARI */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Archive className="w-4 h-4 text-gray-700" />
            <h3 className="text-sm font-semibold text-gray-700">
              Toplam Birim Sayıları
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={depolama.birimDagilimi}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="toplam" fill={COLORS.bos} name="Toplam Birim" />
              <Bar dataKey="dolu" fill={COLORS.dolu} name="Dolu Birim" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* === DETAYLI DOLULUK KARTLARI - Lucide İkonlar === */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Kartela */}
        <div className={`p-3 rounded-lg border ${
          selectedView === 'kartela' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
        }`}>
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Grid2x2 className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium">Kartela</span>
          </div>
          <div className="text-lg font-bold">{depolama.toplamKartela}</div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-green-600">{depolama.doluKartela} dolu</span>
            <span className="text-gray-500">{depolama.bosKartela} boş</span>
            <span className="font-medium text-blue-600">%{depolama.dolulukOraniKartela}</span>
          </div>
        </div>
        
        {/* Dolap */}
        <div className={`p-3 rounded-lg border ${
          selectedView === 'dolap' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'
        }`}>
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <DoorOpen className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium">Dolap</span>
          </div>
          <div className="text-lg font-bold">{depolama.toplamDolap}</div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-green-600">{depolama.doluDolap} dolu</span>
            <span className="text-gray-500">{depolama.bosDolap} boş</span>
            <span className="font-medium text-purple-600">%{depolama.dolulukOraniDolap}</span>
          </div>
        </div>
        
        {/* Raf */}
        <div className={`p-3 rounded-lg border ${
          selectedView === 'raf' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'
        }`}>
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Layers className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-medium">Raf</span>
          </div>
          <div className="text-lg font-bold">{depolama.toplamRaf}</div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-green-600">{depolama.doluRaf} dolu</span>
            <span className="text-gray-500">{depolama.bosRaf} boş</span>
            <span className="font-medium text-orange-600">%{depolama.dolulukOraniRaf}</span>
          </div>
        </div>
        
        {/* Hücre */}
        <div className={`p-3 rounded-lg border ${
          selectedView === 'hucre' ? 'border-pink-500 bg-pink-50' : 'border-gray-200 bg-white'
        }`}>
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Square className="w-4 h-4 text-pink-600" />
            <span className="text-xs font-medium">Hücre</span>
          </div>
          <div className="text-lg font-bold">{depolama.toplamHücre}</div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-green-600">{depolama.doluHücre} dolu</span>
            <span className="text-gray-500">{depolama.bosHücre} boş</span>
            <span className="font-medium text-pink-600">%{depolama.dolulukOraniHücre}</span>
          </div>
        </div>
      </div>

      {/* === AKTİVİTE ÖZETİ === */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-gray-700">
            <span className="font-medium">Son 24 Saat:</span> {depolama.son24SaatEklenen} yeni kartela
          </span>
          <span className="text-gray-700">
            <span className="font-medium">Son 7 Gün:</span> {depolama.son7GunEklenen} yeni kartela
          </span>
          {depolama.bosHücre > 0 && (
            <>
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-700">
                <span className="font-medium">{depolama.bosHücre}</span> boş hücre mevcut
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
