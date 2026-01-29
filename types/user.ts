export type UserRole = 'amir' | 'kartela_sorumlusu' | 'uretim' | 'depo' | 'guest'

export interface User {
  id: string
  name: string
  role: UserRole
  assignedRoom: string  // AMIR-ODA-001, KARTELA-ODA-001, vs.
  qrCode: string  // Kullanıcı barkodu (personel kartı)
  canAccessRooms: string[]  // Erişebileceği odalar
  isActive: boolean
}

export const USERS: Record<string, User> = {
  'ahmet_amir': {
    id: 'user_001',
    name: 'Ahmet Amir',
    role: 'amir',
    assignedRoom: 'AMIR-ODA-001',
    qrCode: 'USER-AHMET-001',
    canAccessRooms: ['AMIR-ODA-001'],
    isActive: true,
  },
  'mehmet_kartela': {
    id: 'user_002',
    name: 'Mehmet Kartela',
    role: 'kartela_sorumlusu',
    assignedRoom: 'KARTELA-ODA-001',
    qrCode: 'USER-MEHMET-001',
    canAccessRooms: ['KARTELA-ODA-001', 'DEPO-001'],
    isActive: true,
  },
  'ayse_uretim': {
    id: 'user_003',
    name: 'Ayşe Üretim',
    role: 'uretim',
    assignedRoom: 'URETIM-ALAN-001',
    qrCode: 'USER-AYSE-001',
    canAccessRooms: ['URETIM-ALAN-001', 'KARTELA-ODA-001'],
    isActive: true,
  },
  'ali_depo': {
    id: 'user_004',
    name: 'Ali Depo',
    role: 'depo',
    assignedRoom: 'DEPO-001',
    qrCode: 'USER-ALI-001',
    canAccessRooms: ['DEPO-001', 'KARTELA-ODA-001'],
    isActive: true,
  },
}
