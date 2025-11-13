(function populateSelects() {
  const bulanEl = document.getElementById("inpBulan");
  const tahunEl = document.getElementById("inpTahun");
  if (!bulanEl || !tahunEl) return;

  const bulanNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"
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
    opt.value = String(y);
    opt.textContent = String(y);
    tahunEl.appendChild(opt);
  }

  bulanEl.value = String(now.getMonth() + 1).padStart(2, "0");
  tahunEl.value = String(tahunNow);
})();

document.getElementById("cekForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const nomor = document.getElementById("inpNomor").value.trim();
  const bulan = document.getElementById("inpBulan").value;
  const tahun = document.getElementById("inpTahun").value;

  if (!nomor || !bulan || !tahun) {
    alert("Mohon lengkapi semua field.");
    return;
  }

  const total = "Rp " + (Math.floor(Math.random() * 80) + 20) * 1000 + ".000";

  const data = {
    nomor: nomor,
    nama: "Pelanggan PDAM",
    periode: `${bulan}-${tahun}`,
    total: total,
    status: "BELUM LUNAS"
  };

  localStorage.setItem("pdam_bill_preview", JSON.stringify(data));
  window.location.href = "/pages/pembayaran.html";
});
