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

// const createProduct = asyncwrapper(async (req, res) => {
//   try {
//     let variants = [];
//     try {
//       if (req.body.variants) {
//         variants =
//           typeof req.body.variants === "string"
//             ? JSON.parse(req.body.variants)
//             : req.body.variants;
//       }
//     } catch (err) {
//       return res.status(400).json({
//         message: "Invalid variants format",
//       });
//     }

//     if (!Array.isArray(variants)) {
//       return res.status(400).json({
//         message: "Variants must be an array",
//       });
//     }

//     const files = req.files || [];
//     const filesMap = {};

//     for (const file of files) {
//       if (!filesMap[file.fieldname]) {
//         filesMap[file.fieldname] = [];
//       }
//       filesMap[file.fieldname].push(file);
//     }

//     // ================= UPLOAD IMAGES =================
//     const formattedVariants = await Promise.all(
//       variants.map(async (v, i) => {
//         const key = `variants[${i}][images]`;

//         const imagesFiles = filesMap[key] || [];

//         const uploadedImages = await Promise.allSettled(
//           imagesFiles.map(async (file) => {
//             if (!file?.buffer) {
//               throw new Error("File buffer missing");
//             }

//             const result = await uploadToCloudinary(file.buffer);
//             return result.secure_url;
//           })
//         );

//         const urls = uploadedImages
//           .filter((r) => r.status === "fulfilled")
//           .map((r) => r.value);

//         return {
//           color: v?.color || "",
//           sizes: Array.isArray(v?.sizes) ? v.sizes : [],
//           images: urls,
//         };
//       })
//     );

//     // ================= CREATE PRODUCT =================

//     const product = await Product.create({
//       name: {
//         en: req.body.name_en,
//         ar: req.body.name_ar,
//       },

//       description: {
//         en: req.body.description_en,
//         ar: req.body.description_ar,
//       },

//       gender: req.body.gender,

//       category: req.body.category,

//       material: req.body.material,

//       main_price: Number(req.body.main_price || 0),

//       price: Number(req.body.price || 0),

//       stock: Number(req.body.stock || 0),

//       variants: formattedVariants,
//     });

//     return res.status(201).json({
//       status: "success",
//       data: product,
//     });

//   } catch (err) {
//     console.error("CREATE PRODUCT ERROR:", err);

//     return res.status(500).json({
//       status: "error",
//       message: err.message || "Internal Server Error",
//     });
//   }
// });


