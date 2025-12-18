// navbar-auth.js
(function () {
  function getStoredUser() {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function getAvatarUrl() {
    try {
      return localStorage.getItem('profile_avatar') || null;
    } catch {
      return null;
    }
  }

  function renderLoggedOut(el) {
    // Pastikan tombol kembali ke mode Sign Up biasa
    el.href = '/pages/register.html';
    el.className = 'signup-button';
    el.textContent = 'Sign Up';
  }

  function renderLoggedIn(el, user, avatarUrl) {
    // Biar tampilan rapi, kita ganti innerHTML jadi chip profil
    el.href = '/pages/profil.html';
    el.className = 'profile-chip'; // kamu bisa styling di CSS pakai kelas ini

    const displayName = user?.name || 'Profil Saya';

    el.innerHTML = `
      <span class="profile-chip-inner">
        <span class="profile-avatar">
          ${
            avatarUrl
              ? `<img src="${avatarUrl}" alt="Foto profil" />`
              : `<i class="fa-solid fa-user"></i>`
          }
        </span>
        <span class="profile-name-text">${displayName}</span>
      </span>
    `;
  }

  function updateNavbarUserState() {
    const navAction = document.getElementById('userNavAction');
    if (!navAction) return;

    const token = localStorage.getItem('token');
    const user  = getStoredUser();

    if (!token || !user) {
      renderLoggedOut(navAction);
      return;
    }

    const avatarUrl = getAvatarUrl();
    renderLoggedIn(navAction, user, avatarUrl);
  }

  document.addEventListener('DOMContentLoaded', updateNavbarUserState);
})();

window.handleLogout = async function () {
  try {
    await apiRequest('/logout', { method: 'POST' });
  } catch (e) {
    console.warn("Server logout gagal, lanjut hapus lokal...");
  }

  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profile_avatar');
  } catch {}

  alert("Anda telah logout.");
  window.location.href = '/pages/register.html';
};
