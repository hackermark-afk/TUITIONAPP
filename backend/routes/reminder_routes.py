"""
WhatsApp Reminder Centre Route Handler for TUITIONAPP
Provides:
- Real-time categorised pending dues (Asia/Kolkata timezone)
- Template parsing with live student/parent/fee variable substitution
- Phone validation and normalization (+91, E.164)
- Pre-flight checks (paid status, archived state, phone validity)
- Click-to-chat URL generation
- Bulk queue preparation with valid/skipped audit summaries
- Reminder history logging
"""

from datetime import datetime
from backend.database import get_connection
from backend.whatsapp import (
    classify_due_date,
    normalize_phone_number,
    render_template,
    generate_click_to_chat_url,
    log_reminder,
    update_reminder_status,
    get_kolkata_today
)

def get_pending_reminders(user: dict, category_filter: str = "All") -> dict:
    """
    Returns categorised pending fees with full student, parent, and invoice context.
    Categories: 'All', 'Due Within 5 Days', 'Due Today', 'Overdue 1–4 Days', 'Overdue 5+ Days'
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    is_admin = user.get("role") in ["Super Admin", "Admin"]
    assigned_centres = user.get("assigned_centres", [])
    
    centre_clause = ""
    params = []
    if not is_admin and assigned_centres:
        placeholders = ",".join("?" for _ in assigned_centres)
        centre_clause = f"AND inv.centre_id IN ({placeholders})"
        params.extend(assigned_centres)
        
    sql = f"""
        SELECT 
            inv.id as invoice_id, inv.invoice_number, inv.billing_month, inv.fee_amount, inv.due_date, inv.status as invoice_status,
            s.id as student_id, s.student_name, s.status as student_status,
            cl.name as class_name, b.name as batch_name, c.name as centre_name,
            sp.id as parent_id, sp.guardian_name, sp.father_name, sp.mother_name, sp.relationship,
            sp.primary_whatsapp, sp.alternate_mobile,
            COALESCE((SELECT SUM(amount_received) FROM payments WHERE invoice_id = inv.id AND status = 'Successful'), 0.0) as paid_amount,
            (SELECT created_at FROM reminder_logs WHERE invoice_id = inv.id ORDER BY id DESC LIMIT 1) as last_reminder_date
        FROM invoices inv
        JOIN students s ON inv.student_id = s.id
        LEFT JOIN student_parents sp ON s.id = sp.student_id
        LEFT JOIN classes cl ON s.class_id = cl.id
        LEFT JOIN batches b ON s.batch_id = b.id
        LEFT JOIN centres c ON inv.centre_id = c.id
        WHERE s.status = 'Active' {centre_clause}
        ORDER BY inv.due_date ASC;
    """
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    
    items = []
    total_outstanding = 0.0
    category_counts = {
        "All": 0,
        "Due Within 5 Days": 0,
        "Due Today": 0,
        "Overdue 1–4 Days": 0,
        "Overdue 5+ Days": 0
    }
    category_amounts = {
        "All": 0.0,
        "Due Within 5 Days": 0.0,
        "Due Today": 0.0,
        "Overdue 1–4 Days": 0.0,
        "Overdue 5+ Days": 0.0
    }
    
    for r in rows:
        fee_amt = float(r["fee_amount"])
        paid_amt = float(r["paid_amount"])
        outstanding = max(0.0, fee_amt - paid_amt)
        
        if outstanding <= 0:
            continue # Already paid
            
        category, days_diff = classify_due_date(r["due_date"])
        
        # Effective parent name
        parent_name = r["guardian_name"] or r["father_name"] or r["mother_name"] or "Parent"
        raw_phone = r["primary_whatsapp"] or ""
        is_phone_valid, norm_phone, phone_err = normalize_phone_number(raw_phone)
        
        item = {
            "invoice_id": r["invoice_id"],
            "invoice_number": r["invoice_number"],
            "student_id": r["student_id"],
            "student_name": r["student_name"],
            "parent_name": parent_name,
            "parent_phone": raw_phone,
            "normalized_phone": norm_phone if is_phone_valid else "",
            "phone_valid": is_phone_valid,
            "phone_error": phone_err,
            "class_name": r["class_name"] or "N/A",
            "batch_name": r["batch_name"] or "N/A",
            "centre_name": r["centre_name"] or "N/A",
            "billing_month": r["billing_month"],
            "fee_amount": fee_amt,
            "paid_amount": paid_amt,
            "outstanding_amount": round(outstanding, 2),
            "due_date": r["due_date"],
            "days_diff": days_diff,
            "category": category,
            "invoice_status": r["invoice_status"],
            "last_reminder_date": r["last_reminder_date"]
        }
        
        # Accumulate category counts & amounts
        category_counts["All"] += 1
        category_amounts["All"] += outstanding
        total_outstanding += outstanding
        
        if category in category_counts:
            category_counts[category] += 1
            category_amounts[category] += outstanding
            
        # Filter check
        if category_filter == "All" or category == category_filter:
            items.append(item)
            
    conn.close()
    
    return {
        "categories": {
            k: {
                "count": category_counts[k],
                "amount": round(category_amounts[k], 2)
            } for k in category_counts
        },
        "total_outstanding": round(total_outstanding, 2),
        "reminders": items
    }

def prepare_single_reminder_preview(invoice_id: int, user: dict, custom_template: str = None) -> tuple[int, dict]:
    """
    Pre-flight checks and preview generator for a single pending fee reminder:
    - Verifies invoice and student are active
    - Recalculates latest payments & balance
    - Validates latest parent WhatsApp number
    - Renders template and produces wa.me URL
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            inv.id as invoice_id, inv.invoice_number, inv.billing_month, inv.fee_amount, inv.due_date, inv.centre_id,
            s.id as student_id, s.student_name, s.status as student_status,
            cl.name as class_name, b.name as batch_name, c.name as centre_name,
            sp.guardian_name, sp.father_name, sp.mother_name, sp.primary_whatsapp,
            COALESCE((SELECT SUM(amount_received) FROM payments WHERE invoice_id = inv.id AND status = 'Successful'), 0.0) as paid_amount
        FROM invoices inv
        JOIN students s ON inv.student_id = s.id
        LEFT JOIN student_parents sp ON s.id = sp.student_id
        LEFT JOIN classes cl ON s.class_id = cl.id
        LEFT JOIN batches b ON s.batch_id = b.id
        LEFT JOIN centres c ON inv.centre_id = c.id
        WHERE inv.id = ?;
    """, (invoice_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return 404, {"success": False, "message": "Invoice not found."}
        
    if row["student_status"] == "Archived":
        conn.close()
        return 400, {"success": False, "message": "Student is archived. Reminders cannot be prepared."}
        
    # Authorization check
    if user.get("role") not in ["Super Admin", "Admin"]:
        if row["centre_id"] not in user.get("assigned_centres", []):
            conn.close()
            return 403, {"success": False, "message": "Unauthorized centre."}
            
    # Check balance
    fee_amt = float(row["fee_amount"])
    paid_amt = float(row["paid_amount"])
    outstanding = max(0.0, fee_amt - paid_amt)
    if outstanding <= 0:
        conn.close()
        return 400, {"success": False, "message": "This invoice is already fully paid. Reminder cancelled."}
        
    # Check Parent WhatsApp number
    parent_phone = row["primary_whatsapp"]
    is_valid, norm_phone, phone_err = normalize_phone_number(parent_phone)
    if not is_valid:
        conn.close()
        return 400, {"success": False, "message": f"Invalid Parent WhatsApp number ({parent_phone}): {phone_err}"}
        
    # Fetch Settings
    cursor.execute("SELECT key, value FROM settings WHERE key IN ('institute_name', 'institute_upi_id');")
    settings = {r["key"]: r["value"] for r in cursor.fetchall()}
    institute_name = settings.get("institute_name", "Apex Coaching Institute")
    upi_id = settings.get("institute_upi_id", "tuitionapp@icici")
    
    # Template
    if not custom_template:
        cursor.execute("SELECT content FROM message_templates WHERE template_type = 'fee_reminder' AND is_default = 1;")
        tpl_row = cursor.fetchone()
        template_text = tpl_row["content"] if tpl_row else "Namaste {{parent_name}} ji, {{student_name}} ki {{billing_month}} ki coaching fee ₹{{outstanding_amount}} pending hai."
    else:
        template_text = custom_template
        
    parent_name = row["guardian_name"] or row["father_name"] or row["mother_name"] or "Parent"
    
    template_vars = {
        "student_name": row["student_name"],
        "parent_name": parent_name,
        "billing_month": row["billing_month"],
        "class_name": row["class_name"] or "N/A",
        "batch_name": row["batch_name"] or "N/A",
        "centre_name": row["centre_name"] or "N/A",
        "outstanding_amount": f"{outstanding:.2f}",
        "due_date": row["due_date"],
        "upi_id": upi_id,
        "institute_name": institute_name
    }
    
    message = render_template(template_text, template_vars)
    ok, wa_url, url_err = generate_click_to_chat_url(norm_phone, message)
    
    # Create reminder log in 'Prepared' state
    log_id = log_reminder(
        student_id=row["student_id"],
        invoice_id=row["invoice_id"],
        parent_name=parent_name,
        phone_used=norm_phone,
        message_text=message,
        reminder_type="Fee Pending",
        teacher_id=user["id"],
        status="Prepared"
    )
    
    conn.close()
    
    return 200, {
        "success": True,
        "reminder": {
            "log_id": log_id,
            "invoice_id": row["invoice_id"],
            "student_id": row["student_id"],
            "student_name": row["student_name"],
            "parent_name": parent_name,
            "parent_phone": norm_phone,
            "outstanding_amount": outstanding,
            "message": message,
            "wa_url": wa_url
        }
    }

def prepare_bulk_reminder_queue(invoice_ids: list[int], user: dict) -> dict:
    """
    Prepares a bulk reminder queue:
    - Refreshes all records from database
    - Filters out paid, archived, inaccessible, or invalid phone numbers
    - Returns queue with valid reminders and skipped reason breakdown
    """
    valid_queue = []
    skipped_records = []
    
    for inv_id in invoice_ids:
        status_code, res = prepare_single_reminder_preview(inv_id, user)
        if status_code == 200:
            valid_queue.append(res["reminder"])
        else:
            skipped_records.append({
                "invoice_id": inv_id,
                "reason": res.get("message", "Validation failed")
            })
            
    return {
        "total_selected": len(invoice_ids),
        "valid_count": len(valid_queue),
        "skipped_count": len(skipped_records),
        "queue": valid_queue,
        "skipped": skipped_records
    }

def get_reminder_history(user: dict, limit: int = 50) -> list:
    """Fetches audit history of WhatsApp reminders."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            rl.*, 
            s.student_name, u.full_name as teacher_name,
            inv.invoice_number, inv.billing_month
        FROM reminder_logs rl
        JOIN students s ON rl.student_id = s.id
        LEFT JOIN users u ON rl.teacher_id = u.id
        LEFT JOIN invoices inv ON rl.invoice_id = inv.id
        ORDER BY rl.created_at DESC
        LIMIT ?;
    """, (limit,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows
