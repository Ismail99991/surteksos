export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold">🏭 Kartela Takip Sistemi</h3>
            <p className="text-gray-400 text-sm mt-1">
              Renk kartela yönetimi için modern çözüm
            </p>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-gray-300">
              © 2024 Tüm hakları saklıdır.
            </p>
            <p className="text-gray-400 text-sm mt-1">
              v1.0 • Component Test
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-6 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            Bu sayfa component kütüphanesini test etmek için oluşturulmuştur.
          </p>
        </div>
      </div>
    </footer>
  )
}
