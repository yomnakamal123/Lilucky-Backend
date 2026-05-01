const express = require('express');
const router = express.Router();
const verifyToken = require('../Middlewares/verifyToken');
const isAdmin = require('../Middlewares/isAdmin');
const shippingController = require('../Controllers/shipping.controller');

// router.get('/get-all', shippingController.getAllShipping);
// router.post('/upsert', verifyToken, isAdmin, shippingController.upsertShipping);

router.post("/seed-shipping", verifyToken, isAdmin, shippingController.seedShipping);

router.get("/get-all-shipping", verifyToken, shippingController.getAllShipping);
router.post("/create-shipping", verifyToken, isAdmin, shippingController.upsertShipping);
router.patch("/update-shipping/:id", verifyToken, isAdmin, shippingController.updateShipping);
router.delete("/delete-shipping/:id", verifyToken, isAdmin, shippingController.deleteShipping);

module.exports = router;