const DATA_METER = {
  'D102345': {
    nama: 'Budi Santoso',
    alamat: 'Jl. Laende No. 12, Kab. Muna',
    readings: {
      '2025-01': { angka: 1234, kubik: 18 },
      '2025-02': { angka: 1258, kubik: 24 },
      '2025-03': { angka: 1286, kubik: 28 },
    }
  },
  'D998877': {
    nama: 'Siti Rahma',
    alamat: 'Jl. Pahlawan No. 45, Kab. Muna',
    readings: {
      '2025-02': { angka: 220, kubik: 12 },
      '2025-03': { angka: 240, kubik: 20 },
    }
  }
};

const bulanList = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function yymmKey(y, mIndex) {
  const mm = String(mIndex + 1).padStart(2, '0');
  return `${y}-${mm}`;
}

function fillPeriodeOptions(readings, selBulan, selTahun) {
  const years = Array.from(new Set(Object.keys(readings).map(k => k.slice(0,4)))).sort();
  selTahun.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');

  selBulan.innerHTML = bulanList.map((b,i) => `<option value="${i}">${b}</option>`).join('');
}

function renderResult(pel, y, mIndex) {
  document.getElementById('vNama').textContent = pel.nama;
  document.getElementById('vNomor').textContent = pel.nomor;
  document.getElementById('vAlamat').textContent = pel.alamat;

  const key = yymmKey(y, mIndex);
  const data = pel.readings[key];

  document.getElementById('vPeriode').textContent = `${bulanList[mIndex]} ${y}`;

  if (data) {
    document.getElementById('vMeter').textContent = data.angka.toLocaleString('id-ID');
    document.getElementById('vKubik').textContent = `${data.kubik.toLocaleString('id-ID')} m³`;
  } else {
    document.getElementById('vMeter').textContent = '-';
    document.getElementById('vKubik').textContent = 'Data belum tersedia';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formCari');
  const inpNomor = document.getElementById('inpNomor');
  const notFound = document.getElementById('notFound');
  const hasilWrap = document.getElementById('hasilWrap');
  const selBulan = document.getElementById('selBulan');
  const selTahun = document.getElementById('selTahun');

  if (typeof initDropdowns === 'function') {
    initDropdowns();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nomor = inpNomor.value.trim();

    const raw = DATA_METER[nomor];
    if (!raw) {
      hasilWrap.style.display = 'none';
      notFound.style.display = 'block';
      return;
    }

    const pel = { ...raw, nomor };

    notFound.style.display = 'none';
    hasilWrap.style.display = '';

    fillPeriodeOptions(pel.readings, selBulan, selTahun);

    const keys = Object.keys(pel.readings).sort();
    const last = keys[keys.length - 1];
    const defY = last.slice(0,4);
    const defM = parseInt(last.slice(5,7), 10) - 1;

    selTahun.value = defY;
    selBulan.value = String(defM);

    renderResult(pel, selTahun.value, parseInt(selBulan.value,10));

    const onChange = () => renderResult(pel, selTahun.value, parseInt(selBulan.value,10));
    selBulan.onchange = onChange;
    selTahun.onchange = onChange;
  });
});
