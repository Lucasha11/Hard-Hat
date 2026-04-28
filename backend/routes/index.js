import reviewRoutes from './review_routes.js';

const constructorMethod = (app) => {
  app.use('/', reviewRoutes);

  app.use('*path', (req, res) => {
    return res.status(404).render('error', {
      title: 'Not Found',
      error: 'Page not found'
    });
  });
};

export default constructorMethod;
