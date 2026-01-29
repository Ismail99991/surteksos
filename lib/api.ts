import axios from 'axios'
import { Kartela, Hareket, SearchResult } from '@/types/kartela'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Mock data - Backend hazır olana kadar
const mockKartelalar: Kartela[] = [
  {
    id: '1',
    renk_kodu: '1609',
    musteri: 'Nike',
    tip: 'ozel',
    durum: 'arsivde',
    mevcut_lokasyon: 'RAFA-12',
    son_erisim: new Date('2024-01-27'),
    olusturma_tarihi: new Date('2023-03-15'),
    sorumlu_kisi: 'Mehmet Şef',
    telefon: '+90 555 123 4567',
    notlar: 'Özel talep: mat bitiş',
    recete_no: 'REC-2023-445',
  },
  {
    id: '2',
    renk_kodu: '58',
    musteri: 'Zara',
    tip: 'ozel',
    durum: 'sef_masasinda',
    mevcut_lokasyon: 'ŞEF-MASA',
    son_erisim: new Date('2024-01-28'),
    olusturma_tarihi: new Date('2023-05-20'),
    sorumlu_kisi: 'Ayşe Kalite',
    telefon: '+90 555 987 6543',
    notlar: null,
    recete_no: 'REC-2023-512',
  },
  {
    id: '3',
    renk_kodu: '10',
    musteri: null,
    tip: 'standart',
    durum: 'arsivde',
    mevcut_lokasyon: 'RAFB-01',
    son_erisim: new Date('2024-01-20'),
    olusturma_tarihi: new Date('2022-01-10'),
    sorumlu_kisi: 'Depo Sorumlusu',
    telefon: '+90 555 111 2233',
    notlar: 'Adi beyaz - sürekli kullanım',
    recete_no: null,
  },
]

export const kartelaApi = {
  // Kartela ara
  search: async (renkKodu: string): Promise<SearchResult> => {
    // Backend hazır olana kadar mock data dön
    const kartela = mockKartelalar.find(k => k.renk_kodu === renkKodu)
    
    if (!kartela) {
      throw new Error(`Kartela bulunamadı: ${renkKodu}`)
    }
    
    const hareketler: Hareket[] = [
      {
        id: '1',
        kartela_id: kartela.id,
        renk_kodu: kartela.renk_kodu,
        islem: 'ALINDI',
        kullanici: 'Ahmet Üretim',
        lokasyon: 'Kazan 5',
        aciklama: 'Üretim için alındı',
        tarih: new Date('2024-01-27 14:30'),
      },
      {
        id: '2',
        kartela_id: kartela.id,
        renk_kodu: kartela.renk_kodu,
        islem: 'VERILDI',
        kullanici: 'Mehmet Şef',
        lokasyon: kartela.mevcut_lokasyon,
        aciklama: 'Arşive iade edildi',
        tarih: new Date('2024-01-27 16:45'),
      },
    ]
    
    return {
      kartela,
      hareketler,
      mesaj: 'Kartela başarıyla bulundu',
    }
  },
  
  // Durum güncelle
  updateStatus: async (renkKodu: string, islem: string, kullanici: string) => {
    console.log(`Kartela ${renkKodu} ${islem} olarak güncellendi (Kullanıcı: ${kullanici})`)
    return { success: true, mesaj: 'İşlem başarılı' }
  },
  
  // QR oluştur
  generateQR: async (renkKodu: string) => {
    // QR oluşturma endpoint'i (backend'de yapılacak)
    return `${API_URL}/qr/${renkKodu}`
  },
  
  // Tüm kartelalar
  getAll: async (): Promise<Kartela[]> => {
    return mockKartelalar
  },
}
