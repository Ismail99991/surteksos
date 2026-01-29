import Link from 'next/link'
import { Factory, Search, BarChart3, Home } from 'lucide-react'

export default function Header() {
  const navItems = [
    { path: '/', label: 'Ana Sayfa', icon: <Home className="w-5 h-5" /> },
    { path: '/scanner', label: 'Tarayıcı', icon: <Search className="w-5 h-5" /> },
    { path: '/dashboard', label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" /> },
  ]

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Factory className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Kartela Takip</h1>
              <p className="text-xs text-gray-500">Component Test</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-blue-600 transition-colors"
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100">
            <div className="space-y-1">
              <div className="w-6 h-0.5 bg-gray-600"></div>
              <div className="w-6 h-0.5 bg-gray-600"></div>
              <div className="w-4 h-0.5 bg-gray-600"></div>
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}
