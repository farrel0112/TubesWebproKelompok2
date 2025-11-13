function loadBill() {
  const rawA = localStorage.getItem("pdam_bill_demo");
  const rawB = localStorage.getItem("pdam_bill_preview");
  const raw = rawA || rawB;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function fillSummary(data) {
  if (!data) return;
  document.getElementById("s_nomor").textContent = data.nomor || "-";
  document.getElementById("s_nama").textContent = data.nama || "-";
  document.getElementById("s_periode").textContent = data.periode || "-";
  document.getElementById("s_total").textContent = data.total || "-";
}

document.addEventListener("DOMContentLoaded", function () {
  const bill = loadBill();
  if (bill) {
    fillSummary(bill);
  }
});
