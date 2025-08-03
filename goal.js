document.addEventListener("DOMContentLoaded", () => {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!loggedInUser) {
    alert("Please login to access the Goals.");
    window.location.href = "index.html";
    return;
  }
  const userKey = loggedInUser.username;

  document.getElementById("username").textContent = loggedInUser.username;
  document.getElementById("email").textContent = loggedInUser.email;

  window.logout = function () {
    localStorage.removeItem("loggedInUser");
    window.location.href = "index.html";
  };

  const transactionModal = document.getElementById("transactionModal");
  const transactionBtn = document.querySelector(".topbar .btn");
  const transactionClose = transactionModal?.querySelector(".close");
  const transactionForm = document.getElementById("transactionForm");

  const goalModal = document.getElementById("goalModal");
  const openGoalModalBtn = document.querySelector(".category .btn");
  const closeGoalModalBtn = document.getElementById("closeGoalModal");
  const goalForm = document.getElementById("goalForm");
  const goalContainer = document.querySelector(".main");

  let goals = JSON.parse(localStorage.getItem(`goals_${userKey}`)) || [];
  let currentlyEditingCard = null;

  transactionBtn.onclick = () => transactionModal.style.display = "block";
  transactionClose.onclick = () => transactionModal.style.display = "none";

  openGoalModalBtn.onclick = () => goalModal.style.display = "block";
  closeGoalModalBtn.onclick = () => {
    goalModal.style.display = "none";
    goalForm.reset();
    currentlyEditingCard = null;
  };

  window.onclick = (e) => {
    if (e.target === transactionModal) transactionModal.style.display = "none";
    if (e.target === goalModal) {
      goalModal.style.display = "none";
      goalForm.reset();
      currentlyEditingCard = null;
    }
  };

  transactionForm.addEventListener("submit", (e) => {
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

    const transactions = JSON.parse(localStorage.getItem(`transactions_${userKey}`)) || [];
    transactions.push(transaction);
    localStorage.setItem(`transactions_${userKey}`, JSON.stringify(transactions));

    form.reset();
    transactionModal.style.display = "none";

    renderTransactions?.();
    updateDashboardTotals?.();
    renderGoals(); // Refresh goal progress
  });

  function populateAccountDropdown() {
    const accountSelect = document.getElementById("account");
    if (!accountSelect) return;

    accountSelect.innerHTML = "<option value='' disabled selected>Select account</option>";
    const accounts = JSON.parse(localStorage.getItem(`accounts_${userKey}`)) || [];

    accounts.forEach(acc => {
      const option = document.createElement("option");
      option.value = acc.name;
      option.textContent = acc.name;
      accountSelect.appendChild(option);
    });
  }

  function populateCategoryDropdown() {
    const categorySelects = [
      document.getElementById("category"),
      document.getElementById("goalCategory")
    ].filter(Boolean);

    const categories = [
      "Groceries", "Dining", "Transportation", "Utilities", "Entertainment", "Health",
      "Shopping", "Salary", "Investments", "Other Income"
    ];

    categorySelects.forEach(select => {
      select.innerHTML = "<option value='' disabled selected>Select category</option>";
      categories.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
      });
    });
  }

  function updateDashboardTotals() {
    const totalElement = document.getElementById("totalBalance");
    if (!totalElement) return;

    const accounts = JSON.parse(localStorage.getItem(`accounts_${userKey}`)) || [];
    const total = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
    totalElement.textContent = `₹${total.toFixed(2)}`;
  }

  function renderTransactions() {
    const tbody = document.getElementById("transactionBody");
    if (!tbody) return;

    const transactions = JSON.parse(localStorage.getItem(`transactions_${userKey}`)) || [];
    tbody.innerHTML = "";

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
    const transactions = JSON.parse(localStorage.getItem(`transactions_${userKey}`)) || [];
    transactions.splice(index, 1);
    localStorage.setItem(`transactions_${userKey}`, JSON.stringify(transactions));
    renderTransactions();
    updateDashboardTotals();
    renderGoals(); // Refresh goals in case a savings transaction was deleted
  };

  function saveGoalsToLocalStorage() {
    localStorage.setItem(`goals_${userKey}`, JSON.stringify(goals));
  }

  function renderGoals() {
    const goalCardsContainer = document.getElementById("goalCardsContainer");
    goalCardsContainer.innerHTML = "";
    goalContainer.querySelectorAll(".empty-message").forEach(el => el.remove());

    if (goals.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.textContent = "You haven't added any goals yet.";
      emptyMessage.className = "empty-message";
      emptyMessage.style.margin = "20px";
      goalContainer.appendChild(emptyMessage);
    }

    const transactions = JSON.parse(localStorage.getItem(`transactions_${userKey}`)) || [];

    goals.forEach((goal, index) => {
      const { name, date, target, category } = goal;

      const saved = transactions
        .filter(t => t.category === category && t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const percent = ((saved / target) * 100).toFixed(0);
      const remaining = (target - saved).toFixed(2);
      const formattedDate = new Date(date).toLocaleDateString("en-IN", {
        year: "numeric", month: "short", day: "numeric"
      });

      const card = document.createElement("div");
      card.className = "goal-card";
      card.dataset.index = index;

      card.innerHTML = `
        <h2 class="goal-title">${name}</h2>
        <p class="target-date">Target: ${formattedDate} | Category: ${category}</p>
        <div class="amounts">
          <div class="saved">₹${saved.toLocaleString()} <span>Saved</span></div>
          <div class="target">₹${target.toLocaleString()} <span>Target</span></div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percent}%;"></div>
        </div>
        <p class="percent">${percent}% complete</p>
        <p class="remaining">₹${remaining} to go</p>
        <div class="buttons">
          <button class="edit-btn"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
          <button class="delete-btn"><i class="fa-solid fa-trash"></i> Delete</button>
        </div>
      `;

      card.querySelector(".edit-btn").addEventListener("click", () => {
        goalForm.goalName.value = name;
        goalForm.targetDate.value = date;
        goalForm.goalCategory.value = category;
        goalForm.targetAmount.value = target;
        currentlyEditingCard = index;
        goalModal.style.display = "block";
      });

      card.querySelector(".delete-btn").addEventListener("click", () => {
        goals.splice(index, 1);
        saveGoalsToLocalStorage();
        renderGoals();
      });

      goalCardsContainer.appendChild(card);
    });
  }

  goalForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = goalForm.goalName.value;
    const date = goalForm.targetDate.value;
    const target = parseFloat(goalForm.targetAmount.value);
    const category = goalForm.goalCategory.value;

    if (isNaN(target)) {
      alert("Target amount must be a valid number.");
      return;
    }

    if (currentlyEditingCard !== null) {
      goals[currentlyEditingCard] = { name, date, target, category };
      currentlyEditingCard = null;
    } else {
      goals.push({ name, date, target, category });
    }

    saveGoalsToLocalStorage();
    renderGoals();
    goalModal.style.display = "none";
    goalForm.reset();
  });

  populateAccountDropdown();
  populateCategoryDropdown();
  updateDashboardTotals();
  renderTransactions();
  renderGoals();
});
