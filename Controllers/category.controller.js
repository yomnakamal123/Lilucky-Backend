const Category = require('../Models/Category.model');
const asyncwrapper = require('../asyncwrapper');
const appError = require('../appError');
const slugify = require('slugify');




const getCategoryNames = asyncwrapper(async (req, res) => {
  const lang = req.query.lang === 'ar' ? 'arName' : 'enName';

  const categories = await Category.find({ isActive: true }).select(`${lang} _id`);

  const categoryNames = categories.map(cat => ({
    _id: cat._id,
    name: cat[lang]
  }));

  res.status(200).json({
    status: 'success',
    data: { categoryNames }
  });
});

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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
  const { arName, enName, categoryType } = req.body;

  const category = await Category.create({
    arName,
    enName,
    categoryType
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
  getCategoryNames,
  getCategoryById,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};

