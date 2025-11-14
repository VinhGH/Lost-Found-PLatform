import jwt from "jsonwebtoken";

// 🔒 Xác thực token JWT
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};

// 🔒 Chỉ Admin mới được phép truy cập
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "Admin")
    return res
      .status(403)
      .json({ success: false, message: "Admin access required" });
  next();
};

// 🔒 Verify dành riêng cho Admin
export const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== "Admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Admins only",
    });
  }
  next();
};

// 🔒 Kiểm tra quyền sở hữu tài nguyên
export const checkOwnership = (req, res, next) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.user?.userId || req.user?.id;

    if (userId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập tài nguyên này",
      });
    }

    next();
  } catch (error) {
    console.error("Ownership check error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi kiểm tra quyền sở hữu",
    });
  }
};
