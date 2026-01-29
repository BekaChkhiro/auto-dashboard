'use client'

import { useState, useTransition, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/hooks/use-toast'
import { getAuctions, deleteAuction, type AuctionItem } from '@/lib/actions/settings'
import { AuctionFormDialog } from './auction-form-dialog'
import { DeleteConfirmDialog } from '../delete-confirm-dialog'

export function AuctionsTab() {
  const [auctions, setAuctions] = useState<AuctionItem[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAuction, setEditingAuction] = useState<AuctionItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AuctionItem | null>(null)

  const loadAuctions = async () => {
    setIsLoading(true)
    try {
      const data = await getAuctions()
      setAuctions(data)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load auctions',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAuctions()
  }, [])

  const filteredAuctions = auctions.filter((auction) =>
    auction.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleEdit = (auction: AuctionItem) => {
    setEditingAuction(auction)
    setIsFormOpen(true)
  }

  const handleDelete = (auction: AuctionItem) => {
    setDeleteTarget(auction)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return

    startTransition(async () => {
      const result = await deleteAuction(deleteTarget.id)

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
          variant: 'success',
        })
        loadAuctions()
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
    setEditingAuction(null)
  }

  const handleFormSuccess = () => {
    handleFormClose()
    loadAuctions()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search auctions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Auction
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-32 text-center">Vehicles</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredAuctions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No auctions found
                </TableCell>
              </TableRow>
            ) : (
              filteredAuctions.map((auction) => (
                <TableRow key={auction.id}>
                  <TableCell className="font-medium">{auction.name}</TableCell>
                  <TableCell className="text-center">{auction._count.vehicles}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(auction)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(auction)}
                        disabled={auction._count.vehicles > 0}
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

      <AuctionFormDialog
        open={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        auction={editingAuction}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Auction"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        isPending={isPending}
      />
    </div>
  )
}
