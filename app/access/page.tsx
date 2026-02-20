'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RoomAccess from './components/RoomAccess'

import {
  BuildingOffice2Icon,
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
    <div className="h-screen overflow-hidden bg-[radial-gradient(1200px_600px_at_20%_0%,#e2e8f0_0%,transparent_60%),radial-gradient(900px_500px_at_100%_20%,#dbeafe_0%,transparent_55%),linear-gradient(to_bottom,#ffffff,#f8fafc)]">
      <div className="h-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/70 backdrop-blur border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
              <BuildingOffice2Icon className="w-6 h-6 text-slate-800" />
            </div>

            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 leading-tight truncate">
                Kartela Takip Sistemi
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 truncate">
                Güvenli oda erişimi için doğrulama gereklidir
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-white/60 backdrop-blur border border-slate-200 rounded-full px-3 py-1.5 shadow-sm">
            <LockClosedIcon className="w-4 h-4 text-slate-700" />
            <span className="whitespace-nowrap">Güvenli oturum • Anlık kontrol</span>
          </div>
        </div>

        {/* Single centered card */}
        <div className="flex-1 min-h-0 mt-6 flex">
          <div className="w-full rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-slate-100">
              <p className="text-xs font-medium text-slate-500 tracking-wide uppercase">
                Erişim Paneli
              </p>
              <p className="text-sm text-slate-700 mt-1">
                Kimlik ve oda doğrulamasını tamamlayın
              </p>
            </div>

            <div className="flex-1 min-h-0 px-5 sm:px-7 py-4">
              {/* Functional Component – untouched */}
              <RoomAccess />
            </div>

            <div className="px-5 sm:px-7 py-3 border-t border-slate-100 bg-slate-50/70">
              <div className="flex items-center justify-between gap-3 text-[11px] sm:text-xs text-slate-600">
                <div className="flex items-center gap-2 min-w-0">
                  <LockClosedIcon className="w-4 h-4 text-slate-700" />
                  <span className="truncate">Güvenli oturum yönetimi • Gerçek zamanlı erişim kontrolü</span>
                </div>
                <span className="hidden sm:inline whitespace-nowrap text-slate-500">
                  v1 • Secure Access
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-2" />
      </div>
    </div>
  )
}