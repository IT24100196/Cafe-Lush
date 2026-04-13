import io
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


DARK_BROWN = colors.HexColor("#2C1A0E")
GOLD = colors.HexColor("#C9A84C")
LIGHT_BG = colors.HexColor("#FDF8F0")
MUTED = colors.HexColor("#9B8B7A")
WHITE = colors.white
MONEY_SCALE = Decimal("0.01")


def _money_text(value):
    try:
        amount = Decimal(str(value)).quantize(MONEY_SCALE, rounding=ROUND_HALF_UP)
    except (InvalidOperation, TypeError, ValueError):
        amount = Decimal("0.00")
    return f"Rs.{amount:.2f}"


def _column_widths(total_width, ratios):
    return [total_width * ratio for ratio in ratios]


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

    title_style = ParagraphStyle(
        "title",
        fontSize=22,
        textColor=GOLD,
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
        leading=28,
        spaceAfter=6,
    )
    sub_style = ParagraphStyle(
        "sub",
        fontSize=10,
        textColor=MUTED,
        alignment=TA_CENTER,
        fontName="Helvetica",
        leading=13,
        spaceAfter=12,
    )
    label_style = ParagraphStyle(
        "label",
        fontSize=9,
        textColor=MUTED,
        fontName="Helvetica",
    )
    value_style = ParagraphStyle(
        "value",
        fontSize=10,
        textColor=DARK_BROWN,
        fontName="Helvetica-Bold",
        leading=13,
    )
    item_style = ParagraphStyle(
        "item",
        parent=styles["Normal"],
        fontSize=10,
        textColor=DARK_BROWN,
        fontName="Helvetica",
        leading=13,
        spaceAfter=0,
        spaceBefore=0,
    )
    total_style = ParagraphStyle(
        "total",
        fontSize=16,
        textColor=GOLD,
        fontName="Helvetica-Bold",
        alignment=TA_RIGHT,
    )
    footer_style = ParagraphStyle(
        "footer",
        fontSize=9,
        textColor=MUTED,
        alignment=TA_CENTER,
        fontName="Helvetica",
        leading=12,
    )

    story = []

    # Header
    story.append(Paragraph("Cafe Lush", title_style))
    story.append(Paragraph("Official Bill Receipt", sub_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=GOLD, spaceAfter=12))

    # Bill meta
    generated_at = getattr(bill, "generated_at", None)
    generated_text = generated_at.strftime("%b %d, %Y  %I:%M %p") if generated_at else "-"

    meta_data = [
        [
            Paragraph("Bill No:", label_style),
            Paragraph(str(getattr(bill, "bill_number", "-")), value_style),
            Paragraph("Date:", label_style),
            Paragraph(generated_text, value_style),
        ],
    ]

    order_reference = getattr(bill, "order_reference", None)
    if order_reference:
        meta_data.append(
            [
                Paragraph("Order Ref:", label_style),
                Paragraph(str(order_reference), value_style),
                "",
                "",
            ]
        )

    if getattr(bill, "customer_name", None):
        meta_data.append(
            [
                Paragraph("Customer:", label_style),
                Paragraph(str(bill.customer_name), value_style),
                "",
                "",
            ]
        )

    cashier = getattr(bill, "cashier", None)
    if cashier:
        meta_data.append(
            [
                Paragraph("Cashier:", label_style),
                Paragraph(str(cashier.username), value_style),
                "",
                "",
            ]
        )

    if getattr(bill, "sent_to_email", None):
        meta_data.append(
            [
                Paragraph("Email:", label_style),
                Paragraph(str(bill.sent_to_email), value_style),
                "",
                "",
            ]
        )

    meta_table = Table(
        meta_data,
        colWidths=_column_widths(doc.width, [0.16, 0.34, 0.14, 0.36]),
    )
    meta_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    story.append(meta_table)
    story.append(Spacer(1, 10))

    if getattr(bill, 'delivery_type', '') == 'delivery' and getattr(bill, 'delivery_address', ''):
        delivery_table = Table(
            [[
                Paragraph("Deliver To:", label_style),
                Paragraph(str(getattr(bill, 'delivery_address', '')), value_style),
            ]],
            colWidths=_column_widths(doc.width, [0.16, 0.84]),
        )
        delivery_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        story.append(delivery_table)
        story.append(Spacer(1, 10))

    # Items table
    rows = [["Item", "Qty", "Unit Price", "Amount"]]
    for line in getattr(bill, "items", []):
        rows.append(
            [
                Paragraph(str(line.get("name", "")), item_style),
                str(line.get("qty", "")),
                _money_text(line.get("unit_price", 0)),
                _money_text(line.get("line_total", 0)),
            ]
        )

    items_table = Table(
        rows,
        colWidths=_column_widths(doc.width, [0.46, 0.12, 0.21, 0.21]),
        repeatRows=1,
    )
    items_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), DARK_BROWN),
                ("TEXTCOLOR", (0, 0), (-1, 0), GOLD),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 9),
                ("TOPPADDING", (0, 0), (-1, 0), 8),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                ("ALIGN", (0, 0), (0, 0), "LEFT"),
                ("ALIGN", (1, 0), (1, 0), "CENTER"),
                ("ALIGN", (2, 0), (3, 0), "RIGHT"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 1), (-1, -1), 10),
                ("TEXTCOLOR", (0, 1), (-1, -1), DARK_BROWN),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
                ("ALIGN", (0, 1), (0, -1), "LEFT"),
                ("ALIGN", (1, 1), (1, -1), "CENTER"),
                ("ALIGN", (2, 1), (3, -1), "RIGHT"),
                ("TOPPADDING", (0, 1), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 7),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("LINEBELOW", (0, 0), (-1, -1), 0.5, colors.HexColor("#EDE0CC")),
                ("LINEBEFORE", (3, 0), (3, -1), 0.5, colors.HexColor("#E5D1B2")),
            ]
        )
    )
    story.append(items_table)
    story.append(Spacer(1, 8))

    subtotal_amount = getattr(bill, 'subtotal_amount', getattr(bill, 'total_amount', 0))
    delivery_fee = getattr(bill, 'delivery_fee', 0)
    total_data = [
        ["", Paragraph(f"Subtotal:  {_money_text(subtotal_amount)}", value_style)],
    ]
    if getattr(bill, 'delivery_type', '') == 'delivery':
        total_data.append(["", Paragraph(f"Delivery Fee:  {_money_text(delivery_fee)}", value_style)])
    total_data.append(["", Paragraph(f"TOTAL:  {_money_text(getattr(bill, 'total_amount', 0))}", total_style)])
    total_table = Table(total_data, colWidths=_column_widths(doc.width, [0.58, 0.42]))
    total_table.setStyle(
        TableStyle(
            [
                ("LINEABOVE", (0, 0), (-1, 0), 1.5, DARK_BROWN),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
            ]
        )
    )
    story.append(total_table)
    story.append(Spacer(1, 16))

    # Footer
    story.append(HRFlowable(width="100%", thickness=0.5, color=MUTED, spaceAfter=8))
    story.append(Paragraph("Thank you for dining with us!", footer_style))
    story.append(Paragraph("This is an automatically generated bill. Please keep it for your records.", footer_style))
    story.append(Paragraph("Cafe Lush - Canteen Management System", footer_style))

    doc.build(story)
    buffer.seek(0)
    return buffer
