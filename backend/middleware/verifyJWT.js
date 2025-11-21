import jwt from "jsonwebtoken";
import Session from "../models/Session.js";
import User from "../models/User.js"; // ✅ Add this

export default async function verifyJWT(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const session = await Session.findOne({
      userId: decoded.id,
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return res
        .status(401)
        .json({ error: "Session expired. Please login again." });
    }

    // ✅ Attach actual user document to req.user
    const user = await User.findById(decoded.id).select("_id email role");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user; // << Now req.user._id is available in controllers
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ error: "Invalid token" });
    } else if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Token expired. Please login again." });
    } else {
      console.error("JWT verification error:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
}
