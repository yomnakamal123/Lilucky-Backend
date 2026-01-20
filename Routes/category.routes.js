const express = require('express');
const router = express.Router();
const verifyToken = require('../Middlewares/verifyToken');
const isAdmin = require('../Middlewares/isAdmin');
const categorycontroller=require('../Controllers/category.controller')
;



// Public
router.get('/',categorycontroller.getAllCategories);

// Admin
router.post('/', verifyToken, isAdmin,categorycontroller.createCategory);
router.patch('/:id', verifyToken, isAdmin, categorycontroller.updateCategory);
router.delete('/:id', verifyToken, isAdmin, categorycontroller.deleteCategory);

module.exports = router;
