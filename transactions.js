//  Check login
const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
if (!loggedInUser) {
  alert("Please login to access the Transactions.");
  window.location.href = "index.html";
} else {
  document.getElementById("username").textContent = loggedInUser.username;
  document.getElementById("email").textContent = loggedInUser.email;
}

const userKey = loggedInUser.username;

// Logout
function logout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "index.html";
}

//  Modal logic
const modal = document.getElementById("transactionModal");
const btn = document.querySelector(".btn");
const closeBtn = document.querySelector(".close");

btn.onclick = () => {
  modal.style.display = "block";
  populateAccountsDropdown(); 
  populateCategoryDropdown();
};

closeBtn.onclick = () => {
  modal.style.display = "none";
};

window.onclick = (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
};

//  Populate dropdowns
function populateAccountsDropdown() {
  const modalAccountSelect = document.querySelector("#transactionForm #account");
  const filterAccountSelect = document.querySelector(".filters #account");
  const accounts = JSON.parse(localStorage.getItem(`accounts_${userKey}`)) || [];

  if (modalAccountSelect) {
    modalAccountSelect.innerHTML = '<option value="" disabled selected>Select account</option>';
    accounts.forEach(acc => {
      const option = document.createElement("option");
      option.value = acc.name;
      option.textContent = acc.name;
      modalAccountSelect.appendChild(option);
    });
  }

  if (filterAccountSelect) {
    filterAccountSelect.innerHTML = '<option value="All Accounts">All Accounts</option>';
    accounts.forEach(acc => {
      const option = document.createElement("option");
      option.value = acc.name;
      option.textContent = acc.name;
      filterAccountSelect.appendChild(option);
    });
  }
}

function populateCategoryDropdown() {
  const modalCategorySelect = document.querySelector("#transactionForm #category");
  const filterCategorySelect = document.getElementById("filter-category");

  const categories = [
    "Groceries", "Dining", "Transportation", "Utilities", "Entertainment", "Health",
    "Shopping", "Salary", "Investments", "Other Income"
  ];

  if (modalCategorySelect) {
    modalCategorySelect.innerHTML = "<option value='' disabled selected>Select category</option>";
    categories.forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      modalCategorySelect.appendChild(option);
    });
  }

  if (filterCategorySelect) {
    filterCategorySelect.innerHTML = "<option>All Categories</option>";
    categories.forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      filterCategorySelect.appendChild(option);
    });
  }
}

//  Submit transaction
let editingIndex = null;
document.getElementById("transactionForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const form = e.target;

  const transaction = {
    date: form.date.value,
    description: form.description.value,
    category: form.category.value,
    account: form.account.value,
    amount: parseFloat(form.amount.value),
    type: form.type.value,
  };

  let transactions = JSON.parse(localStorage.getItem(`transactions_${userKey}`)) || [];

  if (editingIndex !== null) {
    const oldTransaction = transactions[editingIndex];
    adjustAccountBalance(oldTransaction.account, oldTransaction.amount, oldTransaction.type, true);
    transactions[editingIndex] = transaction;
    adjustAccountBalance(transaction.account, transaction.amount, transaction.type);
    editingIndex = null;
  } else {
    transactions.push(transaction);
    adjustAccountBalance(transaction.account, transaction.amount, transaction.type);
  }

  localStorage.setItem(`transactions_${userKey}`, JSON.stringify(transactions));
  form.reset();
  modal.style.display = "none";
  applyFilters();
  updateDashboardTotals?.();
});

//  Render Transactions
function renderTransactions(filteredList = null) {
  const tbody = document.getElementById("transactionBody");
  if (!tbody) return;
  const transactions = filteredList || JSON.parse(localStorage.getItem(`transactions_${userKey}`)) || [];
  tbody.innerHTML = "";

  transactions.forEach((t, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${t.date}</td>
      <td>${t.description}</td>
      <td>${t.category}</td>
      <td>${t.account}</td>
      <td>${t.amount.toFixed(2)}</td>
      <td>
        <button onclick="editTransaction(${index})">Edit</button>
        <button onclick="deleteTransaction(${index})">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

//  Filters
function applyFilters() {
  const accountFilter = document.querySelector(".filters #account").value;
  const categoryFilter = document.getElementById("filter-category").value;
  const typeFilter = document.getElementById("type").value;
  const selectedMonth = document.getElementById("monthRange")?.value;

  const allTransactions = JSON.parse(localStorage.getItem(`transactions_${userKey}`)) || [];

  const filtered = allTransactions.filter(t => {
    const tDate = new Date(t.date);
    const accountMatch = accountFilter === "All Accounts" || t.account === accountFilter;
    const categoryMatch = categoryFilter === "All Categories" || t.category === categoryFilter;
    const typeMatch = typeFilter === "all" || t.type === typeFilter;

    let monthMatch = true;
    if (selectedMonth && selectedMonth !== "all") {
      monthMatch = tDate.getMonth().toString() === selectedMonth;
    }

    return accountMatch && categoryMatch && typeMatch && monthMatch;
  });

  renderTransactions(filtered);
}

//  Edit Transaction
function editTransaction(index) {
  const transactions = JSON.parse(localStorage.getItem(`transactions_${userKey}`)) || [];
  const t = transactions[index];
  editingIndex = index;

  const form = document.getElementById("transactionForm");
  form.date.value = t.date;
  form.description.value = t.description;
  form.category.value = t.category;
  form.account.value = t.account;
  form.amount.value = t.amount;
  form.type.value = t.type;

  modal.style.display = "block";
  populateAccountsDropdown();
  populateCategoryDropdown();
}

//  Delete Transaction
function deleteTransaction(index) {
  let transactions = JSON.parse(localStorage.getItem(`transactions_${userKey}`)) || [];
  const transaction = transactions[index];
  adjustAccountBalance(transaction.account, transaction.amount, transaction.type, true);
  transactions.splice(index, 1);
  localStorage.setItem(`transactions_${userKey}`, JSON.stringify(transactions));
  applyFilters();
  updateDashboardTotals?.();
}

//  Update Dashboard Total
function updateDashboardTotals() {
  const totalElement = document.getElementById("totalBalance");
  if (!totalElement) return;

  const accounts = JSON.parse(localStorage.getItem(`accounts_${userKey}`)) || [];
  let total = 0;
  accounts.forEach((acc) => {
    total += parseFloat(acc.balance);
  });

  totalElement.textContent = `₹${total.toFixed(2)}`;
}

//  Adjust Account Balance
function adjustAccountBalance(accountName, amount, type, reverse = false) {
  let accounts = JSON.parse(localStorage.getItem(`accounts_${userKey}`)) || [];
  const index = accounts.findIndex(acc => acc.name === accountName);
  if (index === -1) return;

  let balance = parseFloat(accounts[index].balance);
  const amt = parseFloat(amount);

  if (type === "income") {
    balance += reverse ? -amt : amt;
  } else if (type === "expense") {
    balance += reverse ? amt : -amt;
  }

  accounts[index].balance = balance.toFixed(2);
  localStorage.setItem(`accounts_${userKey}`, JSON.stringify(accounts));
  updateDashboardTotals?.();
}

// Event listeners
document.getElementById("type").addEventListener("change", applyFilters);
document.getElementById("filter-category").addEventListener("change", applyFilters);
document.querySelector(".filters #account").addEventListener("change", applyFilters);
document.getElementById("monthRange")?.addEventListener("change", applyFilters);

//  On load
if (document.getElementById("transactionBody")) {
  renderTransactions();
}
populateAccountsDropdown();
populateCategoryDropdown();
