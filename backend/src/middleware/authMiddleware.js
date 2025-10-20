import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {  // 🔒 verifyToken
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
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