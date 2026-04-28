import reviewRoutes from './review_routes.js';
import authRoutes from './auth_routes.js';
import devRoutes from './dev_routes.js'; // TODO: remove before production

const constructorMethod = (app) => {
  app.use('/', devRoutes);
  app.use('/', authRoutes);
  app.use('/', reviewRoutes);

  app.use('*path', (req, res) => {
    return res.status(404).render('error', {
      title: 'Not Found',
      error: 'Page not found'
    });
  });
};

export default constructorMethod;
