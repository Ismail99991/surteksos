const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// BACKEND HAZIR OLANA KADAR MOCK DATA
export const mockApi = {
  // Oda giriş kontrolü
  checkRoomAccess: async (userQrCode: string, roomQrCode: string) => {
    // Bu kısım backend'de olacak
    await new Promise(resolve => setTimeout(resolve, 500)) // Simüle edilmiş gecikme
    
    const mockUsers = {
      'USER-AHMET-001': { 
        id: '1', 
        name: 'Ahmet Amir', 
        role: 'amir', 
        allowedRooms: ['AMIR-ODA-001'] 
      },
      'USER-MEHMET-001': { 
        id: '2', 
        name: 'Mehmet Kartela', 
        role: 'kartela_sorumlusu', 
        allowedRooms: ['KARTELA-ODA-001', 'DEPO-001'] 
      },
      'USER-AYSE-001': { 
        id: '3', 
        name: 'Ayşe Üretim', 
        role: 'uretim', 
        allowedRooms: ['URETIM-ALAN-001', 'KARTELA-ODA-001'] 
      },
      'USER-ALI-001': { 
        id: '4', 
        name: 'Ali Depo', 
        role: 'depo', 
        allowedRooms: ['DEPO-001', 'KARTELA-ODA-001'] 
      },
    }
    
    const mockRooms = {
      'AMIR-ODA-001': { id: 'room_1', name: 'Amir Odası', type: 'amir_odasi' },
      'KARTELA-ODA-001': { id: 'room_2', name: 'Kartela Odası', type: 'kartela_odasi' },
      'URETIM-ALAN-001': { id: 'room_3', name: 'Üretim Alanı', type: 'uretim' },
      'DEPO-001': { id: 'room_4', name: 'Depo', type: 'depo' },
    }
    
    const user = mockUsers[userQrCode as keyof typeof mockUsers]
    const room = mockRooms[roomQrCode as keyof typeof mockRooms]
    
    if (!user) {
      throw new Error('Kullanıcı bulunamadı')
    }
    
    if (!room) {
      throw new Error('Oda bulunamadı')
    }
    
    if (!user.allowedRooms.includes(roomQrCode)) {
      throw new Error(`${user.name} bu odaya erişim iznine sahip değil`)
    }
    
    return {
      success: true,
      user,
      room,
      timestamp: new Date().toISOString(),
      accessCode: `ACC-${Date.now()}`
    }
  },
  
  // Kartela sorgulama
  searchKartela: async (renkKodu: string) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const mockKartelalar = {
      '231010001.1': {
        id: 'k1',
        renk_kodu: '231010001.1',
        musteri: 'Nike',
        tip: 'ozel',
        durum: 'arsivde',
        mevcut_lokasyon: 'KARTELA-ODA-001',
        son_erisim: '2024-01-27T14:30:00Z',
        olusturma_tarihi: '2023-03-15T10:30:00Z',
        sorumlu_kisi: 'Mehmet Kartela',
        telefon: '+90 555 123 4567',
        notlar: 'Özel talep: mat bitiş',
        recete_no: 'REC-2023-445',
        son_islem: 'Arşive verildi',
      },
      '231010002.1': {
        id: 'k2',
        renk_kodu: '231010002.1',
        musteri: 'Zara',
        tip: 'ozel',
        durum: 'uretimde',
        mevcut_lokasyon: 'URETIM-ALAN-001',
        son_erisim: '2024-01-28T09:15:00Z',
        olusturma_tarihi: '2023-05-20T14:15:00Z',
        sorumlu_kisi: 'Ayşe Üretim',
        telefon: '+90 555 987 6543',
        notlar: null,
        recete_no: 'REC-2023-512',
        son_islem: 'Üretime alındı',
      },
      '231010003.1': {
        id: 'k3',
        renk_kodu: '231010003.1',
        musteri: 'Mavi',
        tip: 'ozel',
        durum: 'kayip',
        mevcut_lokasyon: null,
        son_erisim: '2024-01-20T11:45:00Z',
        olusturma_tarihi: '2023-07-10T16:20:00Z',
        sorumlu_kisi: null,
        telefon: null,
        notlar: 'Kayıp - araştırılıyor',
        recete_no: 'REC-2023-678',
        son_islem: 'Kayıp olarak işaretlendi',
      },
    }
    
    // Eğer son 4 hane girildiyse tamamla
    let fullCode = renkKodu
    if (renkKodu.match(/^\d{4}\.\d$/)) {
      fullCode = `23101${renkKodu}`
    }
    
    const kartela = mockKartelalar[fullCode as keyof typeof mockKartelalar]
    
    if (!kartela) {
      throw new Error(`Kartela bulunamadı: ${renkKodu}`)
    }
    
    const hareketler = [
      {
        id: 'h1',
        kartela_id: kartela.id,
        renk_kodu: kartela.renk_kodu,
        islem: 'VERILDI' as const,
        kullanici: 'Mehmet',
        lokasyon: 'KARTELA-ODA-001',
        aciklama: 'Arşive verildi',
        tarih: '2024-01-27T14:30:00Z',
      },
      {
        id: 'h2',
        kartela_id: kartela.id,
        renk_kodu: kartela.renk_kodu,
        islem: 'ALINDI' as const,
        kullanici: 'Ahmet',
        lokasyon: 'URETIM-ALAN-001',
        aciklama: 'Üretim için alındı',
        tarih: '2024-01-26T09:15:00Z',
      },
    ]
    
    return {
      success: true,
      kartela,
      hareketler,
      mesaj: 'Kartela başarıyla bulundu'
    }
  },
  
  // Log kaydı
  logAccess: async (userId: string, roomId: string, action: 'entry' | 'exit') => {
    console.log(`LOG: User ${userId} ${action === 'entry' ? 'entered' : 'exited'} room ${roomId}`)
    return { success: true }
  },
}

// Backend hazır olduğunda kullanılacak gerçek API fonksiyonları
export const realApi = {
  checkRoomAccess: async (userQrCode: string, roomQrCode: string) => {
    const response = await fetch(`${API_BASE_URL}/api/access/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_qr: userQrCode, room_qr: roomQrCode }),
    })
    return response.json()
  },
  
  searchKartela: async (renkKodu: string) => {
    const response = await fetch(`${API_BASE_URL}/api/kartela/search/${encodeURIComponent(renkKodu)}`)
    return response.json()
  },
  
  logAccess: async (userId: string, roomId: string, action: 'entry' | 'exit') => {
    const response = await fetch(`${API_BASE_URL}/api/access/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, room_id: roomId, action }),
    })
    return response.json()
  },
}

// Şimdilik mock, backend hazır olunca realApi'ye geç
export const api = mockApi
