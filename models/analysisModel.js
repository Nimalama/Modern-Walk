const mongoose = require('mongoose');
const {ObjectId} = require('bson');

const Analysis = mongoose.model('Analysis',{
    "day":{"type":String,"required":true},
    "date":{"type":String,"required":true},
    "fancyDate":{"type":String,"required":true},
    "priceCollected":{"type":Number,"required":true},
    "commision":{"type":Number,"required":true},
    "businessPoint":{"type":Number,"required":true}, //commision divide priceCollected
    "itemsSold":{"type":Number,"required":true},
    "quantity":{"type":Number,"required":true}
})

module.exports = Analysis;