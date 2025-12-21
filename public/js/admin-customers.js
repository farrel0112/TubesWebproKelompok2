const table = document.getElementById("customerTable");
const modal = document.getElementById("modal");
const form = document.getElementById("customerForm");

const btnAdd = document.getElementById("btnAdd");
const btnCancel = document.getElementById("btnCancel");

const inputId = document.getElementById("customerId");
const inputName = document.getElementById("name");
const inputAddress = document.getElementById("address");
const inputStatus = document.getElementById("status");

function formatAddress(c){
  const parts = [
    c.address,
    c.city,
    c.province,
    c.postal_code ? `(${c.postal_code})` : null
  ].filter(Boolean);

  return parts.join(", ");
}

/* Load customers */
async function loadCustomers(){
  table.innerHTML = `<tr><td colspan="5">Memuat...</td></tr>`;
  try{
    const res = await apiRequest("/customers");
    const data = res.data || res;

    if(data.length === 0){
      table.innerHTML = `<tr><td colspan="5">Belum ada data</td></tr>`;
      return;
    }

    table.innerHTML = data.map(c => `
      <tr>
        <td>${c.customer_no ?? "-"}</td>
        <td>${c.user?.name ?? "-"}</td>
        <td>${formatAddress(c)}</td>
        <td>
          <span class="badge ${c.status}">
            ${c.status === "active" ? "Aktif" : "Nonaktif"}
          </span>
        </td>
        <td>
          <button onclick="editCustomer(${c.id})">✏️</button>
          <button onclick="deleteCustomer(${c.id})">🗑️</button>
        </td>
      </tr>
    `).join("");

  }catch(e){
    table.innerHTML = `<tr><td colspan="5">Gagal memuat data</td></tr>`;
  }
}

/* Add */
btnAdd.onclick = () => {
  form.reset();
  inputId.value = "";
  modal.classList.remove("hidden");
};

const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      try {
        await apiRequest("/logout", { method: "POST" });
      } catch {}
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/pages/register.html";
    });
  }

/* Cancel */
btnCancel.onclick = () => modal.classList.add("hidden");

/* Submit */
form.onsubmit = async (e) => {
  e.preventDefault();

  const payload = {
    name: inputName.value,
    address: inputAddress.value,
    status: inputStatus.value
  };

  try{
    if(inputId.value){
      await apiRequest(`/customers/${inputId.value}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    }else{
      await apiRequest("/customers", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }

    modal.classList.add("hidden");
    loadCustomers();
  }catch(e){
    alert(e.message || "Gagal menyimpan data");
  }
};

/* Edit */
async function editCustomer(id){
  try{
    const res = await apiRequest(`/customers/${id}`);
    const c = res.data || res;

    inputId.value = c.id;
    inputName.value = c.user?.name;
    inputAddress.value = formatAddress(c);
    inputStatus.value = c.status;

    modal.classList.remove("hidden");
  }catch(e){
    alert("Gagal mengambil data");
  }
}

/* Delete */
async function deleteCustomer(id){
  if(!confirm("Yakin ingin menghapus pelanggan ini?")) return;
  try{
    await apiRequest(`/customers/${id}`, { method: "DELETE" });
    loadCustomers();
  }catch(e){
    alert("Gagal menghapus data");
  }
}

/* Init */
document.addEventListener("DOMContentLoaded", loadCustomers);
