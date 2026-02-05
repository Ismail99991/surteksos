'use client';

import { 
  Users, 
  Building, 
  KeyRound, 
  Database,
  Shield,
  BarChart3,
  TrendingUp,
  Activity
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { Database } from '@/types/supabase';

const supabase = createClient();

interface Istatistikler {
  toplamKullanici: number;
  aktifKullanici: number;
  sistemYoneticisi: number;
  toplamOda: number;
  aktifOda: number;
  toplamYetki: number;
  bugunLog: number;
  son24SaatGiris: number;
}

interface YoneticiIstatistiklerProps {
  onDataLoaded?: (istatistikler: Istatistikler) => void;
  refreshTrigger?: boolean;
}

export default function YoneticiIstatistikler({ 
  onDataLoaded,
  refreshTrigger = false 
}: YoneticiIstatistiklerProps) {
  const [istatistikler, setIstatistikler] = useState<Istatistikler>({
    toplamKullanici: 0,
    aktifKullanici: 0,
    sistemYoneticisi: 0,
    toplamOda: 0,
    aktifOda: 0,
    toplamYetki: 0,
    bugunLog: 0,
    son24SaatGiris: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIstatistikler();
  }, [refreshTrigger]);

  const loadIstatistikler = async () => {
    try {
      setLoading(true);
      setError(null);

      // Paralel olarak tüm verileri çek
      const [
        { count: toplamKullanici },
        { count: aktifKullanici },
        { count: sistemYoneticisi },
        { count: toplamOda },
        { count: aktifOda },
        { count: toplamYetki },
        { count: bugunLog },
        { count: son24SaatGiris }
      ] = await Promise.all([
        // Toplam kullanıcı
        supabase.from('kullanicilar').select('*', { count: 'exact', head: true }),
        
        // Aktif kullanıcı
        supabase.from('kullanicilar').select('*', { count: 'exact', head: true }).eq('aktif', true),
        
        // Sistem yöneticisi
        supabase.from('kullanicilar').select('*', { count: 'exact', head: true }).eq('sistem_yoneticisi', true),
        
        // Toplam oda
        supabase.from('odalar').select('*', { count: 'exact', head: true }),
        
        // Aktif oda
        supabase.from('odalar').select('*', { count: 'exact', head: true }).eq('aktif', true),
        
        // Toplam yetki
        supabase.from('kullanici_yetkileri').select('*', { count: 'exact', head: true }),
        
        // Bugünkü loglar
        supabase.from('sistem_loglari')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date().toISOString().split('T')[0]),
        
        // Son 24 saat giriş
        supabase.from('sistem_loglari')
          .select('*', { count: 'exact', head: true })
          .eq('islem_turu', 'GIRIS_BASARILI')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      const yeniIstatistikler: Istatistikler = {
        toplamKullanici: toplamKullanici || 0,
        aktifKullanici: aktifKullanici || 0,
        sistemYoneticisi: sistemYoneticisi || 0,
        toplamOda: toplamOda || 0,
        aktifOda: aktifOda || 0,
        toplamYetki: toplamYetki || 0,
        bugunLog: bugunLog || 0,
        son24SaatGiris: son24SaatGiris || 0
      };

      setIstatistikler(yeniIstatistikler);
      onDataLoaded?.(yeniIstatistikler);

    } catch (error) {
      console.error('İstatistik yükleme hatası:', error);
      setError('İstatistikler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const istatistikKartlari = [
    {
      id: 'kullanicilar',
      baslik: 'Toplam Kullanıcı',
      deger: istatistikler.toplamKullanici,
      ikon: Users,
      renk: 'blue',
      altBaslik: `${istatistikler.aktifKullanici} aktif`,
      trend: istatistikler.aktifKullanici / Math.max(istatistikler.toplamKullanici, 1) * 100
    },
    {
      id: 'odalar',
      baslik: 'Toplam Oda',
      deger: istatistikler.toplamOda,
      ikon: Building,
      renk: 'green',
      altBaslik: `${istatistikler.aktifOda} aktif`,
      trend: istatistikler.aktifOda / Math.max(istatistikler.toplamOda, 1) * 100
    },
    {
      id: 'yetkiler',
      baslik: 'Yetki Kaydı',
      deger: istatistikler.toplamYetki,
      ikon: KeyRound,
      renk: 'yellow',
      altBaslik: 'Oda-kullanıcı eşleşmesi',
      trend: null
    },
    {
      id: 'loglar',
      baslik: 'Sistem Logu',
      deger: istatistikler.bugunLog + istatistikler.son24SaatGiris,
      ikon: Database,
      renk: 'red',
      altBaslik: `${istatistikler.bugunLog} bugün`,
      trend: null
    },
    {
      id: 'yoneticiler',
      baslik: 'Sistem Yöneticisi',
      deger: istatistikler.sistemYoneticisi,
      ikon: Shield,
      renk: 'purple',
      altBaslik: 'Tam yetkili kullanıcı',
      trend: null
    },
    {
      id: 'girisler',
      baslik: 'Son 24 Saat Giriş',
      deger: istatistikler.son24SaatGiris,
      ikon: Activity,
      renk: 'cyan',
      altBaslik: 'Başarılı oturum açma',
      trend: null
    }
  ];

  const renkSiniflari = {
    blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', ikonBg: 'bg-blue-500/20', ikonText: 'text-blue-400' },
    green: { bg: 'bg-green-500/20', text: 'text-green-400', ikonBg: 'bg-green-500/20', ikonText: 'text-green-400' },
    yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', ikonBg: 'bg-yellow-500/20', ikonText: 'text-yellow-400' },
    red: { bg: 'bg-red-500/20', text: 'text-red-400', ikonBg: 'bg-red-500/20', ikonText: 'text-red-400' },
    purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', ikonBg: 'bg-purple-500/20', ikonText: 'text-purple-400' },
    cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', ikonBg: 'bg-cyan-500/20', ikonText: 'text-cyan-400' }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-16"></div>
                <div className="h-6 bg-gray-700 rounded w-8"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 border border-red-700 rounded-xl p-6 text-center">
        <div className="text-red-400 mb-2">⚠️ {error}</div>
        <button
          onClick={loadIstatistikler}
          className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {istatistikKartlari.map((kart) => {
        const renk = renkSiniflari[kart.renk as keyof typeof renkSiniflari];
        const Ikon = kart.ikon;
        
        return (
          <div 
            key={kart.id} 
            className={`${renk.bg} border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 ${renk.ikonBg} rounded-lg`}>
                <Ikon className={`h-5 w-5 ${renk.ikonText}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <div className={`text-2xl font-bold ${renk.text}`}>
                    {kart.deger}
                  </div>
                  {kart.trend !== null && (
                    <div className="flex items-center gap-1 text-xs">
                      <TrendingUp className="h-3 w-3 text-green-400" />
                      <span className="text-green-400">{kart.trend.toFixed(0)}%</span>
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium text-gray-300 mt-1">
                  {kart.baslik}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {kart.altBaslik}
                </div>
              </div>
            </div>
            
            {kart.trend !== null && (
              <div className="mt-3">
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${renk.bg}`}
                    style={{ width: `${Math.min(kart.trend, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
