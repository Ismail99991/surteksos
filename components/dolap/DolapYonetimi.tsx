// components/dolap/DolapYonetimi.tsx - FULL BİRLEŞTİRİLMİŞ DOSYA
'use client';

import { useState, useEffect } from 'react';
import { 
  Package, Grid, Layers, Building, Search, 
  Plus, Edit, Trash2, Eye, RefreshCw,
  Settings, X, AlertTriangle, Lock, QrCode,
  Users, BarChart3, Download, Filter, ChevronRight,
  ChevronDown, CheckCircle, XCircle, Calendar,
  Info, MoreVertical, Tag, Hash, Columns,
  Box, FolderOpen, Maximize2, Minimize2, Palette,
  Printer
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import { toast } from 'sonner';
import DolapEditModal from '@/components/modals/DolapEditModal';
import HucreQrPrint from '@/components/qr/HucreQrPrint';

const supabase = createClient();

// VERİTABANI TİPLERİ
type DolapType = Database['public']['Tables']['dolaplar']['Row'];
type RafType = Database['public']['Tables']['raflar']['Row'];
type OdaType = Database['public']['Tables']['odalar']['Row'];
type HucreType = Database['public']['Tables']['hucreler']['Row'];
type KartelaType = Database['public']['Tables']['kartelalar']['Row'];
type MusteriType = Database['public']['Tables']['musteriler']['Row'];

// YENİ TİP - Hücre detayları için
type HucreWithDetails = HucreType & {
  dolap_kodu?: string;
  raf_kodu?: string;
};

interface DolapYonetimiProps {
  isAdmin?: boolean;
}

export default function DolapYonetimi({ isAdmin = true }: DolapYonetimiProps) {
  // ===========================================
  // STATE'LER (ESKİ + YENİ)
  // ===========================================
  
  // Veri state'leri
  const [dolaplar, setDolaplar] = useState<DolapType[]>([]);
  const [raflar, setRaflar] = useState<RafType[]>([]);
  const [hucreler, setHucreler] = useState<HucreType[]>([]);
  const [odalar, setOdalar] = useState<OdaType[]>([]);
  const [kartelalar, setKartelalar] = useState<KartelaType[]>([]);
  const [musteriler, setMusteriler] = useState<MusteriType[]>([]);
  
  // UI state'leri
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDolapId, setExpandedDolapId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // YENİ
  
  // Filtre state'leri
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOdaId, setSelectedOdaId] = useState<number | 'all'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [renkArama, setRenkArama] = useState(''); // YENİ
  const [bulunanHucreler, setBulunanHucreler] = useState<HucreType | null>(null); // YENİ
  
  // Modal state'leri
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<DolapType | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<DolapType | null>(null);
  const [selectedDolap, setSelectedDolap] = useState<DolapType | null>(null);
  
  // QR state'leri (YENİ)
  const [showQrPrint, setShowQrPrint] = useState(false);
  const [selectedQrHucreler, setSelectedQrHucreler] = useState<HucreWithDetails[]>([]);

  // Form state'i
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

  // ===========================================
  // VERİ YÜKLEME (ESKİ)
  // ===========================================
  
  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dolaplarRes, raflarRes, hucrelerRes, odalarRes, musterilerRes] = await Promise.all([
        supabase.from('dolaplar').select('*').order('dolap_kodu'),
        supabase.from('raflar').select('*').order('raf_kodu'),
        supabase.from('hucreler').select('*').order('hucre_kodu'),
        supabase.from('odalar').select('*').eq('aktif', true).order('oda_adi'),
        supabase.from('musteriler').select('*').order('musteri_adi')
      ]);

      if (dolaplarRes.error) throw dolaplarRes.error;
      if (raflarRes.error) throw raflarRes.error;
      if (hucrelerRes.error) throw hucrelerRes.error;
      if (odalarRes.error) throw odalarRes.error;

      setDolaplar(dolaplarRes.data || []);
      setRaflar(raflarRes.data || []);
      setHucreler(hucrelerRes.data || []);
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

  // Dolap detaylarını yükle (genişletilmiş görünüm için)
  const loadDolapDetails = async (dolapId: number) => {
    const [raflarRes, hucrelerRes] = await Promise.all([
      supabase.from('raflar').select('*').eq('dolap_id', dolapId).order('raf_kodu'),
      supabase.from('hucreler').select('*').eq('dolap_id', dolapId).order('hucre_kodu')
    ]);
    
    if (!raflarRes.error) setRaflar(prev => [...prev, ...(raflarRes.data || [])]);
    if (!hucrelerRes.error) setHucreler(prev => [...prev, ...(hucrelerRes.data || [])]);
  };

  // ===========================================
  // QR KOD FONKSİYONLARI (YENİ)
  // ===========================================
  
  const handlePrintAllQr = () => {
    const hucrelerWithDetails: HucreWithDetails[] = hucreler.map(hucre => {
      const raf = raflar.find(r => r.id === hucre.raf_id);
      const dolap = dolaplar.find(d => d.id === raf?.dolap_id);
      return {
        ...hucre,
        dolap_kodu: dolap?.dolap_kodu,
        raf_kodu: raf?.raf_kodu
      };
    });
    
    setSelectedQrHucreler(hucrelerWithDetails);
    setShowQrPrint(true);
  };

  const handlePrintDolapQr = (dolapId: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    const dolapRaflari = raflar.filter(raf => raf.dolap_id === dolapId);
    const dolapHucreleri = hucreler.filter(hucre => 
      dolapRaflari.some(raf => raf.id === hucre.raf_id)
    );
    
    const hucrelerWithDetails: HucreWithDetails[] = dolapHucreleri.map(hucre => {
      const raf = raflar.find(r => r.id === hucre.raf_id);
      const dolap = dolaplar.find(d => d.id === dolapId);
      return {
        ...hucre,
        dolap_kodu: dolap?.dolap_kodu,
        raf_kodu: raf?.raf_kodu
      };
    });
    
    setSelectedQrHucreler(hucrelerWithDetails);
    setShowQrPrint(true);
  };

  const handlePrintRafQr = (rafId: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    const rafHucreleri = hucreler.filter(hucre => hucre.raf_id === rafId);
    const raf = raflar.find(r => r.id === rafId);
    const dolap = dolaplar.find(d => d.id === raf?.dolap_id);
    
    const hucrelerWithDetails: HucreWithDetails[] = rafHucreleri.map(hucre => ({
      ...hucre,
      dolap_kodu: dolap?.dolap_kodu,
      raf_kodu: raf?.raf_kodu
    }));
    
    setSelectedQrHucreler(hucrelerWithDetails);
    setShowQrPrint(true);
  };

  const handlePrintSingleQr = (hucre: HucreType, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const raf = raflar.find(r => r.id === hucre.raf_id);
    const dolap = dolaplar.find(d => d.id === raf?.dolap_id);
    
    setSelectedQrHucreler([{
      ...hucre,
      dolap_kodu: dolap?.dolap_kodu,
      raf_kodu: raf?.raf_kodu
    }]);
    setShowQrPrint(true);
  };

  // ===========================================
  // RENK ARAMA FONKSİYONU (YENİ)
  // ===========================================
  
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

  // ===========================================
  // DOLAP CRUD İŞLEMLERİ (ESKİ)
  // ===========================================
  
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

  // ===========================================
  // DETAY GÖRÜNTÜLEME (ESKİ)
  // ===========================================
  
  const handleViewDetails = async (dolap: DolapType) => {
    setSelectedDolap(dolap);
    if (expandedDolapId === dolap.id) {
      setExpandedDolapId(null);
    } else {
      setExpandedDolapId(dolap.id);
      await loadDolapDetails(dolap.id);
    }
  };

  // ===========================================
  // İSTATİSTİK HESAPLAMA (ESKİ + YENİ)
  // ===========================================
  
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

  // ===========================================
  // FİLTRELEME (ESKİ)
  // ===========================================
  
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

  // ===========================================
  // YARDIMCI FONKSİYONLAR (ESKİ)
  // ===========================================
  
  const getDolapRaflari = (dolapId: number) => {
    return raflar.filter(raf => raf.dolap_id === dolapId);
  };

  const getRafHucreleri = (rafId: number) => {
    return hucreler.filter(hucre => hucre.raf_id === rafId);
  };

  // ===========================================
  // İLK YÜKLEME
  // ===========================================
  
  useEffect(() => {
    loadAllData();
  }, []);

  // ===========================================
  // YÜKLENİYOR EKRANI
  // ===========================================
  
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

  // ===========================================
  // ANA RENDER
  // ===========================================
  
  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
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
            
            {isAdmin && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-amber-700 text-sm font-medium">Yönetici Modu</span>
              </div>
            )}
          </div>
          
          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadAllData}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Yenile
            </button>
            
            {/* QR BUTONU - YENİ */}
            <button
              onClick={handlePrintAllQr}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <QrCode className="h-4 w-4" />
              {"Tüm QR'lar"}
            </button>
            
            {/* GÖRÜNÜM DEĞİŞTİRME - YENİ */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : 'text-gray-500'}`}
                title="Grid Görünüm"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : 'text-gray-500'}`}
                title="Liste Görünüm"
              >
                <Columns className="h-4 w-4" />
              </button>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Yeni Dolap
            </button>
          </div>
        </div>

        {/* İSTATİSTİK KARTLARI */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Toplam Dolap</p>
                <p className="text-2xl font-bold text-gray-900">{stats.toplamDolap}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-4 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Aktif Dolap</p>
                <p className="text-2xl font-bold text-gray-900">{stats.aktifDolap}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-4 border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Toplam Kapasite</p>
                <p className="text-2xl font-bold text-gray-900">{stats.toplamKapasite.toLocaleString('tr-TR')}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Layers className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-4 border border-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ort. Doluluk</p>
                <p className="text-2xl font-bold text-gray-900">{stats.ortalamaDoluluk.toFixed(1)}%</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ===== FİLTRELEME BÖLÜMÜ ===== */}
      <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          
          {/* ARAMA */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Dolap kodu, adı veya oda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* RENK ARAMA - YENİ */}
          <div className="flex-1">
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-500" />
              <input
                type="text"
                placeholder="Renk kodu ara (örn: 23011737.1)"
                value={renkArama}
                onChange={(e) => setRenkArama(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRenkArama()}
                className="w-full pl-10 pr-24 py-2 bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleRenkArama}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-purple-600 text-white px-4 py-1 rounded-md text-sm hover:bg-purple-700"
              >
                Renk Ara
              </button>
            </div>
          </div>

          {/* FİLTRELER */}
          <div className="flex gap-2">
            <select
              value={selectedOdaId}
              onChange={(e) => setSelectedOdaId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Tüm Odalar</option>
              {odalar.map(oda => (
                <option key={oda.id} value={oda.id}>{oda.oda_kodu}</option>
              ))}
            </select>
            
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as any)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Tümü</option>
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
            </select>
            
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedOdaId('all');
                setActiveFilter('all');
                setRenkArama('');
                setBulunanHucreler(null);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Temizle
            </button>
          </div>
        </div>
      </div>

      {/* BULUNAN HÜCRE - YENİ */}
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
                  <span className="font-medium">{renkArama}</span> kodu 
                  <span className="font-medium text-purple-600 mx-1">{bulunanHucreler.hucre_kodu}</span>
                  hücresinde
                </p>
              </div>
            </div>
            <button onClick={() => setBulunanHucreler(null)} className="p-1 hover:bg-purple-100 rounded-lg">
              <X className="h-5 w-5 text-purple-500" />
            </button>
          </div>
        </div>
      )}

      {/* HATA MESAJI */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-red-600 text-sm flex-1">{error}</p>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded-lg">
              <X className="h-5 w-5 text-red-500" />
            </button>
          </div>
        </div>
      )}

      {/* ===== DOLAP LİSTESİ ===== */}
      {viewMode === 'grid' ? (
        /* GRİD GÖRÜNÜM */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDolaplar.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-lg">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Dolap bulunamadı</p>
            </div>
          ) : (
            filteredDolaplar.map(dolap => {
              const oda = odalar.find(o => o.id === dolap.oda_id);
              const dolulukYuzde = dolap.doluluk_orani || 0;
              const isExpanded = expandedDolapId === dolap.id;
              
              return (
                <div key={dolap.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:border-blue-300 transition-all overflow-hidden group">
                  
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
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">PASİF</span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mt-1">{dolap.dolap_adi}</p>
                          {oda && (
                            <p className="text-gray-500 text-xs mt-2 flex items-center gap-1">
                              <Building className="h-3 w-3" /> {oda.oda_kodu}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* ACTION MENU */}
                      <div className="relative">
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg">
                          <MoreVertical className="h-5 w-5 text-gray-400" />
                        </button>
                        
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <button 
                            onClick={() => handleViewDetails(dolap)}
                            className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" /> Detay
                          </button>
                          <button 
                            onClick={(e) => handlePrintDolapQr(dolap.id, e)}
                            className="w-full px-4 py-2 text-left text-purple-600 hover:bg-purple-50 flex items-center gap-2"
                          >
                            <QrCode className="h-4 w-4" /> Hücreleri Yazdır
                          </button>
                          <button 
                            onClick={() => setShowEditModal(dolap)}
                            className="w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" /> Düzenle
                          </button>
                          <button 
                            onClick={() => setShowDeleteConfirm(dolap)}
                            className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" /> Pasif Yap
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* DOLAP İÇERİK */}
                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Raflar</p>
                        <p className="text-lg font-semibold">{dolap.raf_sayisi} × {dolap.hucre_sayisi_raf}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Kapasite</p>
                        <p className="text-lg font-semibold">{dolap.mevcut_kartela_sayisi}/{dolap.toplam_kapasite}</p>
                      </div>
                    </div>
                    
                    {/* DOLULUK BAR */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Doluluk</span>
                        <span className="font-semibold">{dolulukYuzde.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            dolulukYuzde > 80 ? 'bg-red-500' :
                            dolulukYuzde > 60 ? 'bg-orange-500' :
                            dolulukYuzde > 30 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${dolulukYuzde}%` }}
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleViewDetails(dolap)}
                      className="w-full py-2 bg-gray-50 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm flex items-center justify-center gap-2"
                    >
                      {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                      {isExpanded ? 'Detayları Gizle' : 'Detayları Göster'}
                    </button>
                  </div>
                  
                  {/* GENİŞLETİLMİŞ DETAYLAR */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 p-5">
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500">Toplam Hücre</p>
                          <p className="font-semibold">{dolap.toplam_hucre}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500">Kapasite/Hücre</p>
                          <p className="font-semibold">{dolap.kapasite_hucre}</p>
                        </div>
                      </div>
                      
                      {/* RAFLAR LİSTESİ */}
                      {getDolapRaflari(dolap.id).length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <Layers className="h-4 w-4" /> Raflar
                          </p>
                          <div className="space-y-2">
                            {getDolapRaflari(dolap.id).map(raf => (
                              <div key={raf.id} className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center">
                                <span className="font-medium">{raf.raf_kodu}</span>
                                <button
                                  onClick={(e) => handlePrintRafQr(raf.id, e)}
                                  className="p-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
                                  title="Raf QR"
                                >
                                  <QrCode className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* LİSTE GÖRÜNÜM */
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-600">Dolap</th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-600">Oda</th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-600">Raflar</th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-600">Kapasite</th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-600">Doluluk</th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-600">Durum</th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-600">QR</th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-600">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDolaplar.map(dolap => {
                const oda = odalar.find(o => o.id === dolap.oda_id);
                
                return (
                  <tr key={dolap.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Package className={`h-4 w-4 ${dolap.aktif ? 'text-green-600' : 'text-gray-400'}`} />
                        <div>
                          <div className="font-semibold">{dolap.dolap_kodu}</div>
                          <div className="text-sm text-gray-500">{dolap.dolap_adi}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">{oda?.oda_kodu || '-'}</td>
                    <td className="py-4 px-6">{dolap.raf_sayisi} × {dolap.hucre_sayisi_raf}</td>
                    <td className="py-4 px-6">{dolap.mevcut_kartela_sayisi}/{dolap.toplam_kapasite}</td>
                    <td className="py-4 px-6">
                      <div className="w-24">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${(dolap.doluluk_orani || 0) > 50 ? 'bg-green-500' : 'bg-yellow-500'}`}
                            style={{ width: `${dolap.doluluk_orani || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        dolap.aktif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {dolap.aktif ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={(e) => handlePrintDolapQr(dolap.id, e)}
                        className="p-1.5 bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
                      >
                        <QrCode className="h-4 w-4" />
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleViewDetails(dolap)} className="p-1 hover:bg-blue-50 text-blue-600 rounded">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => setShowEditModal(dolap)} className="p-1 hover:bg-green-50 text-green-600 rounded">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => setShowDeleteConfirm(dolap)} className="p-1 hover:bg-red-50 text-red-600 rounded">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== FOOTER ===== */}
      {filteredDolaplar.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">{filteredDolaplar.length}</span> dolap gösteriliyor
          </p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-sm text-blue-600 hover:text-blue-800">
            ↑ Yukarı Çık
          </button>
        </div>
      )}

      {/* ===== MODALLAR ===== */}

      {/* YENİ DOLAP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Yeni Dolap Oluştur</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateDolap} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Dolap Kodu *</label>
                <input
                  type="text"
                  value={createForm.dolap_kodu}
                  onChange={(e) => setCreateForm({...createForm, dolap_kodu: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dolap Adı *</label>
                <input
                  type="text"
                  value={createForm.dolap_adi}
                  onChange={(e) => setCreateForm({...createForm, dolap_adi: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Oda</label>
                <select
                  value={createForm.oda_id}
                  onChange={(e) => setCreateForm({...createForm, oda_id: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Oda Seçiniz</option>
                  {odalar.map(oda => (
                    <option key={oda.id} value={oda.id}>{oda.oda_kodu} - {oda.oda_adi}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Raf Sayısı</label>
                  <input
                    type="number"
                    value={createForm.raf_sayisi}
                    onChange={(e) => setCreateForm({...createForm, raf_sayisi: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hücre/Raf</label>
                  <input
                    type="number"
                    value={createForm.hucre_sayisi_raf}
                    onChange={(e) => setCreateForm({...createForm, hucre_sayisi_raf: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="1"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg">
                  İptal
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">
                  Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DÜZENLEME MODAL */}
      {showEditModal && (
        <DolapEditModal 
          dolap={showEditModal} 
          odalar={odalar} 
          onClose={() => setShowEditModal(null)} 
          onUpdate={handleUpdateDolap}
        />
      )}

      {/* SİLME ONAY MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h3 className="text-xl font-bold">Dolap Pasif Yap</h3>
            </div>
            <p className="mb-4">
              <span className="font-semibold">{showDeleteConfirm.dolap_kodu}</span> kodlu dolabı pasif yapmak istediğinize emin misiniz?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg">
                İptal
              </button>
              <button onClick={() => handleDeleteDolap(showDeleteConfirm.id)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg">
                Pasif Yap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR PRINT MODAL - YENİ */}
      {showQrPrint && (
        <HucreQrPrint
          hucreler={selectedQrHucreler.map(h => ({
            id: h.id,
            hucre_kodu: h.hucre_kodu,
            dolap_kodu: h.dolap_kodu,
            raf_kodu: h.raf_kodu
          }))}
          onClose={() => setShowQrPrint(false)}
        />
      )}
    </div>
  );
}
