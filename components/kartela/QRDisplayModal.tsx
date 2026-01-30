'use client'

import { useState, useEffect } from 'react'
import { X, Download, Printer, Copy, Check } from 'lucide-react'
import { generateQRCodeImage, generateQRText, type QRData } from '@/utils/qrGenerator'

interface QRDisplayModalProps {
  isOpen: boolean
  onClose: () => void
  qrData: QRData
}

export default function QRDisplayModal({ isOpen, onClose, qrData }: QRDisplayModalProps) {
  const [qrImage, setQrImage] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && qrData.kartelaNo) {
      generateQR()
    }
  }, [isOpen, qrData])

  const generateQR = async () => {
    setLoading(true)
    try {
      const image = await generateQRCodeImage(qrData)
      setQrImage(image)
    } catch (error) {
      console.error('QR oluşturma hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (qrImage) {
      const fileName = `kartela-${qrData.kartelaNo}-qr.png`
      const link = document.createElement('a')
      link.href = qrImage
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleCopyText = () => {
    const qrText = generateQRText(qrData)
    navigator.clipboard.writeText(qrText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow && qrImage) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Kartela QR Yazdır - ${qrData.kartelaNo}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 20px;
                text-align: center;
              }
              .container { max-width: 300px; margin: 0 auto; }
              .qr-code { width: 250px; height: 250px; margin: 20px auto; }
              .info { text-align: left; margin-top: 20px; font-size: 12px; }
              .label { font-weight: bold; color: #666; }
              @media print {
                body { padding: 0; }
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>KARTELA QR KODU</h2>
              <div class="qr-code">
                <img src="${qrImage}" alt="QR Code" style="width: 100%; height: 100%;" />
              </div>
              <div class="info">
                <p><span class="label">Kartela No:</span> ${qrData.kartelaNo}</p>
                <p><span class="label">Renk Kodu:</span> ${qrData.renkKodu}</p>
                <p><span class="label">Renk Adı:</span> ${qrData.renkAdi}</p>
                <p><span class="label">Durum:</span> ${qrData.durum}</p>
                <p><span class="label">Göz:</span> ${qrData.gozSayisi}/${qrData.maksimumGoz}</p>
                ${qrData.musteriAdi ? `<p><span class="label">Müşteri:</span> ${qrData.musteriAdi}</p>` : ''}
                <p><span class="label">Tarih:</span> ${qrData.tarih}</p>
              </div>
              <p style="margin-top: 30px; font-size: 10px; color: #999;">
                Kartela Takip Sistemi • ${new Date().toLocaleDateString('tr-TR')}
              </p>
            </div>
            <script>
              window.onload = () => window.print()
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Kartela QR Kodu</h2>
              <p className="text-gray-600">{qrData.kartelaNo}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* QR Code */}
          <div className="text-center mb-6">
            {loading ? (
              <div className="py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">QR kodu oluşturuluyor...</p>
              </div>
            ) : qrImage ? (
              <>
                <div className="inline-block p-4 bg-white border rounded-lg">
                  <img 
                    src={qrImage} 
                    alt="QR Code" 
                    className="w-64 h-64"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  Kartela barkodunu taratmak için QR kodu
                </p>
              </>
            ) : (
              <div className="py-12 text-gray-500">
                QR kodu oluşturulamadı
              </div>
            )}
          </div>

          {/* QR Text */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-900">QR Kod İçeriği</h3>
              <button
                onClick={handleCopyText}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Kopyalandı!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Kopyala
                  </>
                )}
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
              {generateQRText(qrData)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              disabled={!qrImage}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              İndir
            </button>
            <button
              onClick={handlePrint}
              disabled={!qrImage}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-5 h-5" />
              Yazdır
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
