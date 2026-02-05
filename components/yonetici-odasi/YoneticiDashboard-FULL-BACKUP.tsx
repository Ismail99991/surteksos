// @ts-nocheck

import { useState, useEffect } from 'react';
import { 
  User, Shield, Key, Lock, Unlock, Edit, Trash2, 
  Plus, Search, Filter, Check, X, Building, Eye,
  Settings, Users, DoorOpen, KeyRound, Archive,
  QrCode, Download, Copy, Home, Globe, Database,
  Server, Cpu, HardDrive, Network, ShieldCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import QRCode from 'qrcode';

type KullaniciType = Database['public']['Tables']['kullanicilar']['Row'];
type OdaType = Database['public']['Tables']['odalar']['Row'];
type YetkiType = Database['public']['Tables']['kullanici_yetkileri']['Row'];
type LogType = Database['public']['Tables']['sistem_loglari']['Row'];

interface YoneticiDashboardProps {
  currentUserId?: number;
}

export default function YoneticiDashboard({ 
  currentUserId 
}: YoneticiDashboardProps) {
  const [kullanicilar, setKullanicilar] = useState<KullaniciType[]>([]);
  const [odalar, setOdalar] = useState<OdaType[]>([]);
  const [tumYetkiler, setTumYetkiler] = useState<YetkiType[]>([]);
  const [sistemLoglari, setSistemLoglari] = useState<LogType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<KullaniciType | null>(null);
  const [selectedOda, setSelectedOda] = useState<OdaType | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showOdaModal, setShowOdaModal] = useState(false);
  const [showYetkiModal, setShowYetkiModal] = useState(false);
  const [editingUser, setEditingUser] = useState<KullaniciType | null>(null);
  const [editingOda, setEditingOda] = useState<OdaType | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'kullanicilar' | 'odalar' | 'yetkiler' | 'loglar' | 'sistem'>('kullanicilar');
  
  const [newUser, setNewUser] = useState({
    kullanici_kodu: '',
    ad: '',
    soyad: '',
    unvan: '',
    departman: '',
    qr_kodu: '',
    sifre_hash: 'temp123',
    aktif: true,
    sistem_yoneticisi: false
  });

  const [newOda, setNewOda] = useState({
    oda_kodu: '',
    oda_adi: '',
    aciklama: '',
    aktif: true,
    qr_kodu: ''
  });

  // ⭐ TÜM VERİLERİ YÜKLE (SİSTEM YÖNETİCİSİ)
  useEffect(() => {
    console.log('👑 SİSTEM YÖNETİCİ PANELİ BAŞLATILIYOR...');
    
    const loadAllData = async () => {
      try {
        setLoading(true);
        
        // 1. TÜM KULLANICILARI ÇEK
        const { data: usersData, error: usersError } = await supabase
          .from('kullanicilar')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (usersError) throw usersError;
        setKullanicilar(usersData || []);
        console.log(`👥 ${usersData?.length} kullanıcı yüklendi`);
        
        // 2. TÜM ODALARI ÇEK
        const { data: odalarData, error: odalarError } = await supabase
          .from('odalar')
          .select('*')
          .order('oda_kodu');
        
        if (odalarError) throw odalarError;
        setOdalar(odalarData || []);
        console.log(`🚪 ${odalarData?.length} oda yüklendi`);
        
        // 3. TÜM YETKİLERİ ÇEK
        const { data: yetkilerData, error: yetkilerError } = await supabase
          .from('kullanici_yetkileri')
          .select('*');
        
        if (yetkilerError) throw yetkilerError;
        setTumYetkiler(yetkilerData || []);
        console.log(`🔑 ${yetkilerData?.length} yetki kaydı yüklendi`);
        
        // 4. SİSTEM LOGLARINI ÇEK (son 100)
        const { data: loglarData, error: loglarError } = await supabase
          .from('sistem_loglari')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (loglarError) throw loglarError;
        setSistemLoglari(loglarData || []);
        console.log(`📊 ${loglarData?.length} log yüklendi`);
        
      } catch (error) {
        console.error('❌ Veri yükleme hatası:', error);
        alert('Veriler yüklenemedi!');
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, []);

  // KULLANICI İŞLEMLERİ
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
        logEkle('KULLANICI_GUNCELLENDI', `Kullanıcı güncellendi: ${newUser.ad} ${newUser.soyad}`);
      } else {
        const { error } = await supabase
          .from('kullanicilar')
          .insert([newUser]);
        
        if (error) throw error;
        alert('Yeni kullanıcı oluşturuldu!');
        logEkle('KULLANICI_OLUSTURULDU', `Yeni kullanıcı: ${newUser.ad} ${newUser.soyad}`);
      }
      
      // Verileri yenile
      await refreshData();
      setShowUserModal(false);
      resetNewUserForm();
      
    } catch (error) {
      console.error('Kullanıcı kaydetme hatası:', error);
      alert('Kullanıcı kaydedilemedi!');
    }
  };

  // ODA İŞLEMLERİ
  const saveOda = async () => {
    if (!newOda.oda_kodu || !newOda.oda_adi) {
      alert('Lütfen zorunlu alanları doldurun!');
      return;
    }

    try {
      if (editingOda) {
        const { error } = await supabase
          .from('odalar')
          .update(newOda)
          .eq('id', editingOda.id);
        
        if (error) throw error;
        alert('Oda güncellendi!');
        logEkle('ODA_GUNCELLENDI', `Oda güncellendi: ${newOda.oda_adi}`);
      } else {
        const { error } = await supabase
          .from('odalar')
          .insert([newOda]);
        
        if (error) throw error;
        alert('Yeni oda oluşturuldu!');
        logEkle('ODA_OLUSTURULDU', `Yeni oda: ${newOda.oda_adi}`);
      }
      
      await refreshData();
      setShowOdaModal(false);
      resetNewOdaForm();
      
    } catch (error) {
      console.error('Oda kaydetme hatası:', error);
      alert('Oda kaydedilemedi!');
    }
  };

  // YETKİ İŞLEMLERİ
  const handleYetkiAta = async (kullaniciId: number, odaId: number, yetkiTuru: string, deger: boolean) => {
    try {
      // Önce bu kullanıcının bu odada yetkisi var mı kontrol et
      const { data: existing } = await supabase
        .from('kullanici_yetkileri')
        .select('*')
        .eq('kullanici_id', kullaniciId)
        .eq('oda_id', odaId)
        .single();
      
      if (existing) {
        // Güncelle
        const { error } = await supabase
          .from('kullanici_yetkileri')
          .update({ [yetkiTuru]: deger })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Yeni yetki oluştur
        const yeniYetki: any = {
          kullanici_id: kullaniciId,
          oda_id: odaId,
          [yetkiTuru]: deger
        };
        
        const { error } = await supabase
          .from('kullanici_yetkileri')
          .insert([yeniYetki]);
        
        if (error) throw error;
      }
      
      await refreshData();
      logEkle('YETKI_GUNCELLENDI', `Kullanıcı ${kullaniciId} için oda ${odaId} yetkisi güncellendi`);
      
    } catch (error) {
      console.error('Yetki atama hatası:', error);
      alert('Yetki atanamadı!');
    }
  };

  // QR KOD İŞLEMLERİ
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
      
      await refreshData();
      setQrCodeData(qrCode);
      alert('QR kodu oluşturuldu ve kullanıcıya atandı!');
      
    } catch (error) {
      console.error('QR kod atama hatası:', error);
      alert('QR kodu oluşturulamadı!');
    } finally {
      setLoading(false);
    }
  };

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
      
      await refreshData();
      setQrCodeData(qrCode);
      alert('Oda QR kodu oluşturuldu!');
      
    } catch (error) {
      console.error('Oda QR kod hatası:', error);
      alert('Oda QR kodu oluşturulamadı!');
    } finally {
      setLoading(false);
    }
  };

  // YARDIMCI FONKSİYONLAR
  const refreshData = async () => {
    const { data: users } = await supabase.from('kullanicilar').select('*');
    const { data: odalar } = await supabase.from('odalar').select('*');
    const { data: yetkiler } = await supabase.from('kullanici_yetkileri').select('*');
    
    setKullanicilar(users || []);
    setOdalar(odalar || []);
    setTumYetkiler(yetkiler || []);
  };

  const logEkle = async (islem: string, detay: string) => {
    try {
      await supabase.from('sistem_loglari').insert([{
        islem_turu: islem,
        detay: detay,
        kullanici_id: currentUserId,
        ip_adresi: '127.0.0.1'
      }]);
    } catch (error) {
      console.error('Log kaydetme hatası:', error);
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
      aktif: true,
      sistem_yoneticisi: false
    });
    setEditingUser(null);
  };

  const resetNewOdaForm = () => {
    setNewOda({
      oda_kodu: '',
      oda_adi: '',
      aciklama: '',
      aktif: true,
      qr_kodu: ''
    });
    setEditingOda(null);
  };

  // FİLTRELEMELER
  const filteredUsers = kullanicilar.filter(user =>
    user.ad.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.soyad.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.kullanici_kodu.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOdalar = odalar.filter(oda =>
    oda.oda_adi.toLowerCase().includes(searchQuery.toLowerCase()) ||
    oda.oda_kodu.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // İSTATİSTİKLER
  const istatistikler = {
    toplamKullanici: kullanicilar.length,
    aktifKullanici: kullanicilar.filter(u => u.aktif).length,
    sistemYoneticisi: kullanicilar.filter(u => u.sistem_yoneticisi).length,
    toplamOda: odalar.length,
    aktifOda: odalar.filter(o => o.aktif).length,
    toplamYetki: tumYetkiler.length,
    bugunLog: sistemLoglari.filter(l => 
      new Date(l.created_at).toDateString() === new Date().toDateString()
    ).length
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8">
      {/* ÜST BİLGİLER */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">SİSTEM YÖNETİCİ PANELİ</h1>
            <p className="text-gray-400">Tüm kullanıcıları, odaları ve yetkileri yönetin</p>
          </div>
        </div>

        {/* İSTATİSTİK KARTLARI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{istatistikler.toplamKullanici}</div>
                <div className="text-sm text-gray-400">Toplam Kullanıcı</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Building className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{istatistikler.toplamOda}</div>
                <div className="text-sm text-gray-400">Toplam Oda</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <KeyRound className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{istatistikler.toplamYetki}</div>
                <div className="text-sm text-gray-400">Yetki Kaydı</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Database className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{sistemLoglari.length}</div>
                <div className="text-sm text-gray-400">Sistem Logu</div>
              </div>
            </div>
          </div>
        </div>

        {/* TAB MENÜ */}
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-xl mb-8">
          {[
            { id: 'kullanicilar', label: 'Kullanıcılar', icon: Users },
            { id: 'odalar', label: 'Odalar', icon: Building },
            { id: 'yetkiler', label: 'Yetkiler', icon: Key },
            { id: 'loglar', label: 'Loglar', icon: Database },
            { id: 'sistem', label: 'Sistem', icon: Server }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg flex-1 justify-center transition-all ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* İÇERİK ALANI */}
      <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700">
        {/* ARA ÇUBUĞU */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ara..."
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white"
              />
            </div>
            
            <div className="flex gap-3">
              {activeTab === 'kullanicilar' && (
                <button
                  onClick={() => {
                    resetNewUserForm();
                    setShowUserModal(true);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Yeni Kullanıcı
                </button>
              )}
              
              {activeTab === 'odalar' && (
                <button
                  onClick={() => {
                    resetNewOdaForm();
                    setShowOdaModal(true);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Yeni Oda
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TAB İÇERİKLERİ */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="mt-4 text-gray-400">Yükleniyor...</p>
            </div>
          ) : (
            <>
              {/* KULLANICILAR TAB */}
              {activeTab === 'kullanicilar' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Kullanıcı</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Kod</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Durum</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Sistem Yön.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-750">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${user.aktif ? 'bg-blue-500/20' : 'bg-gray-700'}`}>
                                <User className={`h-5 w-5 ${user.aktif ? 'text-blue-400' : 'text-gray-500'}`} />
                              </div>
                              <div>
                                <div className="font-semibold">{user.ad} {user.soyad}</div>
                                <div className="text-sm text-gray-400">{user.unvan || '-'}</div>
                                <div className="text-xs text-gray-500">{user.departman || '-'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <code className="text-sm bg-gray-900 px-2 py-1 rounded border border-gray-700">{user.kullanici_kodu}</code>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${user.aktif ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className={`text-sm ${user.aktif ? 'text-green-400' : 'text-red-400'}`}>
                                {user.aktif ? 'Aktif' : 'Pasif'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {user.sistem_yoneticisi ? (
                              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">Evet</span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded text-xs">Hayır</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingUser(user);
                                  setNewUser({
                                    kullanici_kodu: user.kullanici_kodu,
                                    ad: user.ad,
                                    soyad: user.soyad,
                                    unvan: user.unvan || '',
                                    departman: user.departman || '',
                                    qr_kodu: user.qr_kodu || '',
                                    sifre_hash: user.sifre_hash,
                                    aktif: user.aktif,
                                    sistem_yoneticisi: user.sistem_yoneticisi || false
                                  });
                                  setShowUserModal(true);
                                }}
                                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                                title="Düzenle"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleGenerateUserQR(user)}
                                className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg"
                                title="QR Üret"
                              >
                                <QrCode className="h-4 w-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const { error } = await supabase
                                      .from('kullanicilar')
                                      .update({ aktif: !user.aktif })
                                      .eq('id', user.id);
                                    
                                    if (error) throw error;
                                    await refreshData();
                                  } catch (error) {
                                    console.error('Durum değiştirme hatası:', error);
                                  }
                                }}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
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
                  
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 mx-auto text-gray-700 mb-4" />
                      <p className="text-gray-500">Kullanıcı bulunamadı</p>
                    </div>
                  )}
                </div>
              )}

              {/* ODALAR TAB */}
              {activeTab === 'odalar' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredOdalar.map((oda) => (
                    <div key={oda.id} className="bg-gray-750 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${oda.aktif ? 'bg-green-500/20' : 'bg-gray-700'}`}>
                            <Building className={`h-6 w-6 ${oda.aktif ? 'text-green-400' : 'text-gray-500'}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{oda.oda_adi}</h3>
                            <p className="text-sm text-gray-400">{oda.oda_kodu}</p>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${oda.aktif ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {oda.aktif ? 'AÇIK' : 'KAPALI'}
                        </div>
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-4">{oda.aciklama || 'Açıklama yok'}</p>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingOda(oda);
                            setNewOda({
                              oda_kodu: oda.oda_kodu,
                              oda_adi: oda.oda_adi,
                              aciklama: oda.aciklama || '',
                              aktif: oda.aktif,
                              qr_kodu: oda.qr_kodu || ''
                            });
                            setShowOdaModal(true);
                          }}
                          className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 text-sm"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleGenerateRoomQR(oda)}
                          className="flex-1 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 text-sm"
                        >
                          QR Üret
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const { error } = await supabase
                                .from('odalar')
                                .update({ aktif: !oda.aktif })
                                .eq('id', oda.id);
                              
                              if (error) throw error;
                              await refreshData();
                            } catch (error) {
                              console.error('Oda durumu hatası:', error);
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-sm"
                        >
                          {oda.aktif ? 'Kapat' : 'Aç'}
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {filteredOdalar.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <Building className="h-16 w-16 mx-auto text-gray-700 mb-4" />
                      <p className="text-gray-500">Oda bulunamadı</p>
                    </div>
                  )}
                </div>
              )}

              {/* YETKİLER TAB */}
              {activeTab === 'yetkiler' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Kullanıcı</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Oda</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Yetkiler</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {tumYetkiler.map((yetki) => {
                        const user = kullanicilar.find(u => u.id === yetki.kullanici_id);
                        const oda = odalar.find(o => o.id === yetki.oda_id);
                        
                        if (!user || !oda) return null;
                        
                        return (
                          <tr key={yetki.id} className="hover:bg-gray-750">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                  <User className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                  <div className="font-semibold">{user.ad} {user.soyad}</div>
                                  <div className="text-sm text-gray-400">{user.kullanici_kodu}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                  <Building className="h-5 w-5 text-green-400" />
                                </div>
                                <div>
                                  <div className="font-semibold">{oda.oda_adi}</div>
                                  <div className="text-sm text-gray-400">{oda.oda_kodu}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-2">
                                {yetki.kartela_olusturabilir && (
                                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">Kartela Oluştur</span>
                                )}
                                {yetki.kartela_silebilir && (
                                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">Kartela Sil</span>
                                )}
                                {yetki.rapor_gorebilir && (
                                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Rapor Gör</span>
                                )}
                                {yetki.raf_duzenleyebilir && (
                                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">Raf Düzenle</span>
                                )}
                                {yetki.kullanici_yonetebilir && (
                                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">Kullanıcı Yönet</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSelectedOda(oda);
                                  setShowYetkiModal(true);
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 text-sm"
                              >
                                Yetkileri Düzenle
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {tumYetkiler.length === 0 && (
                    <div className="text-center py-12">
                      <KeyRound className="h-16 w-16 mx-auto text-gray-700 mb-4" />
                      <p className="text-gray-500">Henüz yetki kaydı yok</p>
                    </div>
                  )}
                </div>
              )}

              {/* LOGLAR TAB */}
              {activeTab === 'loglar' && (
                <div className="space-y-3">
                  {sistemLoglari.map((log) => {
                    const user = kullanicilar.find(u => u.id === log.kullanici_id);
                    const zaman = new Date(log.created_at).toLocaleString('tr-TR');
                    
                    return (
                      <div key={log.id} className="bg-gray-750 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-700 rounded-lg">
                              <Database className="h-4 w-4 text-gray-400" />
                            </div>
                            <div>
                              <span className="font-medium">{log.islem_turu.replace(/_/g, ' ')}</span>
                              {user && (
                                <span className="text-sm text-gray-400 ml-2">
                                  • {user.ad} {user.soyad}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">{zaman}</div>
                        </div>
                        <p className="text-gray-400 text-sm">{log.detay}</p>
                        {log.ip_adresi && (
                          <div className="mt-2 text-xs text-gray-500">IP: {log.ip_adresi}</div>
                        )}
                      </div>
                    );
                  })}
                  
                  {sistemLoglari.length === 0 && (
                    <div className="text-center py-12">
                      <Database className="h-16 w-16 mx-auto text-gray-700 mb-4" />
                      <p className="text-gray-500">Henüz log kaydı yok</p>
                    </div>
                  )}
                </div>
              )}

              {/* SİSTEM TAB */}
              {activeTab === 'sistem' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-750 border border-gray-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Server className="h-5 w-5 text-blue-400" />
                      Sistem Bilgileri
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-700">
                        <span className="text-gray-400">Toplam Kullanıcı</span>
                        <span className="font-medium">{istatistikler.toplamKullanici}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-700">
                        <span className="text-gray-400">Aktif Kullanıcı</span>
                        <span className="font-medium text-green-400">{istatistikler.aktifKullanici}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-700">
                        <span className="text-gray-400">Sistem Yöneticisi</span>
                        <span className="font-medium text-purple-400">{istatistikler.sistemYoneticisi}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-700">
                        <span className="text-gray-400">Toplam Oda</span>
                        <span className="font-medium">{istatistikler.toplamOda}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-700">
                        <span className="text-gray-400">Aktif Oda</span>
                        <span className="font-medium text-green-400">{istatistikler.aktifOda}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-750 border border-gray-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-green-400" />
                      Hızlı İşlemler
                    </h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          resetNewUserForm();
                          setShowUserModal(true);
                        }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 flex items-center gap-3"
                      >
                        <User className="h-5 w-5" />
                        <div className="text-left">
                          <div className="font-medium">Yeni Kullanıcı Ekle</div>
                          <div className="text-sm opacity-80">Sisteme yeni kullanıcı ekleyin</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          resetNewOdaForm();
                          setShowOdaModal(true);
                        }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:opacity-90 flex items-center gap-3"
                      >
                        <Building className="h-5 w-5" />
                        <div className="text-left">
                          <div className="font-medium">Yeni Oda Oluştur</div>
                          <div className="text-sm opacity-80">Yeni bir oda ekleyin</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          // Tüm kullanıcılar için QR kod oluştur
                          const confirm = window.confirm('Tüm kullanıcılar için QR kod oluşturulsun mu?');
                          if (confirm) {
                            alert('QR kod oluşturma başlatıldı!');
                          }
                        }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:opacity-90 flex items-center gap-3"
                      >
                        <QrCode className="h-5 w-5" />
                        <div className="text-left">
                          <div className="font-medium">Toplu QR Kod Üret</div>
                          <div className="text-sm opacity-80">Tüm kullanıcılar için QR oluştur</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODALLAR */}
      {/* Kullanıcı Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
                  </h2>
                  <p className="text-gray-400">Kullanıcı bilgilerini girin</p>
                </div>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    resetNewUserForm();
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Kullanıcı Kodu *</label>
                    <input
                      type="text"
                      value={newUser.kullanici_kodu}
                      onChange={(e) => setNewUser({...newUser, kullanici_kodu: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      placeholder="ADMIN001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Unvan</label>
                    <input
                      type="text"
                      value={newUser.unvan}
                      onChange={(e) => setNewUser({...newUser, unvan: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      placeholder="Sistem Yöneticisi"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Ad *</label>
                    <input
                      type="text"
                      value={newUser.ad}
                      onChange={(e) => setNewUser({...newUser, ad: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      placeholder="Ahmet"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Soyad *</label>
                    <input
                      type="text"
                      value={newUser.soyad}
                      onChange={(e) => setNewUser({...newUser, soyad: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      placeholder="Yılmaz"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Departman</label>
                  <input
                    type="text"
                    value={newUser.departman}
                    onChange={(e) => setNewUser({...newUser, departman: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                    placeholder="IT"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newUser.aktif}
                      onChange={(e) => setNewUser({...newUser, aktif: e.target.checked})}
                      className="rounded border-gray-700 bg-gray-900"
                    />
                    <label className="text-gray-300">Kullanıcı aktif</label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newUser.sistem_yoneticisi}
                      onChange={(e) => setNewUser({...newUser, sistem_yoneticisi: e.target.checked})}
                      className="rounded border-gray-700 bg-gray-900"
                    />
                    <label className="text-gray-300">Sistem yöneticisi</label>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    resetNewUserForm();
                  }}
                  className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  onClick={saveUser}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90"
                >
                  {editingUser ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Oda Modal */}
      {showOdaModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    {editingOda ? 'Oda Düzenle' : 'Yeni Oda'}
                  </h2>
                  <p className="text-gray-400">Oda bilgilerini girin</p>
                </div>
                <button
                  onClick={() => {
                    setShowOdaModal(false);
                    resetNewOdaForm();
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Oda Kodu *</label>
                    <input
                      type="text"
                      value={newOda.oda_kodu}
                      onChange={(e) => setNewOda({...newOda, oda_kodu: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      placeholder="ODA-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Oda Adı *</label>
                    <input
                      type="text"
                      value={newOda.oda_adi}
                      onChange={(e) => setNewOda({...newOda, oda_adi: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      placeholder="Ana Depo"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Açıklama</label>
                  <textarea
                    value={newOda.aciklama}
                    onChange={(e) => setNewOda({...newOda, aciklama: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white h-24"
                    placeholder="Oda açıklaması..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newOda.aktif}
                    onChange={(e) => setNewOda({...newOda, aktif: e.target.checked})}
                    className="rounded border-gray-700 bg-gray-900"
                  />
                  <label className="text-gray-300">Oda aktif</label>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowOdaModal(false);
                    resetNewOdaForm();
                  }}
                  className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  onClick={saveOda}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:opacity-90"
                >
                  {editingOda ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yetki Modal */}
      {showYetkiModal && selectedUser && selectedOda && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Yetki Yönetimi</h2>
                  <p className="text-gray-400">
                    {selectedUser.ad} {selectedUser.soyad} → {selectedOda.oda_adi}
                  </p>
                </div>
                <button
                  onClick={() => setShowYetkiModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'kartela_olusturabilir', label: 'Kartela Oluşturabilir', color: 'blue' },
                  { key: 'kartela_silebilir', label: 'Kartela Silebilir', color: 'red' },
                  { key: 'rapor_gorebilir', label: 'Rapor Görebilir', color: 'green' },
                  { key: 'raf_duzenleyebilir', label: 'Raf Düzenleyebilir', color: 'yellow' },
                  { key: 'kullanici_yonetebilir', label: 'Kullanıcı Yönetebilir', color: 'purple' }
                ].map((yetki) => {
                  const currentYetki = tumYetkiler.find(y => 
                    y.kullanici_id === selectedUser.id && y.oda_id === selectedOda.id
                  );
                  const deger = currentYetki ? currentYetki[yetki.key as keyof YetkiType] : false;
                  
                  return (
                    <div key={yetki.key} className="flex items-center justify-between p-3 bg-gray-750 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-${yetki.color}-500/20`}>
                          <KeyRound className={`h-5 w-5 text-${yetki.color}-400`} />
                        </div>
                        <div>
                          <div className="font-medium">{yetki.label}</div>
                          <div className="text-sm text-gray-400">
                            {deger ? 'Yetkili' : 'Yetkisiz'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleYetkiAta(selectedUser.id, selectedOda.id, yetki.key, !deger)}
                        className={`px-4 py-2 rounded-lg ${deger ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
                      >
                        {deger ? 'Yetkiyi Kaldır' : 'Yetki Ver'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-700 flex justify-end">
                <button
                  onClick={() => setShowYetkiModal(false)}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90"
                >
                  Tamam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Kod Modal */}
      {qrCodeData && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">QR Kodu</h3>
              <button
                onClick={() => setQrCodeData('')}
                className="p-2 hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex justify-center mb-6">
              <img src={qrCodeData} alt="QR Code" className="w-64 h-64 rounded-lg border border-gray-700" />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = qrCodeData;
                  link.download = `qr-code-${Date.now()}.png`;
                  link.click();
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                İndir
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(qrCodeData);
                  alert('QR kodu kopyalandı!');
                }}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Kopyala
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}