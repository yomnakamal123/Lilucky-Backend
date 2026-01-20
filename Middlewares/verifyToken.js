const appError = require('../appError');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(appError.create('Not authenticated', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // map id to _id for Mongoose
    req.user = {
      _id: decoded.id, // Mongoose expects _id
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (err) {
    return next(appError.create('Invalid token', 401));
  }
};

module.exports = verifyToken;
