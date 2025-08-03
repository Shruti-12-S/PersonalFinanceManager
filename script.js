const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

registerBtn.addEventListener('click', () => {
  container.classList.add('active');
});

loginBtn.addEventListener('click', () => {
  container.classList.remove('active');
});

// === Registration Handler ===
const registerForm = document.querySelector('.form-box.register form');
registerForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const username = registerForm.querySelector('input[placeholder="Username"]').value.trim();
  const email = registerForm.querySelector('input[placeholder="Email"]').value.trim();
  const password = registerForm.querySelector('input[placeholder="Password"]').value.trim();

  if (!username || !email || !password) {
    alert("All fields are required.");
    return;
  }

  // Get existing users
  const users = JSON.parse(localStorage.getItem("users")) || [];

  // Check if username or email already exists
  const exists = users.some(user => user.username === username || user.email === email);
  if (exists) {
    alert("Username or email already registered.");
    return;
  }

  // Add new user
  users.push({ username, email, password });
  localStorage.setItem("users", JSON.stringify(users));
  alert("Registration successful! Please log in.");
  container.classList.remove('active');
});

// === Login Handler ===
const loginForm = document.querySelector('.form-box.login form');
loginForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const username = loginForm.querySelector('input[placeholder="Username"]').value.trim();
  const password = loginForm.querySelector('input[placeholder="Password"]').value.trim();

  const users = JSON.parse(localStorage.getItem("users")) || [];

  const matchedUser = users.find(user => user.username === username && user.password === password);

  if (matchedUser) {
    localStorage.setItem("loggedInUser", JSON.stringify({ username: matchedUser.username, email: matchedUser.email }));
    window.location.href = "dash.html";
  } else {
    alert("Invalid username or password.");
  }
});
