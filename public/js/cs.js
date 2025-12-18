const PDAM_POINTS = [
  { id: 'cab-pusat', name: 'PDAM Pusat', lat: -4.827306, lng: 122.717194, addr: 'Jl. PAM No. 21' },
  { id: 'cab-jompi',   name: 'PDAM Jompi', lat: -4.846194, lng: 122.717472, addr: 'Jl. Ir. Juanda, Laende' },
  { id: 'cab-lohia',   name: 'PDAM Lohia', lat: -4.905667, lng: 122.742139, addr: 'Jl. Poros Napabale, Lohia' }
];

const btnUseLocation = document.getElementById('btnUseLocation');
const btnSelectManual = document.getElementById('btnSelectManual');
const nearestBox = document.getElementById('nearestBox');
const nbName = document.getElementById('nbName');
const nbDist = document.getElementById('nbDist');
const nbDirections = document.getElementById('nbDirections');

let map;
let markers = [];
let userMarker = null;

function initMap() {
  map = L.map('map', {
    zoomControl: true,
    attributionControl: false
  }).setView([-4.827306, 122.717194], 11);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);

  PDAM_POINTS.forEach(p => {
    const m = L.marker([p.lat, p.lng]).addTo(map);
    m.bindPopup(`<b>${p.name}</b><br>${p.addr}`);
    markers.push({ point: p, marker: m });
  });
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function findNearest(lat, lng) {
  let best = null;
  let bestDist = Infinity;
  PDAM_POINTS.forEach(p => {
    const d = haversine(lat, lng, p.lat, p.lng);
    if (d < bestDist) {
      best = p;
      bestDist = d;
    }
  });
  return { best, distKm: bestDist };
}

function showNearest(lat, lng) {
  const { best, distKm } = findNearest(lat, lng);
  if (!best) return;

  nbName.textContent = `${best.name} • ${best.addr}`;
  nbDist.textContent = `Perkiraan jarak: ${distKm.toFixed(2)} km`;
  nbDirections.href = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${best.lat},${best.lng}`;
  nearestBox.style.display = 'block';
}

function locateUser() {
  if (!navigator.geolocation) {
    alert('Geolocation tidak didukung browser Anda.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      if (userMarker) {
        map.removeLayer(userMarker);
      }
      userMarker = L.marker([latitude, longitude], {
        icon: L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34]
        })
      }).addTo(map);
      userMarker.bindPopup('Lokasi Anda').openPopup();
      map.setView([latitude, longitude], 13);
      showNearest(latitude, longitude);
    },
    err => {
      alert('Gagal mendapatkan lokasi: ' + err.message);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

function enableManualPick() {
  alert('Klik pada peta untuk memilih lokasi Anda.');
  map.once('click', e => {
    const { lat, lng } = e.latlng;
    if (userMarker) {
      map.removeLayer(userMarker);
    }
    userMarker = L.marker([lat, lng]).addTo(map);
    userMarker.bindPopup('Lokasi yang dipilih').openPopup();
    showNearest(lat, lng);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof initDropdowns === 'function') {
    initDropdowns();
  }

  initMap();

  btnUseLocation.addEventListener('click', locateUser);
  btnSelectManual.addEventListener('click', enableManualPick);
});
