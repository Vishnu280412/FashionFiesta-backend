const mongoose = require("mongoose");
const productSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    colors: {
        type: [Map]
    },
    sizes: {
        type: [Map]
    },
    image1: {
        type: String,
        required: true
    },
    image2: {
        type: String,
        required: true
    },
    image3: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    reviews: [{ type: mongoose.Types.ObjectId, ref: "review" }]
}, {timestamps: true})

module.exports = mongoose.model("product", productSchema);