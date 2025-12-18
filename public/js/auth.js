document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => document.body.classList.add("is-ready"), 50);

  const loginForm = document.getElementById("loginForm");
  const loginStatus = document.getElementById("loginStatus");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const role = document.querySelector('input[name="roleLogin"]:checked')?.value;
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      if (!email || !password) {
        showStatus(
          loginStatus,
          "Mohon isi email dan password.",
          "alert-danger"
        );
        return;
      }

      try {
        showStatus(loginStatus, "Sedang memproses login...", "alert-info");

        const res = await apiRequest("/login", {
          method: "POST",
          body: JSON.stringify({
            email: email,      // ⬅️ WAJIB email
            password: password,
            role: role
          }),
        });

        // simpan token & user
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));

        showStatus(
          loginStatus,
          "Login berhasil! Mengalihkan...",
          "alert-success"
        );

        setTimeout(() => {
          const user = res.user;
          if (user.role === "pegawai") {
            window.location.href = "/pages/admin/dashboard.html";
          } else {
            window.location.href = "/index.html";
          }
        }, 800);
      } catch (err) {
        console.error(err);

        const msg =
          err?.message ||
          err?.errors?.email?.[0] ||
          "Login gagal. Periksa email dan password.";

        showStatus(loginStatus, msg, "alert-danger");
      }
    });
  }

  const regForm = document.getElementById("registerForm");
  const regStatus = document.getElementById("regStatus");

  if (regForm) {
    regForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const role = document.querySelector('input[name="roleReg"]:checked')?.value;
      const customer_no = document.getElementById("regCustomerNo").value.trim();
      const name = document.getElementById("regName").value.trim();
      const email = document.getElementById("regEmail").value.trim();
      const phone = document.getElementById("regPhone").value.trim();
      const password = document.getElementById("regPassword").value;
      const passwordConfirm = document.getElementById("regPasswordConfirm").value;

      if (!name || !email || !password || !passwordConfirm) {
        showStatus(regStatus, "Mohon lengkapi semua field wajib.", "alert-danger");
        return;
      }

      if (password.length < 6) {
        showStatus(regStatus, "Password minimal 6 karakter.", "alert-danger");
        return;
      }

      if (password !== passwordConfirm) {
        showStatus(regStatus, "Konfirmasi password tidak sama.", "alert-danger");
        return;
      }

      try {
        showStatus(regStatus, "Sedang memproses pendaftaran...", "alert-info");

        const res = await apiRequest("/register", {
          method: "POST",
          body: JSON.stringify({
            customer_no,
            name,
            email,
            phone,
            password,
            password_confirmation: passwordConfirm,
            role
          }),
        });

        showStatus(regStatus, "Pendaftaran berhasil! Silakan login.", "alert-success");

        const loginTabBtn = document.querySelector("#tab-login");
        if (loginTabBtn && window.bootstrap) {
          const tab = new bootstrap.Tab(loginTabBtn);
          tab.show();
        }

        regForm.reset();

        const loginEmailInput = document.getElementById("loginEmail");
        if (loginEmailInput) {
          loginEmailInput.value = email;
        }
      } catch (err) {
        console.error(err);

        let msg = err?.message || "Pendaftaran gagal. Coba lagi.";

        if (err?.errors) {
          if (err.errors.email && err.errors.email[0]) {
            msg = err.errors.email[0];
          } else if (err.errors.password && err.errors.password[0]) {
            msg = err.errors.password[0];
          }
        }

        showStatus(regStatus, msg, "alert-danger");
      }
    });
  }
});

function showStatus(el, message, klass) {
  if (!el) {
    alert(message);
    return;
  }
  el.className = "alert " + klass;
  el.textContent = message;
  el.classList.remove("d-none");
}
