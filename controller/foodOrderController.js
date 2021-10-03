//third party modules

//models
const FoodOrder = require('../models/foodOrderModel');
const HotelFoodModel = require('../models/hotelFoodModel');

//local modules
const {days,month, dateFiltration} = require('../utils/utils')

//Call back functions
//APIFunction: To analyze sales in month of associate hotel for different food including points mapping for plotting a chart.
module.exports.monthlyAnalysis = async(req,res)=>{
    try{
        //fetch every sales from database consisting current sales.
        let foodOrders = await FoodOrder.find({'foodStatus':{$ne:"Confirming"}})
        .populate({
            "path":"hotelFoodId"
        })
        .sort({
            "orderDate":1
        })
        //fetch foods in a hotel.
        let foods = await HotelFoodModel.find({}); //future ma hotel ansar auxa
        
        //variable initializations.
        let monthAnalysis = [];
        let forChart = {};

        
        //bounded loop of month.
        for(var i=0; i<month.length; i++)
        {
            //analysis holder
            let analysis = {};
            analysis[month[i]] = {};
            //filter orders which match the specific month.
            let monthFiltration = foodOrders.filter((val)=>{return new Date(val.orderDate).getMonth() == i});
            //looping inside foods.
            for(var j of foods)
            {
                let foodFiltration = monthFiltration.filter((val)=>{return val.hotelFoodId._id.toString() == j._id.toString()});

                //calculations
                let qtySold = foodFiltration.length > 0 ? foodFiltration.map((val)=>{return val.quantity}).reduce((acc,i)=>{return acc+i}) : 0;
                //future discount xa bhani price ni tesko order ma huna paryo.
                let priceCollection = foodFiltration.length > 0 ? foodFiltration.map((val)=>{
                    let price = val.hotelFoodId.discountPercent > 0 ? val.hotelFoodId.newPrice : val.hotelFoodId.price;
                    return val.quantity * price
                }).reduce((acc,i)=>{return acc+i}) : 0;

                analysis[month[i]][j.foodName] = [qtySold,priceCollection];
            }

            //total sales in a month.
            let qtySales = Object.values(analysis[month[i]]).map((val)=>{return val[0]}).reduce((acc,i)=>{return acc+i});
            let totalCollection = Object.values(analysis[month[i]]).map((val)=>{return val[1]}).reduce((acc,i)=>{return acc+i});
            analysis[month[i]]["Total"] = [qtySales,totalCollection];
            monthAnalysis.push(analysis);

            //finding a business Point for chart.
            let businessPoint = parseFloat((totalCollection/qtySales).toFixed(2));
            businessPoint = !isFinite(businessPoint)? 0 : businessPoint;
            forChart[month[i]] = businessPoint;
        }

        return res.status(200).json({'success':true,'message':"Analyzed",'data':monthAnalysis,'forChart':forChart});
        
    }
    catch(err)
    {
        console.log(err);
        return res.status(404).json({'success':false,'message':err});
    }
}


//APIFunction:To analyze sales in week of associate hotel for different food including points mapping for plotting a chart.
module.exports.weeklyAnalysis = async(req,res)=>{
    try{
         //fetch every sales from database consisting current sales.
         let foodOrders = await FoodOrder.find({'foodStatus':{$ne:"Confirming"}})
         .populate({
             "path":"hotelFoodId"
         })
         .sort({
             "orderDate":1
         })
         //fetch foods in a hotel.
         let foods = await HotelFoodModel.find({}); //future ma hotel ansar auxa
         
         //variable initializations.
         let weekAnalysis = [];
         let forChart = {};
 
         
         //bounded loop of days.
         for(var i=0; i<days.length; i++)
         {
             //analysis holder
             let analysis = {};
             analysis[days[i]] = {};
             //filter orders which match the specific month.
             let dayFiltration = foodOrders.filter((val)=>{return new Date(val.orderDate).getDay() == i});
             //looping inside foods.
             for(var j of foods)
             {
                 let foodFiltration = dayFiltration.filter((val)=>{return val.hotelFoodId._id.toString() == j._id.toString()});
 
                 //calculations
                 let qtySold = foodFiltration.length > 0 ? foodFiltration.map((val)=>{return val.quantity}).reduce((acc,i)=>{return acc+i}) : 0;
                 //future discount xa bhani price ni tesko order ma huna paryo.
                 let priceCollection = foodFiltration.length > 0 ? foodFiltration.map((val)=>{
                     let price = val.hotelFoodId.discountPercent > 0 ? val.hotelFoodId.newPrice : val.hotelFoodId.price;
                     return val.quantity * price
                 }).reduce((acc,i)=>{return acc+i}) : 0;
 
                 analysis[days[i]][j.foodName] = [qtySold,priceCollection];
             }
 
             //total sales in a month.
             let qtySales = Object.values(analysis[days[i]]).map((val)=>{return val[0]}).reduce((acc,i)=>{return acc+i});
             let totalCollection = Object.values(analysis[days[i]]).map((val)=>{return val[1]}).reduce((acc,i)=>{return acc+i});
             analysis[days[i]]["Total"] = [qtySales,totalCollection];
             weekAnalysis.push(analysis);
 
             //finding a business Point for chart.
             let businessPoint = parseFloat((totalCollection/qtySales).toFixed(2));
             businessPoint = !isFinite(businessPoint)? 0 : businessPoint;
             forChart[days[i]] = businessPoint;
         }
 
         return res.status(200).json({'success':true,'message':"Analyzed",'data':weekAnalysis,'forChart':forChart});
    }
    catch(err)
    {
        console.log(err);
        return res.status(404).json({'success':false,'message':err});
    }
}


