/**
 * TUITIONAPP — WhatsApp Reminder Centre Component
 * Implements:
 * - Real-time categorization (All, Due Within 5 Days, Due Today, Overdue 1-4 Days, Overdue 5+ Days)
 * - Hinglish message template preview & in-line editing
 * - Strict phone validation (+91 normalization)
 * - Click-to-chat URL dispatch
 * - Bulk reminder queue stepper with pre-flight checks
 * - Full reminder history audit view
 */

const RemindersComponent = {
  currentCategory: "All",
  bulkQueue: [],
  currentQueueIndex: 0,

  async render(params = {}) {
    const mainView = document.getElementById("main-view");
    if (!mainView) return;

    if (params.category) {
      RemindersComponent.currentCategory = params.category;
    }

    mainView.innerHTML = `
      <div class="page-container">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
              <span style="color: var(--whatsapp); font-size: 1.6rem;">💬</span> Pending Fees WhatsApp Reminder Centre
            </h2>
            <p style="font-size: 0.82rem; color: var(--text-muted);">
              Asia/Kolkata Calendar Due Dates • Verified Parent Contacts • Teacher Click-to-Chat Queue
            </p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-whatsapp" id="btn-bulk-remind-selected">
              <span>⚡</span> Prepare Bulk Reminders (<span id="selected-count-label">0</span>)
            </button>
            <button class="btn btn-secondary" id="btn-view-reminder-history">
              <span>📜</span> Reminder History
            </button>
          </div>
        </div>

        <!-- Category Filter Cards -->
        <div class="category-pills-row" id="reminder-category-cards">
          <div style="padding: 1rem; color: var(--text-muted);">Calculating pending buckets...</div>
        </div>

        <!-- Reminder Table Section -->
        <div class="content-section">
          <div class="section-header">
            <div class="section-title">
              <span>📋</span> Pending Students List (<span id="total-pending-label">0</span>)
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button class="btn btn-secondary btn-sm" id="btn-select-all-pending">Select All</button>
              <button class="btn btn-secondary btn-sm" id="btn-deselect-all-pending">Deselect All</button>
            </div>
          </div>

          <div id="reminder-table-container">
            <div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
              ⏳ Loading fee reminders...
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-select-all-pending").addEventListener("click", () => {
      document.querySelectorAll(".reminder-checkbox").forEach(cb => cb.checked = true);
      RemindersComponent.updateSelectedCount();
    });

    document.getElementById("btn-deselect-all-pending").addEventListener("click", () => {
      document.querySelectorAll(".reminder-checkbox").forEach(cb => cb.checked = false);
      RemindersComponent.updateSelectedCount();
    });

    document.getElementById("btn-bulk-remind-selected").addEventListener("click", () => {
      RemindersComponent.startBulkReminderWorkflow();
    });

    document.getElementById("btn-view-reminder-history").addEventListener("click", () => {
      RemindersComponent.openReminderHistoryModal();
    });

    await RemindersComponent.loadReminders();
  },

  updateSelectedCount() {
    const selected = document.querySelectorAll(".reminder-checkbox:checked");
    const countLabel = document.getElementById("selected-count-label");
    if (countLabel) {
      countLabel.textContent = selected.length;
    }
  },

  async loadReminders() {
    const tableContainer = document.getElementById("reminder-table-container");
    const categoryCardsContainer = document.getElementById("reminder-category-cards");
    if (!tableContainer) return;

    try {
      const resp = await API.getPendingReminders(RemindersComponent.currentCategory);
      const data = resp.data;
      const cats = data.categories;
      const reminders = data.reminders || [];

      // Update Category Cards
      categoryCardsContainer.innerHTML = `
        <div class="category-card ${RemindersComponent.currentCategory === 'All' ? 'active' : ''}" onclick="RemindersComponent.switchCategory('All')">
          <div class="category-name">All Pending</div>
          <div class="category-count">${cats.All.count}</div>
          <div class="category-amount">₹${cats.All.amount.toLocaleString('en-IN')}</div>
        </div>

        <div class="category-card due-today ${RemindersComponent.currentCategory === 'Due Today' ? 'active' : ''}" onclick="RemindersComponent.switchCategory('Due Today')">
          <div class="category-name">Due Today</div>
          <div class="category-count">${cats["Due Today"].count}</div>
          <div class="category-amount">₹${cats["Due Today"].amount.toLocaleString('en-IN')}</div>
        </div>

        <div class="category-card ${RemindersComponent.currentCategory === 'Due Within 5 Days' ? 'active' : ''}" onclick="RemindersComponent.switchCategory('Due Within 5 Days')">
          <div class="category-name">Due Within 5 Days</div>
          <div class="category-count">${cats["Due Within 5 Days"].count}</div>
          <div class="category-amount">₹${cats["Due Within 5 Days"].amount.toLocaleString('en-IN')}</div>
        </div>

        <div class="category-card warning-card ${RemindersComponent.currentCategory === 'Overdue 1–4 Days' ? 'active' : ''}" onclick="RemindersComponent.switchCategory('Overdue 1–4 Days')">
          <div class="category-name">Overdue 1–4 Days</div>
          <div class="category-count" style="color: var(--warning);">${cats["Overdue 1–4 Days"].count}</div>
          <div class="category-amount">₹${cats["Overdue 1–4 Days"].amount.toLocaleString('en-IN')}</div>
        </div>

        <div class="category-card urgent ${RemindersComponent.currentCategory === 'Overdue 5+ Days' ? 'active' : ''}" onclick="RemindersComponent.switchCategory('Overdue 5+ Days')">
          <div class="category-name">Overdue 5+ Days</div>
          <div class="category-count" style="color: var(--danger);">${cats["Overdue 5+ Days"].count}</div>
          <div class="category-amount">₹${cats["Overdue 5+ Days"].amount.toLocaleString('en-IN')}</div>
        </div>
      `;

      document.getElementById("total-pending-label").textContent = reminders.length;

      if (reminders.length === 0) {
        tableContainer.innerHTML = `
          <div style="text-align: center; padding: 3rem 1.5rem;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎉</div>
            <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main);">No pending dues in this category!</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">All student fees are fully settled or no records match.</p>
          </div>
        `;
        return;
      }

      tableContainer.innerHTML = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">Select</th>
                <th>Student</th>
                <th>Parent Name & Primary WhatsApp</th>
                <th>Class & Centre</th>
                <th>Month</th>
                <th>Total Fee</th>
                <th>Outstanding</th>
                <th>Due Date & Days</th>
                <th>Last Reminder</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${reminders.map(r => `
                <tr>
                  <td style="text-align: center;">
                    <input type="checkbox" class="reminder-checkbox" value="${r.invoice_id}" onchange="RemindersComponent.updateSelectedCount()">
                  </td>
                  <td>
                    <div style="font-weight: 700; color: var(--text-main);">${r.student_name}</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">${r.invoice_number}</div>
                  </td>
                  <td>
                    <div style="font-weight: 600;">${r.parent_name}</div>
                    ${r.phone_valid ? `
                      <div style="font-size: 0.8rem; color: var(--whatsapp); font-weight: 700;">
                        💬 ${r.normalized_phone}
                      </div>
                    ` : `
                      <div style="font-size: 0.75rem; color: var(--danger); font-weight: 600;">
                        ⚠️ Invalid Phone: ${r.parent_phone || 'Empty'}
                      </div>
                    `}
                  </td>
                  <td>${r.class_name} • ${r.centre_name}</td>
                  <td style="font-weight: 600;">${r.billing_month}</td>
                  <td>₹${r.fee_amount}</td>
                  <td>
                    <strong style="color: var(--danger); font-size: 1rem;">₹${r.outstanding_amount}</strong>
                  </td>
                  <td>
                    <div>${r.due_date}</div>
                    <span class="badge ${r.category.includes('Overdue') ? 'badge-overdue' : 'badge-pending'}">
                      ${r.category} (${r.days_diff}d)
                    </span>
                  </td>
                  <td style="font-size: 0.75rem; color: var(--text-muted);">
                    ${r.last_reminder_date ? r.last_reminder_date.split('T')[0] : 'Never sent'}
                  </td>
                  <td>
                    <button class="btn btn-whatsapp btn-sm" onclick="RemindersComponent.openSingleReminderPreview(${r.invoice_id})" ${!r.phone_valid ? 'disabled title="Invalid WhatsApp number"' : ''}>
                      <span>💬</span> Remind
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      RemindersComponent.updateSelectedCount();

    } catch (err) {
      tableContainer.innerHTML = `<div style="color: var(--danger); padding: 1.5rem;">Failed to load reminders: ${err.message}</div>`;
    }
  },

  switchCategory(cat) {
    RemindersComponent.currentCategory = cat;
    RemindersComponent.loadReminders();
  },

  async openSingleReminderPreview(invoiceId) {
    App.showModal({
      title: "Preparing WhatsApp Reminder...",
      content: `<div style="text-align: center; padding: 2rem;">⏳ Validating invoice, balance, and latest parent phone...</div>`
    });

    try {
      const resp = await API.prepareReminderPreview(invoiceId);
      const rem = resp.reminder;

      App.showModal({
        title: `Fee Reminder: ${rem.student_name}`,
        content: `
          <div>
            <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius); padding: 0.75rem 1rem; margin-bottom: 1rem; font-size: 0.85rem;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>Parent / Guardian: <strong>${rem.parent_name}</strong></span>
                <span>Verified WhatsApp: <strong style="color: var(--whatsapp); font-size: 0.95rem;">${rem.parent_phone}</strong></span>
              </div>
              <div>Pending Outstanding Amount: <strong style="color: var(--danger); font-size: 1.05rem;">₹${rem.outstanding_amount}</strong></div>
            </div>

            <label class="form-label" style="font-weight: 700;">Hinglish Message Preview (Editable before sending):</label>
            <div class="wa-preview-box">
              <textarea id="single-reminder-custom-text" class="form-control" style="font-family: inherit; font-size: 0.88rem; min-height: 180px; background: transparent; border: none; resize: vertical; padding: 0;">${rem.message}</textarea>
            </div>

            <div style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">
              ℹ️ Clicking "Open in WhatsApp" will open a direct WhatsApp Click-to-Chat window (<code>wa.me</code>) with this pre-filled message. It does not mark the message as delivered until confirmed.
            </div>
          </div>
        `,
        confirmText: "🟢 Open in WhatsApp Click-to-Chat",
        confirmBtnClass: "btn-whatsapp",
        onConfirm: async () => {
          const editedText = document.getElementById("single-reminder-custom-text").value;
          const encoded = encodeURIComponent(editedText);
          const customUrl = `https://wa.me/${rem.parent_phone}?text=${encoded}`;

          // Log status update
          await API.logReminderStatus(rem.log_id, "WhatsApp Opened");

          // Open WhatsApp in new tab
          window.open(customUrl, "_blank");

          App.showToast("WhatsApp Click-to-Chat opened.", "info");
          App.closeModal();
          RemindersComponent.loadReminders();
        }
      });
    } catch (err) {
      App.showToast(err.message, "error");
    }
  },

  async startBulkReminderWorkflow() {
    const checkboxes = document.querySelectorAll(".reminder-checkbox:checked");
    const invoiceIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

    if (invoiceIds.length === 0) {
      App.showToast("Please select at least one student from the table.", "error");
      return;
    }

    App.showModal({
      title: "Preparing Bulk Reminder Queue...",
      content: `<div style="text-align: center; padding: 2rem;">⏳ Verifying and preparing ${invoiceIds.length} messages...</div>`
    });

    try {
      const resp = await API.prepareBulkQueue(invoiceIds);
      const data = resp.data;

      RemindersComponent.bulkQueue = data.queue || [];
      RemindersComponent.currentQueueIndex = 0;

      if (RemindersComponent.bulkQueue.length === 0) {
        App.showModal({
          title: "Bulk Preparation Summary",
          content: `
            <div style="padding: 1rem;">
              <p style="color: var(--danger); font-weight: 600;">No valid reminders could be prepared.</p>
              <div style="margin-top: 1rem; font-size: 0.85rem;">
                <strong>Skipped Records (${data.skipped_count}):</strong>
                <ul style="margin-top: 0.5rem; padding-left: 1.25rem;">
                  ${data.skipped.map(s => `<li>Invoice #${s.invoice_id}: ${s.reason}</li>`).join('')}
                </ul>
              </div>
            </div>
          `,
          confirmText: "Close",
          onConfirm: () => App.closeModal()
        });
        return;
      }

      // Start stepping through the queue
      RemindersComponent.renderBulkQueueStep(data.skipped);

    } catch (err) {
      App.showToast("Bulk queue error: " + err.message, "error");
    }
  },

  renderBulkQueueStep(skippedSummary = []) {
    const queue = RemindersComponent.bulkQueue;
    const index = RemindersComponent.currentQueueIndex;

    if (index >= queue.length) {
      App.showModal({
        title: "🎉 Bulk Reminders Complete!",
        content: `
          <div style="text-align: center; padding: 1.5rem;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">✅</div>
            <h3>All ${queue.length} reminders reviewed and processed!</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">
              Audit history has been recorded.
            </p>
          </div>
        `,
        confirmText: "Done",
        onConfirm: () => {
          App.closeModal();
          RemindersComponent.loadReminders();
        }
      });
      return;
    }

    const current = queue[index];

    App.showModal({
      title: `Bulk Queue: Step ${index + 1} of ${queue.length}`,
      content: `
        <div>
          <!-- Stepper Progress Bar -->
          <div style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">
              <span>PROGRESS</span>
              <span>${index + 1} / ${queue.length} (${Math.round(((index + 1) / queue.length) * 100)}%)</span>
            </div>
            <div style="height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
              <div style="height: 100%; width: ${((index + 1) / queue.length) * 100}%; background: var(--whatsapp); transition: width 0.3s ease;"></div>
            </div>
          </div>

          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius); padding: 0.75rem 1rem; margin-bottom: 1rem; font-size: 0.85rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Student: <strong>${current.student_name}</strong></span>
              <span>Parent: <strong>${current.parent_name}</strong></span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>WhatsApp: <strong style="color: var(--whatsapp);">${current.parent_phone}</strong></span>
              <span>Pending Fee: <strong style="color: var(--danger);">₹${current.outstanding_amount}</strong></span>
            </div>
          </div>

          <label class="form-label" style="font-weight: 700;">Hinglish Message Preview:</label>
          <div class="wa-preview-box">
            <textarea id="bulk-step-msg" class="form-control" style="font-family: inherit; font-size: 0.88rem; min-height: 140px; background: transparent; border: none; resize: vertical; padding: 0;">${current.message}</textarea>
          </div>

          <div style="display: flex; gap: 8px; margin-top: 1rem;">
            <button class="btn btn-whatsapp" id="btn-bulk-open-wa" style="flex: 2;">
              🟢 1. Open WhatsApp Chat
            </button>
            <button class="btn btn-success" id="btn-bulk-confirm-sent" style="flex: 1;">
              ✓ 2. Mark Sent
            </button>
            <button class="btn btn-secondary" id="btn-bulk-skip" style="flex: 1;">
              ⏭️ Skip
            </button>
          </div>
        </div>
      `,
      confirmText: "Cancel Queue",
      confirmBtnClass: "btn-secondary",
      onConfirm: () => App.closeModal()
    });

    document.getElementById("btn-bulk-open-wa").addEventListener("click", async () => {
      const msg = document.getElementById("bulk-step-msg").value;
      const url = `https://wa.me/${current.parent_phone}?text=${encodeURIComponent(msg)}`;
      await API.logReminderStatus(current.log_id, "WhatsApp Opened");
      window.open(url, "_blank");
      App.showToast("WhatsApp opened for " + current.student_name, "info");
    });

    document.getElementById("btn-bulk-confirm-sent").addEventListener("click", async () => {
      await API.logReminderStatus(current.log_id, "Confirmed Sent");
      App.showToast(`Marked #${index + 1} as sent!`, "success");
      RemindersComponent.currentQueueIndex++;
      RemindersComponent.renderBulkQueueStep();
    });

    document.getElementById("btn-bulk-skip").addEventListener("click", () => {
      RemindersComponent.currentQueueIndex++;
      RemindersComponent.renderBulkQueueStep();
    });
  },

  async openReminderHistoryModal() {
    App.showModal({
      title: "Loading WhatsApp Audit Log...",
      content: `<div style="text-align: center; padding: 2rem;">⏳ Fetching reminder history...</div>`
    });

    try {
      const resp = await API.getReminderHistory();
      const history = resp.history || [];

      App.showModal({
        title: "WhatsApp Reminder Audit History",
        content: `
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Student</th>
                  <th>Parent</th>
                  <th>Contact Used</th>
                  <th>Type</th>
                  <th>Teacher</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${history.length === 0 ? `
                  <tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--text-muted);">No reminders sent yet.</td></tr>
                ` : history.map(h => `
                  <tr>
                    <td>${h.created_at ? h.created_at.replace('T', ' ').slice(0, 19) : ''}</td>
                    <td><strong>${h.student_name}</strong></td>
                    <td>${h.parent_name}</td>
                    <td style="font-weight: 600;">${h.phone_used}</td>
                    <td><span class="badge badge-active">${h.reminder_type}</span></td>
                    <td>${h.teacher_name || 'System'}</td>
                    <td>
                      <span class="badge" style="background: ${h.status === 'Confirmed Sent' ? 'var(--success-light)' : h.status === 'WhatsApp Opened' ? '#e0f2fe' : '#f1f5f9'}; color: ${h.status === 'Confirmed Sent' ? 'var(--success)' : '#0369a1'};">
                        ${h.status}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `,
        confirmText: "Close Audit Log",
        onConfirm: () => App.closeModal()
      });
    } catch (err) {
      App.showToast(err.message, "error");
    }
  }
};
