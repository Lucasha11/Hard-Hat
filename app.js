import express from 'express';
import { engine } from 'express-handlebars';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import constructorMethod from './backend/routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists before multer tries to write to it
mkdirSync(path.join(__dirname, 'public/uploads/reviews'), { recursive: true });

const app = express();

app.engine(
  'handlebars',
  engine({
    defaultLayout: 'main',
    helpers: {
      // Returns "selected" when val equals target — used in rating dropdowns
      selected: (val, target) => Number(val) === Number(target) ? 'selected' : '',
      // Formats a Date object or ISO string as "April 25, 2026"
      formatDate: (date) =>
        new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
      eq: (a, b) => a === b
    }
  })
);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    name: 'AuthState',
    secret: 'HardHatSecret2024!',
    resave: false,
    saveUninitialized: false
  })
);

// Make session user available to every template via res.locals
app.use((req, res, next) => {
  res.locals.isLoggedIn = !!req.session.user;
  res.locals.sessionUser = req.session.user || null;
  next();
});

constructorMethod(app);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

export default app;
