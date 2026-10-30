"""
Owner & Admin Dashboard Route Handler for TUITIONAPP
Provides:
- Comprehensive centre-wise revenue & pending fee breakdown
- Teacher management & multi-centre assignment
- Referral enquiries management
- System settings & template configuration
Enforces Super Admin / Admin role check on all endpoints.
"""

from datetime import datetime
from backend.database import get_connection, hash_password

def require_admin(user: dict) -> tuple[bool, str]:
    if not user or user.get("role") not in ["Super Admin", "Admin"]:
        return False, "Administrator permission required for this section."
    return True, ""

def get_admin_overview(user: dict) -> tuple[int, dict]:
    ok, err = require_admin(user)
    if not ok:
        return 403, {"success": False, "message": err}
        
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. High level counts
    cursor.execute("SELECT COUNT(*) FROM centres WHERE status = 'Active';")
    total_centres = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM users WHERE status = 'Active';")
    total_teachers = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*), SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) FROM students WHERE status != 'Archived';")
    st_row = cursor.fetchone()
    total_students = st_row[0] or 0
    active_students = st_row[1] or 0
    
    cursor.execute("SELECT COALESCE(SUM(amount_received), 0.0) FROM payments WHERE status = 'Successful';")
    total_fees_received = float(cursor.fetchone()[0])
    
    cursor.execute("SELECT COALESCE(SUM(fee_amount), 0.0) FROM invoices;")
    total_invoiced = float(cursor.fetchone()[0])
    total_pending_fees = max(0.0, total_invoiced - total_fees_received)
    
    # 2. Centre-wise Revenue & Pending Fees
    cursor.execute("""
        SELECT 
            c.id, c.name,
            (SELECT COUNT(*) FROM students s WHERE s.centre_id = c.id AND s.status = 'Active') as student_count,
            COALESCE((
                SELECT SUM(p.amount_received) 
                FROM payments p 
                JOIN invoices inv ON p.invoice_id = inv.id 
                WHERE inv.centre_id = c.id AND p.status = 'Successful'
            ), 0.0) as revenue,
            COALESCE((
                SELECT SUM(inv.fee_amount) 
                FROM invoices inv 
                WHERE inv.centre_id = c.id
            ), 0.0) as total_invoiced
        FROM centres c
        WHERE c.status = 'Active'
        ORDER BY revenue DESC;
    """)
    centre_breakdown = []
    for r in cursor.fetchall():
        rev = float(r["revenue"])
        inv = float(r["total_invoiced"])
        centre_breakdown.append({
            "id": r["id"],
            "name": r["name"],
            "student_count": r["student_count"],
            "revenue": rev,
            "pending": max(0.0, inv - rev)
        })
        
    # 3. Monthly Revenue (last 6 months)
    cursor.execute("""
        SELECT strftime('%Y-%m', payment_date) as pay_month, SUM(amount_received) as monthly_total
        FROM payments
        WHERE status = 'Successful'
        GROUP BY pay_month
        ORDER BY pay_month DESC
        LIMIT 6;
    """)
    monthly_revenue = [dict(r) for r in cursor.fetchall()]
    
    # 4. Referral Enquiries summary
    cursor.execute("""
        SELECT 
            COUNT(*) as total_enquiries,
            SUM(CASE WHEN status = 'New' THEN 1 ELSE 0 END) as new_enquiries,
            SUM(CASE WHEN status = 'Enrolled' THEN 1 ELSE 0 END) as enrolled_count
        FROM enquiries;
    """)
    enq_row = cursor.fetchone()
    enquiries_stats = {
        "total": enq_row["total_enquiries"] or 0,
        "new": enq_row["new_enquiries"] or 0,
        "enrolled": enq_row["enrolled_count"] or 0
    }
    
    conn.close()
    return 200, {
        "success": True,
        "total_centres": total_centres,
        "total_teachers": total_teachers,
        "total_students": total_students,
        "active_students": active_students,
        "total_fees_received": total_fees_received,
        "total_pending_fees": round(total_pending_fees, 2),
        "centre_breakdown": centre_breakdown,
        "monthly_revenue": monthly_revenue,
        "enquiries_stats": enquiries_stats
    }

