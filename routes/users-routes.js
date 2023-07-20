const express = require("express");
const usersControllers = require("../controllers/users-controllers");

const router = express.Router();

router.get("/user-details/:userId", usersControllers.getUserDetails);
router.get("/get-user-links/:userId", usersControllers.getUserLinks);
router.post("/register", usersControllers.register);
router.post("/login", usersControllers.login);
router.post("/save-links/:userId", usersControllers.addUserLinks);
router.patch(
  "/update-link-details/:linkId",
  usersControllers.updateLinkDetails
);
router.patch("/update-user-info/:userId", usersControllers.updateUserDetails);
router.delete("/delete-link/:linkId", usersControllers.deleteLink);

module.exports = router;
