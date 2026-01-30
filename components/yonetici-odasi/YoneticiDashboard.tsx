'use client';

import { useState } from 'react';
import { 
  User, Shield, Key, Lock, Unlock, Edit, Trash2, 
  Plus, Search, Filter, Check, X, Building, Eye,
  Settings, Users, DoorOpen, KeyRound, Archive
} from 'lucide-react';

// Mock kullanıcı verileri - Ahmet Amir'e Yönetici Odası yetkisi eklendi
const mockKullanicilar = [
  {
    id: 'USER-AHMET-001',
    ad: 'Ahmet Amir',
    unvan: 'Amir',
    odalar: ['Amir Odası', 'Kartela Odası', 'Üretim Alanı', 'Depo', 'Yönetici Odası'],
    yetkiler: ['tum_oda_giris', 'kartela_olustur', 'kartela_sifirla', 'rapor_al', 'yonetici_panel'],
    durum: 'aktif',
    sonGiris: '2024-01-25T14:30:00Z'
  },
  {
    id: 'USER-MEHMET-001',
    ad: 'Mehmet Kartela',
    unvan: 'Kartela Sorumlusu',
    odalar: ['Kartela Odası', 'Depo'],
    yetkiler: ['kartela_olustur', 'kartela_sifirla', 'kartela_ara'],
    durum: 'aktif',
    sonGiris: '2024-01-25T10:15:00Z'
  },
  {
    id: 'USER-AYSE-001',
    ad: 'Ayşe Üretim',
    unvan: 'Üretim Sorumlusu',
    odalar: ['Üretim Alanı'],
    yetkiler: ['kartela_ara', 'uretim_kaydi'],
    durum: 'aktif',
    sonGiris: '2024-01-24T16:45:00Z'
  },
  {
    id: 'USER-ALI-001',
    ad: 'Ali Depo',
    unvan: 'Depo Sorumlusu',
    odalar: ['Depo'],
    yetkiler: ['kartela_ara', 'depo_kaydi'],
    durum: 'pasif',
    sonGiris: '2024-01-20T09:30:00Z'
  },
  {
    id: 'USER-YONETICI-001',
    ad: 'Sistem Yöneticisi',
    unvan: 'Yönetici',
    odalar: ['Amir Odası', 'Kartela Odası', 'Üretim Alanı', 'Depo', 'Yönetici Odası'],
    yetkiler: [
      'tum_oda_giris', 'kullanici_yonet', 'yetki_ata', 'rapor_al', 'sistem_ayar',
      'oda_olustur', 'kullanici_sil', 'log_goruntule', 'backup_al', 'kartela_olustur',
      'kartela_sifirla', 'kartela_ara', 'musteri_ata', 'uretim_kaydi', 'depo_kaydi'
    ],
    durum: 'aktif',
    sonGiris: '2024-01-25T08:00:00Z'
  }
];

// Oda listesi - Yönetici Odası eklendi
const odalar = [
  'Amir Odası',
  'Kartela Odası', 
  'Üretim Alanı',
  'Depo',
  'Yönetici Odası'
];

