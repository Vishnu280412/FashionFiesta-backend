const { body } = require("express-validator");

module.exports = [
    body('title').not().isEmpty().trim().escape().withMessage('Title is required!!'),
    body('price').custom((value) => {
        if(parseInt(value) < 1) {
            throw new Error('Price should be more than ₹1!!');
        } else {
            return true;
        }
    }).trim().escape(),
    body('discount').custom((value) => {
        if(parseInt(value) < 0) {
            throw new Error('Discount should not be negative!!');
        } else if(parseInt(value) > 100) {
            throw new Error('Discount should not exceed 100!!');
        } else {
            return true;
        }
    }).trim().escape(),
    body('category').not().isEmpty().trim().escape().withMessage('Category is required!!'),
    body('description').not().isEmpty().trim().escape().withMessage('Description is required!!'),
    body('stock').custom((value) => {
        if(parseInt(value) < 0) {
            throw new Error('Stock should not be negative!!');
        } else {
            return true;
        }
    }).trim().escape()
]
