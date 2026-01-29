import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { renderToBuffer } from '@react-pdf/renderer'
import { auth } from '@/lib/auth'
import { getExportTransactions } from '@/lib/actions/export'
import { TransactionsExportPDF } from '@/components/admin/export/transactions-export-pdf'

export async function GET(request: NextRequest) {
  try {
    // Authenticate - admin only
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get params from query
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'excel'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Fetch data
    const transactions = await getExportTransactions({
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    })

    if (format === 'pdf') {
      // Generate PDF
      const pdfBuffer = await renderToBuffer(
        TransactionsExportPDF({ transactions })
      )

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="transactions-export-${new Date().toISOString().split('T')[0]}.pdf"`,
        },
      })
    }

    // Generate Excel
    const worksheetData = transactions.map((transaction) => ({
      'Dealer Name': transaction.dealerName,
      'Dealer Email': transaction.dealerEmail,
      Type: transaction.type,
      Amount: transaction.amount,
      'Balance After': transaction.balanceAfter,
      Description: transaction.description || '',
      'Reference Type': transaction.referenceType || '',
      'Created At': new Date(transaction.createdAt).toLocaleDateString(),
    }))

    const worksheet = XLSX.utils.json_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions')

    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Dealer Name
      { wch: 30 }, // Dealer Email
      { wch: 15 }, // Type
      { wch: 12 }, // Amount
      { wch: 12 }, // Balance After
      { wch: 40 }, // Description
      { wch: 15 }, // Reference Type
      { wch: 12 }, // Created At
    ]

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="transactions-export-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error exporting transactions:', error)
    return NextResponse.json(
      { error: 'Failed to export transactions' },
      { status: 500 }
    )
  }
}
