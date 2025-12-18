const $ = (id) => document.getElementById(id);

const billTable = $("billTable");
const alertBox = $("alert");

// filters
const filterPeriod = $("filterPeriod");
const filterStatus = $("filterStatus");
const filterName = $("filterName");
const btnApply = $("btnApply");
const btnReset = $("btnReset");
const btnRefresh = $("btnRefresh");

// generate modal
const modalGenerate = $("modalGenerate");
const btnOpenGenerate = $("btnOpenGenerate");
const btnCloseGenerate = $("btnCloseGenerate");
const btnCancelGenerate = $("btnCancelGenerate");
const generateForm = $("generateForm");
const genPeriod = $("genPeriod");
const genNote = $("genNote"); // sekarang ada di HTML
const genReadingId = $("genReadingId");

// edit modal
const modalEdit = $("modalEdit");
const btnCloseEdit = $("btnCloseEdit");
const btnCancelEdit = $("btnCancelEdit");
const editForm = $("editForm");
const editId = $("editId");
const editStatus = $("editStatus");
const editDueDate = $("editDueDate");
const editTotal = $("editTotal");

// ===== OFFLINE PAY MODAL (pegawai) =====
const modalOfflinePay = $("modalOfflinePay");
const btnCloseOfflinePay = $("btnCloseOfflinePay");
const btnCancelOfflinePay = $("btnCancelOfflinePay");
const offlinePayForm = $("offlinePayForm");
const offlineBillId = $("offlineBillId");
const offlinePaidAt = $("offlinePaidAt");
const offlineReceiptNo = $("offlineReceiptNo");
const offlineNote = $("offlineNote");

// state
let billsCache = [];

function showAlert(msg, type="error"){
  alertBox.classList.remove("hidden", "error", "success");
  alertBox.classList.add(type);
  alertBox.textContent = msg;
}
function hideAlert(){ alertBox.classList.add("hidden"); }

function showModal(el){ el.classList.remove("hidden"); }
function hideModal(el){ el.classList.add("hidden"); }

