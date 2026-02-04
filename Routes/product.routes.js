const express = require('express');
const router = express.Router();

const ProductController = require('../Controllers/product.controller');
const verifyToken = require('../Middlewares/verifyToken');
const allowedTo = require('../allowedTo');
const userRoles = require('../user.roles');
const upload = require('../Middlewares/uploadImage');
const isAdmin = require('../Middlewares/isAdmin');


// Public
router.get('/', ProductController.getAllProducts);


// Admin

router.patch('/assign-category',verifyToken,isAdmin,ProductController.assignCategoryToProduct);


// images = field name
router.post('/add-product',verifyToken,allowedTo(userRoles.ADMIN), upload.array('images', 5),ProductController.createProduct);


router.patch('/:id', verifyToken, isAdmin, upload.array('images', 5), ProductController.updateProduct);

router.delete('/:id',verifyToken,allowedTo(userRoles.ADMIN),ProductController.deleteProduct);

// Public
router.get('/:id', ProductController.getProductById);


module.exports = router;
