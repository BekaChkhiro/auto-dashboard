import { Badge } from '@/components/ui/badge'

interface VehicleStatusBadgeProps {
  status: {
    nameEn: string
    nameKa: string
    color: string | null
  }
  locale?: 'en' | 'ka'
}

export function VehicleStatusBadge({ status, locale = 'en' }: VehicleStatusBadgeProps) {
  const label = locale === 'ka' ? status.nameKa : status.nameEn
  const color = status.color || '#6b7280' // Default to gray if no color

  return (
    <Badge
      variant="outline"
      style={{
        backgroundColor: `${color}20`,
        borderColor: color,
        color: color,
      }}
    >
      {label}
    </Badge>
  )
}
