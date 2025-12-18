if (typeof initDropdowns === 'function') {
  initDropdowns();
}

document.addEventListener('DOMContentLoaded', () => {
  const lat = -4.827306;
  const lng = 122.717194;

  const map = L.map('map', {
    zoomControl: true,
    attributionControl: false
  }).setView([lat, lng], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map);

  const marker = L.marker([lat, lng]).addTo(map);
  marker.bindPopup(`
    <b>PERUMDA Tirta Sugi Laende</b><br>
    Kabupaten Muna
  `);
});
