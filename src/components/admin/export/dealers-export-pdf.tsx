import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ExportDealerRow } from '@/lib/actions/export'

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
    padding: 8,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
    padding: 6,
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    fontSize: 8,
    color: '#374151',
  },
  colName: { width: '18%' },
  colEmail: { width: '22%' },
  colPhone: { width: '12%' },
  colCompany: { width: '15%' },
  colStatus: { width: '8%' },
  colBalance: { width: '10%', textAlign: 'right' },
  colVehicles: { width: '8%', textAlign: 'center' },
  colDate: { width: '10%' },
  statusActive: {
    color: '#059669',
    fontWeight: 'bold',
  },
  statusBlocked: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  balancePositive: {
    color: '#059669',
  },
  balanceNegative: {
    color: '#dc2626',
  },
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

interface DealersExportPDFProps {
  dealers: ExportDealerRow[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function DealersExportPDF({ dealers }: DealersExportPDFProps) {
  const totalBalance = dealers.reduce((sum, d) => sum + d.balance, 0)
  const activeCount = dealers.filter((d) => d.status === 'ACTIVE').length
  const totalVehicles = dealers.reduce((sum, d) => sum + d.vehicleCount, 0)

  // Split dealers into pages (approximately 25 per page)
  const dealersPerPage = 25
  const pages: ExportDealerRow[][] = []
  for (let i = 0; i < dealers.length; i += dealersPerPage) {
    pages.push(dealers.slice(i, i + dealersPerPage))
  }

  return (
    <Document>
      {pages.map((pageDealers, pageIndex) => (
        <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page}>
          {/* Header - only on first page */}
          {pageIndex === 0 && (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Dealers Report</Text>
                <Text style={styles.subtitle}>
                  Generated on {formatDate(new Date())} | Total: {dealers.length} dealers
                </Text>
              </View>

              <View style={styles.summary}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{dealers.length}</Text>
                  <Text style={styles.summaryLabel}>Total Dealers</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{activeCount}</Text>
                  <Text style={styles.summaryLabel}>Active</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{dealers.length - activeCount}</Text>
                  <Text style={styles.summaryLabel}>Blocked</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{formatCurrency(totalBalance)}</Text>
                  <Text style={styles.summaryLabel}>Total Balance</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{totalVehicles}</Text>
                  <Text style={styles.summaryLabel}>Total Vehicles</Text>
                </View>
              </View>
            </>
          )}

          {/* Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colName]}>Name</Text>
              <Text style={[styles.tableHeaderText, styles.colEmail]}>Email</Text>
              <Text style={[styles.tableHeaderText, styles.colPhone]}>Phone</Text>
              <Text style={[styles.tableHeaderText, styles.colCompany]}>Company</Text>
              <Text style={[styles.tableHeaderText, styles.colStatus]}>Status</Text>
              <Text style={[styles.tableHeaderText, styles.colBalance]}>Balance</Text>
              <Text style={[styles.tableHeaderText, styles.colVehicles]}>Vehicles</Text>
              <Text style={[styles.tableHeaderText, styles.colDate]}>Created</Text>
            </View>

            {pageDealers.map((dealer, index) => (
              <View
                key={index}
                style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <Text style={[styles.tableCell, styles.colName]}>{dealer.name}</Text>
                <Text style={[styles.tableCell, styles.colEmail]}>{dealer.email}</Text>
                <Text style={[styles.tableCell, styles.colPhone]}>{dealer.phone}</Text>
                <Text style={[styles.tableCell, styles.colCompany]}>
                  {dealer.companyName || '-'}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.colStatus,
                    dealer.status === 'ACTIVE' ? styles.statusActive : styles.statusBlocked,
                  ]}
                >
                  {dealer.status}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.colBalance,
                    dealer.balance >= 0 ? styles.balancePositive : styles.balanceNegative,
                  ]}
                >
                  {formatCurrency(dealer.balance)}
                </Text>
                <Text style={[styles.tableCell, styles.colVehicles]}>
                  {dealer.vehicleCount}
                </Text>
                <Text style={[styles.tableCell, styles.colDate]}>
                  {formatDate(dealer.createdAt)}
                </Text>
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Auto Dashboard - Dealers Export</Text>
            <Text style={styles.pageNumber}>
              Page {pageIndex + 1} of {pages.length}
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  )
}
