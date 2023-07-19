const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const Platforms = require("../models/platform");

const getPlatforms = async (req, res, next) => {
  let platforms;
  try {
    platforms = await Platforms.find();
  } catch (err) {
    const error = new HttpError(
      "Fetching platforms failed, please try again later.",
      500
    );
    return next(error);
  }

  res.json({
    platforms: platforms.map((platform) =>
      platform.toObject({ getters: true })
    ),
  });
};

exports.getPlatforms = getPlatforms;