function nowPeriodYYYYMM(){
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}`;
}
function toDateInputValue(dateStr){
  return (dateStr || "").toString().slice(0,10);
}
function toDatetimeLocalValue(date){
  // YYYY-MM-DDTHH:MM
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getCustomerNameFromBill(b){
  return b?.customer?.user?.name
    ?? b?.user?.name
    ?? b?.customer_name
    ?? "-";
}

function getBillPeriod(b){
  return String(b?.period ?? b?.billing_period ?? b?.bill_period ?? "").trim();
}

function getBillStatus(b){
  return String(b?.status ?? "unpaid").toLowerCase();
}

function getBillTotal(b){
  const v = b?.total_amount ?? b?.amount ?? b?.total ?? 0;
  return Number(v || 0);
}

function getBillUsage(b){
  const v = b?.usage_m3 ?? b?.kubikasi ?? b?.volume ?? b?.usage ?? null;
  return v === null || v === undefined ? "-" : Number(v);
}

function getBillDueDate(b){
  return b?.due_date ?? b?.dueDate ?? null;
}

function formatRupiah(n){
  const num = Number(n || 0);
  return "Rp " + num.toLocaleString("id-ID");
}

async function loadBills(){
  billTable.innerHTML = `<tr><td colspan="8">Memuat...</td></tr>`;
  hideAlert();

  try{
    const res = await apiRequest("/bills");
    const data = res.data || res;
    billsCache = Array.isArray(data) ? data : [];
    renderBills();
  }catch(err){
    console.error(err);
    billTable.innerHTML = `<tr><td colspan="8">Gagal memuat data</td></tr>`;
    showAlert(err?.message || "Gagal memuat tagihan.", "error");
  }
}

async function loadReadingsForGenerate(periodValue=""){
  const res = await apiRequest("/meter-readings");
  const data = res.data || res;
  let readings = Array.isArray(data) ? data : [];

  const p = String(periodValue || "").trim();
  if (p) readings = readings.filter(r => String(r.period || "") === p);

  if (!readings.length){
    genReadingId.innerHTML = `<option value="">(Tidak ada pembacaan untuk periode ini)</option>`;
    return;
  }

  genReadingId.innerHTML = readings.map(r => `
    <option value="${r.id}">
      Reading #${r.id} — Meter ${r.meter_id} — ${r.start_read}→${r.end_read} — ${r.period}
    </option>
  `).join("");
}

function renderBills(){
  const p = (filterPeriod.value || "").trim();
  const s = (filterStatus.value || "").trim().toLowerCase();
  const q = (filterName.value || "").trim().toLowerCase();

  let rows = billsCache.slice();

  if (p) rows = rows.filter(b => getBillPeriod(b).includes(p));
  if (s) rows = rows.filter(b => getBillStatus(b) === s);
  if (q) rows = rows.filter(b => getCustomerNameFromBill(b).toLowerCase().includes(q));

  if (!rows.length){
    billTable.innerHTML = `<tr><td colspan="8" class="muted">Tidak ada data</td></tr>`;
    return;
  }

  rows.sort((a,b) => {
    const pa = getBillPeriod(a);
    const pb = getBillPeriod(b);
    if (pb !== pa) return pb.localeCompare(pa);
    return Number(b.id) - Number(a.id);
  });

  billTable.innerHTML = rows.map(b => {
    const status = getBillStatus(b);
    const due = getBillDueDate(b);

    // tombol ✅ hanya jika belum paid
    const offlineBtn = status !== "paid"
      ? `<button class="btn-mini" title="Tandai Lunas (Offline)" onclick="openOfflinePay(${b.id})">✅</button>`
      : "";

    return `
      <tr>
        <td>${b.id}</td>
        <td>${getCustomerNameFromBill(b)}</td>
        <td>${getBillPeriod(b) || "-"}</td>
        <td>${getBillUsage(b)}</td>
        <td>${formatRupiah(getBillTotal(b))}</td>
        <td><span class="badge ${status}">${status}</span></td>
        <td>${due ? toDateInputValue(due) : "-"}</td>
        <td>
          <div class="action-mini">
            <button class="btn-mini" title="Invoice" onclick="openInvoice(${b.id})">🧾</button>
            <button class="btn-mini" title="Edit" onclick="openEdit(${b.id})">✏️</button>
            ${offlineBtn}
            <button class="btn-mini" title="Hapus" onclick="deleteBill(${b.id})">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// ===== Invoice (tetap)
window.openInvoice = async function(id){
  try{
    const token = localStorage.getItem("token");
    const resp = await fetch(`/api/bills/${id}/invoice`, {
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    });

    if (!resp.ok){
      let msg = "Gagal membuka invoice.";
      try{
        const j = await resp.json();
        msg = j.message || msg;
      }catch{}
      alert(msg);
      return;
    }

    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }catch(e){
    console.error(e);
    alert("Gagal membuka invoice.");
  }
};

