const mongoose = require('mongoose');

const Product = mongoose.model('Product', {
    
    pname : {type :String},
    pprice : {type :Number},
    pdesc : {type :String},
    pimage : {type: String,default:"no-img.jpg"},
    availableStock:{"type":Number,"required":true},
    sold:{"type":Number,"required":true},
    productCode:{"type":String,"required":true},
    pBrand:{"type":String,"required":true},
    discount:{"type":Number,"required":true},
    newPrice:{"type":Number,"required":true},
    discountedAmount:{"type":Number,"required":true},
    onSale:{"type":Boolean,"required":true},
    category:{"type":String,"required":true}
})
module.exports = Product