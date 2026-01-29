'use client'

import { useState } from 'react'
import { PlusCircle, X, QrCode } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/common/Button'

interface CreateKartelaFormProps {
  onClose: () => void
  onCreate: (data: any) => void
}

export default function CreateKartelaForm({ onClose, onCreate }: CreateKartelaFormProps) {
  const [formData, setFormData] = useState({
    renk_kodu: '',
    musteri: '',
    tip: 'ozel' as 'ozel' | 'genel' | 'standart',
    kumas_tipi: '',
    recete_no: '',
    notlar: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Yeni kartela ID oluştur (format: YYMMXXXX.X)
    const today = new Date()
    const year = today.getFullYear().toString().slice(-2)
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const randomNum = Math.floor(Math.random() * 9000 + 1000)
    
    const newKartela = {
      id: `kartela_${Date.now()}`,
      renk_kodu: formData.renk_kodu || `${year}${month}${randomNum}.1`,
      musteri: formData.musteri || null,
      tip: formData.tip,
      durum: 'arsivde' as const,
      mevcut_lokasyon: 'KARTELA-ODA-001',
      son_erisim: new Date().toISOString(),
      olusturma_tarihi: new Date().toISOString(),
      sorumlu_kisi: 'Kartela Odası Sorumlusu',
      telefon: '+90 555 000 0000',
      notlar: formData.notras || null,
      recete_no: formData.recete_no || null,
      kumas_tipi: formData.kumas_tipi || null,
    }
    
    onCreate(newKartela)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <PlusCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Yeni Kartela Oluştur</h2>
                <p className="text-gray-600">Yeni renk kartelası ekleyin</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Renk Kodu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Renk Kodu *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.renk_kodu}
                    onChange={(e) => setFormData({...formData, renk_kodu: e.target.value})}
                    placeholder="231010001.1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <QrCode className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Format: YYMMXXXX.X (Otomatik: {new Date().getFullYear().toString().slice(-2)}{(new Date().getMonth() + 1).toString().padStart(2, '0')}XXXX.1)
                </p>
              </div>

              {/* Müşteri */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Müşteri
                </label>
                <select
                  value={formData.musteri}
                  onChange={(e) => setFormData({...formData, musteri: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Müşteri Seçin</option>
                  <option value="Nike">Nike</option>
                  <option value="Zara">Zara</option>
                  <option value="Mavi">Mavi</option>
                  <option value="LC Waikiki">LC Waikiki</option>
                  <option value="Defacto">Defacto</option>
                  <option value="Genel">Genel Renk</option>
                </select>
              </div>

              {/* Tip */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kartela Tipi *
                </label>
                <select
                  value={formData.tip}
                  onChange={(e) => setFormData({...formData, tip: e.target.value as any})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                >
                  <option value="ozel">Özel Müşteri</option>
                  <option value="genel">Genel Kullanım</option>
                  <option value="standart">Standart Renk</option>
                </select>
              </div>

              {/* Kumaş Tipi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kumaş Tipi
                </label>
                <input
                  type="text"
                  value={formData.kumas_tipi}
                  onChange={(e) => setFormData({...formData, kumas_tipi: e.target.value})}
                  placeholder="Pamuk 100%, Polyester, vb."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Reçete No */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reçete No
                </label>
                <input
                  type="text"
                  value={formData.recete_no}
                  onChange={(e) => setFormData({...formData, recete_no: e.target.value})}
                  placeholder="REC-2024-001"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Notlar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notlar
              </label>
              <textarea
                value={formData.notlar}
                onChange={(e) => setFormData({...formData, notlar: e.target.value})}
                placeholder="Özel notlar, uyarılar..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
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
                type="submit"
                variant="primary"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Kartela Oluştur
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}
