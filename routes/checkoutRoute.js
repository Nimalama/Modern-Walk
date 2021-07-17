const express = require('express');
const router = express.Router();
const Checkout = require('../models/checkoutModel');
const ClothBooking = require('../models/bookingModel')
const PunishDots = require('../models/punishDotsModel')
const User = require('../models/registration')
const Analysis = require('../models/analysisModel');
const AnalysisItem = require('../models/analysisItemModel');
const auth = require('../middleware/auth')
const {check, validationResult} = require('express-validator')
const {getProductCode,getFormattedToday,getTimeValue,getFancyDate} = require('../utils/utils')
const {sendMailMessage} = require('../utils/mail');
const {mapSatisfaction} = require('../utils/bookingUtils')

router.post('/bookProduct',auth.verifyUser,[
    check('address',"Please provide address to ship.").not().isEmpty(),
    check('phoneNo',"Please provide contact number.").not().isEmpty(),
    check('phoneNo2',"Please provide second contact number.").not().isEmpty()
    
],async (req,res)=>{
    try
    {
        let errors = validationResult(req);
        if(errors.isEmpty())
        {
            let bid = req.body['bid']
            let cartItem = await ClothBooking.findOne({"_id":bid})
            .populate({
                "path":"product_id",
                "select":['pname']
            });
            if(cartItem != null)
            {
                
                let qty = cartItem.quantity;
                let price = cartItem.price;
                let address = req.body['address'].trim();
                let phoneNo = req.body['phoneNo'].trim();
                let phoneNo2 = req.body['phoneNo2'].trim();


                let checkoutItems = await Checkout.find({});
                let bookingCodes = checkoutItems.map((val)=>{return val.bookingCode});
                let bookingCode = getProductCode(bookingCodes);
                let today = new Date();
                today.setDate(today.getDate()-2);

                const bookingObj = new Checkout({
                    "quantity":qty,
                    "price":price,
                    "address":address,
                    "phoneNo":phoneNo,
                    "phoneNo2":phoneNo2,
                    "booking_id":bid,
                    "bookingCode":bookingCode,
                    "booked_at":getFormattedToday(today),
                    "timeHour":[new Date().getHours(),new Date().getMinutes()],
                    "dateTime":new Date(),
                    "unreceivedIncrement":getFormattedToday(new Date())
                })

                bookingObj.save()
                .then((result)=>{
                    let content = {
                        "heading": "Booking Confirmed!!",
                        "greeting": getTimeValue() + " " + req.user.fname + " " + req.user.lname + ",",
                        "message": `Your booking for ${cartItem.product_id.pname} for ${qty} quantity is confirmed at ${getFancyDate(new Date())} ${new Date().toLocaleTimeString()}`,
                        "message2": "Your booking code for shipment is: ",
                        "code":bookingCode,
                        "message3":"You have 24 hrs to make your decision.",
                        "task": "Booking"
                    }
                    sendMailMessage("Modern Walk", req.user.email, content);
    
                    return res.status(200).json({"success":true,"message":"Booked!!"})
                })
                .catch((err)=>{
                    return res.status(404).json({"success":false,"message":err})
                })
            }
            else
            {
                return res.status(202).json({"success":false,"message":"Item doesnot exist in cart."})
            }
        }
        else
        {
            return res.status(202).json({"success":false,"message":`${errors.array()[0].msg}`});
        }
    }
    catch(err)
    {
        return res.status(404).json({"success":false,"message":err});
    }
})


router.get('/myBookings',auth.verifyUser,async (req,res)=>{
    let successBookings = await Checkout.find({"userStatement":"Success"})
    .populate({
        "path":"booking_id",
        "populate":{
            "path":"product_id"
        },
        
    })
    .sort({
        "dateTime":-1
    });
    
    let replacementNeeded = await Checkout.find({$or:[{"userStatement":"Replacement Needed"},{'userStatement':"Not Provided","deliveryStatus":"Delivered","limit":{$exists:true},"limit":{$gt:getFormattedToday(new Date())}}]})
    .populate({
        "path":"booking_id",
        "populate":{
            "path":"product_id"
        },
        
    })
    .sort({
        "dateTime":-1
    });

    let pendingsOnAWay = await Checkout.find({"userStatement":"Not Provided",$or:[{"deliveryStatus":"Pending"},{"deliveryStatus":"On a way"}]})
    .populate({
        "path":"booking_id",
        "populate":{
            "path":"product_id"
        },
        
    })
    .sort({
        "dateTime":1
    });

   let merged = [];
   merged.push(...successBookings);
   merged.push(...replacementNeeded);
   merged.push(...pendingsOnAWay)

   if(merged.length > 0)
   {
     return res.status(200).json({"success":true,"message":`${merged.length} records found.`,'data':merged,'successBooking':successBookings,'replacements':replacementNeeded,'pendings':pendingsOnAWay})
   }
   else
   {
       return res.status(202).json({"success":false,"message":"No records."})
   }

})


