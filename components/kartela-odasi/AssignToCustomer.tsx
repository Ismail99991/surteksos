'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Search, X, Users, Mail, Phone, Building, Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/common/Button'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

type KartelaType = Database['public']['Tables']['kartelalar']['Row']
type MusteriType = Database['public']['Tables']['musteriler']['Row']

interface AssignToCustomerProps {
  onClose: () => void
  onAssign: (data: any) => void
  currentKartelaId?: number // Opsiyonel: Direkt kartela ID ile açılabilir
}

export default function AssignToCustomer({ onClose, onAssign, currentKartelaId }: AssignToCustomerProps) {
  const [step, setStep] = useState(1) // 1: Kartela seç, 2: Müşteri seç, 3: Onay
  const [kartelaNo, setKartelaNo] = useState('')
  const [selectedKartela, setSelectedKartela] = useState<KartelaType | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<MusteriType | null>(null)
  const [searchResults, setSearchResults] = useState<KartelaType[]>([])
  const [customers, setCustomers] = useState<MusteriType[]>([])
  const [loading, setLoading] = useState(false)

  const supabase = createClient() as any

  // Müşterileri yükle
  useEffect(() => {
    fetchCustomers()
    
    // Eğer currentKartelaId varsa, direkt o kartelayı yükle
    if (currentKartelaId) {
      fetchKartelaById(currentKartelaId)
    }
  }, [currentKartelaId])

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('musteriler')
        .select('*')
        .order('musteri_adi')
      
      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Müşteriler yüklenemedi:', error)
    }
  }

  const fetchKartelaById = async (kartelaId: number) => {
    try {
      const { data, error } = await supabase
        .from('kartelalar')
        .select('*')
        .eq('id', kartelaId)
        .eq('silindi', false)
        .single()
      
      if (error) throw error
      
      if (data) {
        setSelectedKartela(data)
        setKartelaNo(data.kartela_no || '')
        setStep(2) // Direkt müşteri seçimine geç
      }
    } catch (error) {
      console.error('Kartela yüklenemedi:', error)
    }
  }

  const handleSearchKartela = async () => {
    if (!kartelaNo.trim()) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('kartelalar')
        .select('*')
        .or(`kartela_no.ilike.%${kartelaNo}%,renk_kodu.ilike.%${kartelaNo}%`)
        .eq('silindi', false)
        .eq('musteri_adi', null) // Sadece müşteri atanmamış olanlar
        .limit(10)
      
      if (error) throw error
      
      setSearchResults(data || [])
      
      if (data && data.length === 1) {
        setSelectedKartela(data[0])
      }
    } catch (error) {
      console.error('Kartela arama hatası:', error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (step === 1 && selectedKartela) {
      setStep(2)
    } else if (step === 2 && selectedCustomer) {
      setStep(3)
    }
  }

  const handleAssign = async () => {
    if (!selectedKartela || !selectedCustomer) return
    
    setLoading(true)
    try {
      // 1. Kartelayı müşteriye ata
      const { error: updateError } = await supabase
        .from('kartelalar')
        .update({
          musteri_adi: selectedCustomer.musteri_adi,
          proje_kodu: selectedCustomer.musteri_kodu,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedKartela.id)
      
      if (updateError) throw updateError
      
      // 2. Hareket logu oluştur
      await supabase
        .from('hareket_loglari')
        .insert({
          kartela_id: selectedKartela.id,
          kartela_no: selectedKartela.kartela_no,
          hareket_tipi: 'MUSTERI_ATAMA',
          kullanici_id: 1, // TODO: currentUserId ekle
          kullanici_kodu: 'SYSTEM',
          aciklama: `${selectedKartela.kartela_no} kartelası ${selectedCustomer.musteri_adi} müşterisine atandı`,
          tarih: new Date().toISOString()
        })
      
      // 3. Müşteri istatistiklerini güncelle
      await supabase
        .from('musteriler')
        .update({
          aktif_kartela_sayisi: (selectedCustomer.aktif_kartela_sayisi || 0) + 1,
          toplam_kartela_sayisi: (selectedCustomer.toplam_kartela_sayisi || 0) + 1
        })
        .eq('id', selectedCustomer.id)
      
      const assignmentData = {
        kartela: selectedKartela,
        customer: selectedCustomer,
        assignmentDate: new Date().toISOString(),
        assignedBy: 'Kartela Odası Sorumlusu',
        notes: 'Müşteriye özel kartela oluşturuldu',
      }
      
      onAssign(assignmentData)
      onClose()
      
      alert('✅ Kartela müşteriye başarıyla atandı!')
      
    } catch (error) {
      console.error('Atama hatası:', error)
      alert('❌ Kartela atanamadı!')
    } finally {
      setLoading(false)
    }
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
              disabled={loading}
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
                    {step > stepNum ? <Check className="w-5 h-5" /> : stepNum}
                  </div>
                  <p className="text-sm mt-2 font-medium">
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
                  Kartela No veya Renk Kodu Ara
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={kartelaNo}
                      onChange={(e) => setKartelaNo(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchKartela()}
                      placeholder="Kartela No (KRT-001) veya Renk Kodu (23011737.1)"
                      className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      disabled={loading}
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  <Button 
                    onClick={handleSearchKartela}
                    disabled={loading || !kartelaNo.trim()}
                  >
                    {loading ? 'Aranıyor...' : 'Ara'}
                  </Button>
                </div>
              </div>

              {/* Arama Sonuçları */}
              {searchResults.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h4 className="font-semibold text-gray-900">Bulunan Kartelalar</h4>
                    <p className="text-sm text-gray-600">Müşteri atanmamış kartelalar</p>
                  </div>
                  <div className="divide-y">
                    {searchResults.map((kartela) => (
                      <div
                        key={kartela.id}
                        onClick={() => setSelectedKartela(kartela)}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedKartela?.id === kartela.id 
                            ? 'bg-blue-50 border-l-4 border-blue-500' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-gray-900">
                              {kartela.kartela_no || 'KRT-' + kartela.id}
                            </div>
                            <div className="text-sm text-gray-600">{kartela.renk_kodu} - {kartela.renk_adi}</div>
                          </div>
                          {selectedKartela?.id === kartela.id && (
                            <div className="flex items-center gap-2 text-green-600">
                              <Check className="w-5 h-5" />
                              <span className="text-sm font-medium">Seçildi</span>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div className="text-sm">
                            <span className="text-gray-500">Durum:</span>{' '}
                            <span className={`font-medium ${
                              kartela.durum === 'AKTIF' ? 'text-green-600' :
                              kartela.durum === 'DOLU' ? 'text-blue-600' :
                              'text-gray-600'
                            }`}>
                              {kartela.durum}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Göz:</span>{' '}
                            <span className="font-medium">{kartela.goz_sayisi}/{kartela.maksimum_goz}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedKartela && (
                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-800">✅ Kartela Seçildi</h4>
                      <p className="text-sm text-green-700">Bu kartelayı müşteriye atayabilirsiniz</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Kartela No</p>
                      <p className="font-medium">{selectedKartela.kartela_no}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Renk</p>
                      <p className="font-medium">{selectedKartela.renk_kodu}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Durum</p>
                      <p className="font-medium">Atanmamış (Genel)</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Oluşturulma</p>
                      <p className="font-medium">
                        {new Date(selectedKartela.olusturulma_tarihi|| Date.now()).toLocaleDateString('tr-TR')}
                      </p>
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
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Müşteri Seçin
                  </label>
                  <span className="text-sm text-gray-500">
                    {customers.length} müşteri
                  </span>
                </div>
                
                {customers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Henüz müşteri eklenmemiş</p>
                  </div>
                ) : (
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
                            <Building className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{customer.musteri_adi}</h4>
                            <p className="text-sm text-gray-500">{customer.musteri_kodu}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="text-gray-500">Aktif Kartela:</span>{' '}
                            <span className="font-medium">{customer.aktif_kartela_sayisi || 0}</span>
                          </div>
                          {selectedCustomer?.id === customer.id && (
                            <div className="text-green-600">
                              <Check className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-blue-600">📦</span> Kartela
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">No:</span>
                        <strong>{selectedKartela.kartela_no}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Renk:</span>
                        <span>{selectedKartela.renk_kodu} - {selectedKartela.renk_adi}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Durum:</span>
                        <span className={`font-medium ${
                          selectedKartela.durum === 'AKTIF' ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          {selectedKartela.durum}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Göz:</span>
                        <span>{selectedKartela.goz_sayisi}/{selectedKartela.maksimum_goz}</span>
                      </div>
                    </div>
                  </div>

                  {/* Müşteri Bilgisi */}
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-purple-600">🏢</span> Müşteri
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Adı:</span>
                        <strong>{selectedCustomer.musteri_adi}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Kodu:</span>
                        <span>{selectedCustomer.musteri_kodu}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Durum:</span>
                        <span className={`font-medium ${
                          selectedCustomer.durum === 'AKTIF' ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {selectedCustomer.durum || 'AKTİF'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Aktif Kartela:</span>
                        <span>{selectedCustomer.aktif_kartela_sayisi || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Uyarı */}
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-amber-100 rounded">
                      <span className="text-amber-700">⚠️</span>
                    </div>
                    <div>
                      <p className="text-amber-800 font-medium mb-1">Dikkat!</p>
                      <p className="text-amber-700 text-sm">
                        Bu işlem sonrasında kartela artık <strong>{selectedCustomer.musteri_adi}</strong> müşterisine özel olacaktır.
                        Diğer müşteriler bu kartelayı göremeyecek ve raporlarda sadece bu müşteriye ait olarak görünecektir.
                      </p>
                    </div>
                  </div>
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
                disabled={loading}
              >
                ← Geri
              </Button>
            )}
            
            <div className="flex gap-3 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                İptal
              </Button>
              
              {step < 3 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                  disabled={
                    loading ||
                    (step === 1 && !selectedKartela) ||
                    (step === 2 && !selectedCustomer)
                  }
                >
                  {loading ? 'Yükleniyor...' : 'İleri →'}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleAssign}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Atanıyor...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Kartelayı Ata
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}