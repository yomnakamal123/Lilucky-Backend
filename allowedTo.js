const appError = require('./appError');

module.exports = (...roles) => {
  return (req, res, next) => {
    console.log('Token role:', req.user.role);
    console.log('Allowed roles:', roles);

    if (!req.user || !roles.includes(req.user.role)) {
      return next(appError.create('This Role Is Not Authorized', 401));
    }
    next();
  };
};
