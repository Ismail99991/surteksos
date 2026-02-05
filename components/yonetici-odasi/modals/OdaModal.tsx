'use client';

import { useState, useEffect } from 'react';
import { 
  Building, 
  Hash, 
  FileText, 
  QrCode, 
  MapPin,
  X,
  Save,
  Copy,
  DoorOpen,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

const supabase = createClient();

type OdaType = Database['public']['Tables']['odalar']['Row'];

interface OdaModalProps {
  mode: 'create' | 'edit';
  oda?: OdaType | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface OdaFormData {
  oda_kodu: string;
  oda_adi: string;
  aciklama: string;
  qr_kodu: string;
  aktif: boolean;
  kat: string;
  bina: string;
  kapasite: number;
}

export default function OdaModal({ 
  mode, 
  oda, 
  onClose, 
  onSuccess 
}: OdaModalProps) {
  const [formData, setFormData] = useState<OdaFormData>({
    oda_kodu: '',
    oda_adi: '',
    aciklama: '',
    qr_kodu: '',
    aktif: true,
    kat: '',
    bina: '',
    kapasite: 1
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatedQR, setGeneratedQR] = useState<string>('');
  const [odaKoduKontrol, setOdaKoduKontrol] = useState<{
    loading: boolean;
    available: boolean;
    message: string;
  }>({ loading: false, available: false, message: '' });

  // Eğer edit modundaysa, formu oda verileriyle doldur
  useEffect(() => {
    if (mode === 'edit' && oda) {
      setFormData({
        oda_kodu: oda.oda_kodu || '',
        oda_adi: oda.oda_adi || '',
        aciklama: oda.aciklama || '',
        qr_kodu: oda.qr_kodu || '',
        aktif: oda.aktif || true,
        kat: oda.kat || '',
        bina: oda.bina || '',
        kapasite: oda.kapasite || 1
      });
      
      if (oda.qr_kodu) {
        setGeneratedQR(oda.qr_kodu);
      }
    }
  }, [mode, oda]);

  // Oda kodunu kontrol et (create modunda)
  useEffect(() => {
    if (mode === 'create' && formData.oda_kodu.trim()) {
      checkOdaKodu();
    }
  }, [formData.oda_kodu, mode]);

  // Oda kodunun müsait olup olmadığını kontrol et
  const checkOdaKodu = async () => {
    if (!formData.oda_kodu.trim()) return;

    setOdaKoduKontrol({ loading: true, available: false, message: '' });
    
    try {
      const { data, error } = await supabase
        .from('odalar')
        .select('oda_kodu')
        .eq('oda_kodu', formData.oda_kodu.trim().toUpperCase())
        .single();

      if (error && error.code === 'PGRST116') {
        // Oda kodu müsait
        setOdaKoduKontrol({ 
          loading: false, 
          available: true, 
          message: '✓ Oda kodu müsait' 
        });
      } else if (data) {
        // Oda kodu zaten var
        setOdaKoduKontrol({ 
          loading: false, 
          available: false, 
          message: '✗ Bu oda kodu zaten kullanılıyor' 
        });
      }
    } catch (error) {
      console.error('Oda kodu kontrol hatası:', error);
      setOdaKoduKontrol({ 
        loading: false, 
        available: false, 
        message: 'Kontrol sırasında hata' 
      });
    }
  };

  // Form validasyonu
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.oda_kodu.trim()) {
      newErrors.oda_kodu = 'Oda kodu gereklidir';
    } else if (mode === 'create' && !odaKoduKontrol.available) {
      newErrors.oda_kodu = 'Oda kodu müsait değil veya kontrol edilemedi';
    }

    if (!formData.oda_adi.trim()) {
      newErrors.oda_adi = 'Oda adı gereklidir';
    }

    if (formData.kapasite < 1) {
      newErrors.kapasite = 'Kapasite en az 1 olmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // QR kodu oluştur
  const generateQRCode = () => {
    if (!formData.oda_kodu) {
      alert('Önce oda kodunu girin!');
      return;
    }

    const timestamp = Date.now();
    const qrText = `ROOM-${formData.oda_kodu.toUpperCase()}-${timestamp}`;
    setGeneratedQR(qrText);
    setFormData(prev => ({ ...prev, qr_kodu: qrText }));
  };

  // Kopyala butonu
  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert('Kopyalandı!');
  };

  // Form gönderimi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        oda_kodu: formData.oda_kodu.toUpperCase()
      };

      if (mode === 'edit' && oda) {
        // Güncelleme işlemi
        const { error } = await supabase
          .from('odalar')
          .update(submitData)
          .eq('id', oda.id);

        if (error) throw error;

        // Sistem logu
        await supabase.from('sistem_loglari').insert([{
          islem_turu: 'ODA_GUNCELLENDI',
          detay: `${submitData.oda_adi} (${submitData.oda_kodu}) güncellendi`,
          ip_adresi: '127.0.0.1'
        }]);

      } else {
        // Yeni oda oluşturma
        const { error } = await supabase
          .from('odalar')
          .insert([submitData]);

        if (error) throw error;

        // Sistem logu
        await supabase.from('sistem_loglari').insert([{
          islem_turu: 'ODA_OLUSTURULDU',
          detay: `Yeni oda: ${submitData.oda_adi} (${submitData.oda_kodu})`,
          ip_adresi: '127.0.0.1'
        }]);
      }

      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('Oda kaydetme hatası:', error);
      
      // Unique constraint hatası kontrolü
      if (error.code === '23505') {
        setErrors({ oda_kodu: 'Bu oda kodu zaten kullanılıyor' });
      } else {
        alert('Oda kaydedilemedi!');
      }
    } finally {
      setLoading(false);
    }
  };

  // Input değişikliklerini işle
  const handleInputChange = (field: keyof OdaFormData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Hata mesajını temizle
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Oda kodu değiştiğinde kontrol et (create modunda)
    if (field === 'oda_kodu' && mode === 'create') {
      setOdaKoduKontrol({ loading: false, available: false, message: '' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Başlık */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {mode === 'edit' ? 'Oda Düzenle' : 'Yeni Oda'}
              </h2>
              <p className="text-gray-400">
                {mode === 'edit' 
                  ? `${oda?.oda_adi} (${oda?.oda_kodu})` 
                  : 'Yeni oda bilgilerini girin'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Form Alanları */}
            <div className="space-y-6">
              {/* Temel Bilgiler */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Building className="h-5 w-5 text-green-400" />
                  Temel Bilgiler
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Oda Kodu */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Oda Kodu *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="text"
                        value={formData.oda_kodu}
                        onChange={(e) => handleInputChange('oda_kodu', e.target.value.toUpperCase())}
                        className={`w-full pl-10 pr-4 py-2.5 bg-gray-900 border ${
                          errors.oda_kodu ? 'border-red-500' : 'border-gray-700'
                        } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-white uppercase`}
                        placeholder="ODA-001"
                        disabled={mode === 'edit'}
                      />
                    </div>
                    {errors.oda_kodu && (
                      <p className="mt-1 text-sm text-red-400">{errors.oda_kodu}</p>
                    )}
                    
                    {/* Oda kodu kontrol durumu */}
                    {mode === 'create' && formData.oda_kodu && (
                      <div className={`mt-1 text-xs flex items-center gap-1 ${
                        odaKoduKontrol.loading ? 'text-gray-400' :
                        odaKoduKontrol.available ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {odaKoduKontrol.loading ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                            <span>Kontrol ediliyor...</span>
                          </>
                        ) : (
                          <>
                            {odaKoduKontrol.available ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            <span>{odaKoduKontrol.message}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Oda Adı */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Oda Adı *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DoorOpen className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="text"
                        value={formData.oda_adi}
                        onChange={(e) => handleInputChange('oda_adi', e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 bg-gray-900 border ${
                          errors.oda_adi ? 'border-red-500' : 'border-gray-700'
                        } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-white`}
                        placeholder="Ana Depo / Yönetici Odası"
                      />
                    </div>
                    {errors.oda_adi && (
                      <p className="mt-1 text-sm text-red-400">{errors.oda_adi}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Konum ve Kapasite */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-400" />
                  Konum ve Kapasite
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Bina */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bina
                    </label>
                    <input
                      type="text"
                      value={formData.bina}
                      onChange={(e) => handleInputChange('bina', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-white"
                      placeholder="A Blok / Ana Bina"
                    />
                  </div>

                  {/* Kat */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Kat
                    </label>
                    <input
                      type="text"
                      value={formData.kat}
                      onChange={(e) => handleInputChange('kat', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-white"
                      placeholder="1. Kat / Zemin"
                    />
                  </div>

                  {/* Kapasite */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Kapasite *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.kapasite}
                      onChange={(e) => handleInputChange('kapasite', parseInt(e.target.value) || 1)}
                      className={`w-full px-4 py-2.5 bg-gray-900 border ${
                        errors.kapasite ? 'border-red-500' : 'border-gray-700'
                      } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-white`}
                      placeholder="5"
                    />
                    {errors.kapasite && (
                      <p className="mt-1 text-sm text-red-400">{errors.kapasite}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Açıklama */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-yellow-400" />
                  Açıklama
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Oda Açıklaması
                  </label>
                  <textarea
                    value={formData.aciklama}
                    onChange={(e) => handleInputChange('aciklama', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-white h-32 resize-none"
                    placeholder="Odanın kullanım amacı, özellikleri, içindeki ekipmanlar vb..."
                    maxLength={500}
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {formData.aciklama.length}/500 karakter
                  </div>
                </div>
              </div>

              {/* QR Kodu Bölümü */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-purple-400" />
                  QR Kodu Yönetimi
                </h3>
                
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-sm text-gray-400 mb-2">QR Kodu</div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 truncate">
                          {generatedQR || 'QR kodu henüz oluşturulmadı'}
                        </code>
                        {generatedQR && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(generatedQR)}
                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                            title="Kopyala"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={generateQRCode}
                      className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2 whitespace-nowrap"
                    >
                      <QrCode className="h-4 w-4" />
                      {generatedQR ? 'QR Kodu Yenile' : 'QR Kodu Oluştur'}
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    QR kodu, odaya girişlerde kullanılacaktır. Otomatik olarak oluşturulabilir veya manuel girilebilir.
                  </p>
                </div>
              </div>

              {/* Durum Seçeneği */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="aktif"
                  checked={formData.aktif}
                  onChange={(e) => handleInputChange('aktif', e.target.checked)}
                  className="h-5 w-5 rounded border-gray-700 bg-gray-900 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="aktif" className="text-gray-300">
                  Oda aktif (kullanıma açık)
                </label>
              </div>
            </div>

            {/* Form Butonları */}
            <div className="mt-8 pt-6 border-t border-gray-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
                disabled={loading}
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {mode === 'edit' ? 'Güncelle' : 'Oluştur'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
