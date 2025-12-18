function setLayoutVars() {
  const header = document.querySelector('.site-header');
  const headerH = header ? header.getBoundingClientRect().height : 72;
  document.documentElement.style.setProperty('--header-h', headerH + 'px');

  const contentInner = document.querySelector('.content-inner');
  const pageGap = 28;
  if (window.innerWidth > 992 && contentInner) {
    contentInner.style.height = `calc(100vh - ${headerH + pageGap * 2}px)`;
  } else if (contentInner) {
    contentInner.style.height = 'auto';
  }
}

function initSidebar() {
  const bodyEl = document.documentElement;
  const toggleBtn = document.getElementById('sidebarToggle');
  const toggleIcon = document.getElementById('sidebarToggleIcon');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', function () {
    if (window.innerWidth <= 991.98) return;
    bodyEl.classList.toggle('collapsed');
    const collapsed = bodyEl.classList.contains('collapsed');
    if (toggleIcon) {
      toggleIcon.className = collapsed ? 'fa-solid fa-arrow-right' : 'fa-solid fa-bars';
    }
    setLayoutVars();
  });
}

/* =========================================
   HELPER: akses input-info pribadi berdasarkan urutan
   ========================================= */
function getProfileFormRefs() {
  const form = document.getElementById('formPribadi');
  if (!form) return {};

  const inputs = form.querySelectorAll('input');
  // pastikan minimal ada 4–5 input seperti di HTML kamu
  const namaInput       = inputs[0] || null;
  const phoneInput      = inputs[1] || null;
  const emailInput      = inputs[2] || null;
  const customerNoInput = inputs[3] || null;
  const nikInput        = inputs[4] || null;

  const errorEl = document.getElementById('profileError'); // opsional, kalau mau buat <small id="profileError">

  return {
    form,
    namaInput,
    phoneInput,
    emailInput,
    customerNoInput,
    nikInput,
    errorEl,
  };
}

/* =========================================
   LOAD PROFIL DARI BACKEND & ISI FORM
   ========================================= */
async function loadProfileInfo() {
  const {
    form,
    namaInput,
    phoneInput,
    emailInput,
    customerNoInput,
    nikInput,
    errorEl,
  } = getProfileFormRefs();

  if (!form) return;

  try {
    if (errorEl) {
      errorEl.textContent = 'Memuat data profil...';
      errorEl.style.display = 'block';
      errorEl.style.color = '#555';
    }

    // GET /api/profile – pastikan ProfileController::show sudah mengembalikan user + customer
    const res = await apiRequest('/profile', { method: 'GET' });

    // fleksibel: kadang data ada di res.data, kadang langsung di res
    const data     = res.data || res;
    const user     = data.user || data;
    const customer = data.customer || user.customer || null;

    if (namaInput && user.name)  namaInput.value  = user.name;
    if (phoneInput && user.phone) phoneInput.value = user.phone;
    if (emailInput && user.email) emailInput.value = user.email;

    const sidebarNameEl = document.getElementById("sidebarProfileName");
    if (sidebarNameEl && user.name) {
      sidebarNameEl.textContent = user.name;
    }

    if (customer) {
      if (customerNoInput && customer.customer_no) {
        customerNoInput.value = customer.customer_no;
        customerNoInput.readOnly = true; // biasanya nomor pelanggan tidak boleh diubah
      }
      if (nikInput && customer.nik) nikInput.value = customer.nik;

      const alamatInput  = document.getElementById("alamatLengkap");
      const provInput    = document.getElementById("provinsi");
      const kotaInput    = document.getElementById("kota");
      const kodePosInput = document.getElementById("kodePos");

      if (alamatInput)  alamatInput.value  = customer.address     || "";
      if (provInput)    provInput.value    = customer.province    || "";
      if (kotaInput)    kotaInput.value    = customer.city        || "";
      if (kodePosInput) kodePosInput.value = customer.postal_code || "";
    }

    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }
  } catch (err) {
    console.error('Gagal memuat profil', err);
    if (errorEl) {
      errorEl.textContent = (err && err.message) || 'Tidak dapat memuat data profil.';
      errorEl.style.display = 'block';
      errorEl.style.color = 'red';
    }
  }
}

/* =========================================
   EDIT & SIMPAN ALAMAT TERDAFTAR
   ========================================= */
