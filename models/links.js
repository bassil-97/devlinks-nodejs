const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const linksSchema = new Schema({
  platform: { type: String, required: true },
  link: { type: String, required: true },
  status: { type: String, required: true },
  user: { type: mongoose.Types.ObjectId, required: true, ref: "Users" },
});

module.exports = mongoose.model("Links", linksSchema);
