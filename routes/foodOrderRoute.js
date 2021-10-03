//third party modules
const express = require('express');
const router = express.Router();


//local modules
const {getFormattedToday,getFancyDate} = require('../utils/utils');
const auth = require('../middleware/auth');

//models
const FoodOrder = require('../models/foodOrderModel');
const HotelFoodModel = require('../models/hotelFoodModel');
const Registration = require('../models/registration');

//controller
const {monthlyAnalysis,weeklyAnalysis,dateWeekAnalysis} = require('../controller/foodOrderController');


//API: To Take Order For The Food.
router.post('/orderFood',auth.verifyUser,async(req,res)=>{
    try
    {
        let foodId = req.body['foodId'];
        let quantity = parseInt(req.body['quantity']);
        let hotelFood = await HotelFoodModel.findOne({'_id':foodId,'showStatus':true});
        let phoneNumber = req.body['phoneNumber'].trim();

        if(!phoneNumber.startsWith("98"))
        {
            return res.status(202).json({'success':false,'message':"Inappropriate phone number."});
        }

        if(hotelFood != null)
        {
            const foodOrderObj = new FoodOrder({
                "hotelFoodId":foodId,
                "userId":req.user._id,
                "orderedTime":[new Date().getHours(),new Date().getMinutes()],
                "orderDate":getFormattedToday(new Date()),
                "orderFancyDate":getFancyDate(new Date()),
                "quantity":quantity,
                'phoneNumber':phoneNumber,
                'orderDateAndTime':new Date()
            })

            foodOrderObj.save()
            .then((data)=>{
                return res.status(200).json({'success':true,'message':"Food Ordered Successfully. You have 2 minutes confirmation time before taking it for further progress."});
            })
            .catch((err)=>{
                return res.status(404).json({'success':false,'message':err});
            })
        }
        else
        {
            return res.status(202).json({'success':false,'message':"Food Unavailable."});
        }
    }
    catch(err)
    {
        return res.status(404).json({'success':false,'message':err});
    }
})


//API: To delete the ordered food.
router.post('/deleteOrderedFood/:orderId',auth.verifyUser,async(req,res)=>{
    try{
        let orderId = req.params.orderId;

        let foodOrder = await FoodOrder.findOne({'_id':orderId,'orderDate':getFormattedToday(new Date())});
        if(foodOrder != null)
        {
            if(foodOrder.foodStatus == "Confirming")
            {
               FoodOrder.deleteOne({"_id":orderId})
               .then((result)=>{
                  return res.status(200).json({'success':true,'message':"Order has been deleted."});
               }) 
               .catch((err)=>{
                return res.status(404).json({'success':false,'message':err});
               })
            }
            else
            {
                return res.status(202).json({'success':false,'message':"Sorry, the ordered food is in a progress."});
            }
        }
        else
        {
            return res.status(202).json({'success':false,'message':"Order Unavailable."});
        }
    }
    catch(err)
    {
        return res.status(404).json({'success':false,'message':err});
    }
})

//API: To rate the ordered food.
router.put('/rateTheFood',auth.verifyUser,async(req,res)=>{
    try{
       let orderId = req.body['orderId']; 
       let rating = parseInt(req.body['rating']);

       let orderDetail = await FoodOrder.findOne({'_id':orderId,'foodStatus':"Served",'orderDate':getFormattedToday(new Date())});     
       if(orderDetail != null)
       {
          let ratingUpdate = await FoodOrder.updateOne({
              "_id":orderDetail._id
          },{
              $set:{
                  "foodRating":rating * orderDetail.quantity
              }
          })
          
         
          if(ratingUpdate.ok == 1)
          {
            return res.status(200).json({'success':true,'message':"Thank you for the rating:)"});
          }
       }
       else
       {
           return res.status(202).json({'success':false,'message':"You cannot rate this order."});
       }
    }
    catch(err)
    {
        return res.status(404).json({'success':false,'message':err});
    }
})

//API: To toggle cooking and serving status of food.
router.put('/toggleOrderStatus/:orderId',auth.verifyUser,async(req,res)=>{
    try
    {
        let orderId = req.params.orderId;
        let order = await HotelFoodModel.findOne({'_id':orderId,'orderDate':getFormattedToday(new Date()),"foodStatus":{$ne:"Confirming"},'foodStatus':{$ne:"Served"}});
        if(order != null)
        {
            let obj = {};
            if(order.foodStatus == "Pending")
            {
                obj['foodStatus'] = "Cooking";
            }
            if(order.foodStatus == "Cooking")
            {
                obj['foodStatus'] = "Served";
            }

            let orderStatus = await HotelFoodModel.updateOne({"_id":orderId},{
                $set:obj
            })

            if(orderStatus.ok == 1)
            {
                return res.status(200).json({'success':true,'message':`Food status updated to ${obj['foodStatus']}.`});
            }
        }
        else
        {
            return res.status(202).json({'success':false,'message':'Order for the food unavailable or might be in confirmation phase.'});
        }
    }
    catch(err)
    {
        return res.status(404).json({'success':false,'message':err});
    }
})

