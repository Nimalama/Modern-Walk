const mongoose = require('mongoose');
const {ObjectId} = require('bson');


const HotelMenu = mongoose.model('HotelMenu',{
  // "hotelId":{'type':ObjectId,'required':true,'ref':Hotel},
   'category':{'type':String,'required':true},
   'order':{'type':Number,'required':true}, //which place ma saman rakhni
})


module.exports = HotelMenu;