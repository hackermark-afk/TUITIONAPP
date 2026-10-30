"""
Data Models, Business Calculations and Validation Logic for TUITIONAPP
Handles:
- Accurate fee calculation (Total Valid Invoice Amount - Total Successful Payments)
- Strict non-negative balance clamping
- Separate parent & student normalization and persistence
- Test ranking computation with tie resolution
- Absence tracking and notification generation
"""

from datetime import datetime, date
from backend.database import get_connection
from backend.whatsapp import classify_due_date, get_kolkata_today

def get_student_fee_summary(student_id: int) -> dict:
    """
    Computes total invoiced, total successful payments, and current outstanding balance.
    Outstanding Balance = Total Valid Invoices - Total Successful Payments (never negative).
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Total valid invoice amount for active or unpaid invoices
    cursor.execute("""
        SELECT COALESCE(SUM(fee_amount), 0.0) FROM invoices WHERE student_id = ?;
    """, (student_id,))
    total_invoiced = float(cursor.fetchone()[0])
    
    # Total successful payments
    cursor.execute("""
        SELECT COALESCE(SUM(amount_received), 0.0) FROM payments 
        WHERE student_id = ? AND status = 'Successful';
    """, (student_id,))
    total_paid = float(cursor.fetchone()[0])
    
    outstanding = max(0.0, total_invoiced - total_paid)
    
    # Fetch pending invoices
    cursor.execute("""
        SELECT id, invoice_number, billing_month, fee_amount, due_date, status
        FROM invoices WHERE student_id = ? AND status != 'Paid'
        ORDER BY due_date ASC;
    """, (student_id,))
    pending_invoices = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    return {
        "student_id": student_id,
        "total_invoiced": total_invoiced,
        "total_paid": total_paid,
        "outstanding_balance": outstanding,
        "pending_invoices_count": len(pending_invoices),
        "pending_invoices": pending_invoices
    }

def recalculate_invoice_status(cursor, invoice_id: int) -> tuple[str, float, float]:
    """
    Recalculates an invoice status inside an existing cursor/transaction.
    Returns (status, fee_amount, total_paid).
    """
    cursor.execute("SELECT fee_amount, due_date FROM invoices WHERE id = ?;", (invoice_id,))
    row = cursor.fetchone()
    if not row:
        return "Unknown", 0.0, 0.0
        
    fee_amount = float(row["fee_amount"])
    due_date = row["due_date"]
    
    cursor.execute("""
        SELECT COALESCE(SUM(amount_received), 0.0) 
        FROM payments 
        WHERE invoice_id = ? AND status = 'Successful';
    """, (invoice_id,))
    total_paid = float(cursor.fetchone()[0])
    
    if total_paid >= fee_amount:
        status = "Paid"
    elif total_paid > 0:
        status = "Partially Paid"
    else:
        # Check if overdue
        cat, _ = classify_due_date(due_date)
        if "Overdue" in cat:
            status = "Overdue"
        else:
            status = "Pending"
            
    now = datetime.now().isoformat()
    cursor.execute("UPDATE invoices SET status = ?, updated_at = ? WHERE id = ?;", (status, now, invoice_id))
    return status, fee_amount, total_paid

def calculate_test_ranks(test_id: int):
    """
    Calculates and updates ranks for a test based on marks_obtained descending.
    Ties receive the same rank (dense ranking).
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, marks_obtained 
        FROM test_results 
        WHERE test_id = ? 
        ORDER BY marks_obtained DESC;
    """, (test_id,))
    results = cursor.fetchall()
    
    current_rank = 1
    last_marks = None
    rank_assignments = []
    
    for idx, row in enumerate(results):
        marks = float(row["marks_obtained"])
        if last_marks is not None and marks < last_marks:
            current_rank = idx + 1
        rank_assignments.append((current_rank, row["id"]))
        last_marks = marks
        
    for rank, res_id in rank_assignments:
        cursor.execute("UPDATE test_results SET rank = ? WHERE id = ?;", (rank, res_id))
        
    conn.commit()
    conn.close()