router.delete('/deleteBooking/:bid',auth.verifyUser,(req,res)=>{
   let bid = req.params.bid;
   let bookData = Checkout.findOne({"_id":bid,"deliveryStatus":"Pending"})
   bookData.then((data)=>{
       if(data!=null)
       {
          let dateInitialization = new Date(data.booked_at);
          dateInitialization.setHours(data.timeHour[0],data.timeHour[1],0)
          let difference = parseInt((new Date().getTime() - dateInitialization.getTime() )/(1000*60*60))
       
          if(difference < 24)
          {
             Checkout.deleteOne({"_id":bid})
             .then((result)=>{
                 return res.status(200).json({"success":true,"message":"Booking Deleted!!"})
             })
             .catch((err)=>{
                 return res.status(404).json({"success":false,"message":err})
             })
          }
          else
          {
            return res.status(202).json({"success":false,"message":"Deleting time was limited for 24 hours only!"})
          }
       }
       else
       {
           return res.status(202).json({"success":false,"message":"Not in a pending line"})
       }
   })
   .catch((err)=>{
       return res.status(404).json({"success":false,"message":err});
   })  
})



router.get('/bookedData',auth.verifyUser,auth.verifyAdmin,(req,res)=>{
    let pendingCheckout = Checkout.find({"deliveryStatus":"On a way"})
    .populate({
        "path":"booking_id",
        "populate":{
            "path":"product_id"
        }
    })
    .sort({
        "booked_at":1
    })

    pendingCheckout.then((data)=>{
        if(data.length > 0)
        {
            return res.status(200).json({"success":true,"message":`${data.length} records found.`,'data':data})
        }
        else
        {
            return res.status(202).json({"success":false,"message":"0 records for shipment."})
        }
    })
    .catch((err)=>{
        return res.status(404).json({'success':false,"message":err});
    })
})


router.post('/deliverStatus',auth.verifyUser,auth.verifyAdmin, async (req,res)=>{
    try
    {
        let bid = req.body['bid'];

        let bookedData = await Checkout.findOne({"_id":bid,"deliveryStatus":"On a way"})
        .populate({
            "path":"booking_id",
            "populate":{
                "path":"user_id"
            },
            "populate":{
                "path":'product_id'
            }
        });
       
        
        if(bookedData != null)
        {
            let decision = req.body['decision'];
            //received //not-received
            if(decision == "received")
            {
                let bookingCode = req.body['bookingCode'].trim();
                let actualCode = bookedData.bookingCode;
                let today = new Date();
                today.setDate(today.getDate()+3);
                if(bookingCode == actualCode)
                {
                    Checkout.updateOne({"_id":bookedData._id},{
                        $set:{
                            "deliveryStatus":"Delivered",
                            "limit":getFormattedToday(today),
                            "deliveredAt":getFormattedToday(new Date),
                            "userStatement":"Not Provided"
                        }
                    })
                    .then((result)=>{
                        let content = {
                            "heading": "Product delivered successful!!",
                            "greeting": getTimeValue() + " " + bookedData.booking_id.user_id.fname + " " + bookedData.booking_id.user_id.lname + ",",
                            "message": `Your booking for ${bookedData.booking_id.product_id.pname} for ${bookedData.quantity} quantity has been delivered at ${getFancyDate(new Date())} ${new Date().toLocaleTimeString()}`,
                           
                            "message3":"You have 3 days to check the product. We kindly request you to go through your booking section and mark success or replacement needed.",
                            "task": "Delivered"
                        }
                        sendMailMessage("Modern Walk", bookedData.booking_id.user_id.email, content);
                        return res.status(200).json({"success":true,"message":"Product Delivered Successfully!!"})
                    })
                }
                else
                {
                    return res.status(202).json({"success":false,"message":"Booking code mismatch!!"})
                }
            }
            else if(decision == "decline")
            {
                let unreceivedPoints = bookedData.unreceivedPoints+1;
                let lastDeclined = bookedData.unreceivedIncrement;
                let declinationObj = {'unreceivedPoints':unreceivedPoints,'unreceivedIncrement':getFormattedToday(new Date())};
                 let user = await User.findOne({"_id":bookedData.booking_id.user_id})
                if(lastDeclined != getFormattedToday(new Date()))
                {
                    if(unreceivedPoints >= 3)
                    {
                        declinationObj['deliveryStatus'] = "Cancelled"

                        const punishObj = new PunishDots({
                            "user_id":bookedData.booking_id.user_id._id,
                            "booking_id":bookedData._id,
                            "added_at":getFormattedToday(new Date()),
                            "time":new Date().toLocaleTimeString()
                        })

                        punishObj.save()
                        .then((result)=>{})
                        .catch((err)=>{return res.status(404).json({"success":false,"message":err})})
                        
                       
                       
                        if(user != null)
                        {
                            let content = {
                                "heading": "Punish Dots increased!!",
                                "greeting": getTimeValue() + " " + user.fname + " " + user.lname + ",",
                                "message": `Your dots has reached to ${user.dots+1}.`,
                               
                                "message3":`Collecting more dots can be dangerous to you.`,
                                "task": "Delivered"
                            }
                            sendMailMessage("Modern Walk", user.Email, content);
                            User.updateOne({"_id":user._id},{
                                $set:{
                                    "dots":user.dots+1
                                }
                            })
                            .then((result2)=>{})
                            .catch((err)=>{
                                console.log(err)
                                return res.status(404).json({"success":false,"message":err})})
                        }
                       


                    }
                   

                    Checkout.updateOne({"_id":bid},{
                        $set:declinationObj
                    })
                    .then((result)=>{
                         let content = {
                            "heading": "Product delivery Decline!!",
                            "greeting": getTimeValue() + " " + user.fname + " " + user.lname + ",",
                            "message": `Your booking for ${bookedData.booking_id.product_id.pname} for ${bookedData.quantity} quantity has been declined at ${getFancyDate(new Date())} ${new Date().toLocaleTimeString()}`,
                           
                            "message3":`You have ${3-unreceivedPoints} chances remaining to receive your product.`,
                            "task": "Delivered"
                        }
                        sendMailMessage("Modern Walk", user.Email, content);
                        return res.status(200).json({"success":true,"message":"Decliation flag added."})
                    })
                    .catch((err)=>{
                        console.log(err)
                        return res.status(404).json({"success":false,"message":err})
                    })

                }
                else
                {
                    return res.status(202).json({"success":false,"message":"You cannot decline a delivery for twice time a day."})
                }
            }
        }
        else
        {
            return res.status(202).json({"success":false,"message":"Specific booking data doesnot exist."})
        }        
    }
    catch(err)
    {
        console.log(err)
        return res.status(404).json({"success":false,"message":err})
    }
})


