// ====== Global Modal Reference ======
const transactionModal = document.getElementById("transactionModal");

// ====== On DOM Loaded ======
document.addEventListener("DOMContentLoaded", () => {
  // ====== Check Login ======
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!loggedInUser) {
    alert("Please login to access the Dashboard.");
    window.location.href = "index.html";
    return;
  }

  const username = loggedInUser.username;
  document.getElementById("username").textContent = username;
  document.getElementById("email").textContent = loggedInUser.email;

  // ====== Logout Button ======
  window.logout = function () {
    localStorage.removeItem("loggedInUser");
    window.location.href = "index.html";
  };

  // ====== Modal Open/Close Handling ======
  const transactionBtn = document.querySelector(".btn");
  const transactionClose = transactionModal?.querySelector(".close");

  transactionBtn.onclick = () => transactionModal.style.display = "block";
  transactionClose.onclick = () => transactionModal.style.display = "none";

  window.onclick = (e) => {
    if (e.target === transactionModal) transactionModal.style.display = "none";
  };

  // ====== Form Submission Handler ======
  const transactionForm = document.getElementById("transactionForm");
  transactionForm.addEventListener("submit", function (e) {
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

    // Save transaction
    const transactionsKey = `transactions_${username}`;
    const transactions = JSON.parse(localStorage.getItem(transactionsKey)) || [];
    transactions.push(transaction);
    localStorage.setItem(transactionsKey, JSON.stringify(transactions));

    // Update corresponding account balance
    const accountsKey = `accounts_${username}`;
    let accounts = JSON.parse(localStorage.getItem(accountsKey)) || [];
    const accountIndex = accounts.findIndex(acc => acc.name === transaction.account);

    if (accountIndex !== -1) {
      let currentBalance = parseFloat(accounts[accountIndex].balance);
      const amount = transaction.amount;

      if (transaction.type === "income") currentBalance += amount;
      else if (transaction.type === "expense") currentBalance -= amount;

      accounts[accountIndex].balance = currentBalance.toFixed(2);
      localStorage.setItem(accountsKey, JSON.stringify(accounts));

      if (typeof renderAccounts === "function") renderAccounts();
    }

    form.reset();
    if (transactionModal) transactionModal.style.display = "none";
    updateDashboardTotals();
    if (document.getElementById("transactionBody")) {
      renderTransactions();
    }
    renderLineChart();
    renderCategoryPieChart(); // update pie chart after form submit
  });

  // ====== Populate Category & Account Dropdowns ======
  populateCategoryDropdown();
  populateAccountDropdown();

  // ====== Initial Render ======
  updateDashboardTotals();
  renderTransactions();
  if (typeof renderAccounts === "function") renderAccounts();
  renderLineChart();
  renderCategoryPieChart(); // pie chart on load
});

// ====== Populate Categories ======
function populateCategoryDropdown() {
  const categorySelect = document.getElementById("category");
  if (!categorySelect) return;

  categorySelect.innerHTML = "<option value='' disabled selected>Select category</option>";

  const categories = [
    "Groceries", "Dining", "Transportation", "Utilities", "Entertainment",
    "Health", "Shopping", "Salary", "Investments", "Other Income"
  ];

  categories.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    categorySelect.appendChild(option);
  });
}

// ====== Populate Accounts ======
function populateAccountDropdown() {
  const accountSelect = document.getElementById("account");
  if (!accountSelect) return;

  accountSelect.innerHTML = "<option value='' disabled selected>Select account</option>";

  const username = JSON.parse(localStorage.getItem("loggedInUser"))?.username;
  const accounts = JSON.parse(localStorage.getItem(`accounts_${username}`)) || [];

  accounts.forEach(acc => {
    const option = document.createElement("option");
    option.value = acc.name;
    option.textContent = acc.name;
    accountSelect.appendChild(option);
  });
}

