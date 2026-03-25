const express = require('express');
const router = express.Router();
const verifyToken = require('../Middlewares/verifyToken');
const isAdmin = require('../Middlewares/isAdmin');
const categorycontroller=require('../Controllers/category.controller')
;


router.get('/names',categorycontroller.getCategoryNames);
// Public
router.get('/get-all',categorycontroller.getAllCategories);

// Admin
router.post('/add-category', verifyToken, isAdmin,categorycontroller.createCategory);
router.patch('/:id', verifyToken, isAdmin, categorycontroller.updateCategory);
router.delete('/:id', verifyToken, isAdmin, categorycontroller.deleteCategory);

module.exports = router;
