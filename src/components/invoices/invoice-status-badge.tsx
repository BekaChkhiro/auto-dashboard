import { Badge } from '@/components/ui/badge'
import type { InvoiceStatus } from '@/generated/prisma'

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
}

const statusConfig: Record<InvoiceStatus, { label: string; variant: 'warning' | 'success' | 'muted' }> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  PAID: { label: 'Paid', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'muted' },
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
