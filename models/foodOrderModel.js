const mongoose = require('mongoose');
const {ObjectId} = require('bson');
const HotelFoodModel = require('./hotelFoodModel');
const Registration = require('./registration');


//8 minutes of waiting time.
const FoodOrder = mongoose.model('FoodOrder',{
    'hotelFoodId':{'type':ObjectId, 'required':true,'ref':HotelFoodModel},
    'userId':{'type':ObjectId,'required':true,'ref':Registration},
    'orderedTime':{'type':[Number],'required':true},
    'quantity':{'type':Number,'required':true},
    'orderDate':{'type':String,'required':true},
    'orderDateAndTime':{'type':Date,'required':true},
    'orderFancyDate':{'type':String,'required':true},
    'foodRating':{'type':Number,'required':true,'default':0},
    'foodStatus':{'type':String,'required':true,'enum':['Confirming','Pending','Cooking','Served'],'default':"Confirming"},
    'waitingDots':{'type':Number,'required':true,'default':0},
    "paymentStatus":{'type':String,'required':true,'default':"UnPaid",'enum':['Cash','Online','UnPaid','Cash and Online']},
    "phoneNumber":{'type':String,'required':true},
    "averageRating":{'type':Boolean,'required':true,'default':false}
});

//rating chai aja ko din lai aja matra
//bill ko lagi chai userId lini(search grni aja ko date ko lagi)

module.exports = FoodOrder;