const mongoose = require("mongoose");

const cartSchema = mongoose.Schema({
    uid: {
        required: true,
        type: String
    },
    products: {
        type: [Map]
    }
});

module.exports = mongoose.model("cart", cartSchema);