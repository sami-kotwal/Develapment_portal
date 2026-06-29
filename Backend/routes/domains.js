const express = require("express");
const Domain = require("../models/Domain");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

const portfolioFields = new Set([
  "backupEnabled",
  "careUpdateAt",
  "careUpdateEnabled",
  "recaptchaEnabled",
  "wordfenceDate",
]);

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

function userDeveloperName(user) {
  return user?.name?.split(" ")[0] || "";
}

function serializeDomain(domain) {
  return {
    id: domain.id,
    name: domain.name,
    hosting: domain.hosting,
    expiry: domain.expirationDate.toISOString().slice(0, 10),
    email: domain.emailCount > 0 || domain.emailEnabled,
    emailCount: domain.emailCount || 0,
    developer: domain.developer || "Mahad",
    websiteUrl: domain.websiteUrl || "",
    logoImage: domain.logoImage || "",
    websiteStatus: domain.websiteStatus,
    liveSince: domain.liveSince,
    downSince: domain.downSince,
    careUpdateEnabled: domain.careUpdateEnabled !== false,
    careUpdateAt: domain.careUpdateAt,
    wordfenceDate: domain.wordfenceDate,
    recaptchaEnabled: Boolean(domain.recaptchaEnabled),
    backupEnabled: Boolean(domain.backupEnabled),
  };
}

router.get("/", async (req, res) => {
  try {
    const domains = await Domain.find({}).sort({ createdAt: -1 });
    return res.json({ domains: domains.map(serializeDomain) });
  } catch (error) {
    console.error("Get domains error:", error.message);
    return res.status(500).json({ message: "Unable to load domains." });
  }
});

router.post("/", async (req, res) => {
  try {
    if (!requireTeamLead(req, res)) return;

    const name = String(req.body.name || "").trim().toLowerCase();
    const existingDomain = await Domain.findOne({ name });

    if (existingDomain) {
      return res.status(409).json({ message: "This domain already exists." });
    }

    const domain = await Domain.create({
      owner: req.user._id,
      name,
      hosting: String(req.body.hosting || "").trim(),
      expirationDate: req.body.expiry,
      emailEnabled: Number(req.body.emailCount || 0) > 0,
      emailCount: Math.max(0, Number(req.body.emailCount || 0)),
      developer: req.body.developer || "Mahad",
      websiteUrl: String(req.body.websiteUrl || "").trim(),
      careUpdateEnabled: req.body.careUpdateEnabled !== false,
      careUpdateAt: req.body.careUpdateAt || new Date(),
      wordfenceDate: req.body.wordfenceDate || null,
      recaptchaEnabled: Boolean(req.body.recaptchaEnabled),
      backupEnabled: Boolean(req.body.backupEnabled),
    });

    return res.status(201).json({ domain: serializeDomain(domain) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "This domain already exists." });
    }
    console.error("Create domain error:", error.message);
    return res.status(400).json({ message: "Please provide valid domain details." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!requireTeamLead(req, res)) return;

    const update = {
      name: String(req.body.name || "").trim().toLowerCase(),
      hosting: String(req.body.hosting || "").trim(),
      expirationDate: req.body.expiry,
      emailEnabled: Number(req.body.emailCount || 0) > 0,
      emailCount: Math.max(0, Number(req.body.emailCount || 0)),
      developer: req.body.developer || "Mahad",
      websiteUrl: String(req.body.websiteUrl || "").trim(),
    };

    if (req.body.careUpdateEnabled !== undefined) {
      update.careUpdateEnabled = Boolean(req.body.careUpdateEnabled);
      if (update.careUpdateEnabled) {
        update.careUpdateAt = new Date();
      }
    }
    if (req.body.careUpdateAt !== undefined) {
      update.careUpdateAt = req.body.careUpdateAt || null;
    }
    if (req.body.wordfenceDate !== undefined) {
      update.wordfenceDate = req.body.wordfenceDate || null;
    }
    if (req.body.recaptchaEnabled !== undefined) {
      update.recaptchaEnabled = Boolean(req.body.recaptchaEnabled);
    }
    if (req.body.backupEnabled !== undefined) {
      update.backupEnabled = Boolean(req.body.backupEnabled);
    }

    const domain = await Domain.findOneAndUpdate(
      { _id: req.params.id },
      { $set: update },
      { new: true, runValidators: true },
    );

    if (!domain) {
      return res.status(404).json({ message: "Domain not found." });
    }

    return res.json({ domain: serializeDomain(domain) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "This domain already exists." });
    }
    console.error("Update domain error:", error.message);
    return res.status(400).json({ message: "Unable to update domain." });
  }
});

