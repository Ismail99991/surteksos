'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
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
  Printer,
  History
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
}

interface KartelaCRUDProps {
  currentUserId: number
  currentOdaId?: number
}

const KartelaCRUD: React.FC<KartelaCRUDProps> = ({ currentUserId, currentOdaId }) => {
  const [kartelalar, setKartelalar] = useState<Kartela[]>([])
  const [filteredKartelalar, setFilteredKartelalar] = useState<Kartela[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [selectedKartela, setSelectedKartela] = useState<Kartela | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')

  // ============ LOG FONKSİYONU ============
  const islemLogla = async (
    islemTipi: string, 
    kartelaId: number, 
    kartelaNo: string, 
    detay: string,
    hata?: string
  ) => {
    try {
      const { error: logError } = await supabase
        .from('hareket_loglari')
        .insert([{
          kullanici_id: currentUserId,
          oda_id: currentOdaId || null,
          islem_tipi: islemTipi,
          kayit_id: kartelaId,
          kayit_tipi: 'kartela',
          aciklama: detay,
          hata: hata || null,
          ip_adresi: null,
          tarayici: navigator.userAgent,
          created_at: new Date().toISOString()
        }])

      if (logError) console.error('Log kaydedilemedi:', logError)
    } catch (err) {
      console.error('Loglama hatası:', err)
    }
  }

  // ============ VERİ ÇEKME ============
  useEffect(() => {
    fetchKartelalar()
  }, [showArchived])

  const fetchKartelalar = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('kartelalar')
        .select('*')
        .order('id', { ascending: false })

      if (!showArchived) {
        query = query.eq('silindi', false)
      }

      const { data, error } = await query

      if (error) throw error
      setKartelalar(data || [])
      setFilteredKartelalar(data || [])
    } catch (err) {
      console.error('Veri çekme hatası:', err)
      setError('Kartelalar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // ============ FİLTRELEME ============
  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const filtered = kartelalar.filter(k => 
        k.kartela_no?.toLowerCase().includes(term) ||
        k.renk_adi?.toLowerCase().includes(term) ||
        k.musteri_adi?.toLowerCase().includes(term)
      )
      setFilteredKartelalar(filtered)
    } else {
      setFilteredKartelalar(kartelalar)
    }
  }, [searchTerm, kartelalar])

  // ============ QR KOD İŞLEMLERİ ============
  const generateQRCode = async (kartela: Kartela) => {
    try {
      // Benzersiz karekod içeriği
      const uniqueCode = `${kartela.kartela_no}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
      
      // QR kodu oluştur
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

      // Karekodu veritabanına kaydet
      const { error: updateError } = await supabase
        .from('kartelalar')
        .update({ karekod: uniqueCode })
        .eq('id', kartela.id)

      if (updateError) throw updateError

      // QR oluşturma logu
      await islemLogla(
        'QR_OLUSTURMA',
        kartela.id,
        kartela.kartela_no,
        `${kartela.renk_adi} (${kartela.renk_kodu}) için QR kod oluşturuldu`
      )

    } catch (err) {
      console.error('QR Kod oluşturma hatası:', err)
      setError('QR kod oluşturulamadı')
      
      // Hata logu
      await islemLogla(
        'QR_OLUSTURMA',
        kartela.id,
        kartela.kartela_no,
        'QR kod oluşturma başarısız',
        err instanceof Error ? err.message : 'Bilinmeyen hata'
      )
    }
  }

  // ============ ARŞİV İŞLEMLERİ ============
  const handleArchive = async (kartela: Kartela) => {
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('kartelalar')
        .update({ 
          silindi: true,
          durum: 'Arşiv'
        })
        .eq('id', kartela.id)

      if (error) throw error

      // Arşivleme logu
      await islemLogla(
        'ARSIVLEME',
        kartela.id,
        kartela.kartela_no,
        `${kartela.renk_adi} (${kartela.renk_kodu}) arşive kaldırıldı`
      )

      setSuccess('Kartela arşive kaldırıldı!')
      fetchKartelalar()
    } catch (err) {
      console.error('Arşivleme hatası:', err)
      setError('Arşivleme başarısız')
      
      // Hata logu
      await islemLogla(
        'ARSIVLEME',
        kartela.id,
        kartela.kartela_no,
        'Arşivleme başarısız',
        err instanceof Error ? err.message : 'Bilinmeyen hata'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (id: number) => {
    try {
      setLoading(true)
      
      // Önce kartela bilgisini al
      const { data: kartela, error: fetchError } = await supabase
        .from('kartelalar')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      const { error } = await supabase
        .from('kartelalar')
        .update({ 
          silindi: false,
          durum: 'Aktif'
        })
        .eq('id', id)

      if (error) throw error

      // Geri alma logu
      await islemLogla(
        'GERI_ALMA',
        id,
        kartela.kartela_no,
        `${kartela.renk_adi} (${kartela.renk_kodu}) arşivden geri alındı`
      )

      setSuccess('Kartela arşivden geri alındı!')
      fetchKartelalar()
    } catch (err) {
      console.error('Geri alma hatası:', err)
      setError('Geri alma işlemi başarısız')
      
      // Hata logu
      const kartelaNo = kartelalar.find(k => k.id === id)?.kartela_no || 'Bilinmiyor'
      await islemLogla(
        'GERI_ALMA',
        id,
        kartelaNo,
        'Arşivden geri alma başarısız',
        err instanceof Error ? err.message : 'Bilinmeyen hata'
      )
    } finally {
      setLoading(false)
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

          <div className="flex gap-2">
            <Link
              href="/dashboard/kartela/yeni"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Yeni Kartela
            </Link>

            <Link
              href="/dashboard/kartela/loglar"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-700"
              title="İşlem Logları"
            >
              <History className="h-4 w-4" />
              Loglar
            </Link>

            <button
              onClick={fetchKartelalar}
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
              {kartelalar.filter(k => !k.silindi).length}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Arşiv</span>
            <p className="text-xl font-bold text-purple-600">
              {kartelalar.filter(k => k.silindi).length}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">QR'li</span>
            <p className="text-xl font-bold text-blue-600">
              {kartelalar.filter(k => k.karekod).length}
            </p>
          </div>
        </div>
      </div>

      {/* Kartela Listesi - Tablo */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
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
                    {!kartela.silindi && (
                      <button
                        onClick={() => generateQRCode(kartela)}
                        className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                        title="QR Kod Oluştur"
                      >
                        <Package className="h-4 w-4" />
                      </button>
                    )}
                    {kartela.karekod && (
                      <span className="ml-1 text-xs text-green-600">✓</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/kartela/${kartela.id}`}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Detay"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      
                      {!kartela.silindi ? (
                        <>
                          <Link
                            href={`/dashboard/kartela/${kartela.id}/duzenle`}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Düzenle"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleArchive(kartela)}
                            className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                            title="Arşive Kaldır"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleRestore(kartela.id)}
                          className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                          title="Geri Al"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
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

      {/* QR Kod Modalı */}
      {qrModalOpen && selectedKartela && qrCodeDataUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Kartela QR Kodu</h2>
                <button onClick={() => setQrModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
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
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Kapat
              </button>
              <button
                onClick={handlePrint}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Yazdır
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KartelaCRUD
