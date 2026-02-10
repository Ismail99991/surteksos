'use client';

import { 
  Users, 
  Building, 
  KeyRound, 
  Shield,
  TrendingUp,
  Activity,
  HardDrive
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

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
        supabase.from('kullanicilar').select('*', { count: 'exact', head: true }),
        supabase.from('kullanicilar').select('*', { count: 'exact', head: true }).eq('aktif', true),
        supabase.from('kullanicilar').select('*', { count: 'exact', head: true }).eq('sistem_yoneticisi', true),
        supabase.from('odalar').select('*', { count: 'exact', head: true }),
        supabase.from('odalar').select('*', { count: 'exact', head: true }).eq('aktif', true),
        supabase.from('kullanici_yetkileri').select('*', { count: 'exact', head: true }),
        supabase.from('sistem_loglari').select('*', { count: 'exact', head: true })
          .gte('created_at', new Date().toISOString().split('T')[0]),
        supabase.from('sistem_loglari').select('*', { count: 'exact', head: true })
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

  const cards = [
    {
      title: 'Toplam Kullanıcı',
      value: istatistikler.toplamKullanici,
      sub: `${istatistikler.aktifKullanici} aktif`,
      percent: Math.round((istatistikler.aktifKullanici / Math.max(istatistikler.toplamKullanici, 1)) * 100),
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Toplam Oda',
      value: istatistikler.toplamOda,
      sub: `${istatistikler.aktifOda} aktif`,
      percent: Math.round((istatistikler.aktifOda / Math.max(istatistikler.toplamOda, 1)) * 100),
      icon: Building,
      color: 'green'
    },
    {
      title: 'Yetki Kaydı',
      value: istatistikler.toplamYetki,
      sub: 'Oda-kullanıcı eşleşmesi',
      percent: 100,
      icon: KeyRound,
      color: 'yellow'
    },
    {
      title: 'Sistem Logu',
      value: istatistikler.bugunLog,
      sub: `${istatistikler.bugunLog} bugün`,
      percent: Math.min(istatistikler.bugunLog, 100),
      icon: HardDrive,
      color: 'red'
    },
    {
      title: 'Sistem Yöneticisi',
      value: istatistikler.sistemYoneticisi,
      sub: 'Tam yetkili kullanıcı',
      percent: 100,
      icon: Shield,
      color: 'purple'
    },
    {
      title: 'Son 24 Saat Giriş',
      value: istatistikler.son24SaatGiris,
      sub: 'Başarılı oturum açma',
      percent: Math.min(istatistikler.son24SaatGiris, 100),
      icon: Activity,
      color: 'cyan'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    green: 'bg-green-50 border-green-100 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-100 text-yellow-700',
    red: 'bg-red-50 border-red-100 text-red-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
    cyan: 'bg-cyan-50 border-cyan-100 text-cyan-700'
  };

  const iconColorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    cyan: 'bg-cyan-100 text-cyan-600'
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 w-full">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gray-100 border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-8"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-700">{error}</div>
        <button
          onClick={loadIstatistikler}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-sm"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 w-full">
      {cards.map((card, i) => {
        const Icon = card.icon;
        const colorClass = colorClasses[card.color as keyof typeof colorClasses];
        const iconColorClass = iconColorClasses[card.color as keyof typeof iconColorClasses];

        return (
          <div
            key={i}
            className={`${colorClass} border rounded-lg p-4 hover:shadow-sm transition-all`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 ${iconColorClass} rounded-lg`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-xs text-gray-500">%{card.percent}</div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="text-sm font-semibold text-gray-800 truncate">
                {card.title}
              </div>
              <div className="text-xs text-gray-600 truncate">
                {card.sub}
              </div>
            </div>

            <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${iconColorClass}`}
                style={{ width: `${Math.min(card.percent, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}