const mongoose = require('mongoose');
const {ObjectId} = require('bson');
const Product = require('./productModel');

const ClothingBooking = mongoose.model('ClothingBooking',{
    "user_id":{"type":ObjectId,"required":true},
    "product_id":{"type":ObjectId,"required":true,ref:Product},
    "quantity":{"type":Number,"required":true},
    "price":{"type":Number,"required":true},
    "booked_At":{"type":String,"required":true},
    "delivery_address":{"type":String,"required":true},
    "delivery_number":{"type":String,"required":true},
    "deliveryStarts":{"type":String,"required":true},
    "bookingCode":{"type":String,"required":true},
    "bookedDate":{"type":Date,"required":true}

})

module.exports = ClothingBooking
