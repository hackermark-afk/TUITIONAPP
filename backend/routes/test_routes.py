"""
Weekly Tests & Performance Reporting Route Handler for TUITIONAPP
Provides:
- Test creation & marks entry
- Automatic batch/class ranking computation
- Performance history
- Sunday Weekly WhatsApp Report generator with click-to-chat preview
"""

from datetime import datetime
from backend.database import get_connection
from backend.models import calculate_test_ranks
from backend.whatsapp import (
    normalize_phone_number,
    render_template,
    generate_click_to_chat_url,
    log_reminder
)

def list_tests(user: dict, batch_id: int = None) -> list:
    """Lists scheduled and completed tests."""
    conn = get_connection()
    cursor = conn.cursor()
    
    is_admin = user.get("role") in ["Super Admin", "Admin"]
    assigned_centres = user.get("assigned_centres", [])
    
    clauses = []
    params = []
    
    if not is_admin and assigned_centres:
        placeholders = ",".join("?" for _ in assigned_centres)
        clauses.append(f"t.centre_id IN ({placeholders})")
        params.extend(assigned_centres)
        
    if batch_id:
        clauses.append("t.batch_id = ?")
        params.append(int(batch_id))
        
    where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    
    sql = f"""
        SELECT 
            t.*, 
            c.name as centre_name, cl.name as class_name, b.name as batch_name,
            u.full_name as created_by_name,
            (SELECT COUNT(*) FROM test_results tr WHERE tr.test_id = t.id) as results_recorded_count
        FROM tests t
        JOIN centres c ON t.centre_id = c.id
        JOIN classes cl ON t.class_id = cl.id
        JOIN batches b ON t.batch_id = b.id
        LEFT JOIN users u ON t.created_by = u.id
        {where_sql}
        ORDER BY t.test_date DESC, t.id DESC;
    """
    cursor.execute(sql, params)
    tests = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return tests

def add_test(data: dict, user: dict) -> tuple[int, dict]:
    title = data.get("title", "").strip()
    centre_id = data.get("centre_id")
    class_id = data.get("class_id")
    batch_id = data.get("batch_id")
    subject = data.get("subject", "").strip()
    test_date = data.get("test_date", datetime.now().strftime("%Y-%m-%d"))
    total_marks = float(data.get("total_marks", 50.0))
    
    if not title or not centre_id or not class_id or not batch_id or not subject:
        return 400, {"success": False, "message": "All fields (Title, Centre, Class, Batch, Subject) are required."}
        
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO tests (title, centre_id, class_id, batch_id, subject, test_date, total_marks, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (title, int(centre_id), int(class_id), int(batch_id), subject, test_date, total_marks, user["id"], now))
    test_id = cursor.lastrowid
    
    cursor.execute("""
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
        VALUES (?, 'ADD_TEST', 'tests', ?, ?, ?);
    """, (user["id"], test_id, f"Created test {title}", now))
    
    conn.commit()
    conn.close()
    return 201, {"success": True, "message": "Test created successfully.", "test_id": test_id}

def get_test_details(test_id: int, user: dict) -> tuple[int, dict]:
    """Retrieves test details and student scores with calculated rankings."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT t.*, c.name as centre_name, cl.name as class_name, b.name as batch_name
        FROM tests t
        JOIN centres c ON t.centre_id = c.id
        JOIN classes cl ON t.class_id = cl.id
        JOIN batches b ON t.batch_id = b.id
        WHERE t.id = ?;
    """, (test_id,))
    t_row = cursor.fetchone()
    if not t_row:
        conn.close()
        return 404, {"success": False, "message": "Test not found."}
        
    test = dict(t_row)
    
    # Fetch students in the batch with their scores if already entered
    cursor.execute("""
        SELECT 
            s.id as student_id, s.student_name,
            sp.guardian_name, sp.father_name, sp.mother_name, sp.primary_whatsapp,
            tr.marks_obtained, tr.rank, tr.remarks
        FROM students s
        LEFT JOIN student_parents sp ON s.id = sp.student_id
        LEFT JOIN test_results tr ON tr.student_id = s.id AND tr.test_id = ?
        WHERE s.batch_id = ? AND s.status = 'Active'
        ORDER BY tr.rank ASC NULLS LAST, s.student_name ASC;
    """, (test_id, test["batch_id"]))
    students = []
    for r in cursor.fetchall():
        parent_name = r["guardian_name"] or r["father_name"] or r["mother_name"] or "Parent"
        students.append({
            "student_id": r["student_id"],
            "student_name": r["student_name"],
            "parent_name": parent_name,
            "parent_phone": r["primary_whatsapp"] or "",
            "marks_obtained": r["marks_obtained"],
            "rank": r["rank"],
            "remarks": r["remarks"] or ""
        })
        
    conn.close()
    return 200, {"success": True, "test": test, "students": students}

