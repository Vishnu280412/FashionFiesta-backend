const formidable = require('formidable');
const path = require("path");
const { validationResult } = require("express-validator");
const ProductModel = require("../models/ProductModel");

class Product {
    async create(req, res) {
        const form = formidable({ multiples: true });
        form.parse(req, async (err, fields, files) => {
            if(!err) {
                const parsedData = JSON.parse(fields.data);
                const images = [parsedData.image1, parsedData.image2, parsedData.image3];
                const errors = [];
                if(parsedData.title.trim().length === 0) {
                    errors.push({msg: 'Title is required!!'});
                }
                if(parseInt(parsedData.price) < 1) {
                    errors.push({msg: 'Price should be above ₹1!!'});
                }
                if(parseInt(parsedData.discount) < 0) {
                    errors.push({msg: 'Discount should not be negative!!'});
                }
                if(parseInt(parsedData.discount) > 100) {
                    errors.push({msg: 'Discount should not exceed 100!!'});
                }
                if(parseInt(parsedData.stock) < 20) {
                    errors.push({msg: 'Stock should be more than 20!!'});
                }
                if(parsedData.category.trim().length === 0) {
                    errors.push({msg: 'Category must be selected!!'});
                }
                if(fields.description.trim().length === 0) {
                    errors.push({msg: 'Description is required!!'});
                }
                if(errors.length === 0) {   
                    if(parsedData.image1.trim().length === 0) {
                        errors.push({msg: "Image1 is required!!"});
                    }
                    if(parsedData.image2.trim().length === 0) {
                        errors.push({msg: "Image2 is required!!"});
                    }
                    if(parsedData.image3.trim().length === 0) {
                        errors.push({msg: "Image3 is required!!"});
                    }
                    if(errors.length === 0) {
                        for(let i = 0; i < images.length; i++) {
                            const data = images[i];
                            const extension = data.split('/')[1].split(';')[0];
                            if(extension === 'jpeg' || extension === 'jpg' || extension === 'png') {
                            } else {
                                const error = {};
                                error['msg'] = `image${i+1} has extension ${extension} and is invalid!!`;
                                errors.push(error);
                            }
                        }
                        if(errors.length === 0) {
                            try {
                                const response = await ProductModel.create({
                                    title: parsedData.title,
                                    price: parseInt(parsedData.price),
                                    discount: parseInt(parsedData.discount),
                                    stock: parseInt(parsedData.stock),
                                    category: parsedData.category,
                                    colors: parsedData.colors,
                                    sizes: JSON.parse(fields.sizes),
                                    image1: images[0],
                                    image2: images[1],
                                    image3: images[2],
                                    description: fields.description
                                });
                                return res.status(201).json({msg: "Product has been created successfully!!", response});
                            } catch (error) {
                                return res.status(500).json({error: error.message});
                            }
                        } else {
                            return res.status(400).json({errors});
                        }
                    } else {
                        return res.status(400).json({errors});    
                    }
                } else {
                    return res.status(400).json({errors});
                }
            }
        })
    }

    async get(req, res) {
        const {page} = req.params;
        const perPage = 4;
        const skip = (page - 1) * perPage;
        try {
            const count = await ProductModel.find({}).countDocuments();
            const response = await ProductModel.find({}).skip(skip).limit(perPage).sort({updatedAt: -1});
            return res.status(200).json({products: response, perPage, count});
        } catch (error) {
            console.log(error.message);
            return res.status(500).json({error: error.message});
        }
    }

    async getProduct(req, res) {
        const {id} = req.params;
        try {
            const product = await ProductModel.findOne({_id: id});
            return res.status(200).json(product);
        } catch (error) {
            console.log(error.message);
            return res.status(500).json({error: error.message});
        }
    }

    async updateProduct(req, res) {
        const errors = validationResult(req);
        if(errors.isEmpty()) {
            try {
                const { _id, title, price, discount, stock, colors, sizes, description, category } = req.body;
                const response = await ProductModel.updateOne({_id}, {$set: {title, price, discount, stock, colors, sizes, description, category}});
                return res.status(200).json({msg: "Product has been updated successfully!!", response});
            } catch (error) {
                return res.status(500).json({errors: error.message});
            }
        } else {
            return res.status(400).json({errors: errors.array()});
        }
    }

    async deleteProduct(req, res) {
        const {id} = req.params;
        try {
            await ProductModel.findByIdAndDelete(id);
            return res.status(200).json({msg: 'Product has been deleted successfully!!'});
        } catch (error) {
            throw new Error(error.message);
        }
    }
}

module.exports = new Product;