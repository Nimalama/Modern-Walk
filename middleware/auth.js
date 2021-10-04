const jwt = require('jsonwebtoken');
const User = require('../models/registration')

module.exports.verifyUser = function(req, res, next) {

    try {
        const token = req.headers.authorization.split(" ")[1];
        const Userdata = jwt.verify(token, 'secretkey');
        User.findOne({ _id: Userdata.userId })
            .then(function(result) {
                req.user = result;
                next();
            })
            .catch(function(e) {
                res.status(500).json({ error: e })
            })
    } catch (er) {
        res.status(401).json({ message: "Authorization failed !!" })
    }
}

//next userVerificaton for Admin
module.exports.verifyAdmin = function(req, res, next) {

        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized user!!" })

        } else if (req.user.UserType !== 'Admin') {
            return res.status(401), json({ message: "Unauthorized userytdydyrd!!!" })
        }
        next();
    }
    //next userverification for Seller
module.exports.verifySeller = function(req, res, next) {

        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized user1111111!!" })

        } else if (req.user.UserType !== 'Seller') {
            return res.status(401), json({ message: "Unauthorized user!!!" })
        }
        next();
    }
    //next userverification for Buyer
module.exports.verifyBuyer = function(req, res, next) {

    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized user!!" })

    } else if (req.user.UserType !== 'Buyer') {
        return res.status(401), json({ message: "Unauthorized user!!!" })
    }
    next();
}