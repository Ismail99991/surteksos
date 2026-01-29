'use client'

import { useState } from 'react'
import { UserPlus, Search, X, Users, Mail, Phone } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/common/Button'

interface AssignToCustomerProps {
  onClose: () => void
  onAssign: (data: any) => void
}

export default function AssignToCustomer({ onClose, onAssign }: AssignToCustomerProps) {
  const [step, setStep] = useState(1) // 1: Kartela seç, 2: Müşteri seç, 3: Onay
  const [kartelaNo, setKartelaNo] = useState('')
  const [selectedKartela, setSelectedKartela] = useState<any>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])

  const customers = [
    { id: '1', name: 'Nike', email: 'nike@example.com', phone: '+90 555 111 2233', contact: 'Ahmet Yılmaz' },
    { id: '2', name: 'Zara', email: 'zara@example.com', phone: '+90 555 222 3344', contact: 'Ayşe Demir' },
    { id: '3', name: 'Mavi', email: 'mavi@example.com', phone: '+90 555 333 4455', contact: 'Mehmet Kaya' },
    { id: '4', name: 'LC Waikiki', email: 'lcw@example.com', phone: '+90 555 444 5566', contact: 'Fatma Şahin' },
    { id: '5', name: 'Defacto', email: 'defacto@example.com', phone: '+90 555 555 6677', contact: 'Ali Çelik' },
    { id: '6', name: 'Koton', email: 'koton@example.com', phone: '+90 555 666 7788', contact: 'Zeynep Arslan' },
  ]

  const handleSearchKartela = () => {
    if (!kartelaNo.trim()) return
    
    // Mock search
    const results = [
      {
        id: '1',
        renk_kodu: kartelaNo,
        musteri: null, // Henüz atanmamış
        durum: 'arsivde',
        tip: 'genel',
        olusturma_tarihi: '2024-01-20T10:30:00Z',
      }
    ]
    
    setSearchResults(results)
    setSelectedKartela(results[0])
  }

  const handleNext = () => {
    if (step === 1 && selectedKartela) {
      setStep(2)
    } else if (step === 2 && selectedCustomer) {
      setStep(3)
    }
  }

  const handleAssign = () => {
    const assignmentData = {
      kartela: selectedKartela,
      customer: selectedCustomer,
      assignmentDate: new Date().toISOString(),
      assignedBy: 'Kartela Odası Sorumlusu',
      notes: 'Müşteriye özel kartela oluşturuldu',
    }
    
    onAssign(assignmentData)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserPlus className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Müşteriye Kartela Ata</h2>
                <p className="text-gray-600">Kartelayı müşteriye özel hale getirin</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${step === stepNum ? 'bg-blue-600 text-white' : 
                      step > stepNum ? 'bg-green-600 text-white' : 
                      'bg-gray-200 text-gray-600'}
                  `}>
                    {step > stepNum ? '✓' : stepNum}
                  </div>
                  <p className="text-sm mt-2">
                    {stepNum === 1 && 'Kartela Seç'}
                    {stepNum === 2 && 'Müşteri Seç'}
                    {stepNum === 3 && 'Onay'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Kartela Seç */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kartela No Ara
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={kartelaNo}
                      onChange={(e) => setKartelaNo(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchKartela()}
                      placeholder="231010001.1 veya son 4 hane"
                      className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  <Button onClick={handleSearchKartela}>
                    Ara
                  </Button>
                </div>
              </div>

              {selectedKartela && (
                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">✅ Kartela Bulundu</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Kartela No</p>
                      <p className="font-medium">{selectedKartela.renk_kodu}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Durum</p>
                      <p className="font-medium">Atanmamış (Genel)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Müşteri Seç */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Müşteri Seçin
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedCustomer?.id === customer.id
                          ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Users className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{customer.name}</h4>
                          <p className="text-sm text-gray-500">{customer.contact}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{customer.phone}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Onay */}
          {step === 3 && selectedKartela && selectedCustomer && (
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <h3 className="text-xl font-bold text-center text-gray-900 mb-6">
                  🎉 Atama Özeti
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Kartela Bilgisi */}
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-blue-600">📦</span> Kartela
                    </h4>
                    <div className="space-y-2">
                      <p><span className="text-gray-500">No:</span> <strong>{selectedKartela.renk_kodu}</strong></p>
                      <p><span className="text-gray-500">Tip:</span> Genel → Özel</p>
                      <p><span className="text-gray-500">İşlem:</span> Müşteriye Atanacak</p>
                    </div>
                  </div>

                  {/* Müşteri Bilgisi */}
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-purple-600">👤</span> Müşteri
                    </h4>
                    <div className="space-y-2">
                      <p><strong>{selectedCustomer.name}</strong></p>
                      <p>{selectedCustomer.contact}</p>
                      <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
                      <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Uyarı */}
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-amber-700 text-sm">
                    ⚠️ Bu işlem sonrasında kartela artık <strong>{selectedCustomer.name}</strong> müşterisine özel olacaktır.
                    Diğer müşteriler bu kartelayı göremeyecek.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-6 border-t">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
              >
                ← Geri
              </Button>
            )}
            
            <div className="flex gap-3 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                İptal
              </Button>
              
              {step < 3 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !selectedKartela) ||
                    (step === 2 && !selectedCustomer)
                  }
                >
                  İleri →
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleAssign}
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Kartelayı Ata
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
