'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HexColorPicker, HexColorInput } from 'react-colorful'
import { 
  Palette, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  RefreshCw,
  X,
  Check,
  AlertCircle,
  Grid,
  Eye
} from 'lucide-react'

const supabase = createClient()

interface Renk {
  id: number
  renk_kodu: string
  renk_adi: string
  pantone_kodu?: string | null
  hex_kodu?: string | null
  aktif?: boolean | null
}

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null
type ViewMode = 'table' | 'grid'

interface RenkCRUDProps {
  onRenkEklendi?: () => void
  onRenkGuncellendi?: () => void
  onRenkSilindi?: () => void
}

const RenkCRUD: React.FC<RenkCRUDProps> = ({ 
  onRenkEklendi,
  onRenkGuncellendi,
  onRenkSilindi
}) => {
  const [renkler, setRenkler] = useState<Renk[]>([])
  const [filteredRenkler, setFilteredRenkler] = useState<Renk[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedRenk, setSelectedRenk] = useState<Renk | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  
  const [formData, setFormData] = useState({
    renk_kodu: '',
    renk_adi: '',
    pantone_kodu: '',
    hex_kodu: '',
    aktif: true
  })

  // ============ VERİ ÇEKME ============
  useEffect(() => {
    fetchRenkler()
  }, [])

  const fetchRenkler = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('renk_masalari')
        .select('*')
        .order('renk_adi')
      
      if (error) throw error
      setRenkler(data || [])
      setFilteredRenkler(data || [])
    } catch (err) {
      console.error('Renk çekme hatası:', err)
      setError('Renkler yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // ============ FİLTRELEME ============
  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const filtered = renkler.filter(r => 
        r.renk_adi?.toLowerCase().includes(term) ||
        r.renk_kodu?.toLowerCase().includes(term) ||
        r.pantone_kodu?.toLowerCase().includes(term)
      )
      setFilteredRenkler(filtered)
    } else {
      setFilteredRenkler(renkler)
    }
  }, [searchTerm, renkler])

  // ============ CRUD İŞLEMLERİ ============
  const handleCreate = async () => {
    try {
      setLoading(true)
      
      if (!formData.renk_kodu || !formData.renk_adi) {
        setError('Renk kodu ve renk adı zorunludur!')
        return
      }

      const { error } = await supabase
        .from('renk_masalari')
        .insert([formData])

      if (error) throw error

      setSuccess('Renk başarıyla eklendi!')
      setModalMode(null)
      resetForm()
      fetchRenkler()
      onRenkEklendi?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Renk eklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedRenk) return
    
    try {
      setLoading(true)

      const { error } = await supabase
        .from('renk_masalari')
        .update(formData)
        .eq('id', selectedRenk.id)

      if (error) throw error

      setSuccess('Renk başarıyla güncellendi!')
      setModalMode(null)
      fetchRenkler()
      onRenkGuncellendi?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Renk güncellenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedRenk) return
    
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('renk_masalari')
        .delete()
        .eq('id', selectedRenk.id)

      if (error) throw error

      setSuccess('Renk başarıyla silindi!')
      setModalMode(null)
      fetchRenkler()
      onRenkSilindi?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Renk silinirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      renk_kodu: '',
      renk_adi: '',
      pantone_kodu: '',
      hex_kodu: '',
      aktif: true
    })
    setSelectedRenk(null)
    setShowColorPicker(false)
  }

  const openEditModal = (renk: Renk) => {
    setSelectedRenk(renk)
    setFormData({
      renk_kodu: renk.renk_kodu,
      renk_adi: renk.renk_adi,
      pantone_kodu: renk.pantone_kodu || '',
      hex_kodu: renk.hex_kodu || '',
      aktif: renk.aktif ?? true
    })
    setModalMode('edit')
    setShowColorPicker(false)
  }

  const openViewModal = (renk: Renk) => {
    setSelectedRenk(renk)
    setModalMode('view')
  }

  const openDeleteModal = (renk: Renk) => {
    setSelectedRenk(renk)
    setModalMode('delete')
  }

  const getBgColor = (hexCode?: string | null, renkKodu?: string) => {
    if (hexCode) return hexCode
    if (renkKodu?.startsWith('#')) return renkKodu
    return '#cccccc'
  }

  const handleColorChange = (color: string) => {
    setFormData({ ...formData, hex_kodu: color })
  }

  if (loading && renkler.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Renkler yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Başarı/Error Mesajları */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            {success}
          </div>
          <button onClick={() => setSuccess(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Renk kodu, adı veya pantone ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 ${viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Palette className="h-5 w-5" />
              </button>
            </div>

            <button
              onClick={() => {
                resetForm()
                setModalMode('create')
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Yeni Renk
            </button>

            <button
              onClick={fetchRenkler}
              className="p-2 border rounded-lg hover:bg-gray-50 text-gray-600"
              title="Yenile"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
          <div>
            <span className="text-sm text-gray-500">Toplam Renk</span>
            <p className="text-xl font-bold text-gray-900">{renkler.length}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Aktif</span>
            <p className="text-xl font-bold text-green-600">
              {renkler.filter(r => r.aktif).length}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Pasif</span>
            <p className="text-xl font-bold text-gray-600">
              {renkler.filter(r => !r.aktif).length}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Pantone&apos;lu</span>
            <p className="text-xl font-bold text-purple-600">
              {renkler.filter(r => r.pantone_kodu).length}
            </p>
          </div>
        </div>
      </div>

      {/* Tablo Görünümü */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Renk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Renk Kodu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Renk Adı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pantone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRenkler.map((renk) => (
                  <tr key={renk.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div 
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: getBgColor(renk.hex_kodu, renk.renk_kodu) }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono">{renk.renk_kodu}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{renk.renk_adi}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono">{renk.pantone_kodu || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${renk.aktif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {renk.aktif ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openViewModal(renk)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Detay"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(renk)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(renk)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRenkler.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Palette className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Renk bulunamadı</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid Görünümü */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredRenkler.map((renk) => (
            <div
              key={renk.id}
              className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
            >
              <div 
                className="h-20"
                style={{ backgroundColor: getBgColor(renk.hex_kodu, renk.renk_kodu) }}
              />
              <div className="p-3">
                <div className="font-mono text-sm">{renk.renk_kodu}</div>
                <div className="font-medium truncate" title={renk.renk_adi}>{renk.renk_adi}</div>
                {renk.pantone_kodu && (
                  <div className="text-xs text-gray-500 mt-1">Pantone: {renk.pantone_kodu}</div>
                )}
                <div className="flex justify-end gap-1 mt-2">
                  <button
                    onClick={() => openViewModal(renk)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => openEditModal(renk)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(renk)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal with Color Picker */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  {modalMode === 'create' ? 'Yeni Renk Ekle' : 'Renk Düzenle'}
                </h2>
                <button onClick={() => setModalMode(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Color Picker Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Renk Seçici
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm hover:scale-105 transition-transform"
                    style={{ 
                      backgroundColor: formData.hex_kodu || 
                        (formData.renk_kodu.startsWith('#') ? formData.renk_kodu : '#cccccc') 
                    }}
                  />
                  
                  <HexColorInput
                    color={formData.hex_kodu || ''}
                    onChange={handleColorChange}
                    prefixed
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-blue-500"
                    placeholder="#RRGGBB"
                  />
                </div>

                {showColorPicker && (
                  <div className="absolute z-10 mt-2 bg-white p-3 rounded-lg shadow-xl border">
                    <div className="relative">
                      <HexColorPicker
                        color={formData.hex_kodu || '#cccccc'}
                        onChange={handleColorChange}
                      />
                      <button
                        onClick={() => setShowColorPicker(false)}
                        className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Renk Kodu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.renk_kodu}
                  onChange={(e) => setFormData({ ...formData, renk_kodu: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: 23011737.1"
                  disabled={modalMode === 'edit'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Renk Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.renk_adi}
                  onChange={(e) => setFormData({ ...formData, renk_adi: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: Kırmızı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pantone Kodu
                </label>
                <input
                  type="text"
                  value={formData.pantone_kodu}
                  onChange={(e) => setFormData({ ...formData, pantone_kodu: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: 186 C"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.aktif}
                    onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Aktif</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setModalMode(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                İptal
              </button>
              <button
                onClick={modalMode === 'create' ? handleCreate : handleUpdate}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'İşleniyor...' : modalMode === 'create' ? 'Renk Ekle' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {modalMode === 'view' && selectedRenk && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Renk Detayı</h2>
                <button onClick={() => setModalMode(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-16 h-16 rounded-lg border-2"
                  style={{ backgroundColor: getBgColor(selectedRenk.hex_kodu, selectedRenk.renk_kodu) }}
                />
                <div>
                  <h3 className="text-lg font-bold">{selectedRenk.renk_adi}</h3>
                  <p className="text-gray-600 font-mono">{selectedRenk.renk_kodu}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pantone Kodu:</span>
                  <span className="font-mono">{selectedRenk.pantone_kodu || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hex Kodu:</span>
                  <span className="font-mono">{selectedRenk.hex_kodu || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Durum:</span>
                  <span>{selectedRenk.aktif ? 'Aktif' : 'Pasif'}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setModalMode(null)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modalMode === 'delete' && selectedRenk && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <Trash2 className="h-8 w-8" />
                <h2 className="text-xl font-bold">Renk Sil</h2>
              </div>
              
              <p className="text-gray-600 mb-6">
                <strong>{selectedRenk.renk_adi}</strong> ({selectedRenk.renk_kodu}) 
                rengini silmek istediğinize emin misiniz?
              </p>
              
              <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg mb-6">
                Bu işlem geri alınamaz! Renk tamamen silinecektir.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  İptal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Siliniyor...' : 'Sil'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RenkCRUD