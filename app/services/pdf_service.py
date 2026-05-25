import io
import calendar
from datetime import datetime, date
from zoneinfo import ZoneInfo
import hashlib
from typing import List, Any
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import cm

def generate_spanish_timesheet_pdf(
    company: Any,
    employee: Any,
    year: int,
    month: int,
    clock_records: List[Any]
) -> io.BytesIO:
    """
    Generates a highly structured, Spanish-compliant monthly timesheet PDF.
    Complies with RD-Ley 8/2019.
    """
    buffer = io.BytesIO()
    
    # Page setup - A4 with 1.5cm margins
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=1.5*cm,
        rightMargin=1.5*cm,
        topMargin=1.5*cm,
        bottomMargin=1.5*cm
    )
    
    styles = getSampleStyleSheet()
    
    # Custom premium styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        alignment=1, # Center
        textColor=colors.HexColor('#1a1a24'),
        spaceAfter=15
    )
    
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11
    )
    
    body_normal = ParagraphStyle(
        'BodyNormal',
        parent=styles['Normal'],
        fontSize=8,
        leading=11
    )
    
    th_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=9,
        textColor=colors.white,
        alignment=1
    )
    
    td_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontSize=7,
        leading=9,
        alignment=1
    )
    
    legal_style = ParagraphStyle(
        'LegalText',
        parent=styles['Normal'],
        fontSize=6.5,
        leading=8,
        textColor=colors.HexColor('#4a4a5a'),
        spaceAfter=10
    )

    elements = []
    
    # 1. Header Title
    title_text = "REGISTRO MENSUAL DE JORNADA DE TRABAJO (Real Decreto-ley 8/2019, de 8 de marzo)"
    elements.append(Paragraph(title_text, title_style))
    
    # 2. Company & Employee Info Block (2-column Table)
    months_es = {
        1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril", 5: "Mayo", 6: "Junio",
        7: "Julio", 8: "Agosto", 9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
    }
    
    info_data = [
        [
            Paragraph(f"<b>Empresa:</b> {company.name}", body_normal),
            Paragraph(f"<b>Trabajador:</b> {employee.first_name} {employee.last_name}", body_normal)
        ],
        [
            Paragraph(f"<b>CIF/NIF:</b> {company.cif}", body_normal),
            Paragraph(f"<b>NIF/NIE:</b> {employee.nif_nie or 'No especificado'}", body_normal)
        ],
        [
            Paragraph(f"<b>Código Cuenta Cotización (CCC):</b> {company.ccc or 'No especificado'}", body_normal),
            Paragraph(f"<b>Nº Seg. Social (NSS):</b> {employee.nss or 'No especificado'}", body_normal)
        ],
        [
            Paragraph(f"<b>Período:</b> {months_es[month]} de {year}", body_normal),
            Paragraph(f"<b>RGPD Aceptado:</b> {'SÍ (Vía WhatsApp / Web)' if employee.rgpd_accepted else 'PENDIENTE'}", body_normal)
        ]
    ]
    
    info_table = Table(info_data, colWidths=[9.0*cm, 9.0*cm])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,-1), (-1,-1), 1, colors.HexColor('#cccccc')),
    ]))
    
    elements.append(info_table)
    elements.append(Spacer(1, 15))
    
    # 3. Calendar Data Table
    # Table header
    headers = [
        Paragraph("<b>Día</b>", th_style),
        Paragraph("<b>Hora Entrada</b>", th_style),
        Paragraph("<b>Método</b>", th_style),
        Paragraph("<b>Hora Salida</b>", th_style),
        Paragraph("<b>Método</b>", th_style),
        Paragraph("<b>Horas Ord.</b>", th_style),
        Paragraph("<b>Horas Ext.</b>", th_style),
        Paragraph("<b>Firma / CVE</b>", th_style)
    ]
    
    table_data = [headers]
    
    # Map clock records to days
    records_by_day = {}
    for r in clock_records:
        if r.clock_in:
            # Convert to local timezone date
            local_date = r.clock_in.astimezone(ZoneInfo("Europe/Madrid")).date()
            if local_date.year == year and local_date.month == month:
                records_by_day[local_date.day] = r
                
    num_days = calendar.monthrange(year, month)[1]
    
    total_worked_seconds = 0.0
    
    for day in range(1, num_days + 1):
        r = records_by_day.get(day)
        day_date = date(year, month, day)
        day_name = day_date.strftime("%a") # Sun, Mon...
        day_label = f"{day} ({day_name})"
        
        if r:
            in_local = r.clock_in.astimezone(ZoneInfo("Europe/Madrid")) if r.clock_in else None
            out_local = r.clock_out.astimezone(ZoneInfo("Europe/Madrid")) if r.clock_out else None
            
            in_time_str = in_local.strftime("%H:%M:%S") if in_local else "-"
            in_method = r.clock_in_method or "WEB"
            if r.latitude is not None and r.longitude is not None:
                in_method = f"{in_method} (GPS)"
            out_time_str = out_local.strftime("%H:%M:%S") if out_local else "-"
            out_method = r.clock_out_method or "-"
            if r.latitude_out is not None and r.longitude_out is not None:
                out_method = f"{out_method} (GPS)"
            
            worked_hours = 0.0
            if r.clock_in and r.clock_out:
                diff = r.clock_out - r.clock_in
                worked_seconds = diff.total_seconds()
                total_worked_seconds += worked_seconds
                worked_hours = worked_seconds / 3600
                
            worked_hours_str = f"{worked_hours:.2f} h" if worked_hours > 0 else "-"
            
            # Cryptographic signature check (CVE)
            cve_short = r.record_hash[:10] if r.record_hash else "NO_SIGN"
            
            row = [
                Paragraph(day_label, td_style),
                Paragraph(in_time_str, td_style),
                Paragraph(in_method, td_style),
                Paragraph(out_time_str, td_style),
                Paragraph(out_method, td_style),
                Paragraph(worked_hours_str, td_style),
                Paragraph("-", td_style), # Overtime placeholder (can be filled or split)
                Paragraph(f"CVE: {cve_short}", td_style)
            ]
        else:
            # Check weekend
            is_weekend = day_date.weekday() in [5, 6] # Saturday or Sunday
            status_text = "Fin de Semana" if is_weekend else "No Laborado / Sin Turno"
            
            row = [
                Paragraph(day_label, td_style),
                Paragraph(status_text, td_style),
                Paragraph("", td_style),
                Paragraph("", td_style),
                Paragraph("", td_style),
                Paragraph("-", td_style),
                Paragraph("-", td_style),
                Paragraph("", td_style)
            ]
            # Set horizontal span for description on empty days
            # We'll handle visual layout in TableStyle instead
            
        table_data.append(row)
        
    # Append Total row
    total_hours = total_worked_seconds / 3600
    total_row = [
        Paragraph("<b>TOTALES</b>", td_style),
        Paragraph("", td_style),
        Paragraph("", td_style),
        Paragraph("", td_style),
        Paragraph("", td_style),
        Paragraph(f"<b>{total_hours:.2f} h</b>", td_style),
        Paragraph("<b>0.00 h</b>", td_style),
        Paragraph("", td_style)
    ]
    table_data.append(total_row)
    
    # 8 cols with custom widths mapping exactly to A4
    col_widths = [1.8*cm, 2.2*cm, 1.8*cm, 2.2*cm, 1.8*cm, 2.0*cm, 2.0*cm, 4.2*cm]
    
    t = Table(table_data, colWidths=col_widths, repeatRows=1)
    
    # Style formatting for the report table
    t_style = [
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1a1a24')), # Dark blue header
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dddddd')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]
    
    # Add spans for empty days (columns 1 to 4)
    for day in range(1, num_days + 1):
        if day not in records_by_day:
            t_style.append(('SPAN', (1, day), (4, day)))
            t_style.append(('ALIGN', (1, day), (4, day), 'LEFT'))
            t_style.append(('TEXTCOLOR', (1, day), (4, day), colors.HexColor('#777777')))
            
    # Span for Totals
    t_style.append(('SPAN', (0, -1), (4, -1)))
    t_style.append(('ALIGN', (0, -1), (4, -1), 'RIGHT'))
    
    t.setStyle(TableStyle(t_style))
    elements.append(t)
    elements.append(Spacer(1, 15))
    
    # 4. Legal Compliance Footer
    legal_text = (
        "<b>Declaración de conformidad:</b> Ambas partes firman el presente registro horario en prueba de conformidad con las horas reflejadas, "
        "dando cumplimiento a lo establecido en el Art. 34.9 del Estatuto de los Trabajadores. Este registro se conservará a disposición de la "
        "Inspección de Trabajo y Seguridad Social durante un período de cuatro años, conforme a la legislación española vigente."
    )
    elements.append(Paragraph(legal_text, legal_style))
    elements.append(Spacer(1, 10))
    
    # 5. Signatures Block Table
    sig_data = [
        [
            Paragraph("<b>Firma del Representante de la Empresa</b>", body_bold),
            Paragraph("<b>Firma del Trabajador</b>", body_bold)
        ],
        [
            Paragraph("<br/><br/><br/>Fdo: _______________________________", body_normal),
            Paragraph("<br/><br/><br/>Fdo: _______________________________", body_normal)
        ],
        [
            Paragraph("Fecha: ____/____/________", body_normal),
            Paragraph("Fecha: ____/____/________", body_normal)
        ]
    ]
    
    sig_table = Table(sig_data, colWidths=[9.0*cm, 9.0*cm])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    
    elements.append(sig_table)
    
    # Build Document
    doc.build(elements)
    
    buffer.seek(0)
    return buffer
