document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => document.body.classList.add("is-ready"), 50);

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("Simulasi login");
    });
  }

  const regForm = document.getElementById("registerForm");
  const regStatus = document.getElementById("regStatus");
  if (regForm) {
    regForm.addEventListener("submit", (e) => {
      e.preventDefault();
      regStatus.classList.remove("d-none");
      setTimeout(() => regStatus.classList.add("d-none"), 4000);
      regForm.reset();
      const loginTabBtn = document.querySelector('#tab-login');
      if (loginTabBtn) {
        const tab = new bootstrap.Tab(loginTabBtn);
        tab.show();
      }
    });
  }
});
