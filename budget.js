// -------------------- USER & TRANSACTION LOGIC --------------------
const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
if (!loggedInUser) {
  alert("Please login to access the Transactions.");
  window.location.href = "index.html";
} else {
  document.getElementById("username").textContent = loggedInUser.username;
  document.getElementById("email").textContent = loggedInUser.email;
}

function logout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "index.html";
}

// -------------------- TRANSACTION MODAL + FORM LOGIC --------------------
document.addEventListener("DOMContentLoaded", () => {
  const transactionModal = document.getElementById("transactionModal");
  const transactionBtn = document.getElementById("newTransactionBtn");

  const transactionClose = transactionModal?.querySelector(".close");

  if (transactionBtn) {
    transactionBtn.onclick = () => transactionModal.style.display = "block";
  }

  if (transactionClose) {
    transactionClose.onclick = () => transactionModal.style.display = "none";
  }

  window.onclick = (e) => {
    if (e.target === transactionModal) transactionModal.style.display = "none";
  };

  // Handle transaction form
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

    form.reset();
    transactionModal.style.display = "none";

    const tKey = `transactions_${loggedInUser.username}`;
    const aKey = `accounts_${loggedInUser.username}`;

    const transactions = JSON.parse(localStorage.getItem(tKey)) || [];
    transactions.push(transaction);
    localStorage.setItem(tKey, JSON.stringify(transactions));

    // Update the corresponding account's balance
    let accounts = JSON.parse(localStorage.getItem(aKey)) || [];
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
      localStorage.setItem(aKey, JSON.stringify(accounts));
      renderAccounts();
    }

    if (document.getElementById("transactionBody")) {
      renderTransactions();
      updateDashboardTotals?.();
    }

    // Ensure progress bars update
    if (typeof loadBudgets === "function") loadBudgets();
  });
});

// -------------------- Account + Category Dropdown --------------------
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

updateDashboardTotals();
renderTransactions();
if (typeof renderAccounts === "function") renderAccounts();
populateAccountDropdown();
populateCategoryDropdown();

// -------------------- Global function: Update total balance --------------------
function updateDashboardTotals() {
  const totalElement = document.getElementById("totalBalance");
  if (!totalElement) {
    console.warn("⚠️ totalBalance element not found");
    return;
  }

  const accounts = JSON.parse(localStorage.getItem(`accounts_${loggedInUser.username}`)) || [];
  let accountTotalBalance = 0;
  accounts.forEach(acc => {
    accountTotalBalance += parseFloat(acc.balance);
  });

  totalElement.textContent = `₹${accountTotalBalance.toFixed(2)}`;
}

// -------------------- Global function: Render transactions --------------------
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

// -------------------- Global function: Delete transaction --------------------
function deleteTransaction(index) {
  const tKey = `transactions_${loggedInUser.username}`;
  let transactions = JSON.parse(localStorage.getItem(tKey)) || [];
  transactions.splice(index, 1);
  localStorage.setItem(tKey, JSON.stringify(transactions));
  renderTransactions();
  updateDashboardTotals?.();
  if (typeof loadBudgets === "function") loadBudgets();
}