async function openAlamatEditor() {
  const section = document.getElementById('alamat');
  if (!section) return;

  const rows = section.querySelectorAll('.address-row div:last-child');
  if (rows.length < 4) return;

  const current = {
    address:    rows[0]?.textContent.trim() || '',
    province:   rows[1]?.textContent.trim() || '',
    city:       rows[2]?.textContent.trim() || '',
    postalCode: rows[3]?.textContent.trim() || '',
  };

  const alamatBaru   = prompt('Alamat lengkap', current.address);
  if (alamatBaru === null) return;

  const provBaru     = prompt('Provinsi', current.province);
  if (provBaru === null) return;

  const kotaBaru     = prompt('Kota/Kabupaten', current.city);
  if (kotaBaru === null) return;

  const kodePosBaru  = prompt('Kode Pos', current.postalCode);
  if (kodePosBaru === null) return;

  let statusEl = document.getElementById('alamatStatus');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.id = 'alamatStatus';
    statusEl.className = 'text-muted small mt-2';
    section.appendChild(statusEl);
  }

  try {
    statusEl.textContent = 'Menyimpan alamat...';
    statusEl.style.color = '#16d2df';

    await apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify({
        address:     alamatBaru,
        province:    provBaru,
        city:        kotaBaru,
        postal_code: kodePosBaru,
      }),
    });

    // sinkronkan ke tampilan
    rows[0].textContent = alamatBaru;
    rows[1].textContent = provBaru;
    rows[2].textContent = kotaBaru;
    rows[3].textContent = kodePosBaru;

    statusEl.textContent = 'Alamat berhasil diperbarui.';
    statusEl.style.color = 'green';
  } catch (err) {
    console.error('Gagal update alamat', err);
    statusEl.textContent =
      (err && err.message) || 'Gagal menyimpan alamat. Silakan coba lagi.';
    statusEl.style.color = 'red';
  }
}

/* =========================================
   INIT FORMS – UPDATE PROFIL + HUBUNGKAN TOMBOL EDIT ALAMAT
   ========================================= */
function initForms() {
  const {
    form,
    namaInput,
    phoneInput,
    emailInput,
    customerNoInput,
    nikInput,
    errorEl,
  } = getProfileFormRefs();

  const btnCancel    = document.getElementById('btnCancelInfo');
  const btnEditAlamat = document.getElementById('editAlamatBtn');

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const payload = {
        name:        namaInput       ? namaInput.value.trim()       : '',
        phone:       phoneInput      ? phoneInput.value.trim()      : '',
        email:       emailInput      ? emailInput.value.trim()      : '',
        customer_no: customerNoInput ? customerNoInput.value.trim() : '',
        nik:         nikInput        ? nikInput.value.trim()        : '',
      };

      try {
        if (errorEl) {
          errorEl.textContent = 'Menyimpan perubahan...';
          errorEl.style.display = 'block';
          errorEl.style.color = '#16d2df';
        }

        await apiRequest('/profile', {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        const sidebarNameEl = document.getElementById("sidebarProfileName");
        if (sidebarNameEl && payload.name) {
          sidebarNameEl.textContent = payload.name;
        }

        if (errorEl) {
          errorEl.textContent = 'Perubahan profil berhasil disimpan.';
          errorEl.style.color = 'green';
        }

        // update nama/email di localStorage.user supaya navbar ikut berubah
        try {
          const rawUser = localStorage.getItem('user');
          if (rawUser) {
            const user = JSON.parse(rawUser);
            user.name  = payload.name  || user.name;
            user.email = payload.email || user.email;
            user.phone = payload.phone || user.phone;
            localStorage.setItem('user', JSON.stringify(user));
          }
        } catch {}
      } catch (err) {
        console.error('Gagal menyimpan profil', err);
        if (errorEl) {
          errorEl.textContent =
            (err && err.message) || 'Gagal menyimpan profil. Silakan coba lagi.';
          errorEl.style.display = 'block';
          errorEl.style.color = 'red';
        }
      }
    });
  }

  if (btnCancel) {
    btnCancel.addEventListener('click', function () {
      if (confirm('Batalkan perubahan?')) window.location.reload();
    });
  }

  if (btnEditAlamat) {
    btnEditAlamat.addEventListener('click', function () {
      openAlamatEditor();
    });
  }
}

function initAlamatForm() {
  const formAlamat = document.getElementById("formAlamat");
  const statusEl = document.getElementById("alamatStatus");

  if (!formAlamat) return;

  const alamatInput = document.getElementById("alamatLengkap");
  const provInput   = document.getElementById("provinsi");
  const kotaInput   = document.getElementById("kota");
  const kodePosInput = document.getElementById("kodePos");
  const btnCancel = document.getElementById("btnCancelAlamat");

  formAlamat.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      address:     alamatInput.value.trim(),
      province:    provInput.value.trim(),
      city:        kotaInput.value.trim(),
      postal_code: kodePosInput.value.trim(),
    };

    try {
      statusEl.textContent = "Menyimpan alamat...";
      statusEl.style.color = "#16d2df";
      statusEl.style.display = "block";

      await apiRequest("/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      statusEl.textContent = "Alamat berhasil diperbarui!";
      statusEl.style.color = "green";
    } catch (err) {
      console.error(err);
      statusEl.textContent =
        err.message || "Gagal memperbarui alamat. Coba lagi.";
      statusEl.style.color = "red";
      statusEl.style.display = "block";
    }
  });

  if (btnCancel) {
    btnCancel.addEventListener("click", () => {
      if (confirm("Batalkan perubahan alamat?")) {
        window.location.reload();
      }
    });
  }
}


