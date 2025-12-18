const API_BASE_URL = window.location.origin + "/api";

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = API_BASE_URL + path;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data = {};
  try {
    data = await response.json();
  } catch (e) {
  
  }

  if (response.status === 401) {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {}

    alert('Sesi anda berakhir atau belum login. Silakan login kembali.');
    window.location.href = '/pages/register.html';
    throw data || { message: 'Unauthenticated' };
  }

  if (!response.ok) {
    throw data?.message ? data : { message: "Request failed" };
  }

  return data;
}
