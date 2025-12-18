// ==== yang tetap dipakai ====
const bulanList = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function yymmKey(y, mIndex) {
  const mm = String(mIndex + 1).padStart(2, '0');
  return `${y}-${mm}`;
}

function fillPeriodeOptions(readings, selBulan, selTahun) {
  const years = Array.from(new Set(Object.keys(readings).map(k => k.slice(0,4)))).sort();
  selTahun.innerHTML = years.length
    ? years.map(y => `<option value="${y}">${y}</option>`).join('')
    : `<option value="${new Date().getFullYear()}">${new Date().getFullYear()}</option>`;

  selBulan.innerHTML = bulanList.map((b,i) => `<option value="${i}">${b}</option>`).join('');
}

function renderResult(pel, y, mIndex) {
  document.getElementById('vNama').textContent = pel.nama ?? '-';
  document.getElementById('vNomor').textContent = pel.nomor ?? '-';
  document.getElementById('vAlamat').textContent = pel.alamat ?? '-';

  const key = yymmKey(y, mIndex);
  const data = pel.readings?.[key];

  document.getElementById('vPeriode').textContent = `${bulanList[mIndex]} ${y}`;

  if (data) {
    document.getElementById('vMeter').textContent = Number(data.angka ?? 0).toLocaleString('id-ID');
    document.getElementById('vKubik').textContent = `${Number(data.kubik ?? 0).toLocaleString('id-ID')} m³`;
  } else {
    document.getElementById('vMeter').textContent = '-';
    document.getElementById('vKubik').textContent = 'Data belum tersedia';
  }
}

// ==== baru: ambil data dari backend ====
async function fetchMeterStatus(nomor){
  // apiRequest sudah dipakai di page lain, jadi kita pakai yang sama
  // endpoint backend: GET /api/meter-status/{customerNo}
  const res = await apiRequest(`/meter-status/${encodeURIComponent(nomor)}`);
  const data = res.data || res; // support wrapper
  return data; // { nama, nomor, alamat, readings: {...} }
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nomor = inpNomor.value.trim();

    try{
      const raw = await fetchMeterStatus(nomor);

      // bentuk object pel agar sama dengan struktur lama
      const pel = {
        nama: raw?.nama ?? '-',
        nomor: raw?.nomor ?? nomor,
        alamat: raw?.alamat ?? '-',
        readings: raw?.readings ?? {}
      };

      if (!pel || !pel.nomor){
        hasilWrap.style.display = 'none';
        notFound.style.display = 'block';
        return;
      }

      notFound.style.display = 'none';
      hasilWrap.style.display = '';

      fillPeriodeOptions(pel.readings, selBulan, selTahun);

      const keys = Object.keys(pel.readings).sort();
      if (keys.length){
        const last = keys[keys.length - 1];
        const defY = last.slice(0,4);
        const defM = parseInt(last.slice(5,7), 10) - 1;

        selTahun.value = defY;
        selBulan.value = String(defM);

        renderResult(pel, selTahun.value, parseInt(selBulan.value,10));
      } else {
        // tidak ada data reading
        selTahun.value = String(new Date().getFullYear());
        selBulan.value = String(new Date().getMonth());
        renderResult(pel, selTahun.value, parseInt(selBulan.value,10));
      }

      const onChange = () => renderResult(pel, selTahun.value, parseInt(selBulan.value,10));
      selBulan.onchange = onChange;
      selTahun.onchange = onChange;

    }catch(err){
      // 404 = nomor tidak ditemukan
      hasilWrap.style.display = 'none';
      notFound.style.display = 'block';
      console.error(err);
    }
  });
});
