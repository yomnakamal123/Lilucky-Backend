const express = require('express');
const router = express.Router();

const ProductController = require('../Controllers/product.controller');
const verifyToken = require('../Middlewares/verifyToken');
const allowedTo = require('../allowedTo');
const userRoles = require('../user.roles');
const upload = require('../Middlewares/uploadImage');
const isAdmin = require('../Middlewares/isAdmin');


router.get('/get-all', ProductController.getAllProducts);
// Public
router.get('/get-all-products', ProductController.getAllProducts);


// Admin

router.patch('/assign-category',verifyToken,isAdmin,ProductController.assignCategoryToProduct);


// images = field name
router.post(
  '/add-product',
  verifyToken,
  allowedTo(userRoles.ADMIN),
  upload.any(), 
  ProductController.createProduct
);

router.patch('/:id', verifyToken, isAdmin, upload.any(), ProductController.updateProduct);

router.delete('/:id',verifyToken,allowedTo(userRoles.ADMIN),ProductController.deleteProduct);

// Public
router.get('/:id', ProductController.getProductById);
router.get('/get/:id', ProductController.getProductById);

// handle like product
router.patch('/like/:id', ProductController.likeProduct);

//delete wishlist
router.get('/wishlist', ProductController.getWishlist);

module.exports = router;
