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

  global.HardHatValidation = { validateUsername };
})(window);
