const $ = (id) => document.getElementById(id);

const complaintTable = $("complaintTable");
const alertBox = $("alert");

const filterStatus = $("filterStatus");
const filterQ = $("filterQ");
const btnApply = $("btnApply");
const btnReset = $("btnReset");
const btnRefresh = $("btnRefresh");

const modalDetail = $("modalDetail");
const btnCloseDetail = $("btnCloseDetail");
const btnCancelDetail = $("btnCancelDetail");
const btnDelete = $("btnDelete");

const dCustomer = $("dCustomer");
const dStatus = $("dStatus");
const dHandler = $("dHandler");
const dSubject = $("dSubject");
const dDesc = $("dDesc");
const dType = $("dType");
const filterType = $("filterType");

const updateForm = $("updateForm");
const editId = $("editId");
const editStatus = $("editStatus");
const editNote = $("editNote");

let complaintsCache = [];
let currentId = null;

function showAlert(msg, type="error"){
  alertBox.classList.remove("hidden", "error", "success");
  alertBox.classList.add(type);
  alertBox.textContent = msg;
}
function hideAlert(){ alertBox.classList.add("hidden"); }
function showModal(el){ el.classList.remove("hidden"); }
function hideModal(el){ el.classList.add("hidden"); }

// ===== field mapper (biar kompatibel) =====
function getCustomerName(c){
  return c?.customer?.user?.name
    ?? c?.user?.name
    ?? (c?.user_id ? `User#${c.user_id}` : null)
    ?? (c?.customer_id ? `Customer#${c.customer_id}` : null)
    ?? "-";
}

function getHandlerName(c){
  // jika backend belum punya handler, tampilkan "-"
  return c?.handler?.name
    ?? c?.handled_by?.name
    ?? (c?.handled_by_user_id ? `User#${c.handled_by_user_id}` : "-");
}

function getComplaintTitle(c){
  // jika emergency: tidak ada title, pakai label tetap
  return c?.title
    ?? (c?.type === "emergency" ? "Panggilan Darurat" : "Pengaduan");
}

function getComplaintDesc(c){
  return c?.description
    ?? c?.message
    ?? "-";
}

function normalizeStatus(s){
  // support status lama (submitted) dan baru
  const v = String(s || "").toLowerCase();
  if (!v) return "new";
  if (v === "submitted") return "new";
  return v; // new, in_progress, resolved
}

async function loadComplaints(){
  complaintTable.innerHTML = `<tr><td colspan="7">Memuat...</td></tr>`;
  hideAlert();

  const qs = new URLSearchParams();
  if (filterStatus.value) qs.set("status", filterStatus.value);
  if (filterQ.value.trim()) qs.set("q", filterQ.value.trim());
  if (filterType.value) qs.set("type", filterType.value);

  try{
    const res = await apiRequest(`/complaints?${qs.toString()}`);
    const data = res.data || res;
    complaintsCache = Array.isArray(data) ? data : [];
    renderComplaints();
  }catch(err){
    console.error(err);
    showAlert(err?.message || "Gagal memuat pengaduan.");
    complaintTable.innerHTML = `<tr><td colspan="7">Gagal memuat data</td></tr>`;
  }
}

function statusBadge(s){
  const v = normalizeStatus(s);
  return `<span class="badge ${v}">${v}</span>`;
}

function renderComplaints(){
  if (!complaintsCache.length){
    complaintTable.innerHTML = `<tr><td colspan="7" class="muted">Tidak ada data</td></tr>`;
    return;
  }

  complaintTable.innerHTML = complaintsCache.map(c => {
    const created = (c.created_at || "").slice(0,10) || "-";
    const status = normalizeStatus(c.status);
    const typeLabel = c.type === "emergency" ? "Panggilan Darurat" : (c.type || "-");

    return `
      <tr>
        <td>${c.id}</td>
        <td>${getCustomerName(c)}</td>
        <td>${typeLabel}</td>
        <td>${getComplaintTitle(c)}</td>
        <td>${statusBadge(status)}</td>
        <td>${created}</td>
        <td>
          <div class="action-mini">
            <button class="btn-mini" onclick="openDetail(${c.id})">🔎</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

window.openDetail = function(id){
  currentId = id;
  const c = complaintsCache.find(x => Number(x.id) === Number(id));
  if (!c) return alert("Data tidak ditemukan.");

  dCustomer.textContent = getCustomerName(c);
  dStatus.textContent = normalizeStatus(c.status) || "-";

  // subject & desc tetap pakai UI yang sama
  dSubject.value = getComplaintTitle(c);
  dDesc.value = getComplaintDesc(c);
  dType.textContent = c.type || "-";

  editId.value = c.id;
  editStatus.value = normalizeStatus(c.status); // new/in_progress/resolved
  editNote.value = c.staff_note || ""; // kalau backend belum punya, tetap kosong

  showModal(modalDetail);
};

updateForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // payload minimal agar cocok ke backend baru
  const payload = { status: editStatus.value };

  // kalau backend kamu memang punya staff_note, boleh kirim
  if (editNote && String(editNote.value || "").trim() !== "") {
    payload.staff_note = editNote.value.trim();
  }

  try{
    await apiRequest(`/complaints/${editId.value}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });

    hideModal(modalDetail);
    await loadComplaints();
    showAlert("Pengaduan berhasil diperbarui.", "success");
  }catch(err){
    console.error(err);
    alert(err?.message || "Gagal update pengaduan.");
  }
});

btnDelete.addEventListener("click", async () => {
  if (!currentId) return;
  if (!confirm("Yakin ingin menghapus pengaduan ini?")) return;

  try{
    await apiRequest(`/complaints/${currentId}`, { method: "DELETE" });
    hideModal(modalDetail);
    await loadComplaints();
    showAlert("Pengaduan berhasil dihapus.", "success");
  }catch(err){
    alert(err?.message || "Gagal menghapus pengaduan. (Pastikan route DELETE ada)");
  }
});

btnCloseDetail.addEventListener("click", () => hideModal(modalDetail));
btnCancelDetail.addEventListener("click", () => hideModal(modalDetail));

btnApply.addEventListener("click", loadComplaints);
btnReset.addEventListener("click", () => {
  filterStatus.value = "";
  filterQ.value = "";
  loadComplaints();
  filterType.value = "";
});
btnRefresh.addEventListener("click", loadComplaints);

// logout
const btnLogout = $("btnLogout");
if (btnLogout){
  btnLogout.addEventListener("click", async () => {
    try { await apiRequest("/logout", { method: "POST" }); } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/pages/register.html";
  });
}

document.addEventListener("DOMContentLoaded", loadComplaints);
