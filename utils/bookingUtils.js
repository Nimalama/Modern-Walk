const Checkout = require('../models/checkoutModel');
const User = require('../models/registration')
const ClothingBooking = require('../models/bookingModel');
const {getFormattedToday, filterDate,days,getFancyDate} = require('../utils/utils');
const TimeHalt = require('../models/timehalt')
const Analysis = require('../models/analysisModel');
const AnalysisItem = require('../models/analysisItemModel');
const Quiz = require('../models/quizModel')
const Doctor = require('../models/doctorModel');
const asyncc = require('async')
const {sendMailMessage} = require('../utils/mail')

let todayDay = days[new Date().getDay()];

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
   
            let checkOutLimitation = Checkout.find({"limit":{$exists:true},"limit":{$lte:getFormattedToday(new Date())},"userStatement":"Not Provided"});
            checkOutLimitation.then((data2)=>{
                if(data2.length > 0)
                {
                    for(var i of data2)
                    {
                        Checkout.updateOne({"_id":i._id},{$set:{"userStatement":"Success","deliveredAt":getFormattedToday(new Date())}})
                        .then((result)=>{})
                        .catch((err)=>{})
                    }
                }
                console.log("Limitations checked.")
            })
            .catch((err)=>{
                return res.status(404).json({"success":true,"message":err});
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

const getPoint = (point)=>{
    //every case point is accumulated.
    let thePoint = 0;
    switch(point)
    {
        case 0:
            thePoint = 0;
            break;
        case 1:
            thePoint = 5;
            break;
        case 2:
            thePoint = 15;  //its point is 10 with case 1 its 15
            break; 
        case 3:
            thePoint = 35;
            break;
       case 4:
           thePoint =  60;
           break;
        
       case 5:
           thePoint = 100;
           break    

    }

    let accumulated = 100-thePoint;
    return accumulated;
}

const mapSatisfaction = async (req,res,checkout,user)=>{
    try
    {
        let userSatisfied = await Checkout.find({"userStatement":"Success"})
        .populate({
            "path":"booking_id",
            "match":{"user_id":user._id}
        })

        let dataBox = userSatisfied.filter((val)=>{return val.booking_id != null}).length
        

        let satisfactionPoints = user.satisfactionPoint;
        
        if(dataBox == 0)
        {
            dataBox = 1
        }
        let overallPoint = satisfactionPoints * (dataBox-1);
        let newPoint = getPoint(checkout.replacements);
        

        let newOverall = overallPoint+newPoint;
        let satisfactionMapped = parseFloat((newOverall / dataBox).toPrecision(2));

        User.updateOne({"_id":user._id},{
            $set:{
                "satisfactionPoint":satisfactionMapped
            }
        })
        .then((result)=>{
            return res.status(200).json({"success":true,"message":"Thank you and visit again."})
        })
        .catch((err)=>{
            return res.status(404).json({"success":false,"message":err})
        })

    }
    catch(err)
    {
        return res.status(404).json({"success":false,"message":err});
    }
}


const analyzeBusiness = async (req,res)=>{
    try
    {
        let today = new Date();
        today.setDate(today.getDate()-3);
        let latestAnalyzed = getFormattedToday(today);
        let analysisResults = await Analysis.find({}).sort({"date":-1}).limit(1);
        if(analysisResults.length > 0)
        {
           latestAnalyzed = analysisResults[0].date;
        }
        
        let dateFiltration = filterDate(latestAnalyzed); 
        dateFiltration.sort((a,b)=>{return a.localeCompare(b)});

        if(dateFiltration.length > 0)
        {
            asyncc.forEach(dateFiltration,async (i)=>{
                let successCheckouts = await Checkout.find({"deliveredAt":{$exists:true},"deliveredAt":i,"userStatement":"Success"})
                .populate({
                    "path":"booking_id",
                    "populate":{
                        "path":"product_id",
                        "select":['pname']
                    }
                })
                if(successCheckouts.length > 0)
                {
                    let products = {};
                    for(var j of successCheckouts)
                    {
                        let productId = j.booking_id.product_id._id.toString()
                        if(Object.keys(products).includes(productId))
                        {
                            products[productId][0]+=j.quantity;
                            products[productId][1]+=j.price;
                        }
                        else
                        {
                            products[productId] = [j.quantity, j.price];
                        }
                        
                    }
                    let overallQuantity = Object.values(products).map((val)=>{return val[0]}).reduce((acc,j)=>{return acc+j});
                    let overallPrice = Object.values(products).map((val)=>{return val[1]}).reduce((acc,j)=>{return acc+j});
                    let itemsSold = Object.keys(products).length;
                    let commission = parseFloat(((8/100)*overallPrice).toPrecision(2));
                    let businessPoint = parseFloat(((commission/overallPrice) * 100).toPrecision(2));
                    console.log(businessPoint)
                    console.log(overallPrice)
                    console.log(overallQuantity)
                    console.log(commission)
                    console.log(days)
                   
                    let analysisObj = new Analysis({
                        "day":days[new Date(i).getDay()],
                        "date":i,
                        "fancyDate":getFancyDate(new Date(i)).split("-")[0],
                        "priceCollected":overallPrice,
                        "commision":commission,
                        "businessPoint":businessPoint,
                        "itemsSold":itemsSold,
                        "quantity":overallQuantity
                    })

                    analysisObj.save()
                    .then((result)=>{
                        for(var j in products)
                        {
                            const itemObj = new AnalysisItem({
                                "analysisId":result._id,
                                "item":j,
                                "quantity":products[j][0],
                                "priceCollection":products[j][1]
                            })

                            itemObj.save()
                            .then((result2)=>{})
                            .catch((err)=>{
                                console.log(err);
                            })
                        }
                    })
                    .catch((err)=>{
                        console.log(err);
                    })
                }
            })
            console.log(`Analyzed for ${dateFiltration.join(",")}`);
        }
        else
        {
            console.log("Business analyzed till required.")
        }

    }
    catch(err)
    {
        console.log(err);
    }
}




const quizStart = async ()=>{
    try
    {
        Quiz.updateMany({
            "startAt":getFormattedToday(new Date()),
            "status":"Pending",
            $or:[
                {
                    "startTime.0":new Date().getHours(),
                    "startTime.1":{$lte:new Date().getMinutes()}
                },
                {
                    "startTime.0":{$lt:new Date().getHours()}
                }
            ],
            $or:[
                {
                    "endTime.0":{$gt:new Date().getHours()}
                },
                {
                    "endTime.0":new Date().getHours(),
                    "endTime.1":{$gt:new Date().getMinutes()}
                }
            ]
         
        },{
            $set:{
                "status":"Running"
            }
        })
        .then((result)=>{
            console.log("Some of the quiz is set to running state.")
        })
        .catch((err)=>{
            console.log(err);
        })

    }
    catch(err)
    {
        console.log(err);
    }
}

const quizEnd = async ()=>{
    try
    {
        Quiz.updateMany({
            $or:[
                {
                    "status":"Running"
                },
                {
                    "status":"Pending"
                }
            ],
            $or:[
                {
                    "endTime.0":{$lt:new Date().getHours()},
                    "startAt":getFormattedToday(new Date())
                },
                {
                    "endTime.0":new Date().getHours(),
                    "endTime.1":{$lte:new Date().getMinutes()},
                    "startAt":getFormattedToday(new Date())
                },
                {
                    "startAt":{$lt:getFormattedToday(new Date())}
                }
            ]
        },{
            $set:{
                "status":"Expired"
            }
        })
        .then((result)=>{
            console.log("Some of the quiz is set to expired state.")
        })
        .catch((err)=>{
            console.log(err);
        })
    }
    catch(err)
    {
        console.log(err);
    }
}


const onlineDoctor = async()=>{
    try
    {
       Doctor.updateMany({
           "breaks":{$ne:todayDay},
           "onlineStatus":false,
           $or:[
               {
                  "onlineTime.0":{$lt:new Date().getHours()}  
               },
               {
                  "onlineTime.0":new Date().getHours(),
                  "onlineTime.1":{$gte:new Date().getMinutes()}
               }
           ],
           $or:[
               {
                   "offlineTime.0":new Date().getHours(),
                   "offlineTime.1":{$gt:new Date().getHours()}
               },
               {
                   "offlineTime.0":{$gt:new Date().getHours()}
               }
           ]
       },{
           $set:{
               "onlineStatus":true
           }
       })
      .then((result)=>{
        console.log("Doctors online.")
      })
      .catch((err)=>{
          console.log(err);
      })
    }
    catch(err)
    {
        console.log(err);
    }
}


const offlineDoctor = async()=>{
    try
    {
       Doctor.updateMany({
           "onlineStatus":true,
           $or:[
               {
                  "offlineTime.0":{$lt:new Date().getHours()}
               },
               {
                  "offlineTime.0":new Date().getHours(),
                  "offlineTime.1":{$lte:new Date().getMinutes()}
               }
           ]
       },{
           $set:{
               "onlineStatus":false
           }
       })
       .then((result)=>{
           console.log("Offline done")
       })
       .catch((err)=>{
           console.log(err);
       })
    }
    catch(err)
    {
        console.log(err);
    }
}


//Function:To send message to the customers who havenot checkout anything in 2 months time or havenot bought anything yet.
const messageForUnavailability = async()=>{
    try
    {
        if(new Date().getDate() % 4 == 0)
        {
                 //date instance
        let instance = new Date();
        instance.setDate(instance.getDate() - 60);
        let formattedInstance = getFormattedToday(instance);
        //filter every users
        let users = await User.find({'UserType':"Buyer"});
        let allUsers = await User.find({});
        
        //filter carts according to user and latestBought.
        let carts = await ClothingBooking.aggregate([
            {
                $group:{
                    "_id":"$user_id",
                    "lastBought":{$max:"$booked_At"}
                }
            }
        ])

        //filter all carts
        let allCarts = await ClothingBooking.find({});
        let interactionUsers = allCarts.map((val)=>{return val.user_id.toString()});
        let unInteractedUsers = users.filter((val)=>{return !interactionUsers.includes(val._id.toString()) && val.createdAt <= formattedInstance}).map((val)=>{return val._id.toString()});
      
       //filtration according to date.
       let unavailable = carts.filter((val)=>{return val.lastBought <= formattedInstance});
       let unavailableUsers = unavailable.map((val)=>{return val._id.toString()});
       unavailableUsers.push(...unInteractedUsers);

       //fetching email address and username of the users
       let usernameOfUnavailable = allUsers.filter((val)=>{return unavailableUsers.includes(val._id.toString())}).map((val)=>{return val.Username});
       let emailOfUnavailable = allUsers.filter((val)=>{return unavailableUsers.includes(val._id.toString())}).map((val)=>{return val.Email});
     
       //content for mail
       
        //sending mail
       for(var i of emailOfUnavailable)
       {
        let content = {
            "heading": "Modern Walk",
            "greeting":usernameOfUnavailable[emailOfUnavailable.indexOf(i)],
            "message": `We notice that you haven’t used your Modern Walk account to buy stuffs online. We would love to see you back!`,
            "message2": "You can use our Modern Walk Web Application which is available for Windows, macOS and Linux.",
            "message3":"Please note that all your data on application is encrypted with your password, which only you have. If you want to access the data in your Modern Walk account, you either need your password",
            "message4":"Checkout sales,giveaways,discounts and quickly buy your goods.",    
            "task": "Unavailability"
        }
           
            sendMailMessage("Modern Walk misses you!",i,content);
       }
     
       console.log("Notification for welcome back sent.");
        }
   

    }
    catch(err)
    {
        console.log(err);
    }
} 


module.exports = {mapCheckout,limitations,replacementTracking,mapSatisfaction,analyzeBusiness,quizStart,quizEnd,onlineDoctor,offlineDoctor,messageForUnavailability};