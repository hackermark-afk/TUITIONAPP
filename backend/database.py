"""
Database Architecture and Management for TUITIONAPP
Uses SQLite with ACID transactions, foreign keys enabled, WAL mode,
indices, and automated schema migrations and seed data.
"""

import sqlite3
import os
import hashlib
import secrets
from datetime import datetime

DATABASE_PATH = os.environ.get("TUITIONAPP_DB_PATH", os.path.join(os.path.dirname(os.path.abspath(__file__)), "tuitionapp.db"))

def get_connection():
    """Returns a thread-safe connection to the SQLite database with Row factory."""
    conn = sqlite3.connect(DATABASE_PATH, timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn

def hash_password(password: str, salt: str = None) -> tuple[str, str]:
    """Generates PBKDF2 HMAC SHA-256 hash with cryptographic salt."""
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100_000
    ).hex()
    return hashed, salt

def verify_password(password: str, hashed: str, salt: str) -> bool:
    """Verifies a plain password against the stored hash and salt."""
    computed_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(computed_hash, hashed)

def init_db():
    """Initializes database schema, indexes, default templates, and seed administrator."""
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Teachers / Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mobile_number TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Teacher', -- 'Super Admin', 'Admin', 'Teacher'
        status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Inactive', 'Suspended'
        email TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # 2. Centres / Branches table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS centres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        contact_number TEXT,
        description TEXT,
        assigned_teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Archived'
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # 3. Teacher-Centre Assignments (for multiple centre access control)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS teacher_centre_assignments (
        teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        centre_id INTEGER NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
        assigned_at TEXT NOT NULL,
        PRIMARY KEY (teacher_id, centre_id)
    );
    """)

    # 4. Classes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Archived'
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # 5. Batches table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        centre_id INTEGER NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
        batch_timing TEXT NOT NULL,
        teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Archived'
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # 6. Students table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_name TEXT NOT NULL,
        class_id INTEGER NOT NULL REFERENCES classes(id),
        batch_id INTEGER NOT NULL REFERENCES batches(id),
        centre_id INTEGER NOT NULL REFERENCES centres(id),
        admission_date TEXT NOT NULL,
        monthly_fee REAL NOT NULL DEFAULT 0.0,
        due_date_day INTEGER NOT NULL DEFAULT 5, -- 1 to 31
        address TEXT,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Inactive', 'Archived'
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # 7. Student Parents table - STORED SEPARATELY AS REQUIRED
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS student_parents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
        father_name TEXT,
        father_mobile TEXT,
        father_whatsapp TEXT,
        mother_name TEXT,
        mother_mobile TEXT,
        mother_whatsapp TEXT,
        guardian_name TEXT,
        relationship TEXT NOT NULL DEFAULT 'Father', -- 'Father', 'Mother', 'Guardian', 'Other'
        primary_whatsapp TEXT NOT NULL,
        alternate_mobile TEXT,
        email TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # 8. Invoices table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        centre_id INTEGER NOT NULL REFERENCES centres(id),
        billing_month TEXT NOT NULL, -- e.g. "October 2026"
        fee_amount REAL NOT NULL,
        due_date TEXT NOT NULL, -- YYYY-MM-DD
        status TEXT NOT NULL DEFAULT 'Pending', -- 'Paid', 'Partially Paid', 'Pending', 'Overdue'
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # 9. Payments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_number TEXT UNIQUE NOT NULL,
        invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        amount_received REAL NOT NULL,
        payment_date TEXT NOT NULL, -- YYYY-MM-DD
        payment_method TEXT NOT NULL DEFAULT 'Cash', -- 'Cash', 'UPI', 'Bank Transfer', 'Other'
        transaction_reference TEXT,
        notes TEXT,
        recorded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'Successful', -- 'Successful', 'Cancelled', 'Reversed'
        created_at TEXT NOT NULL
    );
    """)

    # 10. Attendance table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        centre_id INTEGER NOT NULL REFERENCES centres(id),
        class_id INTEGER NOT NULL REFERENCES classes(id),
        batch_id INTEGER NOT NULL REFERENCES batches(id),
        attendance_date TEXT NOT NULL, -- YYYY-MM-DD
        status TEXT NOT NULL, -- 'Present', 'Absent'
        marked_by INTEGER REFERENCES users(id),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(student_id, attendance_date)
    );
    """)

    # 11. Tests table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        centre_id INTEGER NOT NULL REFERENCES centres(id),
        class_id INTEGER NOT NULL REFERENCES classes(id),
        batch_id INTEGER NOT NULL REFERENCES batches(id),
        subject TEXT NOT NULL,
        test_date TEXT NOT NULL, -- YYYY-MM-DD
        total_marks REAL NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TEXT NOT NULL
    );
    """)

    # 12. Test Results table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        marks_obtained REAL NOT NULL,
        rank INTEGER,
        remarks TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(test_id, student_id)
    );
    """)

    # 13. Reminder Logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reminder_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
        parent_name TEXT NOT NULL,
        phone_used TEXT NOT NULL,
        message_text TEXT NOT NULL,
        reminder_type TEXT NOT NULL DEFAULT 'Fee Pending', -- 'Fee Pending', 'Absence', 'Test Report', 'Custom'
        teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'Prepared', -- 'Prepared', 'WhatsApp Opened', 'Confirmed Sent', 'API Accepted', 'Delivered', 'Failed'
        created_at TEXT NOT NULL
    );
    """)

    # 14. Message Templates table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS message_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        template_type TEXT NOT NULL, -- 'fee_reminder', 'absence_alert', 'test_report', 'general'
        content TEXT NOT NULL,
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
    );
    """)

    # 15. Enquiries table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS enquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_name TEXT NOT NULL,
        parent_name TEXT NOT NULL,
        contact_number TEXT NOT NULL,
        class_id INTEGER REFERENCES classes(id),
        centre_id INTEGER REFERENCES centres(id),
        enquiry_date TEXT NOT NULL,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'New', -- 'New', 'Follow Up', 'Enrolled', 'Closed'
        created_at TEXT NOT NULL
    );
    """)

    # 16. Audit Logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER,
        details TEXT,
        ip_address TEXT,
        created_at TEXT NOT NULL
    );
    """)

    # 17. System Settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT
    );
    """)

    # 18. WhatsApp Official API Scaffolding table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS whatsapp_api_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        api_endpoint TEXT,
        phone_number_id TEXT,
        access_token TEXT,
        webhook_verify_token TEXT,
        status TEXT DEFAULT 'Unconfigured',
        updated_at TEXT
    );
    """)

    # 19. User Session Tokens table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
    );
    """)

    # Create indexes for high performance
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_students_centre ON students(centre_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_students_batch ON students(batch_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_student_parents_student ON student_parents(student_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_student_parents_phone ON student_parents(primary_whatsapp);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_invoices_student ON invoices(student_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date, batch_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tests_batch ON tests(batch_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reminder_logs_student ON reminder_logs(student_id);")

    # Seed Default Settings
    default_settings = [
        ("institute_name", "Apex Coaching Institute", "Institute Display Name"),
        ("institute_upi_id", "tuitionapp@icici", "Default UPI ID for Fee Collection"),
        ("institute_phone", "+91 98765 43210", "Institute Contact Number"),
        ("institute_address", "123 Education Hub, Sector 15, Knowledge Park", "Official Address"),
        ("current_academic_year", "2026-2027", "Academic Session"),
        ("allow_teacher_registration", "1", "Allow teachers to register directly"),
    ]
    for key, val, desc in default_settings:
        cursor.execute("INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?);", (key, val, desc))

    # Seed Default WhatsApp Templates
    default_templates = [
        (
            "Default Pending Fee Reminder (Hinglish)",
            "fee_reminder",
            "Namaste {{parent_name}} ji,\n\nAapke bachche {{student_name}} ki {{billing_month}} ki coaching fee abhi pending hai.\n\nStudent Details:\nClass: {{class_name}}\nBatch: {{batch_name}}\nCentre: {{centre_name}}\nPending Amount: ₹{{outstanding_amount}}\nDue Date: {{due_date}}\n\nKripya suvidha ke anusaar fee jama kar dein.\nUPI ID: {{upi_id}}\n\nDhanyavaad,\n{{institute_name}}",
            1
        ),
        (
            "Student Absence Alert (Hinglish)",
            "absence_alert",
            "Namaste {{parent_name}} ji,\n\nAapka bachcha {{student_name}} aaj ({{date}}) coaching class ({{batch_name}} - {{centre_name}}) mein absent hai.\n\nKripya anupsthiti ka kaaran saajha karein yadi avashyak ho.\n\nDhanyavaad,\n{{institute_name}}",
            1
        ),
        (
            "Weekly Sunday Test Report (Hinglish)",
            "test_report",
            "Namaste {{parent_name}} ji,\n\n{{student_name}} ka {{subject}} Weekly Test ka result:\n\nMarks Obtained: {{marks}} / {{total_marks}}\nBatch Rank: #{{rank}}\nTeacher Remarks: {{remarks}}\n\nHum aapke bachche ke behtar pradarshan ke liye lagataar prayasrat hain.\n\nDhanyavaad,\n{{institute_name}}",
            1
        ),
        (
            "Payment Receipt Confirmation",
            "payment_receipt",
            "Namaste {{parent_name}} ji,\n\n{{student_name}} ki fee prapt ho gayi hai.\n\nReceipt No: {{receipt_number}}\nAmount: ₹{{amount}}\nMonth: {{billing_month}}\nPayment Method: {{payment_method}}\nDate: {{date}}\n\nDhanyavaad,\n{{institute_name}}",
            1
        )
    ]
    for name, t_type, content, is_def in default_templates:
        cursor.execute("""
            INSERT OR IGNORE INTO message_templates (name, template_type, content, is_default, created_at)
            VALUES (?, ?, ?, ?, datetime('now'));
        """, (name, t_type, content, is_def))

    conn.commit()
    conn.close()

def seed_sample_data():
    """Seeds realistic production sample data if database is empty."""
    conn = get_connection()
    cursor = conn.cursor()

    # Check if users already exist
    cursor.execute("SELECT COUNT(*) FROM users;")
    if cursor.fetchone()[0] > 0:
        conn.close()
        return

    now = datetime.now().isoformat()

    # 1. Seed Super Admin, Admin, and Teachers
    teachers_data = [
        ("9876543210", "Dr. Rajesh Sharma", "Admin@1234", "Super Admin"),
        ("9811122233", "Pooja Verma", "Teacher@1234", "Admin"),
        ("9822233344", "Amitabh Sen", "Teacher@1234", "Teacher"),
        ("9833344455", "Sunita Rao", "Teacher@1234", "Teacher"),
    ]

    teacher_ids = {}
    for mobile, name, pwd, role in teachers_data:
        h, s = hash_password(pwd)
        cursor.execute("""
            INSERT INTO users (mobile_number, full_name, password_hash, salt, role, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'Active', ?, ?);
        """, (mobile, name, h, s, role, now, now))
        teacher_ids[mobile] = cursor.lastrowid

    # 2. Seed Coaching Centres
    centres_data = [
        ("Apex Main Campus", "Plot 12, South Extension Part 2, New Delhi", "011-24681357", "Main administrative coaching hub with 6 smart lecture halls", teacher_ids["9876543210"]),
        ("Apex West Branch", "B-45, Janakpuri District Centre, New Delhi", "011-25792468", "Secondary branch for Science and Mathematics batches", teacher_ids["9822233344"]),
        ("Apex Noida City Centre", "Tower C, Sector 62, Noida, Uttar Pradesh", "0120-4321098", "Noida branch catering to board exams and foundation courses", teacher_ids["9833344455"]),
    ]

    centre_ids = []
    for name, addr, phone, desc, assigned_t in centres_data:
        cursor.execute("""
            INSERT INTO centres (name, address, contact_number, description, assigned_teacher_id, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'Active', ?, ?);
        """, (name, addr, phone, desc, assigned_t, now, now))
        centre_ids.append(cursor.lastrowid)

    # Assign centres to teachers in teacher_centre_assignments
    cursor.execute("INSERT INTO teacher_centre_assignments VALUES (?, ?, ?);", (teacher_ids["9876543210"], centre_ids[0], now))
    cursor.execute("INSERT INTO teacher_centre_assignments VALUES (?, ?, ?);", (teacher_ids["9876543210"], centre_ids[1], now))
    cursor.execute("INSERT INTO teacher_centre_assignments VALUES (?, ?, ?);", (teacher_ids["9876543210"], centre_ids[2], now))
    cursor.execute("INSERT INTO teacher_centre_assignments VALUES (?, ?, ?);", (teacher_ids["9811122233"], centre_ids[0], now))
    cursor.execute("INSERT INTO teacher_centre_assignments VALUES (?, ?, ?);", (teacher_ids["9811122233"], centre_ids[1], now))
    cursor.execute("INSERT INTO teacher_centre_assignments VALUES (?, ?, ?);", (teacher_ids["9822233344"], centre_ids[1], now))
    cursor.execute("INSERT INTO teacher_centre_assignments VALUES (?, ?, ?);", (teacher_ids["9833344455"], centre_ids[2], now))

    # 3. Seed Classes
    classes_data = [
        ("Class 9", "Foundation Batch for CBSE & ICSE Class 9"),
        ("Class 10", "Board Preparation Batch for Class 10"),
        ("Class 11 - Science", "Physics, Chemistry, Mathematics & Biology"),
        ("Class 12 - Science", "Board & Competitive Examination Prep"),
    ]
    class_ids = []
    for c_name, c_desc in classes_data:
        cursor.execute("""
            INSERT INTO classes (name, description, status, created_at, updated_at)
            VALUES (?, ?, 'Active', ?, ?);
        """, (c_name, c_desc, now, now))
        class_ids.append(cursor.lastrowid)

    # 4. Seed Batches
    batches_data = [
        ("Morning Star - Class 10", class_ids[1], centre_ids[0], "07:00 AM - 08:30 AM", teacher_ids["9876543210"]),
        ("Evening Prodigy - Class 10", class_ids[1], centre_ids[0], "04:30 PM - 06:00 PM", teacher_ids["9811122233"]),
        ("Pinnacle 12 - Class 12", class_ids[3], centre_ids[1], "05:00 PM - 07:00 PM", teacher_ids["9822233344"]),
        ("Foundation 9 - Class 9", class_ids[0], centre_ids[2], "04:00 PM - 05:30 PM", teacher_ids["9833344455"]),
    ]
    batch_ids = []
    for b_name, c_id, ctr_id, timing, t_id in batches_data:
        cursor.execute("""
            INSERT INTO batches (name, class_id, centre_id, batch_timing, teacher_id, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'Active', ?, ?);
        """, (b_name, c_id, ctr_id, timing, t_id, now, now))
        batch_ids.append(cursor.lastrowid)

    # 5. Seed Students and Parents (Separate tables!)
    students_data = [
        {
            "student_name": "Aarav Sharma",
            "class_id": class_ids[1],
            "batch_id": batch_ids[0],
            "centre_id": centre_ids[0],
            "admission_date": "2026-04-10",
            "monthly_fee": 3500.0,
            "due_date_day": 5,
            "address": "Flat 402, Royal Residency, Saket, New Delhi",
            "notes": "Excellent in Mathematics, needs practice in Physics numericals.",
            # Parent details
            "father_name": "Manoj Sharma",
            "father_mobile": "9812345670",
            "father_whatsapp": "9812345670",
            "mother_name": "Suman Sharma",
            "mother_mobile": "9812345671",
            "mother_whatsapp": "9812345671",
            "guardian_name": "Manoj Sharma",
            "relationship": "Father",
            "primary_whatsapp": "9812345670",
            "alternate_mobile": "9812345671",
            "email": "manoj.sharma@example.com"
        },
        {
            "student_name": "Ananya Gupta",
            "class_id": class_ids[1],
            "batch_id": batch_ids[1],
            "centre_id": centre_ids[0],
            "admission_date": "2026-04-12",
            "monthly_fee": 3500.0,
            "due_date_day": 7,
            "address": "House 18, Block C, Greater Kailash 1, New Delhi",
            "notes": "Very attentive student, top ranker in monthly assessments.",
            # Parent details
            "father_name": "Sanjay Gupta",
            "father_mobile": "9823456781",
            "father_whatsapp": "9823456781",
            "mother_name": "Rekha Gupta",
            "mother_mobile": "9823456782",
            "mother_whatsapp": "9823456782",
            "guardian_name": "Rekha Gupta",
            "relationship": "Mother",
            "primary_whatsapp": "9823456782",
            "alternate_mobile": "9823456781",
            "email": "rekha.gupta@example.com"
        },
        {
            "student_name": "Rohan Patel",
            "class_id": class_ids[3],
            "batch_id": batch_ids[2],
            "centre_id": centre_ids[1],
            "admission_date": "2026-04-15",
            "monthly_fee": 4500.0,
            "due_date_day": 10,
            "address": "C-12, Vikaspuri, New Delhi",
            "notes": "Preparing for Engineering entrances.",
            # Parent details
            "father_name": "Kirit Patel",
            "father_mobile": "9834567892",
            "father_whatsapp": "9834567892",
            "mother_name": "Hansaben Patel",
            "mother_mobile": "",
            "mother_whatsapp": "",
            "guardian_name": "Kirit Patel",
            "relationship": "Father",
            "primary_whatsapp": "9834567892",
            "alternate_mobile": "",
            "email": "kiritpatel@example.com"
        },
        {
            "student_name": "Ishaani Mehra",
            "class_id": class_ids[0],
            "batch_id": batch_ids[3],
            "centre_id": centre_ids[2],
            "admission_date": "2026-05-01",
            "monthly_fee": 3000.0,
            "due_date_day": 5,
            "address": "E-99, Sector 50, Noida",
            "notes": "Consistent attendance, good command on English.",
            # Parent details
            "father_name": "Ramesh Mehra",
            "father_mobile": "9845678903",
            "father_whatsapp": "9845678903",
            "mother_name": "Neeta Mehra",
            "mother_mobile": "9845678904",
            "mother_whatsapp": "9845678904",
            "guardian_name": "Ramesh Mehra",
            "relationship": "Father",
            "primary_whatsapp": "9845678903",
            "alternate_mobile": "9845678904",
            "email": "ramesh.mehra@example.com"
        },
        {
            "student_name": "Kabir Das",
            "class_id": class_ids[1],
            "batch_id": batch_ids[0],
            "centre_id": centre_ids[0],
            "admission_date": "2026-06-10",
            "monthly_fee": 3500.0,
            "due_date_day": 5,
            "address": "34 Green Park, New Delhi",
            "notes": "Joined mid-session.",
            # Parent details
            "father_name": "Alok Das",
            "father_mobile": "9856789014",
            "father_whatsapp": "9856789014",
            "mother_name": "Bina Das",
            "mother_mobile": "",
            "mother_whatsapp": "",
            "guardian_name": "Alok Das",
            "relationship": "Father",
            "primary_whatsapp": "9856789014",
            "alternate_mobile": "",
            "email": "alok.das@example.com"
        }
    ]

    student_records = []
    for s in students_data:
        cursor.execute("""
            INSERT INTO students (student_name, class_id, batch_id, centre_id, admission_date, monthly_fee, due_date_day, address, notes, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?);
        """, (s["student_name"], s["class_id"], s["batch_id"], s["centre_id"], s["admission_date"], s["monthly_fee"], s["due_date_day"], s["address"], s["notes"], now, now))
        s_id = cursor.lastrowid
        student_records.append((s_id, s))

        # Insert Parent record in student_parents table
        cursor.execute("""
            INSERT INTO student_parents (student_id, father_name, father_mobile, father_whatsapp, mother_name, mother_mobile, mother_whatsapp, guardian_name, relationship, primary_whatsapp, alternate_mobile, email, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            s_id,
            s["father_name"],
            s["father_mobile"],
            s["father_whatsapp"],
            s["mother_name"],
            s["mother_mobile"],
            s["mother_whatsapp"],
            s["guardian_name"],
            s["relationship"],
            s["primary_whatsapp"],
            s["alternate_mobile"],
            s["email"],
            now,
            now
        ))

    # 6. Seed Invoices and Payments for Current & Prior Months
    # Today is in October 2026.
    # Student 1: Aarav Sharma - Paid September, Pending October (Due Oct 5, 2026 - Overdue 5+ days!)
    # Student 2: Ananya Gupta - Paid September, Paid October in full
    # Student 3: Rohan Patel - Pending October (Due Oct 30, 2026 - Due Today!)
    # Student 4: Ishaani Mehra - Partially paid October (Due Oct 28, 2026 - Overdue 1-4 days!)
    # Student 5: Kabir Das - Pending November (Due Nov 03, 2026 - Due within 5 days!)

    invoices_to_create = [
        # (student_idx, inv_no, month, amount, due_date, status, payment_amount, p_method)
        (0, "INV-2026-10-001", "October 2026", 3500.0, "2026-10-05", "Pending", 0.0, None),
        (1, "INV-2026-10-002", "October 2026", 3500.0, "2026-10-07", "Paid", 3500.0, "UPI"),
        (2, "INV-2026-10-003", "October 2026", 4500.0, "2026-10-30", "Pending", 0.0, None), # Due Today
        (3, "INV-2026-10-004", "October 2026", 3000.0, "2026-10-27", "Partially Paid", 1500.0, "Cash"), # Overdue 1-4 days
        (4, "INV-2026-11-005", "November 2026", 3500.0, "2026-11-03", "Pending", 0.0, None), # Due within 5 days
    ]

    for s_idx, inv_no, month, amount, due_date, inv_status, p_amt, p_method in invoices_to_create:
        s_id, s_data = student_records[s_idx]
        cursor.execute("""
            INSERT INTO invoices (invoice_number, student_id, centre_id, billing_month, fee_amount, due_date, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (inv_no, s_id, s_data["centre_id"], month, amount, due_date, inv_status, now, now))
        inv_id = cursor.lastrowid

        if p_amt > 0:
            rec_no = f"REC-{inv_no.replace('INV-', '')}"
            cursor.execute("""
                INSERT INTO payments (receipt_number, invoice_id, student_id, amount_received, payment_date, payment_method, transaction_reference, notes, recorded_by, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Successful', ?);
            """, (rec_no, inv_id, s_id, p_amt, "2026-10-10", p_method, "TXN123456789", "Tuition Fee Installment", teacher_ids["9876543210"], now))

    # 7. Seed Sample Attendance for Today (2026-10-30)
    for idx, (s_id, s_data) in enumerate(student_records):
        att_status = "Absent" if idx == 0 else "Present"
        cursor.execute("""
            INSERT OR IGNORE INTO attendance (student_id, centre_id, class_id, batch_id, attendance_date, status, marked_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, '2026-10-30', ?, ?, ?, ?);
        """, (s_id, s_data["centre_id"], s_data["class_id"], s_data["batch_id"], att_status, teacher_ids["9876543210"], now, now))

    # 8. Seed Sample Test and Results
    cursor.execute("""
        INSERT INTO tests (title, centre_id, class_id, batch_id, subject, test_date, total_marks, created_by, created_at)
        VALUES ('Class 10 Science Weekly Assessment #4', ?, ?, ?, 'Physics & Chemistry', '2026-10-25', 50.0, ?, ?);
    """, (centre_ids[0], class_ids[1], batch_ids[0], teacher_ids["9876543210"], now))
    test_id = cursor.lastrowid

    # Marks for Aarav Sharma & Kabir Das
    cursor.execute("""
        INSERT INTO test_results (test_id, student_id, marks_obtained, rank, remarks, created_at, updated_at)
        VALUES (?, ?, 44.5, 1, 'Top performer. Outstanding conceptual clarity in electricity problems.', ?, ?);
    """, (test_id, student_records[0][0], now, now))

    cursor.execute("""
        INSERT INTO test_results (test_id, student_id, marks_obtained, rank, remarks, created_at, updated_at)
        VALUES (?, ?, 38.0, 2, 'Good effort. Needs to work on chemical equation balance.', ?, ?);
    """, (test_id, student_records[4][0], now, now))

    # 9. Seed Sample Enquiries
    cursor.execute("""
        INSERT INTO enquiries (student_name, parent_name, contact_number, class_id, centre_id, enquiry_date, notes, status, created_at)
        VALUES ('Varun Khanna', 'Deepak Khanna', '9899112233', ?, ?, '2026-10-28', 'Interested in Class 10 weekend batch. Wants demo class.', 'New', ?);
    """, (class_ids[1], centre_ids[0], now))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    seed_sample_data()
    print("Database initialized and seeded successfully at:", DATABASE_PATH)
