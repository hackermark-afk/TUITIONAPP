/**
 * TUITIONAPP — REST Client & Session Manager
 * Encapsulates token management, request dispatch, and error handling.
 */

const API = {
  TOKEN_KEY: "tuitionapp_auth_token",
  USER_KEY: "tuitionapp_user_data",

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  setSession(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(this.USER_KEY));
    } catch {
      return null;
    }
  },

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith("http") ? endpoint : `/api${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const resp = await fetch(url, {
        ...options,
        headers
      });

      if (resp.status === 401) {
        this.clearSession();
        window.dispatchEvent(new CustomEvent("auth:required"));
        throw new Error("Session expired. Please log in again.");
      }

      const json = await resp.json();
      if (!resp.ok) {
        throw new Error(json.message || `Request failed with status ${resp.status}`);
      }
      return json;
    } catch (err) {
      console.error(`API Error on [${options.method || "GET"} ${endpoint}]:`, err);
      throw err;
    }
  },

  // Auth Endpoints
  login(mobile_number, password) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ mobile_number, password })
    });
  },

  register(data) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  logout() {
    return this.request("/auth/logout", { method: "POST" });
  },

  resetPassword(mobile_number, new_password) {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ mobile_number, new_password })
    });
  },

  changePassword(old_password, new_password) {
    return this.request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ old_password, new_password })
    });
  },

  getMe() {
    return this.request("/auth/me");
  },

  // Dashboard
  getDashboardStats() {
    return this.request("/dashboard/stats");
  },

  // Students & Parents
  getStudents(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/students?${query}`);
  },

  getStudentProfile(id) {
    return this.request(`/students/${id}`);
  },

  addStudent(data) {
    return this.request("/students", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  updateStudentInfo(id, data) {
    return this.request(`/students/${id}/info`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },

  updateParentInfo(id, data) {
    return this.request(`/students/${id}/parent`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },

  updateFeeInfo(id, data) {
    return this.request(`/students/${id}/fee`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },

  archiveStudent(id) {
    return this.request(`/students/${id}/archive`, { method: "POST" });
  },

  restoreStudent(id) {
    return this.request(`/students/${id}/restore`, { method: "POST" });
  },

  // Centres & Batches
  getCentres() {
    return this.request("/centres");
  },

  getCentreDashboard(id) {
    return this.request(`/centres/${id}`);
  },

  addCentre(data) {
    return this.request("/centres", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  updateCentre(id, data) {
    return this.request(`/centres/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },

  archiveCentre(id) {
    return this.request(`/centres/${id}/archive`, { method: "POST" });
  },

  restoreCentre(id) {
    return this.request(`/centres/${id}/restore`, { method: "POST" });
  },

  getClasses() {
    return this.request("/classes");
  },

  addClass(data) {
    return this.request("/classes", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  getBatches(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/batches?${query}`);
  },

  addBatch(data) {
    return this.request("/batches", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  transferStudent(data) {
    return this.request("/students/transfer", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  // Fees & Payments
  getInvoices(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/invoices?${query}`);
  },

  generateInvoices(billing_month, centre_id = null) {
    return this.request("/invoices/generate", {
      method: "POST",
      body: JSON.stringify({ billing_month, centre_id })
    });
  },

  recordPayment(data) {
    return this.request("/payments", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  getReceipt(paymentId) {
    return this.request(`/payments/${paymentId}/receipt`);
  },

  // WhatsApp Reminder Centre
  getPendingReminders(category = "All") {
    return this.request(`/reminders/pending?category=${encodeURIComponent(category)}`);
  },

  prepareReminderPreview(invoice_id, custom_template = null) {
    return this.request("/reminders/preview", {
      method: "POST",
      body: JSON.stringify({ invoice_id, custom_template })
    });
  },

  prepareBulkQueue(invoice_ids) {
    return this.request("/reminders/bulk-prepare", {
      method: "POST",
      body: JSON.stringify({ invoice_ids })
    });
  },

  logReminderStatus(log_id, status) {
    return this.request("/reminders/log-status", {
      method: "POST",
      body: JSON.stringify({ log_id, status })
    });
  },

  getReminderHistory() {
    return this.request("/reminders/history");
  },

  // Attendance
  getAttendance(centre_id, class_id, batch_id, date) {
    return this.request(`/attendance?centre_id=${centre_id}&class_id=${class_id}&batch_id=${batch_id}&date=${date}`);
  },

  markAttendance(data) {
    return this.request("/attendance/mark", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  prepareAbsenceAlert(student_id, date) {
    return this.request("/attendance/absence-preview", {
      method: "POST",
      body: JSON.stringify({ student_id, date })
    });
  },

  // Tests
  getTests(batch_id = null) {
    const q = batch_id ? `?batch_id=${batch_id}` : "";
    return this.request(`/tests${q}`);
  },

  addTest(data) {
    return this.request("/tests", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  getTestDetails(id) {
    return this.request(`/tests/${id}`);
  },

  saveTestMarks(testId, records) {
    return this.request(`/tests/${testId}/marks`, {
      method: "POST",
      body: JSON.stringify({ records })
    });
  },

  prepareTestReport(testId, studentId) {
    return this.request(`/tests/${testId}/parent-report`, {
      method: "POST",
      body: JSON.stringify({ student_id: studentId })
    });
  },

  // Admin
  getAdminOverview() {
    return this.request("/admin/overview");
  },

  getTeachers() {
    return this.request("/admin/teachers");
  },

  updateTeacherRole(id, role, status) {
    return this.request(`/admin/teachers/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role, status })
    });
  },

  assignTeacherCentres(id, centre_ids) {
    return this.request(`/admin/teachers/${id}/assign-centres`, {
      method: "POST",
      body: JSON.stringify({ centre_ids })
    });
  },

  getEnquiries() {
    return this.request("/admin/enquiries");
  },

  addEnquiry(data) {
    return this.request("/admin/enquiries", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  getSettings() {
    return this.request("/admin/settings");
  },

  updateSetting(key, value) {
    return this.request("/admin/settings", {
      method: "PUT",
      body: JSON.stringify({ key, value })
    });
  },

  getWhatsAppConfig() {
    return this.request("/whatsapp/config");
  },

  updateWhatsAppConfig(data) {
    return this.request("/whatsapp/config", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
};
