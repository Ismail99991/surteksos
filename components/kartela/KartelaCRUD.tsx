'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Package, 
  Plus, 
  Search, 
  RefreshCw,
  X,
  Check,
  AlertCircle,
  Eye,
  Printer,
  History,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download
} from 'lucide-react'
import Link from 'next/link'
import QRCode from 'qrcode'

const supabase = createClient()

interface Kartela {
  id: number
  kartela_no: string
  renk_kodu: string
  renk_adi: string
  goz_sayisi?: number | null
  maksimum_goz?: number | null
  musteri_adi?: string | null
  proje_kodu?: string | null
  durum?: string | null
  silindi?: boolean | null
  karekod?: string | null
  olusturma_tarihi?: string | null
}

interface KartelaCRUDProps {
  currentUserId: number
  currentOdaId?: number
  onKartelaEklendi?: () => void
}

const KartelaCRUD: React.FC<KartelaCRUDProps> = ({ 
  currentUserId, 
  currentOdaId,
  onKartelaEklendi
}) => {
  const [kartelalar, setKartelalar] = useState<Kartela[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [selectedKartela, setSelectedKartela] = useState<Kartela | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')

  // İstatistikler için state
  const [stats, setStats] = useState({
    toplam: 0,
    aktif: 0,
    arsiv: 0,
    qrli: 0
  })

  // Sayfalama için state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showList, setShowList] = useState(false)
  const itemsPerPage = 50

  // ============ İSTATİSTİKLERİ ÇEK ============
  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Toplam kartela sayısı
      const { count: toplam, error: toplamError } = await supabase
        .from('kartelalar')
        .select('*', { count: 'exact', head: true })

      if (toplamError) throw toplamError

      // Aktif kartela sayısı (silindi = false)
      const { count: aktif, error: aktifError } = await supabase
        .from('kartelalar')
        .select('*', { count: 'exact', head: true })
        .eq('silindi', false)

      if (aktifError) throw aktifError

      // Arşiv kartela sayısı (silindi = true)
      const { count: arsiv, error: arsivError } = await supabase
        .from('kartelalar')
        .select('*', { count: 'exact', head: true })
        .eq('silindi', true)

      if (arsivError) throw arsivError

      // QR kodlu kartela sayısı
      const { count: qrli, error: qrliError } = await supabase
        .from('kartelalar')
        .select('*', { count: 'exact', head: true })
        .not('karekod', 'is', null)

      if (qrliError) throw qrliError

      setStats({
        toplam: toplam || 0,
        aktif: aktif || 0,
        arsiv: arsiv || 0,
        qrli: qrli || 0
      })
    } catch (err) {
      console.error('İstatistik çekme hatası:', err)
    }
  }

  // ============ VERİ ÇEKME ============
  const fetchKartelalar = async (page = currentPage) => {
    if (!showList) return
    
    try {
      setLoading(true)
      
      // Toplam kayıt sayısını al
      const { count, error: countError } = await supabase
        .from('kartelalar')
        .select('*', { count: 'exact', head: true })

      if (countError) throw countError
      
      setTotalCount(count || 0)
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))

      // Sayfadaki kayıtları al
      const from = (page - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      const { data, error } = await supabase
        .from('kartelalar')
        .select('*')
        .order('id', { ascending: false })
        .range(from, to)

      if (error) throw error
      
      setKartelalar(data || [])
    } catch (err) {
      console.error('Veri çekme hatası:', err)
      setError('Kartelalar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }

  // Sayfa değiştiğinde verileri çek
  useEffect(() => {
    if (showList) {
      fetchKartelalar(currentPage)
    }
  }, [currentPage, showList])

  // ============ LOG FONKSİYONU ============
  const islemLogla = async (
    islemTipi: string, 
    kartelaId: number, 
    kartelaNo: string, 
    detay: string,
    hata?: string
  ) => {
    try {
      const logData: any = {
        kartela_id: kartelaId,
        kartela_no: kartelaNo,
        hareket_tipi: islemTipi,
        aciklama: detay,
        kullanici_id: currentUserId,
        ip_adresi: null,
        tarih: new Date().toISOString()
      }

      if (hata) {
        logData.aciklama = `HATA: ${detay} - ${hata}`
      }

      const { error: logError } = await supabase
        .from('hareket_loglari')
        .insert([logData])

      if (logError) console.error('Log kaydedilemedi:', logError)
    } catch (err) {
      console.error('Loglama hatası:', err)
    }
  }

  // ============ QR KOD İŞLEMLERİ ============
  const generateQRCode = async (kartela: Kartela) => {
    try {
      const uniqueCode = `${kartela.kartela_no}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
      
      const qrDataUrl = await QRCode.toDataURL(uniqueCode, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
      
      setSelectedKartela(kartela)
      setQrCodeDataUrl(qrDataUrl)
      setQrModalOpen(true)

      const { error: updateError } = await supabase
        .from('kartelalar')
        .update({ karekod: uniqueCode })
        .eq('id', kartela.id)

      if (updateError) throw updateError

      await islemLogla(
        'QR_OLUSTURMA',
        kartela.id,
        kartela.kartela_no,
        `${kartela.renk_adi} (${kartela.renk_kodu}) için QR kod oluşturuldu`
      )

      // İstatistikleri güncelle
      fetchStats()
      
      // Listeyi güncelle
      if (showList) {
        fetchKartelalar(currentPage)
      }

    } catch (err) {
      console.error('QR Kod oluşturma hatası:', err)
      setError('QR kod oluşturulamadı')
      
      await islemLogla(
        'QR_OLUSTURMA',
        kartela.id,
        kartela.kartela_no,
        'QR kod oluşturma başarısız',
        err instanceof Error ? err.message : 'Bilinmeyen hata'
      )
    }
  }

  // ============ YAZDIRMA ============
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow || !selectedKartela) return

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kartela QR Kod - ${selectedKartela.kartela_no}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background-color: #f5f5f5;
            }
            .qr-container {
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 400px;
            }
            .qr-image {
              margin-bottom: 20px;
            }
            .qr-image img {
              max-width: 100%;
              height: auto;
            }
            .qr-info {
              border-top: 2px solid #eee;
              padding-top: 20px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 16px;
            }
            .info-label {
              font-weight: bold;
              color: #555;
            }
            .info-value {
              color: #333;
            }
            .kartela-no {
              font-size: 20px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 15px;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="qr-image">
              <img src="${qrCodeDataUrl}" alt="QR Kod" />
            </div>
            <div class="qr-info">
              <div class="kartela-no">Kartela No: ${selectedKartela.kartela_no}</div>
              <div class="info-row">
                <span class="info-label">Renk No:</span>
                <span class="info-value">${selectedKartela.renk_kodu}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Renk Adı:</span>
                <span class="info-value">${selectedKartela.renk_adi}</span>
              </div>
              ${selectedKartela.musteri_adi ? `
                <div class="info-row">
                  <span class="info-label">Müşteri:</span>
                  <span class="info-value">${selectedKartela.musteri_adi}</span>
                </div>
              ` : ''}
            </div>
          </div>
          <script>
            window.onload = () => window.print();
          </script>
        </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }

  // Sayfalama kontrolleri
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 text-lg">Kartelalar yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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

        {/* Üst Toolbar */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Kartela no, renk, müşteri ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setShowList(!showList)
                  if (!showList) {
                    setCurrentPage(1)
                  }
                }}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  showList 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Package className="h-5 w-5" />
                {showList ? 'Kartelalar Listeleniyor' : 'Kartelaları Listele'}
              </button>

              <Link
                href="/dashboard/kartela/yeni"
                className="flex-1 sm:flex-none bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Yeni Kartela
              </Link>

              <Link
                href="/dashboard/kartela/loglar"
                className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-700 transition-colors"
                title="İşlem Logları"
              >
                <History className="h-5 w-5" />
                Loglar
              </Link>

              <button
                onClick={() => {
                  fetchStats()
                  if (showList) {
                    fetchKartelalar(currentPage)
                  }
                }}
                className="p-3 border rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                title="Yenile"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* İstatistikler - Güncel verilerle */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-6 pt-6 border-t">
            <div className="bg-blue-50 rounded-lg p-4">
              <span className="text-sm text-blue-600 font-medium">Toplam Kartela</span>
              <p className="text-2xl font-bold text-blue-700">{stats.toplam.toLocaleString('tr-TR')}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <span className="text-sm text-green-600 font-medium">Aktif</span>
              <p className="text-2xl font-bold text-green-700">{stats.aktif.toLocaleString('tr-TR')}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <span className="text-sm text-purple-600 font-medium">Arşiv</span>
              <p className="text-2xl font-bold text-purple-700">{stats.arsiv.toLocaleString('tr-TR')}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <span className="text-sm text-amber-600 font-medium">QR&apos;li</span>
              <p className="text-2xl font-bold text-amber-700">{stats.qrli.toLocaleString('tr-TR')}</p>
            </div>
          </div>
        </div>

        {/* Kartela Listesi - Sadece showList true ise göster */}
        {showList && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* Sayfalama Bilgisi ve Kontrolleri */}
            <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                Toplam <span className="font-bold">{totalCount.toLocaleString('tr-TR')}</span> kayıt, 
                sayfa <span className="font-bold">{currentPage}</span> / <span className="font-bold">{totalPages}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="İlk Sayfa"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Önceki Sayfa"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium">
                  {currentPage}
                </span>
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Sonraki Sayfa"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Son Sayfa"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Yükleniyor Göstergesi */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Kartelalar yükleniyor...</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kartela No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Renk</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Göz</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {kartelalar
                        .filter(k => 
                          !searchTerm || 
                          k.kartela_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          k.renk_adi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          k.musteri_adi?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((kartela) => (
                        <tr key={kartela.id} className="hover:bg-gray-50 transition-colors">
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
                            {kartela.musteri_adi || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {kartela.goz_sayisi ? `${kartela.goz_sayisi} göz` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              kartela.durum === 'Aktif' ? 'bg-green-100 text-green-800' : 
                              kartela.durum === 'Arşiv' ? 'bg-purple-100 text-purple-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {kartela.durum || 'Aktif'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => generateQRCode(kartela)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="QR Kod Oluştur"
                            >
                              <Package className="h-4 w-4" />
                            </button>
                            {kartela.karekod && (
                              <span className="ml-1 text-xs text-green-600 font-medium">✓</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/dashboard/kartela/${kartela.id}`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                              title="Detay"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {kartelalar.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg">Kartela bulunamadı</p>
                    </div>
                  )}
                </div>

                {/* Alt Sayfalama */}
                <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Gösterilen: {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} / {totalCount.toLocaleString('tr-TR')}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      İlk
                    </button>
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      Önceki
                    </button>
                    
                    <span className="px-4 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                      Sayfa {currentPage} / {totalPages}
                    </span>
                    
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      Sonraki
                    </button>
                    <button
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      Son
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* QR Kod Modalı */}
      {qrModalOpen && selectedKartela && qrCodeDataUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Kartela QR Kodu</h2>
                <button onClick={() => setQrModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col items-center">
                {/* QR Kod */}
                <div className="bg-white p-4 rounded-lg border mb-6">
                  <img src={qrCodeDataUrl} alt="QR Kod" className="w-64 h-64" />
                </div>

                {/* Kartela Bilgileri */}
                <div className="w-full max-w-md bg-gray-50 rounded-lg p-6">
                  <div className="text-center mb-4">
                    <span className="text-lg font-bold text-blue-600">Kartela No: {selectedKartela.kartela_no}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-600">Renk No:</span>
                      <span className="text-gray-900">{selectedKartela.renk_kodu}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-600">Renk Adı:</span>
                      <span className="text-gray-900">{selectedKartela.renk_adi}</span>
                    </div>
                    {selectedKartela.musteri_adi && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-600">Müşteri:</span>
                        <span className="text-gray-900">{selectedKartela.musteri_adi}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setQrModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Kapat
              </button>
              <button
                onClick={handlePrint}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                <Printer className="h-4 w-4" />
                Yazdır
              </button>
              <a
                href={qrCodeDataUrl}
                download={`kartela-${selectedKartela.kartela_no}-qr.png`}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
              >
                <Download className="h-4 w-4" />
                İndir
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KartelaCRUD