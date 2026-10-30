"""
Coaching Centre, Class & Batch Management for TUITIONAPP
Supports multi-centre operations, centre-wise dashboards, and batch transfers.
"""

from datetime import datetime
from backend.database import get_connection

def list_centres(user: dict, include_archived: bool = False) -> list:
    """Lists coaching centres accessible by the user."""
    conn = get_connection()
    cursor = conn.cursor()
    
    is_admin = user.get("role") in ["Super Admin", "Admin"]
    assigned_centres = user.get("assigned_centres", [])
    
    status_clause = "" if include_archived else "WHERE c.status = 'Active'"
    
    sql = f"""
        SELECT 
            c.*, 
            u.full_name as assigned_teacher_name,
            (SELECT COUNT(*) FROM students s WHERE s.centre_id = c.id AND s.status = 'Active') as active_students_count,
            (SELECT COUNT(*) FROM batches b WHERE b.centre_id = c.id AND b.status = 'Active') as active_batches_count
        FROM centres c
        LEFT JOIN users u ON c.assigned_teacher_id = u.id
        {status_clause}
        ORDER BY c.name ASC;
    """
    cursor.execute(sql)
    all_centres = [dict(r) for r in cursor.fetchall()]
    
    if is_admin:
        conn.close()
        return all_centres
        
    filtered = [c for c in all_centres if c["id"] in assigned_centres]
    conn.close()
    return filtered

def get_centre_dashboard(centre_id: int, user: dict) -> tuple[int, dict]:
    """Generates an individual coaching centre dashboard."""
    if user.get("role") not in ["Super Admin", "Admin"]:
        if centre_id not in user.get("assigned_centres", []):
            return 403, {"success": False, "message": "Access denied for this centre."}
            
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT c.*, u.full_name as teacher_name
        FROM centres c
        LEFT JOIN users u ON c.assigned_teacher_id = u.id
        WHERE c.id = ?;
    """, (centre_id,))
    centre = cursor.fetchone()
    if not centre:
        conn.close()
        return 404, {"success": False, "message": "Centre not found."}
        
    # Active students
    cursor.execute("SELECT COUNT(*) FROM students WHERE centre_id = ? AND status = 'Active';", (centre_id,))
    active_students = cursor.fetchone()[0]
    
    # Batches in this centre
    cursor.execute("""
        SELECT b.*, cl.name as class_name, u.full_name as teacher_name,
               (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id AND s.status = 'Active') as student_count
        FROM batches b
        JOIN classes cl ON b.class_id = cl.id
        LEFT JOIN users u ON b.teacher_id = u.id
        WHERE b.centre_id = ? AND b.status = 'Active';
    """, (centre_id,))
    batches = [dict(r) for r in cursor.fetchall()]
    
    # Financial metrics for this centre
    cursor.execute("""
        SELECT COALESCE(SUM(p.amount_received), 0.0)
        FROM payments p
        JOIN invoices inv ON p.invoice_id = inv.id
        WHERE inv.centre_id = ? AND p.status = 'Successful';
    """, (centre_id,))
    fees_collected = float(cursor.fetchone()[0])
    
    cursor.execute("""
        SELECT COALESCE(SUM(fee_amount), 0.0)
        FROM invoices
        WHERE centre_id = ?;
    """, (centre_id,))
    total_invoiced = float(cursor.fetchone()[0])
    pending_fees = max(0.0, total_invoiced - fees_collected)
    
    conn.close()
    return 200, {
        "success": True,
        "centre": dict(centre),
        "active_students": active_students,
        "fees_collected": fees_collected,
        "pending_fees": round(pending_fees, 2),
        "batches": batches
    }

def add_centre(data: dict, user: dict) -> tuple[int, dict]:
    name = data.get("name", "").strip()
    if not name:
        return 400, {"success": False, "message": "Centre name is required."}
        
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO centres (name, address, contact_number, description, assigned_teacher_id, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'Active', ?, ?);
    """, (name, data.get("address", "").strip(), data.get("contact_number", "").strip(), data.get("description", "").strip(), data.get("assigned_teacher_id"), now, now))
    centre_id = cursor.lastrowid
    
    # Automatically assign creating teacher/admin
    cursor.execute("""
        INSERT OR IGNORE INTO teacher_centre_assignments (teacher_id, centre_id, assigned_at)
        VALUES (?, ?, ?);
    """, (user["id"], centre_id, now))
    
    cursor.execute("""
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
        VALUES (?, 'ADD_CENTRE', 'centres', ?, ?, ?);
    """, (user["id"], centre_id, f"Added centre {name}", now))
    conn.commit()
    conn.close()
    return 201, {"success": True, "message": "Centre added successfully.", "centre_id": centre_id}

