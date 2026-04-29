(function () {
  'use strict';

  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    const v = window.HardHatValidation;

    const checks = [
      { id: 'firstName',  fn: v.validateName },
      { id: 'lastName',   fn: v.validateName },
      { id: 'email',      fn: v.validateEmail },
      { id: 'username',   fn: v.validateUsername },
      { id: 'password',   fn: v.validatePassword }
    ];

    for (const { id, fn } of checks) {
      const field = document.getElementById(id);
      const error = fn(field.value);
      if (error) {
        e.preventDefault();
        showError(error);
        field.focus();
        return;
      }
    }
  });

  function showError(message) {
    let alert = document.getElementById('form-error');
    if (!alert) {
      alert = document.createElement('div');
      alert.id = 'form-error';
      alert.className = 'alert alert--error';
      form.parentNode.insertBefore(alert, form);
    }
    alert.textContent = message;
    alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
})();
