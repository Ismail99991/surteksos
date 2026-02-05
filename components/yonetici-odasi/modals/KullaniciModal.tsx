'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Shield, 
  Key, 
  X,
  Save,
  QrCode,
  Copy
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

const supabase = createClient();

type KullaniciType = Database['public']['Tables']['kullanicilar']['Row'];

interface KullaniciModalProps {
  mode: 'create' | 'edit';
  kullanici?: KullaniciType | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface KullaniciFormData {
  kullanici_kodu: string;
  ad: string;
  soyad: string;
  email: string;
  telefon: string;
  unvan: string;
  departman: string;
  sifre_hash: string;
  qr_kodu: string;
  aktif: boolean;
  sistem_yoneticisi: boolean;
}

export default function KullaniciModal({ 
  mode, 
  kullanici, 
  onClose, 
  onSuccess 
}: KullaniciModalProps) {
  const [formData, setFormData] = useState<KullaniciFormData>({
    kullanici_kodu: '',
    ad: '',
    soyad: '',
    email: '',
    telefon: '',
    unvan: '',
    departman: '',
    sifre_hash: 'default123',
    qr_kodu: '',
    aktif: true,
    sistem_yoneticisi: false
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatedQR, setGeneratedQR] = useState<string>('');

  // Eğer edit modundaysa, formu kullanıcı verileriyle doldur
  useEffect(() => {
    if (mode === 'edit' && kullanici) {
      setFormData({
        kullanici_kodu: kullanici.kullanici_kodu || '',
        ad: kullanici.ad || '',
        soyad: kullanici.soyad || '',
        email: kullanici.email || '',
        telefon: kullanici.telefon || '',
        unvan: kullanici.unvan || '',
        departman: kullanici.departman || '',
        sifre_hash: kullanici.sifre_hash || 'default123',
        qr_kodu: kullanici.qr_kodu || '',
        aktif: kullanici.aktif || true,
        sistem_yoneticisi: kullanici.sistem_yoneticisi || false
      });
      
      if (kullanici.qr_kodu) {
        setGeneratedQR(kullanici.qr_kodu);
      }
    }
  }, [mode, kullanici]);

  // Form validasyonu
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.kullanici_kodu.trim()) {
      newErrors.kullanici_kodu = 'Kullanıcı kodu gereklidir';
    }

    if (!formData.ad.trim()) {
      newErrors.ad = 'Ad gereklidir';
    }

    if (!formData.soyad.trim()) {
      newErrors.soyad = 'Soyad gereklidir';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir email adresi girin';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // QR kodu oluştur
  const generateQRCode = () => {
    if (!formData.kullanici_kodu) {
      alert('Önce kullanıcı kodunu girin!');
      return;
    }

    const timestamp = Date.now();
    const qrText = `USER-${formData.kullanici_kodu}-${timestamp}`;
    setGeneratedQR(qrText);
    setFormData(prev => ({ ...prev, qr_kodu: qrText }));
  };

  // Kopyala butonu
  const copyToClipboard = (text: string) => {
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
      if (mode === 'edit' && kullanici) {
        // Güncelleme işlemi
        const { error } = await supabase
          .from('kullanicilar')
          .update(formData)
          .eq('id', kullanici.id);

        if (error) throw error;

        // Sistem logu
        await supabase.from('sistem_loglari').insert([{
          islem_turu: 'KULLANICI_GUNCELLENDI',
          detay: `${formData.ad} ${formData.soyad} kullanıcısı güncellendi`,
          ip_adresi: '127.0.0.1'
        }]);

      } else {
        // Yeni kullanıcı oluşturma
        const { error } = await supabase
          .from('kullanicilar')
          .insert([formData]);

        if (error) throw error;

        // Sistem logu
        await supabase.from('sistem_loglari').insert([{
          islem_turu: 'KULLANICI_OLUSTURULDU',
          detay: `Yeni kullanıcı: ${formData.ad} ${formData.soyad}`,
          ip_adresi: '127.0.0.1'
        }]);
      }

      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('Kullanıcı kaydetme hatası:', error);
      
      // Unique constraint hatası kontrolü
      if (error.code === '23505') {
        if (error.message.includes('kullanici_kodu')) {
          setErrors({ kullanici_kodu: 'Bu kullanıcı kodu zaten kullanılıyor' });
        } else if (error.message.includes('email')) {
          setErrors({ email: 'Bu email adresi zaten kullanılıyor' });
        } else {
          alert('Kayıt sırasında bir hata oluştu: ' + error.message);
        }
      } else {
        alert('Kullanıcı kaydedilemedi!');
      }
    } finally {
      setLoading(false);
    }
  };

  // Input değişikliklerini işle
  const handleInputChange = (field: keyof KullaniciFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Hata mesajını temizle
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
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
                {mode === 'edit' ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
              </h2>
              <p className="text-gray-400">
                {mode === 'edit' 
                  ? `${kullanici?.ad} ${kullanici?.soyad}` 
                  : 'Yeni kullanıcı bilgilerini girin'}
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
                  <User className="h-5 w-5 text-blue-400" />
                  Temel Bilgiler
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Kullanıcı Kodu */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Kullanıcı Kodu *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="text"
                        value={formData.kullanici_kodu}
                        onChange={(e) => handleInputChange('kullanici_kodu', e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 bg-gray-900 border ${
                          errors.kullanici_kodu ? 'border-red-500' : 'border-gray-700'
                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white`}
                        placeholder="ADMIN001"
                      />
                    </div>
                    {errors.kullanici_kodu && (
                      <p className="mt-1 text-sm text-red-400">{errors.kullanici_kodu}</p>
                    )}
                  </div>

                  {/* Unvan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Unvan
                    </label>
                    <input
                      type="text"
                      value={formData.unvan}
                      onChange={(e) => handleInputChange('unvan', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white"
                      placeholder="Sistem Yöneticisi"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {/* Ad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Ad *
                    </label>
                    <input
                      type="text"
                      value={formData.ad}
                      onChange={(e) => handleInputChange('ad', e.target.value)}
                      className={`w-full px-4 py-2.5 bg-gray-900 border ${
                        errors.ad ? 'border-red-500' : 'border-gray-700'
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white`}
                      placeholder="Ahmet"
                    />
                    {errors.ad && (
                      <p className="mt-1 text-sm text-red-400">{errors.ad}</p>
                    )}
                  </div>

                  {/* Soyad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Soyad *
                    </label>
                    <input
                      type="text"
                      value={formData.soyad}
                      onChange={(e) => handleInputChange('soyad', e.target.value)}
                      className={`w-full px-4 py-2.5 bg-gray-900 border ${
                        errors.soyad ? 'border-red-500' : 'border-gray-700'
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white`}
                      placeholder="Yılmaz"
                    />
                    {errors.soyad && (
                      <p className="mt-1 text-sm text-red-400">{errors.soyad}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* İletişim Bilgileri */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-green-400" />
                  İletişim Bilgileri
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 bg-gray-900 border ${
                          errors.email ? 'border-red-500' : 'border-gray-700'
                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white`}
                        placeholder="ornek@firma.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                    )}
                  </div>

                  {/* Telefon */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Telefon
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="tel"
                        value={formData.telefon}
                        onChange={(e) => handleInputChange('telefon', e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white"
                        placeholder="555 123 4567"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Departman ve Yetkiler */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Building className="h-5 w-5 text-yellow-400" />
                  Departman ve Yetkiler
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Departman */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Departman
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="text"
                        value={formData.departman}
                        onChange={(e) => handleInputChange('departman', e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white"
                        placeholder="IT / Muhasebe / Satış"
                      />
                    </div>
                  </div>
                </div>

                {/* Durum ve Yetki Seçenekleri */}
                <div className="flex flex-wrap gap-6 mt-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="aktif"
                      checked={formData.aktif}
                      onChange={(e) => handleInputChange('aktif', e.target.checked)}
                      className="h-5 w-5 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="aktif" className="text-gray-300">
                      Kullanıcı aktif
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="sistem_yoneticisi"
                      checked={formData.sistem_yoneticisi}
                      onChange={(e) => handleInputChange('sistem_yoneticisi', e.target.checked)}
                      className="h-5 w-5 rounded border-gray-700 bg-gray-900 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="sistem_yoneticisi" className="text-gray-300 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-400" />
                      Sistem yöneticisi
                    </label>
                  </div>
                </div>
              </div>

              {/* QR Kodu Bölümü */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-green-400" />
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
                      className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2 whitespace-nowrap"
                    >
                      <QrCode className="h-4 w-4" />
                      {generatedQR ? 'QR Kodu Yenile' : 'QR Kodu Oluştur'}
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    QR kodu, kullanıcının oda girişlerinde kullanılacaktır.
                  </p>
                </div>
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
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
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
