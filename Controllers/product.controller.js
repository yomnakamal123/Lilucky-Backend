const mongoose = require('mongoose');
const Product = require('../Models/Product.model');
const Category = require('../Models/Category.model');
const httpStatusText = require('../httpStatusText');
const asyncwrapper = require('../asyncwrapper');
const appError = require('../appError');
const userRoles = require('../user.roles');
const fs = require('fs');
const path = require('path');
const upload = require('../Middlewares/uploadImage');
const Wishlist = require('../Models/Wishlist.model');
const cloudinary = require("../config/cloudinary");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
/* ===========================
   PUBLIC FUNCTIONS
=========================== */

const getAllProducts = asyncwrapper(async (req, res, next) => {
  const products = await Product.find({ isActive: true });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    results: products.length,
    data: products
  });
});


//* ===========================
//*    GET PRODUCT BY ID
//* ===========================
const getProductById = asyncwrapper(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('category'); 

  if (!product || !product.isActive) {
    return next(
      appError.create('Product not found', 404, httpStatusText.FAIL)
    );
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: product
  });
});

/* ===========================
   create FUNCTIONS
=========================== */

const createProduct = asyncwrapper(async (req, res) => {
  try {
    let variants = [];
    try {
      if (req.body.variants) {
        variants =
          typeof req.body.variants === "string"
            ? JSON.parse(req.body.variants)
            : req.body.variants;
      }
    } catch (err) {
      return res.status(400).json({
        message: "Invalid variants format",
      });
    }

    if (!Array.isArray(variants)) {
      return res.status(400).json({
        message: "Variants must be an array",
      });
    }

    const files = req.files || [];
    const filesMap = {};

    for (const file of files) {
      if (!filesMap[file.fieldname]) {
        filesMap[file.fieldname] = [];
      }
      filesMap[file.fieldname].push(file);
    }

    // ================= UPLOAD IMAGES =================
    const formattedVariants = await Promise.all(
      variants.map(async (v, i) => {
        const key = `variants[${i}][images]`;

        const imagesFiles = filesMap[key] || [];

        const uploadedImages = await Promise.allSettled(
          imagesFiles.map(async (file) => {
            if (!file?.buffer) {
              throw new Error("File buffer missing");
            }

            const result = await uploadToCloudinary(file.buffer);
            return result.secure_url;
          })
        );

        const urls = uploadedImages
          .filter((r) => r.status === "fulfilled")
          .map((r) => r.value);

        return {
          color: v?.color || "",
          sizes: Array.isArray(v?.sizes) ? v.sizes : [],
          images: urls,
        };
      })
    );

    // ================= CREATE PRODUCT =================
    const product = await Product.create({
      name: req.body.name,
      gender: req.body.gender,
      category: req.body.category,
      material: req.body.material,
      description: req.body.description,

      main_price: Number(req.body.main_price || 0),
      price: Number(req.body.price || 0),
      stock: Number(req.body.stock || 0),

      variants: formattedVariants,
    });

    return res.status(201).json({
      status: "success",
      data: product,
    });

  } catch (err) {
    console.error("CREATE PRODUCT ERROR:", err);

    return res.status(500).json({
      status: "error",
      message: err.message || "Internal Server Error",
    });
  }
});

///* ===========================
//  PATCH /api/products/:id
//=========================== */


