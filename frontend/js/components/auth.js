/**
 * TUITIONAPP — Auth Component
 * Teacher Login, Registration, and Password Recovery.
 */

const AuthComponent = {
  renderLogin() {
    const container = document.getElementById("auth-view");
    if (!container) return;

    container.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 1.5rem;">
        <div style="background: #ffffff; border-radius: var(--radius-lg); width: 100%; max-width: 440px; box-shadow: var(--shadow-lg); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 2.25rem 2rem; text-align: center; color: #ffffff;">
            <div style="width: 52px; height: 52px; background: rgba(255,255,255,0.2); border-radius: 14px; margin: 0 auto 0.75rem auto; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; font-weight: 800;">
              🎓
            </div>
            <h2 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px;">TUITIONAPP</h2>
            <p style="font-size: 0.85rem; opacity: 0.9; margin-top: 4px;">Coaching Institute Management System</p>
          </div>

          <div style="padding: 2rem;">
            <div id="auth-error-alert" style="display: none; background: #fef2f2; border-left: 4px solid #ef4444; color: #b91c1c; padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.82rem; margin-bottom: 1.25rem;"></div>

            <form id="login-form">
              <div class="form-group">
                <label class="form-label required">Registered Mobile Number</label>
                <div style="position: relative;">
                  <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-weight: 600; color: #64748b; font-size: 0.9rem;">+91</span>
                  <input type="tel" id="login-mobile" class="form-control" style="padding-left: 46px;" placeholder="9876543210" maxlength="10" required>
                </div>
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                  <label class="form-label required" style="margin-bottom: 0;">Password</label>
                  <a href="javascript:void(0)" id="link-forgot-password" style="font-size: 0.78rem; color: var(--primary); text-decoration: none; font-weight: 600;">Forgot Password?</a>
                </div>
                <div style="position: relative;">
                  <input type="password" id="login-password" class="form-control" style="padding-right: 42px;" placeholder="••••••••" required>
                  <button type="button" id="toggle-password-btn" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #64748b; font-size: 0.9rem; padding: 4px;">
                    👁️
                  </button>
                </div>
              </div>

              <button type="submit" id="btn-login-submit" class="btn btn-primary" style="width: 100%; padding: 0.75rem; font-size: 0.95rem; margin-top: 0.5rem;">
                Secure Teacher Login
              </button>
            </form>

            <div style="margin-top: 1.5rem; text-align: center; border-top: 1px solid var(--border); padding-top: 1.25rem;">
              <p style="font-size: 0.85rem; color: var(--text-muted);">
                Don't have an account? 
                <a href="javascript:void(0)" id="link-show-register" style="color: var(--primary); font-weight: 600; text-decoration: none;">Register as Teacher</a>
              </p>
            </div>

            <!-- Demo Quick-Login Shortcut Bar -->
            <div style="margin-top: 1.25rem; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: var(--radius-sm); padding: 0.75rem;">
              <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Demo Test Credentials:</div>
              <div style="display: flex; gap: 6px;">
                <button type="button" class="btn btn-secondary btn-sm" id="btn-fill-admin" style="flex: 1; font-size: 0.75rem;">
                  🔑 Admin (Rajesh)
                </button>
                <button type="button" class="btn btn-secondary btn-sm" id="btn-fill-teacher" style="flex: 1; font-size: 0.75rem;">
                  👩‍🏫 Teacher (Pooja)
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;

    // Event Bindings
    const form = document.getElementById("login-form");
    const mobileInput = document.getElementById("login-mobile");
    const passwordInput = document.getElementById("login-password");
    const toggleBtn = document.getElementById("toggle-password-btn");
    const errorBox = document.getElementById("auth-error-alert");

    toggleBtn.addEventListener("click", () => {
      const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      toggleBtn.textContent = type === "password" ? "👁️" : "🙈";
    });

    document.getElementById("btn-fill-admin").addEventListener("click", () => {
      mobileInput.value = "9876543210";
      passwordInput.value = "Admin@1234";
    });

    document.getElementById("btn-fill-teacher").addEventListener("click", () => {
      mobileInput.value = "9811122233";
      passwordInput.value = "Teacher@1234";
    });

    document.getElementById("link-show-register").addEventListener("click", () => {
      AuthComponent.renderRegister();
    });

    document.getElementById("link-forgot-password").addEventListener("click", () => {
      AuthComponent.renderForgotPasswordModal();
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBox.style.display = "none";
      const submitBtn = document.getElementById("btn-login-submit");
      submitBtn.disabled = true;
      submitBtn.textContent = "Verifying...";

      try {
        const res = await API.login(mobileInput.value, passwordInput.value);
        if (res.success && res.data) {
          API.setSession(res.data.token, res.data);
          App.showToast("Welcome back! Login successful.", "success");
          window.dispatchEvent(new CustomEvent("auth:success", { detail: res.data }));
        }
      } catch (err) {
        errorBox.textContent = err.message || "Failed to log in.";
        errorBox.style.display = "block";
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Secure Teacher Login";
      }
    });
  },

  renderRegister() {
    const container = document.getElementById("auth-view");
    if (!container) return;

    container.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 1.5rem;">
        <div style="background: #ffffff; border-radius: var(--radius-lg); width: 100%; max-width: 460px; box-shadow: var(--shadow-lg); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 1.75rem 2rem; color: #ffffff;">
            <h2 style="font-size: 1.35rem; font-weight: 800;">Teacher Registration</h2>
            <p style="font-size: 0.82rem; opacity: 0.9; margin-top: 2px;">Create your authorized coaching management account</p>
          </div>

          <div style="padding: 1.75rem 2rem;">
            <div id="reg-error-alert" style="display: none; background: #fef2f2; border-left: 4px solid #ef4444; color: #b91c1c; padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.82rem; margin-bottom: 1.25rem;"></div>

            <form id="register-form">
              <div class="form-group">
                <label class="form-label required">Full Name</label>
                <input type="text" id="reg-name" class="form-control" placeholder="e.g. Vikram Malhotra" required>
              </div>

              <div class="form-group">
                <label class="form-label required">Mobile Number (10 Digits)</label>
                <div style="position: relative;">
                  <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-weight: 600; color: #64748b; font-size: 0.9rem;">+91</span>
                  <input type="tel" id="reg-mobile" class="form-control" style="padding-left: 46px;" placeholder="9876543210" maxlength="10" required>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Email Address (Optional)</label>
                <input type="email" id="reg-email" class="form-control" placeholder="teacher@coaching.com">
              </div>

              <div class="form-group">
                <label class="form-label required">Create Password (Min 6 Characters)</label>
                <input type="password" id="reg-password" class="form-control" placeholder="••••••••" minlength="6" required>
              </div>

              <button type="submit" id="btn-reg-submit" class="btn btn-primary" style="width: 100%; padding: 0.75rem; font-size: 0.95rem; margin-top: 0.5rem;">
                Create Teacher Account
              </button>
            </form>

            <div style="margin-top: 1.5rem; text-align: center; border-top: 1px solid var(--border); padding-top: 1.25rem;">
              <p style="font-size: 0.85rem; color: var(--text-muted);">
                Already have an account? 
                <a href="javascript:void(0)" id="link-show-login" style="color: var(--primary); font-weight: 600; text-decoration: none;">Back to Login</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("link-show-login").addEventListener("click", () => {
      AuthComponent.renderLogin();
    });

    const regForm = document.getElementById("register-form");
    const errorBox = document.getElementById("reg-error-alert");

    regForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBox.style.display = "none";
      const submitBtn = document.getElementById("btn-reg-submit");
      submitBtn.disabled = true;
      submitBtn.textContent = "Creating Account...";

      try {
        const payload = {
          full_name: document.getElementById("reg-name").value,
          mobile_number: document.getElementById("reg-mobile").value,
          email: document.getElementById("reg-email").value,
          password: document.getElementById("reg-password").value
        };
        const res = await API.register(payload);
        if (res.success && res.data) {
          API.setSession(res.data.token, res.data);
          App.showToast("Account created successfully!", "success");
          window.dispatchEvent(new CustomEvent("auth:success", { detail: res.data }));
        }
      } catch (err) {
        errorBox.textContent = err.message || "Registration failed.";
        errorBox.style.display = "block";
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Teacher Account";
      }
    });
  },

  renderForgotPasswordModal() {
    App.showModal({
      title: "Password Recovery",
      content: `
        <div style="padding: 0.5rem 0;">
          <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1.25rem;">
            Enter your registered 10-digit mobile number and set a new password.
          </p>
          <div id="reset-modal-error" style="display: none; background: #fef2f2; color: #b91c1c; padding: 0.6rem; border-radius: 6px; font-size: 0.82rem; margin-bottom: 1rem;"></div>

          <div class="form-group">
            <label class="form-label required">Registered Mobile Number</label>
            <input type="tel" id="reset-mobile" class="form-control" placeholder="10-digit mobile number" maxlength="10">
          </div>

          <div class="form-group">
            <label class="form-label required">New Password (Min 6 Characters)</label>
            <input type="password" id="reset-new-password" class="form-control" placeholder="••••••••" minlength="6">
          </div>
        </div>
      `,
      confirmText: "Reset & Update Password",
      onConfirm: async () => {
        const mobile = document.getElementById("reset-mobile").value;
        const newPwd = document.getElementById("reset-new-password").value;
        const errDiv = document.getElementById("reset-modal-error");

        try {
          const res = await API.resetPassword(mobile, newPwd);
          App.showToast(res.message || "Password updated.", "success");
          App.closeModal();
          AuthComponent.renderLogin();
        } catch (err) {
          errDiv.textContent = err.message || "Failed to reset password.";
          errDiv.style.display = "block";
        }
      }
    });
  }
};
