(function (global) {
  'use strict';

  // Mirrors backend/data/validation.js validateUsername.
  // Allowed: letters, numbers, special characters. No whitespace. Length 3-30.
  function validateUsername(username) {
    if (typeof username !== 'string') return 'Username must be a string';
    username = username.trim();
    if (username.length < 3 || username.length > 30)
      return 'Username must be between 3 and 30 characters';
    if (/\s/.test(username)) return 'Username cannot contain spaces';
    if (!/^[!-~]+$/.test(username))
      return 'Username can only contain letters, numbers, and special characters';
    return null;
  }

  // Mirrors backend/data/validation.js validateName.
  function validateName(name) {
    if (typeof name !== 'string') return 'Name must be a string';
    name = name.trim();
    if (name.length === 0) return 'Name cannot be empty';
    if (/[^a-zA-Z\s\-']/.test(name))
      return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    return null;
  }

  // Mirrors backend/data/validation.js validateEmail.
  function validateEmail(email) {
    if (typeof email !== 'string') return 'Email must be a string';
    email = email.trim();
    if (email.length === 0) return 'Email cannot be empty';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email is not valid';
    return null;
  }

  // Mirrors backend/data/validation.js validatePassword.
  function validatePassword(password) {
    if (typeof password !== 'string' || password.trim().length === 0)
      return 'Password cannot be empty';
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    if (!/[^A-Za-z0-9]/.test(password))
      return 'Password must contain at least one special character';
    return null;
  }

  global.HardHatValidation = { validateUsername, validateName, validateEmail, validatePassword };
})(window);
