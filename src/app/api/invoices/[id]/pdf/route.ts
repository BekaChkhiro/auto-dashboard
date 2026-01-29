import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { InvoicePDFDocument } from '@/components/dealer/invoices/invoice-pdf-document'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the user
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const userId = session.user.id
    const userRole = session.user.role

    // Fetch invoice based on role
    const invoice = await db.invoice.findFirst({
      where: {
        id,
        // If dealer, only allow access to their own invoices
        ...(userRole === 'DEALER' ? { dealerId: userId } : {}),
      },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        status: true,
        paidAt: true,
        paidFromBalance: true,
        createdAt: true,
        dealer: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            balance: true,
          },
        },
        items: {
          select: {
            id: true,
            amount: true,
            description: true,
            vehicle: {
              select: {
                id: true,
                vin: true,
                year: true,
                make: { select: { name: true } },
                model: { select: { name: true } },
                lotNumber: true,
              },
            },
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Transform the invoice data to match the expected type
    const invoiceData = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: Number(invoice.totalAmount),
      status: invoice.status,
      paidAt: invoice.paidAt,
      paidFromBalance: invoice.paidFromBalance,
      createdAt: invoice.createdAt,
      currentBalance: Number(invoice.dealer.balance),
      items: invoice.items.map((item) => ({
        ...item,
        amount: Number(item.amount),
      })),
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      InvoicePDFDocument({
        invoice: invoiceData,
        dealerName: invoice.dealer.name,
        dealerEmail: invoice.dealer.email,
        dealerCompany: invoice.dealer.companyName,
      })
    )

    // Return PDF as download
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
