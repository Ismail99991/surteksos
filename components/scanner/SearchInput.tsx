'use client'

import { useState, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/common/Button'

interface SearchInputProps {
  placeholder?: string
  onSearch: (value: string) => void
  autoFocus?: boolean
}

export default function SearchInput({
  placeholder = 'Renk kodu girin...',
  onSearch,
  autoFocus = true,
}: SearchInputProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      onSearch(inputValue.trim())
      setInputValue('')
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Barkod tarayıcılar için Enter tuşu
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
        <Button type="submit" variant="primary">
          Ara
        </Button>
      </div>
    </form>
  )
}
