// /js/tagihan.js

// =======================
// POPULATE SELECT BULAN & TAHUN (tetap seperti kamu)
// =======================
(function populateSelects() {
  const bulanEl = document.getElementById("inpBulan");
  const tahunEl = document.getElementById("inpTahun");
  if (!bulanEl || !tahunEl) return;

  const bulanNames = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"
  ];

  bulanNames.forEach((name, i) => {
    const opt = document.createElement("option");
    opt.value = String(i + 1).padStart(2, "0");
    opt.textContent = name;
    bulanEl.appendChild(opt);
  });

  const now = new Date();
  const tahunNow = now.getFullYear();
  for (let y = tahunNow; y >= tahunNow - 5; y--) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    tahunEl.appendChild(opt);
  }

  bulanEl.value = String(now.getMonth() + 1).padStart(2, "0");
  tahunEl.value = tahunNow;
})();


// =======================
// Helpers
// =======================
function formatRupiah(num) {
  const n = Number(num || 0);
  return "Rp " + n.toLocaleString("id-ID");
}

// fallback param: period atau periode (biar aman sesuai backend kamu)
async function fetchBillsByPeriod(periodeYYYYMM) {
  // 1) coba param period
  try {
    const res1 = await apiRequest(`/tagihan?period=${encodeURIComponent(periodeYYYYMM)}`, { method: "GET" });
    return res1.data || res1;
  } catch (e1) {
    // 2) coba param periode (punya code kamu)
    const res2 = await apiRequest(`/tagihan?periode=${encodeURIComponent(periodeYYYYMM)}`, { method: "GET" });
    return res2.data || res2;
  }
}

function pickOneBill(arr) {
  if (!Array.isArray(arr)) return null;
  // kalau ada unpaid, pilih unpaid dulu
  const unpaid = arr.find(b => String(b?.status || "").toLowerCase() === "unpaid");
  return unpaid || arr[0] || null;
}


// =======================
// CEK TAGIHAN REAL MENGGUNAKAN API
// =======================
document.getElementById("cekForm")?.addEventListener("submit", async function (e) {
  e.preventDefault();

  const bulan = document.getElementById("inpBulan")?.value;
  const tahun = document.getElementById("inpTahun")?.value;
  const periode = `${tahun}${bulan}`; // format: 202512

  const box = document.getElementById("hasilTagihan");
  const btnBayar = document.getElementById("btnBayar");

  // reset tampilan
  if (box) box.style.display = "none";
  if (btnBayar) btnBayar.style.display = "none";

  try {
    const bills = await fetchBillsByPeriod(periode);

    if (!Array.isArray(bills) || bills.length === 0) {
      alert("Tagihan untuk periode ini tidak ditemukan.");
      return;
    }

    // simpan list ke sessionStorage supaya pembayaran.html bisa render list (sesuai request kamu)
    sessionStorage.setItem("pdam_bills_preview", JSON.stringify(bills));
    sessionStorage.setItem("pdam_period_preview", periode);

    const bill = pickOneBill(bills);
    tampilkanHasil(bill, bills);

  } catch (err) {
    console.error(err);

    // Ini mengurangi kasus “alert muncul dulu tapi data tetap muncul”
    // karena biasanya penyebabnya mismatch param / auth.
    alert("Gagal mengambil data tagihan. Pastikan Anda sudah login dan koneksi aman.");
  }
});


// =======================
// TAMPILKAN HASIL KE HTML (ringkas)
// =======================
function tampilkanHasil(bill, bills) {
  document.getElementById("resNama").textContent = bill?.customer?.user?.name || "Tidak tersedia";
  document.getElementById("resNomor").textContent = bill?.customer?.customer_no || "-";
  document.getElementById("resPeriode").textContent = bill?.period || "-";
  document.getElementById("resTotal").textContent = formatRupiah(bill?.total);
  document.getElementById("resStatus").textContent = String(bill?.status || "-").toUpperCase();

  const box = document.getElementById("hasilTagihan");
  box.style.display = "block";

  // tombol Bayar:
  // agar list tidak muncul lagi di tagihan.html, kita arahkan ke pembayaran.html dan biarkan pembayaran.html yang menampilkan list
  const btnBayar = document.getElementById("btnBayar");
  if (!btnBayar) return;

  btnBayar.style.display = "inline-block";
  btnBayar.onclick = () => {
    // simpan bill terpilih (untuk summary) + redirect bawa bill_id
    sessionStorage.setItem("pdam_bill_selected", JSON.stringify(bill));
    window.location.href = `/pages/pembayaran.html?bill_id=${encodeURIComponent(bill.id)}&period=${encodeURIComponent(bill.period || "")}`;
  };
}
