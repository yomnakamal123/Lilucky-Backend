const express = require('express');
const router = express.Router();

const ProductController = require('../Controllers/product.controller');
const verifyToken = require('../Middlewares/verifyToken');
const allowedTo = require('../allowedTo');
const userRoles = require('../user.roles');
const upload = require('../Middlewares/uploadImage');
const isAdmin = require('../Middlewares/isAdmin');


// Public
router.get('/get-all-products', ProductController.getAllProducts);
// Admin

router.patch('/assign-category',verifyToken,isAdmin,ProductController.assignCategoryToProduct);

router.post(
  '/add-product',
  verifyToken,
  allowedTo(userRoles.ADMIN),
  upload.any(), 
  ProductController.createProduct
);


//delete wishlist
router.get('/wishlist', verifyToken, ProductController.getWishlist);
router.post('/wishlist/merge', verifyToken, ProductController.mergeWishlist);
router.get('/get/:id', ProductController.getProductById);

// handle like product
router.patch('/like/:id',verifyToken, ProductController.likeProduct);

router.patch(
  '/update/:id',
  verifyToken,
  allowedTo(userRoles.ADMIN),
  upload.any(),
  ProductController.updateProduct
);
router.patch('/restore/:id',verifyToken,allowedTo(userRoles.ADMIN),ProductController.restoreProduct);

router.delete('/:id',verifyToken,allowedTo(userRoles.ADMIN),ProductController.deleteProduct);




module.exports = router;