//APIFunction:To analyze sales in week according to 7 week days.
module.exports.dateWeekAnalysis = async(req,res)=>{
    try{
        //first Order Date
        let foodOrders = await FoodOrder.find({}).sort({'orderDate':1}).limit(1);
        //finding initial point to get 1 week date.
        let firstOrderDate = new Date(foodOrders[0].orderDate);
        let initialStartDay = firstOrderDate.getDay();  
        let currentDay = new Date().getDay();
        
        let pickPoint = new Date();
        let startPoint = new Date();
        let endPoint = new Date();
        
        let point = currentDay - initialStartDay;
        pickPoint.setDate(pickPoint.getDate()-point);
        if(point > 0)
        {
           startPoint.setDate(pickPoint.getDate() - 6);
           endPoint.setDate(pickPoint.getDate());    
        }
        else
        {
           startPoint.setDate(pickPoint.getDate() - 13);
           endPoint.setDate(pickPoint.getDate() - 7);
        }

        let dateContainer = dateFiltration(startPoint,endPoint);
         //fetch every sales from database consisting current sales.
         let foodOrderss = await FoodOrder.find({'foodStatus':{$ne:"Confirming"}})
         .populate({
             "path":"hotelFoodId"
         })
         .sort({
             "orderDate":1
         })
         //fetch foods in a hotel.
         let foods = await HotelFoodModel.find({}); //future ma hotel ansar auxa
         
         //variable initializations.
         let weekDateAnalysis = [];
         let forChart = {};
 
         
         //bounded loop of days.
         for(var i=0; i<dateContainer.length; i++)
         {
             //analysis holder
             let analysis = {};
             analysis[dateContainer[i]] = {};
             //filter orders which match the specific month.
             let dateFiltrations = foodOrderss.filter((val)=>{return (val.orderDate) == dateContainer[i]});
           
             //looping inside foods.
             for(var j of foods)
             {
                 let foodFiltration = dateFiltrations.filter((val)=>{return val.hotelFoodId._id.toString() == j._id.toString()});
 
                 //calculations
                 let qtySold = foodFiltration.length > 0 ? foodFiltration.map((val)=>{return val.quantity}).reduce((acc,i)=>{return acc+i}) : 0;
                 //future discount xa bhani price ni tesko order ma huna paryo.
                 let priceCollection = foodFiltration.length > 0 ? foodFiltration.map((val)=>{
                     let price = val.hotelFoodId.discountPercent > 0 ? val.hotelFoodId.newPrice : val.hotelFoodId.price;
                     return val.quantity * price
                 }).reduce((acc,i)=>{return acc+i}) : 0;
 
                 analysis[dateContainer[i]][j.foodName] = [qtySold,priceCollection];
             }
 
             //total sales in a month.
             let qtySales = Object.values(analysis[dateContainer[i]]).map((val)=>{return val[0]}).reduce((acc,i)=>{return acc+i});
             let totalCollection = Object.values(analysis[dateContainer[i]]).map((val)=>{return val[1]}).reduce((acc,i)=>{return acc+i});
             analysis[dateContainer[i]]["Total"] = [qtySales,totalCollection];
             weekDateAnalysis.push(analysis);
 
             //finding a business Point for chart.
             let businessPoint = parseFloat((totalCollection/qtySales).toFixed(2));
             businessPoint = !isFinite(businessPoint)? 0 : businessPoint;
             forChart[days[i]] = businessPoint;
         }
 
         return res.status(200).json({'success':true,'message':"Analyzed",'data':weekDateAnalysis,'forChart':forChart});



    }
    catch(err)
    {
        return res.status(404).json({'success':false,'message':err});
    }
}