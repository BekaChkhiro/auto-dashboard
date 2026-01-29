import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ExportVehicleRow } from '@/lib/actions/export'

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#3b82f6',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#6b7280',
  },
  summary: {
    flexDirection: 'row',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    padding: 6,
  },
  tableHeaderText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
    padding: 5,
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    fontSize: 7,
    color: '#374151',
  },
  colVin: { width: '14%' },
  colYear: { width: '5%' },
  colMake: { width: '8%' },
  colModel: { width: '10%' },
  colLot: { width: '8%' },
  colStatus: { width: '10%' },
  colDealer: { width: '12%' },
  colPrice: { width: '8%', textAlign: 'right' },
  colLocation: { width: '15%' },
  colDate: { width: '8%' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTop: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  pageNumber: {
    fontSize: 8,
    color: '#9ca3af',
  },
})

interface VehiclesExportPDFProps {
  vehicles: ExportVehicleRow[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function VehiclesExportPDF({ vehicles }: VehiclesExportPDFProps) {
  const totalValue = vehicles.reduce((sum, v) => sum + v.transportationPrice, 0)

  // Count by status
  const statusCounts: Record<string, number> = {}
  vehicles.forEach((v) => {
    statusCounts[v.status] = (statusCounts[v.status] || 0) + 1
  })

  // Split vehicles into pages (approximately 30 per page)
  const vehiclesPerPage = 30
  const pages: ExportVehicleRow[][] = []
  for (let i = 0; i < vehicles.length; i += vehiclesPerPage) {
    pages.push(vehicles.slice(i, i + vehiclesPerPage))
  }

  return (
    <Document>
      {pages.map((pageVehicles, pageIndex) => (
        <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page}>
          {/* Header - only on first page */}
          {pageIndex === 0 && (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Vehicles Report</Text>
                <Text style={styles.subtitle}>
                  Generated on {formatDate(new Date())} | Total: {vehicles.length} vehicles
                </Text>
              </View>

              <View style={styles.summary}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{vehicles.length}</Text>
                  <Text style={styles.summaryLabel}>Total Vehicles</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{formatCurrency(totalValue)}</Text>
                  <Text style={styles.summaryLabel}>Total Value</Text>
                </View>
                {Object.entries(statusCounts).slice(0, 4).map(([status, count]) => (
                  <View key={status} style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{count}</Text>
                    <Text style={styles.summaryLabel}>{status}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colVin]}>VIN</Text>
              <Text style={[styles.tableHeaderText, styles.colYear]}>Year</Text>
              <Text style={[styles.tableHeaderText, styles.colMake]}>Make</Text>
              <Text style={[styles.tableHeaderText, styles.colModel]}>Model</Text>
              <Text style={[styles.tableHeaderText, styles.colLot]}>Lot #</Text>
              <Text style={[styles.tableHeaderText, styles.colStatus]}>Status</Text>
              <Text style={[styles.tableHeaderText, styles.colDealer]}>Dealer</Text>
              <Text style={[styles.tableHeaderText, styles.colPrice]}>Price</Text>
              <Text style={[styles.tableHeaderText, styles.colLocation]}>Location</Text>
              <Text style={[styles.tableHeaderText, styles.colDate]}>Created</Text>
            </View>

            {pageVehicles.map((vehicle, index) => (
              <View
                key={index}
                style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <Text style={[styles.tableCell, styles.colVin]}>{vehicle.vin}</Text>
                <Text style={[styles.tableCell, styles.colYear]}>{vehicle.year}</Text>
                <Text style={[styles.tableCell, styles.colMake]}>{vehicle.make}</Text>
                <Text style={[styles.tableCell, styles.colModel]}>{vehicle.model}</Text>
                <Text style={[styles.tableCell, styles.colLot]}>{vehicle.lotNumber}</Text>
                <Text style={[styles.tableCell, styles.colStatus]}>{vehicle.status}</Text>
                <Text style={[styles.tableCell, styles.colDealer]}>{vehicle.dealerName}</Text>
                <Text style={[styles.tableCell, styles.colPrice]}>
                  {formatCurrency(vehicle.transportationPrice)}
                </Text>
                <Text style={[styles.tableCell, styles.colLocation]}>
                  {vehicle.state}, {vehicle.country}
                </Text>
                <Text style={[styles.tableCell, styles.colDate]}>
                  {formatDate(vehicle.createdAt)}
                </Text>
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Auto Dashboard - Vehicles Export</Text>
            <Text style={styles.pageNumber}>
              Page {pageIndex + 1} of {pages.length}
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  )
}
