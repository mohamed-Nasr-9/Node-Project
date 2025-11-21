// backend/middleware/roleCheck.js
// Role-based access control middleware
export default function roleCheck(allowedRoles = []) {
  const allowed = new Set(allowedRoles);

  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const userRole = req.user.role;
      if (!allowed.size) return next(); // no roles specified => allow

      if (!allowed.has(userRole)) {
        return res.status(403).json({
          error: "Access denied. Insufficient permissions.",
          requiredRoles: [...allowed],
          userRole
        });
      }

      next();
    } catch (error) {
      console.error("roleCheck error:", error);
      res.status(500).json({ error: "Server error during authorization" });
    }
  };
}
