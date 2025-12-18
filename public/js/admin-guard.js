async function ensurePegawai() {
  const token = localStorage.getItem("token");
  let user = null;

  if (!token) {
    window.location.href = "/pages/register.html";
    return false;
  }

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  if (!user) {
    try {
      const prof = await apiRequest("/profile");
      const u = prof.data || prof.user || prof;
      localStorage.setItem("user", JSON.stringify(u));
      user = u;
    } catch (e) {
      // token invalid / expired
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/pages/register.html";
      return false;
    }
  }

  if (user.role !== "pegawai") {
    window.location.href = "/index.html";
    return false;
  }

  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  ensurePegawai();
});
