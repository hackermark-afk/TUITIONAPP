/**
 * TUITIONAPP — Core Application Controller & Router
 * Manages view routing, navigation state, modal lifecycle, and toast alerts.
 */

const App = {
  currentView: "dashboard",
  currentUser: null,

  async init() {
    // Check if user is authenticated
    const token = API.getToken();
    if (!token) {
      this.showAuthView();
      return;
    }

    try {
      const resp = await API.getMe();
      this.currentUser = resp.user;
      API.setSession(token, this.currentUser);
      this.showAppView();
      this.navigate("dashboard");
    } catch {
      this.showAuthView();
    }

    // Global Event Listeners
    window.addEventListener("auth:required", () => this.showAuthView());
    window.addEventListener("auth:success", (e) => {
      this.currentUser = e.detail;
      this.showAppView();
      this.navigate("dashboard");
    });
  },

  showAuthView() {
    document.getElementById("app-view").style.display = "none";
    document.getElementById("auth-view").style.display = "block";
    AuthComponent.renderLogin();
  },

  showAppView() {
    document.getElementById("auth-view").style.display = "none";
    document.getElementById("app-view").style.display = "flex";
    this.renderLayout();
  },

  renderLayout() {
    const user = this.currentUser || {};
    const isAdmin = ["Super Admin", "Admin"].includes(user.role);

    // Update User Profile Widget
    document.getElementById("user-name-display").textContent = user.full_name || "Teacher";
    document.getElementById("user-role-display").textContent = user.role || "Faculty";
    document.getElementById("user-avatar-initials").textContent = (user.full_name || "T")[0].toUpperCase();

    // Show/Hide Admin Nav Items
    const adminNav = document.getElementById("nav-item-admin");
    if (adminNav) {
      adminNav.style.display = isAdmin ? "flex" : "none";
    }

    // Bind Desktop Nav clicks
    document.querySelectorAll(".nav-item[data-route]").forEach(item => {
      item.addEventListener("click", () => {
        const route = item.getAttribute("data-route");
        this.navigate(route);
        // On mobile, close sidebar after clicking
        document.getElementById("sidebar").classList.remove("open");
      });
    });

    // Bind Mobile Bottom Nav clicks
    document.querySelectorAll(".bottom-nav-item[data-route]").forEach(item => {
      item.addEventListener("click", () => {
        const route = item.getAttribute("data-route");
        this.navigate(route);
      });
    });

    // Bind Hamburger Toggle for mobile
    const menuToggle = document.getElementById("menu-toggle-btn");
    const sidebar = document.getElementById("sidebar");
    if (menuToggle && sidebar) {
      menuToggle.addEventListener("click", () => {
        sidebar.classList.toggle("open");
      });
    }

    // Bind Logout
    const logoutBtn = document.getElementById("btn-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => this.handleLogout());
    }
  },

  navigate(route, params = {}) {
    this.currentView = route;

    // Update active class in Desktop sidebar
    document.querySelectorAll(".nav-item[data-route]").forEach(item => {
      if (item.getAttribute("data-route") === route) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Update active class in Mobile bottom nav
    document.querySelectorAll(".bottom-nav-item[data-route]").forEach(item => {
      if (item.getAttribute("data-route") === route) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Update Topbar Title
    const titleMap = {
      dashboard: "Institute Dashboard",
      students: "Student Management",
      centres: "Centres & Batches",
      fees: "Fee Invoices & Payments",
      reminders: "WhatsApp Reminder Centre",
      attendance: "Daily Attendance",
      tests: "Assessments & Sunday Reports",
      admin: "Owner Administration"
    };
    const titleEl = document.getElementById("current-page-title");
    if (titleEl) {
      titleEl.textContent = titleMap[route] || "TUITIONAPP";
    }

    // Route Dispatcher
    switch (route) {
      case "dashboard":
        DashboardComponent.render();
        break;
      case "students":
        StudentsComponent.render();
        break;
      case "centres":
        CentresComponent.render();
        break;
      case "fees":
        FeesComponent.render();
        break;
      case "reminders":
        RemindersComponent.render(params);
        break;
      case "attendance":
        AttendanceComponent.render();
        break;
      case "tests":
        TestsComponent.render();
        break;
      case "admin":
        AdminComponent.render();
        break;
      default:
        DashboardComponent.render();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  async handleLogout() {
    try {
      await API.logout();
    } catch {
      // Proceed even if network fails
    }
    API.clearSession();
    this.currentUser = null;
    this.showToast("Logged out successfully.", "info");
    this.showAuthView();
  },

  showModal({ title, content, confirmText = "Confirm", confirmBtnClass = "btn-primary", onConfirm = null }) {
    const backdrop = document.getElementById("modal-backdrop");
    const titleEl = document.getElementById("modal-title");
    const bodyEl = document.getElementById("modal-body");
    const confirmBtn = document.getElementById("modal-confirm-btn");

    titleEl.textContent = title || "Dialog";
    bodyEl.innerHTML = content || "";

    if (onConfirm) {
      confirmBtn.style.display = "inline-flex";
      confirmBtn.textContent = confirmText;
      confirmBtn.className = `btn ${confirmBtnClass}`;
      confirmBtn.onclick = () => onConfirm();
    } else {
      confirmBtn.style.display = "none";
    }

    backdrop.classList.add("active");
  },

  closeModal() {
    const backdrop = document.getElementById("modal-backdrop");
    backdrop.classList.remove("active");
  },

  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icon = type === "success" ? "✓" : type === "error" ? "⚠️" : "ℹ️";
    toast.innerHTML = `<span style="font-size: 1.1rem;">${icon}</span> <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }
};

// Initialize Application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  App.init();

  // Modal Close bindings
  document.getElementById("modal-close-x").addEventListener("click", () => App.closeModal());
  document.getElementById("modal-cancel-btn").addEventListener("click", () => App.closeModal());
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") App.closeModal();
  });
});
