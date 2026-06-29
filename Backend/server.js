const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/User");
const authRoutes = require("./routes/auth");
const domainRoutes = require("./routes/domains");
const subdomainRoutes = require("./routes/subdomains");
const { hashPassword } = require("./utils/auth");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/api/auth", authRoutes);
app.use("/api/domains", domainRoutes);
app.use("/api/subdomains", subdomainRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running");
});

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
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");

    await seedAdminUsers();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.log("Server startup error:", error.message);
    process.exitCode = 1;
  }
}

startServer();
