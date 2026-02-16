'use client'

  import React, { useState, useEffect } from 'react'
  import { createClient } from '@/lib/supabase/client'
  import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Archive, 
  RefreshCw,
  X,
  Check,
  AlertCircle,
  User,
  Grid,
  Palette,
  Hash,
  Eye,
  History
} from 'lucide-react'

const supabase = createClient()

// ============ TİP TANIMLAMALARI ============

// İlişkili tablo tipleri
interface Musteri {
  id: number
  musteri_adi: string
  musteri_kodu?: string
  aktif?: boolean
}

interface Kullanici {
  id: number
  ad: string
  soyad: string
  email?: string
  kullanici_adi?: string
}

interface Hucre {
  id: number
  hucre_kodu: string
  hucre_adi?: string
  oda_id?: number
  aktif?: boolean
}

interface RenkMasasi {
  renk_kodu: string
  renk_adi: string
  aktif?: boolean
}

// Ana Kartela tipi (tüm ilişkilerle)
interface Kartela {
  id: number
  kartela_no: string
  renk_kodu: string
  renk_adi: string
  goz_sayisi?: number | null
  maksimum_goz?: number | null
  goz_dolum_orani?: number | null
  durum?: string | null
  hucre_id?: number | null
  hucre_kodu?: string | null
  musteri_adi?: string | null
  proje_kodu?: string | null
  rpt_calismasi?: string | null
  toplam_kullanim_sayisi?: number | null
  son_kullanim_tarihi?: string | null
  son_kullanan_kullanici_id?: number | null
  olusturan_kullanici_id?: number | null
  olusturulma_tarihi?: string | null
  arsive_alma_tarihi?: string | null
  arsive_alan_kullanici_id?: number | null
  silindi?: boolean | null
  silinme_tarihi?: string | null
  silen_kullanici_id?: number | null
  musteri_id?: number | null
  
  // İlişkili veriler (JOIN ile gelecek)
  musteri?: Musteri | null
  hucre?: Hucre | null
  son_kullanan_kullanici?: Kullanici | null
  olusturan_kullanici?: Kullanici | null
  arsive_alan_kullanici?: Kullanici | null
  silen_kullanici?: Kullanici | null
  renk_masasi?: RenkMasasi | null
}

// Yeni kartela oluşturma tipi
interface YeniKartela {
  kartela_no: string
  renk_kodu: string
  renk_adi: string
  goz_sayisi?: number | null
  maksimum_goz?: number | null
  goz_dolum_orani?: number | null
  durum?: string | null
  hucre_id?: number | null
  hucre_kodu?: string | null
  musteri_adi?: string | null
  proje_kodu?: string | null
  rpt_calismasi?: string | null
  musteri_id?: number | null
}

// Modal tipleri
type ModalMode = 'create' | 'edit' | 'view' | 'delete' | 'archive' | null
type ViewMode = 'table' | 'grid' | 'detail'

interface KartelaCRUDProps {
  currentUserId: number
  currentOdaId?: number
  onKartelaEklendi?: () => void
  onKartelaGuncellendi?: () => void
  onKartelaSilindi?: () => void
}

// ============ ANA COMPONENT ============

