interface StatusBadgeProps {
  status: 'arsivde' | 'sef_masasinda' | 'uretimde' | 'kayip'
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const statusConfig = {
    arsivde: {
      label: 'Arşivde',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '📁',
    },
    sef_masasinda: {
      label: 'Şef Masasında',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '👨‍💼',
    },
    uretimde: {
      label: 'Üretimde',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: '⚙️',
    },
    kayip: {
      label: 'Kayıp',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: '🔍',
    },
  }
  
  const config = statusConfig[status]
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  
  return (
    <span className={`
      inline-flex items-center gap-1.5 rounded-full border
      ${config.color} ${sizeClass} font-medium
    `}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  )
}
