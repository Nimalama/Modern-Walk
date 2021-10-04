const schedule = require('node-schedule');
const {giveawayResult}=require('../utils/giveawayUtils');
const {mapCheckout,limitations,replacementTracking,analyzeBusiness,quizStart,quizEnd,messageForUnavailability} = require('../utils/bookingUtils');
const {orderSwitch,eightMinuteAlert,sixteenMinuteAlert,ratingAverage} = require('../utils/hotelUtils');


let today = new Date();

today.setHours(11,8,0)


schedule.scheduleJob("1 min task","*/1 * * * *",(req,res)=>{
    mapCheckout(req,res);
    replacementTracking(req,res);
    quizStart();
    quizEnd();
    orderSwitch();
    eightMinuteAlert();
    sixteenMinuteAlert();

})

schedule.scheduleJob('1 day task',today,(req,res)=>{
    analyzeBusiness(req,res)
    limitations(req,res);
    giveawayResult(req,res);
    ratingAverage();
    messageForUnavailability();
})