// Tüm yetki listesi - Yönetici için tam yetkiler
const yetkiler = [
  // Temel Yetkiler
  { id: 'tum_oda_giris', ad: 'Tüm Odalara Giriş', aciklama: 'Tüm odalara erişim izni', kategori: 'temel' },
  { id: 'kartela_olustur', ad: 'Kartela Oluştur', aciklama: 'Yeni kartela oluşturabilir', kategori: 'kartela' },
  { id: 'kartela_sifirla', ad: 'Kartela Sıfırla', aciklama: 'Kartela sıfırlayabilir', kategori: 'kartela' },
  { id: 'kartela_ara', ad: 'Kartela Arama', aciklama: 'Kartela araması yapabilir', kategori: 'kartela' },
  { id: 'musteri_ata', ad: 'Müşteri Ata', aciklama: 'Kartelaya müşteri atayabilir', kategori: 'kartela' },
  
  // Kullanıcı Yönetimi
  { id: 'kullanici_yonet', ad: 'Kullanıcı Yönet', aciklama: 'Kullanıcı ekleyebilir/silebilir', kategori: 'kullanici' },
  { id: 'yetki_ata', ad: 'Yetki Ata', aciklama: 'Kullanıcılara yetki atayabilir', kategori: 'kullanici' },
  { id: 'kullanici_sil', ad: 'Kullanıcı Sil', aciklama: 'Kullanıcı hesabını silebilir', kategori: 'kullanici' },
  { id: 'sifre_sifirla', ad: 'Şifre Sıfırla', aciklama: 'Kullanıcı şifresini sıfırlayabilir', kategori: 'kullanici' },
  
  // Oda Yönetimi
  { id: 'oda_olustur', ad: 'Oda Oluştur', aciklama: 'Yeni oda oluşturabilir', kategori: 'oda' },
  { id: 'oda_duzenle', ad: 'Oda Düzenle', aciklama: 'Oda bilgilerini düzenleyebilir', kategori: 'oda' },
  { id: 'oda_sil', ad: 'Oda Sil', aciklama: 'Odayı silebilir', kategori: 'oda' },
  
  // Sistem Yönetimi
  { id: 'sistem_ayar', ad: 'Sistem Ayarları', aciklama: 'Sistem ayarlarını değiştirebilir', kategori: 'sistem' },
  { id: 'rapor_al', ad: 'Rapor Al', aciklama: 'Sistem raporları alabilir', kategori: 'sistem' },
  { id: 'log_goruntule', ad: 'Log Görüntüle', aciklama: 'Sistem loglarını görüntüleyebilir', kategori: 'sistem' },
  { id: 'backup_al', ad: 'Backup Al', aciklama: 'Sistem yedeği alabilir', kategori: 'sistem' },
  { id: 'yonetici_panel', ad: 'Yönetici Paneli', aciklama: 'Yönetici paneline erişebilir', kategori: 'sistem' },
  
  // Operasyonel Yetkiler
  { id: 'uretim_kaydi', ad: 'Üretim Kaydı', aciklama: 'Üretim kaydı oluşturabilir', kategori: 'operasyon' },
  { id: 'depo_kaydi', ad: 'Depo Kaydı', aciklama: 'Depo kaydı oluşturabilir', kategori: 'operasyon' },
  { id: 'stok_yonet', ad: 'Stok Yönetimi', aciklama: 'Stok yönetimi yapabilir', kategori: 'operasyon' }
];

// Yetki kategorilerine göre grupla
const yetkiKategorileri = [
  { id: 'temel', ad: 'Temel Yetkiler', icon: KeyRound },
  { id: 'kartela', ad: 'Kartela Yetkileri', icon: Archive },
  { id: 'kullanici', ad: 'Kullanıcı Yönetimi', icon: Users },
  { id: 'oda', ad: 'Oda Yönetimi', icon: DoorOpen },
  { id: 'sistem', ad: 'Sistem Yönetimi', icon: Settings },
  { id: 'operasyon', ad: 'Operasyonel Yetkiler', icon: Building }
];

interface YoneticiDashboardProps {
  roomName: string;
}

