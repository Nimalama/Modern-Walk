const Checkout = require('../models/checkoutModel');
const {getFormattedToday} = require('../utils/utils');
const TimeHalt = require('../models/timehalt')

const mapCheckout = async (req,res)=>{
    try
    {
        let checkoutItems = await Checkout.find({"deliveryStatus":"Pending","booked_at":{$lt:getFormattedToday(new Date())}})
        if(checkoutItems.length > 0)
        {
           
            for(var i of checkoutItems)
            {
               let bookedDate = i.booked_at;
               let hour = i.timeHour[0];
               let minute = i.timeHour[1];
               
               let dateInitialization = new Date(bookedDate);
               dateInitialization.setHours(hour,minute,0);

               let difference = parseInt((new Date().getTime() - dateInitialization.getTime())/(1000*60*60));
               if(difference >= 24)
               {
                   Checkout.updateOne({"_id":i._id},{$set:{"deliveryStatus":"On a way","deliveryTaken":"Closed"}})
                   .then((result)=>{})
                   .catch((err)=>{})
               }

            }
        }
        else
        {
            console.log("No Records to map checkouts.")
        }
    }
    catch(err)
    {
        console.log(err);
    }
}


const limitations = (req,res)=>{
    TimeHalt.findOne({"_id":"","updated_at":{$ne:getFormattedToday(new Date())}})
    .then((data)=>{
        if(data != null)
        {
            let checkOutLimitation = Checkout.find({"limit":{$exists:true},"limit":{$lte:getFormattedToday(new Date())},"userStatement":"Not Provided"});
            checkOutLimitation.then((data2)=>{
                if(data2.length > 0)
                {
                    for(var i of data2)
                    {
                        Checkout.updateOne({"_id":i._id},{$set:{"userStatement":"Success"}})
                        .then((result)=>{})
                        .catch((err)=>{})
                    }
                }
            })
        }
        else
        {
            console.log("Limitation Mapped for today.")
        }
    })
    .catch((err)=>{
        console.log(err);
    })
}
//replacement Tracking
const replacementTracking = (req,res)=>{
    Checkout.find({"replacementDate":{$exists:true},"replacementDate":{$lt:getFormattedToday(new Date())},"deliveryStatus":"Pending"})
    .then((data)=>{
        if(data.length > 0)
        {
            for(var i of data)
            {
                let date = i.replacementDate;
                let time = i.replacementTimeHour;

                let formatted = new Date(date);
                formatted.setHours(time[0],time[1]);

                let difference = parseInt((new Date().getTime() - formatted.getTime())/(1000*60*60));
                if(difference >= 24)
                {
                    Checkout.updateOne({"_id":i._id},{$set:{"deliveryStatus":"On a way","deliveryTaken":"Closed"}})
                    .then((result)=>{})
                    .catch((err)=>{})
                }
            }
        }
        else
        {
            console.log("No records in replacement");
        }
    })
    .catch((err)=>{
        console.log(err);
    })
}

module.exports = {mapCheckout,limitations,replacementTracking};