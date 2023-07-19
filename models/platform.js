const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const platformSchema = new Schema({
  platform: { type: String, required: true },
  icon: { type: String, required: true },
});

module.exports = mongoose.model("Platforms", platformSchema);
