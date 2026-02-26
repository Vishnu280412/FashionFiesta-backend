const { model, Schema } = require('mongoose')
const orderSchema = new Schema({
    checkoutSessionId: {
        required: false,
        type: String
    },
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

orderSchema.index(
    { checkoutSessionId: 1, productId: 1, userId: 1, size: 1, color: 1 },
    { unique: true, sparse: true }
);

const OrderModel = model('order', orderSchema);
module.exports = OrderModel;
