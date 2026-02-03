// @ts-nocheck

import { useState, useEffect } from 'react';
import { 
  User, Shield, Key, Lock, Unlock, Edit, Trash2, 
  Plus, Search, Filter, Check, X, Building, Eye,
  Settings, Users, DoorOpen, KeyRound, Archive,
  QrCode, Download, Copy
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import QRCode from 'qrcode';

type KullaniciType = Database['public']['Tables']['kullanicilar']['Row'];
type OdaType = Database['public']['Tables']['odalar']['Row'];
type YetkiType = Database['public']['Tables']['kullanici_yetkileri']['Row'];

interface YoneticiDashboardProps {
  roomName: string;
  roomId: number; // ✓ Zorunlu
  currentUserId?: number;
}

export default function YoneticiDashboard({ 
  roomName, 
  roomId,
  currentUserId 
}: YoneticiDashboardProps) {
  const [kullanicilar, setKullanicilar] = useState<KullaniciType[]>([]);
  const [odalar, setOdalar] = useState<OdaType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<KullaniciType | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showYetkiModal, setShowYetkiModal] = useState(false);
  const [editingUser, setEditingUser] = useState<KullaniciType | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  const [newUser, setNewUser] = useState({
    kullanici_kodu: '',
    ad: '',
    soyad: '',
    unvan: '',
    departman: '',
    qr_kodu: '',
    sifre_hash: 'temp123',
    aktif: true
  });


  // Verileri yükle - roomId kontrolü eklendi
 useEffect(() => {
  // 1. roomId kontrolü
  if (!roomId) {
    console.error('❌ HATA: roomId tanımsız!');
    setDebugInfo('HATA: roomId tanımsız. Ana sayfadan odaya giriş yapın.');
    return;
  }
  
  console.log(`🚀 Dashboard başlatılıyor: Oda ID=${roomId}, Ad=${roomName}`);
  setDebugInfo(`Oda ID: ${roomId} | Yükleniyor...`);
  
  // 2. Kullanıcıları çek (YENİ - useEffect İÇİNDE)
  const fetchKullanicilar = async () => {
    try {
      console.log(`🔍 Oda ${roomId} için kullanıcılar çekiliyor...`);
      
      // Bu odaya yetkisi olanları çek
      const { data: yetkiData, error: yetkiError } = await supabase
        .from('kullanici_yetkileri')
        .select(`
          kullanici_id,
          kullanicilar:kullanici_id (*)
        `)
        .eq('oda_id', roomId);
      
      if (yetkiError) {
        console.error('Yetkili kullanıcılar yüklenemedi:', yetkiError);
        setDebugInfo(`HATA: ${yetkiError.message}`);
        setKullanicilar([]);
        return;
      }
      
      const filteredUsers = yetkiData?.map((item: any) => item.kullanicilar) || [];
      
      console.log(`✅ Oda ${roomId} için ${filteredUsers.length} yetkili kullanıcı bulundu`);
      console.log('👥 Yetkili kullanıcılar:', filteredUsers);
      
      setKullanicilar(filteredUsers);
      setDebugInfo(`Yetkili kullanıcılar: ${filteredUsers.length} | Oda ID: ${roomId}`);
      
    } catch (error) {
      console.error('❌ Kullanıcılar yüklenemedi:', error);
      setKullanicilar([]);
      setDebugInfo(`HATA: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  };
  
  // 3. Odaları çek (mevcut fonksiyon)
  const fetchOdalar = async () => {
    try {
      const { data, error } = await supabase
        .from('odalar')
        .select('*')
        .eq('aktif', true)
        .order('oda_kodu');
      
      if (error) throw error;
      setOdalar(data || []);
    } catch (error) {
      console.error('Odalar yüklenemedi:', error);
      setOdalar([]);
    }
  };
  
  // 4. Her ikisini de çalıştır
  fetchKullanicilar();
  fetchOdalar();
  
}, [roomId, roomName]); // ← roomId ve roomName dependencyleri eklendi

  const fetchOdalar = async () => {
    try {
      const { data, error } = await supabase
        .from('odalar')
        .select('*')
        .eq('aktif', true)
        .order('oda_kodu');
      
      if (error) throw error;
      setOdalar(data || []);
    } catch (error) {
      console.error('Odalar yüklenemedi:', error);
      setOdalar([]);
    }
  };

  // Kullanıcı arama
  const filteredUsers = kullanicilar.filter(user =>
    user.ad.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.soyad.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.kullanici_kodu.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.unvan?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // QR kodu oluştur
  const generateQRCode = async (text: string) => {
    try {
      const qr = await QRCode.toDataURL(text);
      setQrCodeData(qr);
      return qr;
    } catch (error) {
      console.error('QR kod oluşturma hatası:', error);
      return '';
    }
  };

  // Kullanıcı QR kodu oluştur
  const handleGenerateUserQR = async (user: KullaniciType) => {
    setLoading(true);
    const qrText = `USER-${user.kullanici_kodu}-${Date.now()}`;
    
    try {
      const qrCode = await generateQRCode(qrText);
      
      const { error } = await supabase
        .from('kullanicilar')
        .update({ qr_kodu: qrText })
        .eq('id', user.id);
      
      if (error) throw error;
      
      await fetchKullanicilar();
      setQrCodeData(qrCode);
      alert('QR kodu oluşturuldu ve kullanıcıya atandı!');
      
    } catch (error) {
      console.error('QR kod atama hatası:', error);
      alert('QR kodu oluşturulamadı!');
    } finally {
      setLoading(false);
    }
  };

  // Oda QR kodu oluştur
  const handleGenerateRoomQR = async (oda: OdaType) => {
    setLoading(true);
    const qrText = `ROOM-${oda.oda_kodu}-${Date.now()}`;
    
    try {
      const qrCode = await generateQRCode(qrText);
      
      const { error } = await supabase
        .from('odalar')
        .update({ qr_kodu: qrText })
        .eq('id', oda.id);
      
      if (error) throw error;
      
      await fetchOdalar();
      setQrCodeData(qrCode);
      alert('Oda QR kodu oluşturuldu!');
      
    } catch (error) {
      console.error('Oda QR kod hatası:', error);
      alert('Oda QR kodu oluşturulamadı!');
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı durumunu değiştir
  const toggleUserStatus = async (user: KullaniciType) => {
    try {
      const { error } = await supabase
        .from('kullanicilar')
        .update({ aktif: !user.aktif })
        .eq('id', user.id);
      
      if (error) throw error;
      
      await fetchKullanicilar();
      alert(`Kullanıcı ${!user.aktif ? 'aktif' : 'pasif'} yapıldı!`);
      
    } catch (error) {
      console.error('Kullanıcı durumu değiştirme hatası:', error);
      alert('İşlem başarısız!');
    }
  };

  // Yeni kullanıcı oluştur
  const saveUser = async () => {
    if (!newUser.kullanici_kodu || !newUser.ad || !newUser.soyad) {
      alert('Lütfen zorunlu alanları doldurun!');
      return;
    }

    try {
      if (editingUser) {
        const { error } = await supabase
          .from('kullanicilar')
          .update(newUser)
          .eq('id', editingUser.id);
        
        if (error) throw error;
        alert('Kullanıcı güncellendi!');
      } else {
        const { error } = await supabase
          .from('kullanicilar')
          .insert([newUser]);
        
        if (error) throw error;
        alert('Yeni kullanıcı oluşturuldu!');
      }
      
      await fetchKullanicilar();
      setShowUserModal(false);
      resetNewUserForm();
      
    } catch (error) {
      console.error('Kullanıcı kaydetme hatası:', error);
      alert('Kullanıcı kaydedilemedi!');
    }
  };

  const resetNewUserForm = () => {
    setNewUser({
      kullanici_kodu: '',
      ad: '',
      soyad: '',
      unvan: '',
      departman: '',
      qr_kodu: '',
      sifre_hash: 'temp123',
      aktif: true
    });
    setEditingUser(null);
  };

  // Kullanıcı yetkilerini yönet
  const handleYetkiYonet = async (user: KullaniciType, odaId: number, yetki: keyof YetkiType) => {
    try {
      // Önce bu kullanıcının bu odada yetkisi var mı kontrol et
      const { data: existing, error: checkError } = await supabase
        .from('kullanici_yetkileri')
        .select('*')
        .eq('kullanici_id', user.id)
        .eq('oda_id', odaId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      
      if (existing) {
        const { error } = await supabase
          .from('kullanici_yetkileri')
          .update({ [yetki]: !existing[yetki] })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Yeni yetki oluştur - sadece bu oda için
        const { error } = await supabase
          .from('kullanici_yetkileri')
          .insert([{
            kullanici_id: user.id,
            oda_id: odaId,
            [yetki]: true
          }]);
        
        if (error) throw error;
      }
      
      alert('Yetki güncellendi!');
      
    } catch (error) {
      console.error('Yetki yönetimi hatası:', error);
      alert('Yetki güncellenemedi!');
    }
  };

  // Kullanıcı detayını göster
  const handleUserClick = (user: KullaniciType) => {
    setSelectedUser(user);
  };

  // Kullanıcı düzenle modal'ı aç
  const openEditUserModal = (user: KullaniciType) => {
    setEditingUser(user);
    setNewUser({
      kullanici_kodu: user.kullanici_kodu,
      ad: user.ad,
      soyad: user.soyad,
      unvan: user.unvan || '',
      departman: user.departman || '',
      qr_kodu: user.qr_kodu || '',
      sifre_hash: user.sifre_hash,
      aktif: user.aktif
    });
    setShowUserModal(true);
  };

  // QR kodu indir
  const downloadQRCode = () => {
    if (!qrCodeData) return;
    
    const link = document.createElement('a');
    link.href = qrCodeData;
    link.download = `qr-code-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Debug için
  console.log(`🚀 Dashboard çalışıyor: Oda ID=${roomId}, Oda Adı=${roomName}`);
  console.log(`👥 Kullanıcı sayısı: ${kullanicilar.length}`);
  console.log(`🚪 Oda sayısı: ${odalar.length}`);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Başlık - debug bilgisi eklendi */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Shield className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yönetici Kontrol Paneli</h1>
            <p className="text-gray-600">Kullanıcı yetkilerini ve oda erişimlerini yönetin</p>
            
            {/* ✓ DÜZELTİLDİ: Debug bilgileri */}
            <div className="mt-2 text-sm space-y-1">
              <div className="flex gap-4">
                <div>
                  📍 Oda: <code className="bg-gray-100 px-2 py-1 rounded">{roomName}</code>
                </div>
                <div>
                  🔑 Oda ID: <code className="bg-gray-100 px-2 py-1 rounded">{roomId || 'TANIMSIZ!'}</code>
                </div>
                <div>
                  👥 Yetkili: <code className="bg-gray-100 px-2 py-1 rounded">{kullanicilar.length} kişi</code>
                </div>
              </div>
              
              {/* Debug bilgisi */}
              {debugInfo && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800">
                  ℹ️ {debugInfo}
                </div>
              )}
              
              {/* Eğer roomId yoksa büyük uyarı */}
              {!roomId && (
                <div className="mt-2 p-3 bg-red-100 text-red-800 rounded border border-red-300">
                  ⚠️ HATA: roomId tanımsız! Lütfen ana sayfadan odaya giriş yapın.
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            📍 {roomName} (ID: {roomId || 'YOK'})
          </div>
          <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            👥 {kullanicilar.length} Kullanıcı
          </div>
          <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
            🚪 {odalar.length} Oda
          </div>
        </div>
      </div>

      {/* Eğer kullanıcı yoksa bilgi göster */}
      {kullanicilar.length === 0 && roomId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-yellow-800">Henüz kullanıcı bulunamadı</h3>
              <p className="text-yellow-700 text-sm">
                Bu odada ({roomName}) henüz yetkilendirilmiş kullanıcı yok. 
                Yeni kullanıcı ekleyin veya mevcut kullanıcılara bu oda için yetki verin.
              </p>
              <button
                onClick={() => {
                  resetNewUserForm();
                  setShowUserModal(true);
                }}
                className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                İlk Kullanıcıyı Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Kod Üretme Bölümü */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Kullanıcı QR Üret */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">Kullanıcı QR Kodu Üret</h3>
          </div>
          
          {kullanicilar.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Henüz kullanıcı yok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {kullanicilar.slice(0, 3).map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{user.ad} {user.soyad}</div>
                    <div className="text-sm text-gray-500">{user.kullanici_kodu}</div>
                  </div>
                  <button
                    onClick={() => handleGenerateUserQR(user)}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <QrCode className="h-4 w-4" />
                    QR Üret
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Oda QR Üret */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Oda QR Kodu Üret</h3>
          </div>
          
          {odalar.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Henüz oda yok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {odalar.slice(0, 3).map(oda => (
                <div key={oda.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{oda.oda_adi}</div>
                    <div className="text-sm text-gray-500">{oda.oda_kodu}</div>
                  </div>
                  <button
                    onClick={() => handleGenerateRoomQR(oda)}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <QrCode className="h-4 w-4" />
                    QR Üret
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Kod Görüntüleme */}
      {qrCodeData && (
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Oluşturulan QR Kodu</h3>
            <div className="flex gap-2">
              <button
                onClick={downloadQRCode}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                İndir
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(qrCodeData);
                  alert('QR kodu kopyalandı!');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Kopyala
              </button>
            </div>
          </div>
          <div className="flex justify-center">
            <img src={qrCodeData} alt="QR Code" className="w-64 h-64" />
          </div>
        </div>
      )}

      {/* Arama ve Yeni Kullanıcı */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kullanıcı adı, soyadı veya kodu ile ara..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                resetNewUserForm();
                setShowUserModal(true);
              }}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Yeni Kullanıcı
            </button>
          </div>
        </div>
      </div>

      {/* Kullanıcı Listesi */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Kullanıcı Listesi</h2>
          <p className="text-gray-600 text-sm">
            {roomName} odasına yetkili kullanıcılar ({kullanicilar.length} kişi)
          </p>
        </div>
        
        {kullanicilar.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Henüz kullanıcı yok</h3>
            <p className="text-gray-500 mb-6">
              Bu odada henüz yetkilendirilmiş kullanıcı bulunmuyor.
            </p>
            <button
              onClick={() => {
                resetNewUserForm();
                setShowUserModal(true);
              }}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              İlk Kullanıcıyı Ekle
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kullanıcı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kodu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">QR Kodu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlem</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className={`hover:bg-gray-50 cursor-pointer ${selectedUser?.id === user.id ? 'bg-blue-50' : ''}`}
                    onClick={() => handleUserClick(user)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${user.aktif ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          <User className={`h-5 w-5 ${user.aktif ? 'text-blue-600' : 'text-gray-600'}`} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{user.ad} {user.soyad}</div>
                          <div className="text-sm text-gray-500">{user.unvan || 'Unvan yok'}</div>
                          <div className="text-xs text-gray-400">{user.departman || 'Departman yok'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{user.kullanici_kodu}</code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {user.qr_kodu ? (
                          <span className="text-green-600 font-mono">{user.qr_kodu.substring(0, 15)}...</span>
                        ) : (
                          <span className="text-red-600">QR Yok</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.aktif ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={`text-sm font-medium ${user.aktif ? 'text-green-700' : 'text-red-700'}`}>
                          {user.aktif ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditUserModal(user);
                          }}
                          className="p-2 text-gray-600 hover:text-blue-600"
                          title="Düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateUserQR(user);
                          }}
                          className="p-2 text-gray-600 hover:text-green-600"
                          title="QR Üret"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleUserStatus(user);
                          }}
                          className="p-2 text-gray-600 hover:text-red-600"
                          title={user.aktif ? 'Pasif Yap' : 'Aktif Yap'}
                        >
                          {user.aktif ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Kullanıcı Detay Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
                  </h2>
                  <p className="text-gray-600">Kullanıcı bilgilerini girin</p>
                </div>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    resetNewUserForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı Kodu *</label>
                    <input
                      type="text"
                      value={newUser.kullanici_kodu}
                      onChange={(e) => setNewUser({...newUser, kullanici_kodu: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="ADMIN001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unvan</label>
                    <input
                      type="text"
                      value={newUser.unvan}
                      onChange={(e) => setNewUser({...newUser, unvan: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Sistem Yöneticisi"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ad *</label>
                    <input
                      type="text"
                      value={newUser.ad}
                      onChange={(e) => setNewUser({...newUser, ad: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Ahmet"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Soyad *</label>
                    <input
                      type="text"
                      value={newUser.soyad}
                      onChange={(e) => setNewUser({...newUser, soyad: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Yılmaz"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Departman</label>
                  <input
                    type="text"
                    value={newUser.departman}
                    onChange={(e) => setNewUser({...newUser, departman: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="IT"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={newUser.aktif}
                    onChange={(e) => setNewUser({...newUser, aktif: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <label className="text-sm text-gray-700">Kullanıcı aktif</label>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    resetNewUserForm();
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  onClick={saveUser}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {editingUser ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yetki Yönetimi Modal */}
      {showYetkiModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Yetki Yönetimi</h2>
                  <p className="text-gray-600">{selectedUser.ad} {selectedUser.soyad} için yetkileri düzenleyin</p>
                  <p className="text-sm text-gray-500">Oda: {roomName} (ID: {roomId})</p>
                </div>
                <button
                  onClick={() => setShowYetkiModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Oda Erişimleri */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {roomName} için Erişimler
                  </h3>
                  <div className="space-y-3">
                    {/* Sadece mevcut oda için yetkiler */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Building className="h-5 w-5 text-gray-500" />
                          <div>
                            <div className="font-medium">{roomName}</div>
                            <div className="text-sm text-gray-500">Oda ID: {roomId}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {(['kartela_olusturabilir', 'kartela_silebilir', 'rapor_gorebilir', 'raf_duzenleyebilir'] as const).map((yetki) => (
                          <button
                            key={yetki}
                            onClick={() => handleYetkiYonet(selectedUser, roomId, yetki)}
                            className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm hover:bg-gray-300"
                          >
                            {yetki.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Oda Aç/Kapat */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Oda Durumları</h3>
                  <div className="space-y-3">
                    {/* Sadece mevcut oda */}
                    {odalar.filter(oda => oda.id === roomId).map((oda) => (
                      <div key={oda.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <DoorOpen className="h-5 w-5 text-gray-500" />
                          <div>
                            <div className="font-medium">{oda.oda_adi}</div>
                            <div className={`text-sm ${oda.aktif ? 'text-green-600' : 'text-red-600'}`}>
                              {oda.aktif ? 'Açık' : 'Kapalı'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const { error } = await supabase
                                .from('odalar')
                                .update({ aktif: !oda.aktif })
                                .eq('id', oda.id);
                              
                              if (error) throw error;
                              await fetchOdalar();
                              alert(`Oda ${!oda.aktif ? 'açıldı' : 'kapandı'}!`);
                            } catch (error) {
                              console.error('Oda durumu değiştirme hatası:', error);
                              alert('İşlem başarısız!');
                            }
                          }}
                          className={`px-4 py-2 rounded-lg ${oda.aktif ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                        >
                          {oda.aktif ? 'Kapat' : 'Aç'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t flex justify-end">
                <button
                  onClick={() => setShowYetkiModal(false)}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Tamam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seçili Kullanıcı Detayı */}
      {selectedUser && !showYetkiModal && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => setShowYetkiModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Key className="h-5 w-5" />
            {selectedUser.ad} için Yetkileri Yönet ({roomName})
          </button>
        </div>
      )}
    </div>
  );
}