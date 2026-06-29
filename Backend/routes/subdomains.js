const express = require("express");
const Subdomain = require("../models/Subdomain");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

function isTeamLead(user) {
  return user?.username === "mahad" || user?.email === "mahad@northstar.dev";
}

function requireTeamLead(req, res) {
  if (isTeamLead(req.user)) {
    return true;
  }

  res.status(403).json({ message: "Only Mahad Fareed can make this change." });
  return false;
}

function serializeSubdomain(subdomain) {
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

router.get("/", async (req, res) => {
  try {
    const subdomains = await Subdomain.find({}).sort({ createdAt: -1 });
    return res.json({ subdomains: subdomains.map(serializeSubdomain) });
  } catch (error) {
    console.error("Get subdomains error:", error.message);
    return res.status(500).json({ message: "Unable to load subdomains." });
  }
});

router.post("/", async (req, res) => {
  try {
    if (!requireTeamLead(req, res)) return;

    const name = String(req.body.name || "").trim().toLowerCase();
    const existingSubdomain = await Subdomain.findOne({ name });

    if (existingSubdomain) {
      return res.status(409).json({ message: "This subdomain already exists." });
    }

    const subdomain = await Subdomain.create({
      owner: req.user._id,
      name,
      hosting: req.body.hosting,
      pm: req.body.pm,
      assignedTo: req.body.assignedTo,
      projectDate: req.body.projectDate,
      websiteUrl: String(req.body.websiteUrl || "").trim(),
    });

    return res.status(201).json({ subdomain: serializeSubdomain(subdomain) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "This subdomain already exists." });
    }
    console.error("Create subdomain error:", error.message);
    return res.status(400).json({ message: "Please provide valid subdomain details." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!requireTeamLead(req, res)) return;

    const subdomain = await Subdomain.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: {
          name: String(req.body.name || "").trim().toLowerCase(),
          hosting: req.body.hosting,
          pm: req.body.pm,
          assignedTo: req.body.assignedTo,
          projectDate: req.body.projectDate,
          websiteUrl: String(req.body.websiteUrl || "").trim(),
        },
      },
      { new: true, runValidators: true },
    );

    if (!subdomain) {
      return res.status(404).json({ message: "Subdomain not found." });
    }

    return res.json({ subdomain: serializeSubdomain(subdomain) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "This subdomain already exists." });
    }
    console.error("Update subdomain error:", error.message);
    return res.status(400).json({ message: "Unable to update subdomain." });
  }
});

router.patch("/:id/logo", async (req, res) => {
  try {
    if (!requireTeamLead(req, res)) return;

    const subdomain = await Subdomain.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { logoImage: String(req.body.logoImage || "") } },
      { new: true, runValidators: true },
    );

    if (!subdomain) {
      return res.status(404).json({ message: "Subdomain not found." });
    }

    return res.json({ subdomain: serializeSubdomain(subdomain) });
  } catch (error) {
    console.error("Update subdomain logo error:", error.message);
    return res.status(400).json({ message: "Unable to update subdomain image." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!requireTeamLead(req, res)) return;

    const subdomain = await Subdomain.findOneAndDelete({ _id: req.params.id });

    if (!subdomain) {
      return res.status(404).json({ message: "Subdomain not found." });
    }

    return res.json({ message: "Subdomain deleted successfully." });
  } catch (error) {
    console.error("Delete subdomain error:", error.message);
    return res.status(400).json({ message: "Unable to delete subdomain." });
  }
});

module.exports = router;
