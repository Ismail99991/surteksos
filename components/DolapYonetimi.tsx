// components/DolapYonetimi.tsx - YENİ DOSYA
'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Grid, 
  Layers, 
  Building, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  RefreshCw,
  BarChart3,
  MapPin,
  Users,
  Settings,
  Check,
  X,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

const supabase = createClient();

type DolapType = Database['public']['Tables']['dolaplar']['Row'];
type RafType = Database['public']['Tables']['raflar']['Row'];
type OdaType = Database['public']['Tables']['odalar']['Row'];
type HucreType = Database['public']['Tables']['hucreler']['Row'];

interface DolapYonetimiProps {
  isAdmin?: boolean;
}

export default function DolapYonetimi({ isAdmin = true }: DolapYonetimiProps) {
  // ... state'ler aynı ...
  
  // YENİ STATE'LER (Admin için)
  const [editingDolap, setEditingDolap] = useState<DolapType | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dolaplar, setDolaplar] = useState<DolapType[]>([]);
  const [odalar, setOdalar] = useState<OdaType[]>([]);
  
  // YENİ FONKSİYONLAR (Admin için)
  const loadAllData = async () => {
    try {
      const [dolaplarData, odalarData] = await Promise.all([
        supabase.from('dolaplar').select('*'),
        supabase.from('odalar').select('*')
      ]);
      
      if (dolaplarData.data) setDolaplar(dolaplarData.data);
      if (odalarData.data) setOdalar(odalarData.data);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);
  
  const handleCreateDolap = async (formData: any) => {
    // Yeni dolap oluştur
  };
  
  const handleUpdateDolap = async (dolapId: number, updates: any) => {
    // Dolap güncelle
  };
  
  const handleDeleteDolap = async (dolapId: number) => {
    // Dolap sil (soft delete)
  };
  
  const handleCreateRaf = async (dolapId: number) => {
    // Yeni raf oluştur
  };
  
  const handleCreateHucre = async (rafId: number, count: number) => {
    // Hücre oluştur
  };
  
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
            <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
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
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-3"
            >
              <Plus className="h-5 w-5" />
              Yeni Dolap Oluştur
            </button>
            <button
              onClick={loadAllData}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-3"
            >
              <RefreshCw className="h-4 w-4" />
              Verileri Yenile
            </button>
          </div>
        </div>
      </div>
      
      {/* ADMIN TOOLBAR */}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="Dolap ara..."
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white">
              <option>Tüm Odalar</option>
              {/* oda listesi */}
            </select>
            
            <select className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white">
              <option>Tüm Durumlar</option>
              <option>Aktif</option>
              <option>Pasif</option>
              <option>Arızalı</option>
            </select>
            
            <button className="px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
              Filtrele
            </button>
          </div>
        </div>
      </div>
      
      {/* DOLAP LİSTESİ - ADMIN VERSİYONU */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dolaplar.map(dolap => (
          <div key={dolap.id} className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-yellow-400" />
                  <h3 className="text-lg font-bold text-white">{dolap.dolap_kodu}</h3>
                  {!dolap.aktif && (
                    <span className="px-2 py-1 bg-red-900/30 text-red-300 text-xs rounded">PASİF</span>
                  )}
                </div>
                <p className="text-gray-300">{dolap.dolap_adi}</p>
              </div>
              
              {/* ADMIN ACTION MENU */}
              <div className="relative group">
                <button className="p-2 hover:bg-gray-700 rounded-lg">
                  <Settings className="h-5 w-5 text-gray-400" />
                </button>
                
                <div className="absolute right-0 top-full mt-1 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl hidden group-hover:block z-10">
                  <button 
                    onClick={() => setEditingDolap(dolap)}
                    className="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-800 flex items-center gap-3"
                  >
                    <Edit className="h-4 w-4" />
                    Düzenle
                  </button>
                  <button 
                    onClick={() => {
                      setEditingDolap(dolap);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-900/20 flex items-center gap-3"
                  >
                    <Trash2 className="h-4 w-4" />
                    Sil
                  </button>
                  <button className="w-full px-4 py-3 text-left text-blue-400 hover:bg-blue-900/20 flex items-center gap-3">
                    <Plus className="h-4 w-4" />
                    Raf Ekle
                  </button>
                </div>
              </div>
            </div>
            
            {/* ... diğer bilgiler aynı ... */}
            
            {/* ADMIN ACTIONS */}
            <div className="mt-6 pt-4 border-t border-gray-700 grid grid-cols-2 gap-2">
              <button className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                Raf Yönet
              </button>
              <button className="px-3 py-2 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600">
                Hücre Ekle
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* MODAL'LER */}
      {showCreateModal && (
        <CreateDolapModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateDolap}
          odalar={odalar}
        />
      )}
      
      {editingDolap && (
        <EditDolapModal
          dolap={editingDolap}
          onClose={() => setEditingDolap(null)}
          onSubmit={(updates) => handleUpdateDolap(editingDolap.id, updates)}
        />
      )}
    </div>
  );
}

// Modal component'leri
interface CreateDolapModalProps {
  onClose: () => void;
  onSubmit: (formData: any) => void;
  odalar: OdaType[];
}

function CreateDolapModal({ onClose, onSubmit, odalar }: CreateDolapModalProps) {
  const [formData, setFormData] = useState({
    dolap_kodu: '',
    dolap_adi: '',
    oda_id: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Yeni Dolap Oluştur</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Dolap Kodu</label>
            <input
              type="text"
              value={formData.dolap_kodu}
              onChange={(e) => setFormData({ ...formData, dolap_kodu: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">Dolap Adı</label>
            <input
              type="text"
              value={formData.dolap_adi}
              onChange={(e) => setFormData({ ...formData, dolap_adi: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">Oda</label>
            <select
              value={formData.oda_id}
              onChange={(e) => setFormData({ ...formData, oda_id: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
              required
            >
              <option value="">Seç...</option>
              {odalar.map(oda => (
                <option key={oda.id} value={oda.id}>{oda.oda_adi}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditDolapModalProps {
  dolap: DolapType;
  onClose: () => void;
  onSubmit: (updates: any) => void;
}

function EditDolapModal({ dolap, onClose, onSubmit }: EditDolapModalProps) {
  const [formData, setFormData] = useState({
    dolap_adi: dolap.dolap_adi,
    aktif: dolap.aktif,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Dolap Düzenle</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Dolap Adı</label>
            <input
              type="text"
              value={formData.dolap_adi}
              onChange={(e) => setFormData({ ...formData, dolap_adi: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.aktif ?? false}
              onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
              className="w-4 h-4"
            />
            <label className="text-gray-300 text-sm">Aktif</label>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}