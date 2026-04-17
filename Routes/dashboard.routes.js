const express = require("express");
const router = express.Router();
const { getDashboard } = require("../Controllers/dashboard.controller");

// GET /api/dashboard
router.get("/", getDashboard);

module.exports = router;