'use client';

import { useState } from 'react';
import { Search, X, Palette } from 'lucide-react';
import KartelaSearch from './KartelaSearch';

interface Props {
  currentRoom: string;
  currentUserId?: string | number;
}

export default function KartelaSearchModal({ currentRoom, currentUserId }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 1. KÜÇÜK BUTON (Sayfada gözükecek) */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"> {/* className (küçük c) olacak */}
            <Palette className="h-5 w-5 text-gray-700" /> {/* className (küçük c) olacak */}
            <div>
              <h3 className="font-semibold">Kartela Arama</h3>
              <p className="text-sm text-gray-600">Renk kodu veya barkod ile ara</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Aç
          </button>
        </div>
      </div>

      {/* 2. POPUP (Butona tıklayınca açılacak) */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Popup Başlık */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Kartela Arama</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Popup İçeriği - MEVCUT KartelaSearch */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
              <KartelaSearch 
                currentRoom={currentRoom} 
                currentUserId={currentUserId} 
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}