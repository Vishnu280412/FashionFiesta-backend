const { body } = require("express-validator");

module.exports = [
    body('uid').not().isEmpty().trim().escape().withMessage('User ID is required!!')
]
