(function () {
  'use strict';

  const form = document.getElementById('signin-form');
  if (!form) return;

  const errorEl = document.getElementById('form-error');

  function showError(message) {
    errorEl.textContent = message;
    errorEl.style.display = '';
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearError() {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearError();

    const usernameEl = document.getElementById('username');
    const passwordEl = document.getElementById('password');
    const username = usernameEl.value;
    const password = passwordEl.value;

    // Client-side format checks (no DB involved)
    const usernameError = window.HardHatValidation.validateUsername(username);
    if (usernameError) {
      showError(usernameError);
      usernameEl.focus();
      return;
    }

    if (!password || password.trim().length === 0) {
      showError('Password cannot be empty');
      passwordEl.focus();
      return;
    }

    // AJAX submission — server handles credential checks
    try {
      const res = await fetch('/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.success) {
        window.location.href = '/';
      } else {
        showError(data.error || 'Sign in failed. Please try again.');
      }
    } catch (_) {
      showError('An unexpected error occurred. Please try again.');
    }
  });
})();
