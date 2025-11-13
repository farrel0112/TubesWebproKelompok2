const LOCATIONS = [
  {
    id: "cabang-raha",
    name: "PDAM Sugi Laende - Raha",
    services: ["Pembayaran", "Pengaduan"],
    phone: "+6281234567890",
    isOpen: true,
    lat: -4.842833,
    lng: 122.725289
  },
  {
    id: "cabang-lohia",
    name: "PDAM Sugi Laende - Lohia",
    services: ["Pembayaran", "Pengaduan"],
    phone: "+6281111111111",
    isOpen: true,
    lat: -4.83152,
    lng: 122.7309
  },
  {
    id: "cabang-kontunaga",
    name: "PDAM Sugi Laende - Kontunaga",
    services: ["Pembayaran"],
    phone: "+6282222222222",
    isOpen: false,
    lat: -4.8689,
    lng: 122.7168
  }
];

function distanceKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const c = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const d = 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
  return R * d;
}
function fmtKm(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} Km`;
}

let map, markers = [];
let origin = null;
let originMode = null;

document.addEventListener("DOMContentLoaded", () => {
  map = L.map('map', { zoomControl: true, attributionControl: false })
          .setView([LOCATIONS[0].lat, LOCATIONS[0].lng], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
  }).addTo(map);

  renderMarkers();

  fitToAllLocations();

  map.on("click", (e) => {
    origin = { lat: e.latlng.lat, lng: e.latlng.lng };
    originMode = "click";
    updateOriginLabel();
    redrawList();
    dropOrMoveOriginMarker();
  });

  document.getElementById("btnMyLocation").addEventListener("click", useMyLocation);
  document.getElementById("btnClearOrigin").addEventListener("click", () => {
    origin = null; originMode = null;
    updateOriginLabel();
    redrawList();
    dropOrMoveOriginMarker();
  });
  document.getElementById("searchInput").addEventListener("input", redrawList);
  redrawList();
});

let originMarker = null;

function renderMarkers() {
  markers.forEach(m => m.remove());
  markers = [];

  LOCATIONS.forEach((loc) => {
    const m = L.marker([loc.lat, loc.lng]).addTo(map);
    m.bindPopup(`<strong>${loc.name}</strong><br>${loc.services.join(", ")}`);
    m.on("click", () => {
      m.openPopup();
      const card = document.querySelector(`[data-id="${loc.id}"]`);
      if (card) {
        card.classList.add("ring");
        setTimeout(() => card.classList.remove("ring"), 1200);
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
    markers.push(m);
  });
}

function dropOrMoveOriginMarker() {
  if (!origin) {
    if (originMarker) { originMarker.remove(); originMarker = null; }
    return;
  }
  const icon = L.divIcon({
    className: "origin-pin",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:#0d6efd;outline:3px solid rgba(13,110,253,.35)"></div>`,
    iconSize: [18,18]
  });
  if (!originMarker) {
    originMarker = L.marker([origin.lat, origin.lng], { icon }).addTo(map);
  } else {
    originMarker.setLatLng([origin.lat, origin.lng]);
  }
}

function redrawList() {
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  const list = document.getElementById("listContainer");
  list.innerHTML = "";

  const enriched = LOCATIONS
    .map(loc => {
      const d = origin ? distanceKm(origin, { lat: loc.lat, lng: loc.lng }) : null;
      return { ...loc, distanceKm: d };
    })
    .filter(loc => !q || loc.name.toLowerCase().includes(q));

  enriched.sort((a, b) => {
    if (origin) return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
    return a.name.localeCompare(b.name);
  });

  for (const loc of enriched) {
    const card = document.createElement("div");
    card.className = "location-card";
    card.dataset.id = loc.id;

    const distanceText = origin ? fmtKm(loc.distanceKm) : "-";
    const services = loc.services.join(", ");
    const badge = loc.isOpen ? `<span class="badge-open">BUKA</span>` : `<span class="badge bg-secondary">TUTUP</span>`;

    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <div class="fw-semibold">${loc.name}</div>
          <div class="small-muted">${distanceText} • ${services}</div>
        </div>
        ${badge}
      </div>
      <div class="mt-2 d-flex gap-2">
        <a href="tel:${loc.phone.replace(/\s+/g,'')}" class="btn btn-sm btn-outline">
          <i class="fa-solid fa-phone me-1"></i> Telepon
        </a>
        <a href="${buildDirectionsUrl(loc)}" target="_blank" class="btn btn-sm btn-outline-primary">
          <i class="fa-regular fa-map me-1"></i> Petunjuk Arah
        </a>
      </div>
    `;
    list.appendChild(card);
  }
}

function buildDirectionsUrl(loc) {
  const dest = `${loc.lat},${loc.lng}`;
  if (origin) {
    const ori = `${origin.lat},${origin.lng}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(ori)}&destination=${encodeURIComponent(dest)}&travelmode=driving`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`;
}

function updateOriginLabel() {
  const el = document.getElementById("originLabel");
  if (!origin) {
    el.textContent = "Titik asal: belum ditentukan";
    return;
  }
  const src = originMode === "gps" ? "Lokasi saya" : "Titik kustom";
  el.textContent = `Titik asal: ${src} (${origin.lat.toFixed(5)}, ${origin.lng.toFixed(5)})`;
}

function fitToAllLocations() {
  const group = L.featureGroup(LOCATIONS.map(l => L.marker([l.lat, l.lng])));
  map.fitBounds(group.getBounds().pad(0.2));
}

function useMyLocation() {
  if (!navigator.geolocation) {
    alert("Peramban Anda tidak mendukung geolokasi.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      origin = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      originMode = "gps";
      updateOriginLabel();
      map.setView([origin.lat, origin.lng], 14);
      dropOrMoveOriginMarker();
      redrawList();
    },
    (err) => {
      console.error(err);
      alert("Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
  );
}
