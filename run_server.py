#!/usr/bin/env python3
"""
TUITIONAPP - Entry Point Script
Runs the coaching institute management system server.
"""

import os
import sys

# Ensure current directory is in PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.app import run_server

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    host = os.environ.get("HOST", "127.0.0.1")
    print("=" * 65)
    print("🎓 TUITIONAPP — Coaching Institute Management System")
    print("   Full Backend + Database + Payments + WhatsApp Integration")
    print(f"   Listening on: http://{host}:{port}")
    print("   Default Teacher Login: 9876543210 / Admin@1234")
    print("=" * 65)
    run_server(host=host, port=port)