def update_centre(centre_id: int, data: dict, user: dict) -> tuple[int, dict]:
    name = data.get("name", "").strip()
    if not name:
        return 400, {"success": False, "message": "Centre name cannot be empty."}
        
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
        UPDATE centres SET
            name = ?, address = ?, contact_number = ?, description = ?,
            assigned_teacher_id = ?, updated_at = ?
        WHERE id = ?;
    """, (name, data.get("address", "").strip(), data.get("contact_number", "").strip(), data.get("description", "").strip(), data.get("assigned_teacher_id"), now, centre_id))
    conn.commit()
    conn.close()
    return 200, {"success": True, "message": "Centre details updated."}

def archive_centre(centre_id: int, user: dict) -> tuple[int, dict]:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("UPDATE centres SET status = 'Archived', updated_at = ? WHERE id = ?;", (now, centre_id))
    cursor.execute("""
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
        VALUES (?, 'ARCHIVE_CENTRE', 'centres', ?, 'Archived centre non-destructively', ?);
    """, (user["id"], centre_id, now))
    conn.commit()
    conn.close()
    return 200, {"success": True, "message": "Centre archived. Financial and academic history preserved."}

def restore_centre(centre_id: int, user: dict) -> tuple[int, dict]:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("UPDATE centres SET status = 'Active', updated_at = ? WHERE id = ?;", (now, centre_id))
    conn.commit()
    conn.close()
    return 200, {"success": True, "message": "Centre restored to active status."}

# Classes and Batches Management
def list_classes(include_archived: bool = False) -> list:
    conn = get_connection()
    cursor = conn.cursor()
    clause = "" if include_archived else "WHERE status = 'Active'"
    cursor.execute(f"SELECT * FROM classes {clause} ORDER BY name ASC;")
    classes = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return classes

def add_class(data: dict, user: dict) -> tuple[int, dict]:
    name = data.get("name", "").strip()
    if not name:
        return 400, {"success": False, "message": "Class name is required."}
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("INSERT INTO classes (name, description, status, created_at, updated_at) VALUES (?, ?, 'Active', ?, ?);",
                   (name, data.get("description", "").strip(), now, now))
    conn.commit()
    conn.close()
    return 201, {"success": True, "message": "Class added successfully."}

def list_batches(centre_id: int = None, class_id: int = None) -> list:
    conn = get_connection()
    cursor = conn.cursor()
    clauses = ["b.status = 'Active'"]
    params = []
    if centre_id:
        clauses.append("b.centre_id = ?")
        params.append(int(centre_id))
    if class_id:
        clauses.append("b.class_id = ?")
        params.append(int(class_id))
        
    sql = f"""
        SELECT b.*, cl.name as class_name, c.name as centre_name, u.full_name as teacher_name,
               (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id AND s.status = 'Active') as student_count
        FROM batches b
        JOIN classes cl ON b.class_id = cl.id
        JOIN centres c ON b.centre_id = c.id
        LEFT JOIN users u ON b.teacher_id = u.id
        WHERE {' AND '.join(clauses)}
        ORDER BY b.name ASC;
    """
    cursor.execute(sql, params)
    batches = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return batches

def add_batch(data: dict, user: dict) -> tuple[int, dict]:
    name = data.get("name", "").strip()
    class_id = data.get("class_id")
    centre_id = data.get("centre_id")
    timing = data.get("batch_timing", "").strip()
    
    if not name or not class_id or not centre_id or not timing:
        return 400, {"success": False, "message": "Batch Name, Class, Centre, and Batch Timing are all required."}
        
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO batches (name, class_id, centre_id, batch_timing, teacher_id, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'Active', ?, ?);
    """, (name, int(class_id), int(centre_id), timing, data.get("teacher_id"), now, now))
    batch_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return 201, {"success": True, "message": "Batch created successfully.", "batch_id": batch_id}

def transfer_student(data: dict, user: dict) -> tuple[int, dict]:
    """Transfers a student between batches/centres while preserving all historical fee/academic records."""
    student_id = data.get("student_id")
    new_centre_id = data.get("centre_id")
    new_class_id = data.get("class_id")
    new_batch_id = data.get("batch_id")
    
    if not student_id or not new_centre_id or not new_batch_id or not new_class_id:
        return 400, {"success": False, "message": "Student ID, new Centre, Class, and Batch are required."}
        
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
        UPDATE students SET centre_id = ?, class_id = ?, batch_id = ?, updated_at = ?
        WHERE id = ?;
    """, (int(new_centre_id), int(new_class_id), int(new_batch_id), now, int(student_id)))
    
    cursor.execute("""
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
        VALUES (?, 'TRANSFER_STUDENT', 'students', ?, ?, ?);
    """, (user["id"], student_id, f"Transferred to Centre {new_centre_id}, Class {new_class_id}, Batch {new_batch_id}", now))
    
    conn.commit()
    conn.close()
    return 200, {"success": True, "message": "Student transferred successfully. Historical records preserved."}
