// ========= Helpers =========
const $ = (id) => document.getElementById(id);

function nowPeriodYYYYMM(){
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}`;
}
function toDateInputValue(dateStr){
  return (dateStr || "").toString().slice(0,10);
}
function formatCustomerName(c){
  // sesuai response kamu: customer punya relasi user
  return c?.user?.name ?? `User#${c?.user_id ?? "-"}`;
}
function formatCustomerAddress(c){
  const parts = [c?.address, c?.city, c?.province, c?.postal_code ? `(${c.postal_code})` : null].filter(Boolean);
  return parts.join(", ") || "-";
}

// ========= State =========
let customersCache = [];
let metersCache = [];
let readingsCache = [];

// ========= Elements (Readings) =========
const readingTable = $("readingTable");
const modalReading = $("modalReading");
const readingForm = $("readingForm");

const btnAddReading = $("btnAddReading");
const btnCancelReading = $("btnCancelReading");
const btnCloseReading = $("btnCloseReading");

const filterPeriod = $("filterPeriod");
const filterMeter = $("filterMeter");
const btnApply = $("btnApply");
const btnReset = $("btnReset");

const readingId = $("readingId");
const meterId = $("meterId");
const period = $("period");
const readAt = $("readAt");
const startRead = $("startRead");
const endRead = $("endRead");
const kubikasi = $("kubikasi");

// ========= Elements (Meter master) =========
const meterTable = $("meterTable");
const modalMeter = $("modalMeter");
const meterForm = $("meterForm");

const btnAddMeter = $("btnAddMeter");
const btnCancelMeter = $("btnCancelMeter");
const btnCloseMeter = $("btnCloseMeter");

const filterMeterMaster = $("filterMeterMaster");
const filterCustomerName = $("filterCustomerName");
const btnApplyMeter = $("btnApplyMeter");
const btnResetMeter = $("btnResetMeter");

const meterEditId = $("meterEditId");
const meterCustomerId = $("meterCustomerId");
const meterSerialNo = $("meterSerialNo");
const meterInstallDate = $("meterInstallDate");

// ========= Modal controls =========
function showModal(el){ el.classList.remove("hidden"); }
function hideModal(el){ el.classList.add("hidden"); }

// ========= Load customers (for meter creation dropdown) =========
async function loadCustomers(){
  const res = await apiRequest("/customers");
  const data = res.data || res;
  customersCache = Array.isArray(data) ? data : [];

  meterCustomerId.innerHTML = customersCache.length
    ? customersCache.map(c => `
        <option value="${c.id}">
          ${formatCustomerName(c)} — ${formatCustomerAddress(c)}
        </option>
      `).join("")
    : `<option value="">(Belum ada pelanggan)</option>`;
}

// ========= Load meters =========
async function loadMeters(){
  const res = await apiRequest("/meters");
  const data = res.data || res;
  metersCache = Array.isArray(data) ? data : [];

  // dropdown untuk input reading
  meterId.innerHTML = metersCache.length
    ? metersCache.map(m => {
        const label = m.serial_no ?? m.number ?? `Meter #${m.id}`;
        return `<option value="${m.id}">${label}</option>`;
      }).join("")
    : `<option value="">(Belum ada meter)</option>`;

  renderMeters();
}

// ========= Render meters table =========
function renderMeters(){
  const qMeter = (filterMeterMaster.value || "").trim().toLowerCase();
  const qName = (filterCustomerName.value || "").trim().toLowerCase();

  let rows = metersCache.slice();

  if (qMeter){
    rows = rows.filter(m => {
      const id = String(m.id).toLowerCase();
      const num = String(m.meter_number ?? m.number ?? "").toLowerCase();
      return id.includes(qMeter) || num.includes(qMeter);
    });
  }

  if (qName){
    rows = rows.filter(m => {
      // jika meter membawa relasi customer/user, pakai itu
      const custName = String(m.customer?.user?.name ?? "").toLowerCase();
      return custName.includes(qName);
    });
  }

  if (!rows.length){
    meterTable.innerHTML = `<tr><td colspan="6" class="muted">Tidak ada data meter</td></tr>`;
    return;
  }

  // sort by id desc
  rows.sort((a,b) => Number(b.id) - Number(a.id));

  meterTable.innerHTML = rows.map(m => {
    const serial = m.serial_no ?? `Meter #${m.id}`;
    const custName = m.customer?.user?.name ?? "-";
    const custAddr = m.customer ? formatCustomerAddress(m.customer) : "-";
    const install = toDateInputValue(m.install_date) || "-";

    return `
        <tr>
            <td>${m.id}</td>
            <td>${serial}</td>
            <td>${custName}</td>
            <td>${custAddr}</td>
            <td>${install}</td>
            <td>
                <div class="action-mini">
                    <button class="btn-mini" onclick="editMeter(${m.id})">✏️</button>
                    <button class="btn-mini" onclick="deleteMeter(${m.id})">🗑️</button>
                </div>
            </td>
        </tr>
    `;
    }).join("");
}

