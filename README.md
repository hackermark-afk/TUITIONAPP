# 🎓 TUITIONAPP — Complete Coaching Institute Management System

A production-ready coaching institute management application with full frontend, backend, SQLite database with ACID transactions, payment recording, and WhatsApp click-to-chat integration.

Built specifically for desktop web browsers and responsive Android mobile devices.

---

## 🌟 Key Features & Architectural Highlights

### 1. Teacher Login & Role-Based Access Control
- **Secure Authentication:** Passwords hashed with PBKDF2 HMAC-SHA256 (100,000 iterations) and cryptographically random salts. Plaintext passwords are never stored.
- **Session Persistence:** Persistent token authentication stored in SQLite `sessions` table and validated on every request.
- **Role Hierarchy:**
  - `Super Admin`: Full institute control across all coaching centres.
  - `Admin`: Centre management, financial reports, and enquiry tracking.
  - `Teacher`: Strictly scoped access to assigned coaching centres and enrolled students.
- **Multi-Centre Access Control:** Teachers can only view and manage records from centres assigned to them in `teacher_centre_assignments`.

### 2. Live Database Dashboard
- Real-time calculations computed from live database records:
  - **Active Students** vs Total Enrolled
  - **Monthly Revenue Target** vs **Settled Fees Collected**
  - **Overdue Fees** & **Today's Attendance Rate**
- **Pending Fee Classification Cards (Asia/Kolkata timezone):**
  - All Pending Dues
  - Due Today ($diff = 0$)
  - Due Within 5 Days ($1 \le diff \le 5$)
  - Overdue 1–4 Days ($-4 \le diff \le -1$)
  - Overdue 5+ Days ($diff \le -5$)
  - Recent Payments & Student Enrollment streams.

### 3. Student & Parent Separation (Strict Requirement)
- Student and Parent information are stored in **separate database tables** (`students` and `student_parents`).
- **Student Information:** Student Name, Class, Batch, Timing, Coaching Centre, Admission Date, Monthly Fee, Due Date Day, Address, Notes, Status.
- **Separate Parent Contact Fields:**
  - Father's Name, Father's Mobile, Father's WhatsApp
  - Mother's Name, Mother's Mobile, Mother's WhatsApp
  - Guardian Name, Relationship (Father/Mother/Guardian/Other)
  - **Primary WhatsApp Contact Number:** Explicitly verified contact used for future fee reminders.
  - Alternate Mobile Number & Parent Email
- **Separate Edit Modules:**
  - Edit Student Core Info
  - Edit Parent Information (updating Primary WhatsApp immediately updates all future reminders while keeping old history untouched)
  - Edit Fee Structure
- **Non-Destructive Archive & Restore:** Students with financial or academic history cannot be permanently deleted; archiving hides them from active lists while preserving historical data.

### 4. Coaching Centres, Classes & Batches
- Multiple coaching branch management (`Apex Main Campus`, `Apex West Branch`, `Apex Noida City Centre`).
- Individual centre dashboards with centre-specific student count, fee collections, and batch schedules.
- Seamless student transfers between batches and centres while preserving historical records.

### 5. Fee Management System
- Monthly fee generation with unique invoice numbers (`INV-{student_id}-{YYYYMM}`).
- **ACID Transactional Payment Recording:**
  - Non-negative balance clamping: $\text{Outstanding Balance} = \max(0, \text{Invoice Amount} - \text{Successful Payments})$.
  - Partial payments and full payments supported.
  - Duplicate payment prevention (re-clicks blocked).
  - Status updates: `Paid`, `Partially Paid`, `Pending`, `Overdue`.
  - Sequential printable receipt generator (`REC-{YYYYMMDD}-{0001}`).

### 6. Pending Fees WhatsApp Reminder Centre
- Dedicated WhatsApp Reminder Centre.
- **Editable Hinglish Message Template:**
```text
Namaste {{parent_name}} ji,

Aapke bachche {{student_name}} ki {{billing_month}} ki coaching fee abhi pending hai.

Student Details:
Class: {{class_name}}
Batch: {{batch_name}}
Centre: {{centre_name}}
Pending Amount: ₹{{outstanding_amount}}
Due Date: {{due_date}}

Kripya suvidha ke anusaar fee jama kar dein.
UPI ID: {{upi_id}}

Dhanyavaad,
{{institute_name}}
```
- **Phone Normalization:**
  - Automatically normalizes Indian 10-digit numbers into standard E.164 (`919876543210`).
  - Supports valid international numbers.
  - Rejects missing, malformed, or invalid numbers.
- **Teacher-Controlled Click-to-Chat:**
  - Pre-flight verification (stops if invoice is paid or student is archived).
  - Percent-encoded `https://wa.me/{normalized_phone}?text={encoded_message}`.
  - Does not falsely mark messages as sent or delivered.
- **Bulk Reminder Queue:**
  - Interactive stepper reviewing one student at a time.
  - Tracks valid reminders vs skipped records.

### 7. Daily Attendance & Absence Alerts
- Batch-wise daily attendance marking (Present/Absent).
- Quick toggles: Mark All Present, Mark All Absent.
- **Instant Parent Absence WhatsApp Notice:**
  - One-click preparation of absence alerts greeting parents in Hinglish with class timing and centre name.

