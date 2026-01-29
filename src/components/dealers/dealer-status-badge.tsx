import { Badge } from '@/components/ui/badge'
import type { UserStatus } from '@/generated/prisma'

interface DealerStatusBadgeProps {
  status: UserStatus
}

export function DealerStatusBadge({ status }: DealerStatusBadgeProps) {
  return (
    <Badge variant={status === 'ACTIVE' ? 'success' : 'destructive'}>
      {status === 'ACTIVE' ? 'Active' : 'Blocked'}
    </Badge>
  )
}
