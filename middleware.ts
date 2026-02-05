import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Sadece /room/* rotalarını kontrol et
  if (pathname.startsWith('/room/')) {
    // 1. Cookie'den session'ı kontrol et
    const sessionCookie = request.cookies.get('room_session')
    
    if (!sessionCookie) {
      // Session cookie yok, access sayfasına yönlendir
      return NextResponse.redirect(new URL('/access', request.url))
    }
    
    try {
      const session = JSON.parse(sessionCookie.value)
      
      // 2. Session süresi kontrolü
      const expiresAt = new Date(session.expiresAt)
      const now = new Date()
      
      if (expiresAt <= now) {
        // Session süresi dolmuş, cookie'yi temizle ve yönlendir
        const response = NextResponse.redirect(new URL('/access', request.url))
        response.cookies.delete('room_session')
        return response
      }
      
      // 3. Oda uyumluluğu kontrolü
      const roomIdFromPath = pathname.split('/')[2] // /room/yonetici_odasi -> yonetici_odasi
      
      if (session.roomCode !== roomIdFromPath) {
        // Yanlış oda, access sayfasına yönlendir
        return NextResponse.redirect(new URL('/access', request.url))
      }
      
      // 4. Session geçerli, isteği devam ettir
      return NextResponse.next()
      
    } catch (error) {
      console.error('Middleware session parse hatası:', error)
      // Geçersiz session formatı, access sayfasına yönlendir
      const response = NextResponse.redirect(new URL('/access', request.url))
      response.cookies.delete('room_session')
      return response
    }
  }
  
  // Diğer rotalar için normal akış
  return NextResponse.next()
}

// Middleware'in hangi rotalarda çalışacağını belirle
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes (API routes)
     * 2. /_next/static (static files)
     * 3. /_next/image (image optimization files)
     * 4. /favicon.ico (favicon file)
     * 5. /access (giriş sayfası)
     * 6. / (ana sayfa - zaten /access'e redirect ediyor)
     */
    '/room/:path*'
  ]
}
