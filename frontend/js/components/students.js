/**
 * TUITIONAPP — Student Management Component
 * Implements Add, Edit, Profile (6 Sections), Search, Filter, Archive, and Restore.
 * Strictly separates Student, Father, Mother, Guardian & Primary Parent WhatsApp fields.
 */

const StudentsComponent = {
  currentFilter: {
    search: "",
    status: "Active",
    centre_id: "",
    class_id: "",
    batch_id: ""
  },

  async render() {
    const mainView = document.getElementById("main-view");
    if (!mainView) return;

    mainView.innerHTML = `
      <div class="page-container">
        <!-- Header with Add Button -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-main);">Student Directory</h2>
            <p style="font-size: 0.82rem; color: var(--text-muted);">Manage student profiles, parent contacts, fee plans, and academic records</p>
          </div>
          <button class="btn btn-primary" id="btn-add-student-modal">
            <span>➕</span> Add New Student
          </button>
        </div>

        <!-- Filter & Search Bar -->
        <div class="content-section" style="margin-bottom: 1rem;">
          <div class="filter-bar">
            <div class="search-input-wrapper">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input type="text" id="student-search-input" class="search-input" placeholder="Search student, father, mother, WhatsApp, class, centre...">
            </div>

            <select id="filter-centre" class="filter-select">
              <option value="">All Centres</option>
            </select>

            <select id="filter-class" class="filter-select">
              <option value="">All Classes</option>
            </select>

            <select id="filter-status" class="filter-select">
              <option value="Active" selected>Active Students</option>
              <option value="Inactive">Inactive Students</option>
              <option value="Archived">Archived Students</option>
              <option value="All">All Statuses</option>
            </select>

            <button class="btn btn-secondary btn-sm" id="btn-reset-filters">Reset</button>
          </div>

          <!-- Students List Container -->
          <div id="students-table-container">
            <div style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
              ⏳ Fetching students...
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-add-student-modal").addEventListener("click", () => {
      StudentsComponent.openAddStudentModal();
    });

    // Populate filter dropdowns
    try {
      const [centresRes, classesRes] = await Promise.all([API.getCentres(), API.getClasses()]);
      const centreSelect = document.getElementById("filter-centre");
      (centresRes.centres || []).forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name;
        centreSelect.appendChild(opt);
      });

      const classSelect = document.getElementById("filter-class");
      (classesRes.classes || []).forEach(cl => {
        const opt = document.createElement("option");
        opt.value = cl.id;
        opt.textContent = cl.name;
        classSelect.appendChild(opt);
      });
    } catch (e) {
      console.error("Filter populate error:", e);
    }

    // Bind filter events
    const searchInput = document.getElementById("student-search-input");
    const centreFilter = document.getElementById("filter-centre");
    const classFilter = document.getElementById("filter-class");
    const statusFilter = document.getElementById("filter-status");

    const refreshList = () => {
      StudentsComponent.currentFilter.search = searchInput.value;
      StudentsComponent.currentFilter.centre_id = centreFilter.value;
      StudentsComponent.currentFilter.class_id = classFilter.value;
      StudentsComponent.currentFilter.status = statusFilter.value;
      StudentsComponent.loadStudentsList();
    };

    let debounceTimer;
    searchInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(refreshList, 300);
    });

    centreFilter.addEventListener("change", refreshList);
    classFilter.addEventListener("change", refreshList);
    statusFilter.addEventListener("change", refreshList);

    document.getElementById("btn-reset-filters").addEventListener("click", () => {
      searchInput.value = "";
      centreFilter.value = "";
      classFilter.value = "";
      statusFilter.value = "Active";
      refreshList();
    });

    // Initial load
    await StudentsComponent.loadStudentsList();
  },

  async loadStudentsList() {
    const container = document.getElementById("students-table-container");
    if (!container) return;

    try {
      const resp = await API.getStudents(StudentsComponent.currentFilter);
      const students = resp.data.students || [];

      if (students.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 3rem 1.5rem;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
            <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main);">No students found</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
              Try adjusting your search criteria or register a new student.
            </p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Class & Batch</th>
                <th>Coaching Centre</th>
                <th>Parent Name & Contact</th>
                <th>Monthly Fee</th>
                <th>Outstanding</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(s => `
                <tr>
                  <td>
                    <div style="font-weight: 700; color: var(--text-main); font-size: 0.92rem;">${s.student_name}</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">ID: #STU-${s.id}</div>
                  </td>
                  <td>
                    <div style="font-weight: 600;">${s.class_name || 'N/A'}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${s.batch_name || 'N/A'}</div>
                  </td>
                  <td>
                    <span style="font-weight: 500;">${s.centre_name || 'N/A'}</span>
                  </td>
                  <td>
                    <div style="font-weight: 600;">${s.guardian_name || s.father_name || s.mother_name || 'Parent'} (${s.relationship || 'Guardian'})</div>
                    <div style="font-size: 0.78rem; color: var(--whatsapp); font-weight: 600;">
                      💬 ${s.primary_whatsapp || 'No WhatsApp'}
                    </div>
                  </td>
                  <td style="font-weight: 600;">₹${s.monthly_fee}</td>
                  <td>
                    ${s.outstanding_balance > 0 ? `
                      <span style="color: var(--danger); font-weight: 700;">₹${s.outstanding_balance}</span>
                    ` : `
                      <span style="color: var(--success); font-weight: 600;">₹0 (Paid)</span>
                    `}
                  </td>
                  <td>
                    <span class="badge ${s.status === 'Active' ? 'badge-active' : s.status === 'Archived' ? 'badge-archived' : 'badge-pending'}">
                      ${s.status}
                    </span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 4px;">
                      <button class="btn btn-secondary btn-sm" onclick="StudentsComponent.viewStudentProfile(${s.id})">
                        Profile
                      </button>
                      ${s.status === 'Archived' ? `
                        <button class="btn btn-success btn-sm" onclick="StudentsComponent.restoreStudent(${s.id})">
                          Restore
                        </button>
                      ` : `
                        <button class="btn btn-danger btn-sm" onclick="StudentsComponent.confirmArchive(${s.id}, '${s.student_name.replace(/'/g, "\\'")}')">
                          Archive
                        </button>
                      `}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `
        <div style="padding: 1.5rem; color: var(--danger); text-align: center;">
          Failed to load students: ${err.message}
        </div>
      `;
    }
  },

  async openAddStudentModal() {
    let centres = [];
    let classes = [];
    let batches = [];

    try {
      const [cRes, clRes, bRes] = await Promise.all([API.getCentres(), API.getClasses(), API.getBatches()]);
      centres = cRes.centres || [];
      classes = clRes.classes || [];
      batches = bRes.batches || [];
    } catch (e) {
      App.showToast("Failed to fetch branches/batches.", "error");
    }

    App.showModal({
      title: "Add New Student & Parent Details",
      content: `
        <form id="form-add-student">
          <!-- Section A: Student Information -->
          <div class="form-section-divider" style="margin-top: 0;">
            <span class="form-section-title">👤 1. Student Information</span>
          </div>

          <div class="form-group">
            <label class="form-label required">Student Full Name</label>
            <input type="text" id="add-student-name" class="form-control" placeholder="e.g. Aryan Malhotra" required>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label required">Coaching Centre / Branch</label>
              <select id="add-student-centre" class="form-control" required>
                <option value="">-- Select Centre --</option>
                ${centres.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Class</label>
              <select id="add-student-class" class="form-control" required>
                <option value="">-- Select Class --</option>
                ${classes.map(cl => `<option value="${cl.id}">${cl.name}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label required">Batch</label>
              <select id="add-student-batch" class="form-control" required>
                <option value="">-- Select Batch --</option>
                ${batches.map(b => `<option value="${b.id}" data-centre="${b.centre_id}" data-class="${b.class_id}">${b.name} (${b.batch_timing})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Admission Date</label>
              <input type="date" id="add-student-adm-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label required">Monthly Fee (₹)</label>
              <input type="number" id="add-student-fee" class="form-control" placeholder="3500" min="0" step="50" required>
            </div>
            <div class="form-group">
              <label class="form-label required">Individual Due Date Day</label>
              <input type="number" id="add-student-due-day" class="form-control" placeholder="5" min="1" max="28" value="5" required>
              <small style="color: var(--text-muted); font-size: 0.72rem;">Day of each month (1–28)</small>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Student Address</label>
            <input type="text" id="add-student-address" class="form-control" placeholder="Residential address">
          </div>

          <div class="form-group">
            <label class="form-label">Academic / Behaviour Notes</label>
            <textarea id="add-student-notes" class="form-control" rows="2" placeholder="Optional notes..."></textarea>
          </div>

          <!-- Section B: Father Information -->
          <div class="form-section-divider">
            <span class="form-section-title">👨 2. Father Information</span>
          </div>

          <div class="form-group">
            <label class="form-label">Father's Full Name</label>
            <input type="text" id="add-father-name" class="form-control" placeholder="Father Name">
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Father's Mobile Number</label>
              <input type="tel" id="add-father-mobile" class="form-control" placeholder="10-digit mobile" maxlength="10">
            </div>
            <div class="form-group">
              <label class="form-label">Father's WhatsApp Number</label>
              <input type="tel" id="add-father-whatsapp" class="form-control" placeholder="10-digit WhatsApp" maxlength="10">
            </div>
          </div>

          <!-- Section C: Mother Information -->
          <div class="form-section-divider">
            <span class="form-section-title">👩 3. Mother Information</span>
          </div>

          <div class="form-group">
            <label class="form-label">Mother's Full Name</label>
            <input type="text" id="add-mother-name" class="form-control" placeholder="Mother Name">
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Mother's Mobile Number</label>
              <input type="tel" id="add-mother-mobile" class="form-control" placeholder="10-digit mobile" maxlength="10">
            </div>
            <div class="form-group">
              <label class="form-label">Mother's WhatsApp Number</label>
              <input type="tel" id="add-mother-whatsapp" class="form-control" placeholder="10-digit WhatsApp" maxlength="10">
            </div>
          </div>

          <!-- Section D: Parent / Guardian Information & Reminders -->
          <div class="form-section-divider">
            <span class="form-section-title">📱 4. Parent / Guardian Contact (For Reminders)</span>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label required">Parent / Guardian Full Name</label>
              <input type="text" id="add-guardian-name" class="form-control" placeholder="Name to greet in WhatsApp" required>
            </div>
            <div class="form-group">
              <label class="form-label required">Relationship with Student</label>
              <select id="add-relationship" class="form-control" required>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label required">Primary Parent WhatsApp Number</label>
              <input type="tel" id="add-primary-whatsapp" class="form-control" placeholder="Primary WhatsApp (Used for reminders)" maxlength="15" required>
              <small style="color: var(--whatsapp); font-size: 0.72rem; font-weight: 600;">Used for WhatsApp Click-to-Chat reminders</small>
            </div>
            <div class="form-group">
              <label class="form-label">Alternate Mobile Number</label>
              <input type="tel" id="add-alt-mobile" class="form-control" placeholder="Optional backup mobile" maxlength="15">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Parent Email Address</label>
            <input type="email" id="add-parent-email" class="form-control" placeholder="parent@example.com">
          </div>
        </form>
      `,
      confirmText: "Save Student & Create Profile",
      onConfirm: async () => {
        const payload = {
          student_name: document.getElementById("add-student-name").value,
          centre_id: document.getElementById("add-student-centre").value,
          class_id: document.getElementById("add-student-class").value,
          batch_id: document.getElementById("add-student-batch").value,
          admission_date: document.getElementById("add-student-adm-date").value,
          monthly_fee: document.getElementById("add-student-fee").value,
          due_date_day: document.getElementById("add-student-due-day").value,
          address: document.getElementById("add-student-address").value,
          notes: document.getElementById("add-student-notes").value,
          // Father
          father_name: document.getElementById("add-father-name").value,
          father_mobile: document.getElementById("add-father-mobile").value,
          father_whatsapp: document.getElementById("add-father-whatsapp").value,
          // Mother
          mother_name: document.getElementById("add-mother-name").value,
          mother_mobile: document.getElementById("add-mother-mobile").value,
          mother_whatsapp: document.getElementById("add-mother-whatsapp").value,
          // Guardian
          guardian_name: document.getElementById("add-guardian-name").value,
          relationship: document.getElementById("add-relationship").value,
          primary_whatsapp: document.getElementById("add-primary-whatsapp").value,
          alternate_mobile: document.getElementById("add-alt-mobile").value,
          parent_email: document.getElementById("add-parent-email").value
        };

        try {
          const res = await API.addStudent(payload);
          App.showToast(res.message || "Student added successfully!", "success");
          App.closeModal();
          StudentsComponent.loadStudentsList();
        } catch (err) {
          App.showToast(err.message, "error");
        }
      }
    });

    // Auto-fill Guardian name and primary WhatsApp from Father/Mother as convenience
    const fatherNameInput = document.getElementById("add-father-name");
    const fatherPhoneInput = document.getElementById("add-father-whatsapp");
    const guardianNameInput = document.getElementById("add-guardian-name");
    const primaryPhoneInput = document.getElementById("add-primary-whatsapp");

    fatherNameInput.addEventListener("input", () => {
      if (!guardianNameInput.value) {
        guardianNameInput.value = fatherNameInput.value;
      }
    });
    fatherPhoneInput.addEventListener("input", () => {
      if (!primaryPhoneInput.value) {
        primaryPhoneInput.value = fatherPhoneInput.value;
      }
    });
  },

  async viewStudentProfile(studentId) {
    App.showModal({
      title: "Loading Student Profile...",
      content: `<div style="text-align: center; padding: 2rem;">⏳ Fetching detailed records...</div>`
    });

    try {
      const resp = await API.getStudentProfile(studentId);
      const data = resp;
      const s = data.student;
      const p = s.parent || {};
      const f = data.fee_details;
      const att = data.attendance;
      const tests = data.test_reports || [];
      const waLogs = data.whatsapp_history || [];

      App.showModal({
        title: `Profile: ${s.student_name} (#STU-${s.id})`,
        content: `
          <div>
            <!-- Quick Actions Top Bar -->
            <div style="display: flex; gap: 8px; margin-bottom: 1rem; flex-wrap: wrap;">
              <button class="btn btn-secondary btn-sm" onclick="StudentsComponent.openEditStudentInfoModal(${s.id})">
                ✏️ Edit Student Info
              </button>
              <button class="btn btn-secondary btn-sm" onclick="StudentsComponent.openEditParentInfoModal(${s.id})">
                👨‍👩‍👧 Edit Parent Details
              </button>
              <button class="btn btn-secondary btn-sm" onclick="StudentsComponent.openEditFeeInfoModal(${s.id})">
                💰 Edit Fee Plan
              </button>
              <button class="btn btn-whatsapp btn-sm" onclick="App.navigate('reminders'); App.closeModal();">
                💬 Fee WhatsApp Reminder
              </button>
            </div>

            <!-- Profile Navigation Tabs -->
            <div class="tab-navigation" id="profile-tabs">
              <button class="tab-btn active" onclick="StudentsComponent.switchProfileTab('tab-student-info', this)">1. Details</button>
              <button class="tab-btn" onclick="StudentsComponent.switchProfileTab('tab-parent-info', this)">2. Parents</button>
              <button class="tab-btn" onclick="StudentsComponent.switchProfileTab('tab-fee-history', this)">3. Fees (${f.invoices.length})</button>
              <button class="tab-btn" onclick="StudentsComponent.switchProfileTab('tab-attendance-info', this)">4. Attendance (${att.attendance_rate}%)</button>
              <button class="tab-btn" onclick="StudentsComponent.switchProfileTab('tab-test-reports', this)">5. Tests (${tests.length})</button>
              <button class="tab-btn" onclick="StudentsComponent.switchProfileTab('tab-wa-history', this)">6. WhatsApp (${waLogs.length})</button>
            </div>

            <div style="margin-top: 1rem;">
              <!-- Section 1: Student Details -->
              <div id="tab-student-info" class="profile-tab-pane">
                <div class="profile-section-card">
                  <div class="profile-info-grid">
                    <div class="info-item"><label>Student Name</label><span>${s.student_name}</span></div>
                    <div class="info-item"><label>Student ID</label><span>#STU-${s.id}</span></div>
                    <div class="info-item"><label>Class</label><span>${s.class_name || 'N/A'}</span></div>
                    <div class="info-item"><label>Batch</label><span>${s.batch_name || 'N/A'} (${s.batch_timing || ''})</span></div>
                    <div class="info-item"><label>Coaching Centre</label><span>${s.centre_name || 'N/A'}</span></div>
                    <div class="info-item"><label>Admission Date</label><span>${s.admission_date}</span></div>
                    <div class="info-item"><label>Status</label><span class="badge ${s.status === 'Active' ? 'badge-active' : 'badge-archived'}">${s.status}</span></div>
                    <div class="info-item"><label>Address</label><span>${s.address || 'Not specified'}</span></div>
                  </div>
                  ${s.notes ? `
                    <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px dashed var(--border);">
                      <label style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Remarks / Notes</label>
                      <div style="font-size: 0.88rem; color: var(--text-main);">${s.notes}</div>
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- Section 2: Parent Details -->
              <div id="tab-parent-info" class="profile-tab-pane" style="display: none;">
                <div class="profile-section-card">
                  <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--primary); margin-bottom: 0.75rem;">Father Details</h4>
                  <div class="profile-info-grid">
                    <div class="info-item"><label>Father Name</label><span>${p.father_name || 'Not provided'}</span></div>
                    <div class="info-item"><label>Father Mobile</label><span>${p.father_mobile || 'N/A'}</span></div>
                    <div class="info-item"><label>Father WhatsApp</label><span>${p.father_whatsapp || 'N/A'}</span></div>
                  </div>
                </div>

                <div class="profile-section-card">
                  <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--primary); margin-bottom: 0.75rem;">Mother Details</h4>
                  <div class="profile-info-grid">
                    <div class="info-item"><label>Mother Name</label><span>${p.mother_name || 'Not provided'}</span></div>
                    <div class="info-item"><label>Mother Mobile</label><span>${p.mother_mobile || 'N/A'}</span></div>
                    <div class="info-item"><label>Mother WhatsApp</label><span>${p.mother_whatsapp || 'N/A'}</span></div>
                  </div>
                </div>

                <div class="profile-section-card" style="border-left: 4px solid var(--whatsapp);">
                  <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--whatsapp); margin-bottom: 0.75rem;">Primary Contact for WhatsApp Reminders</h4>
                  <div class="profile-info-grid">
                    <div class="info-item"><label>Guardian / Primary Name</label><span>${p.guardian_name || 'Parent'} (${p.relationship || 'Guardian'})</span></div>
                    <div class="info-item"><label>Verified Primary WhatsApp</label><span style="color: var(--whatsapp); font-weight: 700;">${p.primary_whatsapp}</span></div>
                    <div class="info-item"><label>Alternate Mobile</label><span>${p.alternate_mobile || 'N/A'}</span></div>
                    <div class="info-item"><label>Parent Email</label><span>${p.email || 'N/A'}</span></div>
                  </div>
                </div>
              </div>

              <!-- Section 3: Fee Details -->
              <div id="tab-fee-history" class="profile-tab-pane" style="display: none;">
                <div class="profile-section-card" style="background: #f8fafc;">
                  <div class="profile-info-grid">
                    <div class="info-item"><label>Monthly Fee</label><span style="font-size: 1.1rem; font-weight: 700;">₹${f.monthly_fee}</span></div>
                    <div class="info-item"><label>Due Day</label><span>${f.due_date_day}th of each month</span></div>
                    <div class="info-item"><label>Total Invoiced</label><span>₹${f.total_invoiced}</span></div>
                    <div class="info-item"><label>Total Paid</label><span style="color: var(--success); font-weight: 700;">₹${f.total_paid}</span></div>
                    <div class="info-item"><label>Outstanding Balance</label><span style="color: ${f.outstanding_balance > 0 ? 'var(--danger)' : 'var(--success)'}; font-weight: 800; font-size: 1.1rem;">₹${f.outstanding_balance}</span></div>
                  </div>
                </div>

                <h4 style="font-size: 0.9rem; font-weight: 700; margin: 1rem 0 0.5rem 0;">Monthly Invoices</h4>
                <div class="table-responsive">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Month</th>
                        <th>Amount</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${f.invoices.map(inv => `
                        <tr>
                          <td><strong>${inv.invoice_number}</strong></td>
                          <td>${inv.billing_month}</td>
                          <td>₹${inv.fee_amount}</td>
                          <td>${inv.due_date}</td>
                          <td><span class="badge ${inv.status === 'Paid' ? 'badge-paid' : inv.status === 'Partially Paid' ? 'badge-partially-paid' : 'badge-overdue'}">${inv.status}</span></td>
                          <td>
                            ${inv.status !== 'Paid' ? `
                              <button class="btn btn-success btn-sm" onclick="FeesComponent.openRecordPaymentModal(${inv.id}, ${s.id}, '${inv.invoice_number}', '${s.student_name.replace(/'/g, "\\'")}', '${inv.billing_month}', ${inv.fee_amount})">
                                Collect
                              </button>
                            ` : `<span style="color: var(--success); font-size: 0.8rem;">✓ Settled</span>`}
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>

                <h4 style="font-size: 0.9rem; font-weight: 700; margin: 1.25rem 0 0.5rem 0;">Payment Transaction History</h4>
                <div class="table-responsive">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Receipt No</th>
                        <th>Month</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Method</th>
                        <th>Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${(f.payment_history || []).length === 0 ? `
                        <tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No payment transactions yet.</td></tr>
                      ` : f.payment_history.map(p => `
                        <tr>
                          <td><strong>${p.receipt_number}</strong></td>
                          <td>${p.billing_month}</td>
                          <td style="color: var(--success); font-weight: 700;">₹${p.amount_received}</td>
                          <td>${p.payment_date}</td>
                          <td>${p.payment_method}</td>
                          <td>
                            <button class="btn btn-secondary btn-sm" onclick="FeesComponent.printReceipt(${p.id})">🖨️ Receipt</button>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Section 4: Attendance -->
              <div id="tab-attendance-info" class="profile-tab-pane" style="display: none;">
                <div class="profile-section-card" style="background: #f8fafc;">
                  <div class="profile-info-grid">
                    <div class="info-item"><label>Attendance Rate</label><span style="font-size: 1.25rem; font-weight: 800; color: var(--primary);">${att.attendance_rate}%</span></div>
                    <div class="info-item"><label>Present Days</label><span style="color: var(--success); font-weight: 700;">${att.present_days}</span></div>
                    <div class="info-item"><label>Absent Days</label><span style="color: var(--danger); font-weight: 700;">${att.absent_days}</span></div>
                    <div class="info-item"><label>Total Days Recorded</label><span>${att.total_days}</span></div>
                  </div>
                </div>

                <h4 style="font-size: 0.9rem; font-weight: 700; margin: 1rem 0 0.5rem 0;">Recent Attendance Log</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 6px;">
                  ${(att.records || []).map(r => `
                    <div style="padding: 6px 10px; border-radius: 6px; font-size: 0.78rem; display: flex; justify-content: space-between; align-items: center; background: ${r.status === 'Present' ? 'var(--success-light)' : 'var(--danger-light)'}; border: 1px solid ${r.status === 'Present' ? '#a7f3d0' : '#fecaca'};">
                      <span>${r.attendance_date}</span>
                      <strong style="color: ${r.status === 'Present' ? 'var(--success)' : 'var(--danger)'};">${r.status}</strong>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Section 5: Test Reports -->
              <div id="tab-test-reports" class="profile-tab-pane" style="display: none;">
                <div class="table-responsive">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Test Title</th>
                        <th>Subject</th>
                        <th>Date</th>
                        <th>Score</th>
                        <th>Batch Rank</th>
                        <th>Teacher Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${tests.length === 0 ? `
                        <tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 1.5rem;">No test assessments recorded.</td></tr>
                      ` : tests.map(t => `
                        <tr>
                          <td><strong>${t.test_title}</strong></td>
                          <td>${t.subject}</td>
                          <td>${t.test_date}</td>
                          <td style="font-weight: 700;">${t.marks_obtained} / ${t.total_marks}</td>
                          <td><span class="badge" style="background: #e0f2fe; color: #0369a1;">#Rank ${t.rank || 'N/A'}</span></td>
                          <td>${t.remarks || '—'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Section 6: WhatsApp Reminder History -->
              <div id="tab-wa-history" class="profile-tab-pane" style="display: none;">
                <div class="table-responsive">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Reminder Type</th>
                        <th>Parent Contact Used</th>
                        <th>Status</th>
                        <th>Message Preview</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${waLogs.length === 0 ? `
                        <tr><td colspan="5" style="text-align:center; color: var(--text-muted); padding: 1.5rem;">No WhatsApp reminders logged for this student yet.</td></tr>
                      ` : waLogs.map(l => `
                        <tr>
                          <td>${l.created_at ? l.created_at.split('T')[0] : ''}</td>
                          <td><span class="badge badge-active">${l.reminder_type}</span></td>
                          <td style="font-weight: 600;">${l.phone_used}</td>
                          <td><span class="badge" style="background: #e2e8f0;">${l.status}</span></td>
                          <td style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.78rem;">
                            ${l.message_text}
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        `,
        confirmText: "Close Profile",
        onConfirm: () => App.closeModal()
      });
    } catch (err) {
      App.showToast(err.message, "error");
    }
  },

  switchProfileTab(tabId, btn) {
    document.querySelectorAll(".profile-tab-pane").forEach(pane => pane.style.display = "none");
    document.getElementById(tabId).style.display = "block";
    document.querySelectorAll("#profile-tabs .tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  },

  async openEditStudentInfoModal(studentId) {
    try {
      const resp = await API.getStudentProfile(studentId);
      const s = resp.student;
      const [centresRes, classesRes, batchesRes] = await Promise.all([API.getCentres(), API.getClasses(), API.getBatches()]);

      App.showModal({
        title: `Edit Student Info: ${s.student_name}`,
        content: `
          <form id="form-edit-student-info">
            <div class="form-group">
              <label class="form-label required">Student Full Name</label>
              <input type="text" id="edit-st-name" class="form-control" value="${s.student_name}" required>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label required">Centre</label>
                <select id="edit-st-centre" class="form-control" required>
                  ${(centresRes.centres || []).map(c => `<option value="${c.id}" ${c.id === s.centre_id ? 'selected' : ''}>${c.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label required">Class</label>
                <select id="edit-st-class" class="form-control" required>
                  ${(classesRes.classes || []).map(cl => `<option value="${cl.id}" ${cl.id === s.class_id ? 'selected' : ''}>${cl.name}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label required">Batch</label>
                <select id="edit-st-batch" class="form-control" required>
                  ${(batchesRes.batches || []).map(b => `<option value="${b.id}" ${b.id === s.batch_id ? 'selected' : ''}>${b.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label required">Admission Date</label>
                <input type="date" id="edit-st-adm" class="form-control" value="${s.admission_date}" required>
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Status</label>
                <select id="edit-st-status" class="form-control">
                  <option value="Active" ${s.status === 'Active' ? 'selected' : ''}>Active</option>
                  <option value="Inactive" ${s.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Address</label>
                <input type="text" id="edit-st-address" class="form-control" value="${s.address || ''}">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea id="edit-st-notes" class="form-control" rows="2">${s.notes || ''}</textarea>
            </div>
          </form>
        `,
        confirmText: "Save Student Changes",
        onConfirm: async () => {
          const payload = {
            student_name: document.getElementById("edit-st-name").value,
            centre_id: document.getElementById("edit-st-centre").value,
            class_id: document.getElementById("edit-st-class").value,
            batch_id: document.getElementById("edit-st-batch").value,
            admission_date: document.getElementById("edit-st-adm").value,
            status: document.getElementById("edit-st-status").value,
            address: document.getElementById("edit-st-address").value,
            notes: document.getElementById("edit-st-notes").value
          };
          try {
            const res = await API.updateStudentInfo(studentId, payload);
            App.showToast(res.message, "success");
            StudentsComponent.viewStudentProfile(studentId);
            StudentsComponent.loadStudentsList();
          } catch (err) {
            App.showToast(err.message, "error");
          }
        }
      });
    } catch (e) {
      App.showToast("Failed to load details: " + e.message, "error");
    }
  },

  async openEditParentInfoModal(studentId) {
    try {
      const resp = await API.getStudentProfile(studentId);
      const p = resp.student.parent || {};

      App.showModal({
        title: `Edit Parent Details & WhatsApp: ${resp.student.student_name}`,
        content: `
          <form id="form-edit-parent-info">
            <div style="background: #f0fdf4; border-left: 4px solid var(--whatsapp); padding: 0.75rem; border-radius: 4px; font-size: 0.8rem; color: #166534; margin-bottom: 1rem;">
              Updating the Primary WhatsApp Number here will automatically update the number used for all upcoming fee reminders. Historical reminder logs remain preserved.
            </div>

            <div class="form-section-divider" style="margin-top: 0;">
              <span class="form-section-title">📱 Primary Reminder Contact</span>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label required">Primary Parent / Guardian Name</label>
                <input type="text" id="edit-p-guardian-name" class="form-control" value="${p.guardian_name || ''}" required>
              </div>
              <div class="form-group">
                <label class="form-label required">Relationship</label>
                <select id="edit-p-relationship" class="form-control" required>
                  <option value="Father" ${p.relationship === 'Father' ? 'selected' : ''}>Father</option>
                  <option value="Mother" ${p.relationship === 'Mother' ? 'selected' : ''}>Mother</option>
                  <option value="Guardian" ${p.relationship === 'Guardian' ? 'selected' : ''}>Guardian</option>
                  <option value="Other" ${p.relationship === 'Other' ? 'selected' : ''}>Other</option>
                </select>
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label required">Primary Parent WhatsApp (10 Digits)</label>
                <input type="tel" id="edit-p-primary-wa" class="form-control" value="${p.primary_whatsapp || ''}" maxlength="15" required>
              </div>
              <div class="form-group">
                <label class="form-label">Alternate Mobile</label>
                <input type="tel" id="edit-p-alt-mobile" class="form-control" value="${p.alternate_mobile || ''}" maxlength="15">
              </div>
            </div>

            <div class="form-section-divider">
              <span class="form-section-title">👨 Father Details</span>
            </div>
            <div class="form-group">
              <label class="form-label">Father Full Name</label>
              <input type="text" id="edit-p-father-name" class="form-control" value="${p.father_name || ''}">
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Father Mobile</label>
                <input type="tel" id="edit-p-father-mobile" class="form-control" value="${p.father_mobile || ''}">
              </div>
              <div class="form-group">
                <label class="form-label">Father WhatsApp</label>
                <input type="tel" id="edit-p-father-wa" class="form-control" value="${p.father_whatsapp || ''}">
              </div>
            </div>

            <div class="form-section-divider">
              <span class="form-section-title">👩 Mother Details</span>
            </div>
            <div class="form-group">
              <label class="form-label">Mother Full Name</label>
              <input type="text" id="edit-p-mother-name" class="form-control" value="${p.mother_name || ''}">
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Mother Mobile</label>
                <input type="tel" id="edit-p-mother-mobile" class="form-control" value="${p.mother_mobile || ''}">
              </div>
              <div class="form-group">
                <label class="form-label">Mother WhatsApp</label>
                <input type="tel" id="edit-p-mother-wa" class="form-control" value="${p.mother_whatsapp || ''}">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Parent Email</label>
              <input type="email" id="edit-p-email" class="form-control" value="${p.email || ''}">
            </div>
          </form>
        `,
        confirmText: "Update Parent Information",
        onConfirm: async () => {
          const payload = {
            guardian_name: document.getElementById("edit-p-guardian-name").value,
            relationship: document.getElementById("edit-p-relationship").value,
            primary_whatsapp: document.getElementById("edit-p-primary-wa").value,
            alternate_mobile: document.getElementById("edit-p-alt-mobile").value,
            father_name: document.getElementById("edit-p-father-name").value,
            father_mobile: document.getElementById("edit-p-father-mobile").value,
            father_whatsapp: document.getElementById("edit-p-father-wa").value,
            mother_name: document.getElementById("edit-p-mother-name").value,
            mother_mobile: document.getElementById("edit-p-mother-mobile").value,
            mother_whatsapp: document.getElementById("edit-p-mother-wa").value,
            email: document.getElementById("edit-p-email").value
          };
          try {
            const res = await API.updateParentInfo(studentId, payload);
            App.showToast(res.message, "success");
            StudentsComponent.viewStudentProfile(studentId);
            StudentsComponent.loadStudentsList();
          } catch (err) {
            App.showToast(err.message, "error");
          }
        }
      });
    } catch (e) {
      App.showToast("Error: " + e.message, "error");
    }
  },

  async openEditFeeInfoModal(studentId) {
    try {
      const resp = await API.getStudentProfile(studentId);
      const s = resp.student;

      App.showModal({
        title: `Edit Fee Plan: ${s.student_name}`,
        content: `
          <form id="form-edit-fee-info">
            <div class="form-group">
              <label class="form-label required">Monthly Tuition Fee (₹)</label>
              <input type="number" id="edit-fee-amount" class="form-control" value="${s.monthly_fee}" min="0" step="50" required>
            </div>
            <div class="form-group">
              <label class="form-label required">Individual Due Date Day</label>
              <input type="number" id="edit-due-day" class="form-control" value="${s.due_date_day}" min="1" max="28" required>
              <small style="color: var(--text-muted); font-size: 0.72rem;">Day of each month (1–28)</small>
            </div>
          </form>
        `,
        confirmText: "Save Fee Changes",
        onConfirm: async () => {
          const payload = {
            monthly_fee: document.getElementById("edit-fee-amount").value,
            due_date_day: document.getElementById("edit-due-day").value
          };
          try {
            const res = await API.updateFeeInfo(studentId, payload);
            App.showToast(res.message, "success");
            StudentsComponent.viewStudentProfile(studentId);
            StudentsComponent.loadStudentsList();
          } catch (err) {
            App.showToast(err.message, "error");
          }
        }
      });
    } catch (e) {
      App.showToast(e.message, "error");
    }
  },

  confirmArchive(studentId, studentName) {
    App.showModal({
      title: "Archive Student",
      content: `
        <div>
          <p style="font-size: 0.9rem; color: var(--text-main);">
            Are you sure you want to archive <strong>${studentName}</strong>?
          </p>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.5rem;">
            Archived students are hidden from active lists and fee reminders. All past fee records, attendance, and exam test results will remain permanently preserved and can be restored at any time.
          </p>
        </div>
      `,
      confirmText: "Yes, Archive Student",
      confirmBtnClass: "btn-danger",
      onConfirm: async () => {
        try {
          const res = await API.archiveStudent(studentId);
          App.showToast(res.message, "success");
          App.closeModal();
          StudentsComponent.loadStudentsList();
        } catch (err) {
          App.showToast(err.message, "error");
        }
      }
    });
  },

  async restoreStudent(studentId) {
    try {
      const res = await API.restoreStudent(studentId);
      App.showToast(res.message, "success");
      StudentsComponent.loadStudentsList();
    } catch (err) {
      App.showToast(err.message, "error");
    }
  }
};
