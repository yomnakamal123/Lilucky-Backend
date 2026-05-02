const express = require("express");
const router = express.Router();
const settingsController = require("../Controllers/setting.controller");
const upload = require("../Middlewares/uploadImage");
const verifyToken = require("../Middlewares/verifyToken");
const isAdmin = require("../Middlewares/isAdmin");


router.get("/settings", settingsController.getSettings);

router.post(
  "/hero",
  upload.single("image"),
  settingsController.upsertHero
);

router.patch(
  "/hero/update",
    upload.single("image"),
  verifyToken,
  isAdmin,
  settingsController.updateHero
);

router.get("/hero/:position", settingsController.getHeroByPosition);

module.exports = router;