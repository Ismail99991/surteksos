// app/access/components/RoomAccess.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

type AccessStep = 'user' | 'room'

export default function RoomAccess() {
  const router = useRouter()
  const [step, setStep] = useState<AccessStep>('user')
  const [userInput, setUserInput] = useState('')
  const [roomInput, setRoomInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const userInputRef = useRef<HTMLInputElement>(null)
  const roomInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus on input based on step
  useEffect(() => {
    if (step === 'user' && userInputRef.current) {
      userInputRef.current.focus()
    } else if (step === 'room' && roomInputRef.current) {
      roomInputRef.current.focus()
    }
  }, [step])

  // USER prefix kontrolü ve auto-submit
  useEffect(() => {
    const trimmedInput = userInput.trim().toUpperCase()
    if (step === 'user' && trimmedInput.startsWith('USER-') && trimmedInput.length > 6) {
      const timer = setTimeout(() => {
        handleUserSubmit()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [userInput, step])

  // ROOM prefix kontrolü ve auto-submit
  useEffect(() => {
    const trimmedInput = roomInput.trim().toUpperCase()
    if (step === 'room' && trimmedInput.startsWith('ROOM-') && trimmedInput.length > 6) {
      const timer = setTimeout(() => {
        handleRoomSubmit()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [roomInput, step])

  const handleUserSubmit = async () => {
    const trimmedInput = userInput.trim().toUpperCase()
    if (!trimmedInput.startsWith('USER-')) {
      setError('Geçersiz personel kodu formatı. USER- ile başlamalı.')
      setUserInput('')
      setTimeout(() => {
        if (userInputRef.current) userInputRef.current.focus()
      }, 500)
      return
    }
    
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data: user, error: userError } = await supabase
        .from('kullanicilar')
        .select('*')
        .eq('qr_kodu', trimmedInput)
        .eq('aktif', true)
        .single()

      if (userError || !user) {
        setError('Kullanıcı bulunamadı veya aktif değil')
        setUserInput('')
        setTimeout(() => {
          if (userInputRef.current) userInputRef.current.focus()
        }, 500)
        return
      }

      setCurrentUser(user)
      setSuccess(`Hoş geldiniz, ${user.ad}`)
      setUserInput('')
      setStep('room')
      
      // Auto focus room input
      setTimeout(() => {
        if (roomInputRef.current) roomInputRef.current.focus()
      }, 300)

    } catch (err) {
      setError('İşlem sırasında bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleRoomSubmit = async () => {
    const trimmedInput = roomInput.trim().toUpperCase()
    if (!trimmedInput.startsWith('ROOM-')) {
      setError('Geçersiz oda kodu formatı. ROOM- ile başlamalı.')
      setRoomInput('')
      setTimeout(() => {
        if (roomInputRef.current) roomInputRef.current.focus()
      }, 500)
      return
    }
    
    if (!currentUser) {
      setError('Önce personel doğrulaması yapılmalı')
      return
    }
    
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data: room, error: roomError } = await supabase
        .from('odalar')
        .select('*')
        .eq('qr_kodu', trimmedInput)
        .eq('aktif', true)
        .single()

      if (roomError || !room) {
        setError('Oda bulunamadı veya aktif değil')
        setRoomInput('')
        setTimeout(() => {
          if (roomInputRef.current) roomInputRef.current.focus()
        }, 500)
        return
      }

      // Create session
      const sessionData = {
        userId: currentUser.id,
        roomId: room.id,
        roomCode: room.oda_kodu,
        userName: currentUser.ad,
        roomName: room.oda_adi,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours
      }

      localStorage.setItem('room_session', JSON.stringify(sessionData))
      
      setSuccess('Giriş başarılı! Yönlendiriliyorsunuz...')
      
      // Redirect to room
      setTimeout(() => {
        router.push(`/room/${room.oda_kodu}`)
      }, 1000)

    } catch (err) {
      setError('İşlem sırasında bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep('user')
    setUserInput('')
    setRoomInput('')
    setCurrentUser(null)
    setError('')
    setSuccess('')
    if (userInputRef.current) {
      userInputRef.current.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step === 'user') {
        handleUserSubmit()
      } else {
        handleRoomSubmit()
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className={`flex flex-col items-center ${step === 'user' ? 'opacity-100' : 'opacity-50'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
            step === 'user' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100 border-2 border-gray-300'
          }`}>
            <span className={`font-semibold ${step === 'user' ? 'text-blue-600' : 'text-gray-400'}`}>
              1
            </span>
          </div>
          <span className={`text-sm font-medium ${step === 'user' ? 'text-blue-600' : 'text-gray-400'}`}>
            Personel
          </span>
        </div>
        
        <div className="w-16 h-0.5 bg-gray-200"></div>
        
        <div className={`flex flex-col items-center ${step === 'room' ? 'opacity-100' : 'opacity-50'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
            step === 'room' ? 'bg-emerald-100 border-2 border-emerald-500' : 'bg-gray-100 border-2 border-gray-300'
          }`}>
            <span className={`font-semibold ${step === 'room' ? 'text-emerald-600' : 'text-gray-400'}`}>
              2
            </span>
          </div>
          <span className={`text-sm font-medium ${step === 'room' ? 'text-emerald-600' : 'text-gray-400'}`}>
            Oda
          </span>
        </div>
      </div>

      {/* Input Section - CENTERED */}
      <div className="space-y-6">
        {step === 'user' ? (
          <div className="text-center">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Personel QR Kodu
              </h3>
              <p className="text-gray-500">
                Personel kimlik kartınızın QR kodunu taratın
              </p>
            </div>
            
            <div className="relative max-w-sm mx-auto">
              <div className="relative">
                <input
                  ref={userInputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="USER-*******-001 formatında girin"
                  className="w-full px-6 py-4 text-center font-mono bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all placeholder:font-sans placeholder:text-gray-400"
                  disabled={loading}
                  autoComplete="off"
                  autoFocus
                />
                {loading && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-sm text-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Format: USER-********-***</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="mb-6">
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                  </svg>
                  <span>{currentUser?.ad}</span>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Oda QR Kodu
              </h3>
              <p className="text-gray-500">
                Girmek istediğiniz odanın QR kodunu taratın
              </p>
            </div>
            
            <div className="relative max-w-sm mx-auto">
              <div className="relative">
                <input
                  ref={roomInputRef}
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="ROOM-*******-001 formatında girin"
                  className="w-full px-6 py-4 text-center font-mono bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-all placeholder:font-sans placeholder:text-gray-400"
                  disabled={loading}
                  autoComplete="off"
                  autoFocus
                />
                {loading && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-sm text-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Format: ROOM-********-***</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="text-center animate-in slide-in-from-top duration-300">
          <div className="inline-flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="text-center animate-in slide-in-from-top duration-300">
          <div className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl ${
            step === 'user' 
              ? 'bg-blue-50 border border-blue-200 text-blue-700' 
              : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
          }`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Reset Button */}
      {currentUser && (
        <div className="text-center pt-4">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors hover:bg-gray-100 px-3 py-1.5 rounded-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Baştan başla
          </button>
        </div>
      )}

      {/* Helper Info */}
      <div className="text-center pt-6 border-t border-gray-100">
        <div className="inline-flex flex-col items-center gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="font-mono">USER-********-***</span>
            <span>→ Personel kodu</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="font-mono">ROOM-********-***</span>
            <span>→ Oda kodu</span>
          </div>
        </div>
      </div>
    </div>
  )
}