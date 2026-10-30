/**
 * TUITIONAPP — Owner & Admin Dashboard Component
 * Executive analytics, teacher management, centre-wise revenue breakdown,
 * referral enquiries, and official WhatsApp Business API configuration.
 */

const AdminComponent = {
  async render() {
    const mainView = document.getElementById("main-view");
    if (!mainView) return;

    const user = API.getCurrentUser();
    if (!user || !["Super Admin", "Admin"].includes(user.role)) {
      mainView.innerHTML = `
        <div class="page-container">
          <div style="background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 2rem; border-radius: var(--radius); text-align: center;">
            <h3>⛔ Administrator Access Restricted</h3>
            <p style="margin-top: 0.5rem; font-size: 0.88rem;">Only Super Admins and authorized Administrators can access executive analytics and teacher role permissions.</p>
          </div>
        </div>
      `;
      return;
    }

    mainView.innerHTML = `
      <div class="page-container">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-main);">Institute Owner & Administration</h2>
            <p style="font-size: 0.82rem; color: var(--text-muted);">
              Executive overview, centre-wise financial returns, teacher assignments, and API settings
            </p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary" id="btn-admin-enquiry-modal">
              <span>📞</span> New Enquiry
            </button>
            <button class="btn btn-primary" id="btn-admin-settings-modal">
              <span>⚙️</span> System Settings
            </button>
          </div>
        </div>

        <div id="admin-analytics-container">
          <div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
            ⏳ Fetching administrative analytics...
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-admin-enquiry-modal").addEventListener("click", () => {
      AdminComponent.openAddEnquiryModal();
    });

    document.getElementById("btn-admin-settings-modal").addEventListener("click", () => {
      AdminComponent.openSettingsModal();
    });

    await AdminComponent.loadOverview();
  },

  async loadOverview() {
    const container = document.getElementById("admin-analytics-container");
    if (!container) return;

    try {
      const resp = await API.getAdminOverview();
      const ov = resp;

      container.innerHTML = `
        <!-- High Level Stats -->
        <div class="dashboard-grid">
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-title">Total Active Centres</span>
              <div class="stat-icon info">🏢</div>
            </div>
            <div class="stat-value">${ov.total_centres}</div>
            <div class="stat-subtext">Operational coaching branches</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-title">Teaching Staff</span>
              <div class="stat-icon primary">👨‍🏫</div>
            </div>
            <div class="stat-value">${ov.total_teachers}</div>
            <div class="stat-subtext">Registered teachers & admins</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-title">Total Fees Received</span>
              <div class="stat-icon success">💰</div>
            </div>
            <div class="stat-value" style="color: var(--success);">₹${ov.total_fees_received.toLocaleString('en-IN')}</div>
            <div class="stat-subtext">Cumulative settled payments</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-title">Pending Institute Fees</span>
              <div class="stat-icon danger">⚠️</div>
            </div>
            <div class="stat-value" style="color: var(--danger);">₹${ov.total_pending_fees.toLocaleString('en-IN')}</div>
            <div class="stat-subtext">Total institute overdue balance</div>
          </div>
        </div>

        <!-- Centre-wise Revenue Breakdown -->
        <div class="content-section" style="margin-bottom: 1.5rem;">
          <div class="section-header">
            <div class="section-title">
              <span>🏢</span> Centre-Wise Financial & Student Performance
            </div>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Coaching Centre</th>
                  <th>Active Students</th>
                  <th>Revenue Collected</th>
                  <th>Pending Overdue</th>
                  <th>Collection Rate</th>
                </tr>
              </thead>
              <tbody>
                ${(ov.centre_breakdown || []).map(cb => {
                  const total = cb.revenue + cb.pending;
                  const rate = total > 0 ? Math.round((cb.revenue / total) * 100) : 100;
                  return `
                    <tr>
                      <td><strong>${cb.name}</strong></td>
                      <td>${cb.student_count} students</td>
                      <td style="color: var(--success); font-weight: 700;">₹${cb.revenue.toLocaleString('en-IN')}</td>
                      <td style="color: var(--danger); font-weight: 700;">₹${cb.pending.toLocaleString('en-IN')}</td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <div style="flex: 1; height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; min-width: 60px;">
                            <div style="height: 100%; width: ${rate}%; background: var(--success);"></div>
                          </div>
                          <span style="font-weight: 700; font-size: 0.8rem;">${rate}%</span>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Teachers & Roles Management -->
        <div class="content-section" style="margin-bottom: 1.5rem;">
          <div class="section-header">
            <div class="section-title">
              <span>👨‍🏫</span> Faculty & Role Permissions
            </div>
            <button class="btn btn-secondary btn-sm" id="btn-refresh-teachers">Refresh Teachers</button>
          </div>
          <div id="teachers-table-container">
            <div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">Loading faculty list...</div>
          </div>
        </div>

        <!-- Referral Enquiries & WhatsApp API Scaffolding -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.5rem;">
          <!-- Enquiries -->
          <div class="content-section">
            <div class="section-header">
              <div class="section-title">
                <span>📞</span> Referral Enquiries (${ov.enquiries_stats.total})
              </div>
            </div>
            <div id="enquiries-list-container" style="padding: 1rem;">
              <div style="color: var(--text-muted);">Loading enquiries...</div>
            </div>
          </div>

          <!-- Official WhatsApp API Scaffolding Card -->
          <div class="content-section">
            <div class="section-header">
              <div class="section-title">
                <span>🌐</span> Official WhatsApp Business API
              </div>
              <button class="btn btn-secondary btn-sm" id="btn-config-wa-api">Configure API</button>
            </div>
            <div style="padding: 1.25rem;">
              <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem; margin-bottom: 1rem;">
                <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">CURRENT ENGINE MODE</div>
                <div style="font-size: 1.05rem; font-weight: 700; color: var(--whatsapp); margin-top: 2px;">
                  🟢 Teacher Click-to-Chat (wa.me)
                </div>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 6px; line-height: 1.4;">
                  Direct URL dispatch with percent-encoded Hinglish templates. Zero API cost, immediate delivery, full teacher control.
                </p>
              </div>

              <div style="font-size: 0.82rem; color: var(--text-main); margin-bottom: 0.5rem;">
                <strong>Cloud API Webhook:</strong> <code>/api/whatsapp/webhook</code>
              </div>
              <div style="font-size: 0.82rem; color: var(--text-main);">
                <strong>Webhook Challenge:</strong> Verified via <code>hub.verify_token</code>
              </div>
            </div>
          </div>
        </div>
      `;

      document.getElementById("btn-refresh-teachers").addEventListener("click", () => {
        AdminComponent.loadTeachers();
      });

      document.getElementById("btn-config-wa-api").addEventListener("click", () => {
        AdminComponent.openWhatsAppConfigModal();
      });

      await Promise.all([AdminComponent.loadTeachers(), AdminComponent.loadEnquiries()]);

    } catch (err) {
      container.innerHTML = `<div style="color: var(--danger); padding: 1.5rem;">Failed to load overview: ${err.message}</div>`;
    }
  },

  async loadTeachers() {
    const container = document.getElementById("teachers-table-container");
    if (!container) return;

    try {
      const resp = await API.getTeachers();
      const teachers = resp.teachers || [];

      container.innerHTML = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Teacher Name</th>
                <th>Mobile Number</th>
                <th>Role</th>
                <th>Assigned Centres</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${teachers.map(t => `
                <tr>
                  <td><strong>${t.full_name}</strong></td>
                  <td>${t.mobile_number}</td>
                  <td>
                    <span class="badge ${t.role === 'Super Admin' ? 'badge-overdue' : t.role === 'Admin' ? 'badge-partially-paid' : 'badge-active'}">
                      ${t.role}
                    </span>
                  </td>
                  <td>
                    ${t.assigned_centres.length === 0 ? `
                      <span style="color: var(--text-muted); font-size: 0.8rem;">All Centres (Global)</span>
                    ` : t.assigned_centres.map(c => `
                      <span class="badge" style="background: #e2e8f0; margin-right: 4px;">${c.name}</span>
                    `).join('')}
                  </td>
                  <td><span class="badge badge-active">${t.status}</span></td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="AdminComponent.openEditTeacherModal(${t.id}, '${t.full_name.replace(/'/g, "\\'")}', '${t.role}', '${t.status}')">
                      Permissions
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color: var(--danger); padding: 1rem;">Failed to load teachers: ${err.message}</div>`;
    }
  },

  async loadEnquiries() {
    const container = document.getElementById("enquiries-list-container");
    if (!container) return;

    try {
      const resp = await API.getEnquiries();
      const enquiries = resp.enquiries || [];

      if (enquiries.length === 0) {
        container.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem;">No enquiries recorded yet.</div>`;
        return;
      }

      container.innerHTML = enquiries.slice(0, 6).map(e => `
        <div style="padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); margin-bottom: 0.5rem; background: #fff;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: var(--text-main); font-size: 0.9rem;">${e.student_name}</strong>
            <span class="badge badge-active">${e.status}</span>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
            Parent: ${e.parent_name} • Phone: ${e.contact_number}
          </div>
          ${e.notes ? `<div style="font-size: 0.75rem; color: var(--text-main); margin-top: 4px;">${e.notes}</div>` : ''}
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<div style="color: var(--danger);">${err.message}</div>`;
    }
  },

  openEditTeacherModal(teacherId, name, role, status) {
    App.showModal({
      title: `Teacher Permissions: ${name}`,
      content: `
        <form id="form-edit-teacher-role">
          <div class="form-group">
            <label class="form-label required">System Role</label>
            <select id="edit-t-role" class="form-control" required>
              <option value="Teacher" ${role === 'Teacher' ? 'selected' : ''}>Teacher (Assigned Centres Only)</option>
              <option value="Admin" ${role === 'Admin' ? 'selected' : ''}>Admin (All Centres & Management)</option>
              <option value="Super Admin" ${role === 'Super Admin' ? 'selected' : ''}>Super Admin (Full Root Access)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Account Status</label>
            <select id="edit-t-status" class="form-control" required>
              <option value="Active" ${status === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Inactive" ${status === 'Inactive' ? 'selected' : ''}>Inactive / Suspended</option>
            </select>
          </div>
        </form>
      `,
      confirmText: "Update Role",
      onConfirm: async () => {
        const newRole = document.getElementById("edit-t-role").value;
        const newStatus = document.getElementById("edit-t-status").value;
        try {
          const res = await API.updateTeacherRole(teacherId, newRole, newStatus);
          App.showToast(res.message, "success");
          App.closeModal();
          AdminComponent.loadTeachers();
        } catch (err) {
          App.showToast(err.message, "error");
        }
      }
    });
  },

  openAddEnquiryModal() {
    App.showModal({
      title: "Register Admission Enquiry",
      content: `
        <form id="form-add-enquiry">
          <div class="form-group">
            <label class="form-label required">Student Name</label>
            <input type="text" id="enq-student" class="form-control" placeholder="Candidate student name" required>
          </div>
          <div class="form-group">
            <label class="form-label">Parent / Guardian Name</label>
            <input type="text" id="enq-parent" class="form-control" placeholder="Parent name">
          </div>
          <div class="form-group">
            <label class="form-label required">Contact Phone Number</label>
            <input type="tel" id="enq-contact" class="form-control" placeholder="10-digit phone" maxlength="15" required>
          </div>
          <div class="form-group">
            <label class="form-label">Enquiry Notes</label>
            <textarea id="enq-notes" class="form-control" rows="2" placeholder="e.g. Inquired about Class 10 Foundation batch"></textarea>
          </div>
        </form>
      `,
      confirmText: "Save Enquiry",
      onConfirm: async () => {
        const payload = {
          student_name: document.getElementById("enq-student").value,
          parent_name: document.getElementById("enq-parent").value,
          contact_number: document.getElementById("enq-contact").value,
          notes: document.getElementById("enq-notes").value
        };
        try {
          const res = await API.addEnquiry(payload);
          App.showToast(res.message, "success");
          App.closeModal();
          AdminComponent.loadEnquiries();
        } catch (err) {
          App.showToast(err.message, "error");
        }
      }
    });
  },

  async openSettingsModal() {
    App.showModal({
      title: "Loading Settings...",
      content: `<div style="text-align: center; padding: 2rem;">⏳ Fetching institute settings...</div>`
    });

    try {
      const resp = await API.getSettings();
      const s = resp.settings || {};

      App.showModal({
        title: "Institute System Settings",
        content: `
          <form id="form-system-settings">
            <div class="form-group">
              <label class="form-label required">Institute Display Name</label>
              <input type="text" id="set-inst-name" class="form-control" value="${s.institute_name ? s.institute_name.value : ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label required">Institute Fee UPI ID (Appears on WhatsApp reminders & receipts)</label>
              <input type="text" id="set-inst-upi" class="form-control" value="${s.institute_upi_id ? s.institute_upi_id.value : ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Institute Phone Number</label>
              <input type="text" id="set-inst-phone" class="form-control" value="${s.institute_phone ? s.institute_phone.value : ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Institute Address</label>
              <input type="text" id="set-inst-addr" class="form-control" value="${s.institute_address ? s.institute_address.value : ''}">
            </div>
          </form>
        `,
        confirmText: "Save Settings",
        onConfirm: async () => {
          try {
            await API.updateSetting("institute_name", document.getElementById("set-inst-name").value);
            await API.updateSetting("institute_upi_id", document.getElementById("set-inst-upi").value);
            await API.updateSetting("institute_phone", document.getElementById("set-inst-phone").value);
            await API.updateSetting("institute_address", document.getElementById("set-inst-addr").value);
            App.showToast("Settings updated successfully.", "success");
            App.closeModal();
          } catch (err) {
            App.showToast(err.message, "error");
          }
        }
      });
    } catch (err) {
      App.showToast(err.message, "error");
    }
  },

  async openWhatsAppConfigModal() {
    App.showModal({
      title: "Configure WhatsApp Cloud API Scaffolding",
      content: `
        <form id="form-wa-api-config">
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem;">
            When official Meta WhatsApp Business Platform credentials are provided, credentials are encrypted and stored strictly server-side.
          </p>
          <div class="form-group">
            <label class="form-label">API Graph Endpoint</label>
            <input type="text" id="wa-endpoint" class="form-control" value="https://graph.facebook.com/v19.0">
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number ID</label>
            <input type="text" id="wa-phone-id" class="form-control" placeholder="e.g. 109876543210987">
          </div>
          <div class="form-group">
            <label class="form-label">Permanent System User Access Token</label>
            <input type="password" id="wa-access-token" class="form-control" placeholder="••••••••••••••••••••••••••••••••">
          </div>
          <div class="form-group">
            <label class="form-label">Webhook Verification Token</label>
            <input type="text" id="wa-webhook-token" class="form-control" value="tuitionapp_secure_webhook_token">
          </div>
        </form>
      `,
      confirmText: "Save Official Credentials",
      onConfirm: async () => {
        const payload = {
          api_endpoint: document.getElementById("wa-endpoint").value,
          phone_number_id: document.getElementById("wa-phone-id").value,
          access_token: document.getElementById("wa-access-token").value,
          webhook_verify_token: document.getElementById("wa-webhook-token").value
        };
        try {
          const res = await API.updateWhatsAppConfig(payload);
          App.showToast(res.message, "success");
          App.closeModal();
        } catch (err) {
          App.showToast(err.message, "error");
        }
      }
    });
  }
};
