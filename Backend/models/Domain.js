const mongoose = require("mongoose");

const domainSchema = new mongoose.Schema(
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
      required: true,
      trim: true,
    },
    expirationDate: {
      type: Date,
      required: true,
    },
    emailEnabled: {
      type: Boolean,
      default: false,
    },
    emailCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    developer: {
      type: String,
      enum: ["Mahad", "Usman", "Samiullah"],
      default: "Mahad",
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
    websiteStatus: {
      type: String,
      enum: ["None", "Live", "Down"],
      default: "None",
    },
    liveSince: {
      type: Date,
      default: null,
    },
    downSince: {
      type: Date,
      default: null,
    },
    careUpdateEnabled: {
      type: Boolean,
      default: true,
    },
    careUpdateAt: {
      type: Date,
      default: Date.now,
    },
    wordfenceDate: {
      type: Date,
      default: null,
    },
    recaptchaEnabled: {
      type: Boolean,
      default: false,
    },
    backupEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

domainSchema.index({ owner: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Domain", domainSchema);
