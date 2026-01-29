'use client'

import { useEffect, useRef, useState } from 'react'

interface UseBarcodeScannerProps {
  onScan: (data: string) => void
  autoFocus?: boolean
  scanDelay?: number
}

export function useBarcodeScanner({
  onScan,
  autoFocus = true,
  scanDelay = 100,
}: UseBarcodeScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [lastScanned, setLastScanned] = useState<string>('')
  const [isScanning, setIsScanning] = useState(false)

  // Input'a otomatik focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Barkod tarayıcı yakalama
  const handleBarcodeInput = (value: string) => {
    // Barkod tarayıcılar hızlı yazar ve Enter ile biter
    // Ama biz sadece değişiklikleri dinleyelim
    if (value.length > lastScanned.length) {
      const newChar = value.slice(-1)
      
      // Eğer Enter tuşu veya barkod tamamlandıysa
      if (newChar === '\n' || newChar === '\r' || value.length > 10) {
        const cleanValue = value.trim().replace(/[\n\r]/g, '')
        if (cleanValue && cleanValue !== lastScanned) {
          setIsScanning(true)
          setLastScanned(cleanValue)
          
          // Küçük bir gecikmeyle callback'i çağır
          setTimeout(() => {
            onScan(cleanValue)
            setIsScanning(false)
          }, scanDelay)
        }
      }
    }
  }

  // Manuel input değişikliği
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    handleBarcodeInput(value)
  }

  // Input'u temizle
  const clearInput = () => {
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    setLastScanned('')
  }

  return {
    inputRef,
    isScanning,
    lastScanned,
    handleInputChange,
    clearInput,
    focusInput: () => inputRef.current?.focus(),
  }
}
