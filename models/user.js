const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: [true, "Please provide an Email!"],
    unique: [true, "Email Exist"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password!"],
    unique: false,
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  links: [{ type: mongoose.Types.ObjectId, required: true, ref: "Links" }],
});

module.exports = mongoose.model("Users", userSchema);
