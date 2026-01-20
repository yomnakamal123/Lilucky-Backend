const Category = require('../Models/Category.model');
const asyncwrapper = require('../asyncwrapper');
const appError = require('../appError');
const slugify = require('slugify');


/* ===========================
   PUBLIC FUNCTIONS
=========================== */

const getAllCategories = asyncwrapper(async (req, res) => {
  const categories = await Category.find({ isActive: true });

  res.status(200).json({
    status: 'success',
    data: { categories }
  });
});


/* ===========================
   ADMIN FUNCTIONS
=========================== */

const createCategory = asyncwrapper(async (req, res, next) => {
  const { name, description } = req.body;

  const category = await Category.create({
    name,
    slug: slugify(name),
    description
  });
  res.status(201).json({
    status: 'success',
    data: { category }
  });
});

const updateCategory = asyncwrapper(async (req, res, next) => {
  const { id } = req.params;

  const category = await Category.findByIdAndUpdate(
    id,
    {
      ...req.body,
      slug: req.body.name ? slugify(req.body.name) : undefined
    },
    { new: true }
  );

  if (!category) {
    return next(appError.create('Category not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { category }
  });
});

//SOFT DELETE
const deleteCategory = asyncwrapper(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!category) {
    return next(appError.create('Category not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Category deactivated'
  });
});

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};

