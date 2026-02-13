// components/qr/HucreQrPrint.tsx
'use client';

import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { X, Printer } from 'lucide-react';

interface HucreQrPrintProps {
  hucreler: Array<{
    id: number;
    hucre_kodu: string;
    dolap_kodu?: string;
    raf_kodu?: string;
  }>;
  onClose: () => void;
}

export default function HucreQrPrint({ hucreler, onClose }: HucreQrPrintProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // DÜZELTİLMİŞ KISIM - useReactToPrint doğru kullanımı
  const handlePrint = useReactToPrint({
    contentRef: printRef, // 'content' yerine 'contentRef' kullan
    documentTitle: `Hucre_QR_${new Date().toISOString().split('T')[0]}`,
    onAfterPrint: onClose
  });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">
            Hücre QR Kodları ({hucreler.length} adet)
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* QR Grid - Print Area */}
        <div 
          ref={printRef}
          className="p-6 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {hucreler.map((hucre) => (
            <div 
              key={hucre.id}
              className="border border-gray-200 rounded-lg p-3 text-center bg-white"
            >
              <div className="mb-2 flex justify-center">
                <QRCodeSVG
                  value={hucre.hucre_kodu}
                  size={120}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="font-mono text-sm font-bold text-gray-800">
                {hucre.hucre_kodu}
              </div>
              {(hucre.dolap_kodu || hucre.raf_kodu) && (
                <div className="text-xs text-gray-500 mt-1">
                  {hucre.dolap_kodu} {hucre.raf_kodu && `• Raf ${hucre.raf_kodu}`}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Kapat
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Yazdır ({hucreler.length} QR)
          </button>
        </div>
      </div>
    </div>
  );
}