export default function YoneticiDashboard({ roomName }: YoneticiDashboardProps) {
  const [kullanicilar, setKullanicilar] = useState(mockKullanicilar);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showYetkiModal, setShowYetkiModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    ad: '',
    unvan: '',
    odalar: [] as string[],
    yetkiler: [] as string[]
  });
  const [showOdaModal, setShowOdaModal] = useState(false);
  const [yeniOdaAdi, setYeniOdaAdi] = useState('');

  // Kullanıcı arama
  const filteredUsers = kullanicilar.filter(user =>
    user.ad.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.unvan.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Kullanıcı detayını göster
  const handleUserClick = (user: any) => {
    setSelectedUser(user);
  };

  // Kullanıcı durumunu değiştir
  const toggleUserStatus = (userId: string) => {
    setKullanicilar(prev => prev.map(user =>
      user.id === userId 
        ? { ...user, durum: user.durum === 'aktif' ? 'pasif' : 'aktif' }
        : user
    ));
  };

  // Yeni kullanıcı modal'ı aç
  const openNewUserModal = () => {
    setNewUser({
      ad: '',
      unvan: '',
      odalar: [],
      yetkiler: []
    });
    setEditingUser(null);
    setShowUserModal(true);
  };

  // Kullanıcı düzenle modal'ı aç
  const openEditUserModal = (user: any) => {
    setEditingUser(user);
    setNewUser({
      ad: user.ad,
      unvan: user.unvan,
      odalar: [...user.odalar],
      yetkiler: [...user.yetkiler]
    });
    setShowUserModal(true);
  };

  // Kullanıcıyı kaydet
  const saveUser = () => {
    if (editingUser) {
      // Düzenleme
      setKullanicilar(prev => prev.map(user =>
        user.id === editingUser.id
          ? { ...user, ...newUser }
          : user
      ));
    } else {
      // Yeni kullanıcı
      const newUserObj = {
        id: `USER-${Date.now().toString().slice(-6)}`,
        ...newUser,
        durum: 'aktif',
        sonGiris: new Date().toISOString()
      };
      setKullanicilar(prev => [...prev, newUserObj]);
    }
    setShowUserModal(false);
  };

  // Kullanıcı sil
  const deleteUser = (userId: string) => {
    if (confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
      setKullanicilar(prev => prev.filter(user => user.id !== userId));
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
    }
  };

  // Yetki modal'ını aç
  const openYetkiModal = (user: any) => {
    setSelectedUser(user);
    setShowYetkiModal(true);
  };

  // Yetki ata/kaldır
  const toggleYetki = (yetkiId: string) => {
    if (!selectedUser) return;
    
    const updatedYetkiler = selectedUser.yetkiler.includes(yetkiId)
      ? selectedUser.yetkiler.filter((y: string) => y !== yetkiId)
      : [...selectedUser.yetkiler, yetkiId];
    
    setKullanicilar(prev => prev.map(user =>
      user.id === selectedUser.id
        ? { ...user, yetkiler: updatedYetkiler }
        : user
    ));
    
    setSelectedUser({ ...selectedUser, yetkiler: updatedYetkiler });
  };

  // Tüm yetkileri ver
  const tumYetkileriVer = () => {
    if (!selectedUser) return;
    
    const tumYetkiIds = yetkiler.map(y => y.id);
    setKullanicilar(prev => prev.map(user =>
      user.id === selectedUser.id
        ? { ...user, yetkiler: tumYetkiIds }
        : user
    ));
    
    setSelectedUser({ ...selectedUser, yetkiler: tumYetkiIds });
    alert('Tüm yetkiler verildi!');
  };

  // Tüm yetkileri kaldır
  const tumYetkileriKaldir = () => {
    if (!selectedUser) return;
    
    if (confirm('Tüm yetkileri kaldırmak istediğinize emin misiniz?')) {
      setKullanicilar(prev => prev.map(user =>
        user.id === selectedUser.id
          ? { ...user, yetkiler: [] }
          : user
      ));
      
      setSelectedUser({ ...selectedUser, yetkiler: [] });
    }
  };

  // Oda ekle/kaldır
  const toggleOda = (oda: string) => {
    if (!selectedUser) return;
    
    const updatedOdalar = selectedUser.odalar.includes(oda)
      ? selectedUser.odalar.filter((o: string) => o !== oda)
      : [...selectedUser.odalar, oda];
    
    setKullanicilar(prev => prev.map(user =>
      user.id === selectedUser.id
        ? { ...user, odalar: updatedOdalar }
        : user
    ));
    
    setSelectedUser({ ...selectedUser, odalar: updatedOdalar });
  };

  // Yeni oda ekle
  const yeniOdaEkle = () => {
    if (yeniOdaAdi.trim() && !odalar.includes(yeniOdaAdi.trim())) {
      odalar.push(yeniOdaAdi.trim());
      setYeniOdaAdi('');
      setShowOdaModal(false);
      alert('Yeni oda eklendi: ' + yeniOdaAdi.trim());
    }
  };

  // Yetki adını getir
  const getYetkiAdi = (yetkiId: string) => {
    const yetki = yetkiler.find(y => y.id === yetkiId);
    return yetki ? yetki.ad : yetkiId;
  };

  // Yetki kategorisine göre filtrele
  const getYetkilerByKategori = (kategoriId: string) => {
    return yetkiler.filter(y => y.kategori === kategoriId);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Başlık */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Shield className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🚀 Yönetici Kontrol Paneli</h1>
            <p className="text-gray-600">Tam yetkili yönetici paneli - Tüm sistem kontrolü</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
            👑 Tam Yetkili Yönetici
          </div>
          <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            📍 {roomName}
          </div>
          <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            👥 {kullanicilar.length} Kullanıcı
          </div>
          <div className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            🚨 Kritik Yetkiler Aktif
          </div>
        </div>
      </div>

      {/* Üst Araç Çubuğu */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kullanıcı adı, unvan veya ID ile ara..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowOdaModal(true)}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <DoorOpen className="h-4 w-4" />
              Oda Ekle
            </button>
            <button
              onClick={openNewUserModal}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Kullanıcı Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Ana İçerik */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol: Kullanıcı Listesi */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Kullanıcı Yönetimi</h2>
              <p className="text-gray-600 text-sm">Kullanıcıları düzenleyin, yetkileri yönetin</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kullanıcı</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Odalar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yetkiler</th>
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
                          <div className={`p-2 rounded-lg ${
                            user.unvan === 'Yönetici' ? 'bg-purple-100' :
                            user.unvan.includes('Amir') ? 'bg-blue-100' :
                            'bg-gray-100'
                          }`}>
                            <User className={`h-5 w-5 ${
                              user.unvan === 'Yönetici' ? 'text-purple-600' :
                              user.unvan.includes('Amir') ? 'text-blue-600' :
                              'text-gray-600'
                            }`} />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{user.ad}</div>
                            <div className="text-sm text-gray-500">{user.unvan}</div>
                            <div className="text-xs text-gray-400 font-mono">{user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.odalar.slice(0, 3).map((oda) => (
                            <span key={oda} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                              {oda}
                            </span>
                          ))}
                          {user.odalar.length > 3 && (
                            <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">
                              +{user.odalar.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {user.yetkiler.length} yetki
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            user.durum === 'aktif' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className={`text-sm font-medium ${
                            user.durum === 'aktif' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {user.durum === 'aktif' ? 'Aktif' : 'Pasif'}
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
                              openYetkiModal(user);
                            }}
                            className="p-2 text-gray-600 hover:text-green-600"
                            title="Yetki Yönet"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleUserStatus(user.id);
                            }}
                            className="p-2 text-gray-600 hover:text-yellow-600"
                            title={user.durum === 'aktif' ? 'Pasif Yap' : 'Aktif Yap'}
                          >
                            {user.durum === 'aktif' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </button>
                          {user.id !== 'USER-YONETICI-001' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteUser(user.id);
                              }}
                              className="p-2 text-gray-600 hover:text-red-600"
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sağ: Seçili Kullanıcı Detayı */}
        <div className="lg:col-span-1">
          {selectedUser ? (
            <div className="bg-white rounded-xl shadow p-6 sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-xl ${
                  selectedUser.unvan === 'Yönetici' ? 'bg-purple-100' :
                  selectedUser.unvan.includes('Amir') ? 'bg-blue-100' :
                  'bg-gray-100'
                }`}>
                  <User className={`h-8 w-8 ${
                    selectedUser.unvan === 'Yönetici' ? 'text-purple-600' :
                    selectedUser.unvan.includes('Amir') ? 'text-blue-600' :
                    'text-gray-600'
                  }`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedUser.ad}</h3>
                  <p className="text-gray-600">{selectedUser.unvan}</p>
                  <p className="text-sm text-gray-400 font-mono">{selectedUser.id}</p>
                </div>
              </div>

              {/* Hızlı Yetki Butonları */}
              <div className="mb-6 grid grid-cols-2 gap-2">
                <button
                  onClick={tumYetkileriVer}
                  className="py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Tüm Yetkileri Ver
                </button>
                <button
                  onClick={tumYetkileriKaldir}
                  className="py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Tüm Yetkileri Kaldır
                </button>
              </div>

              {/* Oda Erişimleri */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Oda Erişimleri</h4>
                  <button
                    onClick={() => openYetkiModal(selectedUser)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Düzenle
                  </button>
                </div>
                <div className="space-y-2">
                  {odalar.map((oda) => (
                    <div key={oda} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span>{oda}</span>
                      </div>
                      {selectedUser.odalar.includes(oda) ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Yetki Özeti */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Yetki Özeti</h4>
                <div className="space-y-3">
                  {yetkiKategorileri.map((kategori) => {
                    const kategoriYetkileri = selectedUser.yetkiler.filter((y: string) => 
                      yetkiler.find(yt => yt.id === y)?.kategori === kategori.id
                    );
                    return (
                      <div key={kategori.id} className="p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2 mb-1">
                          <kategori.icon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{kategori.ad}</span>
                          <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {kategoriYetkileri.length}/{getYetkilerByKategori(kategori.id).length}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Durum ve Son Giriş */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">Durum:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedUser.durum === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedUser.durum === 'aktif' ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Son giriş: {new Date(selectedUser.sonGiris).toLocaleDateString('tr-TR')}
                </div>
              </div>

              {/* Detaylı Yönetim Butonları */}
              <div className="mt-6 space-y-2">
                <button
                  onClick={() => openYetkiModal(selectedUser)}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  🎛️ Detaylı Yetki Yönetimi
                </button>
                <button
                  onClick={() => toggleUserStatus(selectedUser.id)}
                  className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {selectedUser.durum === 'aktif' ? '🔒 Hesabı Pasifleştir' : '🔓 Hesabı Aktifleştir'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <div className="text-4xl mb-4">👑</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Yönetici Paneli</h3>
              <p className="text-gray-600 mb-4">Soldaki listeden bir kullanıcı seçin.</p>
              <div className="text-sm text-gray-500">
                <p>✅ Yeni kullanıcı oluştur</p>
                <p>✅ Oda yetkileri yönet</p>
                <p>✅ Sistem yetkileri ata</p>
                <p>✅ Kullanıcıları sil</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Yeni Kullanıcı/Düzenle Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Oluştur'}
                  </h2>
                  <p className="text-gray-600">Kullanıcı bilgilerini girin ve yetkileri belirleyin</p>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sol: Temel Bilgiler */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad *</label>
                    <input
                      type="text"
                      value={newUser.ad}
                      onChange={(e) => setNewUser({...newUser, ad: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Ahmet Yılmaz"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unvan *</label>
                    <select
                      value={newUser.unvan}
                      onChange={(e) => setNewUser({...newUser, unvan: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="">Unvan Seçin</option>
                      <option value="Yönetici">👑 Yönetici (Tam Yetki)</option>
                      <option value="Amir">👔 Amir (Yönetim)</option>
                      <option value="Kartela Sorumlusu">🎨 Kartela Sorumlusu</option>
                      <option value="Üretim Sorumlusu">🏭 Üretim Sorumlusu</option>
                      <option value="Depo Sorumlusu">📦 Depo Sorumlusu</option>
                      <option value="Personel">👤 Personel (Sınırlı Yetki)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Oda Erişimleri</label>
                    <div className="space-y-2 max-h-60 overflow-y-auto p-3 border rounded-lg">
                      {odalar.map((oda) => (
                        <div key={oda} className="flex items-center gap-
# app/page.tsx'te şu kısmı bul ve düzenle:
cat > temp_patch.txt << 'EOF'
// KartelaOdaDashboard kullanımını şu şekilde güncelle:
{currentRoom.name === 'Kartela Odası' ? (
  <KartelaOdaDashboard roomName={currentRoom.name} />
) : currentRoom.name === 'Yönetici Odası' ? (
  <YoneticiDashboard roomName={currentRoom.name} />
) : (
  <KartelaSearch currentRoom={currentRoom.name} />
)}