const updateProduct = asyncwrapper(async (req, res, next) => {
  const productId = req.params.id;

  /* ================= VALIDATE ID ================= */
  if (!productId) {
    return next(
      appError.create('Product ID is required', 400, httpStatusText.FAIL)
    );
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return next(
      appError.create('Invalid product ID', 400, httpStatusText.FAIL)
    );
  }

  const product = await Product.findById(productId);

  if (!product) {
    return next(
      appError.create('Product not found', 404, httpStatusText.FAIL)
    );
  }

  /* ================= CLEAN BODY ================= */
  const fieldsToUpdate = {};

  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach((key) => {
      const value = req.body[key];

      if (value !== undefined && value !== null && value !== '') {
        fieldsToUpdate[key] = value;
      }
    });
  }

  /* ================= FIX FORM-DATA ARRAYS (IMPORTANT) ================= */

  // 🔥 variants fix (main issue you had)
  if (fieldsToUpdate.variants) {
    try {
      fieldsToUpdate.variants =
        typeof fieldsToUpdate.variants === 'string'
          ? JSON.parse(fieldsToUpdate.variants)
          : fieldsToUpdate.variants;
    } catch (err) {
      return next(
        appError.create('Invalid variants format', 400, httpStatusText.FAIL)
      );
    }
  }

  /* ================= NORMALIZE NUMBERS ================= */
  const numericFields = ['stock', 'price', 'main_price'];

  numericFields.forEach((field) => {
    if (fieldsToUpdate[field] !== undefined) {
      const value = Number(fieldsToUpdate[field]);

      if (Number.isNaN(value)) {
        return next(
          appError.create(`${field} must be a valid number`, 400, httpStatusText.FAIL)
        );
      }

      fieldsToUpdate[field] = value;
    }
  });

  /* ================= NORMALIZE ARRAYS ================= */
  const arrayFields = ['sizes', 'colors'];

  arrayFields.forEach((field) => {
    if (fieldsToUpdate[field] !== undefined) {
      if (typeof fieldsToUpdate[field] === 'string') {
        fieldsToUpdate[field] = fieldsToUpdate[field]
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }

      if (!Array.isArray(fieldsToUpdate[field])) {
        return next(
          appError.create(`${field} must be an array`, 400, httpStatusText.FAIL)
        );
      }
    }
  });

  /* ================= HANDLE IMAGES ================= */
  if (req.files?.length) {
    const oldImages = product.images || [];

    for (const imgPath of oldImages) {
      try {
        const fullPath = path.join(__dirname, '..', imgPath);

        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (err) {
        console.log('Image delete error:', err.message);
      }
    }

    fieldsToUpdate.images = req.files.map(
      (file) => `/uploads/products/${file.filename}`
    );
  }

  /* ================= CHECK EMPTY UPDATE ================= */
  if (Object.keys(fieldsToUpdate).length === 0) {
    return next(
      appError.create('No valid fields to update', 400, httpStatusText.FAIL)
    );
  }

  /* ================= UPDATE ================= */
  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    { $set: fieldsToUpdate },
    {
      new: true,
      runValidators: true,
      strict: false
    }
  );

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: updatedProduct,
  });
});


/* ===========================
   DELETE /api/products/:id
=========================== */


const deleteProduct = asyncwrapper(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return next(
      appError.create('Product not found', 404, httpStatusText.FAIL)
    );
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: 'Product deleted successfully'
  });
});

const assignCategoryToProduct = asyncwrapper(async (req, res, next) => {
  const { productId, categoryId } = req.body;

  const category = await Category.findById(categoryId);
  if (!category || !category.isActive) {
    return next(appError.create('Category not found or inactive', 404));
  }

  const product = await Product.findByIdAndUpdate(
    productId,
    { category: categoryId },
    { new: true }
  ).populate('category');

  if (!product) {
    return next(appError.create('Product not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { product }
  });
});

/* ===========================
  PATCH /api/products/:id/like
=========================== */

const likeProduct = asyncwrapper(async (req, res, next) => {

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = req.user._id;
  const { id: productId } = req.params;

  const existing = await Wishlist.findOne({ userId, productId });

  if (existing) {
    await existing.deleteOne();
    return res.json({ like: false });
  }

  await Wishlist.create({ userId, productId });

  res.json({ like: true });
});


///* ===========================
//  OTHER FUNCTIONS
//=========================== */
// GET /api/products/wishlist
const getWishlist = asyncwrapper(async (req, res, next) => {
  const userId = req.user._id;
  const wishlistItems = await Wishlist.find({ userId }).populate("productId");

  const products = wishlistItems
    .map(item => item.productId)
    .filter(Boolean)
    .map(product => ({
      ...product.toObject(),
      like: true, // مهم عشان CardItem يقرأها
    }));

  res.status(200).json({
    success: true,
    data: products,
  });
});


const mergeWishlist = asyncwrapper(async (req, res) => {
  const userId = req.user._id;
  const { productIds } = req.body;

  for (const productId of productIds) {
    const exists = await Wishlist.findOne({ userId, productId });
    if (!exists) {
      await Wishlist.create({ userId, productId });
    }
  }
  res.json({ message: "Wishlist merged" });
});
module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  assignCategoryToProduct,
  likeProduct,
  getWishlist,
  mergeWishlist

};
