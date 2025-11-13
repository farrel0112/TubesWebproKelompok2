function getParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

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
  if (!modal) return;
  modal.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeQR() {
  const modal = document.getElementById("qrModal");
  if (!modal) return;
  modal.classList.remove("is-open");
  document.body.style.overflow = "";
}

function copyText(text) {
  if (!text) {
    alert("Teks kosong.");
    return;
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => alert("Disalin: " + text))
      .catch(() => alert("Tidak dapat menyalin"));
  } else {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      alert("Disalin: " + text);
    } catch (e) {
      alert("Tidak dapat menyalin");
    }
    document.body.removeChild(ta);
  }
}

function renderMethod(method) {
  const icon = document.getElementById("methodIcon");
  const name = document.getElementById("methodName");
  const subtitle = document.getElementById("methodSubtitle");
  const body = document.getElementById("methodBody");

  if (!icon || !name || !subtitle || !body) return;

  if (method === "bank") {
    icon.src = "/img/logo_bank.png";
    name.textContent = "BANK BCA";
    subtitle.textContent = "Transfer ke rekening perusahaan";
    body.innerHTML = `
      <div class="bank-rows">
        <div class="label">Nomor Rekening</div>
        <div class="value"><strong id="acc">878037557289</strong></div>
        <div class="label">Nama Rekening</div>
        <div class="value">PERUMDA TIRTA SUGI LAENDE</div>
        <div class="label">Catatan</div>
        <div class="value">Cantumkan nomor pelanggan pada berita transfer.</div>
      </div>
      <div class="qris-actions">
        <button type="button" class="btn btn-outline-secondary" id="btnCopyAcc">Salin Nomor Rekening</button>
      </div>
    `;
  } else if (method === "qris") {
    icon.src = "/img/qris.png";
    name.textContent = "QRIS";
    subtitle.textContent = "Scan QR untuk bayar cepat";
    body.innerHTML = `
      <div class="qris-box">
        <i class="fa-solid fa-qrcode"></i>
        <div>Tekan tombol untuk melihat QR, lalu scan melalui aplikasi pembayaran Anda.</div>
      </div>
      <div class="qris-actions">
        <button type="button" class="btn btn-outline-secondary" id="btnShowQR">Lihat QR</button>
      </div>
    `;
  } else {
    icon.src = "/img/logo_tagihan.png";
    name.textContent = "Bayar Langsung";
    subtitle.textContent = "Pembayaran di loket PDAM terdekat";
    body.innerHTML = `
      <div class="loket-info">
        <div>Bawa nomor pelanggan Anda dan informasikan kepada petugas.</div>
        <div>Jam layanan loket: 08:00–16:00 (Senin–Jumat).</div>
      </div>
    `;
  }

  const btnCopyAcc = document.getElementById("btnCopyAcc");
  if (btnCopyAcc) {
    btnCopyAcc.addEventListener("click", () => {
      const acc = document.getElementById("acc")?.textContent || "";
      copyText(acc);
    });
  }

  const btnShowQR = document.getElementById("btnShowQR");
  if (btnShowQR) {
    btnShowQR.addEventListener("click", openQR);
  }
}

function finishPayment() {
  const rawA = localStorage.getItem("pdam_bill_demo");
  const rawB = localStorage.getItem("pdam_bill_preview");
  const raw = rawA || rawB;

  if (raw) {
    try {
      const bill = JSON.parse(raw);
      bill.status = "LUNAS";
      localStorage.setItem("pdam_bill_demo", JSON.stringify(bill));
    } catch (e) {
    }
  }

  window.location.href = "selesai.html";
}

document.addEventListener("DOMContentLoaded", function () {
  const bill = loadBill();
  if (bill) {
    fillSummary(bill);
  }

  const m = (getParam("m") || "bank").toLowerCase();
  renderMethod(m);

  const qrClose = document.getElementById("qrClose");
  if (qrClose) {
    qrClose.addEventListener("click", closeQR);
  }

  const btnFinish = document.getElementById("btnFinish");
  if (btnFinish) {
    btnFinish.addEventListener("click", finishPayment);
  }
});
