/**
 * TUITIONAPP — Dashboard Component
 * Displays real-time database numbers, fee categories, attendance rate,
 * recent payments, and quick navigation cards.
 */

const DashboardComponent = {
  async render() {
    const mainView = document.getElementById("main-view");
    if (!mainView) return;

    mainView.innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <div style="font-size: 1.5rem; color: var(--primary);">⏳ Loading Institute Dashboard...</div>
      </div>
    `;

    try {
      const resp = await API.getDashboardStats();
      const data = resp.data;
      const stats = data.stats;
      const cards = data.cards;

      mainView.innerHTML = `
        <div class="page-container">
          <!-- Top Row Metric Cards -->
          <div class="dashboard-grid">
            <div class="stat-card">
              <div class="stat-header">
                <span class="stat-title">Active Students</span>
                <div class="stat-icon primary">👥</div>
              </div>
              <div class="stat-value">${stats.active_students} <span style="font-size: 0.85rem; font-weight: normal; color: var(--text-muted);">/ ${stats.total_students}</span></div>
              <div class="stat-subtext">Total enrolled across centres</div>
            </div>

            <div class="stat-card">
              <div class="stat-header">
                <span class="stat-title">Monthly Revenue Potential</span>
                <div class="stat-icon info">📈</div>
              </div>
              <div class="stat-value">₹${stats.total_monthly_fees.toLocaleString('en-IN')}</div>
              <div class="stat-subtext">Cumulative monthly fee target</div>
            </div>

            <div class="stat-card">
              <div class="stat-header">
                <span class="stat-title">Fees Collected</span>
                <div class="stat-icon success">💳</div>
              </div>
              <div class="stat-value" style="color: var(--success);">₹${stats.fees_received.toLocaleString('en-IN')}</div>
              <div class="stat-subtext">Verified successful receipts</div>
            </div>

            <div class="stat-card">
              <div class="stat-header">
                <span class="stat-title">Total Overdue Fees</span>
                <div class="stat-icon danger">⚠️</div>
              </div>
              <div class="stat-value" style="color: var(--danger);">₹${stats.overdue_fees.toLocaleString('en-IN')}</div>
              <div class="stat-subtext">Requires immediate reminders</div>
            </div>

            <div class="stat-card">
              <div class="stat-header">
                <span class="stat-title">Today's Attendance</span>
                <div class="stat-icon info">📋</div>
              </div>
              <div class="stat-value">${stats.attendance.rate}%</div>
              <div class="stat-subtext">${stats.attendance.present_count} Present | ${stats.attendance.absent_count} Absent today</div>
            </div>
          </div>

          <!-- Pending Dues Breakdown Cards (Clickable) -->
          <div style="margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
            <h3 style="font-size: 1rem; font-weight: 700; color: var(--text-main);">⚡ Pending Fee Categories (Click to Send WhatsApp Reminders)</h3>
            <button class="btn btn-whatsapp btn-sm" id="btn-open-reminder-centre">
              💬 Open WhatsApp Centre
            </button>
          </div>

          <div class="category-pills-row">
            <div class="category-card" onclick="App.navigate('reminders', { category: 'All' })">
              <div class="category-name">All Pending</div>
              <div class="category-count">${cards.fees_pending.count} students</div>
              <div class="category-amount">₹${cards.fees_pending.amount.toLocaleString('en-IN')}</div>
            </div>

            <div class="category-card due-today" onclick="App.navigate('reminders', { category: 'Due Today' })">
              <div class="category-name">Due Today</div>
              <div class="category-count">${cards.due_today.count} students</div>
              <div class="category-amount">₹${cards.due_today.amount.toLocaleString('en-IN')}</div>
            </div>

            <div class="category-card" onclick="App.navigate('reminders', { category: 'Due Within 5 Days' })">
              <div class="category-name">Due Within 5 Days</div>
              <div class="category-count">${cards.due_within_5_days.count} students</div>
              <div class="category-amount">₹${cards.due_within_5_days.amount.toLocaleString('en-IN')}</div>
            </div>

            <div class="category-card warning-card" onclick="App.navigate('reminders', { category: 'Overdue 1–4 Days' })">
              <div class="category-name">Overdue 1–4 Days</div>
              <div class="category-count" style="color: var(--warning);">${cards.overdue_1_4_days.count} students</div>
              <div class="category-amount">₹${cards.overdue_1_4_days.amount.toLocaleString('en-IN')}</div>
            </div>

            <div class="category-card urgent" onclick="App.navigate('reminders', { category: 'Overdue 5+ Days' })">
              <div class="category-name">Overdue 5+ Days</div>
              <div class="category-count" style="color: var(--danger);">${cards.overdue_5_plus_days.count} students</div>
              <div class="category-amount">₹${cards.overdue_5_plus_days.amount.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <!-- Bottom Grid: Recent Payments & Upcoming Dues -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.5rem;">
            <!-- Recent Payments -->
            <div class="content-section">
              <div class="section-header">
                <div class="section-title">
                  <span>💳</span> Recent Fee Payments
                </div>
                <button class="btn btn-secondary btn-sm" onclick="App.navigate('fees')">View All</button>
              </div>
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Receipt</th>
                      <th>Student</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(data.recent_payments || []).length === 0 ? `
                      <tr><td colspan="5" style="text-align:center; color: var(--text-muted); padding: 1.5rem;">No payment recorded yet.</td></tr>
                    ` : data.recent_payments.map(p => `
                      <tr>
                        <td><strong>${p.receipt_number}</strong></td>
                        <td>${p.student_name}</td>
                        <td style="color: var(--success); font-weight: 700;">₹${p.amount_received}</td>
                        <td><span class="badge" style="background: #e2e8f0;">${p.payment_method}</span></td>
                        <td>${p.payment_date}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Upcoming Dues -->
            <div class="content-section">
              <div class="section-header">
                <div class="section-title">
                  <span>📅</span> Upcoming Due Dates
                </div>
                <button class="btn btn-secondary btn-sm" onclick="App.navigate('reminders')">Remind All</button>
              </div>
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Class & Centre</th>
                      <th>Due Date</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(data.upcoming_dues || []).length === 0 ? `
                      <tr><td colspan="4" style="text-align:center; color: var(--text-muted); padding: 1.5rem;">No upcoming dues within 7 days.</td></tr>
                    ` : data.upcoming_dues.map(u => `
                      <tr>
                        <td><strong>${u.student_name}</strong></td>
                        <td>${u.class_name} • ${u.centre_name}</td>
                        <td>${u.due_date}</td>
                        <td style="color: var(--danger); font-weight: 700;">₹${u.outstanding_amount}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Recently Added Students & Activity Stream -->
          <div style="margin-top: 1.5rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.5rem;">
            <!-- Recently Added Students -->
            <div class="content-section">
              <div class="section-header">
                <div class="section-title">
                  <span>🎓</span> Students Recently Enrolled
                </div>
                <button class="btn btn-primary btn-sm" onclick="StudentsComponent.openAddStudentModal()">+ Add Student</button>
              </div>
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Class</th>
                      <th>Centre</th>
                      <th>Monthly Fee</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(data.recent_students || []).length === 0 ? `
                      <tr><td colspan="5" style="text-align:center; color: var(--text-muted); padding: 1.5rem;">No students added yet.</td></tr>
                    ` : data.recent_students.map(s => `
                      <tr>
                        <td><strong>${s.student_name}</strong></td>
                        <td>${s.class_name}</td>
                        <td>${s.centre_name}</td>
                        <td style="font-weight: 600;">₹${s.monthly_fee}</td>
                        <td>
                          <button class="btn btn-secondary btn-sm" onclick="StudentsComponent.viewStudentProfile(${s.id})">Profile</button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Recent System Activities -->
            <div class="content-section">
              <div class="section-header">
                <div class="section-title">
                  <span>🔔</span> Recent Activity Log
                </div>
              </div>
              <div style="padding: 1rem 1.25rem;">
                ${(data.recent_activities || []).length === 0 ? `
                  <div style="color: var(--text-muted); font-size: 0.85rem;">No recent activities logged.</div>
                ` : data.recent_activities.map(a => `
                  <div style="display: flex; gap: 0.75rem; margin-bottom: 0.85rem; padding-bottom: 0.85rem; border-bottom: 1px dashed var(--border);">
                    <div style="font-size: 1.1rem;">📝</div>
                    <div style="flex: 1;">
                      <div style="font-size: 0.84rem; font-weight: 600; color: var(--text-main);">${a.details || a.action}</div>
                      <div style="font-size: 0.72rem; color: var(--text-muted);">By ${a.user_name || 'System'} • ${a.created_at ? a.created_at.split('T')[0] : ''}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

        </div>
      `;

      document.getElementById("btn-open-reminder-centre").addEventListener("click", () => {
        App.navigate("reminders");
      });

    } catch (err) {
      mainView.innerHTML = `
        <div class="page-container">
          <div style="background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 1.5rem; border-radius: var(--radius);">
            <h3>Failed to load dashboard</h3>
            <p>${err.message}</p>
            <button class="btn btn-secondary btn-sm" onclick="DashboardComponent.render()" style="margin-top: 1rem;">Retry</button>
          </div>
        </div>
      `;
    }
  }
};
