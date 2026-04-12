const mongoose = require('mongoose');
const Product=require('../Models/Product.model');
const Category=require('../Models/Category.model');
const httpStatusText = require('../httpStatusText');
const asyncwrapper = require('../asyncwrapper');
const appError = require('../appError');
const userRoles=require('../user.roles');
const fs = require('fs');
const path = require('path');
const upload = require('../Middlewares/uploadImage');
const Wishlist = require('../Models/Wishlist.model');
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

const getProductById = asyncwrapper(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

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
   ADMIN FUNCTIONS
=========================== */

// const createProduct = asyncwrapper(async (req, res, next) => {
//   const images = req.files
//     ? req.files.map(file => `/uploads/products/${file.filename}`)
//     : [];

//   const product = await Product.create({
//     ...req.body,
//     images
//   });

//   res.status(201).json({
//     status: httpStatusText.SUCCESS,
//     data: product
//   });
// });

const createProduct = asyncwrapper(async (req, res, next) => {
  const variants = req.body.variants ? JSON.parse(req.body.variants) : [];

  const files = req.files || [];

  const baseUrl = `${req.protocol}://${req.get('host')}`;

  // نحول files لـ object علشان نقدر نوصل بسهولة
  const filesMap = {};

  files.forEach((file) => {
    if (!filesMap[file.fieldname]) {
      filesMap[file.fieldname] = [];
    }
    filesMap[file.fieldname].push(file);
  });

  const formattedVariants = variants.map((variant, index) => {
    const key = `variants[${index}][images]`;
    const variantImages = filesMap[key] || [];
    return {
      color: variant.color,
      sizes: variant.sizes || [],
      images: variantImages.map(
        f => `${baseUrl}/uploads/products/${f.filename}`
      ),
    };
  });

  const product = await Product.create({
    ...req.body,
    variants: formattedVariants,
  });

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: product,
  });
});

const updateProduct = asyncwrapper(async (req, res, next) => {
  const productId = req.params.id;

  const product = await Product.findById(productId);
  if (!product) {
    return next(
      appError.create('Product not found', 404, httpStatusText.FAIL)
    );
  }

  const fieldsToUpdate = req.body;

  // Fix sizes if sent as string
  if (typeof fieldsToUpdate.sizes === 'string') {
    fieldsToUpdate.sizes = fieldsToUpdate.sizes.split(',');
  }

  if (typeof fieldsToUpdate.colors === 'string') {
    fieldsToUpdate.colors = fieldsToUpdate.colors.split(',');
  }

  // 2️⃣ If new images uploaded → delete old images
  if (req.files && req.files.length > 0) {
    product.images.forEach((imgPath) => {
      const fullPath = path.join(__dirname, '..', imgPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

    // save new images paths
    fieldsToUpdate.images = req.files.map(
      (file) => `/uploads/products/${file.filename}`
    );
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    fieldsToUpdate,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: updatedProduct,
  });
});

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
