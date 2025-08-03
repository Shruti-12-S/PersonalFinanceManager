let editingAccountIndex = null;

document.addEventListener("DOMContentLoaded", () => {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!loggedInUser) {
    alert("Please login to access the Accounts.");
    window.location.href = "index.html";
    return;
  }

  const username = loggedInUser.username;
  document.getElementById("username").textContent = username;
  document.getElementById("email").textContent = loggedInUser.email;

  // Logout
  window.logout = function () {
    localStorage.removeItem("loggedInUser");
    window.location.href = "index.html";
  };

  // Transaction modal
  const transactionModal = document.getElementById("transactionModal");
  const transactionBtn = document.querySelector(".btn");
  const transactionClose = transactionModal?.querySelector(".close");

  transactionBtn.onclick = () => {
    populateCategoryDropdown();
    transactionModal.style.display = "block";
  };
  transactionClose.onclick = () => transactionModal.style.display = "none";

  window.onclick = (e) => {
    if (e.target === transactionModal) transactionModal.style.display = "none";
    if (e.target === accountModal) accountModal.style.display = "none";
  };

  document.getElementById("transactionForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const form = e.target;
    const transaction = {
      date: form.date.value,
      description: form.description.value,
      category: form.category.value,
      account: form.account.value,
      amount: parseFloat(form.amount.value),
      type: form.type.value
    };

    const transactionsKey = `transactions_${username}`;
    const transactions = JSON.parse(localStorage.getItem(transactionsKey)) || [];
    transactions.push(transaction);
    localStorage.setItem(transactionsKey, JSON.stringify(transactions));

    const accountsKey = `accounts_${username}`;
    let accounts = JSON.parse(localStorage.getItem(accountsKey)) || [];
    const accountIndex = accounts.findIndex(acc => acc.name === transaction.account);

    if (accountIndex !== -1) {
      let currentBalance = parseFloat(accounts[accountIndex].balance);
      const amount = parseFloat(transaction.amount);

      if (transaction.type === "income") {
        currentBalance += amount;
      } else if (transaction.type === "expense") {
        currentBalance -= amount;
      }

      accounts[accountIndex].balance = currentBalance.toFixed(2);
      localStorage.setItem(accountsKey, JSON.stringify(accounts));
      renderAccounts();
    }

    form.reset();
    transactionModal.style.display = "none";
    renderTransactions();
    updateDashboardTotals?.();
  });

  // Render transactions
  window.renderTransactions = function () {
    const tbody = document.getElementById("transactionBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const transactions = JSON.parse(localStorage.getItem(`transactions_${username}`)) || [];
    transactions.forEach((t, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${t.date}</td>
        <td>${t.description}</td>
        <td>${t.category}</td>
        <td>${t.account}</td>
        <td>${t.amount.toFixed(2)}</td>
        <td><button onclick="deleteTransaction(${index})">Delete</button></td>
      `;
      tbody.appendChild(row);
    });
  };

  window.deleteTransaction = function (index) {
    const key = `transactions_${username}`;
    let transactions = JSON.parse(localStorage.getItem(key)) || [];
    transactions.splice(index, 1);
    localStorage.setItem(key, JSON.stringify(transactions));
    renderTransactions();
    updateDashboardTotals?.();
  };

  const accountModal = document.getElementById("accountModal");
  const accountForm = document.getElementById("accountForm");
  const newAccountBtn = document.getElementById("newAccountBtn");
  const accountContainer = document.getElementById("accountContainer");
  const accountClose = document.querySelector(".close-account");

  accountClose.onclick = () => {
    accountModal.style.display = "none";
    accountForm.reset();
    editingAccountIndex = null;
  };

  newAccountBtn.onclick = () => {
    accountModal.style.display = "flex";
    accountForm.reset();
    editingAccountIndex = null;
  };

  accountForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = accountForm.accountName.value.trim();
    const number = accountForm.accountNumber.value.trim();
    const balance = parseFloat(accountForm.accountBalance.value).toFixed(2);

    if (!name || !number || isNaN(balance)) {
      alert("Please fill out all fields.");
      return;
    }

    const accountsKey = `accounts_${username}`;
    const accounts = JSON.parse(localStorage.getItem(accountsKey)) || [];

    if (editingAccountIndex !== null) {
      accounts[editingAccountIndex] = { name, number, balance };
      editingAccountIndex = null;
    } else {
      accounts.push({ name, number, balance });
    }

    localStorage.setItem(accountsKey, JSON.stringify(accounts));
    renderAccounts();
    populateAccountDropdown();
    accountForm.reset();
    accountModal.style.display = "none";
    updateDashboardTotals?.();
  });

  window.renderAccounts = function () {
    accountContainer.innerHTML = "";
    const accounts = JSON.parse(localStorage.getItem(`accounts_${username}`)) || [];

    accounts.forEach((acc, index) => {
      const card = document.createElement("div");
      card.className = "card";

      let borderColor = "blue";
      if (acc.balance < 0) borderColor = "red";
      else if (acc.balance > 5000) borderColor = "green";
      card.style.borderTop = `4px solid ${borderColor}`;

      card.innerHTML = `
        <div class="account-name" style="font-size:20px; font-weight:900">${acc.name}</div>
        <div class="account-num">****${acc.number.slice(-4)}</div>
        <div class="balance"><i class="fa-solid fa-indian-rupee-sign"></i>${parseFloat(acc.balance).toFixed(2)}</div>
        <button class="edit" onclick="editAccount(${index})"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
        <button class="delete" onclick="deleteAccount(${index})"><i class="fa-solid fa-trash"></i> Delete</button>
      `;
      accountContainer.appendChild(card);
    });
  };

  window.deleteAccount = function (index) {
    const accountsKey = `accounts_${username}`;
    let accounts = JSON.parse(localStorage.getItem(accountsKey)) || [];
    accounts.splice(index, 1);
    localStorage.setItem(accountsKey, JSON.stringify(accounts));
    renderAccounts();
    populateAccountDropdown();
    updateDashboardTotals?.();
  };

  window.editAccount = function (index) {
    const accounts = JSON.parse(localStorage.getItem(`accounts_${username}`)) || [];
    const acc = accounts[index];

    accountForm.accountName.value = acc.name;
    accountForm.accountNumber.value = acc.number;
    accountForm.accountBalance.value = acc.balance;

    editingAccountIndex = index;
    accountModal.style.display = "flex";
  };

  function populateAccountDropdown() {
    const accountSelect = document.getElementById("account");
    if (!accountSelect) return;

    accountSelect.innerHTML = "<option value='' disabled selected>Select account</option>";

    const accounts = JSON.parse(localStorage.getItem(`accounts_${username}`)) || [];
    accounts.forEach(acc => {
      const option = document.createElement("option");
      option.value = acc.name;
      option.textContent = acc.name;
      accountSelect.appendChild(option);
    });
  }

  function populateCategoryDropdown() {
    const categorySelect = document.getElementById("category");
    if (!categorySelect) return;

    categorySelect.innerHTML = "<option value='' disabled selected>Select category</option>";

    const categories = [
      "Groceries", "Dining", "Transportation", "Utilities", "Entertainment", "Health",
      "Shopping", "Salary", "Investments", "Other Income"
    ];

    categories.forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      categorySelect.appendChild(option);
    });
  }

  renderTransactions();
  renderAccounts();
  populateAccountDropdown();
  populateCategoryDropdown();
});
