const mongoose = require('mongoose');
const {ObjectId} = require('bson');
const Registration=require('./registration');
const Giveaway=require('./giveawayModel');

const Participants=mongoose.model("Participants",{
    "user_id":{"type":ObjectId,"ref":Registration,"required":true},
    "giveaway_id":{"type":ObjectId,"ref":Giveaway,"required":true},
    "participatedCode":{"type":String,"required":true},
    "participated_at":{"type":String,"required":true},
    "participation_time":{"type":String,"required":true}
})
module.exports=Participants;