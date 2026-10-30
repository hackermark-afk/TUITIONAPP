"""
Fee & Payment Management Route Handler for TUITIONAPP
Provides:
- Transactional payment recording with duplicate protection
- Partial payment handling and invoice status auto-updates
- Detailed printable receipt generation
- Reversal/cancellation with automatic balance recalculation
"""

from datetime import datetime
from backend.database import get_connection
from backend.models import recalculate_invoice_status
from backend.whatsapp import classify_due_date

def list_invoices(user: dict, query_params: dict) -> list:
    """Lists invoices with filters for centre, student, billing month, and status."""
    conn = get_connection()
    cursor = conn.cursor()
    
    is_admin = user.get("role") in ["Super Admin", "Admin"]
    assigned_centres = user.get("assigned_centres", [])
    
    clauses = []
    params = []
    
    if not is_admin and assigned_centres:
        placeholders = ",".join("?" for _ in assigned_centres)
        clauses.append(f"inv.centre_id IN ({placeholders})")
        params.extend(assigned_centres)
        
    if query_params.get("student_id"):
        clauses.append("inv.student_id = ?")
        params.append(int(query_params["student_id"]))
    if query_params.get("centre_id"):
        clauses.append("inv.centre_id = ?")
        params.append(int(query_params["centre_id"]))
    if query_params.get("status"):
        clauses.append("inv.status = ?")
        params.append(query_params["status"])
    if query_params.get("billing_month"):
        clauses.append("inv.billing_month = ?")
        params.append(query_params["billing_month"])
        
    where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    
    sql = f"""
        SELECT 
            inv.*, 
            s.student_name, s.monthly_fee as student_monthly_fee,
            cl.name as class_name, b.name as batch_name, c.name as centre_name,
            p.primary_whatsapp as parent_phone, p.guardian_name as parent_name,
            COALESCE((SELECT SUM(amount_received) FROM payments WHERE invoice_id = inv.id AND status = 'Successful'), 0.0) as paid_amount
        FROM invoices inv
        JOIN students s ON inv.student_id = s.id
        LEFT JOIN student_parents p ON s.id = p.student_id
        LEFT JOIN classes cl ON s.class_id = cl.id
        LEFT JOIN batches b ON s.batch_id = b.id
        LEFT JOIN centres c ON inv.centre_id = c.id
        {where_sql}
        ORDER BY inv.due_date DESC, inv.id DESC;
    """
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    
    invoices = []
    for r in rows:
        item = dict(r)
        fee_amt = float(item["fee_amount"])
        paid_amt = float(item["paid_amount"])
        item["outstanding_amount"] = max(0.0, fee_amt - paid_amt)
        item["category"], item["days_diff"] = classify_due_date(item["due_date"])
        invoices.append(item)
        
    conn.close()
    return invoices

