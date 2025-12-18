// /js/pembayaran_detail.js
const $ = (id) => document.getElementById(id);

const params = new URLSearchParams(location.search);
const billId = params.get("bill_id");
const method = (params.get("method") || sessionStorage.getItem("pay_method") || "midtrans").toLowerCase();

// Elements
const methodIcon = $("methodIcon");
const methodName = $("methodName");
const methodSubtitle = $("methodSubtitle");
const methodBody = $("methodBody");
const btnPayMidtrans = $("btnPayMidtrans");

// Summary elements
const s_nomor = $("s_nomor");
const s_nama = $("s_nama");
const s_periode = $("s_periode");
const s_total = $("s_total");
const s_status = $("s_status");

function formatRupiah(num) {
  const n = Number(num || 0);
  return "Rp " + n.toLocaleString("id-ID");
}

function setBadge(status) {
  const s = String(status || "").toLowerCase();
  s_status.textContent = status || "-";
  if (s === "paid" || s.includes("lunas")) s_status.className = "badge bg-success";
  else s_status.className = "badge bg-danger";
}

async function loadBill() {
  if (!billId) {
    alert("bill_id tidak ditemukan. Kembali ke tagihan.");
    window.location.href = "/pages/tagihan.html";
    return null;
  }

  const res = await apiRequest(`/bills/${billId}`);
  return res.data || res;
}

function renderSummary(bill) {
  const nomor = bill?.customer?.customer_no ?? `#${bill?.customer_id ?? "-"}`;
  const nama = bill?.customer?.user?.name ?? "-";
  const periode = bill?.period ?? "-";
  const total = bill?.total ?? 0;

  s_nomor.textContent = nomor;
  s_nama.textContent = nama;
  s_periode.textContent = periode;
  s_total.textContent = formatRupiah(total);
  setBadge(bill?.status);
}

function renderMethodUI(bill) {
  // Default hide/show button text
  btnPayMidtrans.style.display = "";
  btnPayMidtrans.disabled = false;

  if (method === "loket") {
    // ===== LOKET (OFFLINE) =====
    methodIcon.src = "/img/logo_tagihan.png";
    methodName.textContent = "Bayar Langsung (Loket PDAM)";
    methodSubtitle.textContent = "Tunjukkan kode referensi di bawah ini ke petugas loket.";

    const ref = bill?.invoice_no || `PDAM-${bill?.id ?? billId}-${bill?.period ?? ""}`;

    methodBody.innerHTML = `
      <div class="muted-small" style="margin-bottom:10px;">
        Anda memilih metode <b>offline</b>. Pembayaran dilakukan di loket PDAM terdekat.
      </div>

      <div class="summary-grid">
        <div class="label">Kode Referensi</div>
        <div class="value"><strong>${ref}</strong></div>

        <div class="label">Catatan</div>
        <div class="value">
          Status tagihan akan berubah menjadi <b>PAID</b> setelah petugas mengonfirmasi pembayaran.
        </div>
      </div>

      <div class="muted-small" style="margin-top:10px;">
        Simpan atau screenshot kode referensi di atas untuk memudahkan petugas.
      </div>
    `;

    // Tombol jadi "Selesai" -> halaman selesai (status=offline)
    btnPayMidtrans.textContent = "Selesai";
    btnPayMidtrans.onclick = () => {
      window.location.href = `/pages/selesai.html?bill_id=${encodeURIComponent(billId)}&status=offline`;
    };
    return;
  }

  // ===== MIDTRANS (ONLINE) =====
  methodIcon.src = "/img/logo_tagihan.png";
  methodName.textContent = "Pembayaran Online (Midtrans Sandbox)";
  methodSubtitle.textContent = "Pilih VA/QRIS/e-wallet di popup Midtrans, lalu selesaikan pembayaran.";

  methodBody.innerHTML = `
    <div class="muted-small" style="margin-bottom:10px;">
      Klik <b>Bayar Sekarang</b> untuk membuka popup Midtrans Sandbox.
    </div>
    <ul class="muted-small" style="margin:0; padding-left:18px;">
      <li>Metode pembayaran (VA/QRIS/e-wallet) dipilih di popup</li>
      <li>Gunakan ini untuk demo / tugas (sandbox)</li>
    </ul>
  `;

  // Jika tagihan sudah paid, disable bayar
  if (String(bill?.status || "").toLowerCase() === "paid") {
    btnPayMidtrans.textContent = "Sudah Lunas";
    btnPayMidtrans.disabled = true;
    btnPayMidtrans.onclick = null;
    return;
  }

  btnPayMidtrans.textContent = "Bayar Sekarang";
  btnPayMidtrans.onclick = () => startMidtransPay();
}

function startPollingStatus(orderId, billId) {
  // jangan sampai dobel polling
  if (window.__pdamPollTimer) clearInterval(window.__pdamPollTimer);

  const startedAt = Date.now();
  const MAX_MS = 2 * 60 * 1000; // 2 menit
  const INTERVAL_MS = 3000;

  window.__pdamPollTimer = setInterval(async () => {
    try {
      // timeout stop
      if (Date.now() - startedAt > MAX_MS) {
        clearInterval(window.__pdamPollTimer);
        window.__pdamPollTimer = null;
        console.warn("Polling stop: timeout");
        return;
      }

      const st = await apiRequest(`/payments/status/${encodeURIComponent(orderId)}`, { method: "GET" });
      const trx = st?.data?.transaction_status || st?.data?.data?.transaction_status;

      console.log("Midtrans status:", trx);

      // stop conditions
      if (trx === "settlement" || trx === "capture") {
        clearInterval(window.__pdamPollTimer);
        window.__pdamPollTimer = null;
        window.location.href = `/pages/selesai.html?bill_id=${encodeURIComponent(billId)}&status=success`;
        return;
      }

      if (trx === "expire" || trx === "cancel" || trx === "deny" || trx === "failure") {
        clearInterval(window.__pdamPollTimer);
        window.__pdamPollTimer = null;
        window.location.href = `/pages/selesai.html?bill_id=${encodeURIComponent(billId)}&status=failed`;
        return;
      }

      // kalau pending → lanjut polling
    } catch (e) {
      // kalau error jaringan sesekali, jangan langsung stop
      console.warn("Polling error:", e?.message || e);
    }
  }, INTERVAL_MS);
}

async function startMidtransPay() {
  try {
    const res = await apiRequest(`/payments/snap-token/${billId}`, { method: "POST" });

    const token = res?.data?.snap_token;
    const orderId = res?.data?.order_id;

    if (!token || !orderId) {
      alert("Snap token / order ID tidak ditemukan.");
      return;
    }

    // ✅ PANGGIL POLLING DI SINI (SEBELUM snap.pay)
    startPollingStatus(orderId, billId);

    // ✅ BUKA POPUP MIDTRANS
    window.snap.pay(token, {
      onSuccess: function () {
        console.log("Midtrans onSuccess (menunggu callback)");
      },
      onPending: function () {
        console.log("Midtrans pending");
      },
      onError: function () {
        alert("Pembayaran gagal.");
      }
    });
  } catch (err) {
    console.error(err);
    alert(err?.message || "Gagal memulai pembayaran Midtrans.");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const bill = await loadBill();
    if (!bill) return;

    renderSummary(bill);
    renderMethodUI(bill);
  } catch (e) {
    console.error(e);
    alert("Gagal memuat data pembayaran.");
  }
});
