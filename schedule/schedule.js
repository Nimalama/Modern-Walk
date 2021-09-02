const schedule = require('node-schedule');
const {giveawayResult}=require('../utils/giveawayUtils');
const {mapCheckout,limitations,replacementTracking,analyzeBusiness,quizStart,quizEnd} = require('../utils/bookingUtils');


let today = new Date();

today.setHours(8,17,0)


schedule.scheduleJob("1 min task","*/1 * * * *",(req,res)=>{
    mapCheckout(req,res);
    replacementTracking(req,res);
    quizStart();
    quizEnd();
})

schedule.scheduleJob('1 day task',today,(req,res)=>{
    analyzeBusiness(req,res)
    limitations(req,res);
    giveawayResult(req,res);
})