// -------------------- BUDGET MODAL LOGIC --------------------
document.addEventListener("DOMContentLoaded", () => {
  const budgetModal = document.getElementById("budgetModal");
  const openModalBtn = document.getElementById("newAccountBtn");
  const closeModalBtn = document.querySelector(".close-budget");
  const budgetForm = document.getElementById("budgetForm");
  const mainContainer = document.querySelector(".main");

  const cardContainer = document.createElement("div");
  cardContainer.className = "cards-container";
  mainContainer.appendChild(cardContainer);

  let editIndex = null;

  openModalBtn.addEventListener("click", () => {
    budgetForm.reset();
    editIndex = null;
    budgetModal.style.display = "block";
  });

  closeModalBtn.addEventListener("click", () => {
    budgetModal.style.display = "none";
    budgetForm.reset();
    editIndex = null;
  });

  window.addEventListener("click", (e) => {
    if (e.target === budgetModal) {
      budgetModal.style.display = "none";
      budgetForm.reset();
      editIndex = null;
    }
  });

  budgetForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(budgetForm);
    const budget = {
      month: formData.get("month"),
      category: formData.get("category"),
      total: parseFloat(formData.get("total")),
      spent: 0,
      color: formData.get("color")
    };

    const bKey = `budgets_${loggedInUser.username}`;
    let budgets = JSON.parse(localStorage.getItem(bKey)) || [];

    if (editIndex !== null) {
      budgets[editIndex] = budget;
    } else {
      budgets.push(budget);
    }

    localStorage.setItem(bKey, JSON.stringify(budgets));
    budgetForm.reset();
    budgetModal.style.display = "none";
    editIndex = null;
    loadBudgets();
  });

  function loadBudgets() {
    cardContainer.innerHTML = "";
    const bKey = `budgets_${loggedInUser.username}`;
    let budgets = JSON.parse(localStorage.getItem(bKey)) || [];
    const transactions = JSON.parse(localStorage.getItem(`transactions_${loggedInUser.username}`)) || [];

    // Update spent for each budget
    budgets = budgets.map(budget => {
      const spent = transactions
        .filter(t => t.type === "expense" && t.category === budget.category && t.date.startsWith(budget.month))
        .reduce((sum, t) => sum + t.amount, 0);

      return { ...budget, spent };
    });

    localStorage.setItem(bKey, JSON.stringify(budgets));

    cardContainer.innerHTML = "";
const alertMessages = [];

    budgets.forEach((budget, index) => {
      const percentageRaw = (budget.spent / budget.total) * 100;
      const percentage = Math.min(percentageRaw, 100).toFixed(1);

    // Collect alert messages instead of showing one at a time
  if (percentageRaw >= 100) {
    alertMessages.push(`🚨 You've exceeded your budget for ${budget.category} in ${budget.month}!`);
  }

      
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${budget.category} (${budget.month})</h3>
        <p><strong>Total:</strong> ₹${budget.total}</p>
        <p><strong>Spent:</strong> ₹${budget.spent}</p>
        <div class="progress-bar">
          <div class="progress" style="width: ${percentage}%; background-color: ${budget.color};"></div>
        </div>
        <p>${percentage}% used</p>
        <div class="buttons">
          <button class="edit-btn" data-index="${index}">Edit</button>
          <button class="delete-btn" data-index="${index}">Delete</button>
        </div>
      `;

      card.querySelector(".delete-btn").addEventListener("click", () => {
        budgets.splice(index, 1);
        localStorage.setItem(bKey, JSON.stringify(budgets));
        loadBudgets();
      });

      card.querySelector(".edit-btn").addEventListener("click", () => {
        editIndex = index;
        budgetForm.month.value = budget.month;
        budgetForm.category.value = budget.category;
        budgetForm.total.value = budget.total;
        budgetForm.color.value = budget.color;
        budgetModal.style.display = "block";
      });

      cardContainer.appendChild(card);
    });

    // 👉 Show combined alert if any budget is exceeded
if (alertMessages.length > 0) {
  showBudgetAlert(alertMessages.join('\n\n'));
}
  }

  function showBudgetAlert(message) {
    const modal = document.getElementById("budgetAlertModal");
    const messageEl = document.getElementById("alertMessage");
    const closeBtn = document.querySelector(".close-alert");

    messageEl.textContent = message;
    modal.style.display = "block";

    closeBtn.onclick = function () {
      modal.style.display = "none";
    };

    window.onclick = function (event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };
  }

  function populateCategoryDropdown() {
    const categorySelect = document.getElementById("budget-category");
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

  populateCategoryDropdown();
  loadBudgets();
});
