'use client';

import { useState, useEffect } from 'react'; // ← useEffect ekle
import { Clock, MapPin, User, Calendar, ArrowRight, Package, Eye, Archive, History, Activity } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
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

type HareketLog = Database['public']['Tables']['hareket_loglari']['Row'];

interface KartelaDetayProps {
  kartela: Kartela;
  showHistory?: boolean; // Hareket geçmişini göster/gizle
}

export default function KartelaDetay({ kartela, showHistory = true }: KartelaDetayProps) {
  const [hareketler, setHareketler] = useState<HareketLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // EN ÖNEMLİ DEĞİŞİKLİK: as any ekle
  const supabase = createClient() as any;

  // Hareket geçmişini yükle
  useEffect(() => {
    if (showHistory && kartela.kartela_no) {
      fetchHareketGecmisi();
    }
  }, [kartela.kartela_no, showHistory]);

  const fetchHareketGecmisi = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('hareket_loglari')
        .select('*')
        .or(`kartela_id.eq.${kartela.id},kartela_no.eq.${kartela.kartela_no}`)
        .order('tarih', { ascending: false })
        .limit(10);

      if (error) throw error;
      setHareketler(data || []);
    } catch (error) {
      console.error('Hareket geçmişi yüklenemedi:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Durum renkleri
  const getDurumRenk = (durum: string) => {
    switch (durum) {
      case 'AKTIF': return { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Aktif' };
      case 'DOLU': return { bg: 'bg-blue-100', text: 'text-blue-800', label: '🔵 Dolu' };
      case 'KARTELA_ARSIV': return { bg: 'bg-gray-100', text: 'text-gray-800', label: '📦 Arşiv' };
      case 'KALITE_ARSIV': return { bg: 'bg-indigo-100', text: 'text-indigo-800', label: '🏷️ Kalite Arşivi' };
      case 'KULLANIM_DISI': return { bg: 'bg-red-100', text: 'text-red-800', label: '⛔ Kullanım Dışı' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800', label: durum };
    }
  };

  const durumBilgi = getDurumRenk(kartela.durum|| 'AKTIF');
  
  // Göz durumu
  const getGozDurumu = (goz_sayisi: number) => {
    if (goz_sayisi === 0) return { text: '🆕 Yeni (0/14)', color: 'text-gray-600' };
    if (goz_sayisi < 7) return { text: `🟢 ${goz_sayisi}/14`, color: 'text-green-600' };
    if (goz_sayisi < 14) return { text: `🟡 ${goz_sayisi}/14`, color: 'text-yellow-600' };
    return { text: `🔴 DOLU (14/14)`, color: 'text-red-600' };
  };

  const gozDurumu = getGozDurumu(kartela.goz_sayisi|| 0);
  
  // Tarih formatı
  const formatTarih = (tarih: string) => {
    return new Date(tarih).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Kısa tarih formatı
  const formatKisaTarih = (tarih: string) => {
    return new Date(tarih).toLocaleDateString('tr-TR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Hareket tipi ikonu
  const getHareketIcon = (tip: string) => {
    switch (tip) {
      case 'OLUSTURMA': return '🆕';
      case 'GOZ_EKLEME': return '➕';
      case 'HUCRE_YERLESTIRME': return '🏠';
      case 'MUSTERI_ATAMA': return '👤';
      case 'DOLDU_ARSIV': return '📦';
      case 'SILINDI': return '🗑️';
      case 'DURUM_DEGISIMI': return '🔄';
      default: return '📝';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border p-6">
      {/* Başlık */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{kartela.renk_adi}</h3>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gray-600 font-mono">{kartela.kartela_no}</p>
            <span className="text-gray-500">•</span>
            <p className="text-gray-600">{kartela.renk_kodu}</p>
            {kartela.renk_masalari?.pantone_kodu && (
              <>
                <span className="text-gray-500">•</span>
                <p className="text-gray-600">Pantone: {kartela.renk_masalari.pantone_kodu}</p>
              </>
            )}
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-medium ${durumBilgi.bg} ${durumBilgi.text}`}>
          {durumBilgi.label}
        </div>
      </div>

      {/* Grid Bilgiler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Temel Bilgiler */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Package className="h-5 w-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">Kartela Bilgileri</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Göz Durumu:</span>
              <span className={`font-medium ${gozDurumu.color}`}>
                {gozDurumu.text}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dolum Oranı:</span>
              <span className="font-medium">{kartela.goz_dolum_orani}%</span>
            </div>
            {kartela.musteri_adi && (
              <div className="flex justify-between">
                <span className="text-gray-600">Müşteri:</span>
                <span className="font-medium">{kartela.musteri_adi}</span>
              </div>
            )}
            {kartela.proje_kodu && (
              <div className="flex justify-between">
                <span className="text-gray-600">Proje Kodu:</span>
                <span className="font-medium">{kartela.proje_kodu}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Toplam Kullanım:</span>
              <span className="font-medium">{kartela.toplam_kullanim_sayisi} kez</span>
            </div>
            {kartela.son_kullanim_tarihi && (
              <div className="flex justify-between">
                <span className="text-gray-600">Son Kullanım:</span>
                <span className="font-medium">{formatTarih(kartela.son_kullanim_tarihi)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Lokasyon Bilgisi */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">Lokasyon</h4>
          </div>
          <div className="space-y-3">
            {kartela.hucreler ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hücre Kodu:</span>
                  <span className="font-medium font-mono">{kartela.hucreler.hucre_kodu}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hücre Adı:</span>
                  <span className="font-medium">{kartela.hucreler.hucre_adi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Kapasite:</span>
                  <span className="font-medium">
                    {kartela.hucreler.mevcut_kartela_sayisi}/{kartela.hucreler.kapasite}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-gray-500 mb-1">Tam Konum:</p>
                  <p className="font-mono text-sm">
                    {kartela.hucre_kodu || 'Hücre atanmamış'}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <Eye className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Kartela henüz bir hücreye yerleştirilmemiş</p>
                <p className="text-sm text-gray-400 mt-1">QR okutarak hücreye yerleştirin</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sistem Bilgileri */}
      <div className="bg-gray-50 p-4 rounded-lg mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Calendar className="h-5 w-5 text-purple-600" />
          <h4 className="font-semibold text-gray-900">Sistem Bilgileri</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Oluşturulma:</span>
              <span className="font-medium">{formatTarih(kartela.olusturulma_tarihi || '')}</span>
            </div>
            {kartela.arsive_alma_tarihi && (
              <div className="flex justify-between">
                <span className="text-gray-600">Arşiv Tarihi:</span>
                <span className="font-medium">{formatTarih(kartela.arsive_alma_tarihi)}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {kartela.rpt_calismasi && (
              <div className="flex justify-between">
                <span className="text-gray-600">RPT Çalışması:</span>
                <span className="font-medium">{kartela.rpt_calismasi}</span>
              </div>
            )}
            {kartela.renk_masalari?.hex_kodu && (
              <div className="flex justify-between">
                <span className="text-gray-600">HEX Kodu:</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: kartela.renk_masalari.hex_kodu }}
                  />
                  <span className="font-medium font-mono">{kartela.renk_masalari.hex_kodu}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hareket Geçmişi */}
      {showHistory && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">Hareket Geçmişi</h4>
            </div>
            <button
              onClick={fetchHareketGecmisi}
              disabled={loadingHistory}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Activity className="h-4 w-4" />
              {loadingHistory ? 'Yükleniyor...' : 'Yenile'}
            </button>
          </div>
          
          {loadingHistory ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600 text-sm">Hareket geçmişi yükleniyor...</p>
            </div>
          ) : hareketler.length > 0 ? (
            <div className="space-y-3">
              {hareketler.map((hareket) => (
                <div key={hareket.id} className="flex items-start gap-3 p-3 bg-white rounded border">
                  <div className="text-2xl">{getHareketIcon(hareket.hareket_tipi || '')}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {(hareket.hareket_tipi || '').replace(/_/g, ' ')}
                        </p>
                        {hareket.aciklama && (
                          <p className="text-sm text-gray-600 mt-1">{hareket.aciklama}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{formatKisaTarih(hareket.tarih || '')}</p>
                        {hareket.kullanici_kodu && (
                          <p className="text-xs text-gray-400 mt-1">{hareket.kullanici_kodu}</p>
                        )}
                      </div>
                    </div>
                    
                    {(hareket.eski_durum || hareket.yeni_durum) && (
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        {hareket.eski_durum && (
                          <>
                            <span className="text-gray-500">Eski:</span>
                            <span className="px-2 py-1 bg-gray-100 rounded">{hareket.eski_durum}</span>
                          </>
                        )}
                        {hareket.yeni_durum && (
                          <>
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-500">Yeni:</span>
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">{hareket.yeni_durum}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p>Henüz hareket kaydı bulunmuyor</p>
              <p className="text-sm text-gray-400 mt-1">Kartela ile ilgili işlemler burada görünecek</p>
            </div>
          )}
        </div>
      )}

      {/* Notlar */}
      {(kartela.durum === 'KULLANIM_DISI' || kartela.silindi) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <Archive className="h-5 w-5" />
            <h4 className="font-semibold">Kullanım Dışı Bilgisi</h4>
          </div>
          <p className="text-red-700 text-sm">
            {kartela.silindi ? 'Bu kartela silinmiş.' : 'Bu kartela kullanım dışı bırakılmış.'}
            {kartela.silinme_tarihi && ` Silinme tarihi: ${formatTarih(kartela.silinme_tarihi)}`}
            {kartela.silen_kullanici_id && ` (Kullanıcı ID: ${kartela.silen_kullanici_id})`}
          </p>
        </div>
      )}
    </div>
  );
}