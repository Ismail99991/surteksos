'use client';

import { useState, useEffect } from 'react';
import { User, Building, Search, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function YoneticiDashboard({ roomName, roomId }: { roomName: string; roomId: number }) {
  const [kullanicilar, setKullanicilar] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState('');

  // 1. KULLANICILARI YÜKLE
  useEffect(() => {
    console.log('🔧 Yükleniyor - Oda ID:', roomId);
    setDebug(`Oda: ${roomName} (ID: ${roomId})`);
    
    if (!roomId) {
      setDebug('❌ HATA: Oda ID yok!');
      return;
    }
    
    loadKullanicilar();
  }, [roomId]);

  const loadKullanicilar = async () => {
    setLoading(true);
    try {
      console.log('📡 Kullanıcılar yükleniyor...');
      
      // 1. ÖNCE: Tüm kullanıcıları göster (TEST için)
      const { data: tumKullanicilar, error: tumError } = await supabase
        .from('kullanicilar')
        .select('*')
        .order('ad');
      
      if (tumError) throw tumError;
      
      console.log('✅ Tüm kullanıcılar:', tumKullanicilar?.length);
      setKullanicilar(tumKullanicilar || []);
      setDebug(`${tumKullanicilar?.length || 0} kullanıcı bulundu`);
      
      // 2. SONRA: Bu odaya yetkili olanları bul
      const { data: yetkiler, error: yetkiError } = await supabase
        .from('kullanici_yetkileri')
        .select('kullanici_id')
        .eq('oda_id', roomId);
      
      if (yetkiError) throw yetkiError;
      
      console.log('📊 Bu odada yetkili kullanıcı sayısı:', yetkiler?.length || 0);
      
    } catch (error: any) {
      console.error('❌ HATA:', error);
      setDebug(`HATA: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Yönetici Odası</h1>
        <div className="flex gap-4 mt-2">
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            📍 {roomName}
          </div>
          <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            🔑 Oda ID: {roomId || 'YOK!'}
          </div>
          <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
            👥 {kullanicilar.length} Kullanıcı
          </div>
        </div>
        
        {/* DEBUG */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="font-mono text-sm">
            🐛 <strong>Debug:</strong> {debug}
          </div>
          {loading && <div className="mt-2 text-sm">⏳ Yükleniyor...</div>}
        </div>
      </div>

      {/* ARAMA */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Kullanıcı ara..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* KULLANICI LİSTESİ */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Kullanıcı Listesi</h2>
          <p className="text-gray-600 text-sm">
            {roomName} odasına yetkili kullanıcılar
          </p>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-gray-600">Kullanıcılar yükleniyor...</p>
          </div>
        ) : kullanicilar.length === 0 ? (
          <div className="p-8 text-center">
            <User className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold text-gray-700">Kullanıcı bulunamadı</h3>
            <p className="text-gray-500 mt-1">Henüz kullanıcı eklenmemiş veya yüklenemedi.</p>
            <button 
              onClick={loadKullanicilar}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tekrar Dene
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {kullanicilar.slice(0, 10).map((user) => (
              <div key={user.id} className="p-4 hover:bg-gray-50 flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{user.ad} {user.soyad}</div>
                  <div className="text-sm text-gray-500">{user.kullanici_kodu}</div>
                  <div className="text-xs text-gray-400">{user.unvan || 'Unvan yok'}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm ${user.aktif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {user.aktif ? 'Aktif' : 'Pasif'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM DEBUG */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <div className="text-sm font-mono">
          <div>🔧 <strong>Console'da kontrol edin:</strong></div>
          <div className="mt-2 text-gray-700">
            1. "Yükleniyor - Oda ID: X" görüyor musunuz?<br/>
            2. "Kullanıcılar yükleniyor..." görüyor musunuz?<br/>
            3. "Tüm kullanıcılar: X" görüyor musunuz?
          </div>
        </div>
      </div>
    </div>
  );
}