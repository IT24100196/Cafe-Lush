import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT


DARK_BROWN = colors.HexColor('#2C1A0E')
GOLD       = colors.HexColor('#C9A84C')
LIGHT_BG   = colors.HexColor('#fdf8f0')
MUTED      = colors.HexColor('#9B8B7A')
WHITE      = colors.white


def generate_bill_pdf(bill):
    """
    Generate a PDF bill for the given Bill instance.
    Returns a BytesIO buffer containing the PDF.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('title', fontSize=22, textColor=GOLD,
                                 alignment=TA_CENTER, fontName='Helvetica-Bold', spaceAfter=2)
    sub_style   = ParagraphStyle('sub',   fontSize=10, textColor=MUTED,
                                 alignment=TA_CENTER, fontName='Helvetica', spaceAfter=6)
    label_style = ParagraphStyle('label', fontSize=9,  textColor=MUTED,
                                 fontName='Helvetica', spaceAfter=2)
    value_style = ParagraphStyle('value', fontSize=10, textColor=DARK_BROWN,
                                 fontName='Helvetica-Bold')
    total_style = ParagraphStyle('total', fontSize=16, textColor=GOLD,
                                 fontName='Helvetica-Bold', alignment=TA_RIGHT)
    footer_style = ParagraphStyle('footer', fontSize=9, textColor=MUTED,
                                  alignment=TA_CENTER, fontName='Helvetica')

    story = []

    # ── Header ──────────────────────────────────────────────────────────────
    story.append(Paragraph('Cafe Lush', title_style))
    story.append(Paragraph('Official Bill Receipt', sub_style))
    story.append(HRFlowable(width='100%', thickness=1.5, color=GOLD, spaceAfter=10))

    # ── Bill meta ────────────────────────────────────────────────────────────
    generated = bill.generated_at.strftime('%b %d, %Y  %I:%M %p')
    meta_data = [
        [Paragraph('Bill No:', label_style), Paragraph(bill.bill_number, value_style),
         Paragraph('Date:', label_style),    Paragraph(generated, value_style)],
    ]
    if bill.customer_name:
        meta_data.append([
            Paragraph('Customer:', label_style), Paragraph(bill.customer_name, value_style), '', '',
        ])
    if bill.sent_to_email:
        meta_data.append([
            Paragraph('Email:', label_style), Paragraph(bill.sent_to_email, value_style), '', '',
        ])

    meta_table = Table(meta_data, colWidths=[30 * mm, 70 * mm, 30 * mm, 60 * mm])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [LIGHT_BG]),
        ('TOPPADDING',    (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING',   (0, 0), (-1, -1), 8),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 8),
        ('ROUNDEDCORNERS', [4]),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # ── Items table ──────────────────────────────────────────────────────────
    header_row = ['Item', 'Qty', 'Unit Price', 'Amount']
    rows = [header_row]
    for line in bill.items:
        rows.append([
            str(line.get('name', '')),
            str(line.get('qty', '')),
            f"Rs.{float(line.get('unit_price', 0)):.2f}",
            f"Rs.{float(line.get('line_total', 0)):.2f}",
        ])

    col_widths = [90 * mm, 20 * mm, 40 * mm, 40 * mm]
    items_table = Table(rows, colWidths=col_widths, repeatRows=1)
    items_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND',    (0, 0), (-1, 0), DARK_BROWN),
        ('TEXTCOLOR',     (0, 0), (-1, 0), GOLD),
        ('FONTNAME',      (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE',      (0, 0), (-1, 0), 9),
        ('ALIGN',         (0, 0), (-1, 0), 'CENTER'),
        ('TOPPADDING',    (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        # Data rows
        ('FONTNAME',      (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE',      (0, 1), (-1, -1), 10),
        ('TEXTCOLOR',     (0, 1), (-1, -1), DARK_BROWN),
        ('ROWBACKGROUNDS',(0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ('ALIGN',         (1, 1), (-1, -1), 'CENTER'),
        ('ALIGN',         (2, 1), (-1, -1), 'RIGHT'),
        ('ALIGN',         (3, 1), (-1, -1), 'RIGHT'),
        ('TOPPADDING',    (0, 1), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 7),
        ('LEFTPADDING',   (0, 0), (-1, -1), 8),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 8),
        ('LINEBELOW',     (0, 0), (-1, -1), 0.5, colors.HexColor('#ede0cc')),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 8))

    # ── Total ────────────────────────────────────────────────────────────────
    total_data = [['', Paragraph(f'TOTAL:  Rs.{float(bill.total_amount):.2f}', total_style)]]
    total_table = Table(total_data, colWidths=[100 * mm, 90 * mm])
    total_table.setStyle(TableStyle([
        ('LINEABOVE',     (0, 0), (-1, 0), 1.5, DARK_BROWN),
        ('TOPPADDING',    (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(total_table)
    story.append(Spacer(1, 16))

    # ── Footer ───────────────────────────────────────────────────────────────
    story.append(HRFlowable(width='100%', thickness=0.5, color=MUTED, spaceAfter=8))
    story.append(Paragraph('Thank you for dining with us! 🙏', footer_style))
    story.append(Paragraph('This is an automatically generated bill. Please keep it for your records.', footer_style))
    story.append(Paragraph('Cafe Lush — Canteen Management System', footer_style))

    doc.build(story)
    buffer.seek(0)
    return buffer
