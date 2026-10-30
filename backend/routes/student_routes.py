"""
Student Management Route Handler for TUITIONAPP
Provides:
- Complete Student & Separate Parent Storage CRUD
- Profile View (6 detailed sections)
- Comprehensive Search & Filtering
- Non-destructive Archive & Restore with history preservation
- Separate update endpoints for Student info, Parent info, and Fee info
"""

from datetime import datetime
from backend.database import get_connection
from backend.models import get_student_fee_summary
from backend.whatsapp import normalize_phone_number

def list_students(user: dict, query_params: dict) -> dict:
    """Lists students with flexible multi-field search and filters."""
    conn = get_connection()
    cursor = conn.cursor()
    
    is_admin = user.get("role") in ["Super Admin", "Admin"]
    assigned_centres = user.get("assigned_centres", [])
    
    clauses = []
    params = []
    
    # Centre access check
    if not is_admin and assigned_centres:
        placeholders = ",".join("?" for _ in assigned_centres)
        clauses.append(f"s.centre_id IN ({placeholders})")
        params.extend(assigned_centres)
        
    # Status filter: default to non-archived unless specifically requested
    status_filter = query_params.get("status", "Active")
    if status_filter == "All":
        pass
    elif status_filter == "Archived":
        clauses.append("s.status = 'Archived'")
    elif status_filter == "Active":
        clauses.append("s.status = 'Active'")
    elif status_filter == "Inactive":
        clauses.append("s.status = 'Inactive'")
    else:
        clauses.append("s.status != 'Archived'")
        
    # Additional dropdown filters
    if query_params.get("centre_id"):
        clauses.append("s.centre_id = ?")
        params.append(int(query_params["centre_id"]))
    if query_params.get("class_id"):
        clauses.append("s.class_id = ?")
        params.append(int(query_params["class_id"]))
    if query_params.get("batch_id"):
        clauses.append("s.batch_id = ?")
        params.append(int(query_params["batch_id"]))
        
    # Search keyword
    search = query_params.get("search", "").strip()
    if search:
        search_like = f"%{search}%"
        search_clause = """
            (s.student_name LIKE ? OR 
             p.father_name LIKE ? OR 
             p.mother_name LIKE ? OR 
             p.guardian_name LIKE ? OR 
             p.primary_whatsapp LIKE ? OR 
             p.alternate_mobile LIKE ? OR 
             p.father_mobile LIKE ? OR
             p.mother_mobile LIKE ? OR
             cl.name LIKE ? OR 
             b.name LIKE ? OR 
             c.name LIKE ?)
        """
        clauses.append(search_clause)
        params.extend([search_like] * 11)
        
    where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    
    sql = f"""
        SELECT 
            s.id, s.student_name, s.class_id, s.batch_id, s.centre_id, 
            s.admission_date, s.monthly_fee, s.due_date_day, s.status,
            cl.name as class_name, b.name as batch_name, b.batch_timing, c.name as centre_name,
            p.father_name, p.mother_name, p.guardian_name, p.relationship,
            p.primary_whatsapp, p.alternate_mobile, p.email as parent_email
        FROM students s
        LEFT JOIN student_parents p ON s.id = p.student_id
        LEFT JOIN classes cl ON s.class_id = cl.id
        LEFT JOIN batches b ON s.batch_id = b.id
        LEFT JOIN centres c ON s.centre_id = c.id
        {where_sql}
        ORDER BY s.student_name ASC;
    """
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    
    students = []
    for r in rows:
        st_dict = dict(r)
        # Compute outstanding balance for card/list display
        fee_summary = get_student_fee_summary(st_dict["id"])
        st_dict["outstanding_balance"] = fee_summary["outstanding_balance"]
        st_dict["total_paid"] = fee_summary["total_paid"]
        students.append(st_dict)
        
    conn.close()
    return {"total": len(students), "students": students}

