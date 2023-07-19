const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/user");
const Link = require("../models/links");

const register = async (req, res, next) => {
  let newUser;
  let hashedPassword;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: req.body.email });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "User exist already, please login instead.",
      422
    );
    return next(error);
  }

  try {
    hashedPassword = await bcrypt.hash(req.body.password, 10);
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Could not create account, please try again.",
      500
    );
    return next(error);
  }

  newUser = new User({
    email: req.body.email,
    password: hashedPassword,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
  });

  try {
    await newUser.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError("Signing up failed, please try again.", 500);
    return next(error);
  }

  //Add JWT token

  res.status(201).json({ userId: newUser.id, email: newUser.email });
};

const login = async (req, res, next) => {
  let { email, password } = req.body;
  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      403
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "Could not log you in, please check your credentials and try again.",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      403
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      "RANDOM-TOKEN",
      { expiresIn: "24h" }
    );
  } catch (err) {
    const error = new HttpError("Logging in failed, please try again.", 500);
    return next(error);
  }

  res.json({
    email: existingUser.email,
    id: existingUser.id,
    firstName: existingUser.firstName,
    lastName: existingUser.lastName,
    token: token,
  });
};

const addUserLinks = async (req, res, next) => {
  let links = req.body.links;
  let userId = req.params.userId;
  let existingUser;

  try {
    existingUser = await User.findOne({ _id: userId });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find user with this id.",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Could not find user for the provided id.",
      404
    );
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    for (let link of links) {
      let existingLink = await Link.findOne({ platform: link.platform });
      if (!existingLink) {
        let newLink = new Link({
          platform: link.platform,
          link: link.link,
          status: "active",
          user: userId,
        });

        await newLink.save({ session: sess });
        existingUser.links.push(newLink);
      }
    }

    await existingUser.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not save user links.",
      500
    );
    return next(error);
  }

  res.status(201).json({ linksAdded: true });
};

const getUserLinks = async (req, res, next) => {
  let userId = req.params.userId;
  let links;

  try {
    links = await Link.find({ user: userId });
  } catch (err) {
    const error = new HttpError(
      "Fetching links failed, please try again later.",
      500
    );
    return next(error);
  }

  res.json({
    links: links.map((link) => link.toObject({ getters: true })),
  });
};

const deleteLink = async (req, res, next) => {
  let linkId = req.params.linkId;
  let userId = req.body.user;
  let link, user;

  try {
    link = await Link.findById(linkId);
    user = await User.findById(userId);
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not delete link.",
      500
    );
    return next(error);
  }

  if (!link || !user) {
    const error = new HttpError(
      "Could not find link || user for this id.",
      404
    );
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await link.deleteOne({ session: sess });
    user.links.pull(link);
    await user.save({ session: sess });
    // link.user.links.pull(link);
    // await link.user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not delete link.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Link deleted." });
};

const updateLinkDetails = async (req, res, next) => {
  let { newPlatform, newLinkText } = req.body;
  let linkId = req.params.linkId;
  let link;

  try {
    link = await Link.findById(linkId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update link.",
      500
    );
    return next(error);
  }

  if (!link) {
    const error = new HttpError("Could not find link for this id.", 404);
    return next(error);
  }

  try {
    link.platform = newPlatform;
    link.link = newLinkText;

    await link.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError("Could not update link details.", 500);
    return next(error);
  }

  res.status(200).json({ message: "Link Updated.", updated: true });
};

const updateUserDetails = async (req, res, next) => {
  let userId = req.params.userId;
  const { firstName, lastName } = req.body;
  let user;

  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find user.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for this id.", 404);
    return next(error);
  }

  try {
    user.firstName = firstName;
    user.lastName = lastName;

    await user.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError("Could not update user details.", 500);
    return next(error);
  }

  res.status(200).json({ message: "User Updated.", updated: true });
};

exports.register = register;
exports.login = login;
exports.addUserLinks = addUserLinks;
exports.getUserLinks = getUserLinks;
exports.deleteLink = deleteLink;
exports.updateLinkDetails = updateLinkDetails;
exports.updateUserDetails = updateUserDetails;