def list_teachers(user: dict) -> tuple[int, dict]:
    ok, err = require_admin(user)
    if not ok:
        return 403, {"success": False, "message": err}
        
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, mobile_number, full_name, role, status, email, created_at
        FROM users
        ORDER BY full_name ASC;
    """)
    teachers = []
    for r in cursor.fetchall():
        t = dict(r)
        # Fetch centres assigned to this teacher
        cursor.execute("""
            SELECT c.id, c.name 
            FROM teacher_centre_assignments tca
            JOIN centres c ON tca.centre_id = c.id
            WHERE tca.teacher_id = ?;
        """, (t["id"],))
        t["assigned_centres"] = [dict(cr) for cr in cursor.fetchall()]
        teachers.append(t)
        
    conn.close()
    return 200, {"success": True, "teachers": teachers}

def update_teacher_role(teacher_id: int, data: dict, user: dict) -> tuple[int, dict]:
    ok, err = require_admin(user)
    if not ok:
        return 403, {"success": False, "message": err}
        
    new_role = data.get("role")
    new_status = data.get("status", "Active")
    if new_role not in ["Super Admin", "Admin", "Teacher"]:
        return 400, {"success": False, "message": "Invalid role specified."}
        
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("UPDATE users SET role = ?, status = ?, updated_at = ? WHERE id = ?;", (new_role, new_status, now, teacher_id))
    cursor.execute("""
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
        VALUES (?, 'UPDATE_TEACHER_ROLE', 'users', ?, ?, ?);
    """, (user["id"], teacher_id, f"Role changed to {new_role}, Status {new_status}", now))
    conn.commit()
    conn.close()
    return 200, {"success": True, "message": "Teacher permissions updated successfully."}

def assign_teacher_centres(teacher_id: int, centre_ids: list[int], user: dict) -> tuple[int, dict]:
    ok, err = require_admin(user)
    if not ok:
        return 403, {"success": False, "message": err}
        
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    
    try:
        cursor.execute("BEGIN IMMEDIATE;")
        cursor.execute("DELETE FROM teacher_centre_assignments WHERE teacher_id = ?;", (teacher_id,))
        for cid in centre_ids:
            cursor.execute("""
                INSERT INTO teacher_centre_assignments (teacher_id, centre_id, assigned_at)
                VALUES (?, ?, ?);
            """, (teacher_id, int(cid), now))
            
        cursor.execute("""
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
            VALUES (?, 'ASSIGN_TEACHER_CENTRES', 'users', ?, ?, ?);
        """, (user["id"], teacher_id, f"Assigned centres: {centre_ids}", now))
        conn.commit()
        conn.close()
        return 200, {"success": True, "message": "Centre assignments updated successfully."}
    except Exception as e:
        conn.rollback()
        conn.close()
        return 500, {"success": False, "message": str(e)}

def list_enquiries(user: dict) -> list:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT e.*, cl.name as class_name, c.name as centre_name
        FROM enquiries e
        LEFT JOIN classes cl ON e.class_id = cl.id
        LEFT JOIN centres c ON e.centre_id = c.id
        ORDER BY e.id DESC;
    """)
    enquiries = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return enquiries

def add_enquiry(data: dict, user: dict) -> tuple[int, dict]:
    student_name = data.get("student_name", "").strip()
    parent_name = data.get("parent_name", "").strip()
    contact = data.get("contact_number", "").strip()
    
    if not student_name or not contact:
        return 400, {"success": False, "message": "Student name and contact number are required."}
        
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO enquiries (student_name, parent_name, contact_number, class_id, centre_id, enquiry_date, notes, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'New', ?);
    """, (
        student_name, parent_name, contact,
        data.get("class_id"), data.get("centre_id"),
        data.get("enquiry_date", datetime.now().strftime("%Y-%m-%d")),
        data.get("notes", "").strip(),
        now
    ))
    conn.commit()
    conn.close()
    return 201, {"success": True, "message": "Enquiry registered."}

def get_settings(user: dict) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value, description FROM settings;")
    settings = {r["key"]: {"value": r["value"], "description": r["description"]} for r in cursor.fetchall()}
    conn.close()
    return settings

def update_setting(key: str, value: str, user: dict) -> tuple[int, dict]:
    ok, err = require_admin(user)
    if not ok:
        return 403, {"success": False, "message": err}
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE settings SET value = ? WHERE key = ?;", (value, key))
    conn.commit()
    conn.close()
    return 200, {"success": True, "message": f"Setting '{key}' updated successfully."}
