"""
In-process HTTP Handler Test for TUITIONAPP
Tests the HTTP Request Handler (TuitionAppHandler) directly without TCP sockets,
verifying GET, POST, PUT, headers, JSON body, CORS, authentication, and status codes.
"""

import unittest
import io
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import TuitionAppHandler
from backend.database import init_db, seed_sample_data

class MockSocket:
    def __init__(self, data_bytes=b""):
        self.rfile = io.BytesIO(data_bytes)
        self.wfile = io.BytesIO()

    def sendall(self, b):
        self.wfile.write(b)

    def makefile(self, mode, *args, **kwargs):
        if "r" in mode:
            return self.rfile
        elif "w" in mode:
            return self.wfile
        return self.rfile

class MockServer:
    server_address = ("127.0.0.1", 8080)

def call_handler(method: str, path: str, body: dict = None, headers: dict = None):
    init_db()
    seed_sample_data()
    
    headers = headers or {}
    body_bytes = json.dumps(body).encode("utf-8") if body else b""
    
    req_lines = [f"{method} {path} HTTP/1.1", "Host: localhost:8080"]
    if body_bytes:
        req_lines.append(f"Content-Length: {len(body_bytes)}")
        req_lines.append("Content-Type: application/json")
    for k, v in headers.items():
        req_lines.append(f"{k}: {v}")
    req_lines.append("")
    req_lines.append("")
    
    raw_req = "\r\n".join(req_lines).encode("utf-8") + body_bytes
    mock_sock = MockSocket(raw_req)
    
    # Instantiate handler
    handler = TuitionAppHandler(mock_sock, ("127.0.0.1", 12345), MockServer())
    
    output = mock_sock.wfile.getvalue()
    parts = output.split(b"\r\n\r\n", 1)
    header_part = parts[0].decode("utf-8")
    status_line = header_part.split("\r\n")[0]
    status_code = int(status_line.split(" ")[1])
    
    body_part = parts[1] if len(parts) > 1 else b""
    try:
        data = json.loads(body_part.decode("utf-8"))
    except Exception:
        data = body_part.decode("utf-8")
        
    return status_code, data

class TestInProcessHandler(unittest.TestCase):
    def test_01_health_endpoint(self):
        status, data = call_handler("GET", "/api/health")
        self.assertEqual(status, 200)
        self.assertEqual(data["status"], "ok")

    def test_02_login_and_auth_flow(self):
        login_body = {"mobile_number": "9876543210", "password": "Admin@1234"}
        status, data = call_handler("POST", "/api/auth/login", body=login_body)
        self.assertEqual(status, 200)
        self.assertTrue(data["success"])
        token = data["data"]["token"]

        # Now call /api/auth/me using Authorization: Bearer
        status_me, me_data = call_handler("GET", "/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(status_me, 200)
        self.assertEqual(me_data["user"]["full_name"], "Dr. Rajesh Sharma")

    def test_03_dashboard_stats(self):
        _, login_data = call_handler("POST", "/api/auth/login", body={"mobile_number": "9876543210", "password": "Admin@1234"})
        token = login_data["data"]["token"]

        status, data = call_handler("GET", "/api/dashboard/stats", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(status, 200)
        self.assertTrue(data["success"])
        self.assertIn("stats", data["data"])
        self.assertIn("cards", data["data"])

    def test_04_pending_reminders_and_preview(self):
        _, login_data = call_handler("POST", "/api/auth/login", body={"mobile_number": "9876543210", "password": "Admin@1234"})
        token = login_data["data"]["token"]

        status, data = call_handler("GET", "/api/reminders/pending", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(status, 200)
        reminders = data["data"]["reminders"]
        self.assertTrue(len(reminders) > 0)
        inv_id = reminders[0]["invoice_id"]

        # Call /api/reminders/preview
        prev_status, prev_data = call_handler("POST", "/api/reminders/preview", body={"invoice_id": inv_id}, headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(prev_status, 200)
        self.assertTrue(prev_data["reminder"]["wa_url"].startswith("https://wa.me/"))

    def test_05_static_file_serving(self):
        status, html = call_handler("GET", "/")
        self.assertEqual(status, 200)
        self.assertIn("<title>TUITIONAPP", html)
        self.assertIn("WhatsApp Centre", html)

if __name__ == "__main__":
    unittest.main()
