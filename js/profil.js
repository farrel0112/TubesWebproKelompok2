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

function initForms() {
  const form = document.getElementById('formPribadi');
  const btnCancel = document.getElementById('btnCancelInfo');
  const btnEditAlamat = document.getElementById('editAlamatBtn');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      alert('Perubahan profil disimpan (simulasi).');
    });
  }

  if (btnCancel) {
    btnCancel.addEventListener('click', function () {
      if (confirm('Batalkan perubahan?')) window.location.reload();
    });
  }

  if (btnEditAlamat) {
    btnEditAlamat.addEventListener('click', function () {
      alert('Buka form edit alamat (simulasi).');
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

function initEmergencyForm() {
  const emergencyForm = document.getElementById('emergencyCallForm');
  const emergencyMessage = document.getElementById('emergencyMessage');
  const emergencyStatus = document.getElementById('emergencyStatus');
  if (!emergencyForm || !emergencyMessage || !emergencyStatus) return;

  emergencyForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const message = emergencyMessage.value.trim();

    if (message.length > 0) {
      emergencyStatus.textContent = '🚨 Panggilan darurat telah dikirim!';
      emergencyStatus.style.display = 'block';
      emergencyStatus.style.color = '#16d2df';
      emergencyMessage.value = '';
      setTimeout(() => { emergencyStatus.style.display = 'none'; }, 4000);
    } else {
      emergencyStatus.textContent = '⚠️ Harap isi deskripsi masalah.';
      emergencyStatus.style.color = 'red';
      emergencyStatus.style.display = 'block';
    }
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
  initAvatar();
  initEmergencyForm();

  window.addEventListener('resize', setLayoutVars);
  window.addEventListener('orientationchange', setLayoutVars);
});

function downloadInvoice(id) {
  alert('Mengunduh invoice ' + id + ' (simulasi).');
}
window.downloadInvoice = downloadInvoice;

