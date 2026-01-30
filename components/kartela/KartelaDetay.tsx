'use client';

import { Clock, MapPin, User, Calendar, ArrowRight } from 'lucide-react';
import { Kartela } from '@/types/kartela';

interface KartelaDetayProps {
  kartela: Kartela;
}

export default function KartelaDetay({ kartela }: KartelaDetayProps) {
  const sonHareket = kartela.hareketGeçmişi[kartela.hareketGeçmişi.length - 1];
  
  return (
    <div className="bg-white rounded-xl shadow-lg border p-6">
      {/* Başlık */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{kartela.renkAdi}</h3>
          <p className="text-gray-600">Kartela No: {kartela.kartelaNo}</p>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-medium ${
          kartela.durum === 'aktif' ? 'bg-green-100 text-green-800' :
          kartela.durum === 'kullanımda' ? 'bg-blue-100 text-blue-800' :
          kartela.durum === 'arsivde' ? 'bg-gray-100 text-gray-800' :
          'bg-red-100 text-red-800'
        }`}>
          {kartela.durum.charAt(0).toUpperCase() + kartela.durum.slice(1)}
        </div>
      </div>

      {/* Grid Bilgiler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Lokasyon Bilgisi */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">Mevcut Lokasyon</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Oda:</span>
              <span className="font-medium">{kartela.mevcutLokasyon.oda}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Raf:</span>
              <span className="font-medium">{kartela.mevcutLokasyon.raf}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hücre:</span>
              <span className="font-medium">{kartela.mevcutLokasyon.hucre}</span>
            </div>
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-gray-500">Tam Adres:</p>
              <p className="font-mono text-sm">{kartela.mevcutLokasyon.tamAdres}</p>
            </div>
          </div>
        </div>

        {/* Son Hareket */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="h-5 w-5 text-purple-600" />
            <h4 className="font-semibold text-gray-900">Son Hareket</h4>
          </div>
          {sonHareket ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium">{sonHareket.personel.ad}</p>
                  <p className="text-sm text-gray-500">{sonHareket.personel.unvan}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium">
                    {new Date(sonHareket.tarih).toLocaleDateString('tr-TR')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(sonHareket.tarih).toLocaleTimeString('tr-TR')}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">İşlem:</p>
                <div className="flex items-center gap-2">
                  {sonHareket.eskiLokasyon && (
                    <>
                      <span className="text-xs px-2 py-1 bg-gray-200 rounded">
                        {sonHareket.eskiLokasyon.hucre}
                      </span>
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                    </>
                  )}
                  <span className="text-xs px-2 py-1 bg-blue-200 rounded">
                    {sonHareket.yeniLokasyon.hucre}
                  </span>
                  <span className="text-sm text-gray-700 ml-2">
                    {sonHareket.hareketTipi === 'alindi' ? 'Alındı' :
                     sonHareket.hareketTipi === 'iade' ? 'İade Edildi' :
                     sonHareket.hareketTipi === 'transfer' ? 'Transfer Edildi' : 'Oluşturuldu'}
                  </span>
                </div>
              </div>
              {sonHareket.not && (
                <div className="mt-2 p-2 bg-white border rounded text-sm">
                  📝 {sonHareket.not}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Hareket kaydı bulunmuyor</p>
          )}
        </div>
      </div>

      {/* Hareket Geçmişi */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-4">Hareket Geçmişi</h4>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {kartela.hareketGeçmişi.slice().reverse().map((hareket) => (
            <div key={hareket.id} className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-3 w-3 text-gray-400" />
                    <span className="font-medium">{hareket.personel.ad}</span>
                    <span className="text-xs text-gray-500">({hareket.personel.unvan})</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(hareket.tarih).toLocaleDateString('tr-TR')} • 
                    {new Date(hareket.tarih).toLocaleTimeString('tr-TR')}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  hareket.hareketTipi === 'alindi' ? 'bg-blue-100 text-blue-800' :
                  hareket.hareketTipi === 'iade' ? 'bg-green-100 text-green-800' :
                  hareket.hareketTipi === 'transfer' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {hareket.hareketTipi}
                </span>
              </div>
              {hareket.not && (
                <p className="text-sm text-gray-700 mt-2">📝 {hareket.not}</p>
              )}
              {hareket.eskiLokasyon && (
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                  <span>{hareket.eskiLokasyon.hucre}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>{hareket.yeniLokasyon.hucre}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