// ===== Edit bill (tetap)
window.openEdit = async function(id){
  const b = billsCache.find(x => Number(x.id) === Number(id));
  if (!b) return alert("Data tagihan tidak ditemukan.");

  editId.value = b.id;
  editStatus.value = getBillStatus(b);

  const due = getBillDueDate(b);
  editDueDate.value = due ? toDateInputValue(due) : "";

  editTotal.value = getBillTotal(b);

  showModal(modalEdit);
};

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = { status: editStatus.value };
  if (editDueDate.value) payload.due_date = editDueDate.value;
  if (String(editTotal.value || "").trim() !== "") payload.total_amount = Number(editTotal.value);

  try{
    await apiRequest(`/bills/${editId.value}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });

    hideModal(modalEdit);
    await loadBills();
    showAlert("Tagihan berhasil diperbarui.", "success");
  }catch(err){
    console.error(err);
    alert(err?.message || "Gagal update tagihan. (Cek field yang diizinkan backend)");
  }
});

btnCloseEdit.addEventListener("click", () => hideModal(modalEdit));
btnCancelEdit.addEventListener("click", () => hideModal(modalEdit));

// ===== Delete bill (tetap)
window.deleteBill = async function(id){
  if (!confirm("Yakin ingin menghapus tagihan ini?")) return;

  try{
    await apiRequest(`/bills/${id}`, { method: "DELETE" });
    await loadBills();
    showAlert("Tagihan berhasil dihapus.", "success");
  }catch(err){
    console.error(err);
    alert(err?.message || "Gagal menghapus tagihan.");
  }
};

// ===== Generate bills (tetap)
btnOpenGenerate.addEventListener("click", async () => {
  genPeriod.value = nowPeriodYYYYMM();
  if (genNote) genNote.value = "";
  await loadReadingsForGenerate(genPeriod.value);
  showModal(modalGenerate);
});

genPeriod.addEventListener("input", async () => {
  await loadReadingsForGenerate(genPeriod.value);
});

btnCloseGenerate.addEventListener("click", () => hideModal(modalGenerate));
btnCancelGenerate.addEventListener("click", () => hideModal(modalGenerate));

generateForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    reading_id: Number(genReadingId.value)
    // note: kalau backend belum dukung, jangan kirim agar aman
  };

  if (!payload.reading_id){
    alert("Pilih pembacaan meter dulu (reading).");
    return;
  }

  try{
    await apiRequest("/bills/generate", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    hideModal(modalGenerate);
    await loadBills();
    showAlert("Generate tagihan berhasil.", "success");
  }catch(err){
    console.error(err);
    alert(err?.message || "Gagal generate tagihan.");
  }
});

// ===== OFFLINE PAY (baru) =====
window.openOfflinePay = function(id){
  const b = billsCache.find(x => Number(x.id) === Number(id));
  if (!b) return alert("Tagihan tidak ditemukan.");

  offlineBillId.value = b.id;
  offlinePaidAt.value = toDatetimeLocalValue(new Date());
  offlineReceiptNo.value = "";
  offlineNote.value = "";

  showModal(modalOfflinePay);
};

btnCloseOfflinePay.addEventListener("click", () => hideModal(modalOfflinePay));
btnCancelOfflinePay.addEventListener("click", () => hideModal(modalOfflinePay));

offlinePayForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = offlineBillId.value;
  if (!id) return;

  const payload = {
    paid_at: offlinePaidAt.value ? new Date(offlinePaidAt.value).toISOString() : new Date().toISOString(),
    receipt_no: (offlineReceiptNo.value || "").trim() || null,
    note: (offlineNote.value || "").trim() || null
  };

  try{
    // endpoint pegawai (pastikan ada di backend)
    await apiRequest(`/bills/${id}/mark-paid`, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    hideModal(modalOfflinePay);
    await loadBills();
    showAlert("Pembayaran offline berhasil dikonfirmasi. Invoice sekarang akan punya paid_at.", "success");

    // opsional: langsung buka invoice
    // await openInvoice(id);

  }catch(err){
    console.error(err);
    alert(err?.message || "Gagal mengkonfirmasi pembayaran offline. (Cek route/middleware pegawai)");
  }
});

// ===== Filters (tetap)
btnApply.addEventListener("click", renderBills);
btnReset.addEventListener("click", () => {
  filterPeriod.value = "";
  filterStatus.value = "";
  filterName.value = "";
  renderBills();
});
btnRefresh.addEventListener("click", loadBills);

// ===== Logout (tetap)
const btnLogout = $("btnLogout");
if (btnLogout){
  btnLogout.addEventListener("click", async () => {
    try { await apiRequest("/logout", { method: "POST" }); } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/pages/register.html";
  });
}

// init
document.addEventListener("DOMContentLoaded", async () => {
  filterPeriod.value = nowPeriodYYYYMM();
  await loadBills();
});
