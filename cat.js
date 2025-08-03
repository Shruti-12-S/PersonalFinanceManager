document.addEventListener("DOMContentLoaded", () => {
  //  Get user data from localStorage
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!loggedInUser) {
    alert("Please login to access the Categories.");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("username").textContent = loggedInUser.username;
  document.getElementById("email").textContent = loggedInUser.email;

  window.logout = function () {
    localStorage.removeItem("loggedInUser");
    window.location.href = "index.html";
  };

  const transactionModal = document.getElementById("transactionModal");
  const transactionBtn = document.querySelector(".btn");
  const transactionClose = transactionModal?.querySelector(".close");

  if (transactionBtn && transactionModal) {
    transactionBtn.addEventListener("click", () => {
      transactionModal.style.display = "block";
    });
  }

  if (transactionClose && transactionModal) {
    transactionClose.addEventListener("click", () => {
      transactionModal.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === transactionModal) {
      transactionModal.style.display = "none";
    }
  });

  //  Filter categories UI
  window.filterCategories = function (type) {
    const cards = document.querySelectorAll('.card');
    const tabs = document.querySelectorAll('.tab');

    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    cards.forEach(card => {
      card.style.display = type === 'all' || card.classList.contains(type) ? 'block' : 'none';
    });
  };

  //  Transaction Form Submission
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

    const userKey = loggedInUser.username;
    const transactionKey = `transactions_${userKey}`;
    const accountKey = `accounts_${userKey}`;

    const transactions = JSON.parse(localStorage.getItem(transactionKey)) || [];
    transactions.push(transaction);
    localStorage.setItem(transactionKey, JSON.stringify(transactions));

    let accounts = JSON.parse(localStorage.getItem(accountKey)) || [];
    const accountIndex = accounts.findIndex(acc => acc.name === transaction.account);

    if (accountIndex !== -1) {
      let currentBalance = parseFloat(accounts[accountIndex].balance);
      const amount = parseFloat(transaction.amount);

      currentBalance += (transaction.type === "income" ? amount : -amount);
      accounts[accountIndex].balance = currentBalance.toFixed(2);

      localStorage.setItem(accountKey, JSON.stringify(accounts));
      if (typeof renderAccounts === "function") renderAccounts();
    }

    form.reset();
    transactionModal.style.display = "none";
    renderTransactions();
    updateDashboardTotals();
  });

  function saveCategoriesToLocalStorage() {
    const categoryCards = document.querySelectorAll(".card");
    const categories = [];

    categoryCards.forEach(card => {
      const categoryName = card.querySelector("h3")?.textContent?.trim();
      if (categoryName && !categories.includes(categoryName)) {
        categories.push(categoryName);
      }
    });

    localStorage.setItem(`categories_${loggedInUser.username}`, JSON.stringify(categories));
  }

  function populateCategoryDropdown() {
    const categorySelect = document.getElementById("category");
    if (!categorySelect) return;

    categorySelect.innerHTML = "<option value='' disabled selected>Select category</option>";

    const categories = JSON.parse(localStorage.getItem(`categories_${loggedInUser.username}`)) || [];
    categories.forEach(categoryName => {
      const option = document.createElement("option");
      option.value = categoryName;
      option.textContent = categoryName;
      categorySelect.appendChild(option);
    });
  }

  function populateAccountDropdown() {
    const accountSelect = document.getElementById("account");
    if (!accountSelect) return;

    accountSelect.innerHTML = "<option value='' disabled selected>Select account</option>";

    const accounts = JSON.parse(localStorage.getItem(`accounts_${loggedInUser.username}`)) || [];
    accounts.forEach(acc => {
      const option = document.createElement("option");
      option.value = acc.name;
      option.textContent = acc.name;
      accountSelect.appendChild(option);
    });
  }

  function updateDashboardTotals() {
    const totalElement = document.getElementById("totalBalance");
    if (!totalElement) return;

    const accounts = JSON.parse(localStorage.getItem(`accounts_${loggedInUser.username}`)) || [];
    let total = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
    totalElement.textContent = `₹${total.toFixed(2)}`;
  }

  function renderTransactions() {
    const tbody = document.getElementById("transactionBody");
    if (!tbody) return;

    tbody.innerHTML = "";
    const transactions = JSON.parse(localStorage.getItem(`transactions_${loggedInUser.username}`)) || [];

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
  }

  window.deleteTransaction = function (index) {
    const key = `transactions_${loggedInUser.username}`;
    let transactions = JSON.parse(localStorage.getItem(key)) || [];
    transactions.splice(index, 1);
    localStorage.setItem(key, JSON.stringify(transactions));
    renderTransactions();
    updateDashboardTotals();
  };

  // On Load:
  saveCategoriesToLocalStorage();
  populateCategoryDropdown();
  populateAccountDropdown();
  updateDashboardTotals();
  renderTransactions();
  if (typeof renderAccounts === "function") renderAccounts();

  // ====== Category Card Click: Show Transactions by Category ======
  const categoryCards = document.querySelectorAll(".card");
  categoryCards.forEach(card => {
    card.addEventListener("click", () => {
      const categoryName = card.querySelector("h3")?.textContent?.trim();
      if (categoryName) {
        showCategoryTransactions(categoryName);
      }
    });
  });

  //show cat

  function showCategoryTransactions(categoryName) {
    const transactions = JSON.parse(localStorage.getItem(`transactions_${loggedInUser.username}`)) || [];
    const filtered = transactions.filter(t => t.category === categoryName);

    // Create modal HTML if not present
    let popup = document.getElementById("categoryTransactionPopup");
    if (!popup) {
      popup = document.createElement("div");
      popup.id = "categoryTransactionPopup";
      popup.style.position = "fixed";
      popup.style.top = "50%";
      popup.style.left = "50%";
      popup.style.transform = "translate(-50%, -50%)";
      popup.style.background = "#fff";
      popup.style.border = "1px solid #ccc";
      popup.style.borderRadius = "10px";
      popup.style.padding = "20px";
      popup.style.zIndex = "1000";
      popup.style.width = "90%";
      popup.style.maxWidth = "600px";
      popup.style.boxShadow = "0 0 15px rgba(0,0,0,0.2)";
      popup.innerHTML = `<span id="closePopup" style="float:right;cursor:pointer;">&times;</span>
      <h3></h3>
      <table style="width:100%;border-collapse:collapse;margin-top:10px;">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Account</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody id="popupTransactionBody"></tbody>
      </table>`;
      document.body.appendChild(popup);
    }

    //  Update title dynamically
    popup.querySelector("h3").textContent = `Transactions for "${categoryName}"`;

    // Populate table
    const tbody = popup.querySelector("#popupTransactionBody");
    tbody.innerHTML = "";

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No transactions found.</td></tr>`;
    } else {
      filtered.forEach(t => {
        const row = document.createElement("tr");
        row.innerHTML = `
        <td>${t.date}</td>
        <td>${t.description}</td>
        <td>${t.account}</td>
        <td>₹${t.amount.toFixed(2)}</td>
      `;
        tbody.appendChild(row);
      });
    }

    popup.style.display = "block";

    // Close logic
    popup.querySelector("#closePopup").onclick = () => {
      popup.style.display = "none";
    };
  }

});
