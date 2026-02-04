// types/api.ts
export interface KullaniciData {
  id: number;
  kullanici_kodu: string;
  ad: string;
  soyad: string;
  unvan?: string;
  departman?: string;
  qr_kodu?: string;
  aktif: boolean;
  sistem_yoneticisi: boolean;
  created_at: string;
  updated_at: string;
}

export interface OdaData {
  id: number;
  oda_kodu: string;
  oda_adi: string;
  oda_tipi?: string;
  aciklama?: string;
  aktif: boolean;
  qr_kodu?: string;
  created_at: string;
  updated_at: string;
}

export interface AccessResponse {
  success: boolean;
  user: {
    id: number;
    name: string;
    role: string;
    allowedRooms: string[];
  };
  room: {
    id: number;
    name: string;
    type: string;
    code: string;
  };
  timestamp: string;
  accessCode: string;
}