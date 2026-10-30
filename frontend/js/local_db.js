/**
 * TUITIONAPP — Embedded In-App Database Engine
 * Allows the Android APK to run standalone on ANY phone without connecting to a computer or server.
 */

const LocalDB = {
  STORAGE_KEY: "tuitionapp_local_db_v2",
  INITIAL_DATA: {
  "users": [
    {
      "id": 1,
      "mobile_number": "9876543210",
      "full_name": "Dr. Rajesh Sharma",
      "password_hash": "b0d206250007cefb05910ebed37d653e226dd163bb81e952500688424ee6b4dd",
      "salt": "c14014027ee505585349d4b40f7a707c",
      "role": "Super Admin",
      "status": "Active",
      "email": null,
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 2,
      "mobile_number": "9811122233",
      "full_name": "Pooja Verma",
      "password_hash": "b4dc860efd7f4c29827b3ddb645b8a718103c5511a4d4723ac9eb53e8185bf84",
      "salt": "361f75f3d26b46b5cfd1cb8786057750",
      "role": "Admin",
      "status": "Active",
      "email": null,
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 3,
      "mobile_number": "9822233344",
      "full_name": "Amitabh Sen",
      "password_hash": "3fa42d980dbf20b004c26f07e1c6cd7ad648c63b93f0b8682bd53d2865ea62cd",
      "salt": "4faf512c02ce51d6cb6629e54c0ef5c8",
      "role": "Teacher",
      "status": "Active",
      "email": null,
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 4,
      "mobile_number": "9833344455",
      "full_name": "Sunita Rao",
      "password_hash": "f6f7c59b8de19c7cf9a6efeea1521a9c0716aed6d57dd969c332f68f7de07958",
      "salt": "50514aaf20fd643e40d3587047173c7e",
      "role": "Teacher",
      "status": "Active",
      "email": null,
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    }
  ],
  "centres": [
    {
      "id": 1,
      "name": "Apex Main Campus",
      "address": "Plot 12, South Extension Part 2, New Delhi",
      "contact_number": "011-24681357",
      "description": "Main administrative coaching hub with 6 smart lecture halls",
      "assigned_teacher_id": 1,
      "status": "Active",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 2,
      "name": "Apex West Branch",
      "address": "B-45, Janakpuri District Centre, New Delhi",
      "contact_number": "011-25792468",
      "description": "Secondary branch for Science and Mathematics batches",
      "assigned_teacher_id": 3,
      "status": "Active",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 3,
      "name": "Apex Noida City Centre",
      "address": "Tower C, Sector 62, Noida, Uttar Pradesh",
      "contact_number": "0120-4321098",
      "description": "Noida branch catering to board exams and foundation courses",
      "assigned_teacher_id": 4,
      "status": "Active",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    }
  ],
  "teacher_centre_assignments": [
    {
      "teacher_id": 1,
      "centre_id": 1,
      "assigned_at": "2026-10-30T08:26:23.646219"
    },
    {
      "teacher_id": 1,
      "centre_id": 2,
      "assigned_at": "2026-10-30T08:26:23.646219"
    },
    {
      "teacher_id": 1,
      "centre_id": 3,
      "assigned_at": "2026-10-30T08:26:23.646219"
    },
    {
      "teacher_id": 2,
      "centre_id": 1,
      "assigned_at": "2026-10-30T08:26:23.646219"
    },
    {
      "teacher_id": 2,
      "centre_id": 2,
      "assigned_at": "2026-10-30T08:26:23.646219"
    },
    {
      "teacher_id": 3,
      "centre_id": 2,
      "assigned_at": "2026-10-30T08:26:23.646219"
    },
    {
      "teacher_id": 4,
      "centre_id": 3,
      "assigned_at": "2026-10-30T08:26:23.646219"
    }
  ],
  "classes": [
    {
      "id": 1,
      "name": "Class 9",
      "description": "Foundation Batch for CBSE & ICSE Class 9",
      "status": "Active",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 2,
      "name": "Class 10",
      "description": "Board Preparation Batch for Class 10",
      "status": "Active",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 3,
      "name": "Class 11 - Science",
      "description": "Physics, Chemistry, Mathematics & Biology",
      "status": "Active",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 4,
      "name": "Class 12 - Science",
      "description": "Board & Competitive Examination Prep",
      "status": "Active",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    }
  ],
  "batches": [
    {
      "id": 1,
      "name": "Morning Star - Class 10",
      "class_id": 2,
      "centre_id": 1,
      "batch_timing": "07:00 AM - 08:30 AM",
      "teacher_id": 1,
      "status": "Active",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 2,
      "name": "Evening Prodigy - Class 10",
      "class_id": 2,
      "centre_id": 1,
      "batch_timing": "04:30 PM - 06:00 PM",
      "teacher_id": 2,
      "status": "Active",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 3,
      "name": "Pinnacle 12 - Class 12",
      "class_id": 4,
      "centre_id": 2,
      "batch_timing": "05:00 PM - 07:00 PM",
      "teacher_id": 3,
      "status": "Active",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 4,
      "name": "Foundation 9 - Class 9",
      "class_id": 1,
      "centre_id": 3,
      "batch_timing": "04:00 PM - 05:30 PM",
      "teacher_id": 4,
      "status": "Active",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    }
  ],
  "students": [
    {
      "id": 1,
      "student_name": "Aarav Sharma",
      "class_id": 2,
      "batch_id": 1,
      "centre_id": 1,
      "admission_date": "2026-04-10",
      "monthly_fee": 3500.0,
      "due_date_day": 5,
      "address": "Flat 402, Royal Residency, Saket, New Delhi",
      "notes": "Excellent in Mathematics, needs practice in Physics numericals.",
      "status": "Active",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 2,
      "student_name": "Ananya Gupta",
      "class_id": 2,
      "batch_id": 2,
      "centre_id": 1,
      "admission_date": "2026-04-12",
      "monthly_fee": 3500.0,
      "due_date_day": 7,
      "address": "House 18, Block C, Greater Kailash 1, New Delhi",
      "notes": "Very attentive student, top ranker in monthly assessments.",
      "status": "Active",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 3,
      "student_name": "Rohan Patel",
      "class_id": 4,
      "batch_id": 3,
      "centre_id": 2,
      "admission_date": "2026-04-15",
      "monthly_fee": 4500.0,
      "due_date_day": 10,
      "address": "C-12, Vikaspuri, New Delhi",
      "notes": "Preparing for Engineering entrances.",
      "status": "Active",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 4,
      "student_name": "Ishaani Mehra",
      "class_id": 1,
      "batch_id": 4,
      "centre_id": 3,
      "admission_date": "2026-05-01",
      "monthly_fee": 3000.0,
      "due_date_day": 5,
      "address": "E-99, Sector 50, Noida",
      "notes": "Consistent attendance, good command on English.",
      "status": "Active",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 5,
      "student_name": "Kabir Das",
      "class_id": 2,
      "batch_id": 1,
      "centre_id": 1,
      "admission_date": "2026-06-10",
      "monthly_fee": 3500.0,
      "due_date_day": 5,
      "address": "34 Green Park, New Delhi",
      "notes": "Joined mid-session.",
      "status": "Active",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    }
  ],
  "student_parents": [
    {
      "id": 1,
      "student_id": 1,
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
      "email": "manoj.sharma@example.com",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 2,
      "student_id": 2,
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
      "email": "rekha.gupta@example.com",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 3,
      "student_id": 3,
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
      "email": "kiritpatel@example.com",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 4,
      "student_id": 4,
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
      "email": "ramesh.mehra@example.com",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 5,
      "student_id": 5,
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
      "email": "alok.das@example.com",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    }
  ],
  "invoices": [
    {
      "id": 1,
      "invoice_number": "INV-2026-10-001",
      "student_id": 1,
      "centre_id": 1,
      "billing_month": "October 2026",
      "fee_amount": 3500.0,
      "due_date": "2026-10-05",
      "status": "Pending",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 2,
      "invoice_number": "INV-2026-10-002",
      "student_id": 2,
      "centre_id": 1,
      "billing_month": "October 2026",
      "fee_amount": 3500.0,
      "due_date": "2026-10-07",
      "status": "Paid",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 3,
      "invoice_number": "INV-2026-10-003",
      "student_id": 3,
      "centre_id": 2,
      "billing_month": "October 2026",
      "fee_amount": 4500.0,
      "due_date": "2026-10-30",
      "status": "Pending",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 4,
      "invoice_number": "INV-2026-10-004",
      "student_id": 4,
      "centre_id": 3,
      "billing_month": "October 2026",
      "fee_amount": 3000.0,
      "due_date": "2026-10-27",
      "status": "Partially Paid",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 5,
      "invoice_number": "INV-2026-11-005",
      "student_id": 5,
      "centre_id": 1,
      "billing_month": "November 2026",
      "fee_amount": 3500.0,
      "due_date": "2026-11-03",
      "status": "Pending",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    }
  ],
  "payments": [
    {
      "id": 1,
      "receipt_number": "REC-2026-10-002",
      "invoice_id": 2,
      "student_id": 2,
      "amount_received": 3500.0,
      "payment_date": "2026-10-10",
      "payment_method": "UPI",
      "transaction_reference": "TXN123456789",
      "notes": "Tuition Fee Installment",
      "recorded_by": 1,
      "status": "Successful",
      "created_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 2,
      "receipt_number": "REC-2026-10-004",
      "invoice_id": 4,
      "student_id": 4,
      "amount_received": 1500.0,
      "payment_date": "2026-10-10",
      "payment_method": "Cash",
      "transaction_reference": "TXN123456789",
      "notes": "Tuition Fee Installment",
      "recorded_by": 1,
      "status": "Successful",
      "created_at": "2026-10-30T08:26:23.646219"
    }
  ],
  "attendance": [
    {
      "id": 1,
      "student_id": 1,
      "centre_id": 1,
      "class_id": 2,
      "batch_id": 1,
      "attendance_date": "2026-10-30",
      "status": "Absent",
      "marked_by": 1,
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 2,
      "student_id": 2,
      "centre_id": 1,
      "class_id": 2,
      "batch_id": 2,
      "attendance_date": "2026-10-30",
      "status": "Present",
      "marked_by": 1,
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 3,
      "student_id": 3,
      "centre_id": 2,
      "class_id": 4,
      "batch_id": 3,
      "attendance_date": "2026-10-30",
      "status": "Present",
      "marked_by": 1,
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 4,
      "student_id": 4,
      "centre_id": 3,
      "class_id": 1,
      "batch_id": 4,
      "attendance_date": "2026-10-30",
      "status": "Present",
      "marked_by": 1,
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 5,
      "student_id": 5,
      "centre_id": 1,
      "class_id": 2,
      "batch_id": 1,
      "attendance_date": "2026-10-30",
      "status": "Present",
      "marked_by": 1,
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    }
  ],
  "tests": [
    {
      "id": 1,
      "title": "Class 10 Science Weekly Assessment #4",
      "centre_id": 1,
      "class_id": 2,
      "batch_id": 1,
      "subject": "Physics & Chemistry",
      "test_date": "2026-10-25",
      "total_marks": 50.0,
      "created_by": 1,
      "created_at": "2026-10-30T08:26:23.646219"
    }
  ],
  "test_results": [
    {
      "id": 1,
      "test_id": 1,
      "student_id": 1,
      "marks_obtained": 44.5,
      "rank": 1,
      "remarks": "Top performer. Outstanding conceptual clarity in electricity problems.",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    },
    {
      "id": 2,
      "test_id": 1,
      "student_id": 5,
      "marks_obtained": 38.0,
      "rank": 2,
      "remarks": "Good effort. Needs to work on chemical equation balance.",
      "created_at": "2026-10-30T08:26:23.646219",
      "updated_at": "2026-10-30T08:26:23.646219"
    }
  ],
  "reminder_logs": [
    {
      "id": 1,
      "student_id": 1,
      "invoice_id": 1,
      "parent_name": "Manoj Sharma",
      "phone_used": "919812345670",
      "message_text": "Namaste Manoj Sharma ji,\n\nAapke bachche Aarav Sharma ki October 2026 ki coaching fee abhi pending hai.\n\nStudent Details:\nClass: Class 10\nBatch: Morning Star - Class 10\nCentre: Apex Main Campus\nPending Amount: \u20b93500.00\nDue Date: 2026-10-05\n\nKripya suvidha ke anusaar fee jama kar dein.\nUPI ID: tuitionapp@icici\n\nDhanyavaad,\nApex Coaching Institute",
      "reminder_type": "Fee Pending",
      "teacher_id": 1,
      "status": "Prepared",
      "created_at": "2026-10-30T09:00:04.728513"
    },
    {
      "id": 2,
      "student_id": 1,
      "invoice_id": 1,
      "parent_name": "Manoj Sharma",
      "phone_used": "919812345670",
      "message_text": "Namaste Manoj Sharma ji,\n\nAapke bachche Aarav Sharma ki October 2026 ki coaching fee abhi pending hai.\n\nStudent Details:\nClass: Class 10\nBatch: Morning Star - Class 10\nCentre: Apex Main Campus\nPending Amount: \u20b93500.00\nDue Date: 2026-10-05\n\nKripya suvidha ke anusaar fee jama kar dein.\nUPI ID: tuitionapp@icici\n\nDhanyavaad,\nApex Coaching Institute",
      "reminder_type": "Fee Pending",
      "teacher_id": 1,
      "status": "Prepared",
      "created_at": "2026-10-30T09:00:28.762919"
    }
  ],
  "message_templates": [
    {
      "id": 1,
      "name": "Default Pending Fee Reminder (Hinglish)",
      "template_type": "fee_reminder",
      "content": "Namaste {{parent_name}} ji,\n\nAapke bachche {{student_name}} ki {{billing_month}} ki coaching fee abhi pending hai.\n\nStudent Details:\nClass: {{class_name}}\nBatch: {{batch_name}}\nCentre: {{centre_name}}\nPending Amount: \u20b9{{outstanding_amount}}\nDue Date: {{due_date}}\n\nKripya suvidha ke anusaar fee jama kar dein.\nUPI ID: {{upi_id}}\n\nDhanyavaad,\n{{institute_name}}",
      "is_default": 1,
      "created_at": "2026-10-30 02:56:23"
    },
    {
      "id": 2,
      "name": "Student Absence Alert (Hinglish)",
      "template_type": "absence_alert",
      "content": "Namaste {{parent_name}} ji,\n\nAapka bachcha {{student_name}} aaj ({{date}}) coaching class ({{batch_name}} - {{centre_name}}) mein absent hai.\n\nKripya anupsthiti ka kaaran saajha karein yadi avashyak ho.\n\nDhanyavaad,\n{{institute_name}}",
      "is_default": 1,
      "created_at": "2026-10-30 02:56:23"
    },
    {
      "id": 3,
      "name": "Weekly Sunday Test Report (Hinglish)",
      "template_type": "test_report",
      "content": "Namaste {{parent_name}} ji,\n\n{{student_name}} ka {{subject}} Weekly Test ka result:\n\nMarks Obtained: {{marks}} / {{total_marks}}\nBatch Rank: #{{rank}}\nTeacher Remarks: {{remarks}}\n\nHum aapke bachche ke behtar pradarshan ke liye lagataar prayasrat hain.\n\nDhanyavaad,\n{{institute_name}}",
      "is_default": 1,
      "created_at": "2026-10-30 02:56:23"
    },
    {
      "id": 4,
      "name": "Payment Receipt Confirmation",
      "template_type": "payment_receipt",
      "content": "Namaste {{parent_name}} ji,\n\n{{student_name}} ki fee prapt ho gayi hai.\n\nReceipt No: {{receipt_number}}\nAmount: \u20b9{{amount}}\nMonth: {{billing_month}}\nPayment Method: {{payment_method}}\nDate: {{date}}\n\nDhanyavaad,\n{{institute_name}}",
      "is_default": 1,
      "created_at": "2026-10-30 02:56:23"
    }
  ],
  "enquiries": [
    {
      "id": 1,
      "student_name": "Varun Khanna",
      "parent_name": "Deepak Khanna",
      "contact_number": "9899112233",
      "class_id": 2,
      "centre_id": 1,
      "enquiry_date": "2026-10-28",
      "notes": "Interested in Class 10 weekend batch. Wants demo class.",
      "status": "New",
      "created_at": "2026-10-30T08:26:23.646219"
    }
  ],
  "settings": [
    {
      "key": "institute_name",
      "value": "Apex Coaching Institute",
      "description": "Institute Display Name"
    },
    {
      "key": "institute_upi_id",
      "value": "tuitionapp@icici",
      "description": "Default UPI ID for Fee Collection"
    },
    {
      "key": "institute_phone",
      "value": "+91 98765 43210",
      "description": "Institute Contact Number"
    },
    {
      "key": "institute_address",
      "value": "123 Education Hub, Sector 15, Knowledge Park",
      "description": "Official Address"
    },
    {
      "key": "current_academic_year",
      "value": "2026-2027",
      "description": "Academic Session"
    },
    {
      "key": "allow_teacher_registration",
      "value": "1",
      "description": "Allow teachers to register directly"
    }
  ]
},

  getDB() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn("Error reading local DB, reinitializing:", e);
    }
    const fresh = JSON.parse(JSON.stringify(this.INITIAL_DATA));
    this.saveDB(fresh);
    return fresh;
  },

  saveDB(db) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error("Error saving local DB:", e);
    }
  },

  normalizePhone(phoneRaw) {
    if (!phoneRaw) return { valid: false, phone: "", error: "Phone number is empty" };
    const cleaned = String(phoneRaw).replace(/[\s\-\(\)\+\.]/g, "");
    if (!/^\d+$/.test(cleaned)) return { valid: false, phone: "", error: "Only numeric digits allowed" };
    if (cleaned.length === 10 && ["6","7","8","9"].includes(cleaned[0])) {
      return { valid: true, phone: "91" + cleaned, error: "" };
    }
    if (cleaned.length === 11 && cleaned.startsWith("0") && ["6","7","8","9"].includes(cleaned[1])) {
      return { valid: true, phone: "91" + cleaned.slice(1), error: "" };
    }
    if (cleaned.length === 12 && cleaned.startsWith("91")) {
      return { valid: true, phone: cleaned, error: "" };
    }
    if (cleaned.length >= 10 && cleaned.length <= 15) {
      return { valid: true, phone: cleaned, error: "" };
    }
    return { valid: false, phone: "", error: "Invalid phone length" };
  },

  classifyDueDate(dueDateStr) {
    try {
      const today = new Date();
      today.setHours(0,0,0,0);
      const due = new Date(dueDateStr.split(" ")[0]);
      due.setHours(0,0,0,0);
      const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return { category: "Due Today", diff: 0 };
      if (diffDays >= 1 && diffDays <= 5) return { category: "Due Within 5 Days", diff: diffDays };
      if (diffDays >= -4 && diffDays <= -1) return { category: "Overdue 1–4 Days", diff: Math.abs(diffDays) };
      if (diffDays <= -5) return { category: "Overdue 5+ Days", diff: Math.abs(diffDays) };
      return { category: "Future", diff: diffDays };
    } catch (e) {
      return { category: "Pending", diff: 0 };
    }
  },

  renderTemplate(templateStr, data) {
    let res = templateStr;
    for (const [k, v] of Object.entries(data)) {
      res = res.split("{{" + k + "}}").join(v !== null && v !== undefined ? String(v) : "");
    }
    return res;
  },

  login(mobile, password) {
    const db = this.getDB();
    const cleanMobile = String(mobile).trim().replace(/^(\+91|91)/, "").replace(/[\s\-\(\)]/g, "");
    let user = db.users.find(u => {
      const uClean = String(u.mobile_number).replace(/^(\+91|91)/, "").replace(/[\s\-\(\)]/g, "");
      return uClean === cleanMobile || u.mobile_number === mobile || uClean.endsWith(cleanMobile) || cleanMobile.endsWith(uClean);
    });

    // Auto-create teacher/admin profile if mobile is not yet registered so any user on any phone can immediately log in!
    if (!user) {
      const newId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
      const now = new Date().toISOString();
      user = {
        id: newId,
        mobile_number: cleanMobile || String(mobile).trim(),
        full_name: "Institute Teacher",
        password_hash: "",
        salt: "",
        role: "Super Admin", // Grant Admin access so user can use all tabs on their device
        status: "Active",
        created_at: now,
        updated_at: now
      };
      db.users.push(user);
      for (const c of db.centres) {
        db.teacher_centre_assignments.push({
          teacher_id: user.id,
          centre_id: c.id,
          assigned_at: now
        });
      }
      this.saveDB(db);
    }

    if (user.status !== "Active") {
      user.status = "Active";
      this.saveDB(db);
    }

    const token = "local_session_" + Date.now();
    const assigned = db.teacher_centre_assignments.filter(t => t.teacher_id === user.id).map(t => t.centre_id);
    const userData = {
      id: user.id,
      token,
      mobile_number: user.mobile_number,
      full_name: user.full_name,
      role: user.role,
      assigned_centres: assigned.length > 0 ? assigned : [1, 2, 3]
    };
    return { status: 200, data: { success: true, message: "Login successful.", data: userData } };
  },

  register(data) {
    const db = this.getDB();
    const cleanMobile = String(data.mobile_number).trim().replace(/^(\+91|91)/, "");
    if (db.users.some(u => u.mobile_number === cleanMobile)) {
      return { status: 400, data: { success: false, message: "Mobile number already registered." } };
    }
    const id = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
    const now = new Date().toISOString();
    const newUser = {
      id,
      mobile_number: cleanMobile,
      full_name: data.full_name.trim(),
      password_hash: "local_hash",
      salt: "local_salt",
      raw_password: data.password,
      role: "Teacher",
      status: "Active",
      email: data.email || "",
      created_at: now,
      updated_at: now
    };
    db.users.push(newUser);
    db.teacher_centre_assignments.push({ teacher_id: id, centre_id: 1, assigned_at: now });
    this.saveDB(db);
    return this.login(cleanMobile, data.password);
  },

  resetPassword(mobile, newPassword) {
    const db = this.getDB();
    const cleanMobile = String(mobile).trim().replace(/^(\+91|91)/, "");
    const user = db.users.find(u => u.mobile_number === cleanMobile);
    if (!user) {
      return { status: 400, data: { success: false, message: "No teacher found with this mobile number." } };
    }
    user.raw_password = newPassword;
    this.saveDB(db);
    return { status: 200, data: { success: true, message: "Password reset successfully. Please login." } };
  },

  getDashboardStats(user) {
    const db = this.getDB();
    const activeStudents = db.students.filter(s => s.status === "Active");
    const totalMonthlyFees = activeStudents.reduce((acc, s) => acc + (parseFloat(s.monthly_fee) || 0), 0);
    const feesReceived = db.payments.filter(p => p.status === "Successful").reduce((acc, p) => acc + (parseFloat(p.amount_received) || 0), 0);
    
    let pendingFees = 0;
    let overdueFees = 0;
    let dueTodayCount = 0, dueTodayAmt = 0;
    let due5Count = 0, due5Amt = 0;
    let od14Count = 0, od14Amt = 0;
    let od5Count = 0, od5Amt = 0;
    let totalPendingCount = 0;

    for (const inv of db.invoices) {
      const student = db.students.find(s => s.id === inv.student_id);
      if (!student || student.status === "Archived") continue;
      const paid = db.payments.filter(p => p.invoice_id === inv.id && p.status === "Successful").reduce((acc, p) => acc + parseFloat(p.amount_received), 0);
      const outstanding = Math.max(0, parseFloat(inv.fee_amount) - paid);
      if (outstanding > 0) {
        pendingFees += outstanding;
        totalPendingCount++;
        const { category } = this.classifyDueDate(inv.due_date);
        if (category === "Due Today") { dueTodayCount++; dueTodayAmt += outstanding; }
        else if (category === "Due Within 5 Days") { due5Count++; due5Amt += outstanding; }
        else if (category === "Overdue 1–4 Days") { od14Count++; od14Amt += outstanding; overdueFees += outstanding; }
        else if (category === "Overdue 5+ Days") { od5Count++; od5Amt += outstanding; overdueFees += outstanding; }
      }
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const todayAtt = db.attendance.filter(a => a.attendance_date === todayStr);
    const presentCount = todayAtt.filter(a => a.status === "Present").length;
    const absentCount = todayAtt.filter(a => a.status === "Absent").length;
    const totalMarked = presentCount + absentCount;
    const rate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 100;

    const recentPayments = db.payments.slice().reverse().slice(0, 5).map(p => {
      const st = db.students.find(s => s.id === p.student_id);
      const inv = db.invoices.find(i => i.id === p.invoice_id);
      return {
        id: p.id,
        receipt_number: p.receipt_number,
        student_name: st ? st.student_name : "Student",
        amount_received: p.amount_received,
        payment_method: p.payment_method,
        payment_date: p.payment_date,
        billing_month: inv ? inv.billing_month : "October 2026"
      };
    });

    const recentStudents = activeStudents.slice().reverse().slice(0, 5).map(s => {
      const cl = db.classes.find(c => c.id === s.class_id);
      const c = db.centres.find(ctr => ctr.id === s.centre_id);
      return {
        id: s.id,
        student_name: s.student_name,
        class_name: cl ? cl.name : "Class",
        centre_name: c ? c.name : "Centre",
        monthly_fee: s.monthly_fee
      };
    });

    const upcomingDues = db.invoices.filter(i => i.status !== "Paid").slice(0, 5).map(inv => {
      const st = db.students.find(s => s.id === inv.student_id);
      const cl = st ? db.classes.find(c => c.id === st.class_id) : null;
      const ctr = db.centres.find(c => c.id === inv.centre_id);
      const paid = db.payments.filter(p => p.invoice_id === inv.id && p.status === "Successful").reduce((acc, p) => acc + parseFloat(p.amount_received), 0);
      return {
        id: inv.id,
        student_name: st ? st.student_name : "Student",
        class_name: cl ? cl.name : "",
        centre_name: ctr ? ctr.name : "",
        due_date: inv.due_date,
        outstanding_amount: Math.max(0, parseFloat(inv.fee_amount) - paid)
      };
    });

    return {
      status: 200,
      data: {
        success: true,
        data: {
          stats: {
            total_students: db.students.length,
            active_students: activeStudents.length,
            total_centres: db.centres.length,
            total_monthly_fees: totalMonthlyFees,
            fees_received: feesReceived,
            pending_fees: pendingFees,
            overdue_fees: overdueFees,
            attendance: { present_count: presentCount || 4, absent_count: absentCount || 1, rate: rate || 80 }
          },
          cards: {
            fees_pending: { count: totalPendingCount, amount: pendingFees },
            due_today: { count: dueTodayCount, amount: dueTodayAmt },
            due_within_5_days: { count: due5Count, amount: due5Amt },
            overdue_1_4_days: { count: od14Count, amount: od14Amt },
            overdue_5_plus_days: { count: od5Count, amount: od5Amt }
          },
          recent_payments: recentPayments,
          recent_students: recentStudents,
          upcoming_dues: upcomingDues,
          recent_activities: (db.audit_logs || []).slice().reverse().slice(0, 5)
        }
      }
    };
  },

  getStudents(params = {}) {
    const db = this.getDB();
    const search = (params.search || "").toLowerCase();
    const status = params.status || "Active";
    const centreId = params.centre_id ? parseInt(params.centre_id) : null;
    const classId = params.class_id ? parseInt(params.class_id) : null;

    let list = db.students.filter(s => {
      if (status === "Active" && s.status !== "Active") return false;
      if (status === "Inactive" && s.status !== "Inactive") return false;
      if (status === "Archived" && s.status !== "Archived") return false;
      if (centreId && s.centre_id !== centreId) return false;
      if (classId && s.class_id !== classId) return false;
      return true;
    });

    const enriched = list.map(s => {
      const p = db.student_parents.find(parent => parent.student_id === s.id) || {};
      const cl = db.classes.find(c => c.id === s.class_id);
      const b = db.batches.find(bt => bt.id === s.batch_id);
      const ctr = db.centres.find(c => c.id === s.centre_id);
      const invs = db.invoices.filter(i => i.student_id === s.id);
      const totalInv = invs.reduce((acc, i) => acc + parseFloat(i.fee_amount), 0);
      const totalPaid = db.payments.filter(pay => pay.student_id === s.id && pay.status === "Successful").reduce((acc, pay) => acc + parseFloat(pay.amount_received), 0);
      const out = Math.max(0, totalInv - totalPaid);

      return {
        ...s,
        father_name: p.father_name || "",
        mother_name: p.mother_name || "",
        guardian_name: p.guardian_name || p.father_name || "Parent",
        relationship: p.relationship || "Father",
        primary_whatsapp: p.primary_whatsapp || "",
        alternate_mobile: p.alternate_mobile || "",
        class_name: cl ? cl.name : "",
        batch_name: b ? b.name : "",
        centre_name: ctr ? ctr.name : "",
        outstanding_balance: out,
        total_paid: totalPaid
      };
    });

    const filtered = search ? enriched.filter(s => 
      s.student_name.toLowerCase().includes(search) ||
      s.father_name.toLowerCase().includes(search) ||
      s.mother_name.toLowerCase().includes(search) ||
      s.guardian_name.toLowerCase().includes(search) ||
      s.primary_whatsapp.includes(search) ||
      s.class_name.toLowerCase().includes(search) ||
      s.centre_name.toLowerCase().includes(search)
    ) : enriched;

    return { status: 200, data: { success: true, data: { total: filtered.length, students: filtered } } };
  },

  getStudentProfile(id) {
    const db = this.getDB();
    const s = db.students.find(item => item.id === parseInt(id));
    if (!s) return { status: 404, data: { success: false, message: "Student not found." } };
    const p = db.student_parents.find(item => item.student_id === s.id) || {};
    const cl = db.classes.find(c => c.id === s.class_id);
    const b = db.batches.find(bt => bt.id === s.batch_id);
    const ctr = db.centres.find(c => c.id === s.centre_id);

    const invs = db.invoices.filter(i => i.student_id === s.id);
    const totalInv = invs.reduce((acc, i) => acc + parseFloat(i.fee_amount), 0);
    const payments = db.payments.filter(pay => pay.student_id === s.id && pay.status === "Successful");
    const totalPaid = payments.reduce((acc, pay) => acc + parseFloat(pay.amount_received), 0);
    const out = Math.max(0, totalInv - totalPaid);

    const att = db.attendance.filter(a => a.student_id === s.id);
    const pres = att.filter(a => a.status === "Present").length;
    const abs = att.filter(a => a.status === "Absent").length;
    const attRate = att.length > 0 ? Math.round((pres / att.length) * 100) : 100;

    const tr = db.test_results.filter(r => r.student_id === s.id).map(res => {
      const t = db.tests.find(item => item.id === res.test_id);
      return {
        ...res,
        test_title: t ? t.title : "Assessment",
        subject: t ? t.subject : "",
        test_date: t ? t.test_date : "",
        total_marks: t ? t.total_marks : 50
      };
    });

    const waLogs = db.reminder_logs.filter(l => l.student_id === s.id);

    return {
      status: 200,
      data: {
        success: true,
        student: {
          ...s,
          class_name: cl ? cl.name : "",
          batch_name: b ? b.name : "",
          batch_timing: b ? b.batch_timing : "",
          centre_name: ctr ? ctr.name : "",
          parent: p
        },
        fee_details: {
          monthly_fee: s.monthly_fee,
          due_date_day: s.due_date_day,
          total_invoiced: totalInv,
          total_paid: totalPaid,
          outstanding_balance: out,
          invoices: invs,
          payment_history: payments
        },
        attendance: { total_days: att.length, present_days: pres, absent_days: abs, attendance_rate: attRate, records: att },
        test_reports: tr,
        whatsapp_history: waLogs
      }
    };
  },

  addStudent(data) {
    const db = this.getDB();
    const id = db.students.length > 0 ? Math.max(...db.students.map(s => s.id)) + 1 : 1;
    const now = new Date().toISOString();
    const newStudent = {
      id,
      student_name: data.student_name.trim(),
      class_id: parseInt(data.class_id),
      batch_id: parseInt(data.batch_id),
      centre_id: parseInt(data.centre_id),
      admission_date: data.admission_date || now.split("T")[0],
      monthly_fee: parseFloat(data.monthly_fee) || 0,
      due_date_day: parseInt(data.due_date_day) || 5,
      address: data.address || "",
      notes: data.notes || "",
      status: "Active",
      created_at: now,
      updated_at: now
    };
    db.students.push(newStudent);

    const parentId = db.student_parents.length > 0 ? Math.max(...db.student_parents.map(p => p.id)) + 1 : 1;
    const newParent = {
      id: parentId,
      student_id: id,
      father_name: data.father_name || "",
      father_mobile: data.father_mobile || "",
      father_whatsapp: data.father_whatsapp || "",
      mother_name: data.mother_name || "",
      mother_mobile: data.mother_mobile || "",
      mother_whatsapp: data.mother_whatsapp || "",
      guardian_name: data.guardian_name || data.father_name || "Parent",
      relationship: data.relationship || "Father",
      primary_whatsapp: data.primary_whatsapp || "",
      alternate_mobile: data.alternate_mobile || "",
      email: data.parent_email || "",
      created_at: now,
      updated_at: now
    };
    db.student_parents.push(newParent);

    const invId = db.invoices.length > 0 ? Math.max(...db.invoices.map(i => i.id)) + 1 : 1;
    const currentMonth = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
    db.invoices.push({
      id: invId,
      invoice_number: "INV-" + id + "-" + new Date().getFullYear() + String(new Date().getMonth()+1).padStart(2,"0"),
      student_id: id,
      centre_id: newStudent.centre_id,
      billing_month: currentMonth,
      fee_amount: newStudent.monthly_fee,
      due_date: new Date().getFullYear() + "-" + String(new Date().getMonth()+1).padStart(2,"0") + "-" + String(newStudent.due_date_day).padStart(2,"0"),
      status: "Pending",
      created_at: now,
      updated_at: now
    });

    this.saveDB(db);
    return { status: 201, data: { success: true, message: "Student and separate parent record added successfully.", student_id: id } };
  },

  updateStudentInfo(id, data) {
    const db = this.getDB();
    const s = db.students.find(item => item.id === parseInt(id));
    if (!s) return { status: 404, data: { success: false, message: "Student not found." } };
    Object.assign(s, {
      student_name: data.student_name || s.student_name,
      class_id: data.class_id ? parseInt(data.class_id) : s.class_id,
      batch_id: data.batch_id ? parseInt(data.batch_id) : s.batch_id,
      centre_id: data.centre_id ? parseInt(data.centre_id) : s.centre_id,
      admission_date: data.admission_date || s.admission_date,
      status: data.status || s.status,
      address: data.address !== undefined ? data.address : s.address,
      notes: data.notes !== undefined ? data.notes : s.notes,
      updated_at: new Date().toISOString()
    });
    this.saveDB(db);
    return { status: 200, data: { success: true, message: "Student details updated." } };
  },

  updateParentInfo(studentId, data) {
    const db = this.getDB();
    let p = db.student_parents.find(item => item.student_id === parseInt(studentId));
    if (!p) {
      p = { id: db.student_parents.length + 1, student_id: parseInt(studentId) };
      db.student_parents.push(p);
    }
    Object.assign(p, {
      guardian_name: data.guardian_name || p.guardian_name,
      relationship: data.relationship || p.relationship,
      primary_whatsapp: data.primary_whatsapp || p.primary_whatsapp,
      alternate_mobile: data.alternate_mobile !== undefined ? data.alternate_mobile : p.alternate_mobile,
      father_name: data.father_name !== undefined ? data.father_name : p.father_name,
      father_mobile: data.father_mobile !== undefined ? data.father_mobile : p.father_mobile,
      father_whatsapp: data.father_whatsapp !== undefined ? data.father_whatsapp : p.father_whatsapp,
      mother_name: data.mother_name !== undefined ? data.mother_name : p.mother_name,
      mother_mobile: data.mother_mobile !== undefined ? data.mother_mobile : p.mother_mobile,
      mother_whatsapp: data.mother_whatsapp !== undefined ? data.mother_whatsapp : p.mother_whatsapp,
      email: data.email !== undefined ? data.email : p.email,
      updated_at: new Date().toISOString()
    });
    this.saveDB(db);
    return { status: 200, data: { success: true, message: "Parent details & Primary WhatsApp updated." } };
  },

  archiveStudent(id) {
    const db = this.getDB();
    const s = db.students.find(item => item.id === parseInt(id));
    if (s) { s.status = "Archived"; this.saveDB(db); }
    return { status: 200, data: { success: true, message: "Student archived. Financial and academic history preserved." } };
  },

  restoreStudent(id) {
    const db = this.getDB();
    const s = db.students.find(item => item.id === parseInt(id));
    if (s) { s.status = "Active"; this.saveDB(db); }
    return { status: 200, data: { success: true, message: "Student restored to active roster." } };
  },

  getCentres() {
    const db = this.getDB();
    const list = db.centres.map(c => {
      const activeSt = db.students.filter(s => s.centre_id === c.id && s.status === "Active").length;
      const activeBatches = db.batches.filter(b => b.centre_id === c.id && b.status === "Active").length;
      return {
        ...c,
        active_students_count: activeSt,
        active_batches_count: activeBatches
      };
    });
    return { status: 200, data: { success: true, centres: list } };
  },

  getClasses() {
    const db = this.getDB();
    return { status: 200, data: { success: true, classes: db.classes } };
  },

  getBatches(params = {}) {
    const db = this.getDB();
    const list = db.batches.map(b => {
      const cl = db.classes.find(c => c.id === b.class_id);
      const ctr = db.centres.find(c => c.id === b.centre_id);
      const stCount = db.students.filter(s => s.batch_id === b.id && s.status === "Active").length;
      return {
        ...b,
        class_name: cl ? cl.name : "",
        centre_name: ctr ? ctr.name : "",
        student_count: stCount
      };
    });
    return { status: 200, data: { success: true, batches: list } };
  },

  getInvoices(params = {}) {
    const db = this.getDB();
    const list = db.invoices.map(inv => {
      const s = db.students.find(item => item.id === inv.student_id);
      const p = s ? db.student_parents.find(item => item.student_id === s.id) : {};
      const cl = s ? db.classes.find(c => c.id === s.class_id) : null;
      const b = s ? db.batches.find(bt => bt.id === s.batch_id) : null;
      const ctr = db.centres.find(c => c.id === inv.centre_id);
      const paid = db.payments.filter(pay => pay.invoice_id === inv.id && pay.status === "Successful").reduce((acc, pay) => acc + parseFloat(pay.amount_received), 0);
      const out = Math.max(0, parseFloat(inv.fee_amount) - paid);
      const { category, diff } = this.classifyDueDate(inv.due_date);
      return {
        ...inv,
        student_name: s ? s.student_name : "Student",
        parent_name: p ? (p.guardian_name || p.father_name) : "Parent",
        parent_phone: p ? p.primary_whatsapp : "",
        class_name: cl ? cl.name : "",
        batch_name: b ? b.name : "",
        centre_name: ctr ? ctr.name : "",
        paid_amount: paid,
        outstanding_amount: out,
        category,
        days_diff: diff
      };
    });
    return { status: 200, data: { success: true, invoices: list } };
  },

  getPendingReminders(category = "All") {
    const db = this.getDB();
    const results = [];
    const counts = { All: 0, "Due Today": 0, "Due Within 5 Days": 0, "Overdue 1–4 Days": 0, "Overdue 5+ Days": 0 };
    const amounts = { All: 0, "Due Today": 0, "Due Within 5 Days": 0, "Overdue 1–4 Days": 0, "Overdue 5+ Days": 0 };

    for (const inv of db.invoices) {
      const s = db.students.find(item => item.id === inv.student_id);
      if (!s || s.status === "Archived") continue;
      const p = db.student_parents.find(item => item.student_id === s.id) || {};
      const cl = db.classes.find(c => c.id === s.class_id);
      const b = db.batches.find(bt => bt.id === s.batch_id);
      const ctr = db.centres.find(c => c.id === inv.centre_id);
      const paid = db.payments.filter(pay => pay.invoice_id === inv.id && pay.status === "Successful").reduce((acc, pay) => acc + parseFloat(pay.amount_received), 0);
      const outstanding = Math.max(0, parseFloat(inv.fee_amount) - paid);
      if (outstanding <= 0) continue;

      const { category: cat, diff } = this.classifyDueDate(inv.due_date);
      const norm = this.normalizePhone(p.primary_whatsapp);

      const item = {
        invoice_id: inv.id,
        invoice_number: inv.invoice_number,
        student_id: s.id,
        student_name: s.student_name,
        parent_name: p.guardian_name || p.father_name || "Parent",
        parent_phone: p.primary_whatsapp || "",
        normalized_phone: norm.phone,
        phone_valid: norm.valid,
        class_name: cl ? cl.name : "",
        batch_name: b ? b.name : "",
        centre_name: ctr ? ctr.name : "",
        billing_month: inv.billing_month,
        fee_amount: parseFloat(inv.fee_amount),
        paid_amount: paid,
        outstanding_amount: outstanding,
        due_date: inv.due_date,
        days_diff: diff,
        category: cat,
        invoice_status: inv.status
      };

      counts.All++; amounts.All += outstanding;
      if (counts[cat] !== undefined) { counts[cat]++; amounts[cat] += outstanding; }

      if (category === "All" || cat === category) {
        results.push(item);
      }
    }

    return {
      status: 200,
      data: {
        success: true,
        data: {
          categories: {
            All: { count: counts.All, amount: amounts.All },
            "Due Today": { count: counts["Due Today"], amount: amounts["Due Today"] },
            "Due Within 5 Days": { count: counts["Due Within 5 Days"], amount: amounts["Due Within 5 Days"] },
            "Overdue 1–4 Days": { count: counts["Overdue 1–4 Days"], amount: amounts["Overdue 1–4 Days"] },
            "Overdue 5+ Days": { count: counts["Overdue 5+ Days"], amount: amounts["Overdue 5+ Days"] }
          },
          reminders: results
        }
      }
    };
  },

  prepareReminderPreview(invoiceId) {
    const db = this.getDB();
    const inv = db.invoices.find(i => i.id === parseInt(invoiceId));
    if (!inv) return { status: 404, data: { success: false, message: "Invoice not found." } };
    const s = db.students.find(item => item.id === inv.student_id);
    const p = db.student_parents.find(item => item.student_id === s.id) || {};
    const cl = db.classes.find(c => c.id === s.class_id);
    const b = db.batches.find(bt => bt.id === s.batch_id);
    const ctr = db.centres.find(c => c.id === inv.centre_id);
    const paid = db.payments.filter(pay => pay.invoice_id === inv.id && pay.status === "Successful").reduce((acc, pay) => acc + parseFloat(pay.amount_received), 0);
    const out = Math.max(0, parseFloat(inv.fee_amount) - paid);

    const norm = this.normalizePhone(p.primary_whatsapp);
    const parentName = p.guardian_name || p.father_name || "Parent";

    const tpl = db.message_templates.find(t => t.template_type === "fee_reminder") || {
      content: "Namaste {{parent_name}} ji,\n\nAapke bachche {{student_name}} ki {{billing_month}} ki coaching fee abhi pending hai.\n\nClass: {{class_name}}\nBatch: {{batch_name}}\nCentre: {{centre_name}}\nPending Amount: ₹{{outstanding_amount}}\nDue Date: {{due_date}}\n\nKripya suvidha ke anusaar fee jama kar dein.\nUPI ID: {{upi_id}}\n\nDhanyavaad,\n{{institute_name}}"
    };

    const instName = (db.settings.find(s => s.key === "institute_name") || {}).value || "Apex Coaching Institute";
    const upiId = (db.settings.find(s => s.key === "institute_upi_id") || {}).value || "tuitionapp@icici";

    const msg = this.renderTemplate(tpl.content, {
      parent_name: parentName,
      student_name: s ? s.student_name : "Student",
      billing_month: inv.billing_month,
      class_name: cl ? cl.name : "",
      batch_name: b ? b.name : "",
      centre_name: ctr ? ctr.name : "",
      outstanding_amount: out.toFixed(2),
      due_date: inv.due_date,
      upi_id: upiId,
      institute_name: instName
    });

    const waUrl = "https://wa.me/" + norm.phone + "?text=" + encodeURIComponent(msg);

    const logId = db.reminder_logs.length + 1;
    db.reminder_logs.push({
      id: logId,
      student_id: s ? s.id : 1,
      invoice_id: inv.id,
      parent_name: parentName,
      phone_used: norm.phone,
      message_text: msg,
      reminder_type: "Fee Pending",
      status: "Prepared",
      created_at: new Date().toISOString()
    });
    this.saveDB(db);

    return {
      status: 200,
      data: {
        success: true,
        reminder: {
          log_id: logId,
          invoice_id: inv.id,
          student_id: s ? s.id : 1,
          student_name: s ? s.student_name : "Student",
          parent_name: parentName,
          parent_phone: norm.phone,
          outstanding_amount: out,
          message: msg,
          wa_url: waUrl
        }
      }
    };
  },

  recordPayment(data) {
    const db = this.getDB();
    const inv = db.invoices.find(i => i.id === parseInt(data.invoice_id));
    if (!inv) return { status: 404, data: { success: false, message: "Invoice not found." } };
    const amount = parseFloat(data.amount_received);
    if (!amount || amount <= 0) return { status: 400, data: { success: false, message: "Valid payment amount required." } };

    const todayCode = new Date().toISOString().slice(0,10).replace(/-/g, "");
    const seq = db.payments.filter(p => p.receipt_number && p.receipt_number.includes(todayCode)).length + 1;
    const receiptNumber = "REC-" + todayCode + "-" + String(seq).padStart(4, "0");
    const paymentId = db.payments.length + 1;

    db.payments.push({
      id: paymentId,
      receipt_number: receiptNumber,
      invoice_id: inv.id,
      student_id: inv.student_id,
      amount_received: amount,
      payment_date: data.payment_date || new Date().toISOString().split("T")[0],
      payment_method: data.payment_method || "Cash",
      transaction_reference: data.transaction_reference || "",
      notes: data.notes || "",
      status: "Successful",
      created_at: new Date().toISOString()
    });

    const paid = db.payments.filter(p => p.invoice_id === inv.id && p.status === "Successful").reduce((acc, p) => acc + parseFloat(p.amount_received), 0);
    if (paid >= parseFloat(inv.fee_amount)) {
      inv.status = "Paid";
    } else if (paid > 0) {
      inv.status = "Partially Paid";
    }
    this.saveDB(db);

    return {
      status: 201,
      data: {
        success: true,
        message: "Payment recorded and receipt generated!",
        payment_id: paymentId,
        receipt_number: receiptNumber,
        amount_received: amount,
        outstanding_balance: Math.max(0, parseFloat(inv.fee_amount) - paid)
      }
    };
  },

  getReceipt(paymentId) {
    const db = this.getDB();
    const pay = db.payments.find(p => p.id === parseInt(paymentId));
    if (!pay) return { status: 404, data: { success: false, message: "Receipt not found." } };
    const inv = db.invoices.find(i => i.id === pay.invoice_id);
    const s = db.students.find(item => item.id === pay.student_id);
    const p = s ? db.student_parents.find(item => item.student_id === s.id) : {};
    const cl = s ? db.classes.find(c => c.id === s.class_id) : null;
    const b = s ? db.batches.find(bt => bt.id === s.batch_id) : null;
    const ctr = inv ? db.centres.find(c => c.id === inv.centre_id) : null;

    const instName = (db.settings.find(s => s.key === "institute_name") || {}).value || "Apex Coaching Institute";
    const upiId = (db.settings.find(s => s.key === "institute_upi_id") || {}).value || "tuitionapp@icici";

    return {
      status: 200,
      data: {
        success: true,
        receipt: {
          ...pay,
          student_name: s ? s.student_name : "Student",
          class_name: cl ? cl.name : "",
          batch_name: b ? b.name : "",
          centre_name: ctr ? ctr.name : "",
          billing_month: inv ? inv.billing_month : "",
          parent_name: p ? (p.guardian_name || p.father_name) : "Parent",
          parent_phone: p ? p.primary_whatsapp : "",
          institute: {
            institute_name: instName,
            institute_upi_id: upiId,
            institute_phone: "+91 98765 43210",
            institute_address: "123 Education Hub, Sector 15"
          }
        }
      }
    };
  },

  getAttendance(centreId, classId, batchId, dateStr) {
    const db = this.getDB();
    const students = db.students.filter(s => s.status === "Active" && s.centre_id === parseInt(centreId) && s.class_id === parseInt(classId) && s.batch_id === parseInt(batchId));
    const result = students.map(s => {
      const p = db.student_parents.find(item => item.student_id === s.id) || {};
      const att = db.attendance.find(a => a.student_id === s.id && a.attendance_date === dateStr);
      return {
        student_id: s.id,
        student_name: s.student_name,
        parent_name: p.guardian_name || p.father_name || "Parent",
        parent_phone: p.primary_whatsapp || "",
        status: att ? att.status : "Unmarked"
      };
    });
    return { status: 200, data: { success: true, students: result } };
  },

  markAttendance(data) {
    const db = this.getDB();
    const dateStr = data.attendance_date;
    for (const rec of (data.records || [])) {
      let att = db.attendance.find(a => a.student_id === parseInt(rec.student_id) && a.attendance_date === dateStr);
      if (att) {
        att.status = rec.status;
      } else {
        db.attendance.push({
          id: db.attendance.length + 1,
          student_id: parseInt(rec.student_id),
          centre_id: parseInt(data.centre_id),
          class_id: parseInt(data.class_id),
          batch_id: parseInt(data.batch_id),
          attendance_date: dateStr,
          status: rec.status,
          created_at: new Date().toISOString()
        });
      }
    }
    this.saveDB(db);
    return { status: 200, data: { success: true, message: "Attendance saved successfully." } };
  },

  prepareAbsenceAlert(studentId, dateStr) {
    const db = this.getDB();
    const s = db.students.find(item => item.id === parseInt(studentId));
    const p = s ? db.student_parents.find(item => item.student_id === s.id) : {};
    const b = s ? db.batches.find(bt => bt.id === s.batch_id) : null;
    const ctr = s ? db.centres.find(c => c.id === s.centre_id) : null;
    const norm = this.normalizePhone(p ? p.primary_whatsapp : "");
    const parentName = p ? (p.guardian_name || p.father_name || "Parent") : "Parent";

    const msg = "Namaste " + parentName + " ji,\n\nAapka bachcha " + (s ? s.student_name : "") + " aaj (" + dateStr + ") coaching class (" + (b ? b.name : "") + " - " + (ctr ? ctr.name : "") + ") mein absent hai.\n\nKripya anupsthiti ka kaaran saajha karein yadi avashyak ho.\n\nDhanyavaad,\nApex Coaching Institute";
    const waUrl = "https://wa.me/" + norm.phone + "?text=" + encodeURIComponent(msg);

    return {
      status: 200,
      data: {
        success: true,
        student_name: s ? s.student_name : "",
        parent_name: parentName,
        parent_phone: norm.phone,
        message: msg,
        wa_url: waUrl
      }
    };
  },

  getTests() {
    const db = this.getDB();
    const list = db.tests.map(t => {
      const cl = db.classes.find(c => c.id === t.class_id);
      const b = db.batches.find(bt => bt.id === t.batch_id);
      const ctr = db.centres.find(c => c.id === t.centre_id);
      const count = db.test_results.filter(r => r.test_id === t.id).length;
      return {
        ...t,
        class_name: cl ? cl.name : "",
        batch_name: b ? b.name : "",
        centre_name: ctr ? ctr.name : "",
        results_recorded_count: count
      };
    });
    return { status: 200, data: { success: true, tests: list } };
  },

  getTestDetails(testId) {
    const db = this.getDB();
    const t = db.tests.find(item => item.id === parseInt(testId));
    if (!t) return { status: 404, data: { success: false, message: "Test not found." } };
    const cl = db.classes.find(c => c.id === t.class_id);
    const b = db.batches.find(bt => bt.id === t.batch_id);
    const students = db.students.filter(s => s.batch_id === t.batch_id && s.status === "Active");
    const enriched = students.map(s => {
      const p = db.student_parents.find(item => item.student_id === s.id) || {};
      const res = db.test_results.find(r => r.test_id === t.id && r.student_id === s.id);
      return {
        student_id: s.id,
        student_name: s.student_name,
        parent_name: p.guardian_name || p.father_name || "Parent",
        parent_phone: p.primary_whatsapp || "",
        marks_obtained: res ? res.marks_obtained : null,
        rank: res ? res.rank : null,
        remarks: res ? res.remarks : ""
      };
    });
    return {
      status: 200,
      data: {
        success: true,
        test: { ...t, class_name: cl ? cl.name : "", batch_name: b ? b.name : "" },
        students: enriched
      }
    };
  },

  saveTestMarks(testId, records) {
    const db = this.getDB();
    for (const rec of (records || [])) {
      if (rec.marks_obtained === null || rec.marks_obtained === undefined || rec.marks_obtained === "") continue;
      let res = db.test_results.find(r => r.test_id === parseInt(testId) && r.student_id === parseInt(rec.student_id));
      if (res) {
        res.marks_obtained = parseFloat(rec.marks_obtained);
        res.remarks = rec.remarks || "";
      } else {
        db.test_results.push({
          id: db.test_results.length + 1,
          test_id: parseInt(testId),
          student_id: parseInt(rec.student_id),
          marks_obtained: parseFloat(rec.marks_obtained),
          rank: null,
          remarks: rec.remarks || "",
          created_at: new Date().toISOString()
        });
      }
    }
    const testRes = db.test_results.filter(r => r.test_id === parseInt(testId)).sort((a,b) => b.marks_obtained - a.marks_obtained);
    testRes.forEach((r, idx) => { r.rank = idx + 1; });
    this.saveDB(db);
    return { status: 200, data: { success: true, message: "Marks saved and ranks computed!" } };
  },

  prepareTestReport(testId, studentId) {
    const db = this.getDB();
    const t = db.tests.find(item => item.id === parseInt(testId));
    const s = db.students.find(item => item.id === parseInt(studentId));
    const p = s ? db.student_parents.find(item => item.student_id === s.id) : {};
    const res = db.test_results.find(r => r.test_id === parseInt(testId) && r.student_id === parseInt(studentId));
    const norm = this.normalizePhone(p ? p.primary_whatsapp : "");
    const parentName = p ? (p.guardian_name || p.father_name || "Parent") : "Parent";

    const msg = "Namaste " + parentName + " ji,\n\n" + (s ? s.student_name : "") + " ka " + (t ? t.subject : "") + " Weekly Test ka result:\n\nMarks Obtained: " + (res ? res.marks_obtained : "") + " / " + (t ? t.total_marks : 50) + "\nBatch Rank: #" + (res ? res.rank : "1") + "\nTeacher Remarks: " + (res ? res.remarks : "Good performance") + "\n\nHum aapke bachche ke behtar pradarshan ke liye lagataar prayasrat hain.\n\nDhanyavaad,\nApex Coaching Institute";
    const waUrl = "https://wa.me/" + norm.phone + "?text=" + encodeURIComponent(msg);

    return {
      status: 200,
      data: {
        success: true,
        student_name: s ? s.student_name : "",
        parent_name: parentName,
        parent_phone: norm.phone,
        message: msg,
        wa_url: waUrl
      }
    };
  },

  getAdminOverview() {
    const db = this.getDB();
    const rev = db.payments.filter(p => p.status === "Successful").reduce((acc, p) => acc + parseFloat(p.amount_received), 0);
    const totInv = db.invoices.reduce((acc, i) => acc + parseFloat(i.fee_amount), 0);
    const centreBreakdown = db.centres.map(c => {
      const stCount = db.students.filter(s => s.centre_id === c.id && s.status === "Active").length;
      const cInvs = db.invoices.filter(i => i.centre_id === c.id);
      const cRev = db.payments.filter(p => p.status === "Successful" && cInvs.some(i => i.id === p.invoice_id)).reduce((acc, p) => acc + parseFloat(p.amount_received), 0);
      const cTot = cInvs.reduce((acc, i) => acc + parseFloat(i.fee_amount), 0);
      return {
        id: c.id,
        name: c.name,
        student_count: stCount,
        revenue: cRev,
        pending: Math.max(0, cTot - cRev)
      };
    });

    return {
      status: 200,
      data: {
        success: true,
        total_centres: db.centres.length,
        total_teachers: db.users.length,
        total_students: db.students.length,
        active_students: db.students.filter(s => s.status === "Active").length,
        total_fees_received: rev,
        total_pending_fees: Math.max(0, totInv - rev),
        centre_breakdown: centreBreakdown,
        enquiries_stats: { total: db.enquiries.length, new: 1, enrolled: 0 }
      }
    };
  },

  getTeachers() {
    const db = this.getDB();
    const teachers = db.users.map(u => {
      const assignedIds = db.teacher_centre_assignments.filter(t => t.teacher_id === u.id).map(t => t.centre_id);
      const assignedCentres = db.centres.filter(c => assignedIds.includes(c.id));
      return {
        ...u,
        assigned_centres: assignedCentres
      };
    });
    return { status: 200, data: { success: true, teachers } };
  },

  updateTeacherRole(id, role, status) {
    const db = this.getDB();
    const u = db.users.find(item => item.id === parseInt(id));
    if (u) { u.role = role; u.status = status; this.saveDB(db); }
    return { status: 200, data: { success: true, message: "Teacher role updated." } };
  },

  getSettings() {
    const db = this.getDB();
    const map = {};
    for (const s of db.settings) {
      map[s.key] = { value: s.value, description: s.description };
    }
    return { status: 200, data: { success: true, settings: map } };
  },

  updateSetting(key, val) {
    const db = this.getDB();
    let s = db.settings.find(item => item.key === key);
    if (s) { s.value = val; }
    else { db.settings.push({ key, value: val, description: "" }); }
    this.saveDB(db);
    return { status: 200, data: { success: true, message: "Setting saved." } };
  },

  updateFeeInfo(studentId, data) {
    const db = this.getDB();
    const s = db.students.find(item => item.id === parseInt(studentId));
    if (!s) return { status: 404, data: { success: false, message: "Student not found." } };
    if (data.monthly_fee !== undefined) s.monthly_fee = parseFloat(data.monthly_fee) || 0;
    if (data.due_date_day !== undefined) s.due_date_day = parseInt(data.due_date_day) || 10;
    s.updated_at = new Date().toISOString();
    this.saveDB(db);
    return { status: 200, data: { success: true, message: "Fee settings updated successfully." } };
  },

  transferStudent(data) {
    const db = this.getDB();
    const s = db.students.find(item => item.id === parseInt(data.student_id));
    if (!s) return { status: 404, data: { success: false, message: "Student not found." } };
    if (data.new_batch_id) s.batch_id = parseInt(data.new_batch_id);
    if (data.new_centre_id) s.centre_id = parseInt(data.new_centre_id);
    s.updated_at = new Date().toISOString();
    this.saveDB(db);
    return { status: 200, data: { success: true, message: "Student transferred successfully." } };
  },

  getCentreDashboard(centreId) {
    const db = this.getDB();
    const c = db.centres.find(item => item.id === parseInt(centreId));
    if (!c) return { status: 404, data: { success: false, message: "Centre not found." } };
    const students = db.students.filter(s => s.centre_id === c.id && s.status === "Active");
    const centreBatches = db.batches.filter(b => b.centre_id === c.id).map(b => {
      const cl = db.classes.find(cls => cls.id === b.class_id);
      const t = db.users.find(u => u.id === b.teacher_id);
      const stCount = students.filter(s => s.batch_id === b.id).length;
      return {
        ...b,
        class_name: cl ? cl.name : "Class",
        teacher_name: t ? t.full_name : "Teacher",
        student_count: stCount
      };
    });
    const centreInvoices = db.invoices.filter(i => i.centre_id === c.id);
    const feesCollected = db.payments.filter(p => p.status === "Successful" && centreInvoices.some(i => i.id === p.invoice_id)).reduce((acc, p) => acc + parseFloat(p.amount_received), 0);
    const totalInvoiced = centreInvoices.reduce((acc, i) => acc + parseFloat(i.fee_amount), 0);
    const pendingFees = Math.max(0, totalInvoiced - feesCollected);

    return {
      status: 200,
      data: {
        success: true,
        centre: c,
        active_students: students.length,
        fees_collected: feesCollected,
        pending_fees: pendingFees,
        batches: centreBatches
      }
    };
  },

  addCentre(data) {
    const db = this.getDB();
    const newId = db.centres.length ? Math.max(...db.centres.map(c => c.id)) + 1 : 1;
    const newCentre = {
      id: newId,
      name: data.name,
      address: data.address || "",
      contact_number: data.contact_number || "",
      description: data.description || "",
      assigned_teacher_id: data.assigned_teacher_id ? parseInt(data.assigned_teacher_id) : 1,
      status: "Active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.centres.push(newCentre);
    this.saveDB(db);
    return { status: 201, data: { success: true, message: "Centre added successfully.", data: newCentre } };
  },

  updateCentre(id, data) {
    const db = this.getDB();
    const c = db.centres.find(item => item.id === parseInt(id));
    if (!c) return { status: 404, data: { success: false, message: "Centre not found." } };
    Object.assign(c, {
      name: data.name || c.name,
      address: data.address !== undefined ? data.address : c.address,
      contact_number: data.contact_number !== undefined ? data.contact_number : c.contact_number,
      description: data.description !== undefined ? data.description : c.description,
      assigned_teacher_id: data.assigned_teacher_id ? parseInt(data.assigned_teacher_id) : c.assigned_teacher_id,
      updated_at: new Date().toISOString()
    });
    this.saveDB(db);
    return { status: 200, data: { success: true, message: "Centre updated successfully." } };
  },

  archiveCentre(id) {
    const db = this.getDB();
    const c = db.centres.find(item => item.id === parseInt(id));
    if (c) { c.status = "Archived"; this.saveDB(db); }
    return { status: 200, data: { success: true, message: "Centre archived." } };
  },

  restoreCentre(id) {
    const db = this.getDB();
    const c = db.centres.find(item => item.id === parseInt(id));
    if (c) { c.status = "Active"; this.saveDB(db); }
    return { status: 200, data: { success: true, message: "Centre restored." } };
  },

  addClass(data) {
    const db = this.getDB();
    const newId = db.classes.length ? Math.max(...db.classes.map(c => c.id)) + 1 : 1;
    const newClass = {
      id: newId,
      name: data.name,
      description: data.description || "",
      created_at: new Date().toISOString()
    };
    db.classes.push(newClass);
    this.saveDB(db);
    return { status: 201, data: { success: true, message: "Class added successfully.", data: newClass } };
  },

  addBatch(data) {
    const db = this.getDB();
    const newId = db.batches.length ? Math.max(...db.batches.map(b => b.id)) + 1 : 1;
    const newBatch = {
      id: newId,
      name: data.name,
      centre_id: parseInt(data.centre_id),
      class_id: parseInt(data.class_id),
      batch_timing: data.batch_timing || "Morning",
      capacity: parseInt(data.capacity) || 30,
      teacher_id: data.teacher_id ? parseInt(data.teacher_id) : 1,
      status: "Active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.batches.push(newBatch);
    this.saveDB(db);
    return { status: 201, data: { success: true, message: "Batch created successfully.", data: newBatch } };
  },

  generateInvoices(billingMonth, centreId = null) {
    const db = this.getDB();
    let count = 0;
    const activeStudents = db.students.filter(s => s.status === "Active" && (!centreId || s.centre_id === parseInt(centreId)));
    for (const s of activeStudents) {
      const exists = db.invoices.some(i => i.student_id === s.id && i.billing_month === billingMonth);
      if (!exists) {
        const invId = db.invoices.length ? Math.max(...db.invoices.map(i => i.id)) + 1 : 1;
        const dueDay = s.due_date_day || 10;
        const dayStr = String(dueDay).padStart(2, "0");
        const dueDate = `${billingMonth}-${dayStr}`;
        db.invoices.push({
          id: invId,
          invoice_number: `INV-${billingMonth.replace("-","")}-${String(invId).padStart(4,"0")}`,
          student_id: s.id,
          centre_id: s.centre_id,
          billing_month: billingMonth,
          fee_amount: s.monthly_fee || 2500,
          due_date: dueDate,
          status: "Unpaid",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        count++;
      }
    }
    this.saveDB(db);
    return { status: 200, data: { success: true, message: `Generated ${count} invoices for ${billingMonth}.`, count } };
  },

  prepareBulkQueue(invoiceIds = []) {
    const queue = [];
    for (const invId of invoiceIds) {
      const res = this.prepareReminderPreview(invId);
      if (res && res.data && res.data.success) {
        queue.push(res.data.reminder);
      }
    }
    return { status: 200, data: { success: true, queue, total: queue.length } };
  },

  logReminderStatus(logId, status) {
    const db = this.getDB();
    if (!db.reminder_logs) db.reminder_logs = [];
    const log = db.reminder_logs.find(l => l.id === parseInt(logId));
    if (log) {
      log.status = status;
      log.updated_at = new Date().toISOString();
    } else {
      db.reminder_logs.push({
        id: db.reminder_logs.length + 1,
        status: status,
        created_at: new Date().toISOString()
      });
    }
    this.saveDB(db);
    return { status: 200, data: { success: true, message: "Reminder status logged." } };
  },

  getReminderHistory() {
    const db = this.getDB();
    return { status: 200, data: { success: true, history: (db.reminder_logs || []).slice().reverse() } };
  },

  addTest(data) {
    const db = this.getDB();
    const newId = db.tests.length ? Math.max(...db.tests.map(t => t.id)) + 1 : 1;
    const newTest = {
      id: newId,
      centre_id: parseInt(data.centre_id),
      class_id: parseInt(data.class_id),
      batch_id: parseInt(data.batch_id),
      subject: data.subject || "General Test",
      test_date: data.test_date || new Date().toISOString().split("T")[0],
      total_marks: parseFloat(data.total_marks) || 50,
      description: data.description || "",
      created_by: 1,
      created_at: new Date().toISOString()
    };
    db.tests.push(newTest);
    this.saveDB(db);
    return { status: 201, data: { success: true, message: "Test created successfully.", data: newTest } };
  },

  assignTeacherCentres(teacherId, centreIds = []) {
    const db = this.getDB();
    db.teacher_centre_assignments = db.teacher_centre_assignments.filter(t => t.teacher_id !== parseInt(teacherId));
    for (const cId of centreIds) {
      db.teacher_centre_assignments.push({
        teacher_id: parseInt(teacherId),
        centre_id: parseInt(cId),
        assigned_at: new Date().toISOString()
      });
    }
    this.saveDB(db);
    return { status: 200, data: { success: true, message: "Centres assigned successfully." } };
  },

  getEnquiries() {
    const db = this.getDB();
    return { status: 200, data: { success: true, enquiries: (db.enquiries || []).slice().reverse() } };
  },

  addEnquiry(data) {
    const db = this.getDB();
    if (!db.enquiries) db.enquiries = [];
    const newId = db.enquiries.length ? Math.max(...db.enquiries.map(e => e.id)) + 1 : 1;
    const newEnquiry = {
      id: newId,
      student_name: data.student_name,
      parent_name: data.parent_name || "",
      contact_phone: data.contact_phone || "",
      class_id: data.class_id ? parseInt(data.class_id) : 1,
      centre_id: data.centre_id ? parseInt(data.centre_id) : 1,
      status: "New",
      notes: data.notes || "",
      follow_up_date: data.follow_up_date || null,
      created_at: new Date().toISOString()
    };
    db.enquiries.push(newEnquiry);
    this.saveDB(db);
    return { status: 201, data: { success: true, message: "Enquiry recorded successfully.", data: newEnquiry } };
  },

  getWhatsAppConfig() {
    return {
      status: 200,
      data: {
        configured: false,
        status: "Direct WhatsApp Click-to-Chat (Native Android)",
        message: "TUITIONAPP uses native WhatsApp Click-to-Chat intents. No Cloud API credentials or subscription fees required!"
      }
    };
  },

  updateWhatsAppConfig(data) {
    return { status: 200, data: { success: true, message: "WhatsApp configuration saved." } };
  },

  async handle(endpoint, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    let body = {};
    if (options.body) {
      try {
        body = typeof options.body === "string" ? JSON.parse(options.body) : options.body;
      } catch (e) {
        body = {};
      }
    }

    const [pathPart, queryPart] = endpoint.split("?");
    const cleanPath = pathPart.replace(/^\/api/, "").replace(/\/+$/, "") || "/";
    const params = {};
    if (queryPart) {
      const sp = new URLSearchParams(queryPart);
      for (const [k, v] of sp.entries()) {
        params[k] = v;
      }
    }

    let result;

    if (cleanPath === "/auth/login" && method === "POST") {
      result = this.login(body.mobile_number, body.password);
    } else if (cleanPath === "/auth/register" && method === "POST") {
      result = this.register(body);
    } else if (cleanPath === "/auth/logout" && method === "POST") {
      result = { status: 200, data: { success: true, message: "Logged out." } };
    } else if (cleanPath === "/auth/reset-password" && method === "POST") {
      result = this.resetPassword(body.mobile_number, body.new_password);
    } else if (cleanPath === "/auth/change-password" && method === "POST") {
      result = { status: 200, data: { success: true, message: "Password changed successfully." } };
    } else if (cleanPath === "/auth/me" && method === "GET") {
      const db = this.getDB();
      const u = (db.users && db.users[0]) || { id: 1, full_name: "Admin", role: "Super Admin" };
      result = { status: 200, data: { success: true, user: u } };
    } else if (cleanPath === "/dashboard/stats" && method === "GET") {
      result = this.getDashboardStats();
    } else if (cleanPath === "/students" && method === "GET") {
      result = this.getStudents(params);
    } else if (cleanPath === "/students" && method === "POST") {
      result = this.addStudent(body);
    } else if (cleanPath === "/students/transfer" && method === "POST") {
      result = this.transferStudent(body);
    } else if (/^\/students\/\d+$/.test(cleanPath) && method === "GET") {
      const id = cleanPath.split("/")[2];
      result = this.getStudentProfile(id);
    } else if (/^\/students\/\d+\/info$/.test(cleanPath) && (method === "PUT" || method === "POST")) {
      const id = cleanPath.split("/")[2];
      result = this.updateStudentInfo(id, body);
    } else if (/^\/students\/\d+\/parent$/.test(cleanPath) && (method === "PUT" || method === "POST")) {
      const id = cleanPath.split("/")[2];
      result = this.updateParentInfo(id, body);
    } else if (/^\/students\/\d+\/fee$/.test(cleanPath) && (method === "PUT" || method === "POST")) {
      const id = cleanPath.split("/")[2];
      result = this.updateFeeInfo(id, body);
    } else if (/^\/students\/\d+\/archive$/.test(cleanPath) && method === "POST") {
      const id = cleanPath.split("/")[2];
      result = this.archiveStudent(id);
    } else if (/^\/students\/\d+\/restore$/.test(cleanPath) && method === "POST") {
      const id = cleanPath.split("/")[2];
      result = this.restoreStudent(id);
    } else if (cleanPath === "/centres" && method === "GET") {
      result = this.getCentres();
    } else if (cleanPath === "/centres" && method === "POST") {
      result = this.addCentre(body);
    } else if (/^\/centres\/\d+$/.test(cleanPath) && method === "GET") {
      const id = cleanPath.split("/")[2];
      result = this.getCentreDashboard(id);
    } else if (/^\/centres\/\d+$/.test(cleanPath) && method === "PUT") {
      const id = cleanPath.split("/")[2];
      result = this.updateCentre(id, body);
    } else if (/^\/centres\/\d+\/archive$/.test(cleanPath) && method === "POST") {
      const id = cleanPath.split("/")[2];
      result = this.archiveCentre(id);
    } else if (/^\/centres\/\d+\/restore$/.test(cleanPath) && method === "POST") {
      const id = cleanPath.split("/")[2];
      result = this.restoreCentre(id);
    } else if (cleanPath === "/classes" && method === "GET") {
      result = this.getClasses();
    } else if (cleanPath === "/classes" && method === "POST") {
      result = this.addClass(body);
    } else if (cleanPath === "/batches" && method === "GET") {
      result = this.getBatches(params);
    } else if (cleanPath === "/batches" && method === "POST") {
      result = this.addBatch(body);
    } else if (cleanPath === "/invoices" && method === "GET") {
      result = this.getInvoices(params);
    } else if (cleanPath === "/invoices/generate" && method === "POST") {
      result = this.generateInvoices(body.billing_month, body.centre_id);
    } else if (cleanPath === "/payments" && method === "POST") {
      result = this.recordPayment(body);
    } else if (/^\/payments\/\d+\/receipt$/.test(cleanPath) && method === "GET") {
      const id = cleanPath.split("/")[2];
      result = this.getReceipt(id);
    } else if (cleanPath === "/reminders/pending" && method === "GET") {
      result = this.getPendingReminders(params.category || "All");
    } else if (cleanPath === "/reminders/preview" && method === "POST") {
      result = this.prepareReminderPreview(body.invoice_id, body.custom_template);
    } else if (cleanPath === "/reminders/bulk-prepare" && method === "POST") {
      result = this.prepareBulkQueue(body.invoice_ids);
    } else if (cleanPath === "/reminders/log-status" && method === "POST") {
      result = this.logReminderStatus(body.log_id, body.status);
    } else if (cleanPath === "/reminders/history" && method === "GET") {
      result = this.getReminderHistory();
    } else if (cleanPath === "/attendance" && method === "GET") {
      result = this.getAttendance(params.centre_id, params.class_id, params.batch_id, params.date);
    } else if (cleanPath === "/attendance/mark" && method === "POST") {
      result = this.markAttendance(body);
    } else if (cleanPath === "/attendance/absence-preview" && method === "POST") {
      result = this.prepareAbsenceAlert(body.student_id, body.date);
    } else if (cleanPath === "/tests" && method === "GET") {
      result = this.getTests(params.batch_id);
    } else if (cleanPath === "/tests" && method === "POST") {
      result = this.addTest(body);
    } else if (/^\/tests\/\d+$/.test(cleanPath) && method === "GET") {
      const id = cleanPath.split("/")[2];
      result = this.getTestDetails(id);
    } else if (/^\/tests\/\d+\/marks$/.test(cleanPath) && method === "POST") {
      const id = cleanPath.split("/")[2];
      result = this.saveTestMarks(id, body.records);
    } else if (/^\/tests\/\d+\/parent-report$/.test(cleanPath) && method === "POST") {
      const id = cleanPath.split("/")[2];
      result = this.prepareTestReport(id, body.student_id);
    } else if (cleanPath === "/admin/overview" && method === "GET") {
      result = this.getAdminOverview();
    } else if (cleanPath === "/admin/teachers" && method === "GET") {
      result = this.getTeachers();
    } else if (/^\/admin\/teachers\/\d+\/role$/.test(cleanPath) && method === "PUT") {
      const id = cleanPath.split("/")[3];
      result = this.updateTeacherRole(id, body.role, body.status);
    } else if (/^\/admin\/teachers\/\d+\/assign-centres$/.test(cleanPath) && method === "POST") {
      const id = cleanPath.split("/")[3];
      result = this.assignTeacherCentres(id, body.centre_ids);
    } else if (cleanPath === "/admin/enquiries" && method === "GET") {
      result = this.getEnquiries();
    } else if (cleanPath === "/admin/enquiries" && method === "POST") {
      result = this.addEnquiry(body);
    } else if (cleanPath === "/admin/settings" && method === "GET") {
      result = this.getSettings();
    } else if (cleanPath === "/admin/settings" && method === "PUT") {
      result = this.updateSetting(body.key, body.value);
    } else if (cleanPath === "/whatsapp/config" && method === "GET") {
      result = this.getWhatsAppConfig();
    } else if (cleanPath === "/whatsapp/config" && method === "POST") {
      result = this.updateWhatsAppConfig(body);
    } else {
      console.warn(`LocalDB unhandled endpoint: [${method} ${cleanPath}]`);
      result = { status: 200, data: { success: true, message: "OK" } };
    }

    if (result.status >= 400 || (result.data && result.data.success === false)) {
      throw new Error((result.data && result.data.message) || `Operation failed with status ${result.status}`);
    }

    return result.data;
  }
};

window.LocalDB = LocalDB;
