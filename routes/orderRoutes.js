const { Router } = require('express');
const Orders = require('../controllers/Orders');
const Authorization = require('../services/Authorization');
const ClientAuthorization = require('../services/ClientAuthorization');
const ratingValidations = require('../validations/ratingValidations');
const router = Router();
router.get('/orders', Orders.getOrders);
router.get('/order-details/:id', Orders.getOrderDetails);
router.put('/order-status', Orders.updateOrderStatus);
router.post('/add-review', ratingValidations, Orders.createRating);
module.exports = router;