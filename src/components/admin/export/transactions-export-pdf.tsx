import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ExportTransactionRow } from '@/lib/actions/export'

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
  summaryPositive: {
    color: '#059669',
  },
  summaryNegative: {
    color: '#dc2626',
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
  colDealer: { width: '20%' },
  colType: { width: '12%' },
  colAmount: { width: '12%', textAlign: 'right' },
  colBalance: { width: '12%', textAlign: 'right' },
  colDescription: { width: '30%' },
  colDate: { width: '14%' },
  typeDeposit: {
    color: '#059669',
    fontWeight: 'bold',
  },
  typeWithdrawal: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  typeInvoice: {
    color: '#7c3aed',
    fontWeight: 'bold',
  },
  typeAdjustment: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  amountPositive: {
    color: '#059669',
  },
  amountNegative: {
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

interface TransactionsExportPDFProps {
  transactions: ExportTransactionRow[]
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

function getTypeStyle(type: string) {
  switch (type) {
    case 'DEPOSIT':
      return styles.typeDeposit
    case 'WITHDRAWAL':
      return styles.typeWithdrawal
    case 'INVOICE_PAYMENT':
      return styles.typeInvoice
    case 'ADJUSTMENT':
      return styles.typeAdjustment
    default:
      return {}
  }
}

export function TransactionsExportPDF({ transactions }: TransactionsExportPDFProps) {
  // Calculate totals by type
  const deposits = transactions
    .filter((t) => t.type === 'DEPOSIT')
    .reduce((sum, t) => sum + t.amount, 0)
  const withdrawals = transactions
    .filter((t) => t.type === 'WITHDRAWAL' || t.type === 'INVOICE_PAYMENT')
    .reduce((sum, t) => sum + t.amount, 0)
  const adjustments = transactions
    .filter((t) => t.type === 'ADJUSTMENT')
    .reduce((sum, t) => sum + t.amount, 0)

  // Split transactions into pages (approximately 30 per page)
  const transactionsPerPage = 30
  const pages: ExportTransactionRow[][] = []
  for (let i = 0; i < transactions.length; i += transactionsPerPage) {
    pages.push(transactions.slice(i, i + transactionsPerPage))
  }

  return (
    <Document>
      {pages.map((pageTransactions, pageIndex) => (
        <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page}>
          {/* Header - only on first page */}
          {pageIndex === 0 && (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Transactions Report</Text>
                <Text style={styles.subtitle}>
                  Generated on {formatDate(new Date())} | Total: {transactions.length} transactions
                </Text>
              </View>

              <View style={styles.summary}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{transactions.length}</Text>
                  <Text style={styles.summaryLabel}>Total Transactions</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, styles.summaryPositive]}>
                    {formatCurrency(deposits)}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Deposits</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, styles.summaryNegative]}>
                    {formatCurrency(withdrawals)}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Withdrawals</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{formatCurrency(adjustments)}</Text>
                  <Text style={styles.summaryLabel}>Adjustments</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text
                    style={[
                      styles.summaryValue,
                      deposits - withdrawals >= 0 ? styles.summaryPositive : styles.summaryNegative,
                    ]}
                  >
                    {formatCurrency(deposits - withdrawals + adjustments)}
                  </Text>
                  <Text style={styles.summaryLabel}>Net Change</Text>
                </View>
              </View>
            </>
          )}

          {/* Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colDealer]}>Dealer</Text>
              <Text style={[styles.tableHeaderText, styles.colType]}>Type</Text>
              <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
              <Text style={[styles.tableHeaderText, styles.colBalance]}>Balance After</Text>
              <Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
              <Text style={[styles.tableHeaderText, styles.colDate]}>Date</Text>
            </View>

            {pageTransactions.map((transaction, index) => {
              const isPositive = transaction.type === 'DEPOSIT'
              return (
                <View
                  key={index}
                  style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
                >
                  <Text style={[styles.tableCell, styles.colDealer]}>
                    {transaction.dealerName}
                  </Text>
                  <Text style={[styles.tableCell, styles.colType, getTypeStyle(transaction.type)]}>
                    {transaction.type.replace('_', ' ')}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.colAmount,
                      isPositive ? styles.amountPositive : styles.amountNegative,
                    ]}
                  >
                    {isPositive ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </Text>
                  <Text style={[styles.tableCell, styles.colBalance]}>
                    {formatCurrency(transaction.balanceAfter)}
                  </Text>
                  <Text style={[styles.tableCell, styles.colDescription]}>
                    {transaction.description || '-'}
                  </Text>
                  <Text style={[styles.tableCell, styles.colDate]}>
                    {formatDate(transaction.createdAt)}
                  </Text>
                </View>
              )
            })}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Auto Dashboard - Transactions Export</Text>
            <Text style={styles.pageNumber}>
              Page {pageIndex + 1} of {pages.length}
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  )
}
