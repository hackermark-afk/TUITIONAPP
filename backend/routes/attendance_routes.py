"""
Attendance Management & Absence Notification Route Handler for TUITIONAPP
Provides:
- Batch-wise daily attendance marking & editing
- Absence alert generation with live WhatsApp click-to-chat preview
- Monthly attendance breakdown per student and batch
"""

from datetime import datetime
from backend.database import get_connection
from backend.whatsapp import (
    normalize_phone_number,
    render_template,
    generate_click_to_chat_url,
    log_reminder,
    get_kolkata_today
)

def get_batch_attendance(centre_id: int, class_id: int, batch_id: int, att_date: str, user: dict) -> tuple[int, dict]:
    """Retrieves students in the batch and their attendance status on a specific date."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Centre authorization check
    if user.get("role") not in ["Super Admin", "Admin"]:
        if centre_id not in user.get("assigned_centres", []):
            conn.close()
            return 403, {"success": False, "message": "Unauthorized centre."}
            
    cursor.execute("""
        SELECT 
            s.id as student_id, s.student_name, s.status as student_status,
            sp.guardian_name, sp.father_name, sp.mother_name, sp.primary_whatsapp,
            a.id as attendance_id, a.status as attendance_status, a.updated_at as marked_time
        FROM students s
        LEFT JOIN student_parents sp ON s.id = sp.student_id
        LEFT JOIN attendance a ON s.id = a.student_id AND a.attendance_date = ?
        WHERE s.centre_id = ? AND s.class_id = ? AND s.batch_id = ? AND s.status = 'Active'
        ORDER BY s.student_name ASC;
    """, (att_date, centre_id, class_id, batch_id))
    rows = cursor.fetchall()
    
    students = []
    for r in rows:
        parent_name = r["guardian_name"] or r["father_name"] or r["mother_name"] or "Parent"
        students.append({
            "student_id": r["student_id"],
            "student_name": r["student_name"],
            "parent_name": parent_name,
            "parent_phone": r["primary_whatsapp"] or "",
            "attendance_id": r["attendance_id"],
            "status": r["attendance_status"] or "Unmarked",
            "marked_time": r["marked_time"]
        })
        
    conn.close()
    return 200, {"success": True, "date": att_date, "students": students}

def mark_batch_attendance(data: dict, user: dict) -> tuple[int, dict]:
    """Saves or updates batch attendance inside a transaction."""
    centre_id = int(data.get("centre_id"))
    class_id = int(data.get("class_id"))
    batch_id = int(data.get("batch_id"))
    att_date = data.get("attendance_date", get_kolkata_today().isoformat())
    records = data.get("records", []) # list of {"student_id": X, "status": "Present"|"Absent"}
    
    if not records:
        return 400, {"success": False, "message": "No attendance records provided."}
        
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    
    try:
        cursor.execute("BEGIN IMMEDIATE;")
        for rec in records:
            s_id = int(rec["student_id"])
            st = rec.get("status", "Present")
            if st not in ["Present", "Absent"]:
                st = "Present"
                
            cursor.execute("""
                INSERT INTO attendance (student_id, centre_id, class_id, batch_id, attendance_date, status, marked_by, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(student_id, attendance_date) DO UPDATE SET
                    status = excluded.status,
                    marked_by = excluded.marked_by,
                    updated_at = excluded.updated_at;
            """, (s_id, centre_id, class_id, batch_id, att_date, st, user["id"], now, now))
            
        cursor.execute("""
            INSERT INTO audit_logs (user_id, action, entity_type, details, created_at)
            VALUES (?, 'MARK_ATTENDANCE', 'attendance', ?, ?);
        """, (user["id"], f"Marked attendance for {len(records)} students on {att_date}", now))
        
        conn.commit()
        conn.close()
        return 200, {"success": True, "message": f"Attendance recorded for {len(records)} students on {att_date}."}
    except Exception as e:
        conn.rollback()
        conn.close()
        return 500, {"success": False, "message": f"Error saving attendance: {str(e)}"}

def prepare_absence_alert(student_id: int, att_date: str, user: dict) -> tuple[int, dict]:
    """Generates absence alert preview for a student."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            s.id, s.student_name, b.name as batch_name, c.name as centre_name,
            sp.guardian_name, sp.father_name, sp.mother_name, sp.primary_whatsapp
        FROM students s
        JOIN batches b ON s.batch_id = b.id
        JOIN centres c ON s.centre_id = c.id
        LEFT JOIN student_parents sp ON s.id = sp.student_id
        WHERE s.id = ?;
    """, (student_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return 404, {"success": False, "message": "Student not found."}
        
    parent_phone = row["primary_whatsapp"]
    is_valid, norm_phone, phone_err = normalize_phone_number(parent_phone)
    if not is_valid:
        conn.close()
        return 400, {"success": False, "message": f"Invalid parent WhatsApp number: {phone_err}"}
        
    cursor.execute("SELECT value FROM settings WHERE key = 'institute_name';")
    inst_name = cursor.fetchone()["value"]
    
    cursor.execute("SELECT content FROM message_templates WHERE template_type = 'absence_alert' AND is_default = 1;")
    tpl_row = cursor.fetchone()
    tpl = tpl_row["content"] if tpl_row else "Namaste {{parent_name}} ji, {{student_name}} aaj {{date}} ko coaching class mein absent hai."
    
    parent_name = row["guardian_name"] or row["father_name"] or row["mother_name"] or "Parent"
    
    vars_dict = {
        "parent_name": parent_name,
        "student_name": row["student_name"],
        "batch_name": row["batch_name"],
        "centre_name": row["centre_name"],
        "date": att_date,
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
        reminder_type="Absence",
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
