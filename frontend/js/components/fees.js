/**
 * TUITIONAPP — Fee & Payment Management Component
 * Invoices, transactional payment recording, receipt generation, and print view.
 */

const FeesComponent = {
  async render() {
    const mainView = document.getElementById("main-view");
    if (!mainView) return;

    mainView.innerHTML = `
      <div class="page-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-main);">Fee Management & Invoices</h2>
            <p style="font-size: 0.82rem; color: var(--text-muted);">Track invoices, record partial or full fee collections, and issue official receipts</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary" id="btn-generate-invoices-modal">
              <span>🧾</span> Generate Monthly Invoices
            </button>
            <button class="btn btn-whatsapp" onclick="App.navigate('reminders')">
              <span>💬</span> WhatsApp Reminders
            </button>
          </div>
        </div>

        <!-- Filter bar -->
        <div class="content-section" style="margin-bottom: 1rem;">
          <div class="filter-bar">
            <select id="fee-status-filter" class="filter-select">
              <option value="">All Invoices</option>
              <option value="Pending">Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Paid">Fully Paid</option>
            </select>

            <input type="text" id="fee-month-filter" class="form-control" style="max-width: 180px; padding: 0.45rem 0.75rem;" placeholder="Month (e.g. October 2026)">

            <button class="btn btn-primary btn-sm" id="btn-filter-invoices">Apply Filter</button>
          </div>

          <!-- Invoices Table Container -->
          <div id="invoices-table-container">
            <div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
              ⏳ Loading invoices...
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-generate-invoices-modal").addEventListener("click", () => {
      FeesComponent.openGenerateInvoicesModal();
    });

    document.getElementById("btn-filter-invoices").addEventListener("click", () => {
      FeesComponent.loadInvoices();
    });

    document.getElementById("fee-status-filter").addEventListener("change", () => {
      FeesComponent.loadInvoices();
    });

    await FeesComponent.loadInvoices();
  },

  async loadInvoices() {
    const container = document.getElementById("invoices-table-container");
    if (!container) return;

    const status = document.getElementById("fee-status-filter").value;
    const month = document.getElementById("fee-month-filter").value.trim();

    try {
      const resp = await API.getInvoices({ status, billing_month: month });
      const invoices = resp.invoices || [];

      if (invoices.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
            No fee invoices match the filter criteria.
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Student</th>
                <th>Class & Centre</th>
                <th>Month</th>
                <th>Total Fee</th>
                <th>Paid</th>
                <th>Outstanding</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${invoices.map(inv => `
                <tr>
                  <td><strong>${inv.invoice_number}</strong></td>
                  <td>
                    <div style="font-weight: 700; color: var(--text-main);">${inv.student_name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${inv.parent_name || 'Parent'}: ${inv.parent_phone || 'No phone'}</div>
                  </td>
                  <td>${inv.class_name || '—'} • ${inv.centre_name || '—'}</td>
                  <td style="font-weight: 600;">${inv.billing_month}</td>
                  <td>₹${inv.fee_amount}</td>
                  <td style="color: var(--success); font-weight: 600;">₹${inv.paid_amount}</td>
                  <td>
                    <strong style="color: ${inv.outstanding_amount > 0 ? 'var(--danger)' : 'var(--success)'}; font-size: 0.95rem;">
                      ₹${inv.outstanding_amount}
                    </strong>
                  </td>
                  <td>
                    <div>${inv.due_date}</div>
                    <small style="font-size: 0.7rem; color: ${inv.category.includes('Overdue') ? 'var(--danger)' : 'var(--text-muted)'}; font-weight: 600;">
                      ${inv.category}
                    </small>
                  </td>
                  <td>
                    <span class="badge ${inv.status === 'Paid' ? 'badge-paid' : inv.status === 'Partially Paid' ? 'badge-partially-paid' : 'badge-overdue'}">
                      ${inv.status}
                    </span>
                  </td>
                  <td>
                    ${inv.outstanding_amount > 0 ? `
                      <button class="btn btn-success btn-sm" onclick="FeesComponent.openRecordPaymentModal(${inv.id}, ${inv.student_id}, '${inv.invoice_number}', '${inv.student_name.replace(/'/g, "\\'")}', '${inv.billing_month}', ${inv.fee_amount}, ${inv.paid_amount}, ${inv.outstanding_amount})">
                        💵 Collect Fee
                      </button>
                    ` : `
                      <span style="color: var(--success); font-weight: 600; font-size: 0.8rem;">✓ Settled</span>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color: var(--danger); padding: 1.5rem;">Failed to load invoices: ${err.message}</div>`;
    }
  },

  openRecordPaymentModal(invoiceId, studentId, invNo, studentName, month, totalFee, paidSoFar = 0, outstanding = totalFee) {
    App.showModal({
      title: `Record Fee Payment: ${studentName}`,
      content: `
        <form id="form-record-payment">
          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem; margin-bottom: 1.25rem;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.85rem;">
              <div><span style="color: var(--text-muted);">Invoice:</span> <strong>${invNo}</strong></div>
              <div><span style="color: var(--text-muted);">Billing Month:</span> <strong>${month}</strong></div>
              <div><span style="color: var(--text-muted);">Total Fee:</span> <strong>₹${totalFee}</strong></div>
              <div><span style="color: var(--text-muted);">Previously Paid:</span> <strong style="color: var(--success);">₹${paidSoFar}</strong></div>
              <div style="grid-column: 1/-1; padding-top: 6px; border-top: 1px dashed var(--border);">
                <span style="color: var(--text-muted);">Current Outstanding Balance:</span> 
                <strong style="color: var(--danger); font-size: 1.1rem; margin-left: 4px;">₹${outstanding}</strong>
              </div>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label required">Amount Received (₹)</label>
              <input type="number" id="pay-amount" class="form-control" value="${outstanding}" max="${outstanding}" min="1" step="50" required>
              <small style="color: var(--text-muted); font-size: 0.72rem;">Supports full or partial payment</small>
            </div>
            <div class="form-group">
              <label class="form-label required">Payment Date</label>
              <input type="date" id="pay-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label required">Payment Method</label>
              <select id="pay-method" class="form-control" required>
                <option value="Cash">Cash</option>
                <option value="UPI" selected>UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Transaction Reference #</label>
              <input type="text" id="pay-ref" class="form-control" placeholder="UPI Ref / UTR / Cheque #">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Payment Remarks / Notes</label>
            <input type="text" id="pay-notes" class="form-control" placeholder="e.g. Paid by father via GPay">
          </div>
        </form>
      `,
      confirmText: "Record Payment & Generate Receipt",
      confirmBtnClass: "btn-success",
      onConfirm: async () => {
        const payload = {
          invoice_id: invoiceId,
          student_id: studentId,
          amount_received: document.getElementById("pay-amount").value,
          payment_date: document.getElementById("pay-date").value,
          payment_method: document.getElementById("pay-method").value,
          transaction_reference: document.getElementById("pay-ref").value,
          notes: document.getElementById("pay-notes").value
        };

        try {
          const res = await API.recordPayment(payload);
          App.showToast(res.message, "success");
          App.closeModal();
          FeesComponent.loadInvoices();

          // Offer instant receipt preview
          if (res.payment_id) {
            FeesComponent.printReceipt(res.payment_id);
          }
        } catch (err) {
          App.showToast(err.message, "error");
        }
      }
    });
  },

  async printReceipt(paymentId) {
    App.showModal({
      title: "Loading Official Receipt...",
      content: `<div style="text-align: center; padding: 2rem;">⏳ Preparing receipt print layout...</div>`
    });

    try {
      const resp = await API.getReceipt(paymentId);
      const r = resp.receipt;
      const inst = r.institute || {};

      App.showModal({
        title: `Receipt: ${r.receipt_number}`,
        content: `
          <div id="printable-receipt" style="background: #ffffff; padding: 1.5rem; border: 1px solid var(--border); border-radius: var(--radius); font-family: sans-serif;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1rem; border-bottom: 2px solid var(--primary); margin-bottom: 1rem;">
              <div>
                <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--primary);">${inst.institute_name || 'Apex Coaching Institute'}</h2>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">${r.centre_address || inst.institute_address || ''}</p>
                <p style="font-size: 0.8rem; color: var(--text-muted);">Phone: ${r.centre_phone || inst.institute_phone || ''} • UPI: ${inst.institute_upi_id || ''}</p>
              </div>
              <div style="text-align: right;">
                <div style="display: inline-block; background: var(--success-light); color: var(--success); font-weight: 700; font-size: 0.78rem; padding: 3px 8px; border-radius: 4px; margin-bottom: 4px;">
                  FEES RECEIPT
                </div>
                <div style="font-size: 0.85rem; font-weight: 700;">${r.receipt_number}</div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">Date: ${r.payment_date}</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; font-size: 0.85rem;">
              <div>
                <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">Student Details</div>
                <div style="font-weight: 700; font-size: 1rem; color: var(--text-main);">${r.student_name}</div>
                <div>Class: <strong>${r.class_name}</strong> • Batch: <strong>${r.batch_name}</strong></div>
                <div>Centre: <strong>${r.centre_name}</strong></div>
              </div>
              <div>
                <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">Parent / Contact</div>
                <div style="font-weight: 700;">${r.parent_name || 'Parent / Guardian'}</div>
                <div>WhatsApp: ${r.parent_phone || 'N/A'}</div>
              </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.25rem; font-size: 0.88rem;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 1px solid var(--border);">
                  <th style="padding: 8px; text-align: left;">Particulars</th>
                  <th style="padding: 8px; text-align: left;">Billing Month</th>
                  <th style="padding: 8px; text-align: left;">Payment Mode</th>
                  <th style="padding: 8px; text-align: right;">Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid var(--border);">
                  <td style="padding: 10px 8px;">Monthly Coaching Tuition Fee</td>
                  <td style="padding: 10px 8px;">${r.billing_month}</td>
                  <td style="padding: 10px 8px;">${r.payment_method} ${r.transaction_reference ? `(${r.transaction_reference})` : ''}</td>
                  <td style="padding: 10px 8px; text-align: right; font-weight: 700; font-size: 1.05rem; color: var(--success);">₹${r.amount_received}</td>
                </tr>
              </tbody>
            </table>

            <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 1rem; border-top: 1px dashed var(--border); font-size: 0.8rem; color: var(--text-muted);">
              <div>
                <div>Recorded by: <strong>${r.recorded_by_name || 'Administrator'}</strong></div>
                <div>Status: <strong style="color: var(--success);">${r.status}</strong></div>
              </div>
              <div style="text-align: right;">
                <div style="border-top: 1px solid #000; width: 140px; margin-bottom: 4px;"></div>
                <div>Authorized Signatory</div>
              </div>
            </div>
          </div>
        `,
        confirmText: "🖨️ Print Receipt",
        confirmBtnClass: "btn-primary",
        onConfirm: () => {
          window.print();
        }
      });
    } catch (err) {
      App.showToast(err.message, "error");
    }
  },

  openGenerateInvoicesModal() {
    const currentYear = new Date().getFullYear();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthIndex = new Date().getMonth();

    App.showModal({
      title: "Generate Monthly Fee Invoices",
      content: `
        <form id="form-gen-invoices">
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
            This will create standard monthly fee invoices for all active students based on their individual assigned fee plans. Duplicate invoices for the same student & month are automatically prevented.
          </p>
          <div class="form-group">
            <label class="form-label required">Select Billing Month</label>
            <select id="gen-billing-month" class="form-control" required>
              ${months.map((m, idx) => `
                <option value="${m} ${currentYear}" ${idx === currentMonthIndex ? 'selected' : ''}>${m} ${currentYear}</option>
              `).join('')}
              ${months.map((m) => `
                <option value="${m} ${currentYear + 1}">${m} ${currentYear + 1}</option>
              `).join('')}
            </select>
          </div>
        </form>
      `,
      confirmText: "Generate Invoices Now",
      onConfirm: async () => {
        const monthVal = document.getElementById("gen-billing-month").value;
        try {
          const res = await API.generateInvoices(monthVal);
          App.showToast(res.message, "success");
          App.closeModal();
          FeesComponent.loadInvoices();
        } catch (err) {
          App.showToast(err.message, "error");
        }
      }
    });
  }
};
