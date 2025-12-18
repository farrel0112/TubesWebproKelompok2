document.addEventListener("DOMContentLoaded", async () => {
  // Tampilkan nama admin kalau ada di localStorage
  try {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    if (u?.name) document.getElementById("adminName").textContent = u.name;
  } catch {}

  const alertBox = document.getElementById("alert");
  const showAlert = (msg, type = "error") => {
    alertBox.classList.remove("hidden", "error", "success");
    alertBox.classList.add(type);
    alertBox.textContent = msg;
  };

  try {
    const res = await apiRequest("/admin/dashboard");
    const d = res.data;

    document.getElementById("periodLabel").textContent = d.period || "-";
    document.getElementById("totalCustomers").textContent = d.total_customers ?? "-";
    document.getElementById("activeCustomers").textContent = d.active_customers ?? "-";
    document.getElementById("readingsThisMonth").textContent = d.readings_this_month ?? "-";
    document.getElementById("billsThisMonth").textContent = d.bills_this_month ?? "-";
    document.getElementById("unpaidBills").textContent = d.bills_unpaid ?? "-";
    document.getElementById("openComplaints").textContent = d.open_complaints ?? "-";
  } catch (e) {
    console.error(e);
    showAlert(e?.message || "Gagal memuat data dashboard.", "error");
  }

  // Logout
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      try {
        await apiRequest("/logout", { method: "POST" });
      } catch {}
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/pages/register.html";
    });
  }
});
