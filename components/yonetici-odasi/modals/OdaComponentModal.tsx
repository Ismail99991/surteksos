'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Building, 
  Hash, 
  Eye, 
  EyeOff,
  Lock,
  Settings,
  X,
  Save,
  Code,
  FileText,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

const supabase = createClient();

type OdaComponentType = Database['public']['Tables']['odalar_components']['Row'];
type OdaType = Database['public']['Tables']['odalar']['Row'];

interface OdaComponentModalProps {
  mode: 'create' | 'edit';
  component?: OdaComponentType | null;
  odalar: OdaType[];
  onClose: () => void;
  onSuccess: () => void;
}

interface ComponentFormData {
  oda_id: string;
  component_adi: string;
  component_yolu: string;
  sira_no: number;
  aktif: boolean;
  yonetici_gorebilir: boolean;
  gerekli_yetki: string;
  icon_adi: string;
  aciklama: string;
}

export default function OdaComponentModal({ 
  mode, 
  component, 
  odalar, 
  onClose, 
  onSuccess 
}: OdaComponentModalProps) {
  const [formData, setFormData] = useState<ComponentFormData>({
    oda_id: '',
    component_adi: '',
    component_yolu: '',
    sira_no: 0,
    aktif: true,
    yonetici_gorebilir: true,
    gerekli_yetki: '',
    icon_adi: 'Package',
    aciklama: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [componentKontrol, setComponentKontrol] = useState<{
    loading: boolean;
    available: boolean;
    message: string;
  }>({ loading: false, available: false, message: '' });

  // Icon seçenekleri
  const iconOptions = [
    'Package', 'Shield', 'Users', 'Building', 'Key', 'Database',
    'BarChart3', 'FileText', 'PlusCircle', 'UserCheck', 'Edit',
    'Trash2', 'Search', 'Filter', 'Check', 'X', 'QrCode', 'Lock',
    'Unlock', 'DoorOpen', 'MapPin', 'FlaskConical', 'CheckCircle',
    'AlertCircle', 'Clock', 'RefreshCw', 'Settings', 'Cpu', 'Server'
  ];

  // Yetki seçenekleri
  const yetkiOptions = [
    '', 'KARTELA_OLUSTUR', 'KARTELA_SIL', 'RAPOR_GOR',
    'RAF_DUZENLE', 'KULLANICI_YONET', 'SISTEM_YONETICI'
  ];

  // Eğer edit modundaysa, formu component verileriyle doldur
  useEffect(() => {
    if (mode === 'edit' && component) {
      setFormData({
        oda_id: String(component.oda_id) || '',
        component_adi: component.component_adi || '',
        component_yolu: component.component_yolu || '',
        sira_no: component.sira_no || 0,
        aktif: component.aktif || true,
        yonetici_gorebilir: component.yonetici_gorebilir || true,
        gerekli_yetki: component.gerekli_yetki || '',
        icon_adi: component.icon_adi || 'Package',
        aciklama: component.aciklama || ''
      });
    }
  }, [mode, component]);

  // Component adını kontrol et (create modunda)
  useEffect(() => {
    if (mode === 'create' && formData.component_adi.trim() && formData.oda_id) {
      checkComponentAdi();
    }
  }, [formData.component_adi, formData.oda_id, mode]);

  // Component adının müsait olup olmadığını kontrol et
  const checkComponentAdi = async () => {
    if (!formData.component_adi.trim() || !formData.oda_id) return;

    setComponentKontrol({ loading: true, available: false, message: '' });
    
    try {
      const { data, error } = await supabase
        .from('odalar_components')
        .select('component_adi')
        .eq('oda_id', Number(formData.oda_id))
        .eq('component_adi', formData.component_adi.trim())
        .single();

      if (error && error.code === 'PGRST116') {
        // Component adı müsait
        setComponentKontrol({ 
          loading: false, 
          available: true, 
          message: '✓ Component adı müsait' 
        });
      } else if (data) {
        // Component adı zaten var
        setComponentKontrol({ 
          loading: false, 
          available: false, 
          message: '✗ Bu component adı zaten kullanılıyor' 
        });
      }
    } catch (error) {
      console.error('Component adı kontrol hatası:', error);
      setComponentKontrol({ 
        loading: false, 
        available: false, 
        message: 'Kontrol sırasında hata' 
      });
    }
  };

  // Form validasyonu
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.oda_id.trim()) {
      newErrors.oda_id = 'Oda seçimi gereklidir';
    }

    if (!formData.component_adi.trim()) {
      newErrors.component_adi = 'Component adı gereklidir';
    } else if (mode === 'create' && !componentKontrol.available) {
      newErrors.component_adi = 'Component adı müsait değil veya kontrol edilemedi';
    }

    if (!formData.component_yolu.trim()) {
      newErrors.component_yolu = 'Component yolu gereklidir';
    } else if (!formData.component_yolu.startsWith('@/')) {
      newErrors.component_yolu = 'Component yolu @/ ile başlamalı';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Sıra numarası hesapla
  const calculateSiraNo = async (odaId: string): Promise<number> => {
    if (mode === 'edit' && component) {
      return component.sira_no || 0;
    }

    try {
      const { data, error } = await supabase
        .from('odalar_components')
        .select('sira_no')
        .eq('oda_id', Number(odaId))
        .order('sira_no', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      return data && data.length > 0 ? (data[0]?.sira_no || 0) + 1 : 1;
    } catch (error) {
      console.error('Sıra numarası hesaplama hatası:', error);
      return 1;
    }
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
        oda_id: Number(formData.oda_id),
        component_adi: formData.component_adi.trim(),
        component_yolu: formData.component_yolu.trim(),
        sira_no: formData.sira_no || await calculateSiraNo(formData.oda_id)
      };

      if (mode === 'edit' && component) {
        // Güncelleme işlemi
        const { error } = await supabase
          .from('odalar_components')
          .update(submitData)
          .eq('id', component.id);

        if (error) throw error;

        // Sistem logu
        const oda = odalar.find(o => o.id === submitData.oda_id);
        await supabase.from('sistem_loglari').insert([{
          islem_turu: 'ODA_COMPONENT_GUNCELLENDI',
          detay: `${submitData.component_adi} → ${oda?.oda_adi} component'i güncellendi`,
          ip_adresi: '127.0.0.1'
        }]);

      } else {
        // Yeni component oluşturma
        const { error } = await supabase
          .from('odalar_components')
          .insert([submitData]);

        if (error) throw error;

        // Sistem logu
        const oda = odalar.find(o => o.id === submitData.oda_id);
        await supabase.from('sistem_loglari').insert([{
          islem_turu: 'ODA_COMPONENT_OLUSTURULDU',
          detay: `Yeni component: ${submitData.component_adi} → ${oda?.oda_adi}`,
          ip_adresi: '127.0.0.1'
        }]);
      }

      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('Component kaydetme hatası:', error);
      
      // Unique constraint hatası kontrolü
      if (error.code === '23505') {
        setErrors({ component_adi: 'Bu oda için bu component adı zaten kullanılıyor' });
      } else {
        alert('Component kaydedilemedi!');
      }
    } finally {
      setLoading(false);
    }
  };

  // Input değişikliklerini işle
  const handleInputChange = (field: keyof ComponentFormData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Hata mesajını temizle
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Component adı değiştiğinde kontrol et (create modunda)
    if (field === 'component_adi' && mode === 'create') {
      setComponentKontrol({ loading: false, available: false, message: '' });
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
                {mode === 'edit' ? 'Component Düzenle' : 'Yeni Component'}
              </h2>
              <p className="text-gray-400">
                {mode === 'edit' 
                  ? `${component?.component_adi}` 
                  : 'Yeni component bilgilerini girin'}
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
                  <Package className="h-5 w-5 text-purple-400" />
                  Temel Bilgiler
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Oda Seçimi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Oda *
                    </label>
                    <select
                      value={formData.oda_id}
                      onChange={(e) => handleInputChange('oda_id', e.target.value)}
                      className={`w-full px-4 py-2.5 bg-gray-900 border ${
                        errors.oda_id ? 'border-red-500' : 'border-gray-700'
                      } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white`}
                      disabled={mode === 'edit'}
                    >
                      <option value="">Oda seçin</option>
                      {odalar.map(oda => (
                        <option key={oda.id} value={oda.id}>
                          {oda.oda_adi} ({oda.oda_kodu})
                        </option>
                      ))}
                    </select>
                    {errors.oda_id && (
                      <p className="mt-1 text-sm text-red-400">{errors.oda_id}</p>
                    )}
                  </div>

                  {/* Component Adı */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Component Adı *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="text"
                        value={formData.component_adi}
                        onChange={(e) => handleInputChange('component_adi', e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 bg-gray-900 border ${
                          errors.component_adi ? 'border-red-500' : 'border-gray-700'
                        } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white`}
                        placeholder="KartelaOdaDashboard"
                        disabled={mode === 'edit'}
                      />
                    </div>
                    {errors.component_adi && (
                      <p className="mt-1 text-sm text-red-400">{errors.component_adi}</p>
                    )}
                    
                    {/* Component adı kontrol durumu */}
                    {mode === 'create' && formData.component_adi && (
                      <div className={`mt-1 text-xs flex items-center gap-1 ${
                        componentKontrol.loading ? 'text-gray-400' :
                        componentKontrol.available ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {componentKontrol.loading ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                            <span>Kontrol ediliyor...</span>
                          </>
                        ) : (
                          <>
                            {componentKontrol.available ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            <span>{componentKontrol.message}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  {/* Component Yolu */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Component Yolu *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Code className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="text"
                        value={formData.component_yolu}
                        onChange={(e) => handleInputChange('component_yolu', e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 bg-gray-900 border ${
                          errors.component_yolu ? 'border-red-500' : 'border-gray-700'
                        } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white`}
                        placeholder="@/components/kartela-odasi/KartelaOdaDashboard"
                      />
                    </div>
                    {errors.component_yolu && (
                      <p className="mt-1 text-sm text-red-400">{errors.component_yolu}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {"Component'in import yolu (örn: @/components/...)"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ayarlar */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-400" />
                  Ayarlar
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Icon */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Icon
                    </label>
                    <select
                      value={formData.icon_adi}
                      onChange={(e) => handleInputChange('icon_adi', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white"
                    >
                      {iconOptions.map(icon => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Gerekli Yetki */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Gerekli Yetki
                    </label>
                    <select
                      value={formData.gerekli_yetki}
                      onChange={(e) => handleInputChange('gerekli_yetki', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white"
                    >
                      {yetkiOptions.map(yetki => (
                        <option key={yetki} value={yetki}>
                          {yetki || 'Yetki gerekmez'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sıra Numarası */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sıra Numarası
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleInputChange('sira_no', Math.max(0, formData.sira_no - 1))}
                        className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.sira_no}
                        onChange={(e) => handleInputChange('sira_no', parseInt(e.target.value) || 0)}
                        className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white text-center"
                      />
                      <button
                        type="button"
                        onClick={() => handleInputChange('sira_no', formData.sira_no + 1)}
                        className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Düşük sayı önce gösterilir
                    </p>
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
                    Component Açıklaması
                  </label>
                  <textarea
                    value={formData.aciklama}
                    onChange={(e) => handleInputChange('aciklama', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white h-32 resize-none"
                    placeholder="Component'in amacı, kullanımı, özellikleri..."
                    maxLength={500}
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {formData.aciklama.length}/500 karakter
                  </div>
                </div>
              </div>

              {/* Durum Seçenekleri */}
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Durum ve Görünürlük</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                    <div className={`p-2 rounded-lg ${formData.aktif ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                      {formData.aktif ? (
                        <Eye className="h-5 w-5 text-green-400" />
                      ) : (
                        <EyeOff className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-300">Component Aktif</div>
                      <div className="text-sm text-gray-400">{"Kullanıcılar bu component'i görebilir"}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.aktif}
                      onChange={(e) => handleInputChange('aktif', e.target.checked)}
                      className="h-5 w-5 rounded border-gray-700 bg-gray-900 text-green-600 focus:ring-green-500"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                    <div className={`p-2 rounded-lg ${formData.yonetici_gorebilir ? 'bg-blue-500/20' : 'bg-gray-700'}`}>
                      {formData.yonetici_gorebilir ? (
                        <Eye className="h-5 w-5 text-blue-400" />
                      ) : (
                        <EyeOff className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-300">Yönetici Görebilir</div>
                      <div className="text-sm text-gray-400">Yönetici panelinde görünsün</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.yonetici_gorebilir}
                      onChange={(e) => handleInputChange('yonetici_gorebilir', e.target.checked)}
                      className="h-5 w-5 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {formData.gerekli_yetki && (
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-yellow-400" />
                      <div>
                        <div className="font-medium text-yellow-300">Yetki Gereklidir</div>
                        <div className="text-sm text-yellow-400">
                          Bu component için <code className="bg-yellow-500/20 px-2 py-1 rounded">{formData.gerekli_yetki}</code> yetkisi gerekli
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
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
