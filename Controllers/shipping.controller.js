
const Shipping = require("../models/shipping.model");
const httpStatusText = require("../httpStatusText");
const asyncwrapper = require("../asyncwrapper");
const appError = require("../appError");
const userRoles = require("../user.roles");


const egyptGovPrices = {
  cairo: 50,
  alex: 60,
  giza: 55,
  dakahlia: 70,
  sharqia: 70,
  qalyubia: 60,
  kafr_elsheikh: 75,
  gharbia: 65,
  menoufia: 65,
  beheira: 70,
  damietta: 80,
  port_said: 85,
  suez: 85,
  ismailia: 80,
  beni_suef: 70,
  fayoum: 70,
  minya: 75,
  assiut: 75,
  sohag: 80,
  qena: 85,
  luxor: 90,
  aswan: 95,
  red_sea: 120,
  new_valley: 120,
  matrouh: 130,
  north_sinai: 140,
  south_sinai: 140
};

const seedShipping = async (req, res) => {
  try {
    // امسح القديم (اختياري)
    await Shipping.deleteMany({});

    const data = Object.keys(egyptGovPrices).map((gov) => ({
      governorate: gov,
      price: egyptGovPrices[gov],
      isActive: true
    }));

    await Shipping.insertMany(data);

    res.json({
      message: "Shipping seeded successfully 🚀",
      count: data.length
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===========================
   GET ALL
=========================== */
const getAllShipping = async (req, res) => {
  try {
    const data = await Shipping.find();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ===========================
   CREATE / UPSERT
=========================== */
const upsertShipping = async (req, res) => {
  try {
    const { governorate, city, price, isActive  } = req.body;

    if (!governorate || !price) {
      return res.status(400).json({
        message: "Governorate and price are required",
      });
    }

    // 🔥 مهم: البحث بمحافظة + مدينة
    const shipping = await Shipping.findOneAndUpdate(
      { governorate, city }, 
      {
        governorate,
        city,
        price,
        isActive : isActive  !== undefined ? isActive  : true,
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.status(200).json(shipping);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ===========================
   UPDATE BY ID
=========================== */
const updateShipping = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Shipping.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Shipping not found",
      });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ===========================
   DELETE
=========================== */
const deleteShipping = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Shipping.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        message: "Shipping not found",
      });
    }

    res.status(200).json({
      message: "Deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  seedShipping,
  getAllShipping,
  upsertShipping,
  updateShipping,
  deleteShipping,
};