// ========= Create/Edit meter =========
btnAddMeter.addEventListener("click", () => {
  $("modalMeterTitle").textContent = "Tambah Meter";
  meterForm.reset();
  meterEditId.value = "";
  meterInstallDate.value = toDateInputValue(new Date().toISOString());

  showModal(modalMeter);
});


btnCancelMeter.addEventListener("click", () => hideModal(modalMeter));
btnCloseMeter.addEventListener("click", () => hideModal(modalMeter));

meterForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    customer_id: Number(meterCustomerId.value),
    serial_no: (meterSerialNo.value || "").trim(),
    install_date: meterInstallDate.value
  };

  if (!payload.serial_no) {
    alert("Serial No wajib diisi.");
    return;
  }

  try{
    if (meterEditId.value){
      await apiRequest(`/meters/${meterEditId.value}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    } else {
      await apiRequest("/meters", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }

    hideModal(modalMeter);
    await loadMeters(); // refresh dropdown + tabel
  }catch(err){
    console.error(err);
    alert(err?.message || "Gagal menyimpan meter. (cek validasi serial_no/install_date)");
  }
});


window.editMeter = async function(id){
  const m = metersCache.find(x => Number(x.id) === Number(id));
  if (!m) return alert("Meter tidak ditemukan.");

  $("modalMeterTitle").textContent = "Edit Meter";
  meterEditId.value = m.id;

  meterCustomerId.value = m.customer_id ?? "";
  meterSerialNo.value = m.serial_no ?? "";
  meterInstallDate.value = toDateInputValue(m.install_date) || "";

  showModal(modalMeter);
};


window.deleteMeter = async function(id){
  if(!confirm("Yakin ingin menghapus meter ini?")) return;
  try{
    await apiRequest(`/meters/${id}`, { method: "DELETE" });
    await loadMeters();
  }catch(err){
    alert(err?.message || "Gagal menghapus meter.");
  }
};

btnApplyMeter.addEventListener("click", renderMeters);
btnResetMeter.addEventListener("click", () => {
  filterMeterMaster.value = "";
  filterCustomerName.value = "";
  renderMeters();
});

// ========= Readings =========
function calcKubikasi(){
  const s = Number(startRead.value || 0);
  const e = Number(endRead.value || 0);
  const k = e - s;
  kubikasi.value = Number.isFinite(k) ? Math.max(0, k) : "";
}

function getLastEndReadForMeter(mId){
  const rows = readingsCache.filter(r => Number(r.meter_id) === Number(mId));
  if (!rows.length) return 0;
  rows.sort((a,b) => String(b.period).localeCompare(String(a.period)));
  return Number(rows[0].end_read ?? 0);
}
function syncStartRead(){
  const last = getLastEndReadForMeter(meterId.value);
  startRead.value = last;
  calcKubikasi();
}

async function loadReadings(){
  readingTable.innerHTML = `<tr><td colspan="8">Memuat...</td></tr>`;
  const res = await apiRequest("/meter-readings");
  const data = res.data || res;
  readingsCache = Array.isArray(data) ? data : [];
  renderReadings();
}

function renderReadings(){
  const p = (filterPeriod.value || "").trim();
  const m = (filterMeter.value || "").trim();

  let rows = readingsCache.slice();
  if (p) rows = rows.filter(r => String(r.period || "").includes(p));
  if (m) rows = rows.filter(r => String(r.meter_id || "").includes(m));

  if (!rows.length){
    readingTable.innerHTML = `<tr><td colspan="8" class="muted">Tidak ada data</td></tr>`;
    return;
  }

  rows.sort((a,b) => String(b.period).localeCompare(String(a.period)));

  readingTable.innerHTML = rows.map(r => {
    const s = Number(r.start_read ?? 0);
    const e = Number(r.end_read ?? 0);
    const k = e - s;

    return `
      <tr>
        <td>${r.id}</td>
        <td>${r.meter_id}</td>
        <td>${r.period}</td>
        <td>${s}</td>
        <td>${e}</td>
        <td>${Number.isFinite(k) ? k : "-"}</td>
        <td>${toDateInputValue(r.read_at) || "-"}</td>
        <td>
          <div class="action-mini">
            <button class="btn-mini" onclick="editReading(${r.id})">✏️</button>
            <button class="btn-mini" onclick="deleteReading(${r.id})">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

btnAddReading.addEventListener("click", () => {
  $("modalReadingTitle").textContent = "Input Pembacaan";
  readingForm.reset();
  readingId.value = "";
  period.value = nowPeriodYYYYMM();
  readAt.value = toDateInputValue(new Date().toISOString());
  endRead.value = "";
  kubikasi.value = "";

  syncStartRead();
  showModal(modalReading);
});

$("btnCancelReading").addEventListener("click", () => hideModal(modalReading));
$("btnCloseReading").addEventListener("click", () => hideModal(modalReading));
meterId.addEventListener("change", syncStartRead);
endRead.addEventListener("input", calcKubikasi);

btnApply.addEventListener("click", renderReadings);
btnReset.addEventListener("click", () => {
  filterPeriod.value = "";
  filterMeter.value = "";
  renderReadings();
});

readingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    meter_id: Number(meterId.value),
    start_read: Number(startRead.value || 0),
    end_read: Number(endRead.value || 0),
    period: String(period.value || "").trim(),
    read_at: readAt.value
  };

  try{
    if (readingId.value){
      await apiRequest(`/meter-readings/${readingId.value}`, {
        method: "PUT",
        body: JSON.stringify({
          end_read: payload.end_read,
          period: payload.period,
          read_at: payload.read_at
        })
      });
    } else {
      await apiRequest("/meter-readings", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }

    hideModal(modalReading);
    await loadReadings();
    // setelah ada reading baru, start read untuk meter itu akan berubah
    syncStartRead();
  }catch(err){
    console.error(err);
    alert(err?.message || "Gagal menyimpan pembacaan meter. (Cek validasi periode/start/end)");
  }
});

window.editReading = async function(id){
  try{
    const res = await apiRequest(`/meter-readings/${id}`);
    const r = res.data || res;

    $("modalReadingTitle").textContent = "Edit Pembacaan";
    readingId.value = r.id;

    meterId.value = r.meter_id;
    startRead.value = r.start_read;
    endRead.value = r.end_read;
    period.value = r.period;
    readAt.value = toDateInputValue(r.read_at);
    calcKubikasi();

    showModal(modalReading);
  }catch(e){
    alert("Gagal mengambil detail pembacaan.");
  }
};

window.deleteReading = async function(id){
  if(!confirm("Yakin ingin menghapus data pembacaan ini?")) return;
  try{
    await apiRequest(`/meter-readings/${id}`, { method: "DELETE" });
    await loadReadings();
    syncStartRead();
  }catch(e){
    alert("Gagal menghapus data.");
  }
};

// ========= Logout (biar konsisten) =========
const btnLogout = $("btnLogout");
if (btnLogout){
  btnLogout.addEventListener("click", async () => {
    try { await apiRequest("/logout", { method: "POST" }); } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/pages/register.html";
  });
}

// ========= Init =========
document.addEventListener("DOMContentLoaded", async () => {
  // default filter periode = bulan sekarang
  filterPeriod.value = nowPeriodYYYYMM();

  // load master data
  await loadCustomers(); // untuk dropdown tambah meter
  await loadMeters();    // untuk dropdown pilih meter + tabel meter
  await loadReadings();  // untuk tabel readings

  // set startRead awal
  syncStartRead();
});
