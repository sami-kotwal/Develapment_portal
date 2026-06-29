const dns = require("dns");
const mongoose = require("mongoose");
const User = require("../models/User");
const { hashPassword, verifyPassword } = require("../utils/auth");
require("dotenv").config();

dns.setServers(["1.1.1.1", "8.8.8.8"]);

async function seedUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    const users = [
      {
        name: "Mahad Fareed",
        username: "mahad",
        email: "mahad@northstar.dev",
        password: "domain123",
        role: "Administrator",
      },
      {
        name: "Samiullah",
        username: "samiullah",
        email: "samiullah@northstar.dev",
        password: "samiullah",
        role: "Administrator",
      },
      {
        name: "Usman",
        username: "usman",
        email: "usman@northstar.dev",
        password: "usman",
        role: "Administrator",
      },
    ];

    for (const user of users) {
      const existingUser = await User.findOne({
        $or: [{ email: user.email }, { username: user.username }],
      }).select("+passwordHash");

      if (existingUser) {
        existingUser.name = user.name;
        existingUser.username = user.username;
        existingUser.email = user.email;
        existingUser.role = user.role;

        if (!(await verifyPassword(user.password, existingUser.passwordHash))) {
          existingUser.passwordHash = await hashPassword(user.password);
        }

        await existingUser.save();
        console.log(`${user.name} user verified in MongoDB`);
        continue;
      }

      await User.create({
        name: user.name,
        username: user.username,
        email: user.email,
        passwordHash: await hashPassword(user.password),
        role: user.role,
      });

      console.log(`${user.name} user added to MongoDB successfully`);
    }
  } catch (error) {
    console.error("Unable to seed user:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedUser();
