import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAuth, createUnauthorizedResponse } from '@/lib/auth'
import ExcelJS from 'exceljs'

// GET /api/reports/export - Export reports to Excel
export async function GET(request: NextRequest) {
  if (!checkAuth()) {
    return createUnauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('reportType') || 'all'
    const dateRange = searchParams.get('dateRange') || 'monthly'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const includeReturned = searchParams.get('includeReturned') === 'true'
    const includePending = searchParams.get('includePending') === 'true'

    // Determine date filter
    let dateFilter: any = {}
    if (dateRange === 'custom' && startDate && endDate) {
      dateFilter = {
        orderDate: {
          gte: new Date(startDate),
          lte: new Date(endDate + 'T23:59:59')
        }
      }
    } else if (dateRange === 'daily') {
      const today = new Date()
      dateFilter = {
        orderDate: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lte: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
        }
      }
    } else if (dateRange === 'monthly') {
      const today = new Date()
      dateFilter = {
        orderDate: {
          gte: new Date(today.getFullYear(), today.getMonth(), 1),
          lte: new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)
        }
      }
    }

    // Status filter
    let statusFilter: any = {}
    if (!includeReturned && !includePending) {
      // If neither is included, return empty data
      return NextResponse.json({ error: 'No status selected' }, { status: 400 })
    } else if (includeReturned && !includePending) {
      statusFilter.status = 1
    } else if (!includeReturned && includePending) {
      statusFilter.status = 0
    }
    // If both are true, no status filter needed

    let data: any = {}

    // Fetch data based on report type
    if (reportType === 'all' || reportType === 'orders') {
      const orders = await prisma.order.findMany({
        where: {
          ...dateFilter,
          ...statusFilter
        },
        include: {
          customer: true,
          orderDetails: {
            include: {
              book: {
                include: {
                  author: true
                }
              }
            }
          },
          payments: true
        },
        orderBy: { orderDate: 'desc' }
      })
      data.orders = orders
    }

    if (reportType === 'all' || reportType === 'customers') {
      const customers = await prisma.customer.findMany({
        include: {
          orders: {
            where: dateFilter,
            include: {
              orderDetails: true,
              payments: true
            }
          }
        },
        orderBy: { name: 'asc' }
      })
      data.customers = customers
    }

    if (reportType === 'all' || reportType === 'books') {
      const books = await prisma.book.findMany({
        include: {
          author: true,
          orderDetails: {
            where: {
              order: dateFilter
            }
          }
        },
        orderBy: { name: 'asc' }
      })
      data.books = books
    }

    if (reportType === 'all' || reportType === 'payments') {
      let paymentDateFilter = {}
      if (dateRange === 'custom' && startDate && endDate) {
        paymentDateFilter = {
          returnDate: {
            gte: new Date(startDate),
            lte: new Date(endDate + 'T23:59:59')
          }
        }
      } else if (dateRange === 'daily') {
        const today = new Date()
        paymentDateFilter = {
          returnDate: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            lte: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
          }
        }
      } else if (dateRange === 'monthly') {
        const today = new Date()
        paymentDateFilter = {
          returnDate: {
            gte: new Date(today.getFullYear(), today.getMonth(), 1),
            lte: new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)
          }
        }
      }

      const payments = await prisma.payment.findMany({
        where: paymentDateFilter,
        include: {
          order: {
            include: {
              customer: true
            }
          }
        },
        orderBy: { returnDate: 'desc' }
      })
      data.payments = payments
    }

    // Generate Excel file
    const workbook = new ExcelJS.Workbook()
    await createExcelWorkbook(workbook, data, reportType)

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Return Excel file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="bookshop-report-${reportType}-${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    })

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function createExcelWorkbook(workbook: ExcelJS.Workbook, data: any, reportType: string) {
  // Set workbook properties
  workbook.creator = 'Bookshop Manager'
  workbook.lastModifiedBy = 'Bookshop Manager'
  workbook.created = new Date()
  workbook.modified = new Date()

  if (data.orders) {
    const worksheet = workbook.addWorksheet('Orders')
    
    // Define columns
    worksheet.columns = [
      { header: 'Order ID', key: 'orderId', width: 10 },
      { header: 'Customer Name', key: 'customerName', width: 20 },
      { header: 'Order Date', key: 'orderDate', width: 15 },
      { header: 'Return Date', key: 'returnDate', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Books Count', key: 'booksCount', width: 12 },
      { header: 'Total Payment', key: 'totalPayment', width: 15 }
    ]

    // Style header
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // Add data
    data.orders.forEach((order: any) => {
      worksheet.addRow({
        orderId: order.id,
        customerName: order.customerName,
        orderDate: order.orderDate,
        returnDate: order.returnDate,
        status: order.status === 0 ? 'Pending' : 'Completed',
        booksCount: order.orderDetails.length,
        totalPayment: order.payments.reduce((sum: number, p: any) => sum + p.amount, 0)
      })
    })
  }

  if (data.customers) {
    const worksheet = workbook.addWorksheet('Customers')
    
    worksheet.columns = [
      { header: 'Customer ID', key: 'customerId', width: 12 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Contact', key: 'contact', width: 15 },
      { header: 'Registration No', key: 'registrationNo', width: 18 },
      { header: 'Registration Date', key: 'registrationDate', width: 18 },
      { header: 'Total Orders', key: 'totalOrders', width: 15 },
      { header: 'Total Payments', key: 'totalPayments', width: 15 }
    ]

    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    data.customers.forEach((customer: any) => {
      worksheet.addRow({
        customerId: customer.id,
        name: customer.name,
        contact: customer.contact,
        registrationNo: customer.registrationNo,
        registrationDate: customer.date,
        totalOrders: customer.orders.length,
        totalPayments: customer.orders.reduce((sum: number, order: any) => 
          sum + order.payments.reduce((pSum: number, p: any) => pSum + p.amount, 0), 0)
      })
    })
  }

  if (data.books) {
    const worksheet = workbook.addWorksheet('Books')
    
    worksheet.columns = [
      { header: 'Book ID', key: 'bookId', width: 10 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Author', key: 'author', width: 20 },
      { header: 'Price', key: 'price', width: 10 },
      { header: 'Times Borrowed', key: 'timesBorrowed', width: 15 },
      { header: 'Currently Available', key: 'available', width: 18 }
    ]

    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    data.books.forEach((book: any) => {
      worksheet.addRow({
        bookId: book.id,
        title: book.name,
        author: book.author.name,
        price: book.price,
        timesBorrowed: book.orderDetails.length,
        available: book.orderDetails.filter((od: any) => od.status === 0).length === 0 ? 'Yes' : 'No'
      })
    })
  }

  if (data.payments) {
    const worksheet = workbook.addWorksheet('Payments')
    
    worksheet.columns = [
      { header: 'Payment Date', key: 'paymentDate', width: 15 },
      { header: 'Order ID', key: 'orderId', width: 10 },
      { header: 'Customer Name', key: 'customerName', width: 20 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Order Date', key: 'orderDate', width: 15 }
    ]

    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    data.payments.forEach((payment: any) => {
      worksheet.addRow({
        paymentDate: payment.returnDate,
        orderId: payment.orderId,
        customerName: payment.customerName,
        amount: payment.amount,
        orderDate: payment.orderDate
      })
    })
  }

  // Add summary sheet if it's a complete report
  if (reportType === 'all') {
    const summarySheet = workbook.addWorksheet('Summary')
    
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 15 }
    ]

    summarySheet.getRow(1).font = { bold: true }
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    const totalOrders = data.orders?.length || 0
    const totalCustomers = data.customers?.length || 0
    const totalBooks = data.books?.length || 0
    const totalRevenue = data.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0

    summarySheet.addRow({ metric: 'Total Orders', value: totalOrders })
    summarySheet.addRow({ metric: 'Total Customers', value: totalCustomers })
    summarySheet.addRow({ metric: 'Total Books', value: totalBooks })
    summarySheet.addRow({ metric: 'Total Revenue', value: totalRevenue })
    summarySheet.addRow({ metric: 'Report Generated', value: new Date().toISOString().split('T')[0] })
  }
}
