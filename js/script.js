document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".fitur-card");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = 1;
        entry.target.style.transform = "translateY(0)";
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.3
  });

  cards.forEach((card) => {
    observer.observe(card);
  });
});

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

(function () {
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
})();


const emergencyForm = document.getElementById("emergencyCallForm");
const emergencyMessage = document.getElementById("emergencyMessage");
const emergencyStatus = document.getElementById("emergencyStatus");

emergencyForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const message = emergencyMessage.value.trim();

  if (message.length > 0) {
    emergencyStatus.textContent = "🚨 Panggilan darurat telah dikirim!";
    emergencyStatus.style.display = "block";
    emergencyMessage.value = "";

    setTimeout(() => {
      emergencyStatus.style.display = "none";
    }, 4000);
  } else {
    emergencyStatus.textContent = "⚠️ Harap isi deskripsi masalah.";
    emergencyStatus.style.color = "red";
    emergencyStatus.style.display = "block";
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const btnKontak = document.querySelector('.btn-daftar');
  const btnTentang = document.querySelector('.btn-pelajari');

  if (btnKontak) {
    btnKontak.addEventListener('click', () => {
      window.location.href = '/pages/kontak.html';
    });
  }

  if (btnTentang) {
    btnTentang.addEventListener('click', () => {
      window.location.href = '/pages/tentang.html';
    });
  }
});