router.patch("/:id/website", async (req, res) => {
  try {
    if (!isTeamLead(req.user)) {
      const requestedFields = Object.keys(req.body || {});
      const hasDisallowedField = requestedFields.some((field) => !portfolioFields.has(field));

      if (hasDisallowedField) {
        return res.status(403).json({ message: "Only Mahad Fareed can edit website details." });
      }

      const domain = await Domain.findById(req.params.id);
      if (!domain) {
        return res.status(404).json({ message: "Domain not found." });
      }
      if ((domain.developer || "Mahad") !== userDeveloperName(req.user)) {
        return res.status(403).json({ message: "You can only update your own portfolio websites." });
      }
    }

    const update = {};

    if (req.body.hosting !== undefined) {
      update.hosting = String(req.body.hosting).trim();
    }
    if (req.body.developer !== undefined) {
      update.developer = req.body.developer;
    }
    if (req.body.emailCount !== undefined) {
      update.emailCount = Math.max(0, Number(req.body.emailCount || 0));
      update.emailEnabled = update.emailCount > 0;
    }
    if (req.body.websiteUrl !== undefined) {
      update.websiteUrl = String(req.body.websiteUrl || "").trim();
    }
    if (req.body.logoImage !== undefined) {
      update.logoImage = String(req.body.logoImage || "");
    }
    if (req.body.status !== undefined) {
      if (!["None", "Live", "Down"].includes(req.body.status)) {
        return res.status(400).json({ message: "Website status must be None, Live or Down." });
      }

      update.websiteStatus = req.body.status;
      if (req.body.status === "None") {
        update.liveSince = null;
        update.downSince = null;
      } else if (req.body.status === "Live") {
        update.liveSince = new Date();
        update.downSince = null;
      } else {
        update.downSince = new Date();
      }
    }
    if (req.body.careUpdateEnabled !== undefined) {
      update.careUpdateEnabled = Boolean(req.body.careUpdateEnabled);
      if (update.careUpdateEnabled) {
        update.careUpdateAt = new Date();
      }
    }
    if (req.body.careUpdateAt !== undefined) {
      update.careUpdateAt = req.body.careUpdateAt || null;
    }
    if (req.body.wordfenceDate !== undefined) {
      update.wordfenceDate = req.body.wordfenceDate || null;
    }
    if (req.body.recaptchaEnabled !== undefined) {
      update.recaptchaEnabled = Boolean(req.body.recaptchaEnabled);
    }
    if (req.body.backupEnabled !== undefined) {
      update.backupEnabled = Boolean(req.body.backupEnabled);
    }

    const domain = await Domain.findOneAndUpdate(
      { _id: req.params.id },
      { $set: update },
      { new: true, runValidators: true },
    );

    if (!domain) {
      return res.status(404).json({ message: "Domain not found." });
    }

    return res.json({ domain: serializeDomain(domain) });
  } catch (error) {
    console.error("Update website error:", error.message);
    return res.status(400).json({ message: "Unable to update website." });
  }
});

router.patch("/:id/website-status", async (req, res) => {
  try {
    if (!requireTeamLead(req, res)) return;

    const websiteStatus = req.body.status;
    if (!["None", "Live", "Down"].includes(websiteStatus)) {
      return res.status(400).json({ message: "Website status must be None, Live or Down." });
    }

    const now = new Date();
    const update =
      websiteStatus === "None"
        ? { websiteStatus, liveSince: null, downSince: null }
        : websiteStatus === "Live"
          ? { websiteStatus, liveSince: now, downSince: null }
          : { websiteStatus, downSince: now };

    const domain = await Domain.findOneAndUpdate(
      { _id: req.params.id },
      { $set: update },
      { new: true, runValidators: true },
    );

    if (!domain) {
      return res.status(404).json({ message: "Domain not found." });
    }

    return res.json({ domain: serializeDomain(domain) });
  } catch (error) {
    console.error("Tag website error:", error.message);
    return res.status(400).json({ message: "Unable to update website status." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!requireTeamLead(req, res)) return;

    const domain = await Domain.findOneAndDelete({ _id: req.params.id });

    if (!domain) {
      return res.status(404).json({ message: "Domain not found." });
    }

    return res.json({ message: "Domain deleted successfully." });
  } catch (error) {
    console.error("Delete domain error:", error.message);
    return res.status(400).json({ message: "Unable to delete domain." });
  }
});

module.exports = router;
