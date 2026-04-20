import { useState, useRef } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getMonthlyReport } from '../../api/endpoints'
import { Spinner, PageHeader } from '../../components/UI'
import { useReactToPrint } from 'react-to-print'

export default function MonthlyReport() {
  const [month,   setMonth]   = useState(() => new Date().toISOString().slice(0, 7))
  const [report,  setReport]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const printRef = useRef()

  const handleFetch = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { data } = await getMonthlyReport(month)
      setReport(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load report.')
    } finally { setLoading(false) }
  }

  const handlePrint = useReactToPrint({ contentRef: printRef })

  const fmt = (v) =>
    `Rs. ${parseFloat(v || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const incomeRows = report ? [
    ['Meal Order Income',  fmt(report.meal_income)],
    ['POS Sales Income',   fmt(report.pos_income)],
    ['Event Income',       fmt(report.event_income)],
    ['Manual Income',      fmt(report.manual_income)],
  ] : []

  const expenseRows = report ? [
    ['Manual Expenses', fmt(report.manual_outcome)],
  ] : []
  const totalIncome  = report ? ['Meal Order Income','POS Sales Income','Event Income','Manual Income']
    .reduce((s, _, i) => s + parseFloat([report.meal_income, report.pos_income, report.event_income, report.manual_income][i] || 0), 0) : 0
  const totalExpense = report ? parseFloat(report.manual_outcome || 0) : 0
  const netProfit    = report ? parseFloat(report.net_profit) : 0

  // ── PDF Download ────────────────────────────────────────────────────────────
  const downloadPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const generatedOn = new Date().toLocaleDateString('en-LK', { day: '2-digit', month: 'long', year: 'numeric' })

    // Header
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text('Shantha Enterprice — Management System', pageW / 2, 18, { align: 'center' })

    doc.setFontSize(18)
    doc.setTextColor(30, 30, 30)
    doc.setFont('helvetica', 'bold')
    doc.text('Monthly Financial Report', pageW / 2, 28, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(`Period: ${report.month}`, pageW / 2, 35, { align: 'center' })
    doc.text(`Generated: ${generatedOn}`, pageW / 2, 41, { align: 'center' })

    doc.setDrawColor(200, 200, 200)
    doc.line(14, 45, pageW - 14, 45)

    // Income table
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('Income', 14, 53)

    autoTable(doc, {
      startY: 56,
      head: [['Category', 'Amount']],
      body: [
        ...incomeRows,
        ['Total Income', fmt(totalIncome)],
      ],
      headStyles: { fillColor: [245, 245, 250], textColor: [60, 60, 60], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
      columnStyles: { 1: { halign: 'right' } },
      didParseCell: (data) => {
        if (data.row.index === incomeRows.length) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [240, 240, 248]
        }
      },
      margin: { left: 14, right: 14 },
      theme: 'grid',
    })

    // Expenses table
    const afterIncome = doc.lastAutoTable.finalY + 8
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('Expenses', 14, afterIncome)

    autoTable(doc, {
      startY: afterIncome + 3,
      head: [['Category', 'Amount']],
      body: [
        ...expenseRows,
        ['Total Expenses', fmt(totalExpense)],
      ],
      headStyles: { fillColor: [245, 245, 250], textColor: [60, 60, 60], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
      columnStyles: { 1: { halign: 'right' } },
      didParseCell: (data) => {
        if (data.row.index === expenseRows.length) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [240, 240, 248]
        }
      },
      margin: { left: 14, right: 14 },
      theme: 'grid',
    })

    // Net Profit
    const afterExpense = doc.lastAutoTable.finalY + 10
    doc.setDrawColor(200, 200, 200)
    doc.line(14, afterExpense - 2, pageW - 14, afterExpense - 2)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('Net Profit / Loss', 14, afterExpense + 6)

    doc.setFontSize(14)
    doc.setTextColor(netProfit >= 0 ? 22 : 180, netProfit >= 0 ? 163 : 30, netProfit >= 0 ? 74 : 30)
    doc.text(`${netProfit < 0 ? '−' : ''}${fmt(Math.abs(netProfit))}`, pageW - 14, afterExpense + 6, { align: 'right' })

    // Footer
    const pageH = doc.internal.pageSize.getHeight()
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    doc.setFont('helvetica', 'normal')
    doc.text('Shantha Enterprice Management System', pageW / 2, pageH - 8, { align: 'center' })

    doc.save(`ShanthaCafe_Report_${report.month}.pdf`)
  }

  // ── Word Download ───────────────────────────────────────────────────────────
  const downloadWord = () => {
    const generatedOn = new Date().toLocaleDateString('en-LK', { day: '2-digit', month: 'long', year: 'numeric' })

    const tableStyle = `border-collapse:collapse;width:100%;margin-bottom:24px;font-size:11pt;`
    const thStyle    = `border:1px solid #ccc;padding:8px 12px;background:#f0f0f8;font-weight:bold;text-align:left;`
    const tdStyle    = `border:1px solid #ccc;padding:7px 12px;`
    const tdR        = `border:1px solid #ccc;padding:7px 12px;text-align:right;`
    const subtotalTd = `border:1px solid #ccc;padding:7px 12px;background:#f0f0f8;font-weight:bold;`
    const subtotalTdR= `border:1px solid #ccc;padding:7px 12px;background:#f0f0f8;font-weight:bold;text-align:right;`

    const incomeTableRows = incomeRows.map(([l, v]) =>
      `<tr><td style="${tdStyle}">${l}</td><td style="${tdR}">${v}</td></tr>`).join('')
    const expenseTableRows = expenseRows.map(([l, v]) =>
      `<tr><td style="${tdStyle}">${l}</td><td style="${tdR}">${v}</td></tr>`).join('')
    const netColor = netProfit >= 0 ? '#16a34a' : '#dc2626'

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>Monthly Report</title></head>
      <body style="font-family:Calibri,Arial,sans-serif;margin:40px;color:#1e1e1e;">

        <p style="font-size:9pt;color:#888;margin:0;">Shantha Enterprice — Management System</p>
        <h1 style="font-size:20pt;margin:6px 0 2px;">Monthly Financial Report</h1>
        <p style="font-size:10pt;color:#666;margin:0;">Period: ${report.month}</p>
        <p style="font-size:10pt;color:#666;margin:0 0 20px;">Generated: ${generatedOn}</p>
        <hr style="border:none;border-top:1px solid #ddd;margin-bottom:24px;" />

        <h2 style="font-size:13pt;margin-bottom:8px;">Income</h2>
        <table style="${tableStyle}">
          <thead><tr><th style="${thStyle}">Category</th><th style="${thStyle}text-align:right;">Amount</th></tr></thead>
          <tbody>
            ${incomeTableRows}
            <tr><td style="${subtotalTd}">Total Income</td><td style="${subtotalTdR}">${fmt(totalIncome)}</td></tr>
          </tbody>
        </table>

        <h2 style="font-size:13pt;margin-bottom:8px;">Expenses</h2>
        <table style="${tableStyle}">
          <thead><tr><th style="${thStyle}">Category</th><th style="${thStyle}text-align:right;">Amount</th></tr></thead>
          <tbody>
            ${expenseTableRows}
            <tr><td style="${subtotalTd}">Total Expenses</td><td style="${subtotalTdR}">${fmt(totalExpense)}</td></tr>
          </tbody>
        </table>

        <hr style="border:none;border-top:1px solid #ddd;margin-bottom:16px;" />
        <table style="width:100%;font-size:13pt;">
          <tr>
            <td style="font-weight:bold;">Net Profit / Loss</td>
            <td style="text-align:right;font-weight:bold;color:${netColor};font-size:16pt;">
              ${netProfit < 0 ? '−' : ''}${fmt(Math.abs(netProfit))}
            </td>
          </tr>
        </table>

        <p style="font-size:8pt;color:#aaa;margin-top:48px;text-align:center;">
          Shantha Enterprice Management System
        </p>
      </body></html>`

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `ShanthaCafe_Report_${report.month}.doc`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title="Monthly Report" />

      {/* Controls */}
      <form onSubmit={handleFetch} className="ad-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="ad-field-label">Select Month</label>
            <input
              className="ad-input"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="ad-btn-primary flex items-center gap-2">
            {loading ? <Spinner size="sm" /> : null} Generate Report
          </button>
          {report && (
            <>
              <button type="button" onClick={downloadPDF} className="ad-btn-secondary">
                Download PDF
              </button>
              <button type="button" onClick={downloadWord} className="ad-btn-secondary">
                Download Word
              </button>
              <button type="button" onClick={handlePrint} className="ad-btn-secondary">
                Print
              </button>
            </>
          )}
        </div>
      </form>

      {error && <div className="ad-alert-error">{error}</div>}

      {!report && !loading && (
        <div className="text-center py-16 text-brown/30">
          <p className="font-inter text-sm">Select a month and click Generate Report</p>
        </div>
      )}

      {report && (
        <div ref={printRef}>

          {/* Report Header */}
          <div className="ad-card" style={{ padding: '28px 32px', marginBottom: '20px' }}>
            <div style={{ borderBottom: '2px solid var(--border-soft)', paddingBottom: '16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Shantha Enterprice — Management System
              </p>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Monthly Financial Report
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Period: {report.month}
              </p>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Generated: {new Date().toLocaleDateString('en-LK', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Summary KPIs */}
          <div className="ad-stats-grid no-print" style={{ marginBottom: '20px' }}>
            <div className="ad-stat-card" style={{ textAlign: 'center' }}>
              <p className="ad-stat-label">Total Income</p>
              <p className="ad-stat-value">{fmt(totalIncome)}</p>
            </div>
            <div className="ad-stat-card" style={{ textAlign: 'center' }}>
              <p className="ad-stat-label">Total Expenses</p>
              <p className="ad-stat-value">{fmt(totalExpense)}</p>
            </div>
            <div className="ad-stat-card" style={{ textAlign: 'center' }}>
              <p className="ad-stat-label">Net Profit</p>
              <p className="ad-stat-value" style={{ color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {fmt(netProfit)}
              </p>
            </div>
          </div>

          {/* Income Table */}
          <div className="ad-card" style={{ overflow: 'hidden', padding: 0, marginBottom: '20px' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-soft)' }}>
              <h3 className="ad-card-title" style={{ margin: 0 }}>Income</h3>
            </div>
            <table className="ad-table">
              <thead>
                <tr><th>Category</th><th style={{ textAlign: 'right' }}>Amount</th></tr>
              </thead>
              <tbody>
                {incomeRows.map(([label, value]) => (
                  <tr key={label}>
                    <td>{label}</td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{value}</td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--lavender-pale)', fontWeight: 700 }}>
                  <td>Total Income</td>
                  <td style={{ textAlign: 'right' }}>{fmt(totalIncome)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Expenses Table */}
          <div className="ad-card" style={{ overflow: 'hidden', padding: 0, marginBottom: '20px' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-soft)' }}>
              <h3 className="ad-card-title" style={{ margin: 0 }}>Expenses</h3>
            </div>
            <table className="ad-table">
              <thead>
                <tr><th>Category</th><th style={{ textAlign: 'right' }}>Amount</th></tr>
              </thead>
              <tbody>
                {expenseRows.map(([label, value]) => (
                  <tr key={label}>
                    <td>{label}</td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{value}</td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--lavender-pale)', fontWeight: 700 }}>
                  <td>Total Expenses</td>
                  <td style={{ textAlign: 'right' }}>{fmt(totalExpense)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Net Profit */}
          <div className="ad-card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  Net Profit / Loss
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Income − Total Expenses</p>
              </div>
              <p style={{ fontSize: '26px', fontWeight: 700, color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {netProfit < 0 ? '−' : ''}{fmt(Math.abs(netProfit))}
              </p>
            </div>
          </div>

          {/* Print footer */}
          <div className="hidden print:block text-center mt-8 text-xs text-gray-400">
            Generated on {new Date().toLocaleString()} · Shantha Enterprice Management System
          </div>

        </div>
      )}
    </div>
  )
}
