'use client'

import { useState } from 'react'
import { RefreshCw, Search, X, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/common/Button'

interface ResetKartelaModalProps {
  onClose: () => void
  onReset: (kartelaNo: string, reason: string) => void
}

export default function ResetKartelaModal({ onClose, onReset }: ResetKartelaModalProps) {
  const [kartelaNo, setKartelaNo] = useState('')
  const [reason, setReason] = useState('gundeme')
  const [customReason, setCustomReason] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedKartela, setSelectedKartela] = useState<any>(null)

  const handleSearch = () => {
    if (!kartelaNo.trim()) return
    
    // Mock search results
    const results = [
      {
        id: '1',
        renk_kodu: kartelaNo,
        musteri: 'Nike',
        durum: 'dolu',
        son_erisim: '2024-01-27T14:30:00Z',
        notlar: '14 göz dolu',
      },
      {
        id: '2',
        renk_kodu: '231010002.1',
        musteri: 'Zara',
        durum: 'dolu',
        son_erisim: '2024-01-28T09:15:00Z',
        notlar: '12 göz dolu',
      }
    ]
    
    setSearchResults(results)
    setSelectedKartela(results[0])
  }

  const handleSubmit = () => {
    if (!selectedKartela) {
      alert('Lütfen bir kartela seçin')
      return
    }
    
    const resetReason = reason === 'diger' ? customReason : reason
    onReset(selectedKartela.renk_kodu, resetReason)
    onClose()
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
                <p className="text-gray-600">Dolu kartelayı sıfırlayın</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Arama */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kartela No Ara
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={kartelaNo}
                  onChange={(e) => setKartelaNo(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="231010001.1 veya son 4 hane"
                  className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <Button onClick={handleSearch}>
                Ara
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
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{kartela.renk_kodu}</p>
                        <p className="text-gray-600 text-sm">{kartela.musteri}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                          {kartela.durum.toUpperCase()}
                        </span>
                        <p className="text-gray-500 text-sm mt-1">
                          Son: {new Date(kartela.son_erisim).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                    {kartela.notlar && (
                      <p className="text-sm text-gray-600 mt-2">{kartela.notlar}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sıfırlama Sebebi */}
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
                />
                <div>
                  <p className="font-medium">Diğer</p>
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Sebebi yazın..."
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    disabled={reason !== 'diger'}
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Uyarı */}
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800 mb-1">⚠️ Dikkat!</h4>
                <p className="text-red-700 text-sm">
                  Kartela sıfırlandığında tüm numune geçmişi silinecektir. 
                  Bu işlem geri alınamaz. Sadece 14 göz dolu kartelaları sıfırlayın.
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
            >
              İptal
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleSubmit}
              disabled={!selectedKartela}
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Kartelayı Sıfırla
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
