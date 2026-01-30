'use client'

import { useState, useEffect } from 'react'
import { PlusCircle, X, QrCode, Search, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import QRDisplayModal from '@/components/kartela/QRDisplayModal'
import type { QRData } from '@/utils/qrGenerator'

type RenkMasasi = Database['public']['Tables']['renk_masalari']['Row']

interface CreateKartelaFormProps {
  onClose: () => void
  onSuccess: (kartelaNo: string) => void
  currentUserId?: number
}

export default function CreateKartelaForm({ onClose, onSuccess, currentUserId }: CreateKartelaFormProps) {
  const [loading, setLoading] = useState(false)
  const [renkMasalari, setRenkMasalari] = useState<RenkMasasi[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredRenkler, setFilteredRenkler] = useState<RenkMasasi[]>([])
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrData, setQrData] = useState<QRData | null>(null)

  const [formData, setFormData] = useState({
    renk_kodu: '',
    renk_adi: '',
    musteri_adi: '',
    proje_kodu: '',
    rpt_calismasi: '',
    notlar: '',
    selectedRenkId: null as number | null
  })

  const supabase = createClient()

  // Renk masalarını yükle
  useEffect(() => {
    fetchRenkMasalari()
  }, [])

  // Renk araması
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRenkler(renkMasalari.slice(0, 10))
    } else {
      const filtered = renkMasalari.filter(renk =>
        renk.renk_kodu.toLowerCase().includes(searchQuery.toLowerCase()) ||
        renk.renk_adi.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredRenkler(filtered.slice(0, 10))
    }
  }, [searchQuery, renkMasalari])

  const fetchRenkMasalari = async () => {
    try {
      const { data, error } = await supabase
        .from('renk_masalari')
        .select('*')
        .eq('aktif', true)
        .order('renk_kodu')
        .limit(100)

      if (error) throw error
      setRenkMasalari(data || [])
      setFilteredRenkler(data?.slice(0, 10) || [])
    } catch (error) {
      console.error('Renk masaları yüklenemedi:', error)
    }
  }

  const handleRenkSelect = (renk: RenkMasasi) => {
    setFormData({
      ...formData,
      renk_kodu: renk.renk_kodu,
      renk_adi: renk.renk_adi,
      selectedRenkId: renk.id
    })
    setSearchQuery('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.renk_kodu || !formData.renk_adi) {
      alert('Lütfen bir renk seçin')
      return
    }

    setLoading(true)

    try {
      // Yeni kartela oluştur
      const { data, error } = await supabase
        .from('kartelalar')
        .insert({
          renk_kodu: formData.renk_kodu,
          renk_adi: formData.renk_adi,
          musteri_adi: formData.musteri_adi || null,
          proje_kodu: formData.proje_kodu || null,
          rpt_calismasi: formData.rpt_calismasi || null,
          durum: 'AKTIF',
          goz_sayisi: 0,
          maksimum_goz: 14,
          olusturan_kullanici_id: currentUserId || 1,
          toplam_kullanim_sayisi: 0,
          silindi: false
        })
        .select()

      if (error) throw error

      if (data && data[0]) {
        const yeniKartela = data[0]
        
        // Hareket logu
        await supabase
          .from('hareket_loglari')
          .insert({
            kartela_id: yeniKartela.id,
            kartela_no: yeniKartela.kartela_no,
            hareket_tipi: 'OLUSTURMA',
            kullanici_id: currentUserId || 1,
            aciklama: `Yeni kartela oluşturuldu: ${formData.renk_kodu} - ${formData.renk_adi}`,
            yeni_durum: 'AKTIF'
          })

        // QR kod verilerini hazırla
        const qrData: QRData = {
          kartelaNo: yeniKartela.kartela_no,
          renkKodu: yeniKartela.renk_kodu,
          renkAdi: yeniKartela.renk_adi,
          durum: yeniKartela.durum,
          gozSayisi: yeniKartela.goz_sayisi,
          maksimumGoz: yeniKartela.maksimum_goz,
          musteriAdi: yeniKartela.musteri_adi || undefined,
          projeKodu: yeniKartela.proje_kodu || undefined,
          tarih: new Date().toISOString().split('T')[0]
        }

        // Pantone no varsa ekle
        const { data: renkData } = await supabase
          .from('renk_masalari')
          .select('pantone_kodu')
          .eq('renk_kodu', yeniKartela.renk_kodu)
          .single()

        if (renkData?.pantone_kodu) {
          qrData.pantoneKodu = renkData.pantone_kodu
        }

        setQrData(qrData)
        setShowQRModal(true)
        onSuccess(yeniKartela.kartela_no)
      }

    } catch (error: any) {
      console.error('Kartela oluşturma hatası:', error)
      alert(`Kartela oluşturulamadı: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleQRClose = () => {
    setShowQRModal(false)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <PlusCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Yeni Kartela Oluştur</h2>
                  <p className="text-gray-600">Renk masasından seçerek yeni kartela açın</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Renk Arama ve Seçim */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Renk Kodu ve Adı *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Renk kodu (23011737.1) veya renk adı ara..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Renk Listesi */}
                {searchQuery && filteredRenkler.length > 0 && (
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    {filteredRenkler.map((renk) => (
                      <div
                        key={renk.id}
                        onClick={() => handleRenkSelect(renk)}
                        className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition ${
                          formData.selectedRenkId === renk.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{renk.renk_kodu}</div>
                            <div className="text-sm text-gray-600">{renk.renk_adi}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {renk.pantone_kodu && (
                              <div className="text-sm text-gray-500">
                                Pantone: {renk.pantone_kodu}
                              </div>
                            )}
                            {formData.selectedRenkId === renk.id && (
                              <Check className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Seçilen Renk */}
                {formData.renk_kodu && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-gray-900">{formData.renk_kodu}</div>
                        <div className="text-gray-700">{formData.renk_adi}</div>
                      </div>
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="w-5 h-5" />
                        <span className="font-medium">Renk seçildi</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Müşteri ve Proje Bilgileri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Müşteri */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Müşteri (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={formData.musteri_adi}
                    onChange={(e) => setFormData({...formData, musteri_adi: e.target.value})}
                    placeholder="Müşteri adı girin..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Proje Kodu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proje Kodu (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={formData.proje_kodu}
                    onChange={(e) => setFormData({...formData, proje_kodu: e.target.value})}
                    placeholder="PROJ-2024-001"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* RPT Çalışması */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RPT Çalışması (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={formData.rpt_calismasi}
                    onChange={(e) => setFormData({...formData, rpt_calismasi: e.target.value})}
                    placeholder="RPT-001"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Notlar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notlar (Opsiyonel)
                </label>
                <textarea
                  value={formData.notlar}
                  onChange={(e) => setFormData({...formData, notlar: e.target.value})}
                  placeholder="Ek notlar..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* QR Bilgisi */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <QrCode className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-800">QR Kod Bilgisi</h4>
                </div>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Kartela oluşturulunca <strong>QR kodu otomatik oluşturulacak</strong></li>
                  <li>• QR kodu <strong>indirilebilir ve yazdırılabilir</strong></li>
                  <li>• QR içeriği: Kartela No, Renk Kodu, Durum, Müşteri, Tarih</li>
                  <li>• Pantone no varsa QR'da gösterilecek</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  disabled={loading}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.renk_kodu}
                  className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-5 h-5" />
                      Kartela Oluştur ve QR Göster
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      {showQRModal && qrData && (
        <QRDisplayModal
          isOpen={showQRModal}
          onClose={handleQRClose}
          qrData={qrData}
        />
      )}
    </>
  )
}
