import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div className={`
      bg-white rounded-xl shadow-md border border-gray-200 
      ${hover ? 'hover:shadow-lg hover:border-blue-300 transition-all duration-200' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}
