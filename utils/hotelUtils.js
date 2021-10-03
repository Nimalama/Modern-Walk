//models
const FoodOrder = require('../models/foodOrderModel');
const HotelFoodModel = require('../models/hotelFoodModel');

//third party modules
const {getFormattedToday} = require('../utils/utils')

//local modules

//Function: To make the orders to pending.
const orderSwitch = async()=>{
    try
    {
        let twoMinutesAgo = new Date();
        twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes()-3);

        FoodOrder.updateMany({"orderDate":getFormattedToday(new Date()),"foodStatus":"Confirming",$or:[
            {
                "orderedTime.0":twoMinutesAgo.getHours(),
                "orderedTime.1":{$lte:twoMinutesAgo.getMinutes()}
            },
            {
                "orderedTime.0":{$gt:twoMinutesAgo.getHours()}
            }
        ]},{
            $set:{
                "foodStatus":"Pending"
            }    
        })
        .then((result)=>{
            console.log("2 minutes checked!!");
        })
        .catch((err)=>{
            console.log(err);
        })
    }
    catch(err)
    {
        return res.status(404).json({'success':false,'message':err});
    }
}

//Function: 8 minutes alert.
const eightMinuteAlert = async()=>{
    try
    {
        let current = new Date();
        current.setMinutes(current.getMinutes() - 8);

        let orders = await FoodOrder.find({
            "orderDate":getFormattedToday(new Date()),
            "foodStatus":{$ne: "Served"},
            "orderedTime.0":current.getHours(),
            "ordered.1":current.getMinutes()
        });

        if(orders.length > 0)
        {
            FoodOrder.updateMany({
                "orderDate":getFormattedToday(new Date()),
                "foodStatus":{$ne: "Served"},
                "orderedTime.0":current.getHours(),
                "ordered.1":current.getMinutes()
            },{
                $set:{
                    "waitingDots":1
                }
            })
            .then((result)=>{
                console.log(`${orders.length} foods took 8 minutes and not served yet.`)
            })
            .catch((err)=>{
                console.log(err);
            })
        }
        
    }
    catch(err)
    {
        return res.status(404).json({'success':false,'message':err});
    }
}


//Function: 16 minutes alert.
const sixteenMinuteAlert = async()=>{
    try
    {
        let current = new Date();
        current.setMinutes(current.getMinutes() - 16);

        let orders = await FoodOrder.find({
            "orderDate":getFormattedToday(new Date()),
            "foodStatus":{$ne: "Served"},
            "orderedTime.0":current.getHours(),
            "ordered.1":current.getMinutes()
        });

        if(orders.length > 0)
        {
            FoodOrder.updateMany({
                "orderDate":getFormattedToday(new Date()),
                "foodStatus":{$ne: "Served"},
                "orderedTime.0":current.getHours(),
                "ordered.1":current.getMinutes()
            },{
                $set:{
                    "waitingDots":2
                }
            })
            .then((result)=>{
                console.log(`${orders.length} foods took 16 minutes and not served yet.`)
            })
            .catch((err)=>{
                console.log(err);
            })
        }
        
    }
    catch(err)
    {
        return res.status(404).json({'success':false,'message':err});
    }
}


//Function: To average ratings of yesterday.
const ratingAverage = async()=>{
    try{
        let yesterday = new Date();
        yesterday.setDate(yesterday.getDate()-1);
        
        let foodOrders = await FoodOrder.find({'orderDate':getFormattedToday(yesterday),'foodRating':{$gt:0}})
        .populate({
            "path":"hotelFoodId"
        })

        let foodIdContainer = Array.from(new Set(foodOrders.map((val)=>{return val.hotelFoodId._id.toString()})));
        for(var i of foodIdContainer)
        {
            let previousRatings = await FoodOrder.find({'orderDate':{$lt:getFormattedToday(yesterday)},'foodRating':{$gt:0},'hotelFoodId':i});
            let previousTotal = previousRatings.length > 0 ? previousRatings.map((val)=>{return val.quantity}).reduce((acc,i)=>{return acc+i}) : 0;
            let singleFoodOrders = foodOrders.filter((val)=>{return val.hotelFoodId._id.toString() == i});
            let ratedCount = singleFoodOrders.length > 0? singleFoodOrders.map((val)=>{return val.quantity}).reduce((acc,i)=>{return acc+i}) : 0;
            let ratingAccumulator = singleFoodOrders.length > 0 ? singleFoodOrders.map((val)=>{return val.foodRating}).reduce((acc,i)=>{return acc+i}) : 0;
            let totalRating = singleFoodOrders[0].hotelFoodId.rating;
            let overallPoints = (previousTotal * totalRating) + ratingAccumulator;
            let averageRating = Math.ceil((overallPoints / (previousTotal+ratedCount)));

            let avgRate = await HotelFoodModel.updateOne({_id:i},{
                $set:{
                    'rating':averageRating
                }
            })

            if(avgRate.ok == 1)
            {
               let avgOrderRating = await FoodOrder.updateMany({"hotelFoodId":i},{
                    $set:{
                        "averageRating":true
                    }
                })
            }
        }

        console.log("Average rating Mapped!!");
        
    }
    catch(err)
    {
        console.log(err);
    }
}


module.exports = {orderSwitch,eightMinuteAlert,sixteenMinuteAlert,ratingAverage};