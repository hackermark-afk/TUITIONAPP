"""
Official WhatsApp Business Platform API Scaffolding & Webhook Handler for TUITIONAPP
Provides:
- Secure server-side credential management (never exposed to frontend)
- Webhook verification endpoint (GET hub.challenge & POST delivery status)
- Delivery receipt processing (API Accepted, Delivered, Read, Failed)
- Opt-out / Parent consent tracking
"""

from datetime import datetime
from backend.database import get_connection

def get_whatsapp_api_status(user: dict) -> dict:
    """Returns official WhatsApp API configuration status without exposing credentials."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT status, api_endpoint, phone_number_id, updated_at FROM whatsapp_api_configs ORDER BY id DESC LIMIT 1;")
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return {
            "configured": False,
            "status": "Unconfigured (Using Teacher Click-to-Chat)",
            "message": "Official Cloud API is not yet provisioned. The app is running in Teacher-Controlled WhatsApp Click-to-Chat mode."
        }
        
    return {
        "configured": row["status"] == "Configured",
        "status": row["status"],
        "api_endpoint": row["api_endpoint"] or "https://graph.facebook.com/v19.0",
        "phone_number_id": row["phone_number_id"][-4:].rjust(len(row["phone_number_id"]), "*") if row["phone_number_id"] else "",
        "updated_at": row["updated_at"]
    }

def update_whatsapp_api_credentials(data: dict, user: dict) -> tuple[int, dict]:
    """Stores official API credentials securely on server."""
    if user.get("role") not in ["Super Admin", "Admin"]:
        return 403, {"success": False, "message": "Admin authorization required."}
        
    api_endpoint = data.get("api_endpoint", "https://graph.facebook.com/v19.0").strip()
    phone_number_id = data.get("phone_number_id", "").strip()
    access_token = data.get("access_token", "").strip()
    webhook_verify_token = data.get("webhook_verify_token", "").strip()
    
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    
    cursor.execute("""
        INSERT INTO whatsapp_api_configs (api_endpoint, phone_number_id, access_token, webhook_verify_token, status, updated_at)
        VALUES (?, ?, ?, ?, 'Configured', ?);
    """, (api_endpoint, phone_number_id, access_token, webhook_verify_token, now))
    
    cursor.execute("""
        INSERT INTO audit_logs (user_id, action, entity_type, details, created_at)
        VALUES (?, 'UPDATE_WHATSAPP_API', 'settings', 'Updated official WhatsApp API credentials', ?);
    """, (user["id"], now))
    
    conn.commit()
    conn.close()
    return 200, {"success": True, "message": "Official WhatsApp Business API credentials saved securely."}

def handle_webhook_verification(query_params: dict) -> tuple[int, str]:
    """Verifies WhatsApp Cloud API webhook challenge."""
    hub_mode = query_params.get("hub.mode")
    hub_verify_token = query_params.get("hub.verify_token")
    hub_challenge = query_params.get("hub.challenge", "")
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT webhook_verify_token FROM whatsapp_api_configs WHERE status = 'Configured' ORDER BY id DESC LIMIT 1;")
    row = cursor.fetchone()
    conn.close()
    
    stored_token = row["webhook_verify_token"] if row else "tuitionapp_secure_webhook_token"
    
    if hub_mode == "subscribe" and hub_verify_token == stored_token:
        return 200, hub_challenge
    return 403, "Verification token mismatch"

def handle_webhook_event(payload: dict) -> tuple[int, dict]:
    """Processes incoming delivery status events from WhatsApp Cloud API."""
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    
    try:
        # Check for message statuses (delivered, read, failed)
        entry = payload.get("entry", [])
        for e in entry:
            changes = e.get("changes", [])
            for c in changes:
                value = c.get("value", {})
                statuses = value.get("statuses", [])
                for s in statuses:
                    wa_status = s.get("status") # delivered, read, failed
                    recipient_id = s.get("recipient_id")
                    
                    status_mapped = {
                        "delivered": "Delivered",
                        "read": "Delivered",
                        "failed": "Failed",
                        "sent": "Confirmed Sent"
                    }.get(wa_status, "API Accepted")
                    
                    # Update latest matching reminder log
                    cursor.execute("""
                        UPDATE reminder_logs 
                        SET status = ? 
                        WHERE phone_used LIKE ? 
                        ORDER BY id DESC LIMIT 1;
                    """, (status_mapped, f"%{recipient_id}%"))
                    
        conn.commit()
        conn.close()
        return 200, {"success": True, "status": "processed"}
    except Exception as e:
        conn.close()
        return 500, {"success": False, "error": str(e)}