const createProduct = asyncwrapper(async (req, res) => {
  try {
    /* ================= VARIANTS PARSE ================= */

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

    /* ================= I18N PARSER HELPER ================= */

    const parseI18n = (value, fieldName) => {
      try {
        const data =
          typeof value === "string" ? JSON.parse(value) : value;

        if (!data?.en || !data?.ar) {
          throw new Error();
        }

        return data;
      } catch (err) {
        throw new Error(`Invalid ${fieldName} format`);
      }
    };

    /* ================= NAME / DESCRIPTION / MATERIAL ================= */

    let name, description, material;

    try {
      name = parseI18n(req.body.name, "name");
      description = parseI18n(req.body.description, "description");
      material = parseI18n(req.body.material, "material");
    } catch (err) {
      return res.status(400).json({
        message: err.message,
      });
    }

    /* ================= FILES GROUPING ================= */

    const files = req.files || [];
    const filesMap = {};

    for (const file of files) {
      if (!filesMap[file.fieldname]) {
        filesMap[file.fieldname] = [];
      }
      filesMap[file.fieldname].push(file);
    }

    /* ================= VARIANTS PROCESS ================= */

    const formattedVariants = await Promise.all(
      variants.map(async (v, i) => {
        const key = `variants[${i}][images]`;
        const imagesFiles = filesMap[key] || [];

        const uploadedImages = await Promise.allSettled(
          imagesFiles.map(async (file) => {
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

    /* ================= STOCK ================= */

    const stock = Number(req.body.stock || 0);

    /* ================= CREATE PRODUCT ================= */

    const product = await Product.create({
      name,
      description,
      material,

      gender: req.body.gender,
      category: req.body.category,

      main_price: Number(req.body.main_price || 0),
      price: Number(req.body.price || 0),

      stock,
      isActive: stock > 0,

      variants: formattedVariants,
    });

    /* ================= RESPONSE ================= */

    return res.status(201).json({
      status: "success",
      data: product,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});


///* ===========================
//  PATCH /api/products/:id
//=========================== */


const updateProduct = asyncwrapper(async (req, res, next) => {
  const productId = req.params.id;

  const product = await Product.findById(productId);

  if (!product) {
    return next(appError.create("Product not found", 404));
  }

  /* ================= PARSE VARIANTS ================= */

  let variants = [];

  if (req.body.variants) {
    try {
      variants =
        typeof req.body.variants === "string"
          ? JSON.parse(req.body.variants)
          : req.body.variants;
    } catch (err) {
      return next(appError.create("Invalid variants format", 400));
    }
  }

  /* ================= BUILD UPDATE OBJECT ================= */

  const fieldsToUpdate = {};

  /* ================= TEXT FIELDS ================= */

  const assignIfExists = (key, objKey) => {
    if (req.body[key]) {
      fieldsToUpdate[objKey] = req.body[key];
    }
  };

  if (req.body.name_en || req.body.name_ar) {
    fieldsToUpdate.name = {
      en: req.body.name_en || product.name.en,
      ar: req.body.name_ar || product.name.ar,
    };
  }

  if (req.body.description_en || req.body.description_ar) {
    fieldsToUpdate.description = {
      en: req.body.description_en || product.description.en,
      ar: req.body.description_ar || product.description.ar,
    };
  }

  if (req.body.material_en || req.body.material_ar) {
    fieldsToUpdate.material = {
      en: req.body.material_en || product.material.en,
      ar: req.body.material_ar || product.material.ar,
    };
  }

  /* ================= NUMBERS ================= */

  ["price", "stock", "main_price"].forEach((field) => {
    if (req.body[field] !== undefined) {
      const val = Number(req.body[field]);
      if (isNaN(val)) {
        return next(appError.create(`${field} must be number`, 400));
      }
      fieldsToUpdate[field] = val;
    }
  });

  /* ================= ACTIVE ================= */

  if (fieldsToUpdate.stock !== undefined) {
    fieldsToUpdate.isActive = fieldsToUpdate.stock > 0;
  }

  /* ================= FILES ================= */

  const files = Array.isArray(req.files) ? req.files : [];

  const filesMap = {};

  for (const file of files) {
    if (!filesMap[file.fieldname]) {
      filesMap[file.fieldname] = [];
    }
    filesMap[file.fieldname].push(file);
  }

  /* ================= VARIANTS (KEEP OLD + ADD NEW IMAGES) ================= */

  if (Array.isArray(variants)) {
    fieldsToUpdate.variants = variants.map((variant, index) => {
      const oldVariant =
        product.variants?.find((v) => v.color === variant.color) || {};

      const key = `variants[${index}][images]`;
      const newImages = filesMap[key] || [];

      let uploadedImages = [];

      if (newImages.length > 0) {
        uploadedImages = newImages
          .map((file) => file.buffer)
          .filter(Boolean);
      }

      return {
        ...oldVariant,
        ...variant,
        images: [
          ...(oldVariant.images || []),
          ...(variant.images || []),
          ...uploadedImages,
        ].filter(Boolean),
      };
    });
  }

  /* ================= UPDATE DB ================= */

  const updated = await Product.findByIdAndUpdate(
    productId,
    { $set: fieldsToUpdate },
    {
      new: true,
      runValidators: true,
    }
  );

  return res.status(200).json({
    status: "success",
    data: updated,
  });
});



/* ===========================
   DELETE /api/products/:id
=========================== */


// const deleteProduct = asyncwrapper(async (req, res, next) => {
//   const product = await Product.findByIdAndDelete(req.params.id);

//   if (!product) {
//     return next(
//       appError.create('Product not found', 404, httpStatusText.FAIL)
//     );
//   }

//   res.status(200).json({
//     status: httpStatusText.SUCCESS,
//     message: 'Product deleted successfully'
//   });
// });

/* ===========================
assignCategoryToProduct
=========================== */

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

const deleteProduct = asyncwrapper(async (req, res, next) => {

  const product = await Product.findById(req.params.id);

  if (!product) {

    return next(
      appError.create(
        'Product not found',
        404,
        httpStatusText.FAIL
      )
    );
  }

  product.isDeleted = true;

  product.isActive = false;

  await product.save();

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: 'Product deleted successfully'
  });
});

/* ===========================
  restor /api/products/:id/like
=========================== */
const restoreProduct = asyncwrapper(async (req, res) => {

  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      message: "Product not found"
    });
  }

  product.isDeleted = false;

  product.isActive = product.stock > 0;

  await product.save();

  res.json({
    message: "Product restored",
    data: product
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
  restoreProduct,
  assignCategoryToProduct,
  likeProduct,
  getWishlist,
  mergeWishlist

};
