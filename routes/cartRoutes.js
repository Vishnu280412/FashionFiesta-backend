const express = require("express");
const router = express.Router();
const cartValidations = require("../validations/cartValidations");
const Category = require("../controllers/Cart");
const Authorization = require("../services/Authorization");

router.post('/create-category', [cartValidations, Authorization.authorized], Cart.create);
router.get("/categories/:page", Authorization.authorized, Cart.categories);
router.get("/fetch-category/:id", Authorization.authorized, Cart.fetchCart);
router.put("/update-category/:id", [cartValidations, Authorization.authorized], Cart.updateCart);
router.delete("/delete-category/:id", Authorization.authorized, Cart.deleteCart);
// router.get("/allcategories", Cart.allCategories);
// router.get('/random-categories', Category.randomCategories);
module.exports = router;