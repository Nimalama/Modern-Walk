const mongoose = require('mongoose');
const {ObjectId} = require('bson');
const ClothingBooking = require('./bookingModel');

const Checkout = mongoose.model('Checkout',{
    "booking_id":{"type":ObjectId,"required":true,"ref":ClothingBooking},
    "quantity":{"type":Number,"required":true},
    "price":{"type":Number,"required":true},
    "deliveryStatus":{"type":String,"required":true,"enum":['On a way',"Packed","Pending","Delivered","Cancelled"],"default":"Pending"},
    "booked_at":{"type":String,"required":true},
    "timeHour":{"type":[Number],"required":true},
    "replacements":{"type":Number,"required":true,"default":0},
    "deliveryTaken":{"type":String,"enum":['Open','Closed','Pending'],'required':true,'default':'Pending'},
    "address":{"type":String,"required":true},
    "phoneNo":{"type":String,"required":true},
    "phoneNo2":{"type":String},
    "userStatement":{"type":String,"required":true,"enum":['Success','Replacement Needed','Not Provided'],"default":"Not Provided"},
    "limit":{"type":String},
    "analysis":{"type":Boolean,"required":true,"default":false},
    "bookingCode":{"type":String,"required":true},
    "replacementDate":{"type":String},
    "replacementTimeHour":{"type":[Number]},
    "tag":{"type":String,"required":true,"default":"Pending"},
    "dateTime":{"type":Date,"required":true},
    "deliveredAt":{"type":String},
    "unreceivedPoints":{"type":Number,"required":true,"default":0},
    "unreceivedIncrement":{"type":String,"required":true}
})

module.exports = Checkout;