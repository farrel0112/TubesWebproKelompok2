function ensureAuthenticated() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Silakan login terlebih dahulu untuk mengakses halaman ini.');
    window.location.href = '/pages/register.html';
    return false;
  }
  return true;
}


document.addEventListener("DOMContentLoaded", ensureAuthenticated);