router.post('/sucessOrReplacement',auth.verifyUser,async (req,res)=>{
    try
    {
        let bid = req.body['bid'];
        let decision = req.body['decision'];
        let bookData = await Checkout.findOne({"_id":bid,"deliveryStatus":"Delivered","userStatement":"Not Provided"})
        .populate({
            "path":"booking_id"
        })

        if(bookData != null)
        {
            if(bookData.booking_id.user_id.toString() == req.user._id.toString())
            {
                if(decision == "Success")
                {
                    Checkout.findOneAndUpdate({"_id":bid},{
                        $set:{
                            "userStatement":"Success"
                        }
                    })
                    .then((result)=>{
                        let content = {
                            "heading": "Thank you!!",
                            "greeting": getTimeValue() + " " + req.user.fname + " " + req.user.lname + ",",
                            "message": `You are satisfied with the delivered product.`,
                           
                            "message3":`Buy more to get regular membership in giveaway.`,
                            "task": "Delivered"
                        }
                        sendMailMessage("Modern Walk", req.user.email, content);
                        // Checkout.findOne({"_id":bid})
                        // .then((data2)=>{
                            mapSatisfaction(req,res,result,req.user)
                        // })
                        // .catch((err)=>{
                        //     return res.status(404).json({"success":false,"message":err})
                        // })
                        
                        
                    })
                    .catch((err)=>{
                        return res.status(404).json({'success':false,"message":err});
                    })
                }
                else if(decision == "Replacement Needed")
                {
                    let replacements = bookData.replacements+1;
                    if(replacements <= 5)
                    {
                        let today = new Date();
                    today.setDate(today.getDate()+2);
                    Checkout.updateOne({"_id":bid},{
                        $set:{
                            "userStatement":"Replacement Needed",
                            "replacementDate":getFormattedToday(new Date(today)),
                            "replacementTimeHour":[new Date().getHours(),new Date().getMinutes()],
                            "deliveryStatus":"Pending",
                            "deliveryTaken":"Pending",
                            "replacements":replacements
                        },
                        $unset:{
                            "limit":1
                        }
                    })
                    .then((result)=>{
                        let content = {
                            "heading": "Your product has been taken to checking for replacement!!",
                            "greeting": getTimeValue() + " " + req.user.fname + " " + req.user.lname + ",",
                            "message": `Your product will be authorized for replacement in 2 days from now.`,
                           
                            "message3":`Thank you for notifying from the system.`,
                            "task": "Delivered"
                        }
                        sendMailMessage("Modern Walk", req.user.email, content);
                        return res.status(200).json({"success":true,"message":"Added to Replacement."})
                    })
                    .catch((err)=>{
                        return res.status(404).json({'success':false,"message":err});
                    })
                    }
                    else
                    {
                        return res.status(202).json({"success":false,"message":"You can ask for replacement till 5 times."})
                    }
                    
                }
            }
            else
            {
                return res.status(202).json({"success":false,"message":"You are not the owner of the specified booking."})
            }
        }
        else
        {
            return res.status(202).json({"success":false,"message":"Specific booking data doesnot exist."})
        }

    }
    catch(err)
    {
        return res.status(404).json({'success':false,"message":err});
    }
})


