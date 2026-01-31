'use client'

import { useState } from 'react'
import { RefreshCw, Search, X, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/common/Button'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

type KartelaType = Database['public']['Tables']['kartelalar']['Row']

interface ResetKartelaModalProps {
  onClose: () => void
  onReset: (kartelaNo: string, reason: string) => void
  currentUserId?: number
}

export default function ResetKartelaModal({ onClose, onReset, currentUserId }: ResetKartelaModalProps) {
  const [kartelaNo, setKartelaNo] = useState('')
  const [reason, setReason] = useState('gundeme')
  const [customReason, setCustomReason] = useState('')
  const [searchResults, setSearchResults] = useState<KartelaType[]>([])
  const [selectedKartela, setSelectedKartela] = useState<KartelaType | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient() as any

  const handleSearch = async () => {
    if (!kartelaNo.trim()) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('kartelalar')
        .select('*')
        .or(`kartela_no.ilike.%${kartelaNo}%,renk_kodu.ilike.%${kartelaNo}%`)
        .eq('silindi', false)
        .limit(10)
      
      if (error) throw error
      
      setSearchResults(data || [])
      
      if (data && data.length === 1) {
        setSelectedKartela(data[0])
      }
    } catch (error) {
      console.error('Kartela arama hatası:', error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedKartela) {
      alert('Lütfen bir kartela seçin')
      return
    }
    
    setLoading(true)
    try {
      const resetReason = reason === 'diger' ? customReason : reason
      
      // 1. Kartelayı sıfırla (TÜM DURUMLAR İÇİN - sadece DOLU değil)
      const { error: updateError } = await supabase
        .from('kartelalar')
        .update({
          goz_sayisi: 0,
          goz_dolum_orani: 0,
          durum: 'AKTIF', // Her durumda AKTIF yap
          musteri_adi: null, // Müşteri atamasını kaldır
          proje_kodu: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedKartela.id)
      
      if (updateError) throw updateError
      
      // 2. Hareket logu oluştur
      await supabase
        .from('hareket_loglari')
        .insert({
          kartela_id: selectedKartela.id,
          kartela_no: selectedKartela.kartela_no,
          hareket_tipi: 'SIFIRLAMA',
          eski_durum: selectedKartela.durum,
          yeni_durum: 'AKTIF',
          eski_goz_sayisi: selectedKartela.goz_sayisi,
          yeni_goz_sayisi: 0,
          kullanici_id: currentUserId || 1,
          kullanici_kodu: 'SYSTEM',
          aciklama: `${selectedKartela.kartela_no} kartelası sıfırlandı. Sebep: ${resetReason}`,
          tarih: new Date().toISOString()
        })
      
      // 3. Callback'i çağır
      onReset(selectedKartela.kartela_no || selectedKartela.renk_kodu, resetReason)
      
      // 4. Başarı mesajı
      alert(`✅ ${selectedKartela.kartela_no} kartelası başarıyla sıfırlandı!`)
      onClose()
      
    } catch (error) {
      console.error('Kartela sıfırlama hatası:', error)
      alert('❌ Kartela sıfırlanamadı!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <RefreshCw className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Kartela Sıfırla</h2>
                <p className="text-gray-600">Kartelayı sıfırlayın</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Arama */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kartela No veya Renk Kodu Ara
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={kartelaNo}
                  onChange={(e) => setKartelaNo(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Kartela No veya Renk Kodu (23011737.1)"
                  className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  disabled={loading}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={loading || !kartelaNo.trim()}
              >
                {loading ? 'Aranıyor...' : 'Ara'}
              </Button>
            </div>
          </div>

          {/* Sonuçlar */}
          {searchResults.length > 0 && (
            <div className="mb-8">
              <h3 className="font-medium text-gray-700 mb-4">Bulunan Kartelalar:</h3>
              <div className="space-y-3">
                {searchResults.map((kartela) => (
                  <div
                    key={kartela.id}
                    onClick={() => setSelectedKartela(kartela)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedKartela?.id === kartela.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {kartela.kartela_no || 'KRT-' + kartela.id}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {kartela.renk_kodu} - {kartela.renk_adi}
                        </p>
                        {kartela.musteri_adi && (
                          <p className="text-gray-500 text-sm mt-1">🏢 {kartela.musteri_adi}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          kartela.durum === 'AKTIF' ? 'bg-green-100 text-green-800' :
                          kartela.durum === 'DOLU' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {kartela.durum}
                        </span>
                        <p className="text-gray-500 text-sm mt-1">
                          Göz: {kartela.goz_sayisi}/{kartela.maksimum_goz}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seçili Kartela Bilgisi */}
          {selectedKartela && (
            <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">✅ Seçilen Kartela</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Kartela No</p>
                  <p className="font-medium">{selectedKartela.kartela_no}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Renk</p>
                  <p className="font-medium">{selectedKartela.renk_kodu}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Durum</p>
                  <p className="font-medium">{selectedKartela.durum}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Göz Sayısı</p>
                  <p className="font-medium">{selectedKartela.goz_sayisi} → 0</p>
                </div>
              </div>
            </div>
          )}

          {/* Sıfırlama Sebebi - AYNEN KALDI */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Sıfırlama Sebebi *
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="reason"
                  value="gundeme"
                  checked={reason === 'gundeme'}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                  disabled={loading}
                />
                <div>
                  <p className="font-medium">Gündeme Geldi</p>
                  <p className="text-sm text-gray-500">Kartela tekrar kullanılacak</p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="reason"
                  value="yenilendi"
                  checked={reason === 'yenilendi'}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                  disabled={loading}
                />
                <div>
                  <p className="font-medium">Yenilendi</p>
                  <p className="text-sm text-gray-500">Yeni kartela oluşturuldu</p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="reason"
                  value="diger"
                  checked={reason === 'diger'}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                  disabled={loading}
                />
                <div>
                  <p className="font-medium">Diğer</p>
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Sebebi yazın..."
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    disabled={loading || reason !== 'diger'}
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Uyarı - AYNEN KALDI */}
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800 mb-1">⚠️ Dikkat!</h4>
                <p className="text-red-700 text-sm">
                  Kartela sıfırlandığında tüm numune geçmişi silinecektir. 
                  Bu işlem geri alınamaz. 
                  <strong className="block mt-1">
                    • Her durumdaki kartela sıfırlanabilir (sadece DOLU değil)
                    • Göz sayısı 0'a düşer
                    • Durum AKTIF olur
                    • Müşteri ataması kalkar
                  </strong>
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleSubmit}
              disabled={!selectedKartela || loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sıfırlanıyor...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Kartelayı Sıfırla
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}