const mongoose = require("mongoose");

const subdomainSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    hosting: {
      type: String,
      enum: ["Hostinger", "Verpex"],
      required: true,
    },
    pm: {
      type: String,
      enum: ["Front", "Steven", "William", "Samuel"],
      required: true,
    },
    assignedTo: {
      type: String,
      enum: ["Samiullah", "Mahad", "Usman"],
      required: true,
    },
    projectDate: {
      type: Date,
      required: true,
    },
    websiteUrl: {
      type: String,
      trim: true,
      default: "",
    },
    logoImage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

subdomainSchema.index({ owner: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Subdomain", subdomainSchema);
