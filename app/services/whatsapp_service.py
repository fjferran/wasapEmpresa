import re
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.models.clock_record import ClockRecord
from app.models.shift import Shift
from app.models.whatsapp_log import WhatsAppLog
from app.services.audit_service import log_audit_event

def clean_phone_number(phone: str) -> str:
    """
    Removes Twilio's 'whatsapp:' prefix and spaces.
    Ensures it starts with '+'.
    """
    cleaned = phone.replace("whatsapp:", "").strip()
    if not cleaned.startswith("+"):
        cleaned = "+" + cleaned
    return cleaned

def get_employee_shift_for_date(db: Session, employee: Employee, target_date: date):
    """
    Returns (start_time, end_time) as datetime.time or None if no shift.
    Prioritizes specific overrides in the shifts table, falling back to Employee's default schedule.
    """
    # 1. Check database overrides
    override = db.query(Shift).filter(
        Shift.employee_id == employee.id,
        Shift.date == target_date
    ).first()
    
    if override:
        return override.start_time, override.end_time
        
    # 2. Check fallback weekly schedule
    if employee.default_start_time and employee.default_end_time:
        weekday = target_date.isoweekday() # 1 = Monday, 7 = Sunday
        working_days = employee.default_working_days or "1,2,3,4,5"
        days_list = [d.strip() for d in working_days.split(",") if d.strip()]
        if str(weekday) in days_list:
            return employee.default_start_time, employee.default_end_time
            
    return None

