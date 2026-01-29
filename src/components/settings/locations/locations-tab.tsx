'use client'

import { useState, useTransition, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/hooks/use-toast'
import {
  getCountries,
  getStatesByCountry,
  getCitiesByState,
  getPortsByState,
  deleteCountry,
  deleteState,
  deleteCity,
  deletePort,
  type CountryItem,
  type StateItem,
  type CityItem,
  type PortItem,
} from '@/lib/actions/settings'
import { CountryFormDialog } from './country-form-dialog'
import { StateFormDialog } from './state-form-dialog'
import { CityFormDialog } from './city-form-dialog'
import { PortFormDialog } from './port-form-dialog'
import { DeleteConfirmDialog } from '../delete-confirm-dialog'
import { cn } from '@/lib/utils'

export function LocationsTab() {
  // Data states
  const [countries, setCountries] = useState<CountryItem[]>([])
  const [states, setStates] = useState<StateItem[]>([])
  const [cities, setCities] = useState<CityItem[]>([])
  const [ports, setPorts] = useState<PortItem[]>([])

  // Selection states
  const [selectedCountry, setSelectedCountry] = useState<CountryItem | null>(null)
  const [selectedState, setSelectedState] = useState<StateItem | null>(null)

  // Loading states
  const [isLoadingCountries, setIsLoadingCountries] = useState(true)
  const [isLoadingStates, setIsLoadingStates] = useState(false)
  const [isLoadingCities, setIsLoadingCities] = useState(false)
  const [isLoadingPorts, setIsLoadingPorts] = useState(false)

  const [isPending, startTransition] = useTransition()

  // Dialog states - Countries
  const [isCountryFormOpen, setIsCountryFormOpen] = useState(false)
  const [editingCountry, setEditingCountry] = useState<CountryItem | null>(null)
  const [deleteCountryTarget, setDeleteCountryTarget] = useState<CountryItem | null>(null)

  // Dialog states - States
  const [isStateFormOpen, setIsStateFormOpen] = useState(false)
  const [editingState, setEditingState] = useState<StateItem | null>(null)
  const [deleteStateTarget, setDeleteStateTarget] = useState<StateItem | null>(null)

  // Dialog states - Cities
  const [isCityFormOpen, setIsCityFormOpen] = useState(false)
  const [editingCity, setEditingCity] = useState<CityItem | null>(null)
  const [deleteCityTarget, setDeleteCityTarget] = useState<CityItem | null>(null)

  // Dialog states - Ports
  const [isPortFormOpen, setIsPortFormOpen] = useState(false)
  const [editingPort, setEditingPort] = useState<PortItem | null>(null)
  const [deletePortTarget, setDeletePortTarget] = useState<PortItem | null>(null)

  // Load functions
  const loadCountries = async () => {
    setIsLoadingCountries(true)
    try {
      const data = await getCountries()
      setCountries(data)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load countries',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingCountries(false)
    }
  }

  const loadStates = async (countryId: string) => {
    setIsLoadingStates(true)
    try {
      const data = await getStatesByCountry(countryId)
      setStates(data)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load states',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingStates(false)
    }
  }

  const loadCities = async (stateId: string) => {
    setIsLoadingCities(true)
    try {
      const data = await getCitiesByState(stateId)
      setCities(data)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load cities',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingCities(false)
    }
  }

  const loadPorts = async (stateId: string) => {
    setIsLoadingPorts(true)
    try {
      const data = await getPortsByState(stateId)
      setPorts(data)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load ports',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingPorts(false)
    }
  }

  useEffect(() => {
    loadCountries()
  }, [])

  // Selection handlers
  const handleSelectCountry = (country: CountryItem) => {
    setSelectedCountry(country)
    setSelectedState(null)
    setStates([])
    setCities([])
    setPorts([])
    loadStates(country.id)
  }

  const handleSelectState = (state: StateItem) => {
    setSelectedState(state)
    setCities([])
    setPorts([])
    loadCities(state.id)
    loadPorts(state.id)
  }

  // Country handlers
  const handleEditCountry = (country: CountryItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingCountry(country)
    setIsCountryFormOpen(true)
  }

  const handleDeleteCountry = (country: CountryItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteCountryTarget(country)
  }

  const confirmDeleteCountry = () => {
    if (!deleteCountryTarget) return
    startTransition(async () => {
      const result = await deleteCountry(deleteCountryTarget.id)
      if (result.success) {
        toast({ title: 'Success', description: result.message, variant: 'success' })
        if (selectedCountry?.id === deleteCountryTarget.id) {
          setSelectedCountry(null)
          setStates([])
          setCities([])
          setPorts([])
        }
        loadCountries()
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' })
      }
      setDeleteCountryTarget(null)
    })
  }

  // State handlers
  const handleEditState = (state: StateItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingState(state)
    setIsStateFormOpen(true)
  }

  const handleDeleteState = (state: StateItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteStateTarget(state)
  }

  const confirmDeleteState = () => {
    if (!deleteStateTarget) return
    startTransition(async () => {
      const result = await deleteState(deleteStateTarget.id)
      if (result.success) {
        toast({ title: 'Success', description: result.message, variant: 'success' })
        if (selectedState?.id === deleteStateTarget.id) {
          setSelectedState(null)
          setCities([])
          setPorts([])
        }
        if (selectedCountry) {
          loadStates(selectedCountry.id)
          loadCountries() // Refresh counts
        }
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' })
      }
      setDeleteStateTarget(null)
    })
  }

  // City handlers
  const handleEditCity = (city: CityItem) => {
    setEditingCity(city)
    setIsCityFormOpen(true)
  }

  const handleDeleteCity = (city: CityItem) => {
    setDeleteCityTarget(city)
  }

  const confirmDeleteCity = () => {
    if (!deleteCityTarget) return
    startTransition(async () => {
      const result = await deleteCity(deleteCityTarget.id)
      if (result.success) {
        toast({ title: 'Success', description: result.message, variant: 'success' })
        if (selectedState) loadCities(selectedState.id)
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' })
      }
      setDeleteCityTarget(null)
    })
  }

  // Port handlers
  const handleEditPort = (port: PortItem) => {
    setEditingPort(port)
    setIsPortFormOpen(true)
  }

  const handleDeletePort = (port: PortItem) => {
    setDeletePortTarget(port)
  }

  const confirmDeletePort = () => {
    if (!deletePortTarget) return
    startTransition(async () => {
      const result = await deletePort(deletePortTarget.id)
      if (result.success) {
        toast({ title: 'Success', description: result.message, variant: 'success' })
        if (selectedState) loadPorts(selectedState.id)
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' })
      }
      setDeletePortTarget(null)
    })
  }

  // Form success handlers
  const handleCountryFormSuccess = () => {
    setIsCountryFormOpen(false)
    setEditingCountry(null)
    loadCountries()
  }

  const handleStateFormSuccess = () => {
    setIsStateFormOpen(false)
    setEditingState(null)
    if (selectedCountry) {
      loadStates(selectedCountry.id)
      loadCountries() // Refresh counts
    }
  }

  const handleCityFormSuccess = () => {
    setIsCityFormOpen(false)
    setEditingCity(null)
    if (selectedState) {
      loadCities(selectedState.id)
      if (selectedCountry) loadStates(selectedCountry.id) // Refresh counts
    }
  }

  const handlePortFormSuccess = () => {
    setIsPortFormOpen(false)
    setEditingPort(null)
    if (selectedState) {
      loadPorts(selectedState.id)
      if (selectedCountry) loadStates(selectedCountry.id) // Refresh counts
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Countries Column */}
        <LocationColumn
          title="Countries"
          onAdd={() => setIsCountryFormOpen(true)}
          isLoading={isLoadingCountries}
          isEmpty={countries.length === 0}
          emptyMessage="No countries"
        >
          {countries.map((country) => (
            <LocationItem
              key={country.id}
              label={country.nameEn}
              sublabel={country.code}
              count={country._count.states}
              countLabel="states"
              isSelected={selectedCountry?.id === country.id}
              onClick={() => handleSelectCountry(country)}
              onEdit={(e) => handleEditCountry(country, e)}
              onDelete={(e) => handleDeleteCountry(country, e)}
              canDelete={country._count.states === 0 && country._count.vehicles === 0}
            />
          ))}
        </LocationColumn>

        {/* States Column */}
        <LocationColumn
          title="States"
          onAdd={() => setIsStateFormOpen(true)}
          addDisabled={!selectedCountry}
          isLoading={isLoadingStates}
          isEmpty={!selectedCountry}
          emptyMessage={selectedCountry ? 'No states' : 'Select a country'}
        >
          {states.map((state) => (
            <LocationItem
              key={state.id}
              label={state.nameEn}
              sublabel={state.code}
              count={state._count.cities + state._count.ports}
              countLabel="items"
              isSelected={selectedState?.id === state.id}
              onClick={() => handleSelectState(state)}
              onEdit={(e) => handleEditState(state, e)}
              onDelete={(e) => handleDeleteState(state, e)}
              canDelete={
                state._count.cities === 0 &&
                state._count.ports === 0 &&
                state._count.vehicles === 0
              }
            />
          ))}
        </LocationColumn>

        {/* Cities Column */}
        <LocationColumn
          title="Cities"
          onAdd={() => setIsCityFormOpen(true)}
          addDisabled={!selectedState}
          isLoading={isLoadingCities}
          isEmpty={!selectedState}
          emptyMessage={selectedState ? 'No cities' : 'Select a state'}
        >
          {cities.map((city) => (
            <LocationItem
              key={city.id}
              label={city.name}
              count={city._count.vehicles}
              countLabel="vehicles"
              onClick={() => {}}
              onEdit={() => handleEditCity(city)}
              onDelete={() => handleDeleteCity(city)}
              canDelete={city._count.vehicles === 0}
            />
          ))}
        </LocationColumn>

        {/* Ports Column */}
        <LocationColumn
          title="Ports"
          onAdd={() => setIsPortFormOpen(true)}
          addDisabled={!selectedState}
          isLoading={isLoadingPorts}
          isEmpty={!selectedState}
          emptyMessage={selectedState ? 'No ports' : 'Select a state'}
        >
          {ports.map((port) => (
            <LocationItem
              key={port.id}
              label={port.name}
              sublabel={port.isDestination ? 'Destination' : undefined}
              count={port._count.vehicles}
              countLabel="vehicles"
              onClick={() => {}}
              onEdit={() => handleEditPort(port)}
              onDelete={() => handleDeletePort(port)}
              canDelete={port._count.vehicles === 0}
            />
          ))}
        </LocationColumn>
      </div>

      {/* Country Dialogs */}
      <CountryFormDialog
        open={isCountryFormOpen}
        onClose={() => {
          setIsCountryFormOpen(false)
          setEditingCountry(null)
        }}
        onSuccess={handleCountryFormSuccess}
        country={editingCountry}
      />
      <DeleteConfirmDialog
        open={!!deleteCountryTarget}
        onClose={() => setDeleteCountryTarget(null)}
        onConfirm={confirmDeleteCountry}
        title="Delete Country"
        description={`Are you sure you want to delete "${deleteCountryTarget?.nameEn}"?`}
        isPending={isPending}
      />

      {/* State Dialogs */}
      <StateFormDialog
        open={isStateFormOpen}
        onClose={() => {
          setIsStateFormOpen(false)
          setEditingState(null)
        }}
        onSuccess={handleStateFormSuccess}
        state={editingState}
        countryId={selectedCountry?.id || ''}
      />
      <DeleteConfirmDialog
        open={!!deleteStateTarget}
        onClose={() => setDeleteStateTarget(null)}
        onConfirm={confirmDeleteState}
        title="Delete State"
        description={`Are you sure you want to delete "${deleteStateTarget?.nameEn}"?`}
        isPending={isPending}
      />

      {/* City Dialogs */}
      <CityFormDialog
        open={isCityFormOpen}
        onClose={() => {
          setIsCityFormOpen(false)
          setEditingCity(null)
        }}
        onSuccess={handleCityFormSuccess}
        city={editingCity}
        stateId={selectedState?.id || ''}
      />
      <DeleteConfirmDialog
        open={!!deleteCityTarget}
        onClose={() => setDeleteCityTarget(null)}
        onConfirm={confirmDeleteCity}
        title="Delete City"
        description={`Are you sure you want to delete "${deleteCityTarget?.name}"?`}
        isPending={isPending}
      />

      {/* Port Dialogs */}
      <PortFormDialog
        open={isPortFormOpen}
        onClose={() => {
          setIsPortFormOpen(false)
          setEditingPort(null)
        }}
        onSuccess={handlePortFormSuccess}
        port={editingPort}
        stateId={selectedState?.id || ''}
      />
      <DeleteConfirmDialog
        open={!!deletePortTarget}
        onClose={() => setDeletePortTarget(null)}
        onConfirm={confirmDeletePort}
        title="Delete Port"
        description={`Are you sure you want to delete "${deletePortTarget?.name}"?`}
        isPending={isPending}
      />
    </div>
  )
}

// Column component
interface LocationColumnProps {
  title: string
  onAdd: () => void
  addDisabled?: boolean
  isLoading: boolean
  isEmpty: boolean
  emptyMessage: string
  children: React.ReactNode
}

function LocationColumn({
  title,
  onAdd,
  addDisabled,
  isLoading,
  isEmpty,
  emptyMessage,
  children,
}: LocationColumnProps) {
  return (
    <div className="flex flex-col rounded-md border">
      <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onAdd}
          disabled={addDisabled}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="h-64">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
        ) : isEmpty || (Array.isArray(children) && children.length === 0) ? (
          <div className="p-4 text-center text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          <div className="divide-y">{children}</div>
        )}
      </ScrollArea>
    </div>
  )
}

// Item component
interface LocationItemProps {
  label: string
  sublabel?: string
  count?: number
  countLabel?: string
  isSelected?: boolean
  onClick: () => void
  onEdit: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
  canDelete: boolean
}

function LocationItem({
  label,
  sublabel,
  count,
  countLabel,
  isSelected,
  onClick,
  onEdit,
  onDelete,
  canDelete,
}: LocationItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors',
        isSelected && 'bg-muted'
      )}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{label}</div>
        {(sublabel || count !== undefined) && (
          <div className="text-xs text-muted-foreground">
            {sublabel && <span>{sublabel}</span>}
            {sublabel && count !== undefined && <span> • </span>}
            {count !== undefined && (
              <span>
                {count} {countLabel}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(e)
          }}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(e)
          }}
          disabled={!canDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
