"""
Authentication & Authorization Module for TUITIONAPP
Provides secure PBKDF2 password hashing with salt, session management,
and fine-grained role-based access control (Super Admin, Admin, Teacher).
"""

import secrets
from datetime import datetime, timedelta
from backend.database import get_connection, hash_password, verify_password

SESSION_EXPIRY_DAYS = 30

def create_session(user_id: int) -> str:
    """Generates a secure cryptographically random session token and stores it in database."""
    token = secrets.token_urlsafe(32)
    now = datetime.now()
    expires_at = (now + timedelta(days=SESSION_EXPIRY_DAYS)).isoformat()
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO sessions (token, user_id, created_at, expires_at)
        VALUES (?, ?, ?, ?);
    """, (token, user_id, now.isoformat(), expires_at))
    conn.commit()
    conn.close()
    return token

def validate_session(token: str) -> dict | None:
    """Validates session token and returns authenticated user info or None."""
    if not token:
        return None
        
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    
    cursor.execute("""
        SELECT s.token, s.expires_at, u.id, u.mobile_number, u.full_name, u.role, u.status, u.email
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ? AND s.expires_at > ? AND u.status = 'Active';
    """, (token, now))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return None
        
    user = {
        "id": row["id"],
        "mobile_number": row["mobile_number"],
        "full_name": row["full_name"],
        "role": row["role"],
        "status": row["status"],
        "email": row["email"],
    }
    
    # Also fetch assigned centres for the user
    cursor.execute("""
        SELECT centre_id FROM teacher_centre_assignments WHERE teacher_id = ?;
    """, (user["id"],))
    assigned_centres = [r[0] for r in cursor.fetchall()]
    user["assigned_centres"] = assigned_centres
    
    conn.close()
    return user

def destroy_session(token: str) -> bool:
    """Removes a session token (Logout)."""
    if not token:
        return True
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sessions WHERE token = ?;", (token,))
    conn.commit()
    conn.close()
    return True

def login_user(mobile_number: str, password: str, ip_address: str = "") -> tuple[bool, str, dict | None]:
    """Authenticates a user via mobile number and password."""
    clean_mobile = mobile_number.strip().replace(" ", "").replace("-", "")
    if clean_mobile.startswith("+91"):
        clean_mobile = clean_mobile[3:]
    elif clean_mobile.startswith("91") and len(clean_mobile) == 12:
        clean_mobile = clean_mobile[2:]
        
    if not clean_mobile or not password:
        return False, "Mobile number and password are required.", None
        
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, mobile_number, full_name, password_hash, salt, role, status
        FROM users WHERE mobile_number = ?;
    """, (clean_mobile,))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        return False, "Invalid mobile number or password.", None
        
    if user["status"] != "Active":
        conn.close()
        return False, "Your account is inactive or suspended. Please contact administrator.", None
        
    if not verify_password(password, user["password_hash"], user["salt"]):
        conn.close()
        return False, "Invalid mobile number or password.", None
        
    # Successful login
    token = create_session(user["id"])
    
    # Audit log
    now = datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, created_at)
        VALUES (?, 'LOGIN', 'users', ?, 'Teacher/Admin logged in successfully', ?, ?);
    """, (user["id"], user["id"], ip_address, now))
    conn.commit()
    
    cursor.execute("SELECT centre_id FROM teacher_centre_assignments WHERE teacher_id = ?;", (user["id"],))
    assigned = [r[0] for r in cursor.fetchall()]
    conn.close()
    
    user_data = {
        "id": user["id"],
        "token": token,
        "mobile_number": user["mobile_number"],
        "full_name": user["full_name"],
        "role": user["role"],
        "assigned_centres": assigned
    }
    return True, "Login successful.", user_data

def register_teacher(mobile_number: str, full_name: str, password: str, email: str = "", initial_role: str = "Teacher") -> tuple[bool, str, dict | None]:
    """Registers an authorized teacher account without plain-text passwords and prevents duplicates."""
    clean_mobile = mobile_number.strip().replace(" ", "").replace("-", "")
    if clean_mobile.startswith("+91"):
        clean_mobile = clean_mobile[3:]
    elif clean_mobile.startswith("91") and len(clean_mobile) == 12:
        clean_mobile = clean_mobile[2:]
        
    if len(clean_mobile) < 10 or not clean_mobile.isdigit():
        return False, "Please enter a valid 10-digit mobile number.", None
        
    if len(full_name.strip()) < 2:
        return False, "Please enter teacher full name.", None
        
    if len(password) < 6:
        return False, "Password must be at least 6 characters long.", None
        
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check registration permission setting
    cursor.execute("SELECT value FROM settings WHERE key = 'allow_teacher_registration';")
    setting = cursor.fetchone()
    allow_reg = setting["value"] if setting else "1"
    if allow_reg != "1":
        conn.close()
        return False, "Public teacher registration is currently disabled by administrator.", None
        
    # Check duplicate account
    cursor.execute("SELECT id FROM users WHERE mobile_number = ?;", (clean_mobile,))
    if cursor.fetchone():
        conn.close()
        return False, f"An account with mobile number {clean_mobile} already exists.", None
        
    now = datetime.now().isoformat()
    h, s = hash_password(password)
    role = initial_role if initial_role in ["Super Admin", "Admin", "Teacher"] else "Teacher"
    
    cursor.execute("""
        INSERT INTO users (mobile_number, full_name, password_hash, salt, role, status, email, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'Active', ?, ?, ?);
    """, (clean_mobile, full_name.strip(), h, s, role, email.strip(), now, now))
    user_id = cursor.lastrowid
    
    # By default, if teacher centres exist and teacher has no centre, assign to first active centre
    cursor.execute("SELECT id FROM centres WHERE status = 'Active' ORDER BY id ASC LIMIT 1;")
    first_centre = cursor.fetchone()
    if first_centre:
        cursor.execute("""
            INSERT OR IGNORE INTO teacher_centre_assignments (teacher_id, centre_id, assigned_at)
            VALUES (?, ?, ?);
        """, (user_id, first_centre["id"], now))
        
    cursor.execute("""
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, created_at)
        VALUES (?, 'REGISTER', 'users', ?, 'Teacher account registered', '', ?);
    """, (user_id, user_id, now))
    conn.commit()
    
    token = create_session(user_id)
    cursor.execute("SELECT centre_id FROM teacher_centre_assignments WHERE teacher_id = ?;", (user_id,))
    assigned = [r[0] for r in cursor.fetchall()]
    conn.close()
    
    return True, "Registration successful.", {
        "id": user_id,
        "token": token,
        "mobile_number": clean_mobile,
        "full_name": full_name.strip(),
        "role": role,
        "assigned_centres": assigned
    }

def reset_password(mobile_number: str, new_password: str) -> tuple[bool, str]:
    """Allows password recovery and password update."""
    clean_mobile = mobile_number.strip().replace(" ", "").replace("-", "")
    if clean_mobile.startswith("+91"):
        clean_mobile = clean_mobile[3:]
    elif clean_mobile.startswith("91") and len(clean_mobile) == 12:
        clean_mobile = clean_mobile[2:]
        
    if len(new_password) < 6:
        return False, "New password must be at least 6 characters long."
        
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE mobile_number = ? AND status = 'Active';", (clean_mobile,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        return False, "No active teacher found with this mobile number."
        
    now = datetime.now().isoformat()
    h, s = hash_password(new_password)
    cursor.execute("""
        UPDATE users SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?;
    """, (h, s, now, user["id"]))
    # Invalidate old sessions for safety
    cursor.execute("DELETE FROM sessions WHERE user_id = ?;", (user["id"],))
    
    cursor.execute("""
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, created_at)
        VALUES (?, 'PASSWORD_RESET', 'users', ?, 'Password changed/reset', '', ?);
    """, (user["id"], user["id"], now))
    conn.commit()
    conn.close()
    return True, "Password has been successfully reset. Please log in with your new password."

def check_permission(user: dict, required_centre_id: int | None = None) -> bool:
    """
    Fine-grained access control:
    Super Admin & Admin can access all centres.
    Teacher can only access their assigned centres.
    """
    if not user:
        return False
    if user.get("role") in ["Super Admin", "Admin"]:
        return True
    if required_centre_id is None:
        return True
    return int(required_centre_id) in user.get("assigned_centres", [])
