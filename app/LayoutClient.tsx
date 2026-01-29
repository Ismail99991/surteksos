'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  QrCode, 
  BarChart3, 
  Menu, 
  X,
  Factory,
  History
} from 'lucide-react'

const navItems = [
  { path: '/', label: 'Ana Sayfa', icon: <Home className="w-5 h-5" /> },
  { path: '/scanner', label: 'Tarayıcı', icon: <QrCode className="w-5 h-5" /> },
  { path: '/dashboard', label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" /> },
  { path: '/history', label: 'Geçmiş', icon: <History className="w-5 h-5" /> },
]

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Factory className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-800">
                Kartela Takip
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    pathname === item.path
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 ${
                    pathname === item.path
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-300">
            © 2024 Kartela Takip Sistemi - Tüm hakları saklıdır.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Surteks OS - Renk ve Kartela Yönetim Sistemi
          </p>
        </div>
      </footer>
    </div>
  )
}
