const mongoose = require('mongoose');
const {ObjectId} = require('bson');
const User = require('./registration');
const Checkout = require('./checkoutModel');

const PunishDots = mongoose.model('PunishDots',{
    "user_id":{"type":ObjectId,"required":true,"ref":User},
    "booking_id":{"type":ObjectId,"required":true,"ref":Checkout},
    "added_at":{"type":String,"required":true},
    "time":{"type":String,"required":true}
})

module.exports = PunishDots;