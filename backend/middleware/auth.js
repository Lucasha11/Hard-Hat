export const requireLogin = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).render('errors/loginRequired', {
      title: 'Login Required',
      message: 'You must be logged in to view this page.'
    });
  }

  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).render('errors/loginRequired', {
      title: 'Login Required',
      message: 'You must be logged in to view the admin panel.'
    });
  }

  if (req.session.user.role !== 'admin' && req.session.user.isAdmin !== true) {
    return res.status(403).render('errors/accessDenied', {
      title: 'Access Denied',
      message: 'You do not have permission to view the admin panel.'
    });
  }

  next();
};