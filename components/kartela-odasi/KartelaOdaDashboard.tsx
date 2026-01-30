'use client';

import { useState, useEffect } from 'react';
import { 
  PlusCircle, RefreshCw, Gift, Search, 
  BarChart3, Users, Package, Shield,
  FileText, QrCode, Printer, Download,
  MapPin, Calendar, Filter, Eye
} from 'lucide-react';
import { mockKartelalar } from '@/utils/mockKartelalar';
import type { Kartela } from '@/types/kartela';

interface KartelaOdaDashboardProps {
  roomName: string;
}

export default function KartelaOdaDashboard({ roomName }: KartelaOdaDashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'yeni' | 'sifirla' | 'musteri' | 'kartelalar'>('dashboard');
  const [kartelaCount, setKartelaCount] = useState(0);
  const [musteriCount, setMusteriCount] = useState(0);
  const [aktifKartelalar, setAktifKartelalar] = useState(0);
  const [mevcutKartelalar, setMevcutKartelalar] = useState<Kartela[]>([]);
  const [kartelaFilter, setKartelaFilter] = useState<string>('');

  // İlk yüklemede mock verileri al
  useEffect(() => {
    setMevcutKartelalar(mockKartelalar);
    setKartelaCount(mockKartelalar.length);
    setAktifKartelalar(mockKartelalar.filter(k => k.durum === 'aktif' || k.durum === 'kullanımda').length);
    
    // Benzersiz müşteri sayısı
    const musteriler = new Set(mockKartelalar.map(k => k.musteri).filter(Boolean));
    setMusteriCount(musteriler.size);
  }, []);

  // Filtreleme
  useEffect(() => {
    if (!kartelaFilter) {
      setMevcutKartelalar(mockKartelalar);
    } else {
      const filtered = mockKartelalar.filter(kartela =>
        kartela.durum === kartelaFilter
      );
      setMevcutKartelalar(filtered);
    }
  }, [kartelaFilter]);

  const handleYeniKartela = () => {
    console.log('Yeni kartela oluşturuluyor...');
    setKartelaCount(prev => prev + 1);
    setAktifKartelalar(prev => prev + 1);
    setActiveTab('yeni');
  };

  const handleSifirla = () => {
    console.log('Kartela sıfırlanıyor...');
    setActiveTab('sifirla');
  };

  const handleMusteriyeAda = () => {
    console.log('Müşteriye kartela atanıyor...');
    setActiveTab('musteri');
  };

  const formatTarih = (tarih: string) => {
    return new Date(tarih).toLocaleDateString('tr-TR');
  };

  // Dashboard ana içeriği
  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kartela Odası Kontrol Paneli</h1>
          <p className="text-gray-600 mt-2">Kartela yönetimi, oluşturma ve atama işlemleri</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
          <Shield className="h-5 w-5" />
          <span className="font-medium">Operasyon Modu</span>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Toplam Kartela</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{kartelaCount}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-green-600">
            +{mockKartelalar.length} mock kayıt
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Aktif Kartelalar</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{aktifKartelalar}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-green-600">
            %{Math.round((aktifKartelalar / kartelaCount) * 100)} aktif
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Kayıtlı Müşteri</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{musteriCount}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-green-600">
            Nike, Zara, LC Waikiki, Mavi
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Bugünkü İşlem</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">7</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <RefreshCw className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            10:00 - 19:00
          </div>
        </div>
      </div>

      {/* Hızlı Aksiyon Butonları */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={handleYeniKartela}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition">
                <PlusCircle className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Yeni Kartela Oluştur</h3>
                <p className="text-gray-600 text-sm mt-1">Yeni renk kartelası kaydı aç</p>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Barkod, QR kod ve fiziksi kartela oluşturulur
            </div>
          </button>

          <button
            onClick={handleSifirla}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition">
                <RefreshCw className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Kartela Sıfırla</h3>
                <p className="text-gray-600 text-sm mt-1">Dolu kartelayı yeniden kullan</p>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Tükenmiş kartelaları sıfırlayıp stoka ekle
            </div>
          </button>

          <button
            onClick={handleMusteriyeAda}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition">
                <Gift className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Müşteriye Ata</h3>
                <p className="text-gray-600 text-sm mt-1">Kartelayı müşteriye tahsis et</p>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Müşteriye özel kartela ataması yap
            </div>
          </button>
        </div>
      </div>

      {/* MEVCUT KARTELALAR BÖLÜMÜ */}
      <div className="bg-white rounded-xl shadow border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">📦 Mevcut Kartelalar</h3>
              <p className="text-gray-600 text-sm mt-1">
                Odanızdaki tüm kartelaları görüntüleyin ve yönetin
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  value={kartelaFilter}
                  onChange={(e) => setKartelaFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white text-sm"
                >
                  <option value="">Tüm Durumlar</option>
                  <option value="aktif">Aktif</option>
                  <option value="kullanımda">Kullanımda</option>
                  <option value="arsivde">Arşivde</option>
                  <option value="pasif">Pasif</option>
                </select>
              </div>
              <button 
                onClick={() => setActiveTab('kartelalar')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <Eye className="h-4 w-4" />
                Tümünü Gör
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kartela No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Renk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Müşteri</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lokasyon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Son Güncelleme</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mevcutKartelalar.slice(0, 5).map((kartela) => (
                <tr key={kartela.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-mono font-bold text-gray-900">{kartela.kartelaNo}</div>
                    <div className="text-xs text-gray-500">{kartela.renkKodu}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold">{kartela.renkAdi}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {kartela.musteri ? (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                        {kartela.musteri}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Genel</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {kartela.mevcutLokasyon.raf} - {kartela.mevcutLokasyon.hucre}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      kartela.durum === 'aktif' ? 'bg-green-100 text-green-800' :
                      kartela.durum === 'kullanımda' ? 'bg-blue-100 text-blue-800' :
                      kartela.durum === 'arsivde' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {kartela.durum}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatTarih(kartela.guncellemeTarihi)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {mevcutKartelalar.length > 5 && (
            <div className="p-4 border-t text-center">
              <button 
                onClick={() => setActiveTab('kartelalar')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + {mevcutKartelalar.length - 5} kartela daha görüntüle →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alt Araçlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border">
          <h4 className="font-bold text-gray-900 mb-4">📦 Hızlı Barkod Tarama</h4>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-600">Kartela barkodunu taratın:</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex-1 px-4 py-3 bg-white border rounded-lg font-mono text-center">
                  2301____.__
                </div>
                <button className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Tara
                </button>
              </div>
            </div>
            <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition">
              📷 Kamera ile Tarama Başlat
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h4 className="font-bold text-gray-900 mb-4">📊 İstatistikler</h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Aktif Kartelalar</span>
                <span>%{Math.round((aktifKartelalar / kartelaCount) * 100)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${(aktifKartelalar / kartelaCount) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Müşteri Atanmış</span>
                <span>%{Math.round((musteriCount / kartelaCount) * 100)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${(musteriCount / kartelaCount) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Boş Stok</span>
                <span>%32.4</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '32.4%' }}></div>
              </div>
            </div>
          </div>
          <button className="w-full mt-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center justify-center gap-2 transition">
            <Download className="h-4 w-4" />
            Rapor İndir (PDF)
          </button>
        </div>
      </div>
    </div>
  );

  // Tüm Kartelalar görünümü
  const renderTumKartelalar = () => (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          ← Geri
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tüm Kartelalar</h2>
          <p className="text-gray-600">Kartela Odası'ndaki tüm kartelalar</p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Kartela ara..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={kartelaFilter}
            onChange={(e) => setKartelaFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tümü</option>
            <option value="aktif">Aktif</option>
            <option value="kullanımda">Kullanımda</option>
            <option value="arsivde">Arşivde</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kartela No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Renk</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kod</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Müşteri</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lokasyon</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlem</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mevcutKartelalar.map((kartela) => (
              <tr key={kartela.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-mono font-bold">{kartela.kartelaNo}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-semibold">{kartela.renkAdi}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                    {kartela.renkKodu}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {kartela.musteri || 'Genel'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3" />
                    {kartela.mevcutLokasyon.hucre}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    kartela.durum === 'aktif' ? 'bg-green-100 text-green-800' :
                    kartela.durum === 'kullanımda' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {kartela.durum}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-600 hover:text-blue-600">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-green-600">
                      <QrCode className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-purple-600">
                      <Printer className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Toplam {mevcutKartelalar.length} kartela
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border rounded-lg">Önceki</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Sonraki</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {activeTab === 'dashboard' ? renderDashboard() : 
       activeTab === 'kartelalar' ? renderTumKartelalar() :
       activeTab === 'yeni' ? (
         <div className="bg-white rounded-xl p-8">
           <div className="text-center py-12">
             <div className="text-5xl mb-6">✨</div>
             <h2 className="text-2xl font-bold mb-4">Yeni Kartela Oluştur</h2>
             <p className="text-gray-600">Bu özellik aktif edilecek...</p>
           </div>
         </div>
       ) : activeTab === 'sifirla' ? (
         <div className="bg-white rounded-xl p-8">
           <div className="text-center py-12">
             <div className="text-5xl mb-6">🔄</div>
             <h2 className="text-2xl font-bold mb-4">Kartela Sıfırlama</h2>
             <p className="text-gray-600">Bu özellik aktif edilecek...</p>
           </div>
         </div>
       ) : (
         <div className="bg-white rounded-xl p-8">
           <div className="text-center py-12">
             <div className="text-5xl mb-6">🎁</div>
             <h2 className="text-2xl font-bold mb-4">Müşteriye Kartela Ata</h2>
             <p className="text-gray-600">Bu özellik aktif edilecek...</p>
           </div>
         </div>
       )}
    </div>
  );
}
