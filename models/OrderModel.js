const { Scheme, model, Schema } = require('mongoose')
const orderSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'product'
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    size: {
        required: false,
        type: String
    },
    color: {
        required: false,
        type: String
    },
    quantity: {
        required: true,
        type: Number
    },
    address: {
        required: true,
        type: Map
    },
    status: {
        default: false,
        type: Boolean
    },
    received: {
        default: false,
        type: Boolean
    },
    review: {
        default: false,
        type: Boolean
    }
}, { timestamps: true });

const OrderModel = model('order', orderSchema);
module.exports = OrderModel;