/**
 * TUITIONAPP — Centres, Classes & Batches Component
 * Multi-branch management, individual centre dashboards, and student batch transfers.
 */

const CentresComponent = {
  async render() {
    const mainView = document.getElementById("main-view");
    if (!mainView) return;

    mainView.innerHTML = `
      <div class="page-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-main);">Centres, Classes & Batches</h2>
            <p style="font-size: 0.82rem; color: var(--text-muted);">Manage branch locations, lecture halls, course levels, and timings</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary" id="btn-add-centre-modal">
              <span>🏢</span> Add Centre
            </button>
            <button class="btn btn-secondary" id="btn-add-class-modal">
              <span>📚</span> Add Class
            </button>
            <button class="btn btn-secondary" id="btn-add-batch-modal">
              <span>⏰</span> Add Batch
            </button>
          </div>
        </div>

        <!-- Coaching Centres Cards Grid -->
        <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.75rem;">Coaching Centres / Branches</h3>
        <div id="centres-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
          <div style="padding: 2rem; color: var(--text-muted);">Loading centres...</div>
        </div>

        <!-- Batches & Classes Overview -->
        <div class="content-section">
          <div class="section-header">
            <div class="section-title">
              <span>🕒</span> Batches & Timing Schedules
            </div>
          </div>
          <div id="batches-table-container">
            <div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">Loading batches...</div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-add-centre-modal").addEventListener("click", () => {
      CentresComponent.openAddCentreModal();
    });

    document.getElementById("btn-add-class-modal").addEventListener("click", () => {
      CentresComponent.openAddClassModal();
    });

    document.getElementById("btn-add-batch-modal").addEventListener("click", () => {
      CentresComponent.openAddBatchModal();
    });

    await Promise.all([CentresComponent.loadCentres(), CentresComponent.loadBatches()]);
  },

  async loadCentres() {
    const grid = document.getElementById("centres-grid");
    if (!grid) return;

    try {
      const resp = await API.getCentres();
      const centres = resp.centres || [];

      if (centres.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; padding: 1.5rem; background: #fff; border-radius: var(--radius); text-align: center;">No centres registered.</div>`;
        return;
      }

      grid.innerHTML = centres.map(c => `
        <div class="stat-card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
              <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main);">${c.name}</h4>
              <span class="badge ${c.status === 'Active' ? 'badge-active' : 'badge-archived'}">${c.status}</span>
            </div>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.75rem;">
              📍 ${c.address || 'Address not listed'}
            </p>
            <div style="font-size: 0.82rem; color: var(--text-main); margin-bottom: 0.5rem;">
              📞 <strong>Contact:</strong> ${c.contact_number || 'N/A'}
            </div>
            <div style="font-size: 0.82rem; color: var(--text-main); margin-bottom: 0.5rem;">
              👨‍🏫 <strong>Lead Teacher:</strong> ${c.assigned_teacher_name || 'Unassigned'}
            </div>
            <div style="display: flex; gap: 12px; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed var(--border);">
              <span style="font-size: 0.82rem; font-weight: 600;">👥 ${c.active_students_count} Active Students</span>
              <span style="font-size: 0.82rem; font-weight: 600;">⏰ ${c.active_batches_count} Batches</span>
            </div>
          </div>
          <div style="display: flex; gap: 6px; margin-top: 1.25rem;">
            <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="CentresComponent.viewCentreDashboard(${c.id})">
              Dashboard
            </button>
            <button class="btn btn-secondary btn-sm" onclick="CentresComponent.openEditCentreModal(${c.id}, '${c.name.replace(/'/g, "\\'")}', '${(c.address || '').replace(/'/g, "\\'")}', '${c.contact_number || ''}', '${(c.description || '').replace(/'/g, "\\'")}')">
              Edit
            </button>
          </div>
        </div>
      `).join('');
    } catch (err) {
      grid.innerHTML = `<div style="color: var(--danger);">Failed to load centres: ${err.message}</div>`;
    }
  },

  async loadBatches() {
    const container = document.getElementById("batches-table-container");
    if (!container) return;

    try {
      const resp = await API.getBatches();
      const batches = resp.batches || [];

      if (batches.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-muted);">No batches created yet.</div>`;
        return;
      }

      container.innerHTML = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Batch Name</th>
                <th>Class</th>
                <th>Centre</th>
                <th>Batch Timing</th>
                <th>Assigned Teacher</th>
                <th>Enrolled Students</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${batches.map(b => `
                <tr>
                  <td><strong>${b.name}</strong></td>
                  <td>${b.class_name}</td>
                  <td>${b.centre_name}</td>
                  <td style="font-weight: 600; color: var(--primary);">${b.batch_timing}</td>
                  <td>${b.teacher_name || '—'}</td>
                  <td><strong>${b.student_count}</strong> students</td>
                  <td><span class="badge badge-active">${b.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color: var(--danger); padding: 1rem;">Failed to load batches: ${err.message}</div>`;
    }
  },

  async viewCentreDashboard(centreId) {
    App.showModal({
      title: "Loading Centre Dashboard...",
      content: `<div style="padding: 2rem; text-align: center;">⏳ Fetching centre financial & student analytics...</div>`
    });

    try {
      const resp = await API.getCentreDashboard(centreId);
      const c = resp.centre;

      App.showModal({
        title: `Centre Dashboard: ${c.name}`,
        content: `
          <div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-bottom: 1.5rem;">
              <div style="background: #eff6ff; padding: 1rem; border-radius: var(--radius);">
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">ACTIVE STUDENTS</div>
                <div style="font-size: 1.4rem; font-weight: 800; color: var(--primary);">${resp.active_students}</div>
              </div>
              <div style="background: #ecfdf5; padding: 1rem; border-radius: var(--radius);">
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">TOTAL REVENUE COLLECTED</div>
                <div style="font-size: 1.4rem; font-weight: 800; color: var(--success);">₹${resp.fees_collected}</div>
              </div>
              <div style="background: #fef2f2; padding: 1rem; border-radius: var(--radius);">
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">PENDING OVERDUE FEES</div>
                <div style="font-size: 1.4rem; font-weight: 800; color: var(--danger);">₹${resp.pending_fees}</div>
              </div>
            </div>

            <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem;">Centre Batches</h4>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Batch</th>
                    <th>Class</th>
                    <th>Timing</th>
                    <th>Teacher</th>
                    <th>Students</th>
                  </tr>
                </thead>
                <tbody>
                  ${(resp.batches || []).map(b => `
                    <tr>
                      <td><strong>${b.name}</strong></td>
                      <td>${b.class_name}</td>
                      <td style="color: var(--primary); font-weight: 600;">${b.batch_timing}</td>
                      <td>${b.teacher_name || '—'}</td>
                      <td>${b.student_count}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div style="margin-top: 1.25rem; font-size: 0.82rem; color: var(--text-muted);">
              📍 ${c.address || ''} • 📞 ${c.contact_number || ''}
            </div>
          </div>
        `,
        confirmText: "Close Dashboard",
        onConfirm: () => App.closeModal()
      });
    } catch (err) {
      App.showToast(err.message, "error");
    }
  },

  openAddCentreModal() {
    App.showModal({
      title: "Add Coaching Centre / Branch",
      content: `
        <form id="form-add-centre">
          <div class="form-group">
            <label class="form-label required">Centre Name</label>
            <input type="text" id="add-c-name" class="form-control" placeholder="e.g. Apex South Extension Branch" required>
          </div>
          <div class="form-group">
            <label class="form-label">Full Address</label>
            <input type="text" id="add-c-address" class="form-control" placeholder="Building, Street, Landmark, City">
          </div>
          <div class="form-group">
            <label class="form-label">Contact Phone Number</label>
            <input type="text" id="add-c-contact" class="form-control" placeholder="e.g. 011-23456789">
          </div>
          <div class="form-group">
            <label class="form-label">Description / Infrastructure</label>
            <textarea id="add-c-desc" class="form-control" rows="2" placeholder="e.g. 4 Smart lecture halls, Physics lab setup"></textarea>
          </div>
        </form>
      `,
      confirmText: "Save Centre",
      onConfirm: async () => {
        const payload = {
          name: document.getElementById("add-c-name").value,
          address: document.getElementById("add-c-address").value,
          contact_number: document.getElementById("add-c-contact").value,
          description: document.getElementById("add-c-desc").value
        };
        try {
          const res = await API.addCentre(payload);
          App.showToast(res.message, "success");
          App.closeModal();
          CentresComponent.loadCentres();
        } catch (err) {
          App.showToast(err.message, "error");
        }
      }
    });
  },

  openEditCentreModal(centreId, name, address, contact, desc) {
    App.showModal({
      title: `Edit Centre: ${name}`,
      content: `
        <form id="form-edit-centre">
          <div class="form-group">
            <label class="form-label required">Centre Name</label>
            <input type="text" id="edit-c-name" class="form-control" value="${name}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <input type="text" id="edit-c-address" class="form-control" value="${address}">
          </div>
          <div class="form-group">
            <label class="form-label">Contact Number</label>
            <input type="text" id="edit-c-contact" class="form-control" value="${contact}">
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea id="edit-c-desc" class="form-control" rows="2">${desc}</textarea>
          </div>
        </form>
      `,
      confirmText: "Update Centre",
      onConfirm: async () => {
        const payload = {
          name: document.getElementById("edit-c-name").value,
          address: document.getElementById("edit-c-address").value,
          contact_number: document.getElementById("edit-c-contact").value,
          description: document.getElementById("edit-c-desc").value
        };
        try {
          const res = await API.updateCentre(centreId, payload);
          App.showToast(res.message, "success");
          App.closeModal();
          CentresComponent.loadCentres();
        } catch (err) {
          App.showToast(err.message, "error");
        }
      }
    });
  },

  openAddClassModal() {
    App.showModal({
      title: "Add Academic Class",
      content: `
        <form id="form-add-class">
          <div class="form-group">
            <label class="form-label required">Class Name</label>
            <input type="text" id="add-cl-name" class="form-control" placeholder="e.g. Class 11 - Commerce" required>
          </div>
          <div class="form-group">
            <label class="form-label">Description / Subjects</label>
            <textarea id="add-cl-desc" class="form-control" rows="2" placeholder="e.g. Accountancy, Economics, Business Studies"></textarea>
          </div>
        </form>
      `,
      confirmText: "Save Class",
      onConfirm: async () => {
        const payload = {
          name: document.getElementById("add-cl-name").value,
          description: document.getElementById("add-cl-desc").value
        };
        try {
          const res = await API.addClass(payload);
          App.showToast(res.message, "success");
          App.closeModal();
          CentresComponent.loadBatches();
        } catch (err) {
          App.showToast(err.message, "error");
        }
      }
    });
  },

  async openAddBatchModal() {
    try {
      const [cRes, clRes] = await Promise.all([API.getCentres(), API.getClasses()]);
      const centres = cRes.centres || [];
      const classes = clRes.classes || [];

      App.showModal({
        title: "Add New Batch",
        content: `
          <form id="form-add-batch">
            <div class="form-group">
              <label class="form-label required">Batch Name</label>
              <input type="text" id="add-b-name" class="form-control" placeholder="e.g. Class 10 - Morning Star" required>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label required">Coaching Centre</label>
                <select id="add-b-centre" class="form-control" required>
                  ${centres.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label required">Class</label>
                <select id="add-b-class" class="form-control" required>
                  ${classes.map(cl => `<option value="${cl.id}">${cl.name}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label required">Batch Timing</label>
              <input type="text" id="add-b-timing" class="form-control" placeholder="e.g. 05:00 PM - 06:30 PM (Mon-Fri)" required>
            </div>
          </form>
        `,
        confirmText: "Create Batch",
        onConfirm: async () => {
          const payload = {
            name: document.getElementById("add-b-name").value,
            centre_id: document.getElementById("add-b-centre").value,
            class_id: document.getElementById("add-b-class").value,
            batch_timing: document.getElementById("add-b-timing").value
          };
          try {
            const res = await API.addBatch(payload);
            App.showToast(res.message, "success");
            App.closeModal();
            CentresComponent.loadBatches();
          } catch (err) {
            App.showToast(err.message, "error");
          }
        }
      });
    } catch (e) {
      App.showToast(e.message, "error");
    }
  }
};
