'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Lucide icons (senin dosyanda bunlar var)
import {
  Search,
  Grid,
  Palette,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  X,
  Check,
  AlertCircle,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

// Color picker (projendeki mevcut kullanıma göre)
import { HexColorPicker, HexColorInput } from 'react-colorful'

const supabase = createClient()

type RenkMasasi = {
  id: number
  renk_kodu: string
  renk_adi: string
  pantone_kodu: string | null
  hex_kodu: string | null
  aktif: boolean
  olusturulma_tarihi: string | null
  pantone_notu: string | null
}

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null
type ViewMode = 'table' | 'grid'
type StatusFilter = 'all' | 'active' | 'passive'
type SortKey = 'newest' | 'oldest' | 'name_az' | 'name_za'

type RenkCRUDProps = {
  onRenkEklendi?: () => void
  onRenkGuncellendi?: () => void
  onRenkSilindi?: () => void
}

const PAGE_SIZE_OPTIONS = [25, 50, 100]

export default function RenkCRUD({ onRenkEklendi, onRenkGuncellendi, onRenkSilindi }: RenkCRUDProps) {

  
  const router = useRouter()

  // UI States
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedRenk, setSelectedRenk] = useState<RenkMasasi | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)

  // Server-side query states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortKey>('newest')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(50)

  // Data
  const [renkler, setRenkler] = useState<RenkMasasi[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Counts (DB’den doğru)
  const [totalAll, setTotalAll] = useState(0)
  const [activeAll, setActiveAll] = useState(0)
  const [pantoneAll, setPantoneAll] = useState(0)

  // Filtered total count (mevcut filtre+arama sonucu toplam kayıt)
  const [filteredTotal, setFilteredTotal] = useState(0)

  const passiveAll = useMemo(() => Math.max(0, totalAll - activeAll), [totalAll, activeAll])
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((filteredTotal || 0) / pageSize)),
    [filteredTotal, pageSize]
  )

  // Form data (Create/Edit)
  const [formData, setFormData] = useState({
    renk_kodu: '',
    renk_adi: '',
    pantone_kodu: '',
    hex_kodu: '',
    aktif: true,
    pantone_notu: '',
  })

  // ---------- Helpers ----------
  const resetForm = () => {
    setFormData({
      renk_kodu: '',
      renk_adi: '',
      pantone_kodu: '',
      hex_kodu: '',
      aktif: true,
      pantone_notu: '',
    })
    setShowColorPicker(false)
  }

  const getBgColor = (hexCode?: string | null, renkKodu?: string) => {
    if (hexCode) return hexCode
    if (renkKodu?.startsWith('#')) return renkKodu
    return '#cccccc'
  }

  const handleColorChange = (color: string) => {
    setFormData({ ...formData, hex_kodu: color })
  }

  const applyFiltersToQuery = (q: any) => {
    // status filter
    if (statusFilter === 'active') q = q.eq('aktif', true)
    if (statusFilter === 'passive') q = q.eq('aktif', false)

    // search (renk_kodu OR renk_adi OR pantone_kodu)
    const term = searchTerm.trim()
    if (term) {
      const pattern = `%${term}%`
      q = q.or(`renk_kodu.ilike.${pattern},renk_adi.ilike.${pattern},pantone_kodu.ilike.${pattern}`)
    }
    return q
  }

  const applySorting = (q: any) => {
    // deterministik sıralama için id ile stabilize ediyoruz
    switch (sort) {
      case 'newest':
        return q.order('id', { ascending: false })
      case 'oldest':
        return q.order('id', { ascending: true })
      case 'name_az':
        return q.order('renk_adi', { ascending: true, nullsFirst: false }).order('id', { ascending: false })
      case 'name_za':
        return q.order('renk_adi', { ascending: false, nullsFirst: false }).order('id', { ascending: false })
      default:
        return q.order('id', { ascending: false })
    }
  }

  const clampPage = (p: number) => Math.min(Math.max(1, p), totalPages)

  // ---------- DB fetch (counts) ----------
  const fetchCounts = async () => {
    try {
      // total
      const totalReq = supabase
        .from('renk_masalari')
        .select('id', { count: 'exact', head: true })

      // active
      const activeReq = supabase
        .from('renk_masalari')
        .select('id', { count: 'exact', head: true })
        .eq('aktif', true)

      // pantone count (pantone_kodu not null and not empty)
      const pantoneReq = supabase
        .from('renk_masalari')
        .select('id', { count: 'exact', head: true })
        .not('pantone_kodu', 'is', null)
        .neq('pantone_kodu', '')

      const [
        { count: totalCount, error: totalErr },
        { count: activeCount, error: activeErr },
        { count: pantoneCount, error: pantoneErr },
      ] = await Promise.all([totalReq, activeReq, pantoneReq])

      if (totalErr) throw totalErr
      if (activeErr) throw activeErr
      if (pantoneErr) throw pantoneErr

      setTotalAll(totalCount || 0)
      setActiveAll(activeCount || 0)
      setPantoneAll(pantoneCount || 0)
    } catch (e: any) {
      // Count hatası listeyi bozmasın
      console.error(e)
    }
  }

  // ---------- DB fetch (page) ----------
  const fetchRenkler = async () => {
    setLoading(true)
    setError(null)

    try {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let q = supabase
        .from('renk_masalari')
        .select('id, renk_kodu, renk_adi, pantone_kodu, hex_kodu, aktif, olusturulma_tarihi, pantone_notu', {
          count: 'exact',
        })

      q = applyFiltersToQuery(q)
      q = applySorting(q)
      q = q.range(from, to)

      const { data, count, error } = await q
      if (error) throw error

      setRenkler((data as RenkMasasi[]) || [])
      setFilteredTotal(count || 0)

      // Eğer filtre değişti ve page dışarı taştıysa düzelt
      const nextTotalPages = Math.max(1, Math.ceil((count || 0) / pageSize))
      if (page > nextTotalPages) {
        setPage(1)
      }
    } catch (e: any) {
      console.error(e)
      setRenkler([])
      setFilteredTotal(0)
      setError(e?.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // ---------- CRUD actions ----------
  const handleCreate = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!formData.renk_kodu.trim() || !formData.renk_adi.trim()) {
        throw new Error('Renk kodu ve renk adı zorunludur.')
      }

      const payload = {
        renk_kodu: formData.renk_kodu.trim(),
        renk_adi: formData.renk_adi.trim(),
        pantone_kodu: formData.pantone_kodu.trim() || null,
        hex_kodu: formData.hex_kodu.trim() || null,
        aktif: !!formData.aktif,
        pantone_notu: formData.pantone_notu.trim() || null,
      }

      const { error } = await supabase.from('renk_masalari').insert(payload)
      if (error) throw error

      setSuccess('Renk eklendi.')
      onRenkEklendi?.()
      setModalMode(null)
      resetForm()

      // counts + list
      await fetchCounts()
      await fetchRenkler()
      router.refresh()
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Renk eklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedRenk) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!formData.renk_adi.trim()) {
        throw new Error('Renk adı zorunludur.')
      }

      const payload = {
        renk_adi: formData.renk_adi.trim(),
        pantone_kodu: formData.pantone_kodu.trim() || null,
        hex_kodu: formData.hex_kodu.trim() || null,
        aktif: !!formData.aktif,
        pantone_notu: formData.pantone_notu.trim() || null,
      }

      const { error } = await supabase.from('renk_masalari').update(payload).eq('id', selectedRenk.id)
      if (error) throw error

      setSuccess('Renk güncellendi.')
      onRenkGuncellendi?.()
      setModalMode(null)
      resetForm()

      await fetchCounts()
      await fetchRenkler()
      router.refresh()
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Renk güncellenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedRenk) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase.from('renk_masalari').delete().eq('id', selectedRenk.id)
      if (error) throw error

      setSuccess('Renk silindi.')
      onRenkSilindi?.()
      setModalMode(null)
      setSelectedRenk(null)

      await fetchCounts()
      // silme sonrası sayfa boş kaldıysa bir önceki sayfaya dönmeyi dene
      const nextPage = clampPage(page)
      setPage(nextPage)
      await fetchRenkler()
      router.refresh()
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Renk silinemedi')
    } finally {
      setLoading(false)
    }
  }

  // ---------- Modal openers ----------
  const openViewModal = (renk: RenkMasasi) => {
    setSelectedRenk(renk)
    setModalMode('view')
  }

  const openEditModal = (renk: RenkMasasi) => {
    setSelectedRenk(renk)
    setFormData({
      renk_kodu: renk.renk_kodu || '',
      renk_adi: renk.renk_adi || '',
      pantone_kodu: renk.pantone_kodu || '',
      hex_kodu: renk.hex_kodu || '',
      aktif: !!renk.aktif,
      pantone_notu: renk.pantone_notu || '',
    })
    setShowColorPicker(false)
    setModalMode('edit')
  }

  const openDeleteModal = (renk: RenkMasasi) => {
    setSelectedRenk(renk)
    setModalMode('delete')
  }

  // ---------- Effects ----------
  useEffect(() => {
    void fetchCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // filtre/sort/pageSize değişince sayfa 1’e dön
  useEffect(() => {
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, sort, pageSize])

  useEffect(() => {
    void fetchRenkler()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, statusFilter, sort, pageSize])

  // ---------- Pagination window ----------
  const pageWindow = useMemo(() => {
    const w = 5
    const half = Math.floor(w / 2)
    let start = Math.max(1, page - half)
    let end = Math.min(totalPages, start + w - 1)
    start = Math.max(1, end - w + 1)
    const arr: number[] = []
    for (let i = start; i <= end; i++) arr.push(i)
    return arr
  }, [page, totalPages])

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
          {/* Search */}
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

            {/* Filters + Sort */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
                <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="text-sm outline-none bg-transparent"
                  title="Durum filtresi"
                >
                  <option value="all">Tümü</option>
                  <option value="active">Aktif</option>
                  <option value="passive">Pasif</option>
                </select>
              </div>

              <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
                <span className="text-xs text-gray-500 font-medium">Sırala</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="text-sm outline-none bg-transparent"
                >
                  <option value="newest">En yeni</option>
                  <option value="oldest">En eski</option>
                  <option value="name_az">Renk adı A-Z</option>
                  <option value="name_za">Renk adı Z-A</option>
                </select>
              </div>

              <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
                <span className="text-xs text-gray-500 font-medium">Sayfa boyutu</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="text-sm outline-none bg-transparent"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex gap-2">
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 ${viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                title="Tablo"
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                title="Grid"
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
              onClick={async () => {
                await fetchCounts()
                await fetchRenkler()
              }}
              className="p-2 border rounded-lg hover:bg-gray-50 text-gray-600"
              title="Yenile"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* İstatistikler (DOĞRU: DB count) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
          <div>
            <span className="text-sm text-gray-500">Toplam Renk</span>
            <p className="text-xl font-bold text-gray-900">{totalAll}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Aktif</span>
            <p className="text-xl font-bold text-green-600">{activeAll}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Pasif</span>
            <p className="text-xl font-bold text-gray-600">{passiveAll}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Pantone&apos;lu</span>
            <p className="text-xl font-bold text-purple-600">{pantoneAll}</p>
          </div>
        </div>

        {/* küçük info: filtre sonucu */}
        <div className="mt-3 text-sm text-gray-600">
          Filtre sonucu: <b className="text-gray-900">{filteredTotal}</b> • Sayfa: <b className="text-gray-900">{page}</b> /{' '}
          <b className="text-gray-900">{totalPages}</b>
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
                {renkler.map((renk) => (
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

            {!loading && renkler.length === 0 && (
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
          {renkler.map((renk) => (
            <div
              key={renk.id}
              className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-20" style={{ backgroundColor: getBgColor(renk.hex_kodu, renk.renk_kodu) }} />
              <div className="p-3">
                <div className="font-mono text-sm">{renk.renk_kodu}</div>
                <div className="font-medium truncate" title={renk.renk_adi}>
                  {renk.renk_adi}
                </div>
                {renk.pantone_kodu && (
                  <div className="text-xs text-gray-500 mt-1">Pantone: {renk.pantone_kodu}</div>
                )}
                <div className="flex justify-end gap-1 mt-2">
                  <button onClick={() => openViewModal(renk)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                    <Eye className="h-3 w-3" />
                  </button>
                  <button onClick={() => openEditModal(renk)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                    <Edit className="h-3 w-3" />
                  </button>
                  <button onClick={() => openDeleteModal(renk)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!loading && renkler.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Palette className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Renk bulunamadı</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      <div className="bg-white rounded-xl shadow-sm border p-3 flex items-center justify-between gap-3">
        <button
          onClick={() => setPage((p) => clampPage(p - 1))}
          disabled={loading || page <= 1}
          className="px-3 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" /> Önceki
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(1)}
            disabled={loading || page === 1}
            className="px-3 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            1
          </button>

          {pageWindow[0] > 2 && <span className="px-2 text-gray-400">…</span>}

          {pageWindow
            .filter((p) => p !== 1 && p !== totalPages)
            .map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                disabled={loading}
                className={`px-3 py-2 border rounded-lg ${
                  p === page ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}

          {pageWindow[pageWindow.length - 1] < totalPages - 1 && <span className="px-2 text-gray-400">…</span>}

          {totalPages > 1 && (
            <button
              onClick={() => setPage(totalPages)}
              disabled={loading || page === totalPages}
              className="px-3 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {totalPages}
            </button>
          )}
        </div>

        <button
          onClick={() => setPage((p) => clampPage(p + 1))}
          disabled={loading || page >= totalPages}
          className="px-3 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
        >
          Sonraki <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Create/Edit Modal with Color Picker */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{modalMode === 'create' ? 'Yeni Renk Ekle' : 'Renk Düzenle'}</h2>
                <button
                  onClick={() => {
                    setModalMode(null)
                    setSelectedRenk(null)
                    setShowColorPicker(false)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Color Picker Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Renk Seçici</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm hover:scale-105 transition-transform"
                    style={{
                      backgroundColor:
                        formData.hex_kodu ||
                        (formData.renk_kodu.startsWith('#') ? formData.renk_kodu : '#cccccc'),
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
                      <HexColorPicker color={formData.hex_kodu || '#cccccc'} onChange={handleColorChange} />
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
                  disabled={modalMode === 'edit'} // senin eski davranışın
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Pantone Kodu</label>
                <input
                  type="text"
                  value={formData.pantone_kodu}
                  onChange={(e) => setFormData({ ...formData, pantone_kodu: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: 186 C"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pantone Notu</label>
                <textarea
                  value={formData.pantone_notu}
                  onChange={(e) => setFormData({ ...formData, pantone_notu: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Not..."
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
                onClick={() => {
                  setModalMode(null)
                  setSelectedRenk(null)
                  setShowColorPicker(false)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                İptal
              </button>
              <button
                onClick={modalMode === 'create' ? handleCreate : handleUpdate}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" /> İşleniyor...
                  </>
                ) : modalMode === 'create' ? (
                  'Renk Ekle'
                ) : (
                  'Değişiklikleri Kaydet'
                )}
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
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">Pantone Kodu:</span>
                  <span className="font-mono">{selectedRenk.pantone_kodu || '-'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">Hex Kodu:</span>
                  <span className="font-mono">{selectedRenk.hex_kodu || '-'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">Durum:</span>
                  <span>{selectedRenk.aktif ? 'Aktif' : 'Pasif'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">Pantone Notu:</span>
                  <span className="text-gray-800 text-right line-clamp-3 max-w-[220px]">
                    {selectedRenk.pantone_notu || '-'}
                  </span>
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
                <strong>{selectedRenk.renk_adi}</strong> ({selectedRenk.renk_kodu}) rengini silmek istediğinize emin misiniz?
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

// Heroicons kullandığım yerde import etmemek için mini spinner ikonu (senin projende heroicons yoksa kaldır)
function ArrowPathIcon(props: any) {
  return <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M4 4v6h6" stroke="currentColor" strokeWidth="2"/><path d="M20 20v-6h-6" stroke="currentColor" strokeWidth="2"/><path d="M20 8a8 8 0 0 0-14.9-3M4 16a8 8 0 0 0 14.9 3" stroke="currentColor" strokeWidth="2"/></svg>
}