'use client'

import { useState, useRef } from 'react'
import { QrCode, Camera } from 'lucide-react'
import { Button } from '@/components/common/Button'

interface QrScannerProps {
  onScan: (qrData: string) => void
  title?: string
  description?: string
  placeholder?: string
}

export default function QrScanner({
  onScan,
  title = 'QR Kodu Okutun',
  description = 'Oda QR kodunu taratın',
  placeholder = 'QR kodu buraya taratın...',
}: QrScannerProps) {
  const [inputValue, setInputValue] = useState('')
  const [isManualMode, setIsManualMode] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      onScan(inputValue.trim())
      setInputValue('')
    }
  }

  const handleBarcodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    
    // Barkod tarayıcılar genelde Enter ile biter ama biz otomatik de yakalayalım
    // Örnek QR formatı: AMIR-ODA-001 veya 231010001.1
    if (value.length >= 8 && !value.includes(' ')) {
      // Küçük debounce
      const timer = setTimeout(() => {
        onScan(value)
        setInputValue('')
      }, 100)
      return () => clearTimeout(timer)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <QrCode className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>

      {/* Scanner Area */}
      <div className="mb-8">
        <div className="border-4 border-dashed border-blue-200 rounded-xl p-8 text-center bg-blue-50">
          <Camera className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <p className="text-blue-700 font-medium">QR/Barkod Tarayıcı Bekleniyor...</p>
          <p className="text-blue-600 text-sm mt-2">
            Cihazınızı bu alana odaklayın ve taratın
          </p>
        </div>
      </div>

      {/* Manual Input */}
      <div className="mb-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Elle QR Kodu Girin:
            </label>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleBarcodeInput}
              placeholder={placeholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center text-lg"
              autoFocus
            />
          </div>
          <Button type="submit" variant="primary" className="w-full">
            QR Kodunu Onayla
          </Button>
        </form>
      </div>

      {/* Help Text */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-800 mb-2">📌 Kullanım Kılavuzu:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Oda girişinde QR kodunu taratın</li>
          <li>• QR formatı: <code className="bg-gray-100 px-1 rounded">AMIR-ODA-001</code></li>
          <li>• Manuel giriş için yukarıdaki kutuya yazın</li>
          <li>• Barkod tarayıcı otomatik algılanacaktır</li>
        </ul>
      </div>
    </div>
  )
}
