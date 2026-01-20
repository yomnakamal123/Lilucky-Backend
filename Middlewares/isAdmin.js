const appError = require('../appError');
const userRoles = require('../user.roles');

const isAdmin = (req, res, next) => {
  if (req.user.role !== userRoles.ADMIN) {
    return next(appError.create('Admins only', 403));
  }
  next();
};

module.exports = isAdmin;
