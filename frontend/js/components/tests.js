/**
 * TUITIONAPP — Weekly Tests & Sunday Performance Reports Component
 * Test scheduling, marks entry, automated ranking calculation,
 * and Sunday Weekly Parent Report WhatsApp generation.
 */

const TestsComponent = {
  async render() {
    const mainView = document.getElementById("main-view");
    if (!mainView) return;

    mainView.innerHTML = `
      <div class="page-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-main);">Weekly Assessments & Tests</h2>
            <p style="font-size: 0.82rem; color: var(--text-muted);">
              Record student scores, auto-compute ranks, and dispatch Sunday performance reports to parents
            </p>
          </div>
          <button class="btn btn-primary" id="btn-add-test-modal">
            <span>📝</span> Schedule New Test
          </button>
        </div>

        <div class="content-section">
          <div class="section-header">
            <div class="section-title">
              <span>📊</span> Assessment History
            </div>
          </div>
          <div id="tests-table-container">
            <div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
              ⏳ Loading tests...
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-add-test-modal").addEventListener("click", () => {
      TestsComponent.openAddTestModal();
    });

    await TestsComponent.loadTests();
  },

  async loadTests() {
    const container = document.getElementById("tests-table-container");
    if (!container) return;

    try {
      const resp = await API.getTests();
      const tests = resp.tests || [];

      if (tests.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 3rem 1.5rem;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📚</div>
            <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main);">No assessments created yet</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Click "Schedule New Test" to record marks and rankings.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Assessment Title</th>
                <th>Subject</th>
                <th>Class & Batch</th>
                <th>Centre</th>
                <th>Date</th>
                <th>Max Marks</th>
                <th>Scores Recorded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${tests.map(t => `
                <tr>
                  <td><strong>${t.title}</strong></td>
                  <td style="font-weight: 600; color: var(--primary);">${t.subject}</td>
                  <td>${t.class_name} • ${t.batch_name}</td>
                  <td>${t.centre_name}</td>
                  <td>${t.test_date}</td>
                  <td><strong>${t.total_marks}</strong> pts</td>
                  <td><span class="badge badge-active">${t.results_recorded_count} students</span></td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="TestsComponent.viewTestDetails(${t.id})">
                      Enter / View Scores
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color: var(--danger); padding: 1.5rem;">Failed to load tests: ${err.message}</div>`;
    }
  },

  async openAddTestModal() {
    try {
      const [cRes, clRes, bRes] = await Promise.all([API.getCentres(), API.getClasses(), API.getBatches()]);
      const centres = cRes.centres || [];
      const classes = clRes.classes || [];
      const batches = bRes.batches || [];

      App.showModal({
        title: "Schedule Weekly Assessment",
        content: `
          <form id="form-add-test">
            <div class="form-group">
              <label class="form-label required">Assessment Title</label>
              <input type="text" id="add-t-title" class="form-control" placeholder="e.g. Class 10 Science Weekly Assessment #5" required>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label required">Centre</label>
                <select id="add-t-centre" class="form-control" required>
                  ${centres.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label required">Class</label>
                <select id="add-t-class" class="form-control" required>
                  ${classes.map(cl => `<option value="${cl.id}">${cl.name}</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label required">Batch</label>
                <select id="add-t-batch" class="form-control" required>
                  ${batches.map(b => `<option value="${b.id}">${b.name} (${b.batch_timing})</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label required">Subject</label>
                <input type="text" id="add-t-subject" class="form-control" placeholder="e.g. Physics & Chemistry" required>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label required">Test Date</label>
                <input type="date" id="add-t-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
              </div>
              <div class="form-group">
                <label class="form-label required">Total / Max Marks</label>
                <input type="number" id="add-t-total-marks" class="form-control" value="50" min="5" step="5" required>
              </div>
            </div>
          </form>
        `,
        confirmText: "Create Assessment",
        onConfirm: async () => {
          const payload = {
            title: document.getElementById("add-t-title").value,
            centre_id: document.getElementById("add-t-centre").value,
            class_id: document.getElementById("add-t-class").value,
            batch_id: document.getElementById("add-t-batch").value,
            subject: document.getElementById("add-t-subject").value,
            test_date: document.getElementById("add-t-date").value,
            total_marks: document.getElementById("add-t-total-marks").value
          };
          try {
            const res = await API.addTest(payload);
            App.showToast(res.message, "success");
            App.closeModal();
            TestsComponent.loadTests();
          } catch (err) {
            App.showToast(err.message, "error");
          }
        }
      });
    } catch (e) {
      App.showToast(e.message, "error");
    }
  },

  async viewTestDetails(testId) {
    App.showModal({
      title: "Loading Assessment Roster...",
      content: `<div style="text-align: center; padding: 2rem;">⏳ Fetching student test marks and ranks...</div>`
    });

    try {
      const resp = await API.getTestDetails(testId);
      const test = resp.test;
      const students = resp.students || [];

      App.showModal({
        title: `Scores: ${test.title}`,
        content: `
          <div>
            <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius); padding: 0.75rem 1rem; margin-bottom: 1rem; font-size: 0.85rem; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
              <div>Subject: <strong>${test.subject}</strong> | Class: <strong>${test.class_name}</strong></div>
              <div>Batch: <strong>${test.batch_name}</strong> | Total Marks: <strong>${test.total_marks}</strong></div>
            </div>

            <div class="table-responsive">
              <table class="data-table" id="test-scores-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Rank</th>
                    <th style="width: 110px;">Marks (/${test.total_marks})</th>
                    <th>Teacher Remarks</th>
                    <th style="text-align: right;">Sunday Report</th>
                  </tr>
                </thead>
                <tbody>
                  ${students.map(s => `
                    <tr data-student-id="${s.student_id}">
                      <td>
                        <div style="font-weight: 700;">${s.student_name}</div>
                        <div style="font-size: 0.72rem; color: var(--text-muted);">${s.parent_name}: ${s.parent_phone}</div>
                      </td>
                      <td>
                        ${s.rank ? `
                          <span class="badge" style="background: #e0f2fe; color: #0284c7; font-weight: 800;">#${s.rank}</span>
                        ` : '—'}
                      </td>
                      <td>
                        <input type="number" class="form-control score-input" style="padding: 4px 8px; font-weight: 700;" value="${s.marks_obtained !== null && s.marks_obtained !== undefined ? s.marks_obtained : ''}" max="${test.total_marks}" min="0" step="0.5">
                      </td>
                      <td>
                        <input type="text" class="form-control remarks-input" style="padding: 4px 8px;" placeholder="Remarks" value="${s.remarks || ''}">
                      </td>
                      <td style="text-align: right;">
                        <button class="btn btn-whatsapp btn-sm" onclick="TestsComponent.sendSundayReport(${test.id}, ${s.student_id})" ${s.marks_obtained === null ? 'disabled title="Enter marks first"' : ''}>
                          💬 Sunday Report
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `,
        confirmText: "Save Marks & Calculate Ranks",
        confirmBtnClass: "btn-primary",
        onConfirm: async () => {
          const rows = document.querySelectorAll("#test-scores-table tbody tr");
          const records = [];
          rows.forEach(r => {
            const sId = parseInt(r.getAttribute("data-student-id"));
            const scoreVal = r.querySelector(".score-input").value;
            const remarksVal = r.querySelector(".remarks-input").value;
            records.push({
              student_id: sId,
              marks_obtained: scoreVal !== "" ? parseFloat(scoreVal) : null,
              remarks: remarksVal
            });
          });

          try {
            const res = await API.saveTestMarks(testId, records);
            App.showToast(res.message, "success");
            TestsComponent.viewTestDetails(testId);
            TestsComponent.loadTests();
          } catch (err) {
            App.showToast(err.message, "error");
          }
        }
      });
    } catch (err) {
      App.showToast(err.message, "error");
    }
  },

  async sendSundayReport(testId, studentId) {
    App.showModal({
      title: "Preparing Sunday Performance Report...",
      content: `<div style="text-align: center; padding: 2rem;">⏳ Generating report preview for WhatsApp...</div>`
    });

    try {
      const resp = await API.prepareTestReport(testId, studentId);

      App.showModal({
        title: `Weekly Test Report: ${resp.student_name}`,
        content: `
          <div>
            <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius); padding: 0.75rem 1rem; margin-bottom: 1rem; font-size: 0.85rem;">
              Parent WhatsApp: <strong style="color: var(--whatsapp); font-size: 0.95rem;">${resp.parent_phone}</strong> (${resp.parent_name})
            </div>

            <label class="form-label" style="font-weight: 700;">Hinglish Sunday Report Message (Editable):</label>
            <div class="wa-preview-box">
              <textarea id="sunday-report-msg" class="form-control" style="font-family: inherit; font-size: 0.88rem; min-height: 150px; background: transparent; border: none; resize: vertical; padding: 0;">${resp.message}</textarea>
            </div>
          </div>
        `,
        confirmText: "🟢 Open in WhatsApp Click-to-Chat",
        confirmBtnClass: "btn-whatsapp",
        onConfirm: async () => {
          const customText = document.getElementById("sunday-report-msg").value;
          const url = `https://wa.me/${resp.parent_phone}?text=${encodeURIComponent(customText)}`;
          await API.logReminderStatus(resp.log_id, "WhatsApp Opened");
          window.open(url, "_blank");
          App.showToast("Sunday report opened in WhatsApp.", "info");
          App.closeModal();
        }
      });
    } catch (err) {
      App.showToast(err.message, "error");
    }
  }
};
