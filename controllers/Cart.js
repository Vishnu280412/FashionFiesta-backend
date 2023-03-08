const { request } = require("express");
const { validationResult } = require("express-validator");
const CartModel = require("../models/Cart");

class Cart {
    async create(req, res) {
        const errors = validationResult(req);
        const {uid, products} = req.body;
        if(errors.isEmpty()) {
            const exist = await CartModel.findOne({uid});
            if(!exist){
                await CartModel.create({uid, products});
                res.status(201).json({message: 'Your cart has been created successfully!'});
            } else{
                return res.status(400).json({errors: [{msg: `${uid}'s cart already exists!!`}]});
            }
        } else{
            return res.status(400).json({errors: errors.array()});
        }
    }

    async categories(req, res) {
        const page = req.params.page;
        const perPage = 3;
        const skip = (page - 1) *perPage;
        try {
            const count = await CategoryModel.find({}).countDocuments();
            const response = await CategoryModel.find({}).skip(skip).limit(perPage).sort({updatedAt: -1});
            return res.status(200).json({categories: response, perPage, count});
        } catch (error) {
            console.log(error.message);
            return res.status(500).json('Server internal error!!');
        }
    }

    // async fetchCategory(req, res) {
    //     const {id} = req.params;
    //     try {
    //         const response = await CategoryModel.findOne({_id: id})
    //         return res.status(200).json({category: response})
    //     } catch (error) {
    //         console.log(error.message);
    //         return res.status(500).json('Server internal error!!');
    //     }
    // }

    async updateCategory(req, res) {
        const {id} = req.params;
        const {name} = req.body;
        const errors = validationResult(req);
        if(errors.isEmpty()) {
            const exist = await CategoryModel.findOne({name});
            if(!exist) {
                const response = await CategoryModel.updateOne({_id: id}, {$set: {name}});
                return res.status(200).json({message: 'Your category has been updated successfully!'});
            } else {
                return res.status(400).json({errors: [{msg: `${name} exists already!!`}]});    
            }
        } else {
            return res.status(400).json({errors: errors.array()});
        }
    }

    async deleteCategory(req, res) {
        const {id} = req.params;
        try {
            await CategoryModel.deleteOne({_id: id});
            return res.status(200).json({message: 'Your category has been deleted successfully!'});
        } catch (error) {
            console.log(error.message);
            return res.status(500).json('Server internal error!!');
        }
    }

    async allCategories(req, res) {
        try {
            const categories = await CategoryModel.find({});
            return res.status(200).json({categories});
        } catch (error) {
            return res.status(500).json('Server internal error!!');
        }
    }

    async randomCategories(req, res) {
        try {
            const categories = await CategoryModel.aggregate([
                {$sample: {size: 3}},
            ]);
            return res.status(200).json({categories});
        } catch (error) {
            return res.status(500).json('Server internal error!!');
        }
    }
}

module.exports = new Cart;