import jwt from 'jsonwebtoken';

// Optional token verification - Parse token if present but don't reject if missing
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided - continue without user info
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log('✅ Optional auth - Token valid for:', decoded.role, decoded.email);
  } catch (err) {
    // Token invalid - continue without user info
    req.user = null;
    console.log('⚠️ Optional auth - Invalid token, continuing as guest');
  }
  
  next();
};

export const verifyToken = (req, res, next) => {  // 🔒 verifyToken
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No token in request');
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  console.log('🔑 Verifying token:', token.substring(0, 20) + '...');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token valid for user:', decoded.accountId);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('❌ Token verification failed:', err.message);
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req, res, next) => {  // 🔒 requireAdmin
  if (req.user?.role !== 'Admin')
    return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
};

export const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== "Admin") {
    return res.status(403).json({ 
      success: false,
      message: "Access denied: Admins only" 
    });
  }
  next();
};

// Middleware kiểm tra quyền sở hữu
export const checkOwnership = (req, res, next) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.user?.userId || req.user?.id;
    
    // Kiểm tra nếu userId từ params khớp với userId đã đăng nhập
    if (userId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập tài nguyên này'
      });
    }
    
    next();
  } catch (error) {
    console.error('Ownership check error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra quyền sở hữu'
    });
  }
};