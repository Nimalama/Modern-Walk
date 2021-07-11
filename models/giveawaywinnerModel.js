const mongoose = require('mongoose');
const {ObjectId} = require('bson');
const Giveaway=require('./giveawayModel');

const GiveawayWinner = mongoose.model("GiveawayWinner",{
    "giveaway_id":{"type":ObjectId,"require":true,"ref":Giveaway},
    "winners":{"type":String,"require":true},
    "resultGeneratedAt":{"type":"String","require":true},
    "resultTime":{"type":String,require:true}
})
module.exports =GiveawayWinner;