'use client'

import { useState, useTransition, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, Truck, Ship, Shield, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/hooks/use-toast'
import {
  getTowingPrices,
  deleteTowingPrice,
  getShippingPrices,
  deleteShippingPrice,
  getInsurancePrices,
  deleteInsurancePrice,
  getSystemSetting,
  upsertSystemSetting,
  type TowingPriceItem,
  type ShippingPriceItem,
  type InsurancePriceItem,
} from '@/lib/actions/settings'
import { TowingPriceFormDialog } from './towing-price-form-dialog'
import { ShippingPriceFormDialog } from './shipping-price-form-dialog'
import { InsurancePriceFormDialog } from './insurance-price-form-dialog'
import { DeleteConfirmDialog } from '../delete-confirm-dialog'
import { Label } from '@/components/ui/label'

export function CalculatorTab() {
  const [activeSubTab, setActiveSubTab] = useState('towing')

  // Towing prices state
  const [towingPrices, setTowingPrices] = useState<TowingPriceItem[]>([])
  const [towingSearch, setTowingSearch] = useState('')
  const [isTowingLoading, setIsTowingLoading] = useState(true)
  const [isTowingFormOpen, setIsTowingFormOpen] = useState(false)
  const [editingTowing, setEditingTowing] = useState<TowingPriceItem | null>(null)
  const [deleteTowingTarget, setDeleteTowingTarget] = useState<TowingPriceItem | null>(null)

  // Shipping prices state
  const [shippingPrices, setShippingPrices] = useState<ShippingPriceItem[]>([])
  const [shippingSearch, setShippingSearch] = useState('')
  const [isShippingLoading, setIsShippingLoading] = useState(true)
  const [isShippingFormOpen, setIsShippingFormOpen] = useState(false)
  const [editingShipping, setEditingShipping] = useState<ShippingPriceItem | null>(null)
  const [deleteShippingTarget, setDeleteShippingTarget] = useState<ShippingPriceItem | null>(null)

  // Insurance prices state
  const [insurancePrices, setInsurancePrices] = useState<InsurancePriceItem[]>([])
  const [isInsuranceLoading, setIsInsuranceLoading] = useState(true)
  const [isInsuranceFormOpen, setIsInsuranceFormOpen] = useState(false)
  const [editingInsurance, setEditingInsurance] = useState<InsurancePriceItem | null>(null)
  const [deleteInsuranceTarget, setDeleteInsuranceTarget] = useState<InsurancePriceItem | null>(null)

  // Base price state
  const [basePrice, setBasePrice] = useState('')
  const [isBasePriceLoading, setIsBasePriceLoading] = useState(true)
  const [isBasePriceSaving, setIsBasePriceSaving] = useState(false)

  const [isPending, startTransition] = useTransition()

  // Load towing prices
  const loadTowingPrices = async () => {
    setIsTowingLoading(true)
    try {
      const data = await getTowingPrices()
      setTowingPrices(data)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load towing prices',
        variant: 'destructive',
      })
    } finally {
      setIsTowingLoading(false)
    }
  }

  // Load shipping prices
  const loadShippingPrices = async () => {
    setIsShippingLoading(true)
    try {
      const data = await getShippingPrices()
      setShippingPrices(data)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load shipping prices',
        variant: 'destructive',
      })
    } finally {
      setIsShippingLoading(false)
    }
  }

  // Load insurance prices
  const loadInsurancePrices = async () => {
    setIsInsuranceLoading(true)
    try {
      const data = await getInsurancePrices()
      setInsurancePrices(data)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load insurance prices',
        variant: 'destructive',
      })
    } finally {
      setIsInsuranceLoading(false)
    }
  }

  // Load base price
  const loadBasePrice = async () => {
    setIsBasePriceLoading(true)
    try {
      const value = await getSystemSetting('BASE_TRANSPORTATION_PRICE')
      setBasePrice(value || '')
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load base price',
        variant: 'destructive',
      })
    } finally {
      setIsBasePriceLoading(false)
    }
  }

  useEffect(() => {
    loadTowingPrices()
    loadShippingPrices()
    loadInsurancePrices()
    loadBasePrice()
  }, [])

  // Filter towing prices
  const filteredTowingPrices = towingPrices.filter((tp) => {
    const searchLower = towingSearch.toLowerCase()
    return (
      tp.city.name.toLowerCase().includes(searchLower) ||
      tp.port.name.toLowerCase().includes(searchLower) ||
      tp.city.state.nameEn.toLowerCase().includes(searchLower) ||
      tp.city.state.country.nameEn.toLowerCase().includes(searchLower)
    )
  })

  // Filter shipping prices
  const filteredShippingPrices = shippingPrices.filter((sp) => {
    const searchLower = shippingSearch.toLowerCase()
    return (
      sp.originPort.name.toLowerCase().includes(searchLower) ||
      sp.destinationPort.name.toLowerCase().includes(searchLower) ||
      sp.originPort.state.nameEn.toLowerCase().includes(searchLower) ||
      sp.destinationPort.state.nameEn.toLowerCase().includes(searchLower)
    )
  })

  // Delete handlers
  const confirmDeleteTowing = () => {
    if (!deleteTowingTarget) return
    startTransition(async () => {
      const result = await deleteTowingPrice(deleteTowingTarget.id)
      if (result.success) {
        toast({ title: 'Success', description: result.message, variant: 'success' })
        loadTowingPrices()
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' })
      }
      setDeleteTowingTarget(null)
    })
  }

  const confirmDeleteShipping = () => {
    if (!deleteShippingTarget) return
    startTransition(async () => {
      const result = await deleteShippingPrice(deleteShippingTarget.id)
      if (result.success) {
        toast({ title: 'Success', description: result.message, variant: 'success' })
        loadShippingPrices()
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' })
      }
      setDeleteShippingTarget(null)
    })
  }

  const confirmDeleteInsurance = () => {
    if (!deleteInsuranceTarget) return
    startTransition(async () => {
      const result = await deleteInsurancePrice(deleteInsuranceTarget.id)
      if (result.success) {
        toast({ title: 'Success', description: result.message, variant: 'success' })
        loadInsurancePrices()
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' })
      }
      setDeleteInsuranceTarget(null)
    })
  }

  // Save base price
  const handleSaveBasePrice = async () => {
    if (!basePrice.trim()) {
      toast({ title: 'Error', description: 'Base price is required', variant: 'destructive' })
      return
    }

    const numericValue = parseFloat(basePrice)
    if (isNaN(numericValue) || numericValue < 0) {
      toast({ title: 'Error', description: 'Base price must be a valid positive number', variant: 'destructive' })
      return
    }

    setIsBasePriceSaving(true)
    try {
      const result = await upsertSystemSetting({
        key: 'BASE_TRANSPORTATION_PRICE',
        value: basePrice,
      })
      if (result.success) {
        toast({ title: 'Success', description: 'Base price saved successfully', variant: 'success' })
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save base price', variant: 'destructive' })
    } finally {
      setIsBasePriceSaving(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="towing" className="gap-2">
            <Truck className="h-4 w-4" />
            Towing
          </TabsTrigger>
          <TabsTrigger value="shipping" className="gap-2">
            <Ship className="h-4 w-4" />
            Shipping
          </TabsTrigger>
          <TabsTrigger value="insurance" className="gap-2">
            <Shield className="h-4 w-4" />
            Insurance
          </TabsTrigger>
          <TabsTrigger value="base" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Base Price
          </TabsTrigger>
        </TabsList>

        {/* Towing Prices Tab */}
        <TabsContent value="towing" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by city, port, state..."
                value={towingSearch}
                onChange={(e) => setTowingSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setIsTowingFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Towing Price
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>City</TableHead>
                  <TableHead>State/Country</TableHead>
                  <TableHead>Port</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTowingLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredTowingPrices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No towing prices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTowingPrices.map((tp) => (
                    <TableRow key={tp.id}>
                      <TableCell className="font-medium">{tp.city.name}</TableCell>
                      <TableCell>
                        {tp.city.state.nameEn}, {tp.city.state.country.nameEn}
                      </TableCell>
                      <TableCell>{tp.port.name}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(tp.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingTowing(tp)
                              setIsTowingFormOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTowingTarget(tp)}
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
        </TabsContent>

        {/* Shipping Prices Tab */}
        <TabsContent value="shipping" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by port, state..."
                value={shippingSearch}
                onChange={(e) => setShippingSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setIsShippingFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Shipping Price
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Origin Port</TableHead>
                  <TableHead>Origin Location</TableHead>
                  <TableHead>Destination Port</TableHead>
                  <TableHead>Destination Location</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isShippingLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredShippingPrices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No shipping prices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredShippingPrices.map((sp) => (
                    <TableRow key={sp.id}>
                      <TableCell className="font-medium">{sp.originPort.name}</TableCell>
                      <TableCell>
                        {sp.originPort.state.nameEn}, {sp.originPort.state.country.nameEn}
                      </TableCell>
                      <TableCell className="font-medium">{sp.destinationPort.name}</TableCell>
                      <TableCell>
                        {sp.destinationPort.state.nameEn}, {sp.destinationPort.state.country.nameEn}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(sp.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingShipping(sp)
                              setIsShippingFormOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteShippingTarget(sp)}
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
        </TabsContent>

        {/* Insurance Prices Tab */}
        <TabsContent value="insurance" className="space-y-4">
          <div className="flex items-center justify-end">
            <Button onClick={() => setIsInsuranceFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Insurance Price
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle Value Range</TableHead>
                  <TableHead className="text-right">Insurance Price</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isInsuranceLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : insurancePrices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No insurance prices found
                    </TableCell>
                  </TableRow>
                ) : (
                  insurancePrices.map((ip) => (
                    <TableRow key={ip.id}>
                      <TableCell className="font-medium">
                        {formatCurrency(ip.minValue)} - {formatCurrency(ip.maxValue)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(ip.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingInsurance(ip)
                              setIsInsuranceFormOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteInsuranceTarget(ip)}
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
        </TabsContent>

        {/* Base Price Tab */}
        <TabsContent value="base" className="space-y-4">
          <div className="max-w-md space-y-4">
            <div className="space-y-2">
              <Label htmlFor="basePrice">Base Transportation Price (USD)</Label>
              <p className="text-sm text-muted-foreground">
                This is the base price added to all transportation calculations.
              </p>
              <div className="flex gap-2">
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter base price"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  disabled={isBasePriceLoading}
                />
                <Button onClick={handleSaveBasePrice} disabled={isBasePriceSaving || isBasePriceLoading}>
                  {isBasePriceSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Towing Form Dialog */}
      <TowingPriceFormDialog
        open={isTowingFormOpen}
        onClose={() => {
          setIsTowingFormOpen(false)
          setEditingTowing(null)
        }}
        onSuccess={() => {
          setIsTowingFormOpen(false)
          setEditingTowing(null)
          loadTowingPrices()
        }}
        towingPrice={editingTowing}
      />

      {/* Shipping Form Dialog */}
      <ShippingPriceFormDialog
        open={isShippingFormOpen}
        onClose={() => {
          setIsShippingFormOpen(false)
          setEditingShipping(null)
        }}
        onSuccess={() => {
          setIsShippingFormOpen(false)
          setEditingShipping(null)
          loadShippingPrices()
        }}
        shippingPrice={editingShipping}
      />

      {/* Insurance Form Dialog */}
      <InsurancePriceFormDialog
        open={isInsuranceFormOpen}
        onClose={() => {
          setIsInsuranceFormOpen(false)
          setEditingInsurance(null)
        }}
        onSuccess={() => {
          setIsInsuranceFormOpen(false)
          setEditingInsurance(null)
          loadInsurancePrices()
        }}
        insurancePrice={editingInsurance}
      />

      {/* Delete Dialogs */}
      <DeleteConfirmDialog
        open={!!deleteTowingTarget}
        onClose={() => setDeleteTowingTarget(null)}
        onConfirm={confirmDeleteTowing}
        title="Delete Towing Price"
        description={`Are you sure you want to delete the towing price for "${deleteTowingTarget?.city.name} to ${deleteTowingTarget?.port.name}"? This action cannot be undone.`}
        isPending={isPending}
      />

      <DeleteConfirmDialog
        open={!!deleteShippingTarget}
        onClose={() => setDeleteShippingTarget(null)}
        onConfirm={confirmDeleteShipping}
        title="Delete Shipping Price"
        description={`Are you sure you want to delete the shipping price from "${deleteShippingTarget?.originPort.name}" to "${deleteShippingTarget?.destinationPort.name}"? This action cannot be undone.`}
        isPending={isPending}
      />

      <DeleteConfirmDialog
        open={!!deleteInsuranceTarget}
        onClose={() => setDeleteInsuranceTarget(null)}
        onConfirm={confirmDeleteInsurance}
        title="Delete Insurance Price"
        description={`Are you sure you want to delete this insurance price range? This action cannot be undone.`}
        isPending={isPending}
      />
    </div>
  )
}
