function loadBill() {
  const rawA = localStorage.getItem("pdam_bill_demo");
  const rawB = localStorage.getItem("pdam_bill_preview");
  const raw = rawA || rawB;
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function fillSummary(data) {
  if (!data) {
    return;
  }
  document.getElementById("s_nomor").textContent = data.nomor || "-";
  document.getElementById("s_nama").textContent = data.nama || "-";
  document.getElementById("s_periode").textContent = data.periode || "-";
  document.getElementById("s_total").textContent = data.total || "-";

  const s = document.getElementById("s_status");
  s.textContent = data.status || "-";
  if ((data.status || "").toLowerCase().includes("lunas")) {
    s.className = "badge bg-success";
  } else {
    s.className = "badge bg-danger";
  }
}

function openQR() {
  const modal = document.getElementById("qrModal");
  if (!modal) {
    return;
  }
  modal.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeQR() {
  const modal = document.getElementById("qrModal");
  if (!modal) {
    return;
  }
  modal.classList.remove("is-open");
  document.body.style.overflow = "";
}

function copyAcc() {
  const acc = document.getElementById("acc")?.textContent || "";
  if (!acc) {
    alert("Nomor rekening tidak ditemukan.");
    return;
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(acc)
      .then(() => alert("Nomor rekening disalin: " + acc))
      .catch(() => alert("Tidak dapat menyalin"));
  } else {
    const ta = document.createElement("textarea");
    ta.value = acc;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      alert("Nomor rekening disalin: " + acc);
    } catch (e) {
      alert("Tidak dapat menyalin");
    }
    document.body.removeChild(ta);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const bill = loadBill();
  if (bill) {
    fillSummary(bill);
  }

  const btnShowQR = document.getElementById("btnShowQR");
  const btnCopyAcc = document.getElementById("btnCopyAcc");
  const qrClose = document.getElementById("qrClose");

  if (btnShowQR) {
    btnShowQR.addEventListener("click", openQR);
  }
  if (qrClose) {
    qrClose.addEventListener("click", closeQR);
  }
  if (btnCopyAcc) {
    btnCopyAcc.addEventListener("click", copyAcc);
  }
});