//API:To fetch every orders of the specific users.
router.get('/fetchMyOrders',auth.verifyUser,async(req,res)=>{
    try{
        let myPastOrders = await FoodOrder.find({'userId':req.user._id,'orderDate':{$lt:getFormattedToday(new Date())}})
        .populate({
            "path":"hotelFoodId",
            "populate":{
                'path':"hotelMenuId"
            }
        })
        .sort({
            "orderDateAndTime":-1
        })

        let myRecentOrders = await FoodOrder.find({'userId':req.user._id,'orderDate':getFormattedToday(new Date())})
        .populate({
            "path":"hotelFoodId",
            "populate":{
                'path':"hotelMenuId"
            }
        })
        .sort({
            "orderDateAndTime":-1
        })

        let deletable = myRecentOrders.length > 0 ? myRecentOrders.filter((val)=>{return val.foodStatus == "Confirming"}).map((val)=>{return val._id.toString()}) : [];
        myRecentOrders.push(...myPastOrders);
        let unqDates = Array.from(new Set(myRecentOrders.map((val)=>{return val.orderFancyDate})));
        

        if(myRecentOrders.length > 0)
        {
            return res.status(200).json({'success':true,'message':`${myRecentOrders.length} Orders Found.`,'data':myRecentOrders,'deletable':deletable,'distinctDate':unqDates});
        }
        else
        {
            return res.status(202).json({'success':false,'message':"0 Orders Found."});
        }
    }
    catch(err)
    {
        return res.status(404).json({'success':false,'message':err});
    }
})

//API: To get the recent orders, served orders for current date according to hotel.
router.get('/fetchOrdersByCustomers',auth.verifyUser,async(req,res)=>{ //later hotel's own gate will be available.
    try{
        let pendingOrders = await FoodOrder.find({'orderDate':getFormattedToday(new Date()),'foodStatus':"Pending"})
        .populate({
            "path":"hotelFoodId"
        })
        .sort({
            "orderDateAndTime":1
        })
        let cookingOrders = await FoodOrder.find({'orderDate':getFormattedToday(new Date),'foodStatus':"Cooking"})
        .populate({
            "path":"hotelFoodId"
        })
        .sort({
            "orderDateAndTime":1
        })
        let servedOrders = await FoodOder.find({'orderDate':getFormattedToday(new Date()),'foodStatus':"Served"})
        .populate({
            "path":"hotelFoodId"
        })
        .sort({
            "orderDateAndTime":-1
        })


        let allOrders = [];
        allOrders.push(...pendingOrders,...cookingOrders,...servedOrders);

        if(allOrders.length > 0)
        {
            return res.status(200).json({'success':true,'message':`${allOrders.length} Orders Found.`,'data':allOrders});
        }
        else
        {
            return res.status(202).json({'success':false,'message':"0 Orders Found."});
        }

    }
    catch(err)
    {
        return res.status(404).json({'success':false,'message':err});
    }
})

//API: To fetch order history according to the hotel
router.get('/orderHistoryHotels',auth.verifyUser,async(req,res)=>{
    try{
        let orderHistory = await FoodOrder.find({'orderDate':{$lt:getFormattedToday(new Date())}})
        .populate({
            'path':'hotelFoodId'
        })
        .sort({
            "orderDateAndTime":-1
        })

        if(orderHistory.length > 0)
        {
            return res.status(200).json({'success':true,'message':`${orderHistory.length} Orders Found.`,'data':orderHistory});
        }
        else
        {
            return res.status(202).json({'success':false,'message':`0 Orders Found.`});
        }

    }
    catch(err)
    {
        return res.status(404).json({'success':false,'message':err});
    }
})

//API: Payment of the orders.
router.put('/paymentStatus',auth.verifyUser,async(req,res)=>{
    try
    {
        let customerId = req.body['customerId'];
        let paymentMethod = req.body['paymentMethod'].trim();
        
        let changePaymentStatus = await FoodOrder.updateMany({
            "userId":customerId,
            'orderDate':getFormattedToday(new Date()),
            'foodStatus':"Served",
            'paymentStatus':"UnPaid"
        },{
            $set:{
                "paymentStatus":paymentMethod
            }
        })

        if(changePaymentStatus.ok == 1)
        {
            return res.status(200).json({'success':true,'message':"Payment Status Changed!!"});
        }

    }
    catch(err)
    {
        return res.status(404).json({'success':false,'message':err});
    }
})

