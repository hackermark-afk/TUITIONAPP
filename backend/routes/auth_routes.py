"""
Authentication routes for TUITIONAPP
"""

from backend.database import get_connection, hash_password, verify_password
from backend.auth import login_user, register_teacher, reset_password, destroy_session

def handle_login(data: dict, ip_address: str = "") -> tuple[int, dict]:
    mobile = data.get("mobile_number", "")
    password = data.get("password", "")
    ok, msg, user_data = login_user(mobile, password, ip_address)
    if not ok:
        return 400, {"success": False, "message": msg}
    return 200, {"success": True, "message": msg, "data": user_data}

def handle_register(data: dict) -> tuple[int, dict]:
    mobile = data.get("mobile_number", "")
    name = data.get("full_name", "")
    password = data.get("password", "")
    email = data.get("email", "")
    ok, msg, user_data = register_teacher(mobile, name, password, email)
    if not ok:
        return 400, {"success": False, "message": msg}
    return 201, {"success": True, "message": msg, "data": user_data}

def handle_logout(token: str) -> tuple[int, dict]:
    destroy_session(token)
    return 200, {"success": True, "message": "Logged out successfully."}

def handle_reset_password(data: dict) -> tuple[int, dict]:
    mobile = data.get("mobile_number", "")
    new_password = data.get("new_password", "")
    ok, msg = reset_password(mobile, new_password)
    if not ok:
        return 400, {"success": False, "message": msg}
    return 200, {"success": True, "message": msg}

def handle_change_password(user: dict, data: dict) -> tuple[int, dict]:
    old_pwd = data.get("old_password", "")
    new_pwd = data.get("new_password", "")
    if len(new_pwd) < 6:
        return 400, {"success": False, "message": "New password must be at least 6 characters long."}
        
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT password_hash, salt FROM users WHERE id = ?;", (user["id"],))
    u = cursor.fetchone()
    if not u or not verify_password(old_pwd, u["password_hash"], u["salt"]):
        conn.close()
        return 400, {"success": False, "message": "Current password does not match."}
        
    h, s = hash_password(new_pwd)
    cursor.execute("UPDATE users SET password_hash = ?, salt = ?, updated_at = datetime('now') WHERE id = ?;", (h, s, user["id"]))
    conn.commit()
    conn.close()
    return 200, {"success": True, "message": "Password changed successfully."}
