if (typeof initDropdowns === 'function') {
  initDropdowns();
}

document.addEventListener('DOMContentLoaded', () => {
  const map = L.map('map', { zoomControl: true, attributionControl: false })
    .setView([-5.1289, 122.7924], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map);

  const marker = L.marker([-5.1289, 122.7924]).addTo(map);
  marker.bindPopup('<b>PERUMDA Tirta Sugi Laende</b><br>Jl. Protokol No. 21, Laende, Muna');
});
