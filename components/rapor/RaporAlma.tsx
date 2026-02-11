'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Filter, 
  Printer, 
  FileText, 
  Package,
  Layers,
  Building,
  User,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

type RaporTipi = 'genel' | 'kartela' | 'hucre' | 'transfer' | 'musteri' | 'kullanici'

interface RaporAlmaProps {
  currentOdaId?: number
  currentUserId?: number
}

type RaporFiltreleri = {
  baslangicTarihi: string
  bitisTarihi: string
  durum?: string
  musteri?: string
  oda?: string
  raporTipi: RaporTipi
}

export default function RaporAlma({ currentOdaId, currentUserId }: RaporAlmaProps) {
  const [raporTipi, setRaporTipi] = useState<RaporTipi>('genel')
  const [filtreler, setFiltreler] = useState<RaporFiltreleri>({
    baslangicTarihi: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    bitisTarihi: new Date().toISOString().split('T')[0],
    raporTipi: 'genel'
  })
  const [raporVerisi, setRaporVerisi] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [odalar, setOdalar] = useState<any[]>([])
  const [musteriler, setMusteriler] = useState<any[]>([])

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    const [odalarRes, musterilerRes] = await Promise.all([
      supabase.from('odalar').select('id, oda_kodu, oda_adi').eq('aktif', true),
      supabase.from('musteriler').select('musteri_kodu, musteri_adi').eq('durum', 'AKTIF')
    ])
    
    setOdalar(odalarRes.data || [])
    setMusteriler(musterilerRes.data || [])
  }

  const formatTarih = (tarih: string): string => {
    if (!tarih) return ''
    try {
      const date = new Date(tarih)
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return tarih
    }
  }

  const prepareExcelData = (data: any, reportType: RaporTipi): any[][] => {
    switch (reportType) {
      case 'genel':
        if (!data?.kartelaIstatistikleri) return [['Veri bulunamadı']]
        
        const kartelaToplam = Object.values(data.kartelaIstatistikleri)
          .reduce((a: number, b: unknown) => a + (typeof b === 'number' ? b : 0), 0)
        
        const ortalamaDoluluk = data.hucreDoluluk && data.hucreDoluluk.toplamHucre > 0 
          ? Math.round(data.hucreDoluluk.ortalamaDoluluk / data.hucreDoluluk.toplamHucre)
          : 0
        
        return [
          ['SURTEKS OS - GENEL İSTATİSTİKLER RAPORU'],
          [`Rapor Tarihi: ${formatTarih(new Date().toISOString())}`],
          [`Dönem: ${filtreler.baslangicTarihi} - ${filtreler.bitisTarihi}`],
          [''],
          ['KATEGORİ', 'DEĞER'],
          ['Toplam Kartela Sayısı', kartelaToplam],
          ['Aktif Kartela', data.kartelaIstatistikleri['AKTIF'] || 0],
          ['Dolu Kartela', data.kartelaIstatistikleri['DOLU'] || 0],
          ['Arşiv Kartela', data.kartelaIstatistikleri['KARTELA_ARSIV'] || 0],
          ['Transfer Sayısı', data.transferSayisi || 0],
          ['Müşteriye Ait Kartela', data.musteriKartelaSayisi || 0],
          ['Toplam Hücre Sayısı', data.hucreDoluluk?.toplamHucre || 0],
          ['Dolu Hücre', data.hucreDoluluk?.doluHucre || 0],
          ['Boş Hücre', data.hucreDoluluk?.bosHucre || 0],
          ['Ortalama Doluluk Oranı', `${ortalamaDoluluk}%`],
          [''],
          ['KARTELA DURUMLARI'],
          ...Object.entries(data.kartelaIstatistikleri).map(([key, value]) => [
            key.replace(/_/g, ' '),
            value
          ])
        ]

      case 'kartela':
        if (!Array.isArray(data) || data.length === 0) return [['Kartela verisi bulunamadı']]
        
        return [
          ['SURTEKS OS - KARTELA RAPORU'],
          [`Rapor Tarihi: ${formatTarih(new Date().toISOString())}`],
          [`Dönem: ${filtreler.baslangicTarihi} - ${filtreler.bitisTarihi}`],
          [''],
          ['KARTELA KODU', 'RENK KODU', 'PANTONE', 'MÜŞTERİ', 'DURUM', 'HÜCRE', 'OLUŞTURULMA', 'SON GÜNCELLEME'],
          ...data.map(item => [
            item.kartela_kodu || '',
            item.renk_masalari?.hex_kodu || '',
            item.renk_masalari?.pantone_kodu || item.renk_kodu || '',
            item.musteri_adi || '',
            item.durum || '',
            item.hucreler?.hucre_kodu || item.hucre_kodu || '',
            formatTarih(item.olusturulma_tarihi),
            formatTarih(item.guncellenme_tarihi || item.olusturulma_tarihi)
          ])
        ]

      case 'hucre':
        if (!Array.isArray(data) || data.length === 0) return [['Hücre verisi bulunamadı']]
        
        return [
          ['SURTEKS OS - HÜCRE RAPORU'],
          [`Rapor Tarihi: ${formatTarih(new Date().toISOString())}`],
          [''],
          ['HÜCRE KODU', 'RAF', 'DOLAP', 'ODA', 'KAPASİTE', 'MEVCUT', 'DOLULUK %', 'DURUM'],
          ...data.map(item => [
            item.hucre_kodu || '',
            item.raflar?.raf_kodu || '',
            item.raflar?.dolaplar?.dolap_kodu || '',
            item.raflar?.dolaplar?.odalar?.oda_kodu || '',
            item.kapasite || 0,
            item.mevcut_kartela_sayisi || 0,
            `${item.dolulukOrani || 0}%`,
            item.aktif ? 'AKTİF' : 'PASİF'
          ])
        ]

      case 'transfer':
        if (!Array.isArray(data) || data.length === 0) return [['Transfer verisi bulunamadı']]
        
        return [
          ['SURTEKS OS - TRANSFER RAPORU'],
          [`Rapor Tarihi: ${formatTarih(new Date().toISOString())}`],
          [`Dönem: ${filtreler.baslangicTarihi} - ${filtreler.bitisTarihi}`],
          [''],
          ['TARİH', 'KULLANICI', 'HAREKET TİPİ', 'KAYNAK', 'HEDEF', 'KARTELA', 'AÇIKLAMA'],
          ...data.map(item => [
            formatTarih(item.tarih),
            item.kullanicilar ? `${item.kullanicilar.ad} ${item.kullanicilar.soyad}` : '',
            item.hareket_tipi || '',
            item.kaynak_hucre || '',
            item.hedef_hucre || '',
            item.kartela_sayisi || 0,
            item.aciklama || ''
          ])
        ]

      case 'musteri':
        if (!Array.isArray(data) || data.length === 0) return [['Müşteri verisi bulunamadı']]
        
        return [
          ['SURTEKS OS - MÜŞTERİ RAPORU'],
          [`Rapor Tarihi: ${formatTarih(new Date().toISOString())}`],
          [`Dönem: ${filtreler.baslangicTarihi} - ${filtreler.bitisTarihi}`],
          [''],
          ['MÜŞTERİ ADI', 'DURUM', 'KARTELA SAYISI'],
          ...data.map(item => [
            item.musteri_adi || '',
            item.durum || '',
            item.kartela_sayisi || 0
          ])
        ]

      case 'kullanici':
        if (!Array.isArray(data) || data.length === 0) return [['Kullanıcı verisi bulunamadı']]
        
        return [
          ['SURTEKS OS - KULLANICI RAPORU'],
          [`Rapor Tarihi: ${formatTarih(new Date().toISOString())}`],
          [`Dönem: ${filtreler.baslangicTarihi} - ${filtreler.bitisTarihi}`],
          [''],
          ['KULLANICI', 'HAREKET TİPİ', 'İŞLEM SAYISI'],
          ...data.map(item => [
            item.kullanicilar ? `${item.kullanicilar.ad} ${item.kullanicilar.soyad}` : '',
            item.hareket_tipi || '',
            item.islem_sayisi || 0
          ])
        ]

      default:
        return [['Veri bulunamadı']]
    }
  }

  const exportToExcel = (data: any, reportType: RaporTipi) => {
    try {
      const excelData = prepareExcelData(data, reportType)
      const ws = XLSX.utils.aoa_to_sheet(excelData)
      
      const colWidths = excelData[0] 
        ? excelData[0].map((_, colIndex) => {
            const maxLength = Math.max(
              ...excelData.map(row => 
                String(row[colIndex] || '').length
              )
            )
            return { wch: Math.min(Math.max(maxLength, 10), 50) }
          })
        : []
      
      ws['!cols'] = colWidths
      
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < excelData[0]?.length; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
          if (ws[cellAddress]) {
            ws[cellAddress].s = {
              font: { bold: true, sz: row === 0 ? 14 : 11 },
              alignment: { horizontal: 'center' }
            }
          }
        }
      }
      
      const headerRow = 3
      for (let col = 0; col < excelData[headerRow]?.length; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col })
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4F46E5" } },
            alignment: { horizontal: 'center' }
          }
        }
      }
      
      const wb = XLSX.utils.book_new()
      const sheetName = reportType.charAt(0).toUpperCase() + reportType.slice(1)
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
      
      const tarih = new Date().toISOString().split('T')[0]
      const fileName = `SurteksOS_${reportType}_${filtreler.baslangicTarihi}_${filtreler.bitisTarihi}_${tarih}.xlsx`
      
      const excelBuffer = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'array' 
      })
      
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      
      saveAs(blob, fileName)
      
    } catch (error) {
      console.error('Excel oluşturma hatası:', error)
      alert('Excel dosyası oluşturulurken bir hata oluştu.')
    }
  }

  const raporGetir = async () => {
    setLoading(true)
    try {
      let data: any = null
      
      switch (filtreler.raporTipi) {
        case 'genel':
          data = await genelRaporGetir()
          break
        case 'kartela':
          data = await kartelaRaporuGetir()
          break
        case 'hucre':
          data = await hucreRaporuGetir()
          break
        case 'transfer':
          data = await transferRaporuGetir()
          break
        case 'musteri':
          data = await musteriRaporuGetir()
          break
        case 'kullanici':
          data = await kullaniciRaporuGetir()
          break
      }
      
      setRaporVerisi(data)
    } catch (error) {
      console.error('Rapor hatası:', error)
      alert('Rapor oluşturulurken hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  const genelRaporGetir = async () => {
    const [kartelalar, hucreler, transferler, musteriler] = await Promise.all([
      supabase.from('kartelalar')
        .select('durum, olusturulma_tarihi', { count: 'exact' })
        .eq('silindi', false)
        .gte('olusturulma_tarihi', filtreler.baslangicTarihi)
        .lte('olusturulma_tarihi', filtreler.bitisTarihi + ' 23:59:59'),
      
      supabase.from('hucreler')
        .select('kapasite, mevcut_kartela_sayisi, aktif')
        .eq('aktif', true),
      
      supabase.from('hareket_loglari')
        .select('*')
        .gte('tarih', filtreler.baslangicTarihi)
        .lte('tarih', filtreler.bitisTarihi + ' 23:59:59'),
      
      supabase.from('kartelalar')
        .select('musteri_adi', { count: 'exact' })
        .not('musteri_adi', 'is', null)
        .gte('olusturulma_tarihi', filtreler.baslangicTarihi)
        .lte('olusturulma_tarihi', filtreler.bitisTarihi + ' 23:59:59')
    ])

    return {
      kartelaIstatistikleri: kartelalar.data?.reduce((acc: any, kartela) => {
        if (kartela.durum) {
          acc[kartela.durum] = (acc[kartela.durum] || 0) + 1
        }
        return acc
      }, {}),
      hucreDoluluk: hucreler.data?.reduce((acc, hucre) => {
        const doluluk = hucre.kapasite ? (hucre.mevcut_kartela_sayisi || 0) / hucre.kapasite * 100 : 0
        acc.toplamHucre = (acc.toplamHucre || 0) + 1
        acc.doluHucre = (acc.doluHucre || 0) + (doluluk >= 100 ? 1 : 0)
        acc.bosHucre = (acc.bosHucre || 0) + (doluluk === 0 ? 1 : 0)
        acc.ortalamaDoluluk = (acc.ortalamaDoluluk || 0) + doluluk
        return acc
      }, { toplamHucre: 0, doluHucre: 0, bosHucre: 0, ortalamaDoluluk: 0 }),
      transferSayisi: transferler.data?.length || 0,
      musteriKartelaSayisi: musteriler.data?.length || 0
    }
  }

  const kartelaRaporuGetir = async () => {
    let query = supabase
      .from('kartelalar')
      .select(`
        *,
        renk_masalari!left (pantone_kodu, hex_kodu),
        hucreler!left (hucre_kodu, hucre_adi)
      `)
      .eq('silindi', false)
      .gte('olusturulma_tarihi', filtreler.baslangicTarihi)
      .lte('olusturulma_tarihi', filtreler.bitisTarihi + ' 23:59:59')
      .order('olusturulma_tarihi', { ascending: false })

    if (filtreler.durum && filtreler.durum !== 'all') {
      query = query.eq('durum', filtreler.durum)
    }

    if (filtreler.musteri && filtreler.musteri !== 'all') {
      query = query.eq('musteri_adi', filtreler.musteri)
    }

    const { data } = await query
    return data
  }

  const hucreRaporuGetir = async () => {
    const { data } = await supabase
      .from('hucreler')
      .select(`
        *,
        raflar!left (raf_kodu, raf_adi),
        raflar!left (dolaplar!left (dolap_kodu, dolap_adi)),
        raflar!left (dolaplar!left (odalar!left (oda_kodu, oda_adi)))
      `)
      .eq('aktif', true)
      .order('hucre_kodu')

    return data?.map(hucre => ({
      ...hucre,
      dolulukOrani: hucre.kapasite ? 
        Math.round(((hucre.mevcut_kartela_sayisi || 0) / hucre.kapasite) * 100) : 0
    }))
  }

  const transferRaporuGetir = async () => {
    const { data } = await supabase
      .from('hareket_loglari')
      .select(`
        *,
        kullanicilar!left (ad, soyad)
      `)
      .eq('hareket_tipi', 'TRANSFER')
      .gte('tarih', filtreler.baslangicTarihi)
      .lte('tarih', filtreler.bitisTarihi + ' 23:59:59')
      .order('tarih', { ascending: false })

    return data
  }

  const musteriRaporuGetir = async () => {
    const { data } = await supabase
      .from('kartelalar')
      .select(`
        musteri_adi,
        durum
      `)
      .not('musteri_adi', 'is', null)
      .gte('olusturulma_tarihi', filtreler.baslangicTarihi)
      .lte('olusturulma_tarihi', filtreler.bitisTarihi + ' 23:59:59')

    const grouped = data?.reduce((acc: any[], item: any) => {
      const existing = acc.find(x => x.musteri_adi === item.musteri_adi && x.durum === item.durum)
      if (existing) {
        existing.kartela_sayisi += 1
      } else {
        acc.push({ ...item, kartela_sayisi: 1 })
      }
      return acc
    }, [])

    return grouped?.sort((a, b) => a.musteri_adi.localeCompare(b.musteri_adi))
  }

  const kullaniciRaporuGetir = async () => {
    const { data } = await supabase
      .from('hareket_loglari')
      .select(`
        kullanici_id,
        kullanicilar!left (ad, soyad),
        hareket_tipi
      `)
      .gte('tarih', filtreler.baslangicTarihi)
      .lte('tarih', filtreler.bitisTarihi + ' 23:59:59')

    const grouped = data?.reduce((acc: any[], item: any) => {
      const key = `${item.kullanici_id}_${item.hareket_tipi}`
      const existing = acc.find(x => `${x.kullanici_id}_${x.hareket_tipi}` === key)
      if (existing) {
        existing.islem_sayisi += 1
      } else {
        acc.push({ ...item, islem_sayisi: 1 })
      }
      return acc
    }, [])

    return grouped?.sort((a, b) => b.islem_sayisi - a.islem_sayisi)
  }

  const raporIndir = (format: 'pdf' | 'excel') => {
    if (!raporVerisi) {
      alert('Önce rapor oluşturun!')
      return
    }

    if (format === 'excel') {
      exportToExcel(raporVerisi, filtreler.raporTipi)
    } else {
      const dataStr = JSON.stringify(raporVerisi, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      
      const link = document.createElement('a')
      link.setAttribute('href', dataUri)
      link.setAttribute('download', `rapor_${filtreler.raporTipi}_${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const raporYazdir = () => {
    window.print()
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-blue-600" />
            Rapor Alma Sistemi
          </h2>
          <p className="text-gray-600 mt-2">Detaylı analiz ve raporlar oluşturun</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => raporIndir('excel')}
            className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all shadow-sm"
            disabled={!raporVerisi || loading}
          >
            <Download className="h-4 w-4" />
            Excel İndir
          </button>
          <button
            onClick={() => raporIndir('pdf')}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all shadow-sm"
            disabled={!raporVerisi || loading}
          >
            <FileText className="h-4 w-4" />
            JSON İndir
          </button>
          <button
            onClick={raporYazdir}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all shadow-sm"
            disabled={!raporVerisi || loading}
          >
            <Printer className="h-4 w-4" />
            Yazdır
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          Rapor Filtreleri
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rapor Tipi</label>
            <select
              value={filtreler.raporTipi}
              onChange={(e) => setFiltreler({...filtreler, raporTipi: e.target.value as RaporTipi})}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="genel">📊 Genel İstatistikler</option>
              <option value="kartela">📦 Kartela Raporu</option>
              <option value="hucre">📍 Hücre Raporu</option>
              <option value="transfer">🔄 Transfer Raporu</option>
              <option value="musteri">🏢 Müşteri Raporu</option>
              <option value="kullanici">👤 Kullanıcı Raporu</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={filtreler.baslangicTarihi}
              onChange={(e) => setFiltreler({...filtreler, baslangicTarihi: e.target.value})}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş Tarihi</label>
            <input
              type="date"
              value={filtreler.bitisTarihi}
              onChange={(e) => setFiltreler({...filtreler, bitisTarihi: e.target.value})}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {filtreler.raporTipi === 'kartela' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
                <select
                  value={filtreler.durum || 'all'}
                  onChange={(e) => setFiltreler({...filtreler, durum: e.target.value === 'all' ? undefined : e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="AKTIF">✅ Aktif</option>
                  <option value="DOLU">🔵 Dolu</option>
                  <option value="KARTELA_ARSIV">📦 Arşiv</option>
                  <option value="KALITE_ARSIV">🏷️ Kalite Arşivi</option>
                  <option value="KULLANIM_DISI">⛔ Kullanım Dışı</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Müşteri</label>
                <select
                  value={filtreler.musteri || 'all'}
                  onChange={(e) => setFiltreler({...filtreler, musteri: e.target.value === 'all' ? undefined : e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="all">Tüm Müşteriler</option>
                  {musteriler.map((m) => (
                    <option key={m.musteri_kodu} value={m.musteri_adi}>
                      {m.musteri_adi}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <button
          onClick={raporGetir}
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-3 font-medium"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Rapor Hazırlanıyor...
            </>
          ) : (
            <>
              <BarChart3 className="h-5 w-5" />
              Raporu Getir
            </>
          )}
        </button>
      </div>

      {raporVerisi && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Rapor Sonuçları</h3>
            <span className="text-sm text-gray-500">
              {formatTarih(filtreler.baslangicTarihi)} - {formatTarih(filtreler.bitisTarihi)}
            </span>
          </div>

          {filtreler.raporTipi === 'genel' && raporVerisi.kartelaIstatistikleri && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Toplam Kartela</p>
                    <p className="text-3xl font-bold text-blue-900 mt-2">
                      {Object.values(raporVerisi.kartelaIstatistikleri).reduce((a: number, b: unknown) => a + (typeof b === 'number' ? b : 0), 0)}
                    </p>
                  </div>
                  <Package className="h-10 w-10 text-blue-500" />
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-medium">Aktif Kartela</p>
                    <p className="text-3xl font-bold text-green-900 mt-2">
                      {raporVerisi.kartelaIstatistikleri['AKTIF'] || 0}
                    </p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
              </div>

              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700 font-medium">Transfer Sayısı</p>
                    <p className="text-3xl font-bold text-purple-900 mt-2">
                      {raporVerisi.transferSayisi}
                    </p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-purple-500" />
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700 font-medium">Hücre Doluluk</p>
                    <p className="text-3xl font-bold text-amber-900 mt-2">
                      {raporVerisi.hucreDoluluk ? Math.round(raporVerisi.hucreDoluluk.ortalamaDoluluk / raporVerisi.hucreDoluluk.toplamHucre) : 0}%
                    </p>
                  </div>
                  <Layers className="h-10 w-10 text-amber-500" />
                </div>
              </div>
            </div>
          )}

          {Array.isArray(raporVerisi) && raporVerisi.length > 0 && (
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(raporVerisi[0]).map((key) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {key.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {raporVerisi.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {Object.values(item).map((value: any, i) => (
                        <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(!raporVerisi || (Array.isArray(raporVerisi) && raporVerisi.length === 0)) && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Seçilen kriterlerde rapor bulunamadı</p>
              <p className="text-sm text-gray-400 mt-2">Filtreleri değiştirip tekrar deneyin</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}