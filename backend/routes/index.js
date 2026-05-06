import reviewRoutes from './review_routes.js';
import authRoutes from './auth_routes.js';
import searchRoutes from './search_routes.js';
import statsRoutes from './stats_routes.js';
import profileRoutes from './profile_routes.js';
import devRoutes from './dev_routes.js'; // TODO: remove before production

const constructorMethod = (app) => {
  app.use('/', devRoutes);
  app.use('/', authRoutes);
  app.use('/api', searchRoutes);
  app.use('/', statsRoutes);
  app.use('/', profileRoutes);
  app.use('/', reviewRoutes);

  app.use('*path', (req, res) => {
    return res.status(404).render('error', {
      title: 'Not Found',
      error: 'Page not found'
    });
  });
};

export default constructorMethod;