def process_whatsapp_message(
    db: Session, 
    from_phone: str, 
    body: str, 
    message_sid: str = None,
    latitude: float = None,
    longitude: float = None
) -> str:
    """
    Processes an incoming WhatsApp message from Twilio, executes the command,
    and returns a TwiML response string.
    Supports geolocation coordinates if shared by the user.
    """
    phone = clean_phone_number(from_phone)
    cmd = body.strip().upper() if body else ""

    # 1. Log inbound message
    inbound_log = WhatsAppLog(
        phone_number=phone,
        message_body=body,
        direction="INBOUND",
        twilio_message_sid=message_sid
    )
    db.add(inbound_log)
    db.commit()

    # 2. Identify employee
    employee = db.query(Employee).filter(Employee.phone_number == phone, Employee.is_active == True).first()
    
    if not employee:
        # Number is not registered
        reply_text = "Lo sentimos, tu número de teléfono no está registrado en el sistema de control horario. Por favor, contacta con tu administrador."
        
        # Log outbound message
        outbound_log = WhatsAppLog(
            phone_number=phone,
            message_body=reply_text,
            direction="OUTBOUND"
        )
        db.add(outbound_log)
        db.commit()
        
        return build_twiml_response(reply_text)

    # Associate company_id with inbound log
    inbound_log.company_id = employee.company_id
    db.commit()

    # 2b. Check GDPR Consent
    if not employee.rgpd_accepted:
        if cmd in ["ACEPTO RGPD", "ACEPTO", "ACEPTAR"]:
            employee.rgpd_accepted = True
            employee.rgpd_accepted_at = datetime.now(timezone.utc)
            employee.rgpd_accepted_ip = "WHATSAPP"
            db.commit()
            reply_text = "✅ *Consentimiento RGPD Registrado*. Has aceptado la política de tratamiento de datos para el control horario. Ya puedes usar los comandos normales. Envía *AYUDA* para ver la lista."
            
            # Log outbound message
            outbound_log = WhatsAppLog(
                company_id=employee.company_id,
                phone_number=phone,
                message_body=reply_text,
                direction="OUTBOUND"
            )
            db.add(outbound_log)
            db.commit()
            return build_twiml_response(reply_text)
        else:
            reply_text = (
                "⚖️ *Aviso Legal y RGPD: WhatsAppFichajes*\n\n"
                "Para poder registrar tu jornada laboral, necesitamos tu consentimiento de tratamiento de datos personales conforme al RGPD de la UE.\n\n"
                "Tus registros de jornada se guardarán de forma inmutable con fines de control horario durante 4 años por imperativo legal (RD-Ley 8/2019).\n\n"
                "👉 Responde con el texto *ACEPTO RGPD* para aceptar y continuar."
            )
            
            # Log outbound message
            outbound_log = WhatsAppLog(
                company_id=employee.company_id,
                phone_number=phone,
                message_body=reply_text,
                direction="OUTBOUND"
            )
            db.add(outbound_log)
            db.commit()
            return build_twiml_response(reply_text)

    # 3. Process commands
    # If the user sent geolocation coordinates but no specific command, it is a voluntary location update.
    # Locations are only recorded if the worker is clocked-in (active shift).
    if latitude is not None and longitude is not None and cmd not in ["ENTRADA", "SALIDA"] and not cmd.startswith("ENTREGA"):
        active_record = db.query(ClockRecord).filter(
            ClockRecord.employee_id == employee.id,
            ClockRecord.clock_out == None
        ).first()
        
        if active_record:
            # Update employee last voluntary position
            employee.last_latitude = latitude
            employee.last_longitude = longitude
            employee.last_location_updated_at = datetime.now(timezone.utc)
            db.commit()
            
            reply_text = (
                "📍 *WhatsAppFichajes: Ubicación Voluntaria Registrada*\n\n"
                "Hemos recibido tu ubicación y se ha registrado en el sistema. Gracias por cooperar."
            )
        else:
            reply_text = (
                "⚠️ *WhatsAppFichajes: Ubicación No Registrada*\n\n"
                "Has compartido tu ubicación, pero no se ha registrado porque no tienes una jornada activa. "
                "Para poder reportar tu ubicación de forma voluntaria, primero debes iniciar tu jornada enviando *ENTRADA*."
            )
            
        # Log outbound message
        outbound_log = WhatsAppLog(
            company_id=employee.company_id,
            phone_number=phone,
            message_body=reply_text,
            direction="OUTBOUND"
        )
        db.add(outbound_log)
        db.commit()
        return build_twiml_response(reply_text)

    reply_text = ""
    
    if cmd == "AYUDA":
        reply_text = (
            "📌 *Comandos Disponibles:*\n\n"
            "👉 *ENTRADA*: Registrar el inicio de tu jornada laboral.\n"
            "👉 *SALIDA*: Registrar el fin de tu jornada laboral.\n"
            "👉 *TURNO HOY*: Consultar el horario asignado para hoy.\n"
            "👉 *HORARIO*: Consultar tus turnos programados para los próximos 7 días.\n"
            "👉 *ENTREGAS*: Consultar tus entregas asignadas y ruta optimizada.\n"
            "👉 *AYUDA*: Mostrar esta guía de comandos."
        )

    elif cmd == "ENTRADA":
        # Check if there is an active clock-in (clock_out is None)
        active_record = db.query(ClockRecord).filter(
            ClockRecord.employee_id == employee.id,
            ClockRecord.clock_out == None
        ).first()

        if active_record:
            local_time_str = active_record.clock_in.astimezone(ZoneInfo("Europe/Madrid")).strftime("%H:%M")
            local_date_str = active_record.clock_in.astimezone(ZoneInfo("Europe/Madrid")).strftime("%d/%m/%Y")
            reply_text = f"⚠️ Ya tienes un fichaje de entrada activo registrado a las {local_time_str} del {local_date_str}. Debes fichar *SALIDA* antes de iniciar uno nuevo."
        else:
            now_utc = datetime.now(timezone.utc)
            new_record = ClockRecord(
                company_id=employee.company_id,
                employee_id=employee.id,
                clock_in=now_utc,
                clock_in_method="WHATSAPP",
                latitude=latitude,
                longitude=longitude
            )
            db.add(new_record)
            db.commit()
            db.refresh(new_record)

            # Cryptographic signature
            from app.services.audit_service import sign_clock_record
            sign_clock_record(db, new_record)

            # Audit Log registration
            log_audit_event(
                db=db,
                company_id=employee.company_id,
                action="CREATE",
                table_name="clock_records",
                record_id=new_record.id,
                old_values=None,
                new_values={
                    "clock_in": new_record.clock_in.isoformat(),
                    "clock_in_method": new_record.clock_in_method,
                    "latitude": new_record.latitude,
                    "longitude": new_record.longitude
                },
                user_id=None # Done by system via WhatsApp
            )

            local_now_str = now_utc.astimezone(ZoneInfo("Europe/Madrid")).strftime("%H:%M:%S")
            loc_msg = " con geolocalización" if latitude is not None else ""
            reply_text = f"✅ *ENTRADA* registrada correctamente a las {local_now_str}{loc_msg}."

    elif cmd == "SALIDA":
        # Find active clock-in
        active_record = db.query(ClockRecord).filter(
            ClockRecord.employee_id == employee.id,
            ClockRecord.clock_out == None
        ).first()

        if not active_record:
            reply_text = "⚠️ No tienes ningún fichaje de entrada activo. Envía *ENTRADA* para iniciar tu jornada."
        else:
            now_utc = datetime.now(timezone.utc)
            
            # Save original values for audit before update
            old_vals = {
                "clock_in": active_record.clock_in.isoformat(),
                "clock_in_method": active_record.clock_in_method,
                "clock_out": None,
                "clock_out_method": None,
                "latitude": active_record.latitude,
                "longitude": active_record.longitude,
                "latitude_out": active_record.latitude_out,
                "longitude_out": active_record.longitude_out
            }

            active_record.clock_out = now_utc
            active_record.clock_out_method = "WHATSAPP"
            active_record.latitude_out = latitude
            active_record.longitude_out = longitude
            db.commit()
            db.refresh(active_record)

            # Cryptographic signature
            from app.services.audit_service import sign_clock_record
            sign_clock_record(db, active_record)

            # Audit Log updating
            log_audit_event(
                db=db,
                company_id=employee.company_id,
                action="UPDATE",
                table_name="clock_records",
                record_id=active_record.id,
                old_values=old_vals,
                new_values={
                    "clock_in": active_record.clock_in.isoformat(),
                    "clock_out": active_record.clock_out.isoformat(),
                    "clock_out_method": active_record.clock_out_method,
                    "latitude": active_record.latitude,
                    "longitude": active_record.longitude,
                    "latitude_out": active_record.latitude_out,
                    "longitude_out": active_record.longitude_out
                },
                user_id=None
            )

            duration = active_record.clock_out - active_record.clock_in
            hours, remainder = divmod(duration.total_seconds(), 3600)
            minutes, _ = divmod(remainder, 60)
            duration_str = f"{int(hours)}h {int(minutes)}m"

            local_now_str = now_utc.astimezone(ZoneInfo("Europe/Madrid")).strftime("%H:%M:%S")
            loc_msg = " con geolocalización" if latitude is not None else ""
            reply_text = f"🏁 *SALIDA* registrada correctamente a las {local_now_str}{loc_msg}. Jornada total: {duration_str}."

    elif cmd in ["TURNO HOY", "TURNO"]:
        today_date = date.today()
        shift_times = get_employee_shift_for_date(db, employee, today_date)

        if shift_times:
            start_str = shift_times[0].strftime("%H:%M")
            end_str = shift_times[1].strftime("%H:%M")
            reply_text = f"📅 *Turno de Hoy ({today_date.strftime('%d/%m/%Y')}):*\n🕒 Horario: de {start_str} a {end_str}."
        else:
            reply_text = "📅 No tienes ningún turno planificado para hoy."

    elif cmd == "HORARIO":
        today_date = date.today()
        lines = ["🗓️ *Tus turnos para los próximos 7 días:*"]
        has_any_shift = False
        
        for i in range(8): # Today + 7 days
            day = today_date + timedelta(days=i)
            shift_times = get_employee_shift_for_date(db, employee, day)
            if shift_times:
                has_any_shift = True
                day_name = day.strftime("%d/%m")
                lines.append(f"• *{day_name}*: {shift_times[0].strftime('%H:%M')} - {shift_times[1].strftime('%H:%M')}")
                
        if has_any_shift:
            reply_text = "\n".join(lines)
        else:
            reply_text = "🗓️ No tienes turnos planificados para los próximos 7 días."

    elif cmd == "ENTREGAS":
        from app.models.work_order import WorkOrder
        orders = db.query(WorkOrder).filter(
            WorkOrder.employee_id == employee.id,
            WorkOrder.status.in_(["PENDING", "IN_TRANSIT"])
        ).order_by(WorkOrder.route_order.asc(), WorkOrder.created_at.asc()).all()
        
        if not orders:
            reply_text = "🚚 No tienes entregas pendientes asignadas para hoy."
        else:
            lines = ["🚚 *TUS ENTREGAS DE HOY (Ruta Optimizada):*"]
            status_map = {
                "PENDING": "⏱️ Pendiente",
                "IN_TRANSIT": "🚚 En ruta"
            }
            for o in orders:
                short_id = o.id[:4]
                lines.append(
                    f"\n*[{short_id}]* - {o.client_name}\n"
                    f"📍 {o.address}\n"
                    f"Estado: {status_map.get(o.status, o.status)}"
                )
            lines.append("\n*Para cambiar el estado, envía:*")
            lines.append("• `ENTREGA [ID] EN_RUTA` (Iniciar camino)")
            lines.append("• `ENTREGA [ID] OK` (Confirmar entrega)")
            lines.append("• `ENTREGA [ID] ERROR [Motivo]` (Reportar incidencia)")
            reply_text = "\n".join(lines)

    elif cmd.startswith("ENTREGA "):
        match = re.match(r"^ENTREGA\s+([A-F0-9a-f]{4,36})\s+(EN_RUTA|OK|ERROR)(.*)$", cmd)
        if not match:
            reply_text = "⚠️ Formato incorrecto. Usa:\n• `ENTREGA [ID] EN_RUTA`\n• `ENTREGA [ID] OK`\n• `ENTREGA [ID] ERROR [motivo]`"
        else:
            short_id = match.group(1).lower()
            action = match.group(2)
            notes = match.group(3).strip()
            
            from app.models.work_order import WorkOrder
            order = db.query(WorkOrder).filter(
                WorkOrder.company_id == employee.company_id,
                WorkOrder.employee_id == employee.id,
                WorkOrder.id.like(f"{short_id}%")
            ).first()
            
            if not order:
                reply_text = f"❌ No se encontró ninguna entrega pendiente con ID que empiece por '{short_id}' asignada a ti."
            else:
                old_vals = {
                    "status": order.status,
                    "delivery_notes": order.delivery_notes,
                    "gps_verified": order.gps_verified
                }
                
                if action == "EN_RUTA":
                    order.status = "IN_TRANSIT"
                    db.commit()
                    reply_text = f"🚚 Pedido *#{short_id}* marcado como *EN RUTA*. ¡Buen viaje!"
                elif action == "OK":
                    order.status = "COMPLETED"
                    order.completed_at = datetime.now(timezone.utc)
                    if notes:
                        order.delivery_notes = notes
                        
                    if latitude is not None and longitude is not None:
                        order.verified_latitude = latitude
                        order.verified_longitude = longitude
                        
                        from app.api.v1.work_orders import haversine_distance
                        dist_km = haversine_distance(
                            latitude, longitude,
                            order.destination_latitude, order.destination_longitude
                        )
                        if dist_km <= 0.15:
                            order.gps_verified = True
                            reply_text = f"✅ Entrega *#{short_id}* confirmada. Verificada por GPS (a {int(dist_km * 1000)} metros del destino)."
                        else:
                            order.gps_verified = False
                            reply_text = f"⚠️ Entrega *#{short_id}* registrada. Alerta: Te encuentras a {dist_km:.2f} km de la dirección oficial."
                    else:
                        order.gps_verified = False
                        reply_text = f"✅ Entrega *#{short_id}* registrada sin verificación GPS (ubicación no compartida)."
                        
                    db.commit()
                elif action == "ERROR":
                    order.status = "FAILED"
                    order.completed_at = datetime.now(timezone.utc)
                    order.delivery_notes = notes or "Incidencia sin especificar"
                    order.gps_verified = False
                    db.commit()
                    reply_text = f"❌ Entrega *#{short_id}* marcada como *INCIDENCIA*. Motivo: {order.delivery_notes}."
                
                # Log audit event
                log_audit_event(
                    db=db,
                    company_id=employee.company_id,
                    action="UPDATE",
                    table_name="work_orders",
                    record_id=order.id,
                    old_values=old_vals,
                    new_values={
                        "status": order.status,
                        "delivery_notes": order.delivery_notes,
                        "gps_verified": order.gps_verified,
                        "verified_latitude": order.verified_latitude,
                        "verified_longitude": order.verified_longitude
                    },
                    user_id=None
                )

    else:
        # Default behavior: help guidelines
        reply_text = (
            f"❓ Comando *'{body}'* no reconocido.\n\n"
            "📌 *Comandos Disponibles:*\n"
            "👉 *ENTRADA*: Registrar inicio.\n"
            "👉 *SALIDA*: Registrar fin.\n"
            "👉 *TURNO HOY*: Ver turno de hoy.\n"
            "👉 *HORARIO*: Ver turnos de la semana.\n"
            "👉 *ENTREGAS*: Consultar tus entregas y la ruta sugerida.\n"
            "👉 *AYUDA*: Ver instrucciones."
        )

    # 4. Log outbound message
    outbound_log = WhatsAppLog(
        company_id=employee.company_id,
        phone_number=phone,
        message_body=reply_text,
        direction="OUTBOUND"
    )
    db.add(outbound_log)
    db.commit()

    return build_twiml_response(reply_text)

def build_twiml_response(body_text: str) -> str:
    """
    Wraps text in standard Twilio XML format.
    """
    # Simple XML structure avoiding full heavy libraries just for TwiML rendering
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<Response>\n'
        f'    <Message>{body_text}</Message>\n'
        '</Response>'
    )
