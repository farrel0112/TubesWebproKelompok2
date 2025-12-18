// public/js/pembayaran.js
const $ = (id) => document.getElementById(id);

const params = new URLSearchParams(location.search);
const billId = params.get("bill_id");

function setBadge(el, status) {
  const s = String(status || "").toLowerCase();
  el.textContent = status || "-";
  if (s === "paid" || s.includes("lunas")) el.className = "badge bg-success";
  else el.className = "badge bg-danger";
}

function formatRupiah(num) {
  const n = Number(num || 0);
  return "Rp " + n.toLocaleString("id-ID");
}

async function loadBillSummary() {
  if (!billId) {
    alert("bill_id tidak ditemukan. Kembali ke halaman tagihan.");
    window.location.href = "/pages/tagihan.html";
    return;
  }

  const res = await apiRequest(`/bills/${billId}`);
  const bill = res.data || res;

  const nomor = bill?.customer?.customer_no ?? `#${bill?.customer_id ?? "-"}`;
  const nama = bill?.customer?.user?.name ?? "-";
  const periode = bill?.period ?? "-";
  const total = bill?.total ?? 0;

  $("s_nomor").textContent = nomor;
  $("s_nama").textContent = nama;
  $("s_periode").textContent = periode;
  $("s_total").textContent = formatRupiah(total);
  setBadge($("s_status"), bill?.status);
}

function setupMethodCards() {
  document.querySelectorAll(".method-card[data-method]").forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      const method = card.getAttribute("data-method");
      if (!billId) return alert("bill_id tidak ditemukan.");

      // simpan pilihan method (optional)
      sessionStorage.setItem("pay_method", method);

      // ke detail, bawa bill_id + method
      window.location.href =
        `/pages/pembayaran_detail.html?bill_id=${encodeURIComponent(billId)}&method=${encodeURIComponent(method)}`;
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadBillSummary();
  setupMethodCards();
});
