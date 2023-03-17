const user = require("../models/user");

class CustomersController {

    async get(req, res) {
        const {page} = req.params;
        const perPage = 4;
        const skip = (page - 1) * perPage;
        try {
            const count = await user.find({admin: false}).countDocuments();
            const response = await user.find({admin: false}).skip(skip).limit(perPage).select('-password');
            return res.status(200).json({users: response, perPage, count});
        } catch (error) {
            console.log(error.message);
            return res.status(500).json({error: error.message});
        }
    }

    async updateUserRole(req, res) {
        try {
            const {id} = req.params;
            const response = await user.updateOne({_id: id}, {$set: {admin: true}});
            return res.status(200).json({msg: "User has been promoted successfully!!", response});
        } catch (error) {
            return res.status(500).json({errors: error.message});
        }
    } 

    async removeUser(req, res) {
        const {id} = req.params;
        try {
            await user.findByIdAndDelete(id);
            return res.status(200).json({msg: 'User has been deleted successfully!!'});
        } catch (error) {
            throw new Error(error.message);
        }
    }
}

module.exports = new CustomersController;