const express = require('express');
const PaymentController = require('../controllers/PaymentController');
const ClientAuthorization = require('../services/ClientAuthorization');
const router = express.Router();

router.post('/create-checkout-session', ClientAuthorization.authorize, PaymentController.paymentProcess);

// router.post('/webhook', 
//     ClientAuthorization.authorize,
//     express.raw({type: 'application/json'}), 
//     PaymentController.checkOutSession
// );
router.post('/webhook', 
    express.raw({type: 'application/json'}), 
    PaymentController.checkOutSession
);

router.get('/verify-payment/:id', ClientAuthorization.authorize, PaymentController.paymentVerification);

module.exports = router;