'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RoomAccess from './components/RoomAccess'

import {
  BuildingOffice2Icon,
  ShieldCheckIcon,
  QrCodeIcon,
  IdentificationIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'

export default function AccessPage() {
  const router = useRouter()

  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const sessionStr = localStorage.getItem('room_session')
        if (!sessionStr) return false

        const session = JSON.parse(sessionStr)
        const expiresAt = new Date(session.expiresAt)
        const now = new Date()

        if (expiresAt > now) {
          router.push(`/room/${session.roomCode}`)
          return true
        } else {
          localStorage.removeItem('room_session')
          return false
        }
      } catch (error) {
        console.error('Session kontrol hatası:', error)
        localStorage.removeItem('room_session')
        return false
      }
    }

    checkExistingSession()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-4 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-slate-100 mb-5">
            <BuildingOffice2Icon className="w-8 h-8 text-slate-700" />
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 mb-3">
            Kartela Takip Sistemi
          </h1>

          <p className="text-slate-600 max-w-2xl mx-auto text-base">
            Güvenli oda erişimi için personel ve oda doğrulaması gereklidir
          </p>
        </div>

        {/* Main Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">

            <div className="p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-1">
                  Oda Erişim Kontrolü
                </h2>
                <p className="text-sm text-slate-500">
                  İki adımlı yetkilendirme süreci
                </p>
              </div>

              {/* Functional Component – untouched */}
              <RoomAccess />
            </div>

            {/* Info Section */}
            <div className="bg-slate-50 border-t border-slate-200 p-6">
              <div className="grid md:grid-cols-3 gap-6">

                <InfoItem
                  icon={<IdentificationIcon />}
                  title="Personel Doğrulama"
                  description="Personel kartı barkodu ile kimlik kontrolü"
                />

                <InfoItem
                  icon={<QrCodeIcon />}
                  title="Oda Doğrulama"
                  description="Odaya ait QR kod ile erişim doğrulaması"
                />

                <InfoItem
                  icon={<ShieldCheckIcon />}
                  title="Yetki Kontrolü"
                  description="Sistem tarafından anlık izin denetimi"
                />

              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
            <LockClosedIcon className="w-4 h-4" />
            <span>
              Güvenli oturum yönetimi • Gerçek zamanlı erişim kontrolü
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- UI Helper ---------- */

function InfoItem({
  icon,
  title,
  description
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
        <div className="w-5 h-5">{icon}</div>
      </div>

      <div>
        <p className="font-medium text-slate-900 text-sm">{title}</p>
        <p className="text-slate-500 text-sm leading-snug">
          {description}
        </p>
      </div>
    </div>
  )
}