### 8. Weekly Assessments & Sunday Performance Reports
- Schedule tests, enter marks, and add teacher remarks.
- Automatic batch ranking calculation with tie resolution.
- Sunday Weekly Performance WhatsApp Report generator for parents.

### 9. Owner / Admin Dashboard
- Executive analytics: Total centres, teachers, student admissions, revenue collection rates.
- Teacher role management (`Super Admin`, `Admin`, `Teacher`).
- Multi-centre assignment controls.
- Referral enquiries CRM (`New`, `Follow Up`, `Enrolled`, `Closed`).
- System settings: Institute Name, UPI ID, Address, Phone.

---

## 🗄️ Database Architecture

The application uses SQLite with WAL mode, foreign keys enabled, and dedicated indexes:

| Table | Purpose |
|---|---|
| `users` | Teachers and Administrators with PBKDF2 hash + salt |
| `sessions` | Active user bearer tokens |
| `centres` | Coaching branches and locations |
| `teacher_centre_assignments` | M:N mapping between teachers and accessible centres |
| `classes` | Academic grades (Class 9, 10, 11, 12) |
| `batches` | Shift schedules and assigned teachers |
| `students` | Core student record |
| `student_parents` | **Separate parent entity** with Father, Mother, Guardian, Primary WhatsApp |
| `invoices` | Monthly fee billing records |
| `payments` | Transactional receipts and payment methods |
| `attendance` | Daily student attendance logs |
| `tests` | Assessment metadata and maximum marks |
| `test_results` | Marks scored, calculated ranks, remarks |
| `reminder_logs` | WhatsApp reminder audit trail |
| `message_templates` | Configurable Hinglish message templates |
| `enquiries` | Prospective student enquiry CRM |
| `audit_logs` | Security and data modification audit trail |
| `settings` | System-wide configuration (UPI ID, institute name) |
| `whatsapp_api_configs` | Meta WhatsApp Cloud API credentials & webhook verification |

---

## 🚀 Running the Application

### Prerequisites
- Python 3.10+ (Standard library only; **zero external pip dependencies required**)
- Modern web browser (Chrome, Safari, Firefox, Edge, Android WebView)

### Launch Server
From the project directory:
```bash
python3 run_server.py
```
Or with custom port and host:
```bash
PORT=8080 HOST=127.0.0.1 python3 run_server.py
```
Open your browser at: **`http://127.0.0.1:8080`**

### Default Test Credentials

| Role | Mobile Number | Password | Scope |
|---|---|---|---|
| **Super Admin** | `9876543210` | `Admin@1234` | Full access across all 3 centres |
| **Admin** | `9811122233` | `Teacher@1234` | Admin access |
| **Teacher (Amitabh)**| `9822233344` | `Teacher@1234` | Scoped strictly to Centre 2 |
| **Teacher (Sunita)** | `9833344455` | `Teacher@1234` | Scoped strictly to Centre 3 |

*(Quick-login shortcuts are also provided directly on the Login screen).*

---

## 🧪 Running the Test Suite

Run all unit, integration, and HTTP handler tests:
```bash
python3 tests/run_all_tests.py
```
Or run individually:
```bash
python3 tests/test_all_features.py
python3 tests/test_handler_in_process.py
```
**Total Tests:** 28 passing tests covering 100% of required business workflows.

---

## 📱 Building the Android APK

TUITIONAPP includes a complete Progressive Web App (PWA) manifest (`manifest.json`), service worker (`sw.js`), and mobile-responsive layout (mobile bottom bar + desktop sidebar).

There are two recommended ways to build a production Android APK:

### Option A: Using Capacitor (Recommended for Play Store)
1. Initialize Capacitor:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init tuitionapp com.coaching.tuitionapp --web-dir frontend
   ```
2. Add Android platform:
   ```bash
   npx cap add android
   npx cap sync
   ```
3. Open in Android Studio and build APK:
   ```bash
   npx cap open android
   # Build -> Build Bundle(s) / APK(s) -> Build APK(s)
   ```

### Option B: Using Google Bubblewrap (Trusted Web Activity - TWA)
1. Install Bubblewrap CLI:
   ```bash
   npm install -g @bubblewrap/cli
   ```
2. Initialize TWA from your hosted domain:
   ```bash
   bubblewrap init --manifest="https://your-tuitionapp-domain.com/manifest.json"
   ```
3. Build the signed APK:
   ```bash
   bubblewrap build
   ```
   This generates an installable `.apk` file ready for Android devices.

### Option C: Instant Mobile Homescreen Installation (No Build Needed)
Open the application URL on Android Chrome:
1. Tap the three dots menu (⋮).
2. Tap **"Install app"** or **"Add to Home screen"**.
3. TUITIONAPP will launch as a standalone Android app with native status bar colors and offline caching.

---

## 🛡️ WhatsApp Cloud API — Future Integration
While teacher-controlled `wa.me` Click-to-Chat is active by default:
- Backend routes for Meta WhatsApp Cloud API credentials (`/api/whatsapp/config`) and webhook verification (`/api/whatsapp/webhook`) are fully wired and functional.
- Webhook handles `hub.challenge` verification for automated delivery receipts (`API Accepted`, `Delivered`, `Confirmed Sent`, `Failed`).