router.get('/getBusinessAnalysis/:date',auth.verifyUser,auth.verifyAdmin,async (req,res)=>{
    try
    {
        let date = req.params.date;
        let masterAnalysis = {};
        let chart = {};
        let analysis = await AnalysisItem.find({})       
        .populate({
            "path":"analysisId",
            "match":{"date":date}
        })
        if(analysis.length > 0)
        {
            masterAnalysis = analysis[0].analysisId;
            let overallForChart = await Analysis.find({});
            overallForChart.sort((a,b)=>{return a.date.localeCompare(b.date)})
            let minDate = overallForChart[0].date;
            overallForChart.map((val)=>{return chart[val.date] = val.businessPoint});        
            return res.status(200).json({"success":true,"message":"Data Fetched","data":analysis,"master":masterAnalysis,"chart":chart,"minDate":minDate});
        }
        else
        {
            return res.status(202).json({"success":false,"message":"No data found."});
        }      
    }
    catch(err)
    {
        return res.status(404).json({"success":false,"message":err});
    }
})



router.get('/satisfactionMapping',auth.verifyUser,auth.verifyAdmin,(req,res)=>{
    User.find({})
    .sort({"fname":1})
    .then((data)=>{
        if(data.length > 0)
        {
            data.sort((a,b)=>{return a.satisfactionPoint - b.satisfactionPoint}).reverse();
            let satisfactionData = {};
            data.map((val)=>{return satisfactionData[val.Username] = val.satisfactionPoint});
            return res.status(200).json({"success":true,"message":"Data analyzed","data":satisfactionData})
        }
        else
        {
            return res.status(202).json({'success':false,"message":"No satisfaction records."})
        }
    })
    .catch((err)=>{
        return res.status(404).json({"success":false,"message":err})
    })
})


router.get('/dailyAnalysis/:date',auth.verifyUser,auth.verifyAdmin,async (req,res)=>{
    try
    {
        let date = req.params.date;
        //fetching every results from analysis model keeping analysis item as a parent.
        let analysis = await AnalysisItem.find({})
        .populate({
            "path":"analysisId",
            "match":{"date":date}
        })
        .populate({
            "path":"item",
            "options":{
                "sort":{
                    "pname":1
                }
            }
        })

        //go according to sale rate.
        if(analysis.length > 0)
        {
            let itemsDescriptionContainer = {};
            let sortedPrice = {};
            let sortedQuantity = {};
            for(var i of analysis)
            {
                if(Object.keys(itemsDescriptionContainer).includes(i.item.pname))
                {
                    itemsDescriptionContainer[i.item.pname][0]+=i.quantity;
                    itemsDescriptionContainer[i.item.pname][1]+=i.priceCollection;
                    
                }
                else
                {
                    itemsDescriptionContainer[i.item.pname] = [i.quantity,i.priceCollection]
                }
            }


            let quantityValues = Object.values(itemsDescriptionContainer).map((val)=>{return val[0]});
            let unqQuantity = Array.from(new Set(quantityValues));
            unqQuantity.sort((a,b)=>{return a-b}).reverse();

            let priceValue = Object.values(itemsDescriptionContainer).map((val)=>{return val[1]});
            let unqPrice = Array.from(new Set(priceValue));
            unqPrice.sort((a,b)=>{return a-b}).reverse();

            for(var i of unqPrice)
            {
                for(var j in itemsDescriptionContainer)
                {
                    if(i == itemsDescriptionContainer[j][1])
                    {
                        sortedPrice[j] = itemsDescriptionContainer[j]
                    }
                }
            }

            for(var i of unqQuantity)
            {
                for(var j in itemsDescriptionContainer)
                {
                    if(i == itemsDescriptionContainer[j][0])
                    {
                        sortedQuantity[j] = itemsDescriptionContainer[j]
                    }
                }
            }

            let overallPackage = {};
            overallPackage['quantityBox'] = sortedQuantity;
            overallPackage['priceBox'] = sortedPrice;
 
            let overallAnalysis = analysis[0].analysisId;
            return res.status(200).json({"success":true,"overallAnalysis":overallAnalysis,"data":overallPackage,"date":getFancyDate(new Date(date))})
        }
        else
        {
            return res.status(202).json({"success":false,"message":"0 records found."})
        }
    }
    catch(err){
        return res.status(404).json({"success":false,"message":err});
    }
})


module.exports = router;