'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import {
  UserIcon,
  QrCodeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const supabase = createClient();

type UserType = Database['public']['Tables']['kullanicilar']['Row'];
type RoomType = Database['public']['Tables']['odalar']['Row'];

export default function RoomAccess() {
  const [step, setStep] = useState<'user' | 'room'>('user');
  const [userInput, setUserInput] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [scannedUser, setScannedUser] = useState<UserType | null>(null);
  const [scannedRoom, setScannedRoom] = useState<RoomType | null>(null);
  const [status, setStatus] = useState<'idle' | 'checking' | 'granted' | 'denied'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const router = useRouter();

  // Cookie set etme fonksiyonu
  const setSessionCookie = (sessionData: any) => {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat
    const cookieValue = JSON.stringify(sessionData);

    // Cookie'yi set et
    document.cookie = `room_session=${encodeURIComponent(cookieValue)}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
  };

  // 1. ADIM: Kullanıcı barkodu kontrolü
  const checkUserBarcode = async (barcode: string) => {
    setStatus('checking');
    setStatusMessage('Kullanıcı kontrol ediliyor...');

    try {
      const { data: user, error } = await supabase
        .from('kullanicilar')
        .select('*')
        .eq('qr_kodu', barcode)
        .eq('aktif', true)
        .single();

      if (error) throw error;

      if (user) {
        setScannedUser(user);
        setStep('room');
        setStatus('idle');
        setStatusMessage('');
      } else {
        setStatus('denied');
        setStatusMessage('Geçersiz kullanıcı barkodu');
      }
    } catch (error) {
      console.error('Kullanıcı kontrol hatası:', error);
      setStatus('denied');
      setStatusMessage('Kullanıcı bulunamadı veya pasif durumda');
    }
  };

  // 2. ADIM: Oda QR kodu kontrolü ve yetki kontrolü
  const checkRoomQRCode = async (qrCode: string) => {
    if (!scannedUser) return;

    setStatus('checking');
    setStatusMessage('Oda yetkisi kontrol ediliyor...');

    try {
      // 1. Odayı bul
      const { data: roomData, error: roomError } = await supabase
        .from('odalar')
        .select('*')
        .eq('qr_kodu', qrCode)
        .eq('aktif', true)
        .single();

      if (roomError || !roomData) {
        setStatus('denied');
        setStatusMessage('Geçersiz oda QR kodu');
        return;
      }

      const room: RoomType = roomData;

      // 2. Kullanıcının bu odaya yetkisi var mı?
      const { data: permission, error: permError } = await supabase
        .from('kullanici_yetkileri')
        .select('*')
        .eq('kullanici_id', scannedUser.id)
        .eq('oda_id', room.id)
        .single();

      if (permError || !permission) {
        setStatus('denied');
        setStatusMessage(`${scannedUser.ad} bu odaya erişim yetkisine sahip değil`);
        return;
      }

      // 3. Erişim izni ver - SESSION KAYDET
      setScannedRoom(room);
      setStatus('granted');
      setStatusMessage('Erişim izni verildi! Yönlendiriliyorsunuz...');

      // 4. Session verilerini hazırla
      const sessionData = {
        userId: scannedUser.id,
        userName: scannedUser.ad,
        roomId: room.id,
        roomCode: room.oda_kodu.toLowerCase(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 saat
      };

      // 5. Hem localStorage hem cookie'ye kaydet
      localStorage.setItem('room_session', JSON.stringify(sessionData));
      setSessionCookie(sessionData);

      // 6. Oda sayfasına yönlendir
      setTimeout(() => {
        router.push(`/room/${room.oda_kodu.toLowerCase()}`);
        router.refresh();
      }, 1500);

    } catch (error) {
      console.error('Oda kontrol hatası:', error);
      setStatus('denied');
      setStatusMessage('Sistem hatası, lütfen tekrar deneyin');
    }
  };

  const resetScanner = () => {
    setStep('user');
    setUserInput('');
    setRoomInput('');
    setScannedUser(null);
    setScannedRoom(null);
    setStatus('idle');
    setStatusMessage('');
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim()) {
      checkUserBarcode(userInput.trim());
      setUserInput('');
    }
  };

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomInput.trim()) {
      checkRoomQRCode(roomInput.trim());
      setRoomInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, type: 'user' | 'room') => {
    if (e.key === 'Enter') {
      if (type === 'user') {
        handleUserSubmit(e as any);
      } else {
        handleRoomSubmit(e as any);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Adım Göstergesi (Progress Pill) */}
      <div className="flex justify-center mb-5">
        <div className="w-full max-w-xl">
          <div className="flex items-center justify-between mb-3">
            <StepPill
              active={step === 'user'}
              done={step === 'room'}
              icon={<UserIcon className="w-5 h-5" />}
              title="Personel"
              subtitle="Barkod"
            />
            <StepPill
              active={step === 'room'}
              done={false}
              icon={<QrCodeIcon className="w-5 h-5" />}
              title="Oda"
              subtitle="QR Kod"
            />
          </div>

          <div className="relative h-2 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full bg-blue-600 transition-all duration-500 ${
                step === 'user' ? 'w-[35%]' : 'w-full'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Scanner Alanı */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        {step === 'user' ? (
          // PERSONEL BARKODU ADIMI
          <div>
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-100 rounded-2xl mb-3">
                <UserIcon className="w-7 h-7 text-slate-700" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Personel Barkodu</h3>
              <p className="text-slate-600 text-sm">
                Personel kimlik kartınızın barkodunu taratın
              </p>
            </div>

            <form onSubmit={handleUserSubmit} className="mb-5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'user')}
                  placeholder="Kullanıcı QR kodunu taratın"
                  className="w-full pl-10 pr-4 py-3 text-base border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition placeholder:text-slate-400"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full mt-3 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-black transition-colors"
              >
                Barkodu Onayla
              </button>
            </form>
          </div>
        ) : (
          // ODA QR KODU ADIMI
          <div>
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-100 rounded-2xl mb-3">
                <QrCodeIcon className="w-7 h-7 text-slate-700" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Oda QR Kodu</h3>
              <p className="text-slate-600 text-sm">
                Oda girişindeki QR kodunu taratın
              </p>
              <div className="mt-2 text-xs text-slate-500 bg-slate-50 inline-block px-3 py-1 rounded-full">
                Aktif kullanıcı: <span className="font-medium">{scannedUser?.ad}</span>
              </div>
            </div>

            <form onSubmit={handleRoomSubmit} className="mb-5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <QrCodeIcon className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'room')}
                  placeholder="Oda QR kodunu taratın"
                  className="w-full pl-10 pr-4 py-3 text-base border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition placeholder:text-slate-400"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full mt-3 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-black transition-colors"
              >
                QR Kodu Onayla
              </button>
            </form>

            <button
              onClick={resetScanner}
              className="w-full py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              ← Farklı Kullanıcı ile Giriş Yap
            </button>
          </div>
        )}

        {/* Durum Mesajı */}
        {status !== 'idle' && (
          <div className={`mt-5 p-4 rounded-xl border ${
            status === 'granted' ? 'border-green-200 bg-green-50' :
            status === 'denied' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            <div className="flex items-center gap-3">
              {status === 'checking' && (
                <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />
              )}
              {status === 'granted' && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
              {status === 'denied' && <XCircleIcon className="w-5 h-5 text-red-600" />}
              <div>
                <p className={`text-sm font-medium ${
                  status === 'granted' ? 'text-green-800' :
                  status === 'denied' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {statusMessage}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- UI Helper ---------- */

function StepPill({
  active,
  done,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  done: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      className={[
        'flex items-center gap-3 rounded-2xl border px-3 py-2 transition-colors',
        active
          ? 'bg-white border-slate-200 shadow-sm text-slate-900'
          : done
          ? 'bg-slate-50 border-slate-200 text-slate-700'
          : 'bg-transparent border-transparent text-slate-500',
      ].join(' ')}
    >
      <div
        className={[
          'w-10 h-10 rounded-xl flex items-center justify-center border',
          active
            ? 'bg-blue-50 border-blue-100 text-blue-700'
            : done
            ? 'bg-slate-100 border-slate-200 text-slate-700'
            : 'bg-slate-50 border-slate-200 text-slate-500',
        ].join(' ')}
      >
        {icon}
      </div>

      <div className="leading-tight">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-[11px] text-slate-500">{subtitle}</div>
      </div>
    </div>
  );
}