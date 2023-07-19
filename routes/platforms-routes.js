const express = require("express");
const platformsControllers = require("../controllers/platforms-controller");

const router = express.Router();

router.get("/", platformsControllers.getPlatforms);

module.exports = router;
