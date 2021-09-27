const mongoose = require('mongoose');
const {ObjectId} = require('bson');
const HotelMenu = require('./hotelMenu')

const HotelFoodModel = mongoose.model('HotelFoodModel',{
   'hotelMenuId':{'type':ObjectId,'required':true,'ref':HotelMenu},
   'foodName':{'type':String,'required':true},
   'foodPictures':{'type':[String],'requird':true},
   "flavor":{'type':String,'required':true},
   'description':{'type':String,'required':true},
   "price":{'type':Number,'required':true},
   "discountPercent":{'type':Number,'required':true,'default':0},
   "newPrice":{'type':Number,'required':true},
   'rating':{'type':Number,'required':true,'default':0},
   'status':{'type':String,'required':true,'enum':['Special','Normal',"Today's Special"],'default':"Normal"}
})

module.exports = HotelFoodModel;