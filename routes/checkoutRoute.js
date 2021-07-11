const express = require('express');
const router = express.Router();
const Checkout = require('../models/checkoutModel');
const ClothBooking = require('../models/bookingModel')
const auth = require('../middleware/auth')
const {check, validationResult} = require('express-validator')
const {getProductCode,getFormattedToday,getTimeValue,getFancyDate} = require('../utils/utils')
const {sendMailMessage} = require('../utils/mail');

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

                const bookingObj = new Checkout({
                    "quantity":qty,
                    "price":price,
                    "address":address,
                    "phoneNo":phoneNo,
                    "phoneNo2":phoneNo2,
                    "booking_id":bid,
                    "bookingCode":bookingCode,
                    "booked_at":getFormattedToday(new Date()),
                    "timeHour":[new Date().getHours(),new Date().getMinutes()],
                    "dateTime":new Date()
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

    let pendingsOnAWay = await Checkout.find({"userStatement":"Not Provided",$or:{"deliveryStatus":"Pending","deliveryStatus":"On a way"}})
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
   let bid = req.params.tid;
   let bookData = Checkout.findOne({"_id":bid,"deliveryStatus":"Pending"})
   bookData.then((data)=>{
       if(data!=null)
       {
          let dateInitialization = new Date(data.booked_at);
          dateInitialization.setHours(data.timeHour[0],data.timeHour[1],0)
          let difference = parseInt((new Date().getTime() - dateInitialization.getTime() )/(1000*60*60))
          if(difference >=24)
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
           return res.status(202).json({"success":false,"message":"Deleting time was limited for 24 hours only!"})
       }
   })
   .catch((err)=>{
       return res.status(404).json({"success":false,"message":err});
   })  
})

module.exports = router;