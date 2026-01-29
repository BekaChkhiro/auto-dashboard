'use client'

import { useState, useTransition, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import {
  getMakes,
  getModelsByMake,
  deleteMake,
  deleteModel,
  type MakeItem,
  type ModelItem,
} from '@/lib/actions/settings'
import { MakeFormDialog } from './make-form-dialog'
import { ModelFormDialog } from './model-form-dialog'
import { DeleteConfirmDialog } from '../delete-confirm-dialog'
import { cn } from '@/lib/utils'

export function MakesModelsTab() {
  const [makes, setMakes] = useState<MakeItem[]>([])
  const [modelsByMake, setModelsByMake] = useState<Record<string, ModelItem[]>>({})
  const [expandedMakes, setExpandedMakes] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Dialog states
  const [isMakeFormOpen, setIsMakeFormOpen] = useState(false)
  const [editingMake, setEditingMake] = useState<MakeItem | null>(null)
  const [deleteMakeTarget, setDeleteMakeTarget] = useState<MakeItem | null>(null)

  const [isModelFormOpen, setIsModelFormOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<{ model: ModelItem; makeId: string } | null>(null)
  const [addModelMakeId, setAddModelMakeId] = useState<string | null>(null)
  const [deleteModelTarget, setDeleteModelTarget] = useState<ModelItem | null>(null)

  const loadMakes = async () => {
    setIsLoading(true)
    try {
      const data = await getMakes()
      setMakes(data)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load makes',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadModelsForMake = async (makeId: string) => {
    try {
      const models = await getModelsByMake(makeId)
      setModelsByMake((prev) => ({ ...prev, [makeId]: models }))
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load models',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    loadMakes()
  }, [])

  const toggleExpand = (makeId: string) => {
    setExpandedMakes((prev) => {
      const next = new Set(prev)
      if (next.has(makeId)) {
        next.delete(makeId)
      } else {
        next.add(makeId)
        // Load models if not already loaded
        if (!modelsByMake[makeId]) {
          loadModelsForMake(makeId)
        }
      }
      return next
    })
  }

  const filteredMakes = makes.filter((make) =>
    make.name.toLowerCase().includes(search.toLowerCase())
  )

  // Make handlers
  const handleEditMake = (make: MakeItem) => {
    setEditingMake(make)
    setIsMakeFormOpen(true)
  }

  const handleDeleteMake = (make: MakeItem) => {
    setDeleteMakeTarget(make)
  }

  const confirmDeleteMake = () => {
    if (!deleteMakeTarget) return

    startTransition(async () => {
      const result = await deleteMake(deleteMakeTarget.id)

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
          variant: 'success',
        })
        loadMakes()
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }

      setDeleteMakeTarget(null)
    })
  }

  const handleMakeFormClose = () => {
    setIsMakeFormOpen(false)
    setEditingMake(null)
  }

  const handleMakeFormSuccess = () => {
    handleMakeFormClose()
    loadMakes()
  }

  // Model handlers
  const handleAddModel = (makeId: string) => {
    setAddModelMakeId(makeId)
    setIsModelFormOpen(true)
  }

  const handleEditModel = (model: ModelItem, makeId: string) => {
    setEditingModel({ model, makeId })
    setIsModelFormOpen(true)
  }

  const handleDeleteModel = (model: ModelItem) => {
    setDeleteModelTarget(model)
  }

  const confirmDeleteModel = () => {
    if (!deleteModelTarget) return

    startTransition(async () => {
      const result = await deleteModel(deleteModelTarget.id)

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
          variant: 'success',
        })
        loadModelsForMake(deleteModelTarget.makeId)
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }

      setDeleteModelTarget(null)
    })
  }

  const handleModelFormClose = () => {
    setIsModelFormOpen(false)
    setEditingModel(null)
    setAddModelMakeId(null)
  }

  const handleModelFormSuccess = (makeId: string) => {
    handleModelFormClose()
    loadModelsForMake(makeId)
    loadMakes() // Refresh counts
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search makes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setIsMakeFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Make
        </Button>
      </div>

      <div className="rounded-md border">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : filteredMakes.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No makes found</div>
        ) : (
          <div className="divide-y">
            {filteredMakes.map((make) => {
              const isExpanded = expandedMakes.has(make.id)
              const models = modelsByMake[make.id] || []

              return (
                <div key={make.id}>
                  {/* Make row */}
                  <div className="flex items-center gap-2 p-3 hover:bg-muted/50">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleExpand(make.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <span className="flex-1 font-medium">{make.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {make._count.models} models
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditMake(make)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteMake(make)}
                        disabled={make._count.models > 0 || make._count.vehicles > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Models (when expanded) */}
                  {isExpanded && (
                    <div className="bg-muted/30 border-t">
                      {models.length === 0 ? (
                        <div className="pl-12 pr-4 py-3 text-sm text-muted-foreground">
                          No models yet
                        </div>
                      ) : (
                        models.map((model) => (
                          <div
                            key={model.id}
                            className={cn(
                              'flex items-center gap-2 pl-12 pr-4 py-2 hover:bg-muted/50',
                              'border-t border-muted'
                            )}
                          >
                            <span className="flex-1 text-sm">{model.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {model._count.vehicles} vehicles
                            </span>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleEditModel(model, make.id)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleDeleteModel(model)}
                                disabled={model._count.vehicles > 0}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                      <div className="pl-12 pr-4 py-2 border-t border-muted">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleAddModel(make.id)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add Model
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <MakeFormDialog
        open={isMakeFormOpen}
        onClose={handleMakeFormClose}
        onSuccess={handleMakeFormSuccess}
        make={editingMake}
      />

      <ModelFormDialog
        open={isModelFormOpen}
        onClose={handleModelFormClose}
        onSuccess={handleModelFormSuccess}
        model={editingModel?.model}
        makeId={editingModel?.makeId || addModelMakeId || ''}
      />

      <DeleteConfirmDialog
        open={!!deleteMakeTarget}
        onClose={() => setDeleteMakeTarget(null)}
        onConfirm={confirmDeleteMake}
        title="Delete Make"
        description={`Are you sure you want to delete "${deleteMakeTarget?.name}"? This action cannot be undone.`}
        isPending={isPending}
      />

      <DeleteConfirmDialog
        open={!!deleteModelTarget}
        onClose={() => setDeleteModelTarget(null)}
        onConfirm={confirmDeleteModel}
        title="Delete Model"
        description={`Are you sure you want to delete "${deleteModelTarget?.name}"? This action cannot be undone.`}
        isPending={isPending}
      />
    </div>
  )
}
