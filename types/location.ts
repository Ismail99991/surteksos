export type LocationType = 'amir_odasi' | 'kartela_odasi' | 'uretim' | 'depo'

export interface Location {
  id: string
  name: string
  type: LocationType
  qrCode: string  // Oda QR kodu
  description: string
  currentUser: string | null  // Şu anda kimde
  lastAccess: Date | null
}

export const LOCATIONS: Record<LocationType, Location> = {
  amir_odasi: {
    id: 'amir_odasi_001',
    name: 'Amir Odası',
    type: 'amir_odasi',
    qrCode: 'AMIR-ODA-001',
    description: 'Amir ve şeflerin ofis alanı',
    currentUser: null,
    lastAccess: null,
  },
  kartela_odasi: {
    id: 'kartela_odasi_001',
    name: 'Kartela Odası',
    type: 'kartela_odasi',
    qrCode: 'KARTELA-ODA-001',
    description: 'Kartela arşiv ve yönetim odası',
    currentUser: null,
    lastAccess: null,
  },
  uretim: {
    id: 'uretim_alani_001',
    name: 'Üretim Alanı',
    type: 'uretim',
    qrCode: 'URETIM-ALAN-001',
    description: 'Boya kazanları ve üretim hattı',
    currentUser: null,
    lastAccess: null,
  },
  depo: {
    id: 'depo_001',
    name: 'Depo',
    type: 'depo',
    qrCode: 'DEPO-001',
    description: 'Kartela arşiv depolama alanı',
    currentUser: null,
    lastAccess: null,
  },
}