function initDropdowns() {
  const roots = document.querySelectorAll('.nav-dropdown');
  if (!roots.length) return;

  function closeAll(except) {
    document.querySelectorAll('.nav-dropdown.open').forEach(d => {
      if (d !== except) {
        d.classList.remove('open');
        const btn = d.querySelector('.nav-link-caret');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.querySelectorAll('.nav-link-caret').forEach(trigger => {
    trigger.setAttribute('role', 'button');
    trigger.setAttribute('aria-expanded', 'false');

    trigger.addEventListener('click', e => {
      e.preventDefault();
      const root = trigger.closest('.nav-dropdown');
      const willOpen = !root.classList.contains('open');
      closeAll(root);
      root.classList.toggle('open', willOpen);
      trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    trigger.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        trigger.click();
      }
      if (e.key === 'ArrowDown') {
        const firstItem = trigger.parentElement.querySelector('.dropdown-item');
        if (firstItem) firstItem.focus();
      }
    });
  });

  document.querySelectorAll('.nav-dropdown .dropdown-menu .dropdown-item').forEach(a => {
    a.setAttribute('tabindex', '0');
    a.addEventListener('click', () => closeAll());
    a.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeAll();
        const caret = a.closest('.nav-dropdown')?.querySelector('.nav-link-caret');
        if (caret) caret.focus();
      }
    });
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.nav-dropdown')) closeAll();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAll();
  });
}

function initAvatar() {
  const box = document.getElementById('avatarBox');
  const img = document.getElementById('avatarImg');
  const input = document.getElementById('avatarInput');
  const btnChange = document.getElementById('btnAvatarChange');
  const btnRemove = document.getElementById('btnAvatarRemove');

  if (!box || !img) return;
  try {
    const saved = localStorage.getItem('profile_avatar');
    if (saved) {
      img.src = saved;
      box.classList.add('has-photo');
    }
  } catch {}

  function openPicker() {
    if (input) input.click();
  }

  function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      const dataUrl = ev.target.result;
      img.src = dataUrl;
      box.classList.add('has-photo');
      try {
        localStorage.setItem('profile_avatar', dataUrl);
      } catch {
        alert('Penyimpanan gambar gagal. Pastikan ukuran file tidak terlalu besar.');
      }
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    if (!confirm('Hapus foto profil?')) return;
    try { localStorage.removeItem('profile_avatar'); } catch {}
    img.removeAttribute('src');
    box.classList.remove('has-photo');
  }

  box.addEventListener('click', openPicker);
  if (btnChange) btnChange.addEventListener('click', openPicker);
  if (input) input.addEventListener('change', handleFile);
  if (btnRemove) btnRemove.addEventListener('click', removePhoto);
}

function initProfileTabsRouter() {
  const valid = ['infoPribadi', 'alamat', 'riwayat'];

  const sections = {
    infoPribadi: document.getElementById('infoPribadi'),
    alamat: document.getElementById('alamat'),
    riwayat: document.getElementById('riwayat'),
  };

  const menuItems = document.querySelectorAll('#profileMenu li');
  if (!menuItems.length) return;

  function activate(key, updateHash = true) {
    if (!valid.includes(key)) key = 'infoPribadi';

    menuItems.forEach(li => li.classList.toggle('active', li.dataset.target === key));

    Object.keys(sections).forEach(k => {
      if (sections[k]) sections[k].style.display = (k === key) ? '' : 'none';
    });

    const scroller = document.querySelector('.content-inner');
    if (scroller) scroller.scrollTop = 0;

    if (updateHash) history.replaceState(null, '', '#' + key);
  }

  menuItems.forEach(li => {
    li.addEventListener('click', () => activate(li.dataset.target, true));
  });

  activate((location.hash || '#infoPribadi').slice(1), false);

  window.addEventListener('hashchange', () => {
    activate((location.hash || '#infoPribadi').slice(1), false);
  });
}

(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const ENTER = 24;
  const EXIT = 12;
  let state = false;
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    if (!state && y > ENTER) state = true;
    else if (state && y < EXIT) state = false;
    else return;

    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        header.classList.toggle('is-scrolled', state);
        ticking = false;
      });
    }
  }

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

