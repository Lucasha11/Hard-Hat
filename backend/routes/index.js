import reviewRoutes from './review_routes.js';
import authRoutes from './auth_routes.js';
import searchRoutes from './search_routes.js';
import statsRoutes from './stats_routes.js';
import profileRoutes from './profile_routes.js';
<<<<<<< HEAD
import adminRoutes from './admin.js';
import activityRoutes from './activity.js';
import devRoutes from './dev_routes.js'; // TODO: remove before production
import reportRoutes from './report_routes.js';
import verifiedSitesRoutes from './verifiedSites.js';
=======
import devRoutes from './dev_routes.js'; // TODO: remove before production
>>>>>>> features8and10

const constructorMethod = (app) => {
  app.use('/', devRoutes);
  app.use('/', authRoutes);
<<<<<<< HEAD
  app.use('/', reviewRoutes);
  app.use('/api', searchRoutes);
  app.use('/', statsRoutes);
  app.use('/', profileRoutes);
  app.use('/admin', adminRoutes);
  app.use('/my-activity', activityRoutes);
  app.use('/', reportRoutes);
  app.use('/verified-sites', verifiedSitesRoutes);
=======
  app.use('/api', searchRoutes);
  app.use('/', statsRoutes);
  app.use('/', profileRoutes);
  app.use('/', reviewRoutes);
>>>>>>> features8and10

  app.use('*path', (req, res) => {
    return res.status(404).render('error', {
      title: 'Not Found',
      error: 'Page not found'
    });
  });
};

export default constructorMethod;
