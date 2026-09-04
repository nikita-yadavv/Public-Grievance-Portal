const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the JWT from the Authorization header and attaches req.user
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists' });
      }

      if (req.user.role === 'admin' && req.user.isApproved === false) {
        return res.status(403).json({
          success: false,
          message: 'Your officer account is pending approval from the Chief Municipal Officer.'
        });
      }

      next();
    } catch (error) {
      console.error('[Auth Middleware Error]:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized. Token verification failed.' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No authorization token provided.' });
  }
};

// Restricts access to specific roles; superadmin automatically inherits admin access
const authorize = (...roles) => {
  return (req, res, next) => {
    const effectiveRoles = roles.includes('admin') ? [...roles, 'superadmin'] : roles;
    if (!effectiveRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