def save_test_marks(test_id: int, records: list[dict], user: dict) -> tuple[int, dict]:
    """Saves marks for students and auto-calculates ranks."""
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    
    try:
        cursor.execute("BEGIN IMMEDIATE;")
        for rec in records:
            s_id = int(rec["student_id"])
            if rec.get("marks_obtained") is None or str(rec.get("marks_obtained")).strip() == "":
                continue
            marks = float(rec["marks_obtained"])
            remarks = rec.get("remarks", "").strip()
            
            cursor.execute("""
                INSERT INTO test_results (test_id, student_id, marks_obtained, remarks, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(test_id, student_id) DO UPDATE SET
                    marks_obtained = excluded.marks_obtained,
                    remarks = excluded.remarks,
                    updated_at = excluded.updated_at;
            """, (test_id, s_id, marks, remarks, now, now))
            
        conn.commit()
        conn.close()
        
        # Calculate ranks
        calculate_test_ranks(test_id)
        return 200, {"success": True, "message": "Marks saved and ranks computed successfully."}
    except Exception as e:
        conn.rollback()
        conn.close()
        return 500, {"success": False, "message": f"Error saving marks: {str(e)}"}

def prepare_test_report_preview(test_id: int, student_id: int, user: dict) -> tuple[int, dict]:
    """Prepares weekly Sunday performance report for WhatsApp."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            t.title, t.subject, t.total_marks, t.test_date,
            s.student_name,
            sp.guardian_name, sp.father_name, sp.mother_name, sp.primary_whatsapp,
            tr.marks_obtained, tr.rank, tr.remarks
        FROM tests t
        JOIN test_results tr ON t.id = tr.test_id
        JOIN students s ON tr.student_id = s.id
        LEFT JOIN student_parents sp ON s.id = sp.student_id
        WHERE t.id = ? AND s.id = ?;
    """, (test_id, student_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return 404, {"success": False, "message": "Result record not found."}
        
    parent_phone = row["primary_whatsapp"]
    is_valid, norm_phone, phone_err = normalize_phone_number(parent_phone)
    if not is_valid:
        conn.close()
        return 400, {"success": False, "message": f"Invalid parent WhatsApp number: {phone_err}"}
        
    cursor.execute("SELECT value FROM settings WHERE key = 'institute_name';")
    inst_name = cursor.fetchone()["value"]
    
    cursor.execute("SELECT content FROM message_templates WHERE template_type = 'test_report' AND is_default = 1;")
    tpl_row = cursor.fetchone()
    tpl = tpl_row["content"] if tpl_row else "Namaste {{parent_name}} ji, {{student_name}} ka {{subject}} test result: Marks: {{marks}}/{{total_marks}}, Rank: #{{rank}}."
    
    parent_name = row["guardian_name"] or row["father_name"] or row["mother_name"] or "Parent"
    
    vars_dict = {
        "parent_name": parent_name,
        "student_name": row["student_name"],
        "subject": row["subject"],
        "marks": row["marks_obtained"],
        "total_marks": row["total_marks"],
        "rank": row["rank"] or "N/A",
        "remarks": row["remarks"] or "Good performance",
        "institute_name": inst_name
    }
    
    message = render_template(tpl, vars_dict)
    ok, wa_url, err = generate_click_to_chat_url(norm_phone, message)
    
    log_id = log_reminder(
        student_id=student_id,
        invoice_id=None,
        parent_name=parent_name,
        phone_used=norm_phone,
        message_text=message,
        reminder_type="Test Report",
        teacher_id=user["id"],
        status="Prepared"
    )
    
    conn.close()
    return 200, {
        "success": True,
        "log_id": log_id,
        "student_name": row["student_name"],
        "parent_name": parent_name,
        "parent_phone": norm_phone,
        "message": message,
        "wa_url": wa_url
    }
