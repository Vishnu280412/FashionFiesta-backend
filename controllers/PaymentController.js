const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');
const User = require('../models/user');
const OrderModel = require('../models/OrderModel');
const ProductModel = require('../models/ProductModel');
class PaymentController {
    normalizeCart(cart = []) {
        if(!Array.isArray(cart) || cart.length === 0) {
            throw new Error('Cart is empty.');
        }

        return cart.map((item) => {
            const quantity = parseInt(item?.quantity, 10);
            const productId = item?._id?.toString?.();
            if(!productId || !mongoose.Types.ObjectId.isValid(productId)) {
                throw new Error('Cart has an invalid product.');
            }
            if(!Number.isInteger(quantity) || quantity < 1) {
                throw new Error('Cart has an invalid quantity.');
            }

            return {
                productId,
                size: item?.size || false,
                color: item?.color || false,
                quantity
            };
        });
    }

    collectRequestedQuantities(cartItems) {
        return cartItems.reduce((acc, item) => {
            const currentValue = acc.get(item.productId) || 0;
            acc.set(item.productId, currentValue + item.quantity);
            return acc;
        }, new Map());
    }

    async paymentProcess (req, res) {
        try {
            const { cart } = req.body;
            const userId = req?.user?.id;
            if(!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(401).json({errors: [{msg: 'Unauthorized request.'}]});
            }

            const user = await User.findOne({_id: userId});
            if(!user){
                return res.status(400).json({error: "User does not exist."});
            }

            let normalizedCart = [];
            try {
                normalizedCart = this.normalizeCart(cart);
            } catch (error) {
                return res.status(400).json({errors: [{msg: error.message}]});
            }

            const productIds = [...new Set(normalizedCart.map(item => item.productId))];
            const products = await ProductModel.find({_id: {$in: productIds}});
            const productMap = new Map(products.map(product => [product._id.toString(), product]));

            if(productMap.size !== productIds.length) {
                return res.status(400).json({errors: [{msg: 'Some products in your cart are no longer available.'}]});
            }

            const requestedQuantities = this.collectRequestedQuantities(normalizedCart);
            const unavailableItems = [];
            for(const [productId, requestedQuantity] of requestedQuantities.entries()) {
                const product = productMap.get(productId);
                if(product && product.stock < requestedQuantity) {
                    unavailableItems.push({
                        productId,
                        productTitle: product.title,
                        availableStock: product.stock,
                        requestedQuantity
                    });
                }
            }

            if(unavailableItems.length > 0) {
                return res.status(409).json({
                    errors: [{msg: 'Some items exceed available stock. Please update your cart and try again.'}],
                    unavailableItems
                });
            }

            const orderData = normalizedCart.map(item => {
                return {
                    _id: item.productId,
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity
                };
            });

            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    cart: JSON.stringify(orderData),
                    userId: user._id.toString(),
                },
            });

            const session = await stripe.checkout.sessions.create({
              shipping_address_collection: {
                allowed_countries: ['IN', 'PK', 'CA', 'US'],
              },
              shipping_options: [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: {amount: 0, currency: 'inr'},
                        display_name: 'Free shipping',
                        delivery_estimate: {
                        minimum: {unit: 'business_day', value: 5},
                        maximum: {unit: 'business_day', value: 7},
                        },
                    }
                }
              ],
            line_items: normalizedCart.map((item) => {
                const product = productMap.get(item.productId);
                const percentage = product.discount / 100;
                let actualPrice = product.price - (product.price * percentage);
                actualPrice = parseFloat(actualPrice.toFixed(1));
                return {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: product.title,
                        },
                        unit_amount: Math.round(actualPrice * 100)
                    },
                    quantity: item.quantity
                };
            }),
              customer: customer.id,
              mode: 'payment',
              success_url: `${process.env.CLIENT_URL}/user?session_id={CHECKOUT_SESSION_ID}`,
              cancel_url: `${process.env.CLIENT_URL}/cart`,
            });

            return res.json({url: session.url});
        } catch (error) {
            console.log(error.message);
            return res.status(500).json({errors: [{msg: 'Unable to start checkout. Please try again.'}]});
        }
    }
    
    async checkOutSession(request, response){
        const sig = request.headers['stripe-signature'];
      
        let event;
      
        try {
          const rawPayload = request.rawBody || request.body;
          event = stripe.webhooks.constructEvent(
            rawPayload,
            sig,
            process.env.ENDPOINT_SECRET
          );
        } catch (err) {
          console.log(err.message);
          response.status(400).send(`Webhook Error: ${err.message}`);
          return;
        }
      
        // Handle the event
        switch (event.type) {
          case 'payment_intent.succeeded':
            const paymentIntentSucceeded = event.data.object;
            // Then define and call a function to handle the event payment_intent.succeeded
            break;
          case 'checkout.session.completed':
            const checkoutSessionCompleted = event.data.object;
            if(checkoutSessionCompleted?.payment_status !== 'paid') {
                break;
            }

            try {
                const sessionAlreadyProcessed = await OrderModel.findOne({checkoutSessionId: checkoutSessionCompleted.id});
                if(sessionAlreadyProcessed) {
                    break;
                }

                const customer = await stripe.customers.retrieve(checkoutSessionCompleted.customer);
                const userId = customer?.metadata?.userId;
                if(!mongoose.Types.ObjectId.isValid(userId)) {
                    throw new Error('Invalid user in checkout metadata.');
                }

                let metadataCart = [];
                try {
                    metadataCart = customer?.metadata?.cart ? JSON.parse(customer.metadata.cart) : [];
                } catch (error) {
                    throw new Error('Invalid cart metadata in checkout session.');
                }

                const normalizedCart = this.normalizeCart(metadataCart);
                const requestedQuantities = this.collectRequestedQuantities(normalizedCart);
                const decrementedProducts = [];
                const createdOrders = [];

                try {
                    for(const [productId, quantity] of requestedQuantities.entries()) {
                        const updatedProduct = await ProductModel.findOneAndUpdate(
                            {_id: productId, stock: {$gte: quantity}},
                            {$inc: {stock: -quantity}},
                            {new: true}
                        );

                        if(!updatedProduct) {
                            throw new Error(`Insufficient stock for product ${productId}`);
                        }
                        decrementedProducts.push({productId, quantity});
                    }

                    for(const item of normalizedCart) {
                        const existingReviewedOrder = await OrderModel
                            .findOne({productId: item.productId, userId})
                            .where('review')
                            .equals(true);

                        const createdOrder = await OrderModel.create({
                            checkoutSessionId: checkoutSessionCompleted.id,
                            productId: item.productId,
                            userId,
                            size: item.size,
                            color: item.color,
                            quantity: item.quantity,
                            address: checkoutSessionCompleted?.customer_details?.address || {},
                            review: !!existingReviewedOrder
                        });

                        createdOrders.push(createdOrder._id);
                    }
                } catch (error) {
                    if(createdOrders.length > 0) {
                        await OrderModel.deleteMany({_id: {$in: createdOrders}});
                    }
                    if(decrementedProducts.length > 0) {
                        await Promise.all(
                            decrementedProducts.map((item) => ProductModel.updateOne(
                                {_id: item.productId},
                                {$inc: {stock: item.quantity}}
                            ))
                        );
                    }
                    throw error;
                }
            } catch (error) {
                console.log(error.message + " error while processing checkout session");
                return response.status(500).json('Server internal error');
            }
            break;
          default:
            console.log(`Unhandled event type ${event.type}`);
        }
      
        // Return a 200 response to acknowledge receipt of the event
        response.send();
    }
    async paymentVerification(req, res) {
      const { id } = req.params;
      try {
        const session = await stripe.checkout.sessions.retrieve(id);
        const isPaid = session.payment_status === 'paid';
        return res.status(200).json({
          msg: isPaid ? 'Payment has been verified successfully!!' : 'Payment is not completed.',
          status: session.payment_status
        });
      } catch (error) {
        return res.status(500).json(error.message);
      }
    }

}

module.exports = new PaymentController();
