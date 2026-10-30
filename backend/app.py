"""
Main Application Server for TUITIONAPP
Production-ready REST API & Static File Web Server using Python's robust ThreadingHTTPServer.
Requires zero external pip dependencies.
"""

import os
import sys
import json
import mimetypes
import urllib.parse
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import init_db, seed_sample_data, get_connection
from backend.auth import validate_session
from backend.routes import (
    auth_routes,
    dashboard_routes,
    student_routes,
    centre_routes,
    fee_routes,
    reminder_routes,
    attendance_routes,
    test_routes,
    admin_routes,
    api_routes
)

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")

class TuitionAppHandler(BaseHTTPRequestHandler):
    server_version = "TuitionApp/2.0"

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def _send_json(self, status_code: int, data: dict):
        body = json.dumps(data, indent=2, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def _get_auth_user(self) -> dict | None:
        """Extracts Bearer token from Authorization header and validates it."""
        auth_header = self.headers.get("Authorization", "")
        token = ""
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
        elif "token=" in self.headers.get("Cookie", ""):
            # Fallback to cookie
            for part in self.headers.get("Cookie", "").split(";"):
                if "token=" in part:
                    token = part.split("token=")[1].strip()
        if not token:
            return None
        return validate_session(token)

    def _read_json_body(self) -> dict:
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length == 0:
            return {}
        try:
            raw = self.rfile.read(content_length).decode("utf-8")
            return json.loads(raw)
        except Exception:
            return {}

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)
        flat_query = {k: v[0] for k, v in query.items()}

        # 1. API Endpoints
        if path.startswith("/api/"):
            # Public endpoints
            if path == "/api/whatsapp/webhook":
                code, resp = api_routes.handle_webhook_verification(flat_query)
                self.send_response(code)
                self.send_header("Content-Type", "text/plain")
                self.end_headers()
                self.wfile.write(resp.encode("utf-8"))
                return

            # Protected endpoints require auth
            user = self._get_auth_user()
            if not user and path not in ["/api/health"]:
                self._send_json(401, {"success": False, "message": "Authentication required. Please log in."})
                return

            if path == "/api/health":
                self._send_json(200, {"status": "ok", "time": datetime.now().isoformat()})
                return

            if path == "/api/auth/me":
                self._send_json(200, {"success": True, "user": user})
                return

            if path == "/api/dashboard/stats":
                data = dashboard_routes.get_dashboard_data(user)
                self._send_json(200, {"success": True, "data": data})
                return

            if path == "/api/students":
                res = student_routes.list_students(user, flat_query)
                self._send_json(200, {"success": True, "data": res})
                return

            if path.startswith("/api/students/") and path.count("/") == 3:
                try:
                    s_id = int(path.split("/")[3])
                    code, res = student_routes.get_student_profile(s_id, user)
                    self._send_json(code, res)
                except ValueError:
                    self._send_json(400, {"success": False, "message": "Invalid student ID."})
                return

            if path == "/api/centres":
                centres = centre_routes.list_centres(user)
                self._send_json(200, {"success": True, "centres": centres})
                return

            if path.startswith("/api/centres/") and path.count("/") == 3:
                try:
                    c_id = int(path.split("/")[3])
                    code, res = centre_routes.get_centre_dashboard(c_id, user)
                    self._send_json(code, res)
                except ValueError:
                    self._send_json(400, {"success": False, "message": "Invalid centre ID."})
                return

            if path == "/api/classes":
                classes = centre_routes.list_classes()
                self._send_json(200, {"success": True, "classes": classes})
                return

            if path == "/api/batches":
                batches = centre_routes.list_batches(
                    centre_id=flat_query.get("centre_id"),
                    class_id=flat_query.get("class_id")
                )
                self._send_json(200, {"success": True, "batches": batches})
                return

            if path == "/api/invoices":
                invoices = fee_routes.list_invoices(user, flat_query)
                self._send_json(200, {"success": True, "invoices": invoices})
                return

            if path.startswith("/api/payments/") and path.endswith("/receipt"):
                try:
                    p_id = int(path.split("/")[3])
                    code, res = fee_routes.get_payment_receipt(p_id)
                    self._send_json(code, res)
                except ValueError:
                    self._send_json(400, {"success": False, "message": "Invalid payment ID."})
                return

            if path == "/api/reminders/pending":
                category = flat_query.get("category", "All")
                data = reminder_routes.get_pending_reminders(user, category)
                self._send_json(200, {"success": True, "data": data})
                return

            if path == "/api/reminders/history":
                history = reminder_routes.get_reminder_history(user)
                self._send_json(200, {"success": True, "history": history})
                return

            if path == "/api/attendance":
                c_id = int(flat_query.get("centre_id", 0))
                cl_id = int(flat_query.get("class_id", 0))
                b_id = int(flat_query.get("batch_id", 0))
                att_date = flat_query.get("date", datetime.now().strftime("%Y-%m-%d"))
                code, res = attendance_routes.get_batch_attendance(c_id, cl_id, b_id, att_date, user)
                self._send_json(code, res)
                return

            if path == "/api/tests":
                tests = test_routes.list_tests(user, batch_id=flat_query.get("batch_id"))
                self._send_json(200, {"success": True, "tests": tests})
                return

            if path.startswith("/api/tests/") and path.count("/") == 3:
                try:
                    t_id = int(path.split("/")[3])
                    code, res = test_routes.get_test_details(t_id, user)
                    self._send_json(code, res)
                except ValueError:
                    self._send_json(400, {"success": False, "message": "Invalid test ID."})
                return

            if path == "/api/admin/overview":
                code, res = admin_routes.get_admin_overview(user)
                self._send_json(code, res)
                return

            if path == "/api/admin/teachers":
                code, res = admin_routes.list_teachers(user)
                self._send_json(code, res)
                return

            if path == "/api/admin/enquiries":
                enquiries = admin_routes.list_enquiries(user)
                self._send_json(200, {"success": True, "enquiries": enquiries})
                return

            if path == "/api/admin/settings":
                settings = admin_routes.get_settings(user)
                self._send_json(200, {"success": True, "settings": settings})
                return

            if path == "/api/whatsapp/config":
                status_info = api_routes.get_whatsapp_api_status(user)
                self._send_json(200, {"success": True, "config": status_info})
                return

            self._send_json(404, {"success": False, "message": f"Endpoint GET {path} not found."})
            return

        # 2. Serve Frontend Static Files
        self._serve_static_file(path)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self._read_json_body()

        # Public Auth routes
        if path == "/api/auth/login":
            client_ip = self.client_address[0] if self.client_address else ""
            code, res = auth_routes.handle_login(body, client_ip)
            self._send_json(code, res)
            return

        if path == "/api/auth/register":
            code, res = auth_routes.handle_register(body)
            self._send_json(code, res)
            return

        if path == "/api/auth/reset-password":
            code, res = auth_routes.handle_reset_password(body)
            self._send_json(code, res)
            return

        if path == "/api/whatsapp/webhook":
            code, res = api_routes.handle_webhook_event(body)
            self._send_json(code, res)
            return

        # Protected routes
        user = self._get_auth_user()
        if not user:
            self._send_json(401, {"success": False, "message": "Authentication required. Please log in."})
            return

        if path == "/api/auth/logout":
            auth_header = self.headers.get("Authorization", "")
            token = auth_header[7:].strip() if auth_header.startswith("Bearer ") else ""
            code, res = auth_routes.handle_logout(token)
            self._send_json(code, res)
            return

        if path == "/api/auth/change-password":
            code, res = auth_routes.handle_change_password(user, body)
            self._send_json(code, res)
            return

        if path == "/api/students":
            code, res = student_routes.add_student(body, user)
            self._send_json(code, res)
            return

        if path.startswith("/api/students/") and path.endswith("/archive"):
            s_id = int(path.split("/")[3])
            code, res = student_routes.archive_student(s_id, user)
            self._send_json(code, res)
            return

        if path.startswith("/api/students/") and path.endswith("/restore"):
            s_id = int(path.split("/")[3])
            code, res = student_routes.restore_student(s_id, user)
            self._send_json(code, res)
            return

        if path == "/api/centres":
            code, res = centre_routes.add_centre(body, user)
            self._send_json(code, res)
            return

        if path.startswith("/api/centres/") and path.endswith("/archive"):
            c_id = int(path.split("/")[3])
            code, res = centre_routes.archive_centre(c_id, user)
            self._send_json(code, res)
            return

        if path.startswith("/api/centres/") and path.endswith("/restore"):
            c_id = int(path.split("/")[3])
            code, res = centre_routes.restore_centre(c_id, user)
            self._send_json(code, res)
            return

        if path == "/api/classes":
            code, res = centre_routes.add_class(body, user)
            self._send_json(code, res)
            return

        if path == "/api/batches":
            code, res = centre_routes.add_batch(body, user)
            self._send_json(code, res)
            return

        if path == "/api/students/transfer":
            code, res = centre_routes.transfer_student(body, user)
            self._send_json(code, res)
            return

        if path == "/api/payments":
            code, res = fee_routes.record_payment(body, user)
            self._send_json(code, res)
            return

        if path == "/api/invoices/generate":
            code, res = fee_routes.generate_monthly_invoices(body, user)
            self._send_json(code, res)
            return

        if path == "/api/reminders/preview":
            inv_id = body.get("invoice_id")
            custom_tpl = body.get("custom_template")
            code, res = reminder_routes.prepare_single_reminder_preview(inv_id, user, custom_tpl)
            self._send_json(code, res)
            return

        if path == "/api/reminders/bulk-prepare":
            invoice_ids = body.get("invoice_ids", [])
            data = reminder_routes.prepare_bulk_reminder_queue(invoice_ids, user)
            self._send_json(200, {"success": True, "data": data})
            return

        if path == "/api/reminders/log-status":
            from backend.whatsapp import update_reminder_status
            log_id = body.get("log_id")
            new_status = body.get("status", "WhatsApp Opened")
            update_reminder_status(log_id, new_status)
            self._send_json(200, {"success": True, "message": "Status updated."})
            return

        if path == "/api/attendance/mark":
            code, res = attendance_routes.mark_batch_attendance(body, user)
            self._send_json(code, res)
            return

        if path == "/api/attendance/absence-preview":
            s_id = body.get("student_id")
            att_date = body.get("date", datetime.now().strftime("%Y-%m-%d"))
            code, res = attendance_routes.prepare_absence_alert(s_id, att_date, user)
            self._send_json(code, res)
            return

        if path == "/api/tests":
            code, res = test_routes.add_test(body, user)
            self._send_json(code, res)
            return

        if path.startswith("/api/tests/") and path.endswith("/marks"):
            t_id = int(path.split("/")[3])
            code, res = test_routes.save_test_marks(t_id, body.get("records", []), user)
            self._send_json(code, res)
            return

        if path.startswith("/api/tests/") and path.endswith("/parent-report"):
            t_id = int(path.split("/")[3])
            s_id = int(body.get("student_id"))
            code, res = test_routes.prepare_test_report_preview(t_id, s_id, user)
            self._send_json(code, res)
            return

        if path == "/api/admin/enquiries":
            code, res = admin_routes.add_enquiry(body, user)
            self._send_json(code, res)
            return

        if path.startswith("/api/admin/teachers/") and path.endswith("/assign-centres"):
            t_id = int(path.split("/")[4])
            code, res = admin_routes.assign_teacher_centres(t_id, body.get("centre_ids", []), user)
            self._send_json(code, res)
            return

        if path == "/api/whatsapp/config":
            code, res = api_routes.update_whatsapp_api_credentials(body, user)
            self._send_json(code, res)
            return

        self._send_json(404, {"success": False, "message": f"Endpoint POST {path} not found."})

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self._read_json_body()

        user = self._get_auth_user()
        if not user:
            self._send_json(401, {"success": False, "message": "Authentication required."})
            return

        if path.startswith("/api/students/") and path.endswith("/info"):
            s_id = int(path.split("/")[3])
            code, res = student_routes.update_student_info(s_id, body, user)
            self._send_json(code, res)
            return

        if path.startswith("/api/students/") and path.endswith("/parent"):
            s_id = int(path.split("/")[3])
            code, res = student_routes.update_parent_info(s_id, body, user)
            self._send_json(code, res)
            return

        if path.startswith("/api/students/") and path.endswith("/fee"):
            s_id = int(path.split("/")[3])
            code, res = student_routes.update_fee_info(s_id, body, user)
            self._send_json(code, res)
            return

        if path.startswith("/api/centres/") and path.count("/") == 3:
            c_id = int(path.split("/")[3])
            code, res = centre_routes.update_centre(c_id, body, user)
            self._send_json(code, res)
            return

        if path.startswith("/api/admin/teachers/") and path.endswith("/role"):
            t_id = int(path.split("/")[4])
            code, res = admin_routes.update_teacher_role(t_id, body, user)
            self._send_json(code, res)
            return

        if path == "/api/admin/settings":
            code, res = admin_routes.update_setting(body.get("key"), body.get("value"), user)
            self._send_json(code, res)
            return

        self._send_json(404, {"success": False, "message": f"Endpoint PUT {path} not found."})

    def _serve_static_file(self, req_path: str):
        clean_path = req_path.lstrip("/")
        if not clean_path or clean_path == "/":
            clean_path = "index.html"
            
        file_path = os.path.join(FRONTEND_DIR, clean_path)
        if not os.path.exists(file_path) or os.path.isdir(file_path):
            # Fallback to index.html for Single Page App routing
            file_path = os.path.join(FRONTEND_DIR, "index.html")

        if not os.path.exists(file_path):
            self.send_error(404, "File not found")
            return

        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type:
            mime_type = "text/html" if file_path.endswith(".html") else "application/octet-stream"

        try:
            with open(file_path, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", mime_type)
            self.send_header("Content-Length", str(len(content)))
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, f"Error reading file: {str(e)}")

def run_server(host: str = "0.0.0.0", port: int = 8080):
    init_db()
    seed_sample_data()
    server_address = (host, port)
    httpd = ThreadingHTTPServer(server_address, TuitionAppHandler)
    print(f"🚀 TUITIONAPP server running at http://{host}:{port}/")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server gracefully...")
        httpd.shutdown()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    run_server(port=port)
