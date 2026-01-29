import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { renderToBuffer } from '@react-pdf/renderer'
import { auth } from '@/lib/auth'
import { getExportDealers } from '@/lib/actions/export'
import { DealersExportPDF } from '@/components/admin/export/dealers-export-pdf'

export async function GET(request: NextRequest) {
  try {
    // Authenticate - admin only
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get format from query params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'excel'

    // Fetch data
    const dealers = await getExportDealers()

    if (format === 'pdf') {
      // Generate PDF
      const pdfBuffer = await renderToBuffer(
        DealersExportPDF({ dealers })
      )

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="dealers-export-${new Date().toISOString().split('T')[0]}.pdf"`,
        },
      })
    }

    // Generate Excel
    const worksheetData = dealers.map((dealer) => ({
      Name: dealer.name,
      Email: dealer.email,
      Phone: dealer.phone,
      'Company Name': dealer.companyName || '',
      'ID Number': dealer.identificationNumber || '',
      Status: dealer.status,
      Balance: dealer.balance,
      'Vehicle Count': dealer.vehicleCount,
      'Created At': new Date(dealer.createdAt).toLocaleDateString(),
    }))

    const worksheet = XLSX.utils.json_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dealers')

    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Name
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 25 }, // Company Name
      { wch: 15 }, // ID Number
      { wch: 10 }, // Status
      { wch: 12 }, // Balance
      { wch: 12 }, // Vehicle Count
      { wch: 12 }, // Created At
    ]

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="dealers-export-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error exporting dealers:', error)
    return NextResponse.json(
      { error: 'Failed to export dealers' },
      { status: 500 }
    )
  }
}
