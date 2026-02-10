// components/DolapYonetimi.tsx - PROFESYONEL GÖRÜNÜMLÜ
'use client';

import { useState, useEffect } from 'react';
import { 
  Package, Grid, Layers, Building, Search, 
  Plus, Edit, Trash2, Eye, RefreshCw,
  Settings, X, AlertTriangle, Lock, QrCode,
  Users, BarChart3, Download, Filter, ChevronRight,
  ChevronDown, CheckCircle, XCircle, Calendar,
  Info, MoreVertical, Tag, Hash, Columns,
  Box, FolderOpen, Maximize2, Minimize2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import { toast } from 'sonner';
import DolapDetayModal from './modals/DolapDetayModal';
import DolapEditModal from '@/components/modals/DolapEditModal';

const supabase = createClient();

// VERİTABANI TİPLERİ
type DolapType = Database['public']['Tables']['dolaplar']['Row'];
type RafType = Database['public']['Tables']['raflar']['Row'];
type OdaType = Database['public']['Tables']['odalar']['Row'];
type HucreType = Database['public']['Tables']['hucreler']['Row'];
type KartelaType = Database['public']['Tables']['kartelalar']['Row'];
type MusteriType = Database['public']['Tables']['musteriler']['Row'];

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
  const [showDetayModal, setShowDetayModal] = useState<DolapType | null>(null);
  const [musteriler, setMusteriler] = useState<MusteriType[]>([]);
  
  // UI STATE'LERİ
  const [expandedDolapId, setExpandedDolapId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // FILTRE STATE'LERİ
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOdaId, setSelectedOdaId] = useState<number | 'all'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [renkArama, setRenkArama] = useState('');
  const [bulunanHucreler, setBulunanHucreler] = useState<HucreType | null>(null);
  
  // MODAL STATE'LERİ
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<DolapType | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<DolapType | null>(null);
  const [selectedDolap, setSelectedDolap] = useState<DolapType | null>(null);

  // FORMLAR
  const [createForm, setCreateForm] = useState({
    dolap_kodu: '',
    dolap_adi: '',
    oda_id: '',
    raf_sayisi: 5,
    hucre_sayisi_raf: 18,
    kapasite_hucre: 50,
    aktif: true,
    aciklama: ''
  });

  // VERİ YÜKLEME
  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dolaplarRes, odalarRes, musterilerRes] = await Promise.all([
        supabase.from('dolaplar').select('*').order('dolap_kodu'),
        supabase.from('odalar').select('*').eq('aktif', true).order('oda_adi'),
        supabase.from('musteriler').select('*').order('musteri_adi')
      ]);

      if (dolaplarRes.error) throw dolaplarRes.error;
      if (odalarRes.error) throw odalarRes.error;

      setDolaplar(dolaplarRes.data || []);
      setOdalar(odalarRes.data || []);
      setMusteriler(musterilerRes.data || []);

    } catch (error: any) {
      console.error('Veri yükleme hatası:', error);
      setError('Veriler yüklenemedi: ' + error.message);
      toast.error('Veri yükleme hatası');
    } finally {
      setLoading(false);
    }
  };

  // DOLAP DETAYLARINI YÜKLEME
  const loadDolapDetails = async (dolapId: number) => {
    const [raflarRes, hucrelerRes] = await Promise.all([
      supabase.from('raflar').select('*').eq('dolap_id', dolapId).order('raf_kodu'),
      supabase.from('hucreler').select('*').eq('dolap_id', dolapId).order('hucre_kodu')
    ]);
    
    if (!raflarRes.error) setRaflar(prev => [...prev, ...(raflarRes.data || [])]);
    if (!hucrelerRes.error) setHucreler(prev => [...prev, ...(hucrelerRes.data || [])]);
  };

  // RENK ARAMA FONKSİYONU
  const handleRenkArama = () => {
    if (!renkArama.trim()) {
      toast.error('Lütfen renk kodu girin!');
      return;
    }

    const extractNumberFromRenkKodu = (renkKodu: string): number | null => {
      if (!renkKodu) return 0;
      const beforeDot = renkKodu.split('.')[0];
      const numbersOnly = beforeDot.replace(/[^0-9]/g, '');
      return parseInt(numbersOnly) || 0;
    };

    const renkNo = extractNumberFromRenkKodu(renkArama);
    if (renkNo === 0) {
      toast.error('Geçersiz renk kodu formatı!');
      return;
    }
    
    const hucre = hucreler.find(h =>
      h.renk_no_baslangic &&
      h.renk_no_bitis &&
      renkNo !== null &&
      renkNo >= h.renk_no_baslangic &&
      renkNo <= h.renk_no_bitis
    );

    setBulunanHucreler(hucre || null);

    if (hucre) {
      toast.success(`Renk ${renkArama} ${hucre.hucre_kodu} hücresinde bulunuyor!`);
    } else {
      toast.error(`Renk ${renkArama} için hücre bulunamadı`);
    }
  };

  // İSTATİSTİKLER
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
    if (selectedOdaId !== 'all' && dolap.oda_id !== selectedOdaId) return false;
    if (activeFilter === 'active' && !dolap.aktif) return false;
    if (activeFilter === 'inactive' && dolap.aktif) return false;
    
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

  // DOLAP OLUŞTURMA
  const handleCreateDolap = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const toplam_hucre = createForm.raf_sayisi * createForm.hucre_sayisi_raf;
      const toplam_kapasite = toplam_hucre * createForm.kapasite_hucre;
      
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
          aciklama: createForm.aciklama.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (dolapError) throw dolapError;

      toast.success('✅ Dolap başarıyla oluşturuldu!');
      
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
      await loadAllData();

    } catch (error: any) {
      console.error('Dolap oluşturma hatası:', error);
      
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

  // DOLAP PASİF YAPMA
  const handleDeleteDolap = async (dolapId: number) => {
    try {
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
      setShowDeleteConfirm(null);

    } catch (error: any) {
      console.error('Dolap pasif yapma hatası:', error);
      toast.error('❌ Dolap pasif yapılamadı: ' + error.message);
      throw error;
    }
  };

  // DETAY GÖRÜNTÜLEME
  const handleViewDetails = async (dolap: DolapType) => {
    setSelectedDolap(dolap);
    if (expandedDolapId === dolap.id) {
      setExpandedDolapId(null);
    } else {
      setExpandedDolapId(dolap.id);
      await loadDolapDetails(dolap.id);
    }
  };

  // İLK YÜKLEME
  useEffect(() => {
    loadAllData();
  }, []);

  // YÜKLENİYOR DURUMU
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-100 rounded-full"></div>
          <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">Dolaplar yükleniyor...</p>
        <p className="text-gray-400 text-sm mt-1">Lütfen bekleyin</p>
      </div>
    );
  }

  const stats = calculateStats();

  function handleExportToExcel(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dolap Yönetimi</h1>
                <p className="text-gray-500">Sistemdeki tüm dolapları yönetin</p>
              </div>
            </div>
            
            {/* UYARI */}
            {isAdmin && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-amber-700 text-sm font-medium">Yönetici Modu</span>
              </div>
            )}
          </div>
          
          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={loadAllData}
              className="px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Yenile
            </button>
            <button
              onClick={handleExportToExcel}
              className="px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Download className="h-4 w-4" />
              İndir
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors shadow-sm shadow-blue-100"
            >
              <Plus className="h-4 w-4" />
              Yeni Dolap
            </button>
          </div>
        </div>

        {/* İSTATİSTİKLER */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Toplam Dolap</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.toplamDolap}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-2">Sistemdeki toplam dolap</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-4 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Aktif Dolap</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.aktifDolap}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-2">Kullanımda olan dolaplar</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-4 border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Toplam Kapasite</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.toplamKapasite.toLocaleString('tr-TR')}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Layers className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-2">Kartela kapasitesi</div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-4 border border-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ort. Doluluk</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.ortalamaDoluluk.toFixed(1)}%</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-2">Ortalama doluluk oranı</div>
          </div>
        </div>
      </div>
      
      {/* FILTRELEME BÖLÜMÜ */}
      <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* ARAMA */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Dolap kodu, adı veya oda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
          
          {/* RENK ARAMA */}
          <div className="flex-1">
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-500" />
              <input
                type="text"
                placeholder="Renk kodu ara (örn: 23011737.1)"
                value={renkArama}
                onChange={(e) => setRenkArama(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRenkArama()}
                className="w-full pl-10 pr-24 py-2.5 bg-white border border-purple-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              />
              <button
                onClick={handleRenkArama}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-md text-sm transition-colors"
              >
                Renk Ara
              </button>
            </div>
          </div>

          {/* FİLTRELER */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <select
                value={selectedOdaId}
                onChange={(e) => setSelectedOdaId(
                  e.target.value === 'all' ? 'all' : parseInt(e.target.value)
                )}
                className="w-full sm:w-auto px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
              >
                <option value="all">Tüm Odalar</option>
                {odalar.map(oda => (
                  <option key={oda.id} value={oda.id}>
                    {oda.oda_kodu} - {oda.oda_adi}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            
            <div className="relative">
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as any)}
                className="w-full sm:w-auto px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedOdaId('all');
                setActiveFilter('all');
                setRenkArama('');
                setBulunanHucreler(null);
              }}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 text-sm transition-colors flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Temizle
            </button>
          </div>
        </div>
        
        {/* GÖRÜNÜM MODU SEÇİCİ */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{filteredDolaplar.length}</span> dolap listeleniyor
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Görünüm:</span>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Columns className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* BULUNAN HÜCRE */}
      {bulunanHucreler && (
        <div className="bg-gradient-to-r from-purple-50 to-white rounded-2xl shadow-lg p-5 border border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Tag className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Renk Bulundu!</h3>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{renkArama}</span> renk kodu 
                  <span className="font-medium text-purple-600 mx-1">{bulunanHucreler.hucre_kodu}</span>
                  hücresinde bulunuyor
                </p>
              </div>
            </div>
            <button
              onClick={() => setBulunanHucreler(null)}
              className="p-1 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-purple-500" />
            </button>
          </div>
        </div>
      )}

      {/* HATA MESAJI */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Hata oluştu</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="p-1 hover:bg-red-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-red-500" />
            </button>
          </div>
        </div>
      )}

      {/* DOLAP LİSTESİ - GRİD GÖRÜNÜM */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDolaplar.length === 0 ? (
            <div className="col-span-full">
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
                <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Package className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Dolap bulunamadı</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Arama kriterlerinize uygun dolap bulunamadı. Filtreleri temizleyip tekrar deneyin.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  İlk Dolabı Oluştur
                </button>
              </div>
            </div>
          ) : (
            filteredDolaplar.map(dolap => {
              const oda = odalar.find(o => o.id === dolap.oda_id);
              const dolulukYuzde = dolap.doluluk_orani || 0;
              const isExpanded = expandedDolapId === dolap.id;
              
              return (
                <div key={dolap.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:border-blue-300 transition-all duration-300 overflow-hidden group">
                  {/* DOLAP HEADER */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-lg ${dolap.aktif ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-200'}`}>
                          <Package className={`h-5 w-5 ${dolap.aktif ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-lg">{dolap.dolap_kodu}</h3>
                            {!dolap.aktif && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                PASİF
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mt-1">{dolap.dolap_adi}</p>
                          {oda && (
                            <div className="flex items-center gap-1 text-gray-500 text-xs mt-2">
                              <Building className="h-3 w-3" />
                              <span>{oda.oda_kodu} - {oda.oda_adi}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* ACTION MENU */}
                      <div className="relative">
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="h-5 w-5 text-gray-400" />
                        </button>
                        
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl shadow-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                          <button 
                            onClick={() => handleViewDetails(dolap)}
                            className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3 rounded-t-lg border-b border-gray-100"
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                            Detayları Gör
                          </button>
                          <button 
                            onClick={() => setShowEditModal(dolap)}
                            className="w-full px-4 py-3 text-left text-blue-600 hover:bg-blue-50 flex items-center gap-3"
                          >
                            <Edit className="h-4 w-4" />
                            Düzenle
                          </button>
                          <button 
                            onClick={() => setShowDeleteConfirm(dolap)}
                            className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-3 rounded-b-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                            Pasif Yap
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* DOLAP İÇERİK */}
                  <div className="p-5">
                        {/* KAPASİTE BİLGİLERİ */}
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div className="text-center">
                        <div className="text-sm text-gray-500 mb-1">Raflar</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {dolap.raf_sayisi} × {dolap.hucre_sayisi_raf}
                        </div>
                        <div className="text-xs text-gray-400">raflar × hücreler</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-500 mb-1">Kapasite</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {dolap.mevcut_kartela_sayisi}/{dolap.toplam_kapasite}
                        </div>
                        <div className="text-xs text-gray-400">kartela</div>
                      </div>
                    </div>
                    
                    {/* DOLULUK BAR */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600 font-medium">Doluluk Oranı</span>
                        <span className="text-sm font-semibold text-gray-900">{dolulukYuzde.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-700 ${
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
                      className="w-full py-2.5 bg-gray-50 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <Minimize2 className="h-4 w-4" />
                          Detayları Gizle
                        </>
                      ) : (
                        <>
                          <Maximize2 className="h-4 w-4" />
                          Detayları Göster
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* GENİŞLETİLMİŞ DETAYLAR */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 p-5 animate-slideDown">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">Toplam Hücre</div>
                          <div className="font-semibold text-gray-900">{dolap.toplam_hucre}</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">Kapasite/Hücre</div>
                          <div className="font-semibold text-gray-900">{dolap.kapasite_hucre}</div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>Oluşturulma: {dolap.created_at ? new Date(dolap.created_at).toLocaleDateString('tr-TR') : '-'}</span>
                        </div>
                        {dolap.aciklama && (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">Açıklama</div>
                            <p className="text-gray-700">{dolap.aciklama}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* DOLAP LİSTESİ - LİST GÖRÜNÜM */
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dolap</th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Oda</th>
                <th className="py3 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Raflar</th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kapasite</th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Doluluk</th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Durum</th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDolaplar.map(dolap => {
                const oda = odalar.find(o => o.id === dolap.oda_id);
                const dolulukYuzde = dolap.doluluk_orani || 0;
                
                return (
                  <tr key={dolap.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${dolap.aktif ? 'bg-green-50' : 'bg-gray-100'}`}>
                          <Package className={`h-4 w-4 ${dolap.aktif ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{dolap.dolap_kodu}</div>
                          <div className="text-sm text-gray-500">{dolap.dolap_adi}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {oda ? (
                        <div>
                          <div className="font-medium text-gray-900">{oda.oda_kodu}</div>
                          <div className="text-sm text-gray-500">{oda.oda_adi}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-900 font-medium">{dolap.raf_sayisi} raf</div>
                      <div className="text-sm text-gray-500">{dolap.hucre_sayisi_raf} hücre/raf</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-900 font-medium">
                        {dolap.mevcut_kartela_sayisi}/{dolap.toplam_kapasite}
                      </div>
                      <div className="text-sm text-gray-500">kartela</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="w-32">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">%{dolulukYuzde.toFixed(1)}</span>
                          <span className="text-gray-400">{dolulukYuzde > 80 ? 'Yüksek' : dolulukYuzde > 50 ? 'Orta' : 'Düşük'}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              dolulukYuzde > 80 ? 'bg-red-500' :
                              dolulukYuzde > 50 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${dolulukYuzde}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        dolap.aktif 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {dolap.aktif ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(dolap)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="Detayları Gör"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowEditModal(dolap)}
                          className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(dolap)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          title="Pasif Yap"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredDolaplar.length === 0 && (
            <div className="text-center py-16">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Dolap bulunamadı</p>
            </div>
          )}
        </div>
      )}

      {/* FOOTER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="text-sm text-gray-600">
          Toplam <span className="font-semibold text-gray-900">{filteredDolaplar.length}</span> dolap listeleniyor
          <span className="mx-2">•</span>
          <span className="text-green-600">{stats.aktifDolap} aktif</span>
          <span className="mx-2">•</span>
          Ortalama doluluk: <span className="text-amber-600">{stats.ortalamaDoluluk.toFixed(1)}%</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={loadAllData}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Yenile
          </button>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Yukarı Çık
          </button>
        </div>
      </div>

      {/* MODALLER */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-300 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Yeni Dolap Oluştur</h3>
                  <p className="text-gray-500 text-sm">Dolap bilgilerini girin</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleCreateDolap} className="space-y-4">
              {/* FORM İÇERİĞİ AYNI KALACAK */}
              {/* ... */}
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <DolapEditModal 
          dolap={showEditModal} 
          odalar={odalar} 
          onClose={() => setShowEditModal(null)} 
          onUpdate={handleUpdateDolap}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-red-200 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Dolap Pasif Yap</h3>
                  <p className="text-red-500 text-sm">Dikkatli olun!</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            {/* SİLME ONAY İÇERİĞİ */}
          </div>
        </div>
      )}

      {showDetayModal && (
        <DolapDetayModal 
          dolap={showDetayModal} 
          odalar={odalar} 
          musteriler={musteriler}
          onClose={() => setShowDetayModal(null)} 
          onEdit={(dolap) => setShowEditModal(dolap)}
          onDelete={(dolapId) => {
            const dolapToDelete = dolaplar.find(d => d.id === dolapId);
            if (dolapToDelete) setShowDeleteConfirm(dolapToDelete);
          }}
        />
      )}
    </div>
  );
}