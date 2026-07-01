const dns = require("dns");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const User = require("./models/User");
const Domain = require("./models/Domain");
const Subdomain = require("./models/Subdomain");
const authRoutes = require("./routes/auth");
const domainRoutes = require("./routes/domains");
const subdomainRoutes = require("./routes/subdomains");
const { hashPassword } = require("./utils/auth");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "2mb" }));

function serializePublicDomain(domain) {
  return {
    id: domain.id,
    name: domain.name,
    hosting: domain.hosting,
    expiry: domain.expirationDate.toISOString().slice(0, 10),
    emailCount: domain.emailCount || 0,
    developer: domain.developer || "Mahad",
    websiteUrl: domain.websiteUrl || "",
    logoImage: domain.logoImage || "",
    websiteStatus: domain.websiteStatus,
    liveSince: domain.liveSince,
    downSince: domain.downSince,
    backupEnabled: Boolean(domain.backupEnabled),
  };
}

function serializePublicSubdomain(subdomain) {
  return {
    id: subdomain.id,
    name: subdomain.name,
    hosting: subdomain.hosting,
    pm: subdomain.pm,
    assignedTo: subdomain.assignedTo,
    projectDate: subdomain.projectDate.toISOString().slice(0, 10),
    websiteUrl: subdomain.websiteUrl || "",
    logoImage: subdomain.logoImage || "",
  };
}

// Routes
app.get("/api/public/overview", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

    const [domains, subdomains] = await Promise.all([
      Domain.find({}).sort({ createdAt: -1 }),
      Subdomain.find({}).sort({ createdAt: -1 }),
    ]);

    return res.json({
      domains: domains.map(serializePublicDomain),
      subdomains: subdomains.map(serializePublicSubdomain),
    });
  } catch (error) {
    console.error("Public overview error:", error.message);
    return res.status(500).json({ message: "Unable to load public overview." });
  }
});
app.use("/api/auth", authRoutes);
app.use("/api/domains", domainRoutes);
app.use("/api/subdomains", subdomainRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Railway gives PORT automatically
const PORT = process.env.PORT || 5000;

async function seedAdminUsers() {
  const users = [
    {
      name: "Mahad Fareed",
      username: "mahad",
      email: "mahad@northstar.dev",
      password: "domain123",
    },
    {
      name: "Samiullah",
      username: "samiullah",
      email: "samiullah@northstar.dev",
      password: "samiullah",
    },
    {
      name: "Usman",
      username: "usman",
      email: "usman@northstar.dev",
      password: "usman",
    },
  ];

  for (const user of users) {
    const existingUser = await User.findOne({
      $or: [{ email: user.email }, { username: user.username }],
    });

    if (existingUser) {
      existingUser.name = user.name;
      existingUser.username = user.username;
      existingUser.email = user.email;
      existingUser.role = "Administrator";
      await existingUser.save();

      console.log(`${user.name} user already exists`);
      continue;
    }

    await User.create({
      name: user.name,
      username: user.username,
      email: user.email,
      passwordHash: await hashPassword(user.password),
      role: "Administrator",
    });

    console.log(`${user.name} user created successfully`);
  }
}

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in environment variables");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");

    await seedAdminUsers();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
}

startServer();
