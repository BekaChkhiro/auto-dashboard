import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { renderToBuffer } from '@react-pdf/renderer'
import { auth } from '@/lib/auth'
import { getExportVehicles } from '@/lib/actions/export'
import { VehiclesExportPDF } from '@/components/admin/export/vehicles-export-pdf'

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
    const showArchived = searchParams.get('archived') === 'true'

    // Fetch data
    const vehicles = await getExportVehicles({ showArchived })

    if (format === 'pdf') {
      // Generate PDF
      const pdfBuffer = await renderToBuffer(
        VehiclesExportPDF({ vehicles })
      )

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="vehicles-export-${new Date().toISOString().split('T')[0]}.pdf"`,
        },
      })
    }

    // Generate Excel
    const worksheetData = vehicles.map((vehicle) => ({
      VIN: vehicle.vin,
      Year: vehicle.year,
      Make: vehicle.make,
      Model: vehicle.model,
      Color: vehicle.color || '',
      'Lot Number': vehicle.lotNumber,
      Auction: vehicle.auction,
      Status: vehicle.status,
      'Dealer Name': vehicle.dealerName,
      'Dealer Email': vehicle.dealerEmail,
      'Transportation Price': vehicle.transportationPrice,
      'Damage Type': vehicle.damageType,
      'Has Keys': vehicle.hasKeys ? 'Yes' : 'No',
      'Ship Name': vehicle.shipName || '',
      'Container Number': vehicle.containerNumber || '',
      ETA: vehicle.eta ? new Date(vehicle.eta).toLocaleDateString() : '',
      Country: vehicle.country,
      State: vehicle.state,
      City: vehicle.city || '',
      Port: vehicle.port || '',
      Archived: vehicle.isArchived ? 'Yes' : 'No',
      'Created At': new Date(vehicle.createdAt).toLocaleDateString(),
    }))

    const worksheet = XLSX.utils.json_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vehicles')

    // Set column widths
    worksheet['!cols'] = [
      { wch: 18 }, // VIN
      { wch: 6 },  // Year
      { wch: 12 }, // Make
      { wch: 15 }, // Model
      { wch: 10 }, // Color
      { wch: 12 }, // Lot Number
      { wch: 10 }, // Auction
      { wch: 15 }, // Status
      { wch: 20 }, // Dealer Name
      { wch: 25 }, // Dealer Email
      { wch: 12 }, // Transportation Price
      { wch: 12 }, // Damage Type
      { wch: 8 },  // Has Keys
      { wch: 15 }, // Ship Name
      { wch: 15 }, // Container Number
      { wch: 12 }, // ETA
      { wch: 12 }, // Country
      { wch: 15 }, // State
      { wch: 15 }, // City
      { wch: 15 }, // Port
      { wch: 8 },  // Archived
      { wch: 12 }, // Created At
    ]

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="vehicles-export-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error exporting vehicles:', error)
    return NextResponse.json(
      { error: 'Failed to export vehicles' },
      { status: 500 }
    )
  }
}
