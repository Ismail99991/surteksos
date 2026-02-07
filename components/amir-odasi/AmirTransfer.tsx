// components/amir/AmirTransfer.tsx
'use client'

import { useState, useRef } from 'react'
import { 
  ArrowRightLeft, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Package,
  MapPin,
  Home,
  Filter,
  Camera,
  Scan
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface AmirTransferProps {
  currentOdaId: number
  currentUserId: number
  amirRaflari: any[]
  onAmirOnay?: (kartelaId: number, onayDurumu: boolean) => void
}

type TransferStep = 'kartela' | 'raf' | 'confirm' | 'success' | 'error'

export default function AmirTransfer({ 
  currentOdaId, 
  currentUserId,
  amirRaflari,
  onAmirOnay
}: AmirTransferProps) {
  const [currentStep, setCurrentStep] = useState<TransferStep>('kartela')
  const [selectedKartela, setSelectedKartela] = useState<any>(null)
  const [selectedRaf, setSelectedRaf] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleKartelaScan = async (kartelaKodu: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('kartelalar')
        .select(`
          *,
          renk_masalari!left (pantone_kodu, hex_kodu),
          hucreler!left (hucre_kodu, hucre_adi)
        `)
        .or(`kartela_no.eq.${kartelaKodu},renk_kodu.ilike.%${kartelaKodu}%`)
        .eq('silindi', false)
        .single()

      if (error) throw error
      if (!data) throw new Error('Kartela bulunamadı!')

      // AMIR ÖZEL KONTROLLER
      if (data.durum === 'KULLANIM_DISI') {
        throw new Error('Bu kartela kullanım dışı! Amir transfer edemez.')
      }

      setSelectedKartela(data)
      setCurrentStep('raf')

    } catch (error: any) {
      setError(error.message)
      setCurrentStep('error')
    } finally {
      setLoading(false)
    }
  }

  const handleRafSelection = (raf: any) => {
    // Kapasite kontrolü
    if (raf.mevcut >= raf.kapasite) {
      setError(`${raf.kod} rafı dolu! Başka raf seçin.`)
      return
    }

    setSelectedRaf(raf)
    setCurrentStep('confirm')
  }

  const confirmTransfer = async () => {
    if (!selectedKartela || !selectedRaf) return

    setLoading(true)

    try {
      // 1. Kartela'nın hücre bilgisini güncelle (Amir Rafına taşı)
      const { error: kartelaError } = await supabase
        .from('kartelalar')
        .update({ 
          hucre_kodu: selectedRaf.kod, // Amir raf kodu
          son_kullanim_tarihi: new Date().toISOString(),
          son_kullanan_kullanici_id: currentUserId,
          not: `Amir tarafından ${selectedRaf.kod} rafına taşındı`
        })
        .eq('id', selectedKartela.id)

      if (kartelaError) throw kartelaError

      // 2. Raf doluluk bilgisini güncelle (örnek - gerçekte raflar tablosu olmalı)
      // Bu kısım gerçek veritabanı yapınıza göre değişecek

      // 3. Hareket logu
      await supabase
        .from('hareket_loglari')
        .insert({
          kartela_id: selectedKartela.id,
          kartela_no: selectedKartela.kartela_no,
          hareket_tipi: 'AMIR_TRANSFER',
          yeni_hucre_kodu: selectedRaf.kod,
          kullanici_id: currentUserId,
          aciklama: `Amir tarafından ${selectedRaf.kod} rafına taşındı`,
          tarih: new Date().toISOString()
        })

      // 4. Amir onay kaydı (eğer varsa)
      if (onAmirOnay) {
        onAmirOnay(selectedKartela.id, true)
      }

      setSuccessMessage(`✅ Kartela ${selectedRaf.kod} rafına taşındı!`)
      setCurrentStep('success')

    } catch (error: any) {
      setError(error.message || 'Transfer hatası')
      setCurrentStep('error')
    } finally {
      setLoading(false)
    }
  }

  const resetTransfer = () => {
    setSelectedKartela(null)
    setSelectedRaf(null)
    setError(null)
    setSuccessMessage(null)
    setCurrentStep('kartela')
  }

  return (
    <div className="space-y-6">
      {/* Adımlar */}
      <div className="flex justify-center">
        <div className="flex items-center">
          {['kartela', 'raf', 'confirm', 'success'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`flex flex-col items-center ${currentStep === step ? 'text-purple-600' : currentStep === 'error' && index < 2 ? 'text-red-500' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === step ? 'bg-purple-100' : currentStep === 'error' && index < 2 ? 'bg-red-100' : 'bg-gray-100'}`}>
                  <span className="font-bold">{index + 1}</span>
                </div>
                <span className="text-xs mt-2 capitalize">{step}</span>
              </div>
              {index < 3 && (
                <div className={`w-16 h-1 mx-2 ${currentStep !== step && currentStep !== 'error' ? 'bg-purple-300' : 'bg-gray-200'}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Kartela Seç */}
      {currentStep === 'kartela' && (
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 p-8">
          <div className="text-center mb-8">
            <Package className="h-16 w-16 text-purple-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">1. Kartela Seçin</h3>
            <p className="text-gray-600">Transfer edilecek kartelayı seçin</p>
          </div>
          
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="Kartela no veya renk kodu girin"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleKartelaScan(e.currentTarget.value)}
            />
            <button
              onClick={() => {
                const kod = prompt('Kartela kodu girin:')
                if (kod) handleKartelaScan(kod)
              }}
              className="w-full mt-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
            >
              <Camera className="h-5 w-5" />
              QR ile Tara
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Amir Rafı Seç */}
      {currentStep === 'raf' && selectedKartela && (
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 p-8">
          <div className="text-center mb-8">
            <MapPin className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">2. Amir Rafı Seçin</h3>
            <p className="text-gray-600">Kartelayı taşıyacağınız rafı seçin</p>
          </div>

          {/* Seçilen Kartela */}
          <div className="max-w-md mx-auto mb-8 p-4 bg-white rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">{selectedKartela.kartela_no}</p>
                <p className="text-sm text-gray-600">{selectedKartela.renk_kodu} • {selectedKartela.renk_adi}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs ${selectedKartela.durum === 'AKTIF' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                {selectedKartela.durum}
              </span>
            </div>
          </div>

          {/* Amir Rafları */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {amirRaflari.map((raf) => (
              <button
                key={raf.id}
                onClick={() => handleRafSelection(raf)}
                disabled={raf.mevcut >= raf.kapasite}
                className={`p-4 rounded-xl border text-left transition-all ${raf.mevcut >= raf.kapasite ? 'bg-red-50 border-red-200 opacity-60' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-gray-900">{raf.kod}</h4>
                    <p className="text-sm text-gray-600">{raf.adi}</p>
                  </div>
                  <div className={`p-1 rounded ${raf.mevcut / raf.kapasite > 0.8 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    <span className="text-xs font-bold">
                      {Math.round((raf.mevcut / raf.kapasite) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-3">
                  <span>Kapasite:</span>
                  <span>{raf.mevcut}/{raf.kapasite}</span>
                </div>
                {raf.mevcut >= raf.kapasite && (
                  <div className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Raf dolu
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Diğer adımlar... */}
      {/* (confirm, success, error adımları KartelaTransfer'deki gibi olacak) */}

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">İşlem yapılıyor...</p>
          </div>
        </div>
      )}
    </div>
  )
}