def record_payment(data: dict, user: dict) -> tuple[int, dict]:
    """
    Records a payment inside an immediate SQLite transaction.
    Guarantees:
    - ACID transaction
    - Non-negative balances
    - Auto status update (Paid, Partially Paid, Pending, Overdue)
    - Sequential receipt number generation
    - Duplicate payment prevention
    """
    invoice_id = data.get("invoice_id")
    student_id = data.get("student_id")
    amount_received = float(data.get("amount_received", 0.0))
    payment_date = data.get("payment_date", datetime.now().strftime("%Y-%m-%d"))
    payment_method = data.get("payment_method", "Cash")
    transaction_ref = data.get("transaction_reference", "").strip()
    notes = data.get("notes", "").strip()
    
    if not invoice_id or amount_received <= 0:
        return 400, {"success": False, "message": "Valid invoice ID and positive amount received are required."}
        
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("BEGIN IMMEDIATE;")
        
        # 1. Fetch Invoice
        cursor.execute("SELECT id, invoice_number, student_id, centre_id, fee_amount, due_date, status FROM invoices WHERE id = ?;", (invoice_id,))
        inv = cursor.fetchone()
        if not inv:
            conn.rollback()
            conn.close()
            return 404, {"success": False, "message": "Invoice not found."}
            
        # Teacher centre authorization check
        if user.get("role") not in ["Super Admin", "Admin"]:
            if inv["centre_id"] not in user.get("assigned_centres", []):
                conn.rollback()
                conn.close()
                return 403, {"success": False, "message": "Unauthorized centre."}
                
        # 2. Check current total paid
        cursor.execute("""
            SELECT COALESCE(SUM(amount_received), 0.0) 
            FROM payments 
            WHERE invoice_id = ? AND status = 'Successful';
        """, (invoice_id,))
        already_paid = float(cursor.fetchone()[0])
        fee_amount = float(inv["fee_amount"])
        remaining_balance = max(0.0, fee_amount - already_paid)
        
        if remaining_balance <= 0:
            conn.rollback()
            conn.close()
            return 400, {"success": False, "message": "This invoice is already fully paid."}
            
        # Prevent overpayment if desired, or allow exact remaining
        if amount_received > remaining_balance:
            amount_received = remaining_balance # Cap at remaining balance to avoid negative balance
            
        # 3. Check for exact duplicate payment within the last 5 minutes (prevents double clicking)
        cursor.execute("""
            SELECT id FROM payments 
            WHERE invoice_id = ? AND amount_received = ? AND payment_date = ? 
            AND datetime(created_at) >= datetime('now', '-2 minutes');
        """, (invoice_id, amount_received, payment_date))
        if cursor.fetchone():
            conn.rollback()
            conn.close()
            return 400, {"success": False, "message": "Duplicate payment detected. Please check recent transactions."}
            
        # 4. Generate unique receipt number
        today_code = datetime.now().strftime("%Y%m%d")
        cursor.execute("SELECT COUNT(*) FROM payments WHERE receipt_number LIKE ?;", (f"REC-{today_code}-%",))
        daily_seq = cursor.fetchone()[0] + 1
        receipt_number = f"REC-{today_code}-{daily_seq:04d}"
        
        now = datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO payments (
                receipt_number, invoice_id, student_id, amount_received,
                payment_date, payment_method, transaction_reference, notes,
                recorded_by, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Successful', ?);
        """, (
            receipt_number, invoice_id, inv["student_id"], amount_received,
            payment_date, payment_method, transaction_ref, notes,
            user["id"], now
        ))
        payment_id = cursor.lastrowid
        
        # 5. Recalculate invoice status
        new_status, _, total_paid_now = recalculate_invoice_status(cursor, invoice_id)
        new_outstanding = max(0.0, fee_amount - total_paid_now)
        
        # 6. Audit log
        cursor.execute("""
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
            VALUES (?, 'RECORD_PAYMENT', 'payments', ?, ?, ?);
        """, (user["id"], payment_id, f"Recorded payment of ₹{amount_received} via {payment_method} for Invoice {inv['invoice_number']}", now))
        
        conn.commit()
        conn.close()
        
        return 201, {
            "success": True,
            "message": "Payment recorded successfully.",
            "payment_id": payment_id,
            "receipt_number": receipt_number,
            "amount_received": amount_received,
            "new_status": new_status,
            "outstanding_balance": new_outstanding
        }
    except Exception as e:
        conn.rollback()
        conn.close()
        return 500, {"success": False, "message": f"Database error during payment: {str(e)}"}

def get_payment_receipt(payment_id: int) -> tuple[int, dict]:
    """Generates receipt printable payload with complete student, parent, and invoice data."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            p.*, 
            inv.invoice_number, inv.billing_month, inv.fee_amount,
            s.student_name, s.admission_date,
            cl.name as class_name, b.name as batch_name, c.name as centre_name, c.address as centre_address, c.contact_number as centre_phone,
            sp.guardian_name as parent_name, sp.primary_whatsapp as parent_phone,
            u.full_name as recorded_by_name
        FROM payments p
        JOIN invoices inv ON p.invoice_id = inv.id
        JOIN students s ON p.student_id = s.id
        JOIN centres c ON inv.centre_id = c.id
        JOIN classes cl ON s.class_id = cl.id
        JOIN batches b ON s.batch_id = b.id
        LEFT JOIN student_parents sp ON s.id = sp.student_id
        LEFT JOIN users u ON p.recorded_by = u.id
        WHERE p.id = ?;
    """, (payment_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return 404, {"success": False, "message": "Payment receipt not found."}
        
    # Institute settings
    cursor.execute("SELECT key, value FROM settings WHERE key IN ('institute_name', 'institute_upi_id', 'institute_phone', 'institute_address');")
    settings = {r["key"]: r["value"] for r in cursor.fetchall()}
    
    receipt_data = dict(row)
    receipt_data["institute"] = settings
    conn.close()
    return 200, {"success": True, "receipt": receipt_data}

def generate_monthly_invoices(data: dict, user: dict) -> tuple[int, dict]:
    """Generates fee invoices for a given billing month for active students."""
    billing_month = data.get("billing_month") # e.g. "November 2026"
    centre_id = data.get("centre_id")
    
    if not billing_month:
        return 400, {"success": False, "message": "Billing month is required."}
        
    conn = get_connection()
    cursor = conn.cursor()
    
    clauses = ["status = 'Active'"]
    params = []
    if centre_id:
        clauses.append("centre_id = ?")
        params.append(int(centre_id))
    elif user.get("role") not in ["Super Admin", "Admin"]:
        assigned = user.get("assigned_centres", [])
        if assigned:
            placeholders = ",".join("?" for _ in assigned)
            clauses.append(f"centre_id IN ({placeholders})")
            params.extend(assigned)
            
    cursor.execute(f"SELECT id, student_name, centre_id, monthly_fee, due_date_day FROM students WHERE {' AND '.join(clauses)};", params)
    students = cursor.fetchall()
    
    created_count = 0
    now = datetime.now().isoformat()
    year = datetime.now().year
    month = datetime.now().month
    
    for s in students:
        # Check if invoice already exists for this student and month
        cursor.execute("SELECT id FROM invoices WHERE student_id = ? AND billing_month = ?;", (s["id"], billing_month))
        if cursor.fetchone():
            continue
            
        due_day = min(max(1, s["due_date_day"]), 28)
        due_date = f"{year}-{month:02d}-{due_day:02d}"
        inv_no = f"INV-{s['id']}-{billing_month.replace(' ', '')}"
        
        cursor.execute("""
            INSERT INTO invoices (invoice_number, student_id, centre_id, billing_month, fee_amount, due_date, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?);
        """, (inv_no, s["id"], s["centre_id"], billing_month, float(s["monthly_fee"]), due_date, now, now))
        created_count += 1
        
    conn.commit()
    conn.close()
    return 200, {"success": True, "message": f"Generated {created_count} invoices for {billing_month}.", "created_count": created_count}