window.scrollTo({ top: 0, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

document.addEventListener('DOMContentLoaded', function () {
  setLayoutVars();
  initSidebar();
  initDropdowns();
  initProfileTabsRouter();
  initForms();
  initAlamatForm();
  initAvatar();
  loadProfileInfo(); // ⬅️ muat data profil dari backend

  window.addEventListener('resize', setLayoutVars);
  window.addEventListener('orientationchange', setLayoutVars);
});

// /js/profile-history
const $ = (id) => document.getElementById(id);

function formatRupiah(n){
  const num = Number(n || 0);
  return "Rp " + num.toLocaleString("id-ID");
}

function periodToLabel(period){
  // period kamu kemungkinan "YYYYMM"
  const p = String(period || "");
  if (p.length === 6) {
    const y = p.slice(0,4);
    const m = Number(p.slice(4,6));
    const bulan = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"][m-1] || p.slice(4,6);
    return `${bulan} ${y}`;
  }
  return p || "-";
}

function formatDate(dateStr){
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr).slice(0,10);
  return d.toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" });
}

function statusToBadge(status){
  const s = String(status || "").toLowerCase();
  if (s === "paid") return { cls: "badge-paid", text: "Lunas" };
  if (s === "pending") return { cls: "badge-pending", text: "Menunggu" };
  if (s === "unpaid") return { cls: "badge-pending", text: "Belum Bayar" };
  return { cls: "badge-pending", text: s || "-" };
}

// ===== download invoice (PDF) dengan Bearer token =====
window.downloadInvoice = async function(billId){
  try{
    const token = localStorage.getItem("token");
    const resp = await fetch(`/api/bills/${billId}/invoice`, {
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    });

    if (!resp.ok){
      let msg = "Gagal download invoice.";
      try{
        const j = await resp.json();
        msg = j.message || msg;
      }catch{}
      alert(msg);
      return;
    }

    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);

    // download (bukan hanya open tab)
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice_bill_${billId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }catch(e){
    console.error(e);
    alert("Gagal download invoice.");
  }
};

let historyLoaded = false;

async function loadPaymentHistory(){
  const paymentList = $("paymentList");
  if (!paymentList) return;

  // kalau sudah pernah load, skip (biar tidak dobel)
  if (historyLoaded) return;
  historyLoaded = true;

  // loading state ringan (tanpa ubah tampilan signifikan)
  paymentList.innerHTML = `<div class="muted-note">Memuat riwayat...</div>`;

  try{
    const res = await apiRequest("/me/payment-history");
    const data = res.data || res;

    const summary = data.summary || {};
    const items = Array.isArray(data.items) ? data.items : [];

    // Summary
    const elTotal  = $("summaryTotal");
    const elPaid   = $("summaryPaid");
    const elUnpaid = $("summaryUnpaid");

    if (elTotal)  elTotal.textContent  = formatRupiah(summary.total_tagihan || 0);
    if (elPaid)   elPaid.textContent   = String(summary.paid_count ?? 0);
    if (elUnpaid) elUnpaid.textContent = String(summary.unpaid_count ?? 0);

    if (!items.length){
      paymentList.innerHTML = `<div class="muted-note">Belum ada riwayat pembayaran.</div>`;
      return;
    }

    // Render list (struktur tetap seperti contoh kamu)
    paymentList.innerHTML = items.map(it => {
      const badge = statusToBadge(it.status);
      const periodLabel = periodToLabel(it.period);

      // tanggal pakai paid_at kalau ada, kalau tidak pakai "-"
      const dateText = it.paid_at ? formatDate(it.paid_at) : "-";

      return `
        <div class="payment-item">
          <div>
            <div class="fw-700">Invoice #${it.invoice_no || ("BILL-" + it.bill_id)}</div>
            <div class="muted-note">Periode: ${periodLabel}</div>
          </div>
          <div class="pay-right">
            <div class="text-end">
              <div class="fw-700">${formatRupiah(it.total || 0)}</div>
              <div class="muted-note">${dateText}</div>
            </div>
            <span class="${badge.cls}">${badge.text}</span>
            <button class="btn-ghost btn-sm" onclick="downloadInvoice(${it.bill_id})" ${it.status === "paid" ? "" : ""}>
              <i class="fa-solid fa-download"></i>
            </button>
          </div>
        </div>
      `;
    }).join("");

  }catch(err){
    console.error(err);
    paymentList.innerHTML = `<div class="muted-note">Gagal memuat riwayat.</div>`;
  }
}

// Load ketika user masuk tab/anchor #riwayat (karena section default display:none)
function maybeLoadOnHash(){
  if (window.location.hash === "#riwayat") {
    loadPaymentHistory();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // kalau langsung buka profil#riwayat
  maybeLoadOnHash();

  // kalau user pindah tab di halaman (hash berubah)
  window.addEventListener("hashchange", maybeLoadOnHash);
});
