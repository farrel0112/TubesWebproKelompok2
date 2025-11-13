if (typeof initDropdowns === 'function') {
  initDropdowns();
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('faqSearch');
  const items = Array.from(document.querySelectorAll('.faq-item'));

  function normalize(s) {
    return (s || '').toLowerCase();
  }

  function applyFilter(q) {
    const key = normalize(q);
    items.forEach(d => {
      const sum = d.querySelector('summary')?.textContent || '';
      const body = d.textContent || '';
      const hit = normalize(sum + ' ' + body).includes(key);
      d.style.display = hit ? '' : 'none';
      if (!hit) d.open = false;
    });
  }

  input?.addEventListener('input', (e) => {
    applyFilter(e.target.value);
  });

  function openHash() {
    const id = (location.hash || '').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (target && target.classList.contains('faq-item')) {
      target.open = true;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  openHash();
  window.addEventListener('hashchange', openHash);
});
