// components/kartela/KartelaTransfer.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Package, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  MapPin,
  Home,
  Layers,
  ArrowRightLeft,
  AlertTriangle,
  Info,
  Camera,
  Scan
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

type Kartela = Database['public']['Tables']['kartelalar']['Row'] & {
  renk_masalari?: {
    pantone_kodu: string | null;
    hex_kodu: string | null;
    renk_adi: string | null;
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
  hucre_raflar?: {
    raf_kodu: string;
    raf_adi: string;
    dolap_id: number | null;
  };
  hucre_raflar_dolaplar?: {
    dolap_kodu: string;
    dolap_adi: string;
    oda_id: number | null;
  };
  hucre_raflar_dolaplar_odalar?: {
    oda_kodu: string;
    oda_adi: string;
    kat: string | null;
    bina: string | null;
  };
};

type Hucre = Database['public']['Tables']['hucreler']['Row'];

interface KartelaTransferProps {
  currentOdaId?: number;
  currentUserId?: number;
  onSuccess?: () => void;
}

type TransferStep = 'kartela' | 'hucre' | 'confirm' | 'success' | 'error';

export default function KartelaTransfer({ 
  currentOdaId, 
  currentUserId,
  onSuccess 
}: KartelaTransferProps) {
  const [currentStep, setCurrentStep] = useState<TransferStep>('kartela');
  const [kartela, setKartela] = useState<Kartela | null>(null);
  const [hucre, setHucre] = useState<Hucre | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  
  const kartelaInputRef = useRef<HTMLInputElement>(null);
  const hucreInputRef = useRef<HTMLInputElement>(null);

  // STEP 1: Kartela QR Okuma
  const handleKartelaScan = async (kartelaKodu: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Önce kartelayı bul (renk_kodu ile)
      let query = supabase
        .from('kartelalar')
        .select(`
          *,
          renk_masalari!left (
            pantone_kodu,
            hex_kodu,
            renk_adi
          ),
          hucreler!left (
            id,
            hucre_kodu,
            hucre_adi,
            kapasite,
            mevcut_kartela_sayisi,
            raf_id,
            aktif,
            raflar!left (
              raf_kodu,
              raf_adi,
              dolap_id,
              dolaplar!left (
                dolap_kodu,
                dolap_adi,
                oda_id,
                odalar!left (
                  oda_kodu,
                  oda_adi,
                  kat,
                  bina
                )
              )
            )
          )
        `)
        .eq('silindi', false);

      // Eğer sayısal değer girildiyse (23011737 gibi)
      if (!isNaN(Number(kartelaKodu))) {
        const renkNo = parseInt(kartelaKodu);
        query = query.or(`kartela_no.eq.${kartelaKodu},renk_kodu.ilike.%${renkNo}%`);
      } else {
        query = query.or(`kartela_no.eq.${kartelaKodu},renk_kodu.ilike.%${kartelaKodu}%`);
      }

      const { data, error } = await query.limit(1);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('Kartela bulunamadı!');
      }

      const kartelaData = data[0];

      // Kartela kontrolü
      if (kartelaData.durum === 'KULLANIM_DISI') {
        throw new Error('Bu kartela kullanım dışı!');
      }

      if (kartelaData.durum === 'KARTELA_ARSIV') {
        throw new Error('Bu kartela arşivde!');
      }

      setKartela(kartelaData as any);
      setCurrentStep('hucre');
      
    } catch (error: any) {
      setError(error.message || 'Kartela okunurken hata oluştu');
      setCurrentStep('error');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Hücre QR Okuma
  const handleHucreScan = async (hucreKodu: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('hucreler')
        .select(`
          *,
          raflar!left (
            raf_kodu,
            raf_adi,
            dolap_id,
            dolaplar!left (
              dolap_kodu,
              dolap_adi,
              oda_id,
              odalar!left (
                oda_kodu,
                oda_adi,
                kat,
                bina
              )
            )
          )
        `)
        .eq('hucre_kodu', hucreKodu)
        .limit(1);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('Hücre bulunamadı!');
      }

      const hucreData = data[0];

      // Hücre kontrolü
      if (!hucreData.aktif) {
        throw new Error('Bu hücre pasif durumda!');
      }

      if (hucreData.kapasite && hucreData.mevcut_kartela_sayisi && 
          hucreData.mevcut_kartela_sayisi >= hucreData.kapasite) {
        throw new Error('Bu hücre dolu!');
      }

      // Eğer kartela zaten bu hücredeyse
      if (kartela?.hucre_id === hucreData.id) {
        throw new Error('Kartela zaten bu hücrede!');
      }

      setHucre(hucreData as any);
      setCurrentStep('confirm');
      
    } catch (error: any) {
      setError(error.message || 'Hücre okunurken hata oluştu');
      setCurrentStep('error');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Transferi Onayla ve Yap
  const confirmTransfer = async () => {
    if (!kartela || !hucre) return;
    
    setLoading(true);
    
    try {
      // 1. Kartelanın eski hücresini güncelle (çıkar)
      if (kartela.hucre_id) {
        const { error: eskiHucreError } = await supabase
          .from('hucreler')
          .update({ 
            mevcut_kartela_sayisi: (hucre.mevcut_kartela_sayisi || 1) - 1 
          })
          .eq('id', kartela.hucre_id);

        if (eskiHucreError) throw eskiHucreError;
      }

      // 2. Yeni hücreyi güncelle (ekle)
      const { error: yeniHucreError } = await supabase
        .from('hucreler')
        .update({ 
          mevcut_kartela_sayisi: (hucre.mevcut_kartela_sayisi || 0) + 1 
        })
        .eq('id', hucre.id);

      if (yeniHucreError) throw yeniHucreError;

      // 3. Kartela bilgisini güncelle
      const { error: kartelaError } = await supabase
        .from('kartelalar')
        .update({ 
          hucre_id: hucre.id,
          hucre_kodu: hucre.hucre_kodu,
          son_kullanim_tarihi: new Date().toISOString(),
          son_kullanan_kullanici_id: currentUserId,
          toplam_kullanim_sayisi: (kartela.toplam_kullanim_sayisi || 0) + 1
        })
        .eq('id', kartela.id);

      if (kartelaError) throw kartelaError;

      // 4. Hareket logu oluştur
      const { error: logError } = await supabase
        .from('hareket_loglari')
        .insert({
          kartela_id: kartela.id,
          kartela_no: kartela.kartela_no || `KRT-${kartela.id}`,
          hareket_tipi: 'TRANSFER',
          eski_hucre_kodu: kartela.hucre_kodu,
          yeni_hucre_kodu: hucre.hucre_kodu,
          kullanici_id: currentUserId,
          aciklama: `Kartela ${kartela.renk_kodu} transfer edildi`,
          ip_adresi: null,
          tarih: new Date().toISOString()
        });

      if (logError) throw logError;

      setSuccessMessage('✅ Kartela başarıyla transfer edildi!');
      setCurrentStep('success');
      
      if (onSuccess) onSuccess();
      
    } catch (error: any) {
      setError(error.message || 'Transfer sırasında hata oluştu');
      setCurrentStep('error');
    } finally {
      setLoading(false);
    }
  };

  // Transferi sıfırla
  const resetTransfer = () => {
    setKartela(null);
    setHucre(null);
    setError(null);
    setSuccessMessage(null);
    setCurrentStep('kartela');
  };

  // QR Scanner simülasyonu (gerçek kamera API'si eklenebilir)
  const simulateQRScan = (type: 'kartela' | 'hucre') => {
    const qrCode = prompt(`Lütfen ${type === 'kartela' ? 'KARTELA' : 'HÜCRE'} QR kodunu girin:`);
    if (qrCode) {
      if (type === 'kartela') {
        handleKartelaScan(qrCode);
      } else {
        handleHucreScan(qrCode);
      }
    }
  };

  // Manuel giriş handler'ları
  const handleKartelaManual = () => {
    const value = kartelaInputRef.current?.value;
    if (value) handleKartelaScan(value);
  };

  const handleHucreManual = () => {
    const value = hucreInputRef.current?.value;
    if (value) handleHucreScan(value);
  };

  // Kartela konum bilgisi
  const renderKartelaKonum = () => {
    if (!kartela?.hucreler) return '📍 Hücreye yerleştirilmemiş';
    
    const h = kartela.hucreler;
    const raf = kartela.hucre_raflar;
    const dolap = kartela.hucre_raflar_dolaplar;
    const oda = kartela.hucre_raflar_dolaplar_odalar;
    
    return (
      <div className="text-sm">
        {oda && <div><Home className="inline w-3 h-3 mr-1" /> {oda.oda_kodu} • {oda.oda_adi}</div>}
        {dolap && <div><Package className="inline w-3 h-3 mr-1" /> {dolap.dolap_kodu} • {dolap.dolap_adi}</div>}
        {raf && <div><Layers className="inline w-3 h-3 mr-1" /> {raf.raf_kodu} • {raf.raf_adi}</div>}
        <div><MapPin className="inline w-3 h-3 mr-1" /> {h.hucre_kodu} • {h.hucre_adi}</div>
      </div>
    );
  };

  // Hücre konum bilgisi
  const renderHucreKonum = () => {
    if (!hucre) return null;
    
    return (
      <div className="text-sm">
        <div><MapPin className="inline w-3 h-3 mr-1" /> {hucre.hucre_kodu} • {hucre.hucre_adi}</div>
        <div className="text-xs text-gray-500 mt-1">
          Kapasite: {hucre.mevcut_kartela_sayisi || 0}/{hucre.kapasite || 0}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <ArrowRightLeft className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Kartela Transfer Sistemi</h2>
        <p className="text-gray-600 mt-2">QR kodları ile kartela al/ver işlemi yapın</p>
        
        {/* İşlem Adımları */}
        <div className="flex justify-center mt-6">
          <div className="flex items-center">
            <div className={`flex flex-col items-center ${currentStep === 'kartela' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 'kartela' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <span className="font-bold">1</span>
              </div>
              <span className="text-xs mt-2">Kartela</span>
            </div>
            
            <div className={`w-16 h-1 mx-2 ${currentStep !== 'kartela' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
            
            <div className={`flex flex-col items-center ${currentStep === 'hucre' || currentStep === 'confirm' || currentStep === 'success' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep !== 'kartela' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <span className="font-bold">2</span>
              </div>
              <span className="text-xs mt-2">Hücre</span>
            </div>
            
            <div className={`w-16 h-1 mx-2 ${currentStep === 'confirm' || currentStep === 'success' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
            
            <div className={`flex flex-col items-center ${currentStep === 'confirm' || currentStep === 'success' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 'confirm' || currentStep === 'success' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <span className="font-bold">3</span>
              </div>
              <span className="text-xs mt-2">Onay</span>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: Kartela QR Okuma */}
      {currentStep === 'kartela' && (
        <div className="text-center py-8">
          <div className="mb-6">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Kartela QR Kodunu Okutun</h3>
            <p className="text-gray-600">Kartela barkodunu taratın veya kartela numarasını girin</p>
          </div>
          
          <div className="max-w-md mx-auto space-y-4">
            {/* QR Scanner Simülasyonu */}
            <button
              onClick={() => simulateQRScan('kartela')}
              className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-3"
            >
              <Camera className="h-5 w-5" />
              QR Kodunu Tara
            </button>
            
            <div className="text-center text-gray-500">veya</div>
            
            {/* Manuel Giriş */}
            <div>
              <input
                ref={kartelaInputRef}
                type="text"
                placeholder="Kartela no veya renk kodu girin (örn: 23011737.1)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                onKeyPress={(e) => e.key === 'Enter' && handleKartelaManual()}
              />
              <button
                onClick={handleKartelaManual}
                className="w-full mt-2 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
              >
                Kartela Ara
              </button>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200 text-left">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">Kartela Transfer Kuralları:</p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• Sadece "AKTIF" veya "DOLU" durumdaki kartelalar transfer edilebilir</li>
                  <li>• Arşivdeki veya kullanım dışı kartelalar transfer edilemez</li>
                  <li>• Her kartela QR kodu veya barkodu ile tanımlanmıştır</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Hücre QR Okuma */}
      {currentStep === 'hucre' && kartela && (
        <div className="text-center py-8">
          <div className="mb-6">
            <div className="text-6xl mb-4">📍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">2. Hedef Hücre QR Kodunu Okutun</h3>
            <p className="text-gray-600">Kartelayı yerleştireceğiniz hücrenin QR kodunu taratın</p>
          </div>
          
          {/* Seçilen Kartela Bilgisi */}
          <div className="max-w-md mx-auto mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="font-bold text-gray-900">{kartela.kartela_no || `KRT-${kartela.id}`}</div>
                <div className="text-sm text-gray-600">
                  <span className="font-mono">{kartela.renk_kodu}</span>
                  {kartela.renk_masalari?.renk_adi ? (
                    <span className="ml-2">• {kartela.renk_masalari.renk_adi}</span>
                  ) : (
                    <span className="ml-2 text-amber-600 text-xs">(Renk adı girilmemiş)</span>
                  )}
                  {kartela.renk_masalari?.pantone_kodu && (
                    <span className="ml-2 text-xs text-purple-600">• {kartela.renk_masalari.pantone_kodu}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {renderKartelaKonum()}
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs ${kartela.durum === 'AKTIF' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                {kartela.durum === 'AKTIF' ? '✅ Aktif' : '🔵 Dolu'}
              </div>
            </div>
          </div>
          
          <div className="max-w-md mx-auto space-y-4">
            <button
              onClick={() => simulateQRScan('hucre')}
              className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-3"
            >
              <Scan className="h-5 w-5" />
              Hücre QR Kodunu Tara
            </button>
            
            <div className="text-center text-gray-500">veya</div>
            
            <div>
              <input
                ref={hucreInputRef}
                type="text"
                placeholder="Hücre kodu girin (örn: ARSIV-HUCRE-01)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                onKeyPress={(e) => e.key === 'Enter' && handleHucreManual()}
              />
              <button
                onClick={handleHucreManual}
                className="w-full mt-2 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
              >
                Hücre Ara
              </button>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200 text-left">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm text-green-800 font-medium">Hücre Kontrolleri:</p>
                <ul className="text-xs text-green-700 mt-1 space-y-1">
                  <li>• Sadece "AKTIF" hücreler seçilebilir</li>
                  <li>• Dolu hücrelere kartela eklenemez</li>
                  <li>• Kartela zaten aynı hücrede ise transfer yapılamaz</li>
                  <li>• Hücre kapasitesi kontrol edilir</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Onay */}
      {currentStep === 'confirm' && kartela && hucre && (
        <div className="text-center py-8">
          <div className="mb-6">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Transferi Onaylayın</h3>
            <p className="text-gray-600">Aşağıdaki bilgileri kontrol edip transferi onaylayın</p>
          </div>
          
          <div className="max-w-md mx-auto space-y-6">
            {/* Kartela Bilgisi */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-left">
                <div className="font-bold text-gray-900 mb-2">📦 TAŞINACAK KARTELA</div>
                <div className="font-mono font-bold text-blue-700">{kartela.kartela_no || `KRT-${kartela.id}`}</div>
                <div className="text-sm text-gray-700">
                  <span className="font-mono">{kartela.renk_kodu}</span>
                  {kartela.renk_masalari?.renk_adi ? (
                    <span className="ml-2">• {kartela.renk_masalari.renk_adi}</span>
                  ) : (
                    <span className="ml-2 text-amber-600 text-xs">(Renk adı girilmemiş)</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {renderKartelaKonum()}
                </div>
              </div>
            </div>
            
            {/* Ok İkonu */}
            <div className="flex justify-center">
              <ArrowRightLeft className="h-8 w-8 text-gray-400" />
            </div>
            
            {/* Hücre Bilgisi */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-left">
                <div className="font-bold text-gray-900 mb-2">📍 HEDEF HÜCRE</div>
                {renderHucreKonum()}
                <div className="text-xs text-gray-500 mt-2">
                  Kapasite Durumu: {hucre.mevcut_kartela_sayisi || 0}/{hucre.kapasite || 0}
                </div>
              </div>
            </div>
            
            {/* Onay Butonları */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={resetTransfer}
                className="flex-1 py-3 border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                İptal
              </button>
              <button
                onClick={confirmTransfer}
                disabled={loading}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'İşleniyor...' : 'Transferi Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS */}
      {currentStep === 'success' && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 text-green-500">✅</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Transfer Başarılı!</h3>
          <p className="text-gray-600 mb-6">{successMessage}</p>
          
          {kartela && hucre && (
            <div className="max-w-md mx-auto p-4 bg-green-50 rounded-lg border border-green-200 mb-6">
              <div className="text-left">
                <div className="font-bold text-green-800 mb-2">Transfer Özeti:</div>
                <div className="text-sm">
                  <div className="mb-2">
                    <span className="font-medium">Kartela:</span> {kartela.kartela_no} • {kartela.renk_kodu}
                    {kartela.renk_masalari?.renk_adi && (
                      <span> • {kartela.renk_masalari.renk_adi}</span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Yeni Hücre:</span> {hucre.hucre_kodu}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    📅 {new Date().toLocaleString('tr-TR')}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={resetTransfer}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Yeni Transfer Yap
          </button>
        </div>
      )}

      {/* ERROR */}
      {currentStep === 'error' && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 text-red-500">❌</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Hata Oluştu!</h3>
          <p className="text-red-600 mb-6">{error}</p>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={resetTransfer}
              className="px-6 py-3 border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50"
            >
              Başa Dön
            </button>
            <button
              onClick={() => setCurrentStep('kartela')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      )}

      {/* Yükleniyor */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-700">İşlem yapılıyor...</p>
          </div>
        </div>
      )}
    </div>
  );
}