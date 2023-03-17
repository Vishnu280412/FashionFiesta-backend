const express = require("express");
const router = express.Router();
const CustomersController = require("../controllers/CustomersController");
const Authorization = require("../services/Authorization");

router.get('/users/:page', Authorization.authorized, CustomersController.get);
router.put('/edit-user/:id', Authorization.authorized, CustomersController.updateUserRole);
router.delete('/delete-user/:id', Authorization.authorized, CustomersController.removeUser);

module.exports = router;