//API: To generate a bill for the customers (history or current)
router.post('/generateABill',auth.verifyUser,async(req,res)=>{ //future ma chai user and hotel ko combined gate
    try
    {
        let userName = req.body['userName'].trim();
        let decision = req.body['decision'].trim();

        let user = await Registration.findOne({'Username':userName});
        if(user != null)
        {
            let order = decision == "History"?  await FoodOrder.find({'userId':user._id,'paymentStatus':{$ne:"UnPaid"}})
            .populate({
                'path':'hotelFoodId'
                // 'populate':{
                //     "path":"hotelMenuId",
                //     'match':{'_id':hotelId} 
                // } 
            })
            .sort({
                "orderDateAndTime":-1
            }) :await FoodOrder.find({'userId':user._id,'paymentStatus':"UnPaid",'orderDate':getFormattedToday(new Date())})
            .populate({
                'path':'hotelFoodId'
                // 'populate':{
                //     "path":"hotelMenuId",
                //     'match':{'_id':hotelId} 
                // } 
            })
            .sort({
                "orderDateAndTime":1
            })

            if(order.length > 0)
            {
                let billAmount = order.map((val)=>{
                    let price = val.hotelFoodId.discountPercent > 0 ? val.hotelFoodId.newPrice : val.hotelFoodId.price;
                    return val.quantity * price;
                }).reduce((acc,i)=>{return acc+i});
                let withVAT = parseInt((0/100) * billAmount); //future hotel ko instance bata tanni.
                let withService = parseInt((0/100) * billAmount);
                let totalBill = billAmount+withVAT+withService;
                return res.status(200).json({'success':true,'message':"Bill Generated.",'data':order,'billStatus':[billAmount,withVAT,withService,totalBill]});
            }
            else
            {
                return res.status(202).json({'success':false,'message':"No Orders for today to generate a bill."});
            }
        }
        else
        {
            return res.status(202).json({'success':false,'message':`Cannot find username ${userName}`});
        }

    }
    catch(err)
    {
        return res.status(404).json({'success':false,'message':err});
    }
}) 

//API: To get the collection record according to day and food for specific hotels
router.get('/collectionAccordingToDate/:date',auth.verifyUser,async(req,res)=>{ //gate of both adminandhospitalMixed
    try{
        let date = req.params['date'];
        //let hotelId = req.params['hotelId'];  future

        let foodOrders = await FoodOrder.find({'orderDate':date,'paymentStatus':{$ne:"UnPaid"}})
        .populate({
            "path":"hotelFoodId"
        });

        let allFoods = await HotelFoodModel.find({}); //future ma hotel anusar ko foods matra aunxa
        let foodAndAnalysis = [];
        let forChart = {};

        for(var i of allFoods)
        {
            let analysis = {};
            let foodFiltration = foodOrders.filter((val)=>{return val.hotelFoodId.foodName == i.foodName});

            let soldQuantity = foodFiltration.length > 0 ? foodFiltration.map((val)=>{return val.quantity}).reduce((acc,i)=>{return acc+i}) : 0;
            let revenueCollected = foodFiltration.length > 0 ? foodFiltration.map((val)=>{
                let price = val.hotelFoodId.discountPercent > 0? val.hotelFoodId.newPrice : val.hotelFoodId.price;
                return price * val.quantity
            
            }).reduce((acc,i)=>{return acc+i}) : 0;

            analysis[i.foodName] = [soldQuantity,revenueCollected];
            foodAndAnalysis.push(analysis);
        }
      
       
        let totalSold =  foodAndAnalysis.map((val)=>{return  Object.values(val)}).map((val)=>{return val[0][0]}).reduce((acc,i)=>{return acc+i});
        let totalRevenue = foodAndAnalysis.map((val)=>{return  Object.values(val)}).map((val)=>{return val[0][1]}).reduce((acc,i)=>{return acc+i});
        let analysis = {
            'total':[totalSold,totalRevenue]
        }
        foodAndAnalysis.push(analysis);

        for(var i of foodAndAnalysis.slice(0,foodAndAnalysis.length-1))
        {
            for(var j in i)
            {
                let bp = parseFloat(((i[j][1] / totalRevenue) * 100).toFixed(2));
                if(!isFinite(bp))
                {
                    bp = 0
                }
                forChart[j] = bp;
            }
        }

        return res.status(200).json({'success':true,'message':"Analyzed",'data':foodAndAnalysis,'chart':forChart});


    }
    catch(err)
    {
        console.log(err);
        return res.status(404).json({'success':false,'message':err});
    }
})



//APIRoute:To analyze sales in month of associate hotel for different food including points mapping for plotting a chart.
router.get('/monthAnalysis',auth.verifyUser,monthlyAnalysis); //future ma hotelId params ma auxa
//APIRoute:To analyze sales in week of associate hotel for different food including points mapping for plotting a chart.
router.get('/weekAnalysis',auth.verifyUser,weeklyAnalysis)
//APIRoute:To analyze sales in week according to 7 week days.
router.get('/dateWeekAnalysis',auth.verifyUser,dateWeekAnalysis)


module.exports = router;

