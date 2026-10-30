"""
Dashboard Analytics & Metrics Route Handler for TUITIONAPP
Calculates real-time values from the database and respects role/centre boundaries.
"""

from datetime import datetime
from backend.database import get_connection
from backend.whatsapp import classify_due_date, get_kolkata_today

def get_dashboard_data(user: dict) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    today_str = get_kolkata_today().isoformat()
    
    # Centre filtering condition
    is_admin = user.get("role") in ["Super Admin", "Admin"]
    assigned_centres = user.get("assigned_centres", [])
    
    if is_admin or not assigned_centres:
        centre_filter_student = ""
        centre_filter_invoice = ""
        centre_params = []
    else:
        placeholders = ",".join("?" for _ in assigned_centres)
        centre_filter_student = f"AND s.centre_id IN ({placeholders})"
        centre_filter_invoice = f"AND inv.centre_id IN ({placeholders})"
        centre_params = list(assigned_centres)
        
    # 1. Total and Active Students
    query_students = f"""
        SELECT 
            COUNT(*) as total_students,
            SUM(CASE WHEN s.status = 'Active' THEN 1 ELSE 0 END) as active_students,
            COALESCE(SUM(CASE WHEN s.status = 'Active' THEN s.monthly_fee ELSE 0 END), 0.0) as total_monthly_fees
        FROM students s
        WHERE s.status != 'Archived' {centre_filter_student};
    """
    cursor.execute(query_students, centre_params)
    st_row = cursor.fetchone()
    total_students = st_row["total_students"] or 0
    active_students = st_row["active_students"] or 0
    total_monthly_fees = float(st_row["total_monthly_fees"] or 0.0)
    
    # 2. Total Coaching Centres accessible
    if is_admin:
        cursor.execute("SELECT COUNT(*) FROM centres WHERE status = 'Active';")
        total_centres = cursor.fetchone()[0]
    else:
        total_centres = len(assigned_centres)
        
    # 3. Fees Received, Pending Fees, Overdue Fees
    # Fees received: Successful payments
    query_payments = f"""
        SELECT COALESCE(SUM(p.amount_received), 0.0)
        FROM payments p
        JOIN invoices inv ON p.invoice_id = inv.id
        WHERE p.status = 'Successful' {centre_filter_invoice};
    """
    cursor.execute(query_payments, centre_params)
    fees_received = float(cursor.fetchone()[0])
    
    # Invoices analysis
    query_invoices = f"""
        SELECT inv.id, inv.fee_amount, inv.due_date, inv.status,
               COALESCE((SELECT SUM(amount_received) FROM payments WHERE invoice_id = inv.id AND status = 'Successful'), 0.0) as paid_amount
        FROM invoices inv
        JOIN students s ON inv.student_id = s.id
        WHERE s.status = 'Active' {centre_filter_invoice};
    """
    cursor.execute(query_invoices, centre_params)
    all_invoices = cursor.fetchall()
    
    pending_fees = 0.0
    overdue_fees = 0.0
    due_today_count = 0
    due_today_amount = 0.0
    due_within_5_count = 0
    due_within_5_amount = 0.0
    overdue_1_4_count = 0
    overdue_1_4_amount = 0.0
    overdue_5_plus_count = 0
    overdue_5_plus_amount = 0.0
    pending_count = 0
    
    for inv in all_invoices:
        fee_amt = float(inv["fee_amount"])
        paid_amt = float(inv["paid_amount"])
        outstanding = max(0.0, fee_amt - paid_amt)
        
        if outstanding > 0:
            pending_fees += outstanding
            pending_count += 1
            cat, days = classify_due_date(inv["due_date"])
            
            if cat == "Due Today":
                due_today_count += 1
                due_today_amount += outstanding
            elif cat == "Due Within 5 Days":
                due_within_5_count += 1
                due_within_5_amount += outstanding
            elif cat == "Overdue 1–4 Days":
                overdue_1_4_count += 1
                overdue_1_4_amount += outstanding
                overdue_fees += outstanding
            elif cat == "Overdue 5+ Days":
                overdue_5_plus_count += 1
                overdue_5_plus_amount += outstanding
                overdue_fees += outstanding
                
    # 4. Today's Attendance
    query_att = f"""
        SELECT 
            COUNT(*) as total_marked,
            SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_count,
            SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent_count
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE a.attendance_date = ? {centre_filter_student};
    """
    cursor.execute(query_att, [today_str] + centre_params)
    att_row = cursor.fetchone()
    present_count = att_row["present_count"] or 0
    absent_count = att_row["absent_count"] or 0
    total_marked = att_row["total_marked"] or 0
    att_rate = round((present_count / total_marked * 100), 1) if total_marked > 0 else 0.0
    
    # 5. Upcoming Fee Due Dates
    query_upcoming = f"""
        SELECT inv.id, inv.invoice_number, inv.billing_month, inv.fee_amount, inv.due_date,
               s.student_name, c.name as centre_name, cl.name as class_name,
               COALESCE((SELECT SUM(amount_received) FROM payments WHERE invoice_id = inv.id AND status = 'Successful'), 0.0) as paid_amount
        FROM invoices inv
        JOIN students s ON inv.student_id = s.id
        JOIN centres c ON inv.centre_id = c.id
        JOIN classes cl ON s.class_id = cl.id
        WHERE s.status = 'Active' AND inv.due_date >= ? {centre_filter_invoice}
        ORDER BY inv.due_date ASC
        LIMIT 5;
    """
    cursor.execute(query_upcoming, [today_str] + centre_params)
    upcoming_dues = []
    for r in cursor.fetchall():
        out = max(0.0, float(r["fee_amount"]) - float(r["paid_amount"]))
        if out > 0:
            upcoming_dues.append({
                "id": r["id"],
                "invoice_number": r["invoice_number"],
                "student_name": r["student_name"],
                "class_name": r["class_name"],
                "centre_name": r["centre_name"],
                "due_date": r["due_date"],
                "outstanding_amount": out
            })
            
    # 6. Recent Payments
    query_recent_pay = f"""
        SELECT p.id, p.receipt_number, p.amount_received, p.payment_date, p.payment_method,
               s.student_name, inv.billing_month, c.name as centre_name
        FROM payments p
        JOIN invoices inv ON p.invoice_id = inv.id
        JOIN students s ON p.student_id = s.id
        JOIN centres c ON inv.centre_id = c.id
        WHERE p.status = 'Successful' {centre_filter_invoice}
        ORDER BY p.id DESC
        LIMIT 6;
    """
    cursor.execute(query_recent_pay, centre_params)
    recent_payments = [dict(r) for r in cursor.fetchall()]
    
    # 7. Students Recently Added
    query_recent_students = f"""
        SELECT s.id, s.student_name, s.admission_date, s.monthly_fee, cl.name as class_name, c.name as centre_name
        FROM students s
        JOIN classes cl ON s.class_id = cl.id
        JOIN centres c ON s.centre_id = c.id
        WHERE s.status = 'Active' {centre_filter_student}
        ORDER BY s.id DESC
        LIMIT 5;
    """
    cursor.execute(query_recent_students, centre_params)
    recent_students = [dict(r) for r in cursor.fetchall()]
    
    # 8. Recent Activities (from audit logs)
    cursor.execute("""
        SELECT a.id, a.action, a.entity_type, a.details, a.created_at, u.full_name as user_name
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.id DESC
        LIMIT 6;
    """)
    recent_activities = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    
    return {
        "stats": {
            "total_students": total_students,
            "active_students": active_students,
            "total_centres": total_centres,
            "total_monthly_fees": total_monthly_fees,
            "fees_received": fees_received,
            "pending_fees": round(pending_fees, 2),
            "overdue_fees": round(overdue_fees, 2),
            "attendance": {
                "present_count": present_count,
                "absent_count": absent_count,
                "total_marked": total_marked,
                "rate": att_rate
            }
        },
        "cards": {
            "fees_pending": {
                "count": pending_count,
                "amount": round(pending_fees, 2)
            },
            "due_today": {
                "count": due_today_count,
                "amount": round(due_today_amount, 2)
            },
            "due_within_5_days": {
                "count": due_within_5_count,
                "amount": round(due_within_5_amount, 2)
            },
            "overdue_1_4_days": {
                "count": overdue_1_4_count,
                "amount": round(overdue_1_4_amount, 2)
            },
            "overdue_5_plus_days": {
                "count": overdue_5_plus_count,
                "amount": round(overdue_5_plus_amount, 2)
            },
            "payments_received": {
                "amount": round(fees_received, 2)
            }
        },
        "upcoming_dues": upcoming_dues,
        "recent_payments": recent_payments,
        "recent_students": recent_students,
        "recent_activities": recent_activities
    }
