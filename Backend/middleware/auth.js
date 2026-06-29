const Session = require("../models/Session");
const { hashSessionToken } = require("../utils/auth");

async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const session = await Session.findOne({
      tokenHash: hashSessionToken(token),
      expiresAt: { $gt: new Date() },
    }).populate("user");

    if (!session?.user) {
      return res.status(401).json({ message: "Session is invalid or expired." });
    }

    req.user = session.user;
    req.session = session;
    return next();
  } catch (error) {
    console.error("Authentication middleware error:", error.message);
    return res.status(500).json({ message: "Unable to verify session." });
  }
}

module.exports = requireAuth;
