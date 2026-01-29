import { Badge } from '@/components/ui/badge'
import type { BalanceRequestStatus } from '@/generated/prisma'

interface BalanceRequestStatusBadgeProps {
  status: BalanceRequestStatus
}

const statusConfig: Record<BalanceRequestStatus, { label: string; variant: 'warning' | 'success' | 'destructive' }> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
}

export function BalanceRequestStatusBadge({ status }: BalanceRequestStatusBadgeProps) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
