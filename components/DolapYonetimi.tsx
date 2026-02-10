// components/DolapYonetimi.tsx - %100 VERİTABANI UYUMLU
'use client';

import { useState, useEffect } from 'react';
import { 
  Package, Grid, Layers, Building, Search, 
  Plus, Edit, Trash2, Eye, RefreshCw,
  Settings, X, AlertTriangle, Lock, QrCode,
  Users, BarChart3, Download, Filter
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import { toast } from 'sonner';

const supabase = createClient();

// VERİTABANI TİPLERİ - Tam şemaya uygun
type DolapType = Database['public']['Tables']['dolaplar']['Row'];
type RafType = Database['public']['Tables']['raflar']['Row'];
type OdaType = Database['public']['Tables']['odalar']['Row'];
type HucreType = Database['public']['Tables']['hucreler']['Row'];
type KartelaType = Database['public']['Tables']['kartelalar']['Row'];

interface DolapYonetimiProps {
  isAdmin?: boolean;
}

export default function DolapYonetimi({ isAdmin = true }: DolapYonetimiProps) {
  // STATE'LER
  const [dolaplar, setDolaplar] = useState<DolapType[]>([]);
  const [raflar, setRaflar] = useState<RafType[]>([]);
  const [hucreler, setHucreler] = useState<HucreType[]>([]);
  const [odalar, setOdalar] = useState<OdaType[]>([]);
  const [kartelalar, setKartelalar] = useState<KartelaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // FILTRE STATE'LERİ
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOdaId, setSelectedOdaId] = useState<number | 'all'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // MODAL STATE'LERİ
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<DolapType | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<DolapType | null>(null);
  const [selectedDolap, setSelectedDolap] = useState<DolapType | null>(null);
  
  // FORMLAR - Tam şemaya uygun
  const [createForm, setCreateForm] = useState({
    dolap_kodu: '',
    dolap_adi: '',
    oda_id: '',
    raf_sayisi: 5, // Sizin 5 raflı dolabınız için
    hucre_sayisi_raf: 18, // Sizin 18'er hücreli dolabınız için
    kapasite_hucre: 50,
    aktif: true,
    aciklama: ''
  });

  // VERİ YÜKLEME - Tüm tablolar
  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Tüm gerekli verileri paralel olarak yükle
      const [dolaplarRes, odalarRes] = await Promise.all([
        supabase.from('dolaplar').select('*').order('dolap_kodu'),
        supabase.from('odalar').select('*').eq('aktif', true).order('oda_adi')
      ]);

      if (dolaplarRes.error) throw dolaplarRes.error;
      if (odalarRes.error) throw odalarRes.error;

      setDolaplar(dolaplarRes.data || []);
      setOdalar(odalarRes.data || []);

    } catch (error: any) {
      console.error('Veri yükleme hatası:', error);
      setError('Veriler yüklenemedi: ' + error.message);
      toast.error('Veri yükleme hatası');
    } finally {
      setLoading(false);
    }
  };

  // SEÇİLİ DOLAP İÇİN RAF VE HÜCRE YÜKLEME
  const loadRaflarForDolap = async (dolapId: number) => {
    const { data, error } = await supabase
      .from('raflar')
      .select('*')
      .eq('dolap_id', dolapId)
      .order('raf_kodu');
    
    if (error) {
      console.error('Raflar yükleme hatası:', error);
      toast.error('Raflar yüklenemedi');
      return;
    }
    
    setRaflar(data || []);
  };

  const loadHucrelerForDolap = async (dolapId: number) => {
    const { data, error } = await supabase
      .from('hucreler')
      .select('*')
      .eq('dolap_id', dolapId)
      .order('hucre_kodu');
    
    if (error) {
      console.error('Hücreler yükleme hatası:', error);
      toast.error('Hücreler yüklenemedi');
      return;
    }
    
    setHucreler(data || []);
  };

  const loadKartelalarForDolap = async (dolapId: number) => {
    // Önce dolaba ait hücreleri bul
    const { data: hucreData, error: hucreError } = await supabase
      .from('hucreler')
      .select('id')
      .eq('dolap_id', dolapId);
    
    if (hucreError || !hucreData) return;
    
    const hucreIds = hucreData.map(h => h.id);
    
    // Hücrelerdeki kartelaları getir
    if (hucreIds.length > 0) {
      const { data, error } = await supabase
        .from('kartelalar')
        .select('*')
        .in('hucre_id', hucreIds)
        .eq('silindi', false)
        .order('kartela_no');
      
      if (error) {
        console.error('Kartelalar yükleme hatası:', error);
        return;
      }
      
      setKartelalar(data || []);
    }
  };

  // İSTATİSTİKLER HESAPLAMA
  const calculateStats = () => {
    return {
      toplamDolap: dolaplar.length,
      aktifDolap: dolaplar.filter(d => d.aktif).length,
      toplamKapasite: dolaplar.reduce((sum, dolap) => sum + (dolap.toplam_kapasite || 0), 0),
      kullanilanKapasite: dolaplar.reduce((sum, dolap) => sum + (dolap.mevcut_kartela_sayisi || 0), 0),
      ortalamaDoluluk: dolaplar.length > 0 
        ? dolaplar.reduce((sum, dolap) => sum + (dolap.doluluk_orani || 0), 0) / dolaplar.length 
        : 0
    };
  };

  // FİLTRELENMİŞ DOLAplar
  const filteredDolaplar = dolaplar.filter(dolap => {
    // Oda filtresi
    if (selectedOdaId !== 'all' && dolap.oda_id !== selectedOdaId) {
      return false;
    }

    // Aktif/pasif filtresi
    if (activeFilter === 'active' && !dolap.aktif) return false;
    if (activeFilter === 'inactive' && dolap.aktif) return false;

    // Arama sorgusu
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      const oda = odalar.find(o => o.id === dolap.oda_id);
      const matchesSearch = 
        (dolap.dolap_kodu || '').toLowerCase().includes(queryLower) ||
        (dolap.dolap_adi || '').toLowerCase().includes(queryLower) ||
        (oda?.oda_adi || '').toLowerCase().includes(queryLower) ||
        (oda?.oda_kodu || '').toLowerCase().includes(queryLower);

      if (!matchesSearch) return false;
    }

    return true;
  });

  // DOLAP OLUŞTURMA - Tam şemaya uygun
  const handleCreateDolap = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Hesaplamalar
      const toplam_hucre = createForm.raf_sayisi * createForm.hucre_sayisi_raf;
      const toplam_kapasite = toplam_hucre * createForm.kapasite_hucre;
      
      // Dolap oluştur
      const { data: dolap, error: dolapError } = await supabase
        .from('dolaplar')
        .insert([{
          dolap_kodu: createForm.dolap_kodu.trim().toUpperCase(),
          dolap_adi: createForm.dolap_adi.trim(),
          oda_id: createForm.oda_id ? parseInt(createForm.oda_id) : null,
          raf_sayisi: createForm.raf_sayisi,
          hucre_sayisi_raf: createForm.hucre_sayisi_raf,
          kapasite_hucre: createForm.kapasite_hucre,
          toplam_hucre: toplam_hucre,
          toplam_kapasite: toplam_kapasite,
          mevcut_kartela_sayisi: 0,
          doluluk_orani: 0,
          aktif: createForm.aktif,
          qr_kodu: null, // QR kodu sonradan oluşturulabilir
          aciklama: createForm.aciklama.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (dolapError) throw dolapError;

      toast.success('✅ Dolap başarıyla oluşturuldu!');
      
      // Formu sıfırla
      setCreateForm({
        dolap_kodu: '',
        dolap_adi: '',
        oda_id: '',
        raf_sayisi: 5,
        hucre_sayisi_raf: 18,
        kapasite_hucre: 50,
        aktif: true,
        aciklama: ''
      });
      
      setShowCreateModal(false);
      await loadAllData(); // Listeyi yenile

    } catch (error: any) {
      console.error('Dolap oluşturma hatası:', error);
      
      // Özel hata mesajları
      if (error.code === '23505') {
        toast.error('❌ Bu dolap kodu zaten kullanılıyor!');
      } else if (error.code === '23503') {
        toast.error('❌ Seçilen oda bulunamadı!');
      } else {
        toast.error('❌ Dolap oluşturulamadı: ' + error.message);
      }
    }
  };

  // DOLAP GÜNCELLEME
  const handleUpdateDolap = async (dolapId: number, updates: Partial<DolapType>) => {
    try {
      const { error } = await supabase
        .from('dolaplar')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', dolapId);

      if (error) throw error;

      toast.success('✅ Dolap güncellendi!');
      loadAllData();

    } catch (error: any) {
      console.error('Dolap güncelleme hatası:', error);
      toast.error('❌ Dolap güncellenemedi: ' + error.message);
      throw error;
    }
  };

  // DOLAP PASİF YAPMA (SİLME)
  const handleDeleteDolap = async (dolapId: number) => {
    try {
      // Önce dolabın boş olup olmadığını kontrol et
      const { data: dolap, error: dolapError } = await supabase
        .from('dolaplar')
        .select('mevcut_kartela_sayisi')
        .eq('id', dolapId)
        .single();
      
      if (dolapError) throw dolapError;
      
      if ((dolap.mevcut_kartela_sayisi || 0) > 0){
        toast.error('❌ Bu dolapta kartela bulunuyor! Önce kartelaları boşaltın.');
        return;
      }
      
      // Dolabı pasif yap
      const { error } = await supabase
        .from('dolaplar')
        .update({ 
          aktif: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', dolapId);

      if (error) throw error;

      toast.success('✅ Dolap pasif yapıldı!');
      loadAllData();

    } catch (error: any) {
      console.error('Dolap pasif yapma hatası:', error);
      toast.error('❌ Dolap pasif yapılamadı: ' + error.message);
      throw error;
    }
  };

  // DETAY GÖRÜNTÜLEME
  const handleViewDetails = async (dolap: DolapType) => {
    setSelectedDolap(dolap);
    await Promise.all([
      loadRaflarForDolap(dolap.id),
      loadHucrelerForDolap(dolap.id),
      loadKartelalarForDolap(dolap.id)
    ]);
  };

  // VERİYİ EXCEL OLARAK İNDİR
  const handleExportToExcel = () => {
    const data = filteredDolaplar.map(dolap => {
      const oda = odalar.find(o => o.id === dolap.oda_id);
      return {
        'Dolap Kodu': dolap.dolap_kodu,
        'Dolap Adı': dolap.dolap_adi,
        'Oda': oda ? `${oda.oda_kodu} - ${oda.oda_adi}` : 'Belirtilmemiş',
        'Raf Sayısı': dolap.raf_sayisi,
        'Hücre/Raf': dolap.hucre_sayisi_raf,
        'Toplam Hücre': dolap.toplam_hucre,
        'Kapasite/Hücre': dolap.kapasite_hucre,
        'Toplam Kapasite': dolap.toplam_kapasite,
        'Mevcut Kartela': dolap.mevcut_kartela_sayisi,
        'Doluluk Oranı': dolap.doluluk_orani ? `${dolap.doluluk_orani}%` : '0%',
        'Durum': dolap.aktif ? 'Aktif' : 'Pasif',
        'Oluşturulma Tarihi': dolap.created_at ? new Date(dolap.created_at).toLocaleDateString('tr-TR') : '-',
        'Açıklama': dolap.aciklama || '-'
      };
    });
    
    // Excel export işlemi
    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(value => 
        `"${String(value).replace(/"/g, '""')}"`
      ).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dolaplar_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('📊 Dolaplar excel olarak indiriliyor...');
  };

  // İLK YÜKLEME
  useEffect(() => {
    loadAllData();
  }, []);

  // YÜKLENİYOR DURUMU
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">Dolaplar yükleniyor...</p>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* ADMIN HEADER */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-red-100 rounded-lg">
                <Lock className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Dolap Yönetim Paneli</h2>
                <p className="text-gray-300">Tam yetkili dolap, raf ve hücre yönetimi</p>
              </div>
            </div>
            
            {/* ADMIN UYARISI */}
            <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg max-w-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-red-300 text-sm font-medium">YÖNETİCİ MODU</span>
              </div>
              <p className="text-red-200 text-xs mt-1">
                Bu panelde yapacağınız değişiklikler tüm sistem etkiler. Dikkatli olun!
              </p>
            </div>
          </div>
          
          {/* ADMIN ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-3 transition-all"
            >
              <Plus className="h-5 w-5" />
              Yeni Dolap Oluştur
            </button>
            <button
              onClick={loadAllData}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-3 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Verileri Yenile
            </button>
            <button
              onClick={handleExportToExcel}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-3 transition-colors"
            >
              <Download className="h-4 w-4" />
              Excel İndir
            </button>
          </div>
        </div>

        {/* İSTATİSTİKLER */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="text-gray-400 text-sm">Toplam Dolap</div>
            <div className="text-2xl font-bold text-white">{stats.toplamDolap}</div>
            <div className="text-xs text-gray-500 mt-1">Sistemdeki toplam dolap</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="text-gray-400 text-sm">Aktif Dolap</div>
            <div className="text-2xl font-bold text-green-400">{stats.aktifDolap}</div>
            <div className="text-xs text-gray-500 mt-1">Kullanımda olan dolaplar</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="text-gray-400 text-sm">Toplam Kapasite</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.toplamKapasite.toLocaleString('tr-TR')}</div>
            <div className="text-xs text-gray-500 mt-1">Kartela kapasitesi</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="text-gray-400 text-sm">Ort. Doluluk</div>
            <div className="text-2xl font-bold text-blue-400">{stats.ortalamaDoluluk.toFixed(1)}%</div>
            <div className="text-xs text-gray-500 mt-1">Ortalama doluluk oranı</div>
          </div>
        </div>
      </div>
      
      {/* ADMIN TOOLBAR */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="Dolap kodu, adı veya oda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedOdaId}
              onChange={(e) => setSelectedOdaId(
                e.target.value === 'all' ? 'all' : parseInt(e.target.value)
              )}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">Tüm Odalar</option>
              {odalar.map(oda => (
                <option key={oda.id} value={oda.id}>
                  {oda.oda_kodu} - {oda.oda_adi}
                </option>
              ))}
            </select>
            
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as any)}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
            </select>
            
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedOdaId('all');
                setActiveFilter('all');
              }}
              className="px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm transition-colors"
            >
              <Filter className="h-4 w-4 inline mr-2" />
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </div>

      {/* HATA MESAJI */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-red-300 font-medium">Hata</p>
              <p className="text-red-200 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto p-1 hover:bg-red-900/30 rounded"
            >
              <X className="h-4 w-4 text-red-400" />
            </button>
          </div>
        </div>
      )}

      {/* DOLAP LİSTESİ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDolaplar.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-gray-800/50 rounded-xl border border-gray-700">
            <Package className="h-16 w-16 mx-auto text-gray-700 mb-4" />
            <p className="text-gray-400 text-lg mb-2">Dolap bulunamadı</p>
            <p className="text-gray-500 text-sm mb-4">
              Arama kriterlerinize uygun dolap bulunamadı
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              İlk Dolabı Oluştur
            </button>
          </div>
        ) : (
          filteredDolaplar.map(dolap => {
            const oda = odalar.find(o => o.id === dolap.oda_id);
            const dolulukYuzde = dolap.doluluk_orani || 0;
            
            return (
              <div key={dolap.id} className="bg-gray-800 rounded-xl border border-gray-700 p-5 hover:border-yellow-500 transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Package className={`h-5 w-5 ${dolap.aktif ? 'text-yellow-400' : 'text-gray-500'}`} />
                      <h3 className="text-lg font-bold text-white">{dolap.dolap_kodu}</h3>
                      {!dolap.aktif && (
                        <span className="px-2 py-1 bg-red-900/30 text-red-300 text-xs rounded">PASİF</span>
                      )}
                    </div>
                    <p className="text-gray-300">{dolap.dolap_adi}</p>
                    {oda && (
                      <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                        <Building className="h-3 w-3" />
                        <span>{oda.oda_kodu} - {oda.oda_adi}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* ADMIN ACTION MENU */}
                  <div className="relative">
                    <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                      <Settings className="h-5 w-5 text-gray-400 group-hover:text-white" />
                    </button>
                    
                    <div className="absolute right-0 top-full mt-1 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <button 
                        onClick={() => handleViewDetails(dolap)}
                        className="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-800 flex items-center gap-3 rounded-t-lg"
                      >
                        <Eye className="h-4 w-4" />
                        Detayları Gör
                      </button>
                      <button 
                        onClick={() => setShowEditModal(dolap)}
                        className="w-full px-4 py-3 text-left text-blue-400 hover:bg-blue-900/20 flex items-center gap-3"
                      >
                        <Edit className="h-4 w-4" />
                        Düzenle
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(dolap)}
                        className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-900/20 flex items-center gap-3 rounded-b-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                        Pasif Yap
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* DOLAP DETAYLARI */}
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="bg-gray-900 rounded p-2 border border-gray-800">
                    <div className="text-gray-400">Raflar</div>
                    <div className="text-white font-semibold">
                      {dolap.raf_sayisi} × {dolap.hucre_sayisi_raf} hücre
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded p-2 border border-gray-800">
                    <div className="text-gray-400">Kapasite</div>
                    <div className="text-white font-semibold">
                      {dolap.mevcut_kartela_sayisi}/{dolap.toplam_kapasite}
                    </div>
                  </div>
                </div>
                
                {/* DOLULUK BAR */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Doluluk</span>
                    <span>{dolulukYuzde.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        dolulukYuzde > 80 ? 'bg-red-500' :
                        dolulukYuzde > 60 ? 'bg-orange-500' :
                        dolulukYuzde > 30 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${dolulukYuzde}%` }}
                    />
                  </div>
                </div>
                
                {/* DETAY BUTONU */}
                <button
                  onClick={() => handleViewDetails(dolap)}
                  className="w-full mt-4 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  Detayları Görüntüle
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* DETAY GÖRÜNÜMÜ (seçili dolap için) */}
      {selectedDolap && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">
                {selectedDolap.dolap_kodu} - Detaylı Görünüm
              </h3>
              <p className="text-gray-400 text-sm">{selectedDolap.dolap_adi}</p>
            </div>
            <button
              onClick={() => setSelectedDolap(null)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
          
          {/* DOLAP BİLGİLERİ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3">Dolap Bilgileri</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Dolap Kodu:</span>
                  <span className="text-white font-mono">{selectedDolap.dolap_kodu}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Raflar:</span>
                  <span className="text-white">{selectedDolap.raf_sayisi} adet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Hücre/Raf:</span>
                  <span className="text-white">{selectedDolap.hucre_sayisi_raf} adet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Toplam Hücre:</span>
                  <span className="text-white">{selectedDolap.toplam_hucre} adet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Durum:</span>
                  <span className={`font-medium ${selectedDolap.aktif ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedDolap.aktif ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3">Kapasite Bilgileri</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Kapasite/Hücre:</span>
                  <span className="text-white">{selectedDolap.kapasite_hucre} kartela</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Toplam Kapasite:</span>
                  <span className="text-white">{selectedDolap.toplam_kapasite?.toLocaleString('tr-TR')} kartela</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mevcut Kartela:</span>
                  <span className="text-white">{selectedDolap.mevcut_kartela_sayisi} adet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Doluluk Oranı:</span>
                  <span className="text-white">{selectedDolap.doluluk_orani?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Oluşturulma Tarihi:</span>
                  <span className="text-white text-sm">
                    {selectedDolap.created_at ? new Date(selectedDolap.created_at).toLocaleDateString('tr-TR') : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* RAF LİSTESİ */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-400" />
              Raflar ({raflar.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {raflar.length === 0 ? (
                <div className="col-span-full text-center py-8 bg-gray-900/30 rounded-lg">
                  <p className="text-gray-400">Bu dolapta raf bulunmuyor</p>
                </div>
              ) : (
                raflar.map(raf => (
                  <div key={raf.id} className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-blue-500 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-white">{raf.raf_kodu}</div>
                        <div className="text-sm text-gray-400">{raf.raf_adi}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Renk No: {raf.renk_no_baslangic} - {raf.renk_no_bitis}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-green-400">
                          {raf.mevcut_kartela_sayisi || 0}/{raf.kapasite || 0}
                        </div>
                        <div className="text-xs text-gray-500">kartela</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-800">
                      <div className="text-xs">
                        <span className={`px-2 py-1 rounded ${raf.aktif ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                          {raf.aktif ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {raf.hucre_sayisi || 0} hücre
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* HÜCRE LİSTESİ */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Grid className="h-5 w-5 text-green-400" />
              Hücreler ({hucreler.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {hucreler.length === 0 ? (
                <div className="col-span-full text-center py-8 bg-gray-900/30 rounded-lg">
                  <p className="text-gray-400">Bu dolapta hücre bulunmuyor</p>
                </div>
              ) : (
                hucreler.slice(0, 24).map(hucre => {
                  const raf = raflar.find(r => r.id === hucre.raf_id);
                  const dolulukYuzde = hucre.kapasite ? ((hucre.mevcut_kartela_sayisi || 0) / hucre.kapasite) * 100 : 0;
                  
                  return (
                    <div key={hucre.id} className="bg-gray-900 rounded-lg p-3 text-center border border-gray-800 hover:border-green-500 transition-colors">
                      <div className="font-mono text-sm text-white mb-1">{hucre.hucre_kodu}</div>
                      {raf && (
                        <div className="text-xs text-gray-500 mb-1">Raf: {raf.raf_kodu}</div>
                      )}
                      <div className="text-xs text-gray-400 mb-1">
                        {hucre.mevcut_kartela_sayisi || 0}/{hucre.kapasite || 0}
                      </div>
                      <div className={`text-xs ${hucre.aktif ? 'text-green-400' : 'text-red-400'}`}>
                        {hucre.aktif ? '✓' : '✗'}
                      </div>
                      <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${dolulukYuzde > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(dolulukYuzde, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {hucreler.length > 24 && (
              <div className="mt-4 text-center text-gray-500 text-sm">
                + {hucreler.length - 24} hücre daha...
              </div>
            )}
          </div>
          
          {/* KARTELA LİSTESİ */}
          {kartelalar.length > 0 && (
            <div className="mt-8">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-400" />
                Kartelalar ({kartelalar.length})
              </h4>
              <div className="bg-gray-900/30 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {kartelalar.slice(0, 6).map(kartela => (
                    <div key={kartela.id} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                      <div className="font-mono text-sm text-white mb-1">{kartela.kartela_no}</div>
                      <div className="text-xs text-gray-400 mb-1">{kartela.renk_kodu} - {kartela.renk_adi}</div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Göz: {kartela.goz_sayisi}/{kartela.maksimum_goz}</span>
                        <span className={`${
                          kartela.durum === 'AKTIF' ? 'text-green-400' :
                          kartela.durum === 'DOLU' ? 'text-red-400' :
                          'text-yellow-400'
                        }`}>
                          {kartela.durum}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {kartelalar.length > 6 && (
                  <div className="mt-3 text-center text-gray-500 text-sm">
                    + {kartelalar.length - 6} kartela daha...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* YENİ DOLAP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Yeni Dolap Oluştur</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleCreateDolap} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Dolap Kodu *</label>
                <input
                  type="text"
                  value={createForm.dolap_kodu}
                  onChange={(e) => setCreateForm({...createForm, dolap_kodu: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Örnek: DOLAP-A, D001"
                  required
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">Benzersiz bir dolap kodu girin (max 50 karakter)</p>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-2">Dolap Adı *</label>
                <input
                  type="text"
                  value={createForm.dolap_adi}
                  onChange={(e) => setCreateForm({...createForm, dolap_adi: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Örnek: Ana Dolap 1"
                  required
                  maxLength={100}
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-2">Oda</label>
                <select
                  value={createForm.oda_id}
                  onChange={(e) => setCreateForm({...createForm, oda_id: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Oda Seçiniz (opsiyonel)</option>
                  {odalar.map(oda => (
                    <option key={oda.id} value={oda.id}>
                      {oda.oda_kodu} - {oda.oda_adi}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Raf Sayısı</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={createForm.raf_sayisi}
                    onChange={(e) => setCreateForm({...createForm, raf_sayisi: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Hücre/Raf</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={createForm.hucre_sayisi_raf}
                    onChange={(e) => setCreateForm({...createForm, hucre_sayisi_raf: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Kapasite/Hücre</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={createForm.kapasite_hucre}
                    onChange={(e) => setCreateForm({...createForm, kapasite_hucre: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-2">Açıklama</label>
                <textarea
                  value={createForm.aciklama}
                  onChange={(e) => setCreateForm({...createForm, aciklama: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[80px]"
                  placeholder="Dolap hakkında notlar..."
                  maxLength={500}
                />
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
                <input
                  type="checkbox"
                  checked={createForm.aktif}
                  onChange={(e) => setCreateForm({...createForm, aktif: e.target.checked})}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 focus:ring-2"
                />
                <div>
                  <label className="text-gray-300 text-sm">Aktif</label>
                  <p className="text-xs text-gray-500">Dolap kullanıma açık olsun</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-700 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Oluştur
                </button>
              </div>
              
              <div className="text-center text-xs text-gray-500 pt-2">
                <p>Toplam: {createForm.raf_sayisi * createForm.hucre_sayisi_raf} hücre × {createForm.kapasite_hucre} kapasite = 
                  <span className="text-white font-semibold ml-1">
                    {(createForm.raf_sayisi * createForm.hucre_sayisi_raf * createForm.kapasite_hucre).toLocaleString('tr-TR')}
                  </span> kartela kapasitesi
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DÜZENLE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                Dolap Düzenle - {showEditModal.dolap_kodu}
              </h3>
              <button
                onClick={() => setShowEditModal(null)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const updates = {
                dolap_adi: (e.target as any).dolap_adi.value,
                aktif: (e.target as any).aktif.checked,
                aciklama: (e.target as any).aciklama.value
              };
              handleUpdateDolap(showEditModal.id, updates);
            }} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Dolap Adı</label>
                <input
                  type="text"
                  name="dolap_adi"
                  defaultValue={showEditModal.dolap_adi || ''}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                  maxLength={100}
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-2">Açıklama</label>
                <textarea
                  name="aciklama"
                  defaultValue={showEditModal.aciklama || ''}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[100px]"
                  placeholder="Dolap hakkında notlar..."
                  maxLength={500}
                />
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
                <input
                  type="checkbox"
                  name="aktif"
                  defaultChecked={showEditModal.aktif || false}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 focus:ring-2"
                />
                <div>
                  <label className="text-gray-300 text-sm">Aktif</label>
                  <p className="text-xs text-gray-500">Dolap kullanımda olsun</p>
                </div>
              </div>
              
              <div className="text-sm text-gray-400 p-3 bg-gray-900 rounded-lg">
                <p><strong>Sabit Bilgiler:</strong></p>
                <p>Kod: <span className="text-white font-mono">{showEditModal.dolap_kodu}</span></p>
                <p>Raflar: <span className="text-white">{showEditModal.raf_sayisi} × {showEditModal.hucre_sayisi_raf} hücre</span></p>
                <p>Toplam Kapasite: <span className="text-white">{showEditModal.toplam_kapasite?.toLocaleString('tr-TR')} kartela</span></p>
              </div>
              
              <div className="pt-4 border-t border-gray-700 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SİLME ONAY MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-red-900/50">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-900/30 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Dolap Pasif Yap</h3>
                  <p className="text-gray-400 text-sm">Dikkatli olun!</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="h-5 w-5 text-yellow-400" />
                  <div>
                    <p className="font-bold text-white">{showDeleteConfirm.dolap_kodu}</p>
                    <p className="text-gray-300 text-sm">{showDeleteConfirm.dolap_adi}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>• {showDeleteConfirm.raf_sayisi} raf × {showDeleteConfirm.hucre_sayisi_raf} hücre</p>
                  <p>• Toplam kapasite: {showDeleteConfirm.toplam_kapasite?.toLocaleString('tr-TR')} kartela</p>
                  <p>• Mevcut kartela: {showDeleteConfirm.mevcut_kartela_sayisi} adet</p>
                </div>
              </div>
              
              <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-300 font-medium mb-1">Uyarı: Geri Alınamaz İşlem</p>
                    <ul className="text-red-200 text-sm space-y-1">
                      <li>• Dolap pasif hale getirilecek</li>
                      <li>• Yeni kartela eklenemeyecek</li>
                      <li>• Mevcut kartelalar görüntülenebilir ama işlem yapılamaz</li>
                      <li>• İlgili tüm raf ve hücreler pasif olacak</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  onClick={() => handleDeleteDolap(showDeleteConfirm.id)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Pasif Yap
                </button>
              </div>
              
              <p className="text-center text-xs text-gray-500 pt-2">
                Bu işlem yalnızca boş veya az dolu dolaplar için önerilir
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-800">
        <p>
          Toplam <span className="text-white font-semibold">{filteredDolaplar.length}</span> dolap görüntüleniyor
          <span className="mx-2">•</span>
          <span className="text-green-400">{stats.aktifDolap} aktif</span>
          <span className="mx-2">•</span>
          Ortalama doluluk: <span className="text-yellow-400">{stats.ortalamaDoluluk.toFixed(1)}%</span>
          <span className="mx-2">•</span>
          Toplam kapasite: <span className="text-blue-400">{stats.toplamKapasite.toLocaleString('tr-TR')} kartela</span>
        </p>
      </div>
    </div>
  );
}