const KartelaCRUD: React.FC<KartelaCRUDProps> = ({ 
  currentUserId, 
  currentOdaId,
  onKartelaEklendi,
  onKartelaGuncellendi,
  onKartelaSilindi
}) => {
  // State'ler
  const [kartelalar, setKartelalar] = useState<Kartela[]>([])
  const [filteredKartelalar, setFilteredKartelalar] = useState<Kartela[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // İlişkili veriler
  const [musteriler, setMusteriler] = useState<Musteri[]>([])
  const [hucreler, setHucreler] = useState<Hucre[]>([])
  const [renkler, setRenkler] = useState<RenkMasasi[]>([])
  const [kullanicilar, setKullanicilar] = useState<Kullanici[]>([])
  
  // UI State'leri
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedKartela, setSelectedKartela] = useState<Kartela | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showArchived, setShowArchived] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<YeniKartela>({
    kartela_no: '',
    renk_kodu: '',
    renk_adi: '',
    goz_sayisi: null,
    maksimum_goz: null,
    goz_dolum_orani: null,
    durum: 'Aktif',
    hucre_id: null,
    hucre_kodu: '',
    musteri_adi: '',
    proje_kodu: '',
    rpt_calismasi: '',
    musteri_id: null
  })

  // ============ VERİ ÇEKME ============
  
  useEffect(() => {
    fetchAllData()
  }, [showArchived])

  // Tüm verileri çek
  const fetchAllData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      await Promise.all([
        fetchKartelalar(),
        fetchMusteriler(),
        fetchHucreler(),
        fetchRenkler(),
        fetchKullanicilar()
      ])
    } catch (err) {
      console.error('Veri çekme hatası:', err)
      setError('Veriler yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Kartelaları tüm ilişkileriyle çek
  const fetchKartelalar = async () => {
    try {
      let query = supabase
        .from('kartelalar')
        .select(`
          *,
          musteri:musteri_id (*),
          hucre:hucre_id (*),
          son_kullanan_kullanici:son_kullanan_kullanici_id (id, ad, soyad),
          olusturan_kullanici:olusturan_kullanici_id (id, ad, soyad),
          arsive_alan_kullanici:arsive_alan_kullanici_id (id, ad, soyad),
          silen_kullanici:silen_kullanici_id (id, ad, soyad)
        `)
        .order('id', { ascending: false })

      // Arşiv filtresi
      if (!showArchived) {
        query = query.eq('silindi', false)
      }

      const { data, error } = await query

      if (error) throw error
      
      // Renk masasından renk adını getir (eğer boşsa)
      const enrichedData = await Promise.all((data || []).map(async (kartela: any) => {
  // TÜM ID ALANLARINI NUMBER'A ÇEVİR
  const cleanedKartela = {
    ...kartela,
    musteri_id: kartela.musteri_id ? Number(kartela.musteri_id) : null,
    hucre_id: kartela.hucre_id ? Number(kartela.hucre_id) : null,
    olusturan_kullanici_id: kartela.olusturan_kullanici_id ? Number(kartela.olusturan_kullanici_id) : null,
    son_kullanan_kullanici_id: kartela.son_kullanan_kullanici_id ? Number(kartela.son_kullanan_kullanici_id) : null,
    arsive_alan_kullanici_id: kartela.arsive_alan_kullanici_id ? Number(kartela.arsive_alan_kullanici_id) : null,
    silen_kullanici_id: kartela.silen_kullanici_id ? Number(kartela.silen_kullanici_id) : null
  }
  
  // Renk adı kontrolü
  if (!cleanedKartela.renk_adi && cleanedKartela.renk_kodu) {
    const { data: renkData } = await supabase
      .from('renk_masalari')
      .select('renk_adi')
      .eq('renk_kodu', cleanedKartela.renk_kodu)
      .single()
    
    return { ...cleanedKartela, renk_adi: renkData?.renk_adi || cleanedKartela.renk_kodu }
  }
  
  return cleanedKartela
}))
      
      setKartelalar(enrichedData || [])
    } catch (err) {
      console.error('Kartela çekme hatası:', err)
      throw err
    }
  }

  // Müşterileri çek
  const fetchMusteriler = async () => {
    const { data, error } = await supabase
      .from('musteriler')
      .select('*')
      .eq('aktif', true)
      .order('musteri_adi')
    
    if (!error && data) setMusteriler(data)
  }

  // Hücreleri çek
  const fetchHucreler = async () => {
    let query = supabase
      .from('hucreler')
      .select('*')
      .eq('aktif', true)
    
    if (currentOdaId) {
      query = query.eq('oda_id', currentOdaId)
    }
    
    const { data, error } = await query.order('hucre_kodu')
    if (!error && data) {
setHucreler(
data.map((hucre: any) => ({
      ...hucre,
// Normalize null to undefined to satisfy Hucre.aktif?: boolean
      aktif: hucre.aktif === null ? undefined : hucre.aktif
    }))
      )
    }
  }

  // Renkleri çek
  const fetchRenkler = async () => {
    const { data, error } = await supabase
      .from('renk_masalari')
      .select('*')
      .eq('aktif', true)
      .order('renk_adi')
    
    if (!error && data) setRenkler(data.map((renk: any) => ({
  ...renk,
  aktif: renk.aktif === null ? undefined : renk.aktif
})))
  }

  // Kullanıcıları çek
  const fetchKullanicilar = async () => {
    const { data, error } = await supabase
      .from('kullanicilar')
      .select('id, ad, soyad')
      .eq('aktif', true)
      .order('ad')
    
    if (!error && data) setKullanicilar(data)
  }

  // ============ FİLTRELEME ============
  
  useEffect(() => {
    filterKartelalar()
  }, [searchTerm, statusFilter, kartelalar])

  const filterKartelalar = () => {
    let filtered = [...kartelalar]
    
    // Arama filtresi
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(k => 
        k.kartela_no?.toLowerCase().includes(term) ||
        k.renk_adi?.toLowerCase().includes(term) ||
        k.renk_kodu?.toLowerCase().includes(term) ||
        k.musteri_adi?.toLowerCase().includes(term) ||
        k.proje_kodu?.toLowerCase().includes(term)
      )
    }
    
    // Durum filtresi
    if (statusFilter !== 'all') {
      filtered = filtered.filter(k => k.durum === statusFilter)
    }
    
    setFilteredKartelalar(filtered)
  }

  // ============ CRUD İŞLEMLERİ ============

  // Yeni kartela ekle
  const handleCreate = async () => {
    try {
      setLoading(true)
      
      // Validasyon
      if (!formData.kartela_no || !formData.renk_kodu) {
        setError('Kartela no ve renk kodu zorunludur!')
        return
      }

      // Seçilen müşteri varsa musteri_adi'ni de set et
      if (formData.musteri_id) {
        const selectedMusteri = musteriler.find(m => m.id === formData.musteri_id)
        if (selectedMusteri) {
          formData.musteri_adi = selectedMusteri.musteri_adi
        }
      }

      // Seçilen hücre varsa hucre_kodu'nu set et
      if (formData.hucre_id) {
        const selectedHucre = hucreler.find(h => h.id === formData.hucre_id)
        if (selectedHucre) {
          formData.hucre_kodu = selectedHucre.hucre_kodu
        }
      }

      const { data, error } = await supabase
        .from('kartelalar')
        .insert([{
          ...formData,
          olusturan_kullanici_id: currentUserId,
          olusturulma_tarihi: new Date().toISOString(),
          silindi: false
        }])
        .select()

      if (error) throw error

      setSuccess('Kartela başarıyla eklendi!')
      setModalMode(null)
      resetForm()
      fetchKartelalar()
      onKartelaEklendi?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kartela eklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Kartela güncelle
  const handleUpdate = async () => {
    if (!selectedKartela) return
    
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('kartelalar')
        .update({
          ...formData,
          son_kullanim_tarihi: new Date().toISOString()
        })
        .eq('id', selectedKartela.id)

      if (error) throw error

      setSuccess('Kartela başarıyla güncellendi!')
      setModalMode(null)
      fetchKartelalar()
      onKartelaGuncellendi?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kartela güncellenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Soft delete (arşivle)
  const handleArchive = async () => {
    if (!selectedKartela) return
    
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('kartelalar')
        .update({
          silindi: true,
          silinme_tarihi: new Date().toISOString(),
          silen_kullanici_id: currentUserId,
          arsive_alma_tarihi: new Date().toISOString(),
          arsive_alan_kullanici_id: currentUserId
        })
        .eq('id', selectedKartela.id)

      if (error) throw error

      setSuccess('Kartela arşive alındı!')
      setModalMode(null)
      fetchKartelalar()
      onKartelaSilindi?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kartela arşivlenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Kalıcı sil (admin için)
  const handlePermanentDelete = async () => {
    if (!selectedKartela) return
    
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('kartelalar')
        .delete()
        .eq('id', selectedKartela.id)

      if (error) throw error

      setSuccess('Kartela kalıcı olarak silindi!')
      setModalMode(null)
      fetchKartelalar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kartela silinirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Arşivden geri al
  const handleRestore = async (id: number) => {
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('kartelalar')
        .update({
          silindi: false,
          silinme_tarihi: null,
          silen_kullanici_id: null,
          arsive_alma_tarihi: null,
          arsive_alan_kullanici_id: null
        })
        .eq('id', id)

      if (error) throw error

      setSuccess('Kartela arşivden geri alındı!')
      fetchKartelalar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Geri alma işlemi başarısız')
    } finally {
      setLoading(false)
    }
  }

  // ============ YARDIMCI FONKSİYONLAR ============

  const resetForm = () => {
    setFormData({
      kartela_no: '',
      renk_kodu: '',
      renk_adi: '',
      goz_sayisi: null,
      maksimum_goz: null,
      goz_dolum_orani: null,
      durum: 'Aktif',
      hucre_id: null,
      hucre_kodu: '',
      musteri_adi: '',
      proje_kodu: '',
      rpt_calismasi: '',
      musteri_id: null
    })
    setSelectedKartela(null)
  }

  const openEditModal = (kartela: Kartela) => {
    setSelectedKartela(kartela)
    setFormData({
      kartela_no: kartela.kartela_no,
      renk_kodu: kartela.renk_kodu,
      renk_adi: kartela.renk_adi || '',
      goz_sayisi: kartela.goz_sayisi,
      maksimum_goz: kartela.maksimum_goz,
      goz_dolum_orani: kartela.goz_dolum_orani,
      durum: kartela.durum || 'Aktif',
      hucre_id: kartela.hucre_id,
      hucre_kodu: kartela.hucre_kodu || '',
      musteri_adi: kartela.musteri_adi || '',
      proje_kodu: kartela.proje_kodu || '',
      rpt_calismasi: kartela.rpt_calismasi || '',
      musteri_id: kartela.musteri_id
    })
    setModalMode('edit')
  }

  const openViewModal = (kartela: Kartela) => {
    setSelectedKartela(kartela)
    setModalMode('view')
  }

  const openDeleteModal = (kartela: Kartela) => {
    setSelectedKartela(kartela)
    setModalMode('delete')
  }

  const openArchiveModal = (kartela: Kartela) => {
    setSelectedKartela(kartela)
    setModalMode('archive')
  }

  const getKullaniciAdi = (kullaniciId?: number | null) => {
    if (!kullaniciId) return '-'
    const kullanici = kullanicilar.find(k => k.id === kullaniciId)
    return kullanici ? `${kullanici.ad} ${kullanici.soyad}` : `ID: ${kullaniciId}`
  }

  const getDurumRenk = (durum?: string | null) => {
    switch (durum) {
      case 'Aktif': return 'bg-green-100 text-green-800'
      case 'Pasif': return 'bg-gray-100 text-gray-800'
      case 'Üretimde': return 'bg-blue-100 text-blue-800'
      case 'Tamamlandı': return 'bg-purple-100 text-purple-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  // ============ RENDER ============

  if (loading && kartelalar.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Kartelalar yükleniyor...</p>
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
          {/* Sol taraf - Arama ve Filtreler */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Kartela no, renk, müşteri ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="Aktif">Aktif</option>
              <option value="Pasif">Pasif</option>
              <option value="Üretimde">Üretimde</option>
              <option value="Tamamlandı">Tamamlandı</option>
            </select>

            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-3 py-2 border rounded-lg flex items-center gap-2 ${
                showArchived 
                  ? 'bg-purple-50 border-purple-300 text-purple-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Archive className="h-4 w-4" />
              {showArchived ? 'Arşivdekiler' : 'Arşiv'}
            </button>
          </div>

          {/* Sağ taraf - Görünüm ve İşlemler */}
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
                <Package className="h-5 w-5" />
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
              Yeni Kartela
            </button>

            <button
              onClick={fetchAllData}
              className="p-2 border rounded-lg hover:bg-gray-50 text-gray-600"
              title="Yenile"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t">
          <div>
            <span className="text-sm text-gray-500">Toplam Kartela</span>
            <p className="text-xl font-bold text-gray-900">{kartelalar.length}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Aktif</span>
            <p className="text-xl font-bold text-green-600">
              {kartelalar.filter(k => k.durum === 'Aktif' && !k.silindi).length}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Üretimde</span>
            <p className="text-xl font-bold text-blue-600">
              {kartelalar.filter(k => k.durum === 'Üretimde' && !k.silindi).length}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Arşiv</span>
            <p className="text-xl font-bold text-purple-600">
              {kartelalar.filter(k => k.silindi).length}
            </p>
          </div>
        </div>
      </div>

      {/* Kartela Listesi - Tablo Görünümü */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kartela No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Renk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hücre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Göz</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Son İşlem</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredKartelalar.map((kartela) => (
                  <tr key={kartela.id} className={`hover:bg-gray-50 ${kartela.silindi ? 'bg-gray-50 opacity-75' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{kartela.kartela_no}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: kartela.renk_kodu.startsWith('#') ? kartela.renk_kodu : `#${kartela.renk_kodu}` }}
                        />
                        <div>
                          <div className="text-sm">{kartela.renk_adi}</div>
                          <div className="text-xs text-gray-500">{kartela.renk_kodu}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div>{kartela.musteri_adi || '-'}</div>
                        {kartela.musteri && (
                          <div className="text-xs text-gray-500">{kartela.musteri.musteri_kodu}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {kartela.hucre ? (
                        <div>
                          <div>{kartela.hucre.hucre_kodu}</div>
                          <div className="text-xs text-gray-500">{kartela.hucre.hucre_adi}</div>
                        </div>
                      ) : kartela.hucre_kodu || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {kartela.goz_sayisi ? (
                        <div>
                          <div>{kartela.goz_sayisi} göz</div>
                          {kartela.maksimum_goz && (
                            <div className="text-xs text-gray-500">Maks: {kartela.maksimum_goz}</div>
                          )}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getDurumRenk(kartela.durum)}`}>
                        {kartela.durum || 'Belirsiz'}
                      </span>
                      {kartela.silindi && (
                        <span className="ml-2 px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                          Arşiv
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {kartela.son_kullanim_tarihi ? (
                        <div>
                          <div>{new Date(kartela.son_kullanim_tarihi).toLocaleDateString('tr-TR')}</div>
                          <div className="text-xs text-gray-500">
                            {getKullaniciAdi(kartela.son_kullanan_kullanici_id)}
                          </div>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openViewModal(kartela)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Detay"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {!kartela.silindi ? (
                          <>
                            <button
                              onClick={() => openEditModal(kartela)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Düzenle"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openArchiveModal(kartela)}
                              className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                              title="Arşivle"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRestore(kartela.id)}
                              className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                              title="Geri Al"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(kartela)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Kalıcı Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredKartelalar.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Kartela bulunamadı</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Kartela Listesi - Grid Görünümü */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredKartelalar.map((kartela) => (
            <div
              key={kartela.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${
                kartela.silindi ? 'opacity-75 bg-gray-50' : ''
              }`}
            >
              <div 
                className="h-2"
                style={{ backgroundColor: kartela.renk_kodu.startsWith('#') ? kartela.renk_kodu : `#${kartela.renk_kodu}` }}
              />
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{kartela.kartela_no}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getDurumRenk(kartela.durum)}`}>
                    {kartela.durum}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-gray-400" />
                    <span>{kartela.renk_adi} ({kartela.renk_kodu})</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{kartela.musteri_adi || 'Müşteri yok'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Grid className="h-4 w-4 text-gray-400" />
                    <span>{kartela.hucre?.hucre_kodu || kartela.hucre_kodu || 'Hücre yok'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-gray-400" />
                    <span>{kartela.goz_sayisi || 0} / {kartela.maksimum_goz || '-'} göz</span>
                  </div>
                  
                  {kartela.son_kullanim_tarihi && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <History className="h-4 w-4" />
                      <span>{new Date(kartela.son_kullanim_tarihi).toLocaleDateString('tr-TR')}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                  <button
                    onClick={() => openViewModal(kartela)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  
                  {!kartela.silindi ? (
                    <>
                      <button
                        onClick={() => openEditModal(kartela)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openArchiveModal(kartela)}
                        className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRestore(kartela.id)}
                        className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(kartela)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============ MODALLAR ============ */}

      {/* Yeni Kartela / Düzenleme Modalı */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  {modalMode === 'create' ? 'Yeni Kartela Ekle' : 'Kartela Düzenle'}
                </h2>
                <button onClick={() => setModalMode(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Temel Bilgiler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kartela No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.kartela_no}
                    onChange={(e) => setFormData({ ...formData, kartela_no: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: KRT-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                  <select
                    value={formData.durum || 'Aktif'}
                    onChange={(e) => setFormData({ ...formData, durum: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Pasif">Pasif</option>
                    <option value="Üretimde">Üretimde</option>
                    <option value="Tamamlandı">Tamamlandı</option>
                  </select>
                </div>
              </div>

              {/* Renk Bilgileri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Renk Kodu <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.renk_kodu}
                      onChange={(e) => setFormData({ ...formData, renk_kodu: e.target.value })}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="Örn: #FF0000 veya KIRMIZI"
                      list="renk-kodlari"
                    />
                    <datalist id="renk-kodlari">
                      {renkler.map((renk) => (
                        <option key={renk.renk_kodu} value={renk.renk_kodu} />
                      ))}
                    </datalist>
                    <div 
                      className="w-10 h-10 rounded-lg border"
                      style={{ backgroundColor: formData.renk_kodu.startsWith('#') ? formData.renk_kodu : `#${formData.renk_kodu}` }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Renk Adı</label>
                  <input
                    type="text"
                    value={formData.renk_adi}
                    onChange={(e) => setFormData({ ...formData, renk_adi: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Renk adı"
                    list="renk-adlari"
                  />
                  <datalist id="renk-adlari">
                    {renkler.map((renk) => (
                      <option key={renk.renk_kodu} value={renk.renk_adi} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Müşteri Bilgileri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri</label>
                  <select
                    value={formData.musteri_id || ''}
                    onChange={(e) => {
                      const musteriId = e.target.value ? parseInt(e.target.value) : null
                      const selectedMusteri = musteriler.find(m => m.id === musteriId)
                      setFormData({ 
                        ...formData, 
                        musteri_id: musteriId,
                        musteri_adi: selectedMusteri?.musteri_adi || ''
                      })
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Müşteri Seçin</option>
                    {musteriler.map((musteri) => (
                      <option key={musteri.id} value={musteri.id}>
                        {musteri.musteri_adi} {musteri.musteri_kodu ? `(${musteri.musteri_kodu})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proje Kodu</label>
                  <input
                    type="text"
                    value={formData.proje_kodu || ''}
                    onChange={(e) => setFormData({ ...formData, proje_kodu: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Proje kodu"
                  />
                </div>
              </div>

              {/* Hücre Bilgileri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hücre</label>
                  <select
                    value={formData.hucre_id || ''}
                    onChange={(e) => {
                      const hucreId = e.target.value ? parseInt(e.target.value) : null
                      const selectedHucre = hucreler.find(h => h.id === hucreId)
                      setFormData({ 
                        ...formData, 
                        hucre_id: hucreId,
                        hucre_kodu: selectedHucre?.hucre_kodu || ''
                      })
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Hücre Seçin</option>
                    {hucreler.map((hucre) => (
                      <option key={hucre.id} value={hucre.id}>
                        {hucre.hucre_kodu} {hucre.hucre_adi ? `- ${hucre.hucre_adi}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RPT Çalışması</label>
                  <input
                    type="text"
                    value={formData.rpt_calismasi || ''}
                    onChange={(e) => setFormData({ ...formData, rpt_calismasi: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="RPT çalışması"
                  />
                </div>
              </div>

              {/* Göz Bilgileri */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Göz Sayısı</label>
                  <input
                    type="number"
                    value={formData.goz_sayisi || ''}
                    onChange={(e) => setFormData({ ...formData, goz_sayisi: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maksimum Göz</label>
                  <input
                    type="number"
                    value={formData.maksimum_goz || ''}
                    onChange={(e) => setFormData({ ...formData, maksimum_goz: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Göz Dolum Oranı (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.goz_dolum_orani || ''}
                    onChange={(e) => setFormData({ ...formData, goz_dolum_orani: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Oluşturan Bilgisi (sadece edit modunda) */}
              {modalMode === 'edit' && selectedKartela && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Kayıt Bilgileri</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Oluşturan:</span>
                      <span className="ml-2 font-medium">
                        {getKullaniciAdi(selectedKartela.olusturan_kullanici_id)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Oluşturulma:</span>
                      <span className="ml-2 font-medium">
                        {selectedKartela.olusturulma_tarihi 
                          ? new Date(selectedKartela.olusturulma_tarihi).toLocaleString('tr-TR')
                          : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Son Kullanan:</span>
                      <span className="ml-2 font-medium">
                        {getKullaniciAdi(selectedKartela.son_kullanan_kullanici_id)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Son Kullanım:</span>
                      <span className="ml-2 font-medium">
                        {selectedKartela.son_kullanim_tarihi 
                          ? new Date(selectedKartela.son_kullanim_tarihi).toLocaleString('tr-TR')
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
                {loading ? 'İşleniyor...' : modalMode === 'create' ? 'Kartela Ekle' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detay Modalı */}
      {modalMode === 'view' && selectedKartela && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Kartela Detayı</h2>
                <button onClick={() => setModalMode(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-lg border-2"
                    style={{ backgroundColor: selectedKartela.renk_kodu.startsWith('#') ? selectedKartela.renk_kodu : `#${selectedKartela.renk_kodu}` }}
                  />
                  <div>
                    <h3 className="text-2xl font-bold">{selectedKartela.kartela_no}</h3>
                    <p className="text-gray-600">
                      {selectedKartela.renk_adi} ({selectedKartela.renk_kodu})
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDurumRenk(selectedKartela.durum)}`}>
                      {selectedKartela.durum}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Müşteri Bilgileri</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-600">Müşteri:</span> {selectedKartela.musteri_adi || '-'}</p>
                    {selectedKartela.musteri && (
                      <>
                        <p><span className="text-gray-600">Müşteri Kodu:</span> {selectedKartela.musteri.musteri_kodu || '-'}</p>
                      </>
                    )}
                    <p><span className="text-gray-600">Proje Kodu:</span> {selectedKartela.proje_kodu || '-'}</p>
                    <p><span className="text-gray-600">RPT Çalışması:</span> {selectedKartela.rpt_calismasi || '-'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Konum Bilgileri</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-600">Hücre:</span> {selectedKartela.hucre?.hucre_kodu || selectedKartela.hucre_kodu || '-'}</p>
                    {selectedKartela.hucre && (
                      <p><span className="text-gray-600">Hücre Adı:</span> {selectedKartela.hucre.hucre_adi || '-'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Göz Bilgileri</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-600">Göz Sayısı:</span> {selectedKartela.goz_sayisi || '0'}</p>
                    <p><span className="text-gray-600">Maksimum Göz:</span> {selectedKartela.maksimum_goz || '-'}</p>
                    <p><span className="text-gray-600">Dolum Oranı:</span> {selectedKartela.goz_dolum_orani ? `%${selectedKartela.goz_dolum_orani}` : '-'}</p>
                    <p><span className="text-gray-600">Toplam Kullanım:</span> {selectedKartela.toplam_kullanim_sayisi || '0'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Kullanım Bilgileri</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-600">Son Kullanım:</span> {
                      selectedKartela.son_kullanim_tarihi 
                        ? new Date(selectedKartela.son_kullanim_tarihi).toLocaleString('tr-TR')
                        : '-'
                    }</p>
                    <p><span className="text-gray-600">Son Kullanan:</span> {getKullaniciAdi(selectedKartela.son_kullanan_kullanici_id)}</p>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h4 className="font-medium text-gray-700 mb-3">Kayıt Bilgileri</h4>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Oluşturan</p>
                      <p className="font-medium">{getKullaniciAdi(selectedKartela.olusturan_kullanici_id)}</p>
                      <p className="text-sm text-gray-500">
                        {selectedKartela.olusturulma_tarihi && new Date(selectedKartela.olusturulma_tarihi).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    
                    {selectedKartela.arsive_alma_tarihi && (
                      <div>
                        <p className="text-sm text-gray-600">Arşive Alan</p>
                        <p className="font-medium">{getKullaniciAdi(selectedKartela.arsive_alan_kullanici_id)}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(selectedKartela.arsive_alma_tarihi).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    )}
                    
                    {selectedKartela.silinme_tarihi && (
                      <div>
                        <p className="text-sm text-gray-600">Silen</p>
                        <p className="font-medium">{getKullaniciAdi(selectedKartela.silen_kullanici_id)}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(selectedKartela.silinme_tarihi).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    )}
                  </div>
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

      {/* Arşivleme Modalı */}
      {modalMode === 'archive' && selectedKartela && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 text-purple-600 mb-4">
                <Archive className="h-8 w-8" />
                <h2 className="text-xl font-bold">Kartela Arşivle</h2>
              </div>
              
              <p className="text-gray-600 mb-6">
                <strong>{selectedKartela.kartela_no}</strong> ({selectedKartela.renk_adi}) 
                kartelasını arşive almak istediğinize emin misiniz?
              </p>
              
              <p className="text-sm text-gray-500 mb-6">
                Arşivlenen kartelalar ana listede görünmez, ancak arşiv sekmesinden erişilebilir.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  İptal
                </button>
                <button
                  onClick={handleArchive}
                  disabled={loading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'İşleniyor...' : 'Arşivle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Silme Modalı */}
      {modalMode === 'delete' && selectedKartela && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <Trash2 className="h-8 w-8" />
                <h2 className="text-xl font-bold">Kartela Sil</h2>
              </div>
              
              <p className="text-gray-600 mb-6">
                <strong>{selectedKartela.kartela_no}</strong> ({selectedKartela.renk_adi}) 
                kartelasını <span className="text-red-600 font-bold">kalıcı olarak</span> silmek istediğinize emin misiniz?
              </p>
              
              <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg mb-6">
                Bu işlem geri alınamaz! Kartela tüm verileriyle birlikte tamamen silinecektir.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  İptal
                </button>
                <button
                  onClick={handlePermanentDelete}
                  disabled={loading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Siliniyor...' : 'Kalıcı Olarak Sil'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KartelaCRUD
