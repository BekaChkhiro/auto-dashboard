'use client'

import { useState, useTransition, useEffect } from 'react'
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import {
  getStatuses,
  deleteStatus,
  updateStatusOrder,
  type StatusItem,
} from '@/lib/actions/settings'
import { StatusFormDialog } from './status-form-dialog'
import { DeleteConfirmDialog } from '../delete-confirm-dialog'

export function StatusesTab() {
  const [statuses, setStatuses] = useState<StatusItem[]>([])
  const [localStatuses, setLocalStatuses] = useState<StatusItem[]>([])
  const [hasOrderChanges, setHasOrderChanges] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingStatus, setEditingStatus] = useState<StatusItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StatusItem | null>(null)

  const loadStatuses = async () => {
    setIsLoading(true)
    try {
      const data = await getStatuses()
      setStatuses(data)
      setLocalStatuses(data)
      setHasOrderChanges(false)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load statuses',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStatuses()
  }, [])

  const moveUp = (index: number) => {
    if (index === 0) return
    const newStatuses = [...localStatuses]
    ;[newStatuses[index - 1], newStatuses[index]] = [newStatuses[index], newStatuses[index - 1]]
    setLocalStatuses(newStatuses)
    setHasOrderChanges(true)
  }

  const moveDown = (index: number) => {
    if (index === localStatuses.length - 1) return
    const newStatuses = [...localStatuses]
    ;[newStatuses[index], newStatuses[index + 1]] = [newStatuses[index + 1], newStatuses[index]]
    setLocalStatuses(newStatuses)
    setHasOrderChanges(true)
  }

  const saveOrder = () => {
    startTransition(async () => {
      const orderedIds = localStatuses.map((s) => s.id)
      const result = await updateStatusOrder({ orderedIds })

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
          variant: 'success',
        })
        loadStatuses()
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }
    })
  }

  const cancelOrderChanges = () => {
    setLocalStatuses(statuses)
    setHasOrderChanges(false)
  }

  const handleEdit = (status: StatusItem) => {
    setEditingStatus(status)
    setIsFormOpen(true)
  }

  const handleDelete = (status: StatusItem) => {
    setDeleteTarget(status)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return

    startTransition(async () => {
      const result = await deleteStatus(deleteTarget.id)

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
          variant: 'success',
        })
        loadStatuses()
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }

      setDeleteTarget(null)
    })
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingStatus(null)
  }

  const handleFormSuccess = () => {
    handleFormClose()
    loadStatuses()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Drag to reorder statuses or use arrow buttons. Changes must be saved.
        </p>
        <div className="flex gap-2">
          {hasOrderChanges && (
            <>
              <Button variant="outline" onClick={cancelOrderChanges} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={saveOrder} disabled={isPending}>
                <Save className="mr-2 h-4 w-4" />
                Save Order
              </Button>
            </>
          )}
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Status
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">#</TableHead>
              <TableHead className="w-20 text-center">Color</TableHead>
              <TableHead>Georgian</TableHead>
              <TableHead>English</TableHead>
              <TableHead className="w-24 text-center">Vehicles</TableHead>
              <TableHead className="w-32 text-center">Reorder</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : localStatuses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No statuses found
                </TableCell>
              </TableRow>
            ) : (
              localStatuses.map((status, index) => (
                <TableRow key={status.id}>
                  <TableCell className="text-center font-medium">{index + 1}</TableCell>
                  <TableCell className="text-center">
                    {status.color ? (
                      <div
                        className="mx-auto h-6 w-6 rounded border"
                        style={{ backgroundColor: status.color }}
                      />
                    ) : (
                      <Badge variant="outline">None</Badge>
                    )}
                  </TableCell>
                  <TableCell>{status.nameKa}</TableCell>
                  <TableCell>{status.nameEn}</TableCell>
                  <TableCell className="text-center">{status._count.vehicles}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveDown(index)}
                        disabled={index === localStatuses.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(status)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDelete(status)}
                        disabled={status._count.vehicles > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <StatusFormDialog
        open={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        status={editingStatus}
        nextOrder={localStatuses.length + 1}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Status"
        description={`Are you sure you want to delete "${deleteTarget?.nameEn}"? This action cannot be undone.`}
        isPending={isPending}
      />
    </div>
  )
}
