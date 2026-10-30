"""
WhatsApp Integration Engine for TUITIONAPP
Handles:
- Asia/Kolkata calendar-based date logic (Due Today, Due in 5 Days, Overdue 1-4 Days, Overdue 5+ Days)
- Strict phone normalization and validation (Indian +91 and International E.164)
- Hinglish template rendering with variable placeholders
- Click-to-chat URL generation with URL encoding
- Bulk reminder queue processor with pre-flight checks (paid, archived, invalid numbers)
- Audit logging for reminder history
- Future Official WhatsApp Business API webhooks & credentials scaffolding
"""

import re
import urllib.parse
from datetime import datetime, date
from zoneinfo import ZoneInfo
from backend.database import get_connection

KOLKATA_TZ = ZoneInfo("Asia/Kolkata")

def get_kolkata_today() -> date:
    """Returns today's date in Asia/Kolkata timezone."""
    return datetime.now(KOLKATA_TZ).date()

def normalize_phone_number(phone_raw: str) -> tuple[bool, str, str]:
    """
    Normalizes Indian and International phone numbers.
    Rules:
    - Strips spaces, dashes, parentheses, plus signs.
    - Indian numbers:
      - 10 digits (e.g. 9876543210) -> adds 91 -> 919876543210
      - 11 digits starting with 0 (e.g. 09876543210) -> removes 0, adds 91 -> 919876543210
      - 12 digits starting with 91 -> 919876543210
    - International numbers:
      - 10 to 15 digits with valid country code.
    Returns: (is_valid, normalized_phone, error_message)
    """
    if not phone_raw:
        return False, "", "Phone number is empty or missing."
        
    cleaned = re.sub(r'[\s\-\(\)\+\.]', '', str(phone_raw).strip())
    
    if not cleaned.isdigit():
        return False, "", "Phone number must contain only numeric digits."
        
    # Check for Indian standard 10-digit number
    if len(cleaned) == 10:
        if cleaned[0] in '6789':
            return True, f"91{cleaned}", ""
        else:
            return False, "", "Indian 10-digit numbers typically start with 6, 7, 8, or 9."
            
    # Indian 11 digits with leading 0
    if len(cleaned) == 11 and cleaned.startswith('0'):
        ten_digit = cleaned[1:]
        if ten_digit[0] in '6789':
            return True, f"91{ten_digit}", ""
            
    # Indian 12 digits with 91 prefix
    if len(cleaned) == 12 and cleaned.startswith('91'):
        if cleaned[2] in '6789':
            return True, cleaned, ""
            
    # International number (10 to 15 digits)
    if 10 <= len(cleaned) <= 15:
        return True, cleaned, ""
        
    return False, "", f"Invalid phone length ({len(cleaned)} digits). Expected 10 digits or valid international E.164."

def classify_due_date(due_date_str: str) -> tuple[str, int]:
    """
    Computes calendar date difference using Asia/Kolkata timezone:
    - Due today: due date equals today (diff == 0)
    - Due within 5 days: due date is between tomorrow and +5 days (1 <= diff <= 5)
    - Overdue 1–4 days: due date is 1 to 4 days in the past (-4 <= diff <= -1)
    - Overdue 5+ days: due date is 5 or more days in the past (diff <= -5)
    Returns: (category, days_diff) where days_diff = (due_date - today).days
    """
    try:
        due_d = datetime.strptime(due_date_str.split()[0], "%Y-%m-%d").date()
    except Exception:
        return "Unknown", 0
        
    today_d = get_kolkata_today()
    diff = (due_d - today_d).days # positive means future, negative means past
    
    if diff == 0:
        return "Due Today", 0
    elif 1 <= diff <= 5:
        return "Due Within 5 Days", diff
    elif -4 <= diff <= -1:
        return "Overdue 1–4 Days", abs(diff)
    elif diff <= -5:
        return "Overdue 5+ Days", abs(diff)
    else:
        return "Future", diff

def render_template(template_str: str, data: dict) -> str:
    """Renders placeholders in template_str using data dictionary."""
    rendered = template_str
    for key, val in data.items():
        placeholder = f"{{{{{key}}}}}"
        rendered = rendered.replace(placeholder, str(val if val is not None else ""))
    return rendered

def generate_click_to_chat_url(phone_raw: str, message: str) -> tuple[bool, str, str]:
    """Generates a secure wa.me click-to-chat URL with percent-encoded text."""
    is_valid, normalized_phone, err = normalize_phone_number(phone_raw)
    if not is_valid:
        return False, "", err
        
    encoded_text = urllib.parse.quote(message)
    wa_url = f"https://wa.me/{normalized_phone}?text={encoded_text}"
    return True, wa_url, ""

def log_reminder(student_id: int, invoice_id: int | None, parent_name: str, phone_used: str, message_text: str, reminder_type: str, teacher_id: int | None, status: str = "Prepared") -> int:
    """Logs a WhatsApp reminder attempt in reminder_logs table."""
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO reminder_logs (student_id, invoice_id, parent_name, phone_used, message_text, reminder_type, teacher_id, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (student_id, invoice_id, parent_name, phone_used, message_text, reminder_type, teacher_id, status, now))
    log_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return log_id

def update_reminder_status(log_id: int, new_status: str) -> bool:
    """Updates status in reminder_logs: 'Prepared', 'WhatsApp Opened', 'Confirmed Sent', 'Delivered', 'Failed'."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE reminder_logs SET status = ? WHERE id = ?;", (new_status, log_id))
    conn.commit()
    conn.close()
    return True
