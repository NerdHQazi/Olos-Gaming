const supabase = require('../config/supabase');

/**
 * Reusable Express middleware that validates the Supabase Bearer JWT
 * and exposes the authenticated user object on req.user.
 */
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token required'
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token || token.trim() === '') {
    return res.status(401).json({
      success: false,
      message: 'Authorization token required'
    });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data || !data.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = data.user;
    next();
  } catch (err) {
    console.error('[AuthMiddleware] Error verifying token:', err);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Optional authentication middleware:
 * Populates req.user if a valid Bearer token is provided,
 * but allows the request to continue unauthenticated if absent or invalid.
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token || token.trim() === '') {
    return next();
  }

  try {
    const { data } = await supabase.auth.getUser(token);
    if (data?.user) {
      req.user = data.user;
    }
  } catch (err) {
    // Ignore error for optional authentication
  }

  next();
};

module.exports = {
  requireAuth,
  optionalAuth,
};
