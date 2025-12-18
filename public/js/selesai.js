// /js/selesai.js
const $ = (id) => document.getElementById(id);

const params = new URLSearchParams(location.search);
const status = (params.get("status") || "success").toLowerCase();
const billId = params.get("bill_id");

const statusTitle = $("statusTitle");
const statusDesc  = $("statusDesc");
const statusIcon  = $("statusIcon");

const s_nomor = $("s_nomor");
const s_nama  = $("s_nama");
const s_periode = $("s_periode");
const s_total = $("s_total");

function formatRupiah(num) {
  const n = Number(num || 0);
  return "Rp " + n.toLocaleString("id-ID");
}

function renderStatus() {
  if (status === "success") {
    statusIcon.className = "fa-solid fa-circle-check";
    statusIcon.style.color = "#198754";
    statusTitle.textContent = "Pembayaran Berhasil!";
    statusDesc.innerHTML =
      `Terima kasih telah melakukan pembayaran tagihan PDAM.<br/>
      Transaksi Anda telah kami terima.`;
  } else if (status === "pending") {
    statusIcon.className = "fa-solid fa-clock";
    statusIcon.style.color = "#ffc107";
    statusTitle.textContent = "Menunggu Pembayaran";
    statusDesc.textContent =
      "Pembayaran Anda masih menunggu penyelesaian. Silakan selesaikan sesuai instruksi di Midtrans.";
  } else if (status === "offline") {
    statusIcon.className = "fa-solid fa-store";
    statusIcon.style.color = "#0d6efd";
    statusTitle.textContent = "Bayar di Loket PDAM";
    statusDesc.textContent =
      "Silakan datang ke loket PDAM terdekat dan tunjukkan kode referensi/invoice kepada petugas.";
  } else {
    statusIcon.className = "fa-solid fa-circle-info";
    statusIcon.style.color = "#6c757d";
    statusTitle.textContent = "Status Pembayaran";
    statusDesc.textContent = "-";
  }
}

async function loadBillSummary() {
  if (!billId) return;

  try {
    const res = await apiRequest(`/bills/${billId}`);
    const bill = res.data || res;

    s_nomor.textContent = bill?.customer?.customer_no ?? `#${bill?.customer_id ?? "-"}`;
    s_nama.textContent  = bill?.customer?.user?.name ?? "-";
    s_periode.textContent = bill?.period ?? "-";
    s_total.textContent = formatRupiah(bill?.total ?? 0);
  } catch (e) {
    console.error(e);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  renderStatus();
  await loadBillSummary();
});
