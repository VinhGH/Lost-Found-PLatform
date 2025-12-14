import jwt from 'jsonwebtoken';

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      accountId: decoded.accountId,
      email: decoded.email,
      role: (decoded.role || '').trim(),
    };

    console.log("✅ Optional auth ok:", req.user);

  } catch (e) {
    req.user = null;
  }

  next();
};

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      accountId: decoded.accountId,
      email: decoded.email,
      role: (decoded.role || '').trim(),
    };

    console.log("🔍 Token user:", req.user);

    return next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if ((req.user?.role || '').toLowerCase() !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin only' });
  }
  next();
};
