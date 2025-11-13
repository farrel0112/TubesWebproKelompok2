(function () {
  document.querySelectorAll('.main-nav a[href="/tentang.html"]').forEach(a => {
    a.classList.add('is-active');
  });
})();

document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.card, .service-card, .leader, .faq-item, .stat-card, .tl-card');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = 1;
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.2
  });

  cards.forEach((el) => observer.observe(el));
});

(function () {
  const nums = document.querySelectorAll('.stat-card .num');
  if (!nums.length) return;

  const ease = t => 1 - Math.pow(1 - t, 3);

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.getAttribute('data-target'), 10) || 0;
      const start = performance.now();
      const duration = 1200;

      function tick(now) {
        const p = Math.min(1, (now - start) / duration);
        const val = Math.floor(ease(p) * target);
        el.textContent = val.toLocaleString('id-ID');
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.4 });

  nums.forEach(n => io.observe(n));
})();

(function () {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();
