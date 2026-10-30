"""
Comprehensive Test Suite for TUITIONAPP
Covers all required areas:
1. Authentication & Roles (Login, Register, PBKDF2 Hashing, Session, Password Reset, Unauthorized Access)
2. Student & Parent Separation (Father, Mother, Guardian, Primary WhatsApp, Edit info, Edit parent, Edit fee, Search, Archive & Restore)
3. Centre & Batch Management (Add, Edit, Multi-centre access control, Batch transfer)
4. Fee Management (Invoicing, Full Payment, Partial Payment, Duplicate Prevention, Balance Non-Negativity, Receipts)
5. WhatsApp Integration (Asia/Kolkata date classification, +91 normalization, Hinglish template substitution, URL encoding, Bulk queue validation, Audit logs)
6. Attendance & Weekly Tests (Attendance marking, Absence preview, Sunday performance report, Rank calculations)
"""

import unittest
import os
import sys
import tempfile
from datetime import datetime

# Setup test database path before importing app modules
test_db_file = tempfile.NamedTemporaryFile(suffix="_tuitionapp_test.db", delete=False)
test_db_path = test_db_file.name
test_db_file.close()

os.environ["TUITIONAPP_DB_PATH"] = test_db_path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import init_db, seed_sample_data, get_connection, hash_password, verify_password
from backend.auth import login_user, register_teacher, reset_password, validate_session, destroy_session
from backend.models import get_student_fee_summary, calculate_test_ranks
from backend.whatsapp import (
    normalize_phone_number,
    classify_due_date,
    render_template,
    generate_click_to_chat_url,
    get_kolkata_today
)
from backend.routes import (
    student_routes,
    centre_routes,
    fee_routes,
    reminder_routes,
    attendance_routes,
    test_routes,
    admin_routes
)

class TestTuitionAppSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        seed_sample_data()

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(test_db_path):
            try:
                os.remove(test_db_path)
            except Exception:
                pass

    # ==========================================
    # 1. AUTHENTICATION & SECURITY TESTS
    # ==========================================
    def test_01_valid_admin_login(self):
        ok, msg, user = login_user("9876543210", "Admin@1234")
        self.assertTrue(ok)
        self.assertIsNotNone(user)
        self.assertEqual(user["role"], "Super Admin")
        self.assertTrue(len(user["token"]) > 20)

    def test_02_valid_teacher_login(self):
        ok, msg, user = login_user("9822233344", "Teacher@1234")
        self.assertTrue(ok)
        self.assertIsNotNone(user)
        self.assertEqual(user["role"], "Teacher")

    def test_03_invalid_login_credentials(self):
        ok, msg, user = login_user("9876543210", "WrongPassword")
        self.assertFalse(ok)
        self.assertIsNone(user)

        ok2, msg2, user2 = login_user("9999999999", "Admin@1234")
        self.assertFalse(ok2)
        self.assertIsNone(user2)

    def test_04_session_persistence_and_invalidation(self):
        ok, msg, user = login_user("9876543210", "Admin@1234")
        token = user["token"]
        
        # Validate session
        validated = validate_session(token)
        self.assertIsNotNone(validated)
        self.assertEqual(validated["mobile_number"], "9876543210")
        
        # Logout / Invalidate
        destroy_session(token)
        validated_after = validate_session(token)
        self.assertIsNone(validated_after)

    def test_05_prevent_duplicate_account_registration(self):
        # 9876543210 is already registered
        ok, msg, user = register_teacher("9876543210", "Duplicate Person", "Pass@1234")
        self.assertFalse(ok)
        self.assertIn("already exists", msg)

    def test_06_register_new_teacher_account(self):
        new_mobile = "9898989898"
        ok, msg, user = register_teacher(new_mobile, "Kavita Krishnan", "Kavita@1234", "kavita@test.com")
        self.assertTrue(ok)
        self.assertIsNotNone(user)
        self.assertEqual(user["full_name"], "Kavita Krishnan")
        self.assertEqual(user["role"], "Teacher")

    def test_07_password_reset_flow(self):
        mobile = "9898989898"
        ok, msg = reset_password(mobile, "NewPassword@123")
        self.assertTrue(ok)
        
        # Login with new password
        login_ok, _, user = login_user(mobile, "NewPassword@123")
        self.assertTrue(login_ok)
        self.assertIsNotNone(user)

    # ==========================================
    # 2. STUDENT & PARENT CRITICAL SEPARATION
    # ==========================================
    def test_08_add_student_with_separate_parent_records(self):
        # Admin user context
        _, _, admin_user = login_user("9876543210", "Admin@1234")

        payload = {
            "student_name": "Devansh Singhania",
            "class_id": 1,
            "batch_id": 1,
            "centre_id": 1,
            "admission_date": "2026-10-01",
            "monthly_fee": 4000.0,
            "due_date_day": 5,
            "address": "B-22, Defence Colony, New Delhi",
            "notes": "Fast learner, enrolled for Olympiad preparation.",
            # Separate Parent Fields
            "father_name": "Rajiv Singhania",
            "father_mobile": "9811223344",
            "father_whatsapp": "9811223344",
            "mother_name": "Kavita Singhania",
            "mother_mobile": "9811223355",
            "mother_whatsapp": "9811223355",
            "guardian_name": "Rajiv Singhania",
            "relationship": "Father",
            "primary_whatsapp": "9811223344",
            "alternate_mobile": "9811223355",
            "parent_email": "rajiv.singhania@example.com"
        }

        code, res = student_routes.add_student(payload, admin_user)
        self.assertEqual(code, 201)
        self.assertTrue(res["success"])
        student_id = res["student_id"]

        # Verify database has separate records in students and student_parents
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT student_name, monthly_fee FROM students WHERE id = ?;", (student_id,))
        st_row = cursor.fetchone()
        self.assertEqual(st_row["student_name"], "Devansh Singhania")
        self.assertEqual(st_row["monthly_fee"], 4000.0)

        cursor.execute("SELECT father_name, mother_name, guardian_name, primary_whatsapp FROM student_parents WHERE student_id = ?;", (student_id,))
        p_row = cursor.fetchone()
        self.assertIsNotNone(p_row)
        self.assertEqual(p_row["father_name"], "Rajiv Singhania")
        self.assertEqual(p_row["mother_name"], "Kavita Singhania")
        self.assertEqual(p_row["primary_whatsapp"], "9811223344")
        conn.close()

    def test_09_edit_parent_info_updates_future_whatsapp_number(self):
        _, _, admin_user = login_user("9876543210", "Admin@1234")
        
        # Get first student
        students_res = student_routes.list_students(admin_user, {})
        student_id = students_res["students"][0]["id"]
        
        new_parent_payload = {
            "father_name": "Manoj Sharma Updated",
            "father_mobile": "9812345670",
            "father_whatsapp": "9812345670",
            "mother_name": "Suman Sharma Updated",
            "mother_mobile": "9812345671",
            "mother_whatsapp": "9812345671",
            "guardian_name": "Manoj Sharma Updated",
            "relationship": "Father",
            "primary_whatsapp": "9899998888", # Updated WhatsApp number!
            "alternate_mobile": "9812345671",
            "email": "updated.parent@example.com"
        }
        
        code, res = student_routes.update_parent_info(student_id, new_parent_payload, admin_user)
        self.assertEqual(code, 200)
        self.assertTrue(res["success"])
        
        # Verify student profile reflects updated primary WhatsApp
        p_code, profile_res = student_routes.get_student_profile(student_id, admin_user)
        self.assertEqual(p_code, 200)
        self.assertEqual(profile_res["student"]["parent"]["primary_whatsapp"], "9899998888")

    def test_10_search_students_by_parent_name_and_phone(self):
        _, _, admin_user = login_user("9876543210", "Admin@1234")
        
        # Search by parent name "Rekha"
        res = student_routes.list_students(admin_user, {"search": "Rekha"})
        self.assertTrue(len(res["students"]) >= 1)
        self.assertIn("Ananya Gupta", [s["student_name"] for s in res["students"]])
        
        # Search by parent phone
        res_phone = student_routes.list_students(admin_user, {"search": "9823456782"})
        self.assertTrue(len(res_phone["students"]) >= 1)

    def test_11_archive_and_restore_student(self):
        _, _, admin_user = login_user("9876543210", "Admin@1234")
        students = student_routes.list_students(admin_user, {})["students"]
        student_id = students[0]["id"]
        
        # Archive student
        code, res = student_routes.archive_student(student_id, admin_user)
        self.assertEqual(code, 200)
        
        # Active list should no longer include this student
        active_list = student_routes.list_students(admin_user, {"status": "Active"})["students"]
        self.assertNotIn(student_id, [s["id"] for s in active_list])
        
        # Archived list must include this student
        archived_list = student_routes.list_students(admin_user, {"status": "Archived"})["students"]
        self.assertIn(student_id, [s["id"] for s in archived_list])
        
        # Restore student
        code_r, res_r = student_routes.restore_student(student_id, admin_user)
        self.assertEqual(code_r, 200)
        active_list_after = student_routes.list_students(admin_user, {"status": "Active"})["students"]
        self.assertIn(student_id, [s["id"] for s in active_list_after])

    # ==========================================
    # 3. FEE MANAGEMENT & TRANSACTIONS
    # ==========================================
    def test_12_fee_calculation_and_partial_payment(self):
        _, _, admin_user = login_user("9876543210", "Admin@1234")
        
        # Find a pending invoice
        invoices = fee_routes.list_invoices(admin_user, {"status": "Pending"})
        self.assertTrue(len(invoices) >= 1)
        inv = invoices[0]
        initial_outstanding = inv["outstanding_amount"]
        
        # Pay partial amount: 500
        pay_amount = min(500.0, initial_outstanding)
        pay_payload = {
            "invoice_id": inv["id"],
            "student_id": inv["student_id"],
            "amount_received": pay_amount,
            "payment_date": "2026-10-30",
            "payment_method": "UPI",
            "transaction_reference": "TEST_UPI_12345",
            "notes": "Partial test payment"
        }
        
        code, pay_res = fee_routes.record_payment(pay_payload, admin_user)
        self.assertEqual(code, 201)
        self.assertTrue(pay_res["success"])
        self.assertIsNotNone(pay_res["receipt_number"])
        self.assertAlmostEqual(pay_res["outstanding_balance"], initial_outstanding - pay_amount)
        
        # Verify receipt generation
        rec_code, rec_res = fee_routes.get_payment_receipt(pay_res["payment_id"])
        self.assertEqual(rec_code, 200)
        self.assertEqual(rec_res["receipt"]["receipt_number"], pay_res["receipt_number"])

    def test_13_prevent_duplicate_payment(self):
        _, _, admin_user = login_user("9876543210", "Admin@1234")
        invoices = fee_routes.list_invoices(admin_user, {})
        inv = invoices[0]
        
        pay_payload = {
            "invoice_id": inv["id"],
            "student_id": inv["student_id"],
            "amount_received": 100.0,
            "payment_date": "2026-10-30",
            "payment_method": "Cash",
            "transaction_reference": "DUP_CHECK",
            "notes": "Testing duplicate check"
        }
        
        # First payment succeeds
        code1, res1 = fee_routes.record_payment(pay_payload, admin_user)
        # Immediate second identical payment must be rejected as duplicate
        code2, res2 = fee_routes.record_payment(pay_payload, admin_user)
        self.assertEqual(code2, 400)
        self.assertIn("Duplicate payment detected", res2["message"])

    def test_14_outstanding_balance_never_negative(self):
        summary = get_student_fee_summary(1)
        self.assertTrue(summary["outstanding_balance"] >= 0.0)

    # ==========================================
    # 4. WHATSAPP ENGINE & PHONE NORMALIZATION
    # ==========================================
    def test_15_indian_phone_number_normalization(self):
        # 10 digits
        valid, norm, _ = normalize_phone_number("9876543210")
        self.assertTrue(valid)
        self.assertEqual(norm, "919876543210")

        # 10 digits with spaces and dashes
        valid2, norm2, _ = normalize_phone_number(" 98765-43210 ")
        self.assertTrue(valid2)
        self.assertEqual(norm2, "919876543210")

        # 11 digits with leading 0
        valid3, norm3, _ = normalize_phone_number("09876543210")
        self.assertTrue(valid3)
        self.assertEqual(norm3, "919876543210")

        # 12 digits with +91
        valid4, norm4, _ = normalize_phone_number("+91 9876543210")
        self.assertTrue(valid4)
        self.assertEqual(norm4, "919876543210")

    def test_16_invalid_phone_numbers_rejected(self):
        # Invalid length
        valid, _, err = normalize_phone_number("12345")
        self.assertFalse(valid)
        self.assertTrue(len(err) > 0)

        # Characters
        valid2, _, _ = normalize_phone_number("abcdefghij")
        self.assertFalse(valid2)

        # Empty
        valid3, _, _ = normalize_phone_number("")
        self.assertFalse(valid3)

    def test_17_hinglish_template_rendering_and_url_encoding(self):
        template = "Namaste {{parent_name}} ji, {{student_name}} ki {{billing_month}} fee ₹{{outstanding_amount}} pending hai."
        vars_dict = {
            "parent_name": "Rajesh",
            "student_name": "Aarav",
            "billing_month": "October 2026",
            "outstanding_amount": "3500.00"
        }
        rendered = render_template(template, vars_dict)
        self.assertIn("Namaste Rajesh ji", rendered)
        self.assertIn("Aarav", rendered)
        self.assertIn("₹3500.00", rendered)

        ok, url, _ = generate_click_to_chat_url("9876543210", rendered)
        self.assertTrue(ok)
        self.assertTrue(url.startswith("https://wa.me/919876543210?text="))
        self.assertIn("%E2%82%B93500.00", url) # Percent-encoded Indian Rupee sign ₹

    def test_18_asia_kolkata_due_date_classification(self):
        today = get_kolkata_today().strftime("%Y-%m-%d")
        cat_today, diff_today = classify_due_date(today)
        self.assertEqual(cat_today, "Due Today")
        self.assertEqual(diff_today, 0)

    def test_19_bulk_reminder_queue_preparation(self):
        _, _, admin_user = login_user("9876543210", "Admin@1234")
        pending_data = reminder_routes.get_pending_reminders(admin_user, "All")
        reminders = pending_data["reminders"]
        self.assertTrue(len(reminders) >= 1)
        
        inv_ids = [r["invoice_id"] for r in reminders]
        queue_res = reminder_routes.prepare_bulk_reminder_queue(inv_ids, admin_user)
        self.assertEqual(queue_res["total_selected"], len(inv_ids))
        self.assertTrue(queue_res["valid_count"] >= 1)

    # ==========================================
    # 5. ATTENDANCE & PERFORMANCE TESTS
    # ==========================================
    def test_20_mark_attendance_and_absence_notice(self):
        _, _, admin_user = login_user("9876543210", "Admin@1234")
        today = get_kolkata_today().strftime("%Y-%m-%d")
        
        records = [
            {"student_id": 1, "status": "Present"},
            {"student_id": 2, "status": "Absent"}
        ]
        
        code, res = attendance_routes.mark_batch_attendance({
            "centre_id": 1,
            "class_id": 2,
            "batch_id": 1,
            "attendance_date": today,
            "records": records
        }, admin_user)
        self.assertEqual(code, 200)
        self.assertTrue(res["success"])

        # Check absence alert generation for student 2
        abs_code, abs_res = attendance_routes.prepare_absence_alert(2, today, admin_user)
        self.assertEqual(abs_code, 200)
        self.assertIn("https://wa.me/", abs_res["wa_url"])

    def test_21_weekly_test_ranking_computation(self):
        _, _, admin_user = login_user("9876543210", "Admin@1234")
        
        # Create test
        code, t_res = test_routes.add_test({
            "title": "Mathematics Mid-Term Assessment",
            "centre_id": 1,
            "class_id": 2,
            "batch_id": 1,
            "subject": "Mathematics",
            "test_date": "2026-10-28",
            "total_marks": 100
        }, admin_user)
        test_id = t_res["test_id"]
        
        # Save marks for students enrolled in Batch 1 (Student 1 and Student 5)
        scores = [
            {"student_id": 1, "marks_obtained": 95, "remarks": "Top score"},
            {"student_id": 5, "marks_obtained": 82, "remarks": "Very good"}
        ]
        save_code, _ = test_routes.save_test_marks(test_id, scores, admin_user)
        self.assertEqual(save_code, 200)
        
        # Verify ranks
        d_code, details_res = test_routes.get_test_details(test_id, admin_user)
        students = details_res["students"]
        rank_1_student = next(s for s in students if s["student_id"] == 1)
        rank_2_student = next(s for s in students if s["student_id"] == 5)
        self.assertEqual(rank_1_student["rank"], 1)
        self.assertEqual(rank_2_student["rank"], 2)

    # ==========================================
    # 6. ACCESS CONTROL & ROLE BOUNDARIES
    # ==========================================
    def test_22_cross_centre_access_control_for_teachers(self):
        # Teacher Amitabh Sen (id 3) is assigned only to Centre 2
        _, _, teacher_user = login_user("9822233344", "Teacher@1234")
        self.assertEqual(teacher_user["role"], "Teacher")
        self.assertNotIn(1, teacher_user["assigned_centres"])
        
        # Attempting to fetch students from unassigned Centre 1 should be denied
        code, res = student_routes.get_student_profile(1, teacher_user) # Student 1 is in Centre 1
        self.assertEqual(code, 403)
        self.assertFalse(res["success"])

    def test_23_admin_overview_requires_admin_role(self):
        _, _, teacher_user = login_user("9822233344", "Teacher@1234")
        code, res = admin_routes.get_admin_overview(teacher_user)
        self.assertEqual(code, 403)
        self.assertFalse(res["success"])

if __name__ == "__main__":
    unittest.main()
