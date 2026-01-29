'use server'

import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// Status mapping for ports dashboard
// order 2 = "In Transit to Port" → "En Route"
// order 3 = "At US/CA Port" → "At Port"
// order 4 = "Loaded on Ship" → "Loaded"
// order 5 = "In Transit (Sea)" → "Shipped"
const STATUS_ORDER_MAP = {
  enRoute: 2,
  atPort: 3,
  loaded: 4,
  shipped: 5,
} as const

interface StatusTotals {
  enRoute: number
  atPort: number
  loaded: number
  shipped: number
  total: number
}

export interface PortStatistics {
  portId: string
  portName: string
  enRoute: number
  atPort: number
  loaded: number
  shipped: number
  total: number
}

export interface StateWithPorts {
  stateId: string
  stateName: string
  stateCode: string
  ports: PortStatistics[]
  totals: StatusTotals
}

export interface CountryWithStates {
  countryId: string
  countryName: string
  countryCode: string
  states: StateWithPorts[]
  totals: StatusTotals
}

export interface PortsDashboardData {
  countries: CountryWithStates[]
  grandTotals: StatusTotals
  statusColors: Record<string, string>
}

function createEmptyTotals(): StatusTotals {
  return { enRoute: 0, atPort: 0, loaded: 0, shipped: 0, total: 0 }
}

function addToTotals(target: StatusTotals, source: StatusTotals): void {
  target.enRoute += source.enRoute
  target.atPort += source.atPort
  target.loaded += source.loaded
  target.shipped += source.shipped
  target.total += source.total
}

export async function getPortsDashboardData(): Promise<PortsDashboardData> {
  await requireAdmin()

  // Fetch status colors for the relevant statuses
  const statuses = await db.status.findMany({
    where: {
      order: { in: [STATUS_ORDER_MAP.enRoute, STATUS_ORDER_MAP.atPort, STATUS_ORDER_MAP.loaded, STATUS_ORDER_MAP.shipped] }
    },
    select: { order: true, color: true }
  })

  const statusColors: Record<string, string> = {
    enRoute: statuses.find(s => s.order === STATUS_ORDER_MAP.enRoute)?.color || '#8B5CF6',
    atPort: statuses.find(s => s.order === STATUS_ORDER_MAP.atPort)?.color || '#A855F7',
    loaded: statuses.find(s => s.order === STATUS_ORDER_MAP.loaded)?.color || '#D946EF',
    shipped: statuses.find(s => s.order === STATUS_ORDER_MAP.shipped)?.color || '#EC4899',
  }

  // Fetch all origin ports with state/country hierarchy
  const ports = await db.port.findMany({
    where: { isDestination: false },
    include: {
      state: {
        include: {
          country: true
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  // Get status IDs for the relevant statuses
  const statusIds = await db.status.findMany({
    where: {
      order: { in: [STATUS_ORDER_MAP.enRoute, STATUS_ORDER_MAP.atPort, STATUS_ORDER_MAP.loaded, STATUS_ORDER_MAP.shipped] }
    },
    select: { id: true, order: true }
  })

  const statusOrderToId = new Map(statusIds.map(s => [s.order, s.id]))
  const statusIdToCategory = new Map<string, keyof typeof STATUS_ORDER_MAP>()

  for (const [category, order] of Object.entries(STATUS_ORDER_MAP)) {
    const id = statusOrderToId.get(order)
    if (id) {
      statusIdToCategory.set(id, category as keyof typeof STATUS_ORDER_MAP)
    }
  }

  // Get vehicle counts grouped by portId and statusId
  const vehicleCounts = await db.vehicle.groupBy({
    by: ['portId', 'statusId'],
    where: {
      isArchived: false,
      portId: { not: null },
      statusId: { in: Array.from(statusIdToCategory.keys()) }
    },
    _count: true
  })

  // Create a map of port -> status -> count
  const portStatusCounts = new Map<string, Map<string, number>>()
  for (const vc of vehicleCounts) {
    if (!vc.portId) continue
    if (!portStatusCounts.has(vc.portId)) {
      portStatusCounts.set(vc.portId, new Map())
    }
    const category = statusIdToCategory.get(vc.statusId)
    if (category) {
      portStatusCounts.get(vc.portId)!.set(category, vc._count)
    }
  }

  // Build hierarchical structure
  const countryMap = new Map<string, CountryWithStates>()
  const grandTotals = createEmptyTotals()

  for (const port of ports) {
    const { state } = port
    const { country } = state

    // Get or create country
    if (!countryMap.has(country.id)) {
      countryMap.set(country.id, {
        countryId: country.id,
        countryName: country.nameEn,
        countryCode: country.code,
        states: [],
        totals: createEmptyTotals()
      })
    }
    const countryData = countryMap.get(country.id)!

    // Find or create state within country
    let stateData = countryData.states.find(s => s.stateId === state.id)
    if (!stateData) {
      stateData = {
        stateId: state.id,
        stateName: state.nameEn,
        stateCode: state.code,
        ports: [],
        totals: createEmptyTotals()
      }
      countryData.states.push(stateData)
    }

    // Get port statistics
    const portCounts = portStatusCounts.get(port.id) || new Map()
    const portStats: PortStatistics = {
      portId: port.id,
      portName: port.name,
      enRoute: portCounts.get('enRoute') || 0,
      atPort: portCounts.get('atPort') || 0,
      loaded: portCounts.get('loaded') || 0,
      shipped: portCounts.get('shipped') || 0,
      total: 0
    }
    portStats.total = portStats.enRoute + portStats.atPort + portStats.loaded + portStats.shipped

    stateData.ports.push(portStats)

    // Aggregate totals
    addToTotals(stateData.totals, portStats)
    addToTotals(countryData.totals, portStats)
    addToTotals(grandTotals, portStats)
  }

  // Sort states by name within each country
  for (const country of countryMap.values()) {
    country.states.sort((a, b) => a.stateName.localeCompare(b.stateName))
  }

  // Convert map to array and sort by country name
  const countries = Array.from(countryMap.values()).sort((a, b) =>
    a.countryName.localeCompare(b.countryName)
  )

  return {
    countries,
    grandTotals,
    statusColors
  }
}
