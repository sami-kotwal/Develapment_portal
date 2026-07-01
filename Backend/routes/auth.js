const express = require("express");
const User = require("../models/User");
const Session = require("../models/Session");
const {
  createSessionToken,
  hashSessionToken,
  verifyPassword,
} = require("../utils/auth");

const router = express.Router();

const allowedUsers = new Set([
  "mahad",
  "mahad@northstar.dev",
  "samiullah",
  "samiullah@northstar.dev",
  "usman",
  "usman@northstar.dev",
]);

function isAllowedPortalUser(user) {
  return allowedUsers.has(user?.username) || allowedUsers.has(user?.email);
}

router.get("/me", async (req, res) => {
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

    const user = session.user;
    if (!isAllowedPortalUser(user)) {
      await Session.findByIdAndDelete(session._id);
      return res.status(403).json({ message: "This account is not allowed to access the portal." });
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Session verification error:", error.message);
    return res.status(500).json({ message: "Unable to verify session." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const identifier = String(req.body.identifier || req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!identifier || !password) {
      return res.status(400).json({ message: "Username/email and password are required." });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select("+passwordHash");

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid username/email or password." });
    }

    if (!isAllowedPortalUser(user)) {
      return res.status(403).json({ message: "Only approved AY TECH users can sign in." });
    }

    const token = createSessionToken();
    await Session.create({
      user: user._id,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Unable to login right now." });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const authorization = req.headers.authorization || "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    if (token) {
      await Session.findOneAndDelete({ tokenHash: hashSessionToken(token) });
    }

    return res.json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout error:", error.message);
    return res.status(500).json({ message: "Unable to logout right now." });
  }
});

module.exports = router;
