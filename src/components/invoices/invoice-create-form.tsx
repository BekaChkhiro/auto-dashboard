'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Minus, FileText, User, Car } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  createInvoice,
  getVehiclesForInvoice,
  type DealerForInvoice,
  type VehicleForInvoice,
} from '@/lib/actions/invoices'
import { formatCurrency } from '@/lib/formatting'

interface InvoiceCreateFormProps {
  dealers: DealerForInvoice[]
}

export function InvoiceCreateForm({ dealers }: InvoiceCreateFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedDealerId, setSelectedDealerId] = useState<string>('')
  const [vehicles, setVehicles] = useState<VehicleForInvoice[]>([])
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(new Set())
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false)

  const selectedDealer = dealers.find((d) => d.id === selectedDealerId)
  const selectedVehicles = vehicles.filter((v) => selectedVehicleIds.has(v.id))
  const totalAmount = selectedVehicles.reduce((sum, v) => sum + v.transportationPrice, 0)

  // Handle dealer selection change
  const handleDealerChange = (dealerId: string) => {
    setSelectedDealerId(dealerId)
    setSelectedVehicleIds(new Set())

    if (!dealerId) {
      setVehicles([])
      return
    }

    setIsLoadingVehicles(true)

    getVehiclesForInvoice(dealerId)
      .then((result) => {
        setVehicles(result)
      })
      .catch(() => {
        toast({
          title: 'Error',
          description: 'Failed to load vehicles',
          variant: 'destructive',
        })
        setVehicles([])
      })
      .finally(() => {
        setIsLoadingVehicles(false)
      })
  }

  const handleVehicleToggle = (vehicleId: string) => {
    setSelectedVehicleIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId)
      } else {
        newSet.add(vehicleId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedVehicleIds.size === vehicles.length) {
      setSelectedVehicleIds(new Set())
    } else {
      setSelectedVehicleIds(new Set(vehicles.map((v) => v.id)))
    }
  }

  const handleSubmit = () => {
    if (!selectedDealerId) {
      toast({
        title: 'Error',
        description: 'Please select a dealer',
        variant: 'destructive',
      })
      return
    }

    if (selectedVehicleIds.size === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one vehicle',
        variant: 'destructive',
      })
      return
    }

    startTransition(async () => {
      const result = await createInvoice({
        dealerId: selectedDealerId,
        vehicleIds: Array.from(selectedVehicleIds),
      })

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
          variant: 'success',
        })
        router.push(`/admin/invoices/${result.invoiceId}`)
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Dealer Selection */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Select Dealer
          </CardTitle>
          <CardDescription>
            Choose a dealer to create an invoice for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dealer">Dealer</Label>
              <Select value={selectedDealerId} onValueChange={handleDealerChange}>
                <SelectTrigger id="dealer">
                  <SelectValue placeholder="Select a dealer..." />
                </SelectTrigger>
                <SelectContent>
                  {dealers.map((dealer) => (
                    <SelectItem key={dealer.id} value={dealer.id}>
                      <div className="flex items-center justify-between gap-4">
                        <span>{dealer.name}</span>
                        {dealer.companyName && (
                          <span className="text-muted-foreground">({dealer.companyName})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDealer && (
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <p className="text-sm"><span className="text-muted-foreground">Email:</span> {selectedDealer.email}</p>
                {selectedDealer.companyName && (
                  <p className="text-sm"><span className="text-muted-foreground">Company:</span> {selectedDealer.companyName}</p>
                )}
                <p className="text-sm"><span className="text-muted-foreground">Current Balance:</span> <span className="font-medium">{formatCurrency(selectedDealer.balance, 'en')}</span></p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vehicles Selected</span>
              <span className="font-medium">{selectedVehicleIds.size}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="font-medium">Total Amount</span>
              <span className="text-xl font-bold">{formatCurrency(totalAmount, 'en')}</span>
            </div>
          </div>

          {selectedDealer && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Balance</span>
                  <span>{formatCurrency(selectedDealer.balance, 'en')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">After Payment</span>
                  <span className={selectedDealer.balance - totalAmount < 0 ? 'text-destructive' : 'text-success'}>
                    {formatCurrency(selectedDealer.balance - totalAmount, 'en')}
                  </span>
                </div>
              </div>
            </>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={isPending || !selectedDealerId || selectedVehicleIds.size === 0}
          >
            <Plus className="mr-2 h-5 w-5" />
            {isPending ? 'Creating Invoice...' : 'Create Invoice'}
          </Button>
        </CardContent>
      </Card>

      {/* Vehicles Selection */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Select Vehicles
          </CardTitle>
          <CardDescription>
            {selectedDealerId
              ? 'Choose which vehicles to include in this invoice'
              : 'Select a dealer first to see available vehicles'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedDealerId ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">Select a dealer to see available vehicles</p>
            </div>
          ) : isLoadingVehicles ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-muted-foreground">Loading vehicles...</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">No vehicles available</p>
              <p className="text-sm text-muted-foreground mt-1">
                All vehicles for this dealer already have active invoices
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedVehicleIds.size === vehicles.length ? (
                    <>
                      <Minus className="mr-2 h-4 w-4" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Select All ({vehicles.length})
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {selectedVehicleIds.size} of {vehicles.length} selected
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>VIN</TableHead>
                    <TableHead className="hidden md:table-cell">Lot #</TableHead>
                    <TableHead className="hidden lg:table-cell">Status</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow
                      key={vehicle.id}
                      className={selectedVehicleIds.has(vehicle.id) ? 'bg-muted/50' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedVehicleIds.has(vehicle.id)}
                          onCheckedChange={() => handleVehicleToggle(vehicle.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {vehicle.vin}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {vehicle.lotNumber || '-'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {vehicle.status.name}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(vehicle.transportationPrice, 'en')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