def get_student_profile(student_id: int, user: dict) -> tuple[int, dict]:
    """Fetches full student profile across all 6 sections."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            s.*,
            cl.name as class_name, b.name as batch_name, b.batch_timing, c.name as centre_name,
            p.id as parent_id, p.father_name, p.father_mobile, p.father_whatsapp,
            p.mother_name, p.mother_mobile, p.mother_whatsapp,
            p.guardian_name, p.relationship, p.primary_whatsapp, p.alternate_mobile, p.email as parent_email
        FROM students s
        LEFT JOIN student_parents p ON s.id = p.student_id
        LEFT JOIN classes cl ON s.class_id = cl.id
        LEFT JOIN batches b ON s.batch_id = b.id
        LEFT JOIN centres c ON s.centre_id = c.id
        WHERE s.id = ?;
    """, (student_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return 404, {"success": False, "message": "Student not found."}
        
    # Centre access check
    if user.get("role") not in ["Super Admin", "Admin"]:
        if row["centre_id"] not in user.get("assigned_centres", []):
            conn.close()
            return 403, {"success": False, "message": "Access denied for this centre."}
            
    # Section 1 & 2: Student & Parent Details
    student_data = {
        "id": row["id"],
        "student_name": row["student_name"],
        "class_id": row["class_id"],
        "class_name": row["class_name"],
        "batch_id": row["batch_id"],
        "batch_name": row["batch_name"],
        "batch_timing": row["batch_timing"],
        "centre_id": row["centre_id"],
        "centre_name": row["centre_name"],
        "admission_date": row["admission_date"],
        "monthly_fee": float(row["monthly_fee"]),
        "due_date_day": row["due_date_day"],
        "address": row["address"],
        "notes": row["notes"],
        "status": row["status"],
        "parent": {
            "id": row["parent_id"],
            "father_name": row["father_name"],
            "father_mobile": row["father_mobile"],
            "father_whatsapp": row["father_whatsapp"],
            "mother_name": row["mother_name"],
            "mother_mobile": row["mother_mobile"],
            "mother_whatsapp": row["mother_whatsapp"],
            "guardian_name": row["guardian_name"],
            "relationship": row["relationship"],
            "primary_whatsapp": row["primary_whatsapp"],
            "alternate_mobile": row["alternate_mobile"],
            "email": row["parent_email"]
        }
    }
    
    # Section 3: Fee Details & Payment History
    fee_summary = get_student_fee_summary(student_id)
    cursor.execute("""
        SELECT p.id, p.receipt_number, p.amount_received, p.payment_date, p.payment_method,
               p.transaction_reference, p.notes, p.status, inv.billing_month
        FROM payments p
        JOIN invoices inv ON p.invoice_id = inv.id
        WHERE p.student_id = ?
        ORDER BY p.payment_date DESC, p.id DESC;
    """, (student_id,))
    payment_history = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("""
        SELECT id, invoice_number, billing_month, fee_amount, due_date, status
        FROM invoices WHERE student_id = ?
        ORDER BY due_date DESC;
    """, (student_id,))
    invoices_list = [dict(r) for r in cursor.fetchall()]
    
    fee_data = {
        "monthly_fee": student_data["monthly_fee"],
        "due_date_day": student_data["due_date_day"],
        "total_invoiced": fee_summary["total_invoiced"],
        "total_paid": fee_summary["total_paid"],
        "outstanding_balance": fee_summary["outstanding_balance"],
        "pending_invoices": fee_summary["pending_invoices"],
        "invoices": invoices_list,
        "payment_history": payment_history
    }
    
    # Section 4: Attendance History
    cursor.execute("""
        SELECT attendance_date, status
        FROM attendance
        WHERE student_id = ?
        ORDER BY attendance_date DESC
        LIMIT 60;
    """, (student_id,))
    att_records = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("""
        SELECT 
            COUNT(*) as total_days,
            SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days,
            SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_days
        FROM attendance WHERE student_id = ?;
    """, (student_id,))
    att_stats_row = cursor.fetchone()
    total_days = att_stats_row["total_days"] or 0
    present_days = att_stats_row["present_days"] or 0
    absent_days = att_stats_row["absent_days"] or 0
    att_rate = round((present_days / total_days * 100), 1) if total_days > 0 else 0.0
    
    attendance_data = {
        "total_days": total_days,
        "present_days": present_days,
        "absent_days": absent_days,
        "attendance_rate": att_rate,
        "records": att_records
    }
    
    # Section 5: Test Reports
    cursor.execute("""
        SELECT tr.marks_obtained, tr.rank, tr.remarks, tr.created_at,
               t.title as test_title, t.subject, t.test_date, t.total_marks
        FROM test_results tr
        JOIN tests t ON tr.test_id = t.id
        WHERE tr.student_id = ?
        ORDER BY t.test_date DESC;
    """, (student_id,))
    test_reports = [dict(r) for r in cursor.fetchall()]
    
    # Section 6: WhatsApp Reminder History
    cursor.execute("""
        SELECT id, parent_name, phone_used, message_text, reminder_type, status, created_at
        FROM reminder_logs
        WHERE student_id = ?
        ORDER BY created_at DESC;
    """, (student_id,))
    whatsapp_history = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    
    return 200, {
        "success": True,
        "student": student_data,
        "fee_details": fee_data,
        "attendance": attendance_data,
        "test_reports": test_reports,
        "whatsapp_history": whatsapp_history
    }

def add_student(data: dict, user: dict) -> tuple[int, dict]:
    """Adds a new student and separate parent details inside a transaction."""
    # Validate required fields
    student_name = data.get("student_name", "").strip()
    class_id = data.get("class_id")
    batch_id = data.get("batch_id")
    centre_id = data.get("centre_id")
    monthly_fee = float(data.get("monthly_fee", 0.0))
    admission_date = data.get("admission_date", datetime.now().strftime("%Y-%m-%d"))
    due_date_day = int(data.get("due_date_day", 5))
    
    # Parent details
    father_name = data.get("father_name", "").strip()
    father_mobile = data.get("father_mobile", "").strip()
    father_whatsapp = data.get("father_whatsapp", "").strip()
    mother_name = data.get("mother_name", "").strip()
    mother_mobile = data.get("mother_mobile", "").strip()
    mother_whatsapp = data.get("mother_whatsapp", "").strip()
    guardian_name = data.get("guardian_name", "").strip()
    relationship = data.get("relationship", "Father")
    primary_whatsapp = data.get("primary_whatsapp", "").strip()
    alternate_mobile = data.get("alternate_mobile", "").strip()
    parent_email = data.get("parent_email", "").strip()
    
    if not student_name:
        return 400, {"success": False, "message": "Student Full Name is required."}
    if not class_id or not batch_id or not centre_id:
        return 400, {"success": False, "message": "Class, Batch, and Coaching Centre must be selected."}
        
    # Check centre access
    if user.get("role") not in ["Super Admin", "Admin"]:
        if int(centre_id) not in user.get("assigned_centres", []):
            return 403, {"success": False, "message": "You are not assigned to this coaching centre."}
            
    # Validate primary WhatsApp number
    is_valid_phone, norm_phone, phone_err = normalize_phone_number(primary_whatsapp)
    if not is_valid_phone:
        return 400, {"success": False, "message": f"Primary Parent WhatsApp Number is invalid: {phone_err}"}
        
    # Parent name fallback if guardian_name is empty
    effective_parent_name = guardian_name or father_name or mother_name or "Parent"
    
    now = datetime.now().isoformat()
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Insert student record
        cursor.execute("""
            INSERT INTO students (student_name, class_id, batch_id, centre_id, admission_date, monthly_fee, due_date_day, address, notes, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?);
        """, (
            student_name, int(class_id), int(batch_id), int(centre_id),
            admission_date, monthly_fee, due_date_day,
            data.get("address", "").strip(), data.get("notes", "").strip(),
            now, now
        ))
        student_id = cursor.lastrowid
        
        # Insert separate parent record
        cursor.execute("""
            INSERT INTO student_parents (
                student_id, father_name, father_mobile, father_whatsapp,
                mother_name, mother_mobile, mother_whatsapp,
                guardian_name, relationship, primary_whatsapp, alternate_mobile, email,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            student_id, father_name, father_mobile, father_whatsapp,
            mother_name, mother_mobile, mother_whatsapp,
            effective_parent_name, relationship, primary_whatsapp,
            alternate_mobile, parent_email, now, now
        ))
        
        # Generate initial invoice for current month
        current_month_str = datetime.now().strftime("%B %Y")
        inv_no = f"INV-{student_id}-{datetime.now().strftime('%Y%m')}"
        due_day = min(max(1, due_date_day), 28)
        due_date_str = f"{datetime.now().year}-{datetime.now().month:02d}-{due_day:02d}"
        
        cursor.execute("""
            INSERT INTO invoices (invoice_number, student_id, centre_id, billing_month, fee_amount, due_date, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?);
        """, (inv_no, student_id, int(centre_id), current_month_str, monthly_fee, due_date_str, now, now))
        
        # Audit log
        cursor.execute("""
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
            VALUES (?, 'ADD_STUDENT', 'students', ?, ?, ?);
        """, (user["id"], student_id, f"Added student {student_name} with parent {effective_parent_name}", now))
        
        conn.commit()
        conn.close()
        return 201, {"success": True, "message": "Student and parent details added successfully.", "student_id": student_id}
    except Exception as e:
        conn.rollback()
        conn.close()
        return 500, {"success": False, "message": f"Database error: {str(e)}"}

def update_student_info(student_id: int, data: dict, user: dict) -> tuple[int, dict]:
    """Updates only student basic information."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT centre_id FROM students WHERE id = ?;", (student_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return 404, {"success": False, "message": "Student not found."}
    if user.get("role") not in ["Super Admin", "Admin"] and row["centre_id"] not in user.get("assigned_centres", []):
        conn.close()
        return 403, {"success": False, "message": "Unauthorized centre."}
        
    student_name = data.get("student_name", "").strip()
    class_id = data.get("class_id")
    batch_id = data.get("batch_id")
    centre_id = data.get("centre_id")
    admission_date = data.get("admission_date")
    address = data.get("address", "").strip()
    notes = data.get("notes", "").strip()
    status = data.get("status", "Active")
    
    if not student_name:
        conn.close()
        return 400, {"success": False, "message": "Student name cannot be empty."}
        
    now = datetime.now().isoformat()
    cursor.execute("""
        UPDATE students SET 
            student_name = ?, class_id = ?, batch_id = ?, centre_id = ?,
            admission_date = ?, address = ?, notes = ?, status = ?, updated_at = ?
        WHERE id = ?;
    """, (student_name, int(class_id), int(batch_id), int(centre_id), admission_date, address, notes, status, now, student_id))
    
    cursor.execute("""
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
        VALUES (?, 'UPDATE_STUDENT_INFO', 'students', ?, 'Updated student core info', ?);
    """, (user["id"], student_id, now))
    
    conn.commit()
    conn.close()
    return 200, {"success": True, "message": "Student details updated successfully."}

def update_parent_info(student_id: int, data: dict, user: dict) -> tuple[int, dict]:
    """
    Updates parent details.
    Changing the parent phone number automatically updates the number used
    for all future WhatsApp reminders while leaving old audit logs intact!
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT centre_id FROM students WHERE id = ?;", (student_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return 404, {"success": False, "message": "Student not found."}
    if user.get("role") not in ["Super Admin", "Admin"] and row["centre_id"] not in user.get("assigned_centres", []):
        conn.close()
        return 403, {"success": False, "message": "Unauthorized centre."}
        
    primary_whatsapp = data.get("primary_whatsapp", "").strip()
    is_valid_phone, norm_phone, phone_err = normalize_phone_number(primary_whatsapp)
    if not is_valid_phone:
        conn.close()
        return 400, {"success": False, "message": f"Primary WhatsApp Number is invalid: {phone_err}"}
        
    now = datetime.now().isoformat()
    cursor.execute("""
        UPDATE student_parents SET
            father_name = ?, father_mobile = ?, father_whatsapp = ?,
            mother_name = ?, mother_mobile = ?, mother_whatsapp = ?,
            guardian_name = ?, relationship = ?, primary_whatsapp = ?,
            alternate_mobile = ?, email = ?, updated_at = ?
        WHERE student_id = ?;
    """, (
        data.get("father_name", "").strip(),
        data.get("father_mobile", "").strip(),
        data.get("father_whatsapp", "").strip(),
        data.get("mother_name", "").strip(),
        data.get("mother_mobile", "").strip(),
        data.get("mother_whatsapp", "").strip(),
        data.get("guardian_name", "").strip(),
        data.get("relationship", "Father"),
        primary_whatsapp,
        data.get("alternate_mobile", "").strip(),
        data.get("email", "").strip(),
        now,
        student_id
    ))
    
    cursor.execute("""
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
        VALUES (?, 'UPDATE_PARENT_INFO', 'students', ?, 'Updated parent info and primary WhatsApp', ?);
    """, (user["id"], student_id, now))
    
    conn.commit()
    conn.close()
    return 200, {"success": True, "message": "Parent information updated successfully."}

def update_fee_info(student_id: int, data: dict, user: dict) -> tuple[int, dict]:
    """Updates student monthly fee and due date day."""
    monthly_fee = float(data.get("monthly_fee", 0.0))
    due_date_day = int(data.get("due_date_day", 5))
    
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
        UPDATE students SET monthly_fee = ?, due_date_day = ?, updated_at = ?
        WHERE id = ?;
    """, (monthly_fee, due_date_day, now, student_id))
    
    cursor.execute("""
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
        VALUES (?, 'UPDATE_FEE_INFO', 'students', ?, ?, ?);
    """, (user["id"], student_id, f"Monthly fee updated to ₹{monthly_fee}, due day: {due_date_day}", now))
    
    conn.commit()
    conn.close()
    return 200, {"success": True, "message": "Fee structure updated successfully."}

def archive_student(student_id: int, user: dict) -> tuple[int, dict]:
    """Archives a student non-destructively, preserving all payment and academic history."""
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("UPDATE students SET status = 'Archived', updated_at = ? WHERE id = ?;", (now, student_id))
    cursor.execute("""
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
        VALUES (?, 'ARCHIVE_STUDENT', 'students', ?, 'Student archived non-destructively', ?);
    """, (user["id"], student_id, now))
    conn.commit()
    conn.close()
    return 200, {"success": True, "message": "Student archived successfully. Historical records preserved."}

def restore_student(student_id: int, user: dict) -> tuple[int, dict]:
    """Restores an archived student back to Active status."""
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("UPDATE students SET status = 'Active', updated_at = ? WHERE id = ?;", (now, student_id))
    cursor.execute("""
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
        VALUES (?, 'RESTORE_STUDENT', 'students', ?, 'Student restored to active status', ?);
    """, (user["id"], student_id, now))
    conn.commit()
    conn.close()
    return 200, {"success": True, "message": "Student restored to active list."}
