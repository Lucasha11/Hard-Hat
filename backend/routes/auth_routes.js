import { Router } from 'express';
import { usersDataFunctions } from '../data/users.js';
import validation from '../data/validation.js';

const router = Router();

// ── Register form ─────────────────────────────────────────────────────────────
router.route('/register').get((req, res) => {
  if (req.session.user) return res.redirect('/');
  return res.render('auth/register', { title: 'Create Account' });
});

// ── Register submit ───────────────────────────────────────────────────────────
router.route('/register').post(async (req, res) => {
  if (req.session.user) return res.redirect('/');

  const { firstName, lastName, email, username, password } = req.body;
  const formData = { firstName, lastName, email, username };

  const rerender = (error) =>
    res.status(400).render('auth/register', { title: 'Create Account', error, formData });

  try {
    validation.validateName(firstName);
    validation.validateName(lastName);
    validation.validateEmail(email);
    validation.validateUsername(username);
    validation.validatePassword(password);
  } catch (e) {
    return rerender(typeof e === 'string' ? e : e.message);
  }

  try {
    const user = await usersDataFunctions.createUser(
      firstName,
      lastName,
      email,
      username,
      password
    );

    req.session.user = {
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username
    };

    return res.redirect('/');
  } catch (e) {
    const msg = typeof e === 'string' ? e : e.message;
    if (msg === 'Username must be unique.') {
      return rerender('That username is already taken. Please choose another.');
    }
    return res.status(500).render('error', { title: 'Error', error: msg });
  }
});

// ── Sign out ──────────────────────────────────────────────────────────────────
router.route('/signout').get((req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

export default router;
