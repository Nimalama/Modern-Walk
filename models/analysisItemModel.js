const mongoose = require('mongoose');
const {ObjectId} = require('bson');
const Analysis = require('./analysisModel');
const Product = require('./productModel');

const AnalysisItem = mongoose.model("AnalysisItem",{
    "analysisId":{"type":ObjectId,"required":true,"ref":Analysis},
    "item":{"type":ObjectId,"required":true,"ref":Product},
    "quantity":{"type":Number,"required":true},
    "priceCollection":{"type":Number,"required":true}
})

module.exports = AnalysisItem;