/**
 * TUITIONAPP — Attendance Management Component
 * Batch attendance marking, Present/Absent quick toggles,
 * and Instant Parent Absence WhatsApp notifications.
 */

const AttendanceComponent = {
  selectedCentre: null,
  selectedClass: null,
  selectedBatch: null,
  selectedDate: new Date().toISOString().split('T')[0],

  async render() {
    const mainView = document.getElementById("main-view");
    if (!mainView) return;

    mainView.innerHTML = `
      <div class="page-container">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-main);">Daily Attendance Management</h2>
            <p style="font-size: 0.82rem; color: var(--text-muted);">
              Record daily student presence and notify parents of unexcused absences via WhatsApp
            </p>
          </div>
        </div>

        <!-- Batch & Date Selector Section -->
        <div class="content-section" style="margin-bottom: 1.25rem;">
          <div class="filter-bar">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted);">1. CENTRE</label>
              <select id="att-centre-select" class="filter-select"></select>
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted);">2. CLASS</label>
              <select id="att-class-select" class="filter-select"></select>
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted);">3. BATCH</label>
              <select id="att-batch-select" class="filter-select"></select>
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted);">4. DATE</label>
              <input type="date" id="att-date-picker" class="filter-select" value="${AttendanceComponent.selectedDate}">
            </div>

            <div style="align-self: flex-end;">
              <button class="btn btn-primary" id="btn-load-attendance">
                Load Batch Roster
              </button>
            </div>
          </div>
        </div>

        <!-- Attendance Roster Container -->
        <div class="content-section" id="attendance-roster-section" style="display: none;">
          <div class="section-header">
            <div class="section-title">
              <span>📝</span> Attendance Sheet: <span id="roster-batch-title" style="color: var(--primary);"></span>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary btn-sm" id="btn-mark-all-present">Mark All Present</button>
              <button class="btn btn-secondary btn-sm" id="btn-mark-all-absent">Mark All Absent</button>
              <button class="btn btn-primary btn-sm" id="btn-save-attendance">Save Attendance</button>
            </div>
          </div>

          <div id="roster-table-container"></div>
        </div>
      </div>
    `;

    // Populate dropdowns
    try {
      const [cRes, clRes, bRes] = await Promise.all([API.getCentres(), API.getClasses(), API.getBatches()]);
      const centres = cRes.centres || [];
      const classes = clRes.classes || [];
      const batches = bRes.batches || [];

      const cSelect = document.getElementById("att-centre-select");
      const clSelect = document.getElementById("att-class-select");
      const bSelect = document.getElementById("att-batch-select");

      centres.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name;
        cSelect.appendChild(opt);
      });

      classes.forEach(cl => {
        const opt = document.createElement("option");
        opt.value = cl.id;
        opt.textContent = cl.name;
        clSelect.appendChild(opt);
      });

      const updateBatchOptions = () => {
        bSelect.innerHTML = "";
        const cId = parseInt(cSelect.value);
        const clId = parseInt(clSelect.value);
        const filtered = batches.filter(b => b.centre_id === cId && b.class_id === clId);

        if (filtered.length === 0) {
          const opt = document.createElement("option");
          opt.value = "";
          opt.textContent = "-- No batches found --";
          bSelect.appendChild(opt);
        } else {
          filtered.forEach(b => {
            const opt = document.createElement("option");
            opt.value = b.id;
            opt.textContent = `${b.name} (${b.batch_timing})`;
            bSelect.appendChild(opt);
          });
        }
      };

      cSelect.addEventListener("change", updateBatchOptions);
      clSelect.addEventListener("change", updateBatchOptions);
      updateBatchOptions();

    } catch (e) {
      console.error(e);
    }

    document.getElementById("btn-load-attendance").addEventListener("click", () => {
      AttendanceComponent.loadRoster();
    });

    document.getElementById("btn-mark-all-present").addEventListener("click", () => {
      document.querySelectorAll(".att-radio-present").forEach(r => r.checked = true);
    });

    document.getElementById("btn-mark-all-absent").addEventListener("click", () => {
      document.querySelectorAll(".att-radio-absent").forEach(r => r.checked = true);
    });

    document.getElementById("btn-save-attendance").addEventListener("click", () => {
      AttendanceComponent.saveAttendance();
    });
  },

  async loadRoster() {
    const cId = document.getElementById("att-centre-select").value;
    const clId = document.getElementById("att-class-select").value;
    const bId = document.getElementById("att-batch-select").value;
    const attDate = document.getElementById("att-date-picker").value;

    if (!cId || !clId || !bId) {
      App.showToast("Please select Centre, Class, and Batch.", "error");
      return;
    }

    AttendanceComponent.selectedCentre = cId;
    AttendanceComponent.selectedClass = clId;
    AttendanceComponent.selectedBatch = bId;
    AttendanceComponent.selectedDate = attDate;

    const rosterSection = document.getElementById("attendance-roster-section");
    const container = document.getElementById("roster-table-container");
    const bSelect = document.getElementById("att-batch-select");
    document.getElementById("roster-batch-title").textContent = bSelect.options[bSelect.selectedIndex].text + " • " + attDate;

    rosterSection.style.display = "block";
    container.innerHTML = `<div style="text-align: center; padding: 2rem;">⏳ Loading students in batch...</div>`;

    try {
      const resp = await API.getAttendance(cId, clId, bId, attDate);
      const students = resp.students || [];

      if (students.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 2.5rem; color: var(--text-muted);">No active students enrolled in this batch.</div>`;
        return;
      }

      container.innerHTML = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Parent WhatsApp</th>
                <th style="width: 220px; text-align: center;">Attendance Status</th>
                <th style="text-align: right;">Absence Notification</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(s => `
                <tr data-student-id="${s.student_id}">
                  <td>
                    <div style="font-weight: 700; color: var(--text-main); font-size: 0.95rem;">${s.student_name}</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">${s.parent_name}</div>
                  </td>
                  <td>
                    <div style="color: var(--whatsapp); font-weight: 600; font-size: 0.85rem;">
                      💬 ${s.parent_phone || 'No phone'}
                    </div>
                  </td>
                  <td style="text-align: center;">
                    <div style="display: inline-flex; gap: 12px; background: #f8fafc; padding: 4px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border);">
                      <label style="cursor: pointer; display: flex; align-items: center; gap: 4px; font-weight: 600; color: var(--success);">
                        <input type="radio" name="att_${s.student_id}" value="Present" class="att-radio-present" ${s.status === 'Present' || s.status === 'Unmarked' ? 'checked' : ''}>
                        Present
                      </label>
                      <label style="cursor: pointer; display: flex; align-items: center; gap: 4px; font-weight: 600; color: var(--danger);">
                        <input type="radio" name="att_${s.student_id}" value="Absent" class="att-radio-absent" ${s.status === 'Absent' ? 'checked' : ''}>
                        Absent
                      </label>
                    </div>
                  </td>
                  <td style="text-align: right;">
                    <button class="btn btn-whatsapp btn-sm" onclick="AttendanceComponent.sendAbsenceAlert(${s.student_id})">
                      💬 Notify Parent
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color: var(--danger); padding: 1.5rem;">Failed to load attendance: ${err.message}</div>`;
    }
  },

  async saveAttendance() {
    const rows = document.querySelectorAll("#roster-table-container tr[data-student-id]");
    const records = [];

    rows.forEach(r => {
      const sId = parseInt(r.getAttribute("data-student-id"));
      const checked = r.querySelector(`input[name="att_${sId}"]:checked`);
      const status = checked ? checked.value : "Present";
      records.push({ student_id: sId, status });
    });

    if (records.length === 0) return;

    const payload = {
      centre_id: AttendanceComponent.selectedCentre,
      class_id: AttendanceComponent.selectedClass,
      batch_id: AttendanceComponent.selectedBatch,
      attendance_date: AttendanceComponent.selectedDate,
      records
    };

    try {
      const res = await API.markAttendance(payload);
      App.showToast(res.message, "success");
    } catch (err) {
      App.showToast(err.message, "error");
    }
  },

  async sendAbsenceAlert(studentId) {
    App.showModal({
      title: "Preparing Absence Notification...",
      content: `<div style="text-align: center; padding: 2rem;">⏳ Fetching latest parent contact and generating message...</div>`
    });

    try {
      const resp = await API.prepareAbsenceAlert(studentId, AttendanceComponent.selectedDate);

      App.showModal({
        title: `Absence Notice: ${resp.student_name}`,
        content: `
          <div>
            <div style="background: #fef2f2; border-left: 4px solid var(--danger); padding: 0.75rem 1rem; border-radius: 4px; margin-bottom: 1rem; font-size: 0.85rem; color: #991b1b;">
              Student was recorded absent on <strong>${AttendanceComponent.selectedDate}</strong>.
            </div>

            <div style="margin-bottom: 0.75rem; font-size: 0.85rem;">
              Parent WhatsApp Contact: <strong style="color: var(--whatsapp); font-size: 0.95rem;">${resp.parent_phone}</strong> (${resp.parent_name})
            </div>

            <label class="form-label" style="font-weight: 700;">Hinglish WhatsApp Preview (Editable):</label>
            <div class="wa-preview-box">
              <textarea id="absence-wa-custom-msg" class="form-control" style="font-family: inherit; font-size: 0.88rem; min-height: 120px; background: transparent; border: none; resize: vertical; padding: 0;">${resp.message}</textarea>
            </div>
          </div>
        `,
        confirmText: "🟢 Open in WhatsApp Click-to-Chat",
        confirmBtnClass: "btn-whatsapp",
        onConfirm: async () => {
          const customText = document.getElementById("absence-wa-custom-msg").value;
          const url = `https://wa.me/${resp.parent_phone}?text=${encodeURIComponent(customText)}`;
          await API.logReminderStatus(resp.log_id, "WhatsApp Opened");
          window.open(url, "_blank");
          App.showToast("Absence alert WhatsApp chat opened.", "info");
          App.closeModal();
        }
      });
    } catch (err) {
      App.showToast(err.message, "error");
    }
  }
};