// ====== Render Transactions Table ======
function renderTransactions() {
  const tbody = document.getElementById("transactionBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const username = JSON.parse(localStorage.getItem("loggedInUser"))?.username;
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
}

// ====== Delete a Transaction ======
function deleteTransaction(index) {
  const username = JSON.parse(localStorage.getItem("loggedInUser"))?.username;
  const transactionsKey = `transactions_${username}`;
  let transactions = JSON.parse(localStorage.getItem(transactionsKey)) || [];

  transactions.splice(index, 1);
  localStorage.setItem(transactionsKey, JSON.stringify(transactions));
  renderTransactions();
  updateDashboardTotals?.();
  renderLineChart();
  renderCategoryPieChart(); //  update pie chart after deletion
}

// ====== Update Dashboard Totals ======
function updateDashboardTotals() {
  const username = JSON.parse(localStorage.getItem("loggedInUser"))?.username;
  const totalElement = document.getElementById("totalBalance");
  const incomeElement = document.getElementById("income");
  const expenseElement = document.getElementById("expenses");

  const accounts = JSON.parse(localStorage.getItem(`accounts_${username}`)) || [];
  const transactions = JSON.parse(localStorage.getItem(`transactions_${username}`)) || [];

  let accountTotalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach(t => {
    const amount = parseFloat(t.amount);
    if (t.type.toLowerCase() === "income") totalIncome += amount;
    else if (t.type.toLowerCase() === "expense") totalExpense += amount;
  });

  if (totalElement) totalElement.textContent = `₹${accountTotalBalance.toFixed(2)}`;
  if (incomeElement) incomeElement.textContent = `₹${totalIncome.toFixed(2)}`;
  if (expenseElement) expenseElement.textContent = `₹${totalExpense.toFixed(2)}`;
}

// ====== Render Line Chart ======
function renderLineChart() {
  const username = JSON.parse(localStorage.getItem("loggedInUser"))?.username;
  const transactions = JSON.parse(localStorage.getItem(`transactions_${username}`)) || [];

  const datesMap = {};

  transactions.forEach(t => {
    const date = t.date;
    if (!datesMap[date]) {
      datesMap[date] = { income: 0, expense: 0 };
    }

    const amount = parseFloat(t.amount);
    if (t.type === "income") datesMap[date].income += amount;
    else if (t.type === "expense") datesMap[date].expense += amount;
  });

  const sortedDates = Object.keys(datesMap).sort();
  const labels = sortedDates;
  const incomeData = sortedDates.map(date => datesMap[date].income);
  const expenseData = sortedDates.map(date => datesMap[date].expense);

  const canvas = document.getElementById("lineChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (window.lineChartInstance) {
    window.lineChartInstance.destroy();
  }

  window.lineChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: 'green',
          backgroundColor: 'rgba(0, 128, 0, 0.2)',
          fill: true,
          tension: 0.3
        },
        {
          label: 'Expense',
          data: expenseData,
          borderColor: 'red',
          backgroundColor: 'rgba(255, 0, 0, 0.2)',
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Income vs Expense Over Time'
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Amount (₹)'
          },
          beginAtZero: true
        }
      }
    }
  });
}

// ====== Render Pie Chart by Category (Expense Only) ======
function renderCategoryPieChart() {
  const username = JSON.parse(localStorage.getItem("loggedInUser"))?.username;
  const transactions = JSON.parse(localStorage.getItem(`transactions_${username}`)) || [];

  const categoryMap = {};

  transactions.forEach(t => {
    if (t.type === "expense") {
      const category = t.category;
      const amount = parseFloat(t.amount);
      if (!categoryMap[category]) {
        categoryMap[category] = 0;
      }
      categoryMap[category] += amount;
    }
  });

  const labels = Object.keys(categoryMap);
  const data = Object.values(categoryMap);

  const colors = [
    "#FF6384", "#36A2EB", "#FFCE56", "#8E44AD", "#1ABC9C",
    "#E67E22", "#2ECC71", "#3498DB", "#E74C3C", "#9B59B6"
  ];

  const canvas = document.getElementById("categoryPieChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  if (window.categoryPieChartInstance) {
    window.categoryPieChartInstance.destroy();
  }

  window.categoryPieChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: 'Expense by Category',
        data: data,
        backgroundColor: colors.slice(0, labels.length),
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Expense Distribution by Category'
        }
      }
    }
  });
}
