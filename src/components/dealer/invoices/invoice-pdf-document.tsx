import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { DealerInvoiceDetail } from '@/lib/actions/dealer-invoices'

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
  },
  invoiceNumber: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    marginTop: 10,
    padding: '4 12',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusPaid: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusCancelled: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    color: '#6b7280',
  },
  value: {
    fontSize: 10,
    color: '#111827',
    fontWeight: 'bold',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
    padding: 8,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#f3f4f6',
    padding: 8,
  },
  tableCell: {
    fontSize: 10,
    color: '#374151',
  },
  col1: {
    width: '40%',
  },
  col2: {
    width: '30%',
  },
  col3: {
    width: '15%',
  },
  col4: {
    width: '15%',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: 10,
    marginTop: 10,
    borderTop: 2,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    width: '85%',
    textAlign: 'right',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    paddingRight: 10,
  },
  totalValue: {
    width: '15%',
    textAlign: 'right',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTop: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
  },
  paymentInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0fdf4',
    borderRadius: 4,
  },
  paymentText: {
    fontSize: 10,
    color: '#065f46',
  },
})

interface InvoicePDFDocumentProps {
  invoice: DealerInvoiceDetail
  dealerName: string
  dealerEmail: string
  dealerCompany?: string | null
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
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function InvoicePDFDocument({
  invoice,
  dealerName,
  dealerEmail,
  dealerCompany,
}: InvoicePDFDocumentProps) {
  const getStatusStyle = () => {
    switch (invoice.status) {
      case 'PAID':
        return styles.statusPaid
      case 'CANCELLED':
        return styles.statusCancelled
      default:
        return styles.statusPending
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          <View style={[styles.statusBadge, getStatusStyle()]}>
            <Text>{invoice.status}</Text>
          </View>
        </View>

        {/* Invoice Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Invoice Date:</Text>
            <Text style={styles.value}>{formatDate(invoice.createdAt)}</Text>
          </View>
          {invoice.paidAt && (
            <View style={styles.row}>
              <Text style={styles.label}>Paid Date:</Text>
              <Text style={styles.value}>{formatDate(invoice.paidAt)}</Text>
            </View>
          )}
          {invoice.paidAt && (
            <View style={styles.row}>
              <Text style={styles.label}>Payment Method:</Text>
              <Text style={styles.value}>{invoice.paidFromBalance ? 'Balance' : 'External'}</Text>
            </View>
          )}
        </View>

        {/* Bill To */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{dealerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{dealerEmail}</Text>
          </View>
          {dealerCompany && (
            <View style={styles.row}>
              <Text style={styles.label}>Company:</Text>
              <Text style={styles.value}>{dealerCompany}</Text>
            </View>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.col1]}>Vehicle</Text>
              <Text style={[styles.tableHeaderText, styles.col2]}>VIN</Text>
              <Text style={[styles.tableHeaderText, styles.col3]}>Lot #</Text>
              <Text style={[styles.tableHeaderText, styles.col4]}>Amount</Text>
            </View>

            {/* Table Rows */}
            {invoice.items.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.col1]}>
                  {item.vehicle.year} {item.vehicle.make.name} {item.vehicle.model.name}
                </Text>
                <Text style={[styles.tableCell, styles.col2]}>{item.vehicle.vin}</Text>
                <Text style={[styles.tableCell, styles.col3]}>{item.vehicle.lotNumber || '-'}</Text>
                <Text style={[styles.tableCell, styles.col4]}>{formatCurrency(item.amount)}</Text>
              </View>
            ))}

            {/* Total Row */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Info (if paid) */}
        {invoice.status === 'PAID' && invoice.paidAt && (
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentText}>
              This invoice was paid on {formatDate(invoice.paidAt)}
              {invoice.paidFromBalance ? ' from account balance' : ' via external payment'}.
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {formatDate(new Date())} | Auto Dashboard Invoice System
          </Text>
        </View>
      </Page>
    </Document>
  )
}
