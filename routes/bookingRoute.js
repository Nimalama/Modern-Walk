const express = require('express');
const router = express.Router();
const ClothingBooking = require('../models/bookingModel');
const Product = require('../models/productModel');
const auth = require('../middleware/auth');
const {todayDate,bookingData} = require('../utils/utils');
const {check,validationResult} = require('express-validator')

router.post('/book/clothing',auth.verifyUser,(req,res)=>{
   
    let pid = req.body['product_id'];
    let quantity = parseInt(req.body['quantity']);
   
    let booked_At = todayDate(new Date());
    let today = new Date();
    today.setDate(today.getDate()+2);
    let deliveryStarts = todayDate(today);
    let address = req.body['delivery_address'].trim();
    let phone = req.body['delivery_number'].trim();
    ClothingBooking.findOne({"product_id":pid,"user_id":req.user._id}).then((clothing)=>{
        if(clothing == null)
        {
            ClothingBooking.find({}).then((data)=>{
                let bookingCode = bookingData(data);
                    Product.findOne({"_id":pid}).then((data2)=>{
                        if(data2!=null)
                        {
                            if(data2.availableStock >= quantity)
                            {
                                data2.availableStock = data2.availableStock - quantity;
                                data2.sold = data2.sold + quantity;
                                let price;
                                if(data2.newPrice > 0)
                                {
                                    price = quantity * data2.newPrice
                                }
                                else
                                {
                                    price = quantity * data2.pprice;
                                }
                                const booking = new ClothingBooking({"product_id":pid,"quantity":quantity,"price":price,"booked_At":booked_At,"deliveryStarts":deliveryStarts,"delivery_address":address,"delivery_number":phone,"bookingCode":bookingCode,"user_id":req.user._id,bookedDate:new Date()});
                                booking.save().then((result)=>{
                                    Product.updateOne({"_id":pid},{$set:{"availableStock":data2.availableStock,"sold":data2.sold}}).then((result)=>{}).catch((err)=>{
                                        return res.status(404).json({"success":false,"message":err})
                                    })
                                    return res.status(200).json({"success":true,"message":"Added"});
                                })
                                .catch((err)=>{
                                    console.log(err)
                                    return res.status(404).json({"success":false,"message":err})
                                })
                               
                            }
                            else
                            {
                                return res.status(202).json({"success":false,"message":`Out of Stock!!`})
                            }
                        }
                        else
                        {
                            return res.status(202).json({"success":false,"message":`Product not available!!`})
                        }
                    })
                
                
        
            })
        }
        else
        {
            return res.status(202).json({"success":false,"message":"Item already exists in cart."})
        }
    })

})


router.get('/retrieve/myBookings',auth.verifyUser,(req,res)=>{
    let query = ClothingBooking.find({"user_id":req.user._id}).sort({"bookedDate":-1}).populate(
        {
            path:"product_id"
        }
    );
    query.then((data)=>{
        console.log(data)
        if(data.length > 0)
        {
            return res.status(200).json({"success":true,"message":'Data found',"data":data});
        }
        else
        {
            return res.status(200).json({"success":false,"message":'No Data Found',"data":data});
        }
    }).catch((err)=>{
        return res.status(404).json({"success":false,"message":err});
    })
})


router.post('/delete/booking',auth.verifyUser,(req,res)=>{
    let pid = req.body['pid'];
    let query =ClothingBooking.findOne({"_id":pid});
    query.then((data)=>{
        if(data!=null)
        {
            let query3 = ClothingBooking.findOne({"_id":pid});
            query3.then((data3)=>{
                if(data3!=null)
                {
                    let product_id = data.product_id;
            let query2 = Product.findOne({"_id":product_id});
            let quantity = data.quantity;
            query2.then((data2)=>{
                if(data2 != null)
                {
                    data2.availableStock = data2.availableStock + quantity;
                    data2.sold = data2.sold - quantity;
                    Product.updateOne({"_id":product_id},{$set:{"availableStock":data2.availableStock,"sold":data2.sold}}).then((result)=>{
                        ClothingBooking.deleteOne({"_id":pid}).then((result2)=>{
                            return res.status(200).json({"success":true,"message":"Deleted"})
                        }).catch((err)=>{
                            console.log(err)
                            return res.status(404).json({"success":false,"message":err})
                        })
                    }).catch((err)=>{
                        console.log(err)
                        return res.status(404).json({"success":false,"message":err})
                    })
                }
            })
                }
                else
                {
                    return res.status(202).json({"success":false,"message":"Your editing permission have been closed. Permission valids for 2 days after booking."})
                }
            })
            
        }
    })
})



router.post('/update/booking',auth.verifyUser,(req,res)=>{
    let pid = req.body['pid'];
    let qty = req.body['qty'];
    ClothingBooking.findOne({"_id":pid}).then((data)=>{
        if(data!=null)
        {
            ClothingBooking.findOne({"_id":pid}).then((data2)=>{
                if(data2!=null)
                {
                    
                    let product_id = data.product_id;
                    Product.findOne({"_id":product_id}).then((data3)=>{
                      if(data3!=null)
                      {
                        let bookedQty = data2.quantity;
                        data3.availableStock = data3.availableStock + bookedQty
                        data3.sold = data3.sold - bookedQty
                        
                        if(data3.availableStock >= qty)
                        {
                            let price;
                            if(data3.newPrice > 0)
                            {
                                price = qty*data3.newPrice;
                            }
                            else
                            {
                                price = qty*data3.pprice;
                            }
                            data3.availableStock = data3.availableStock - qty;
                            data3.sold = data3.sold +qty;
                            
                            ClothingBooking.updateOne({"_id":pid},{$set:{"quantity":qty,"price":price}}).then((result2)=>{
                                
                                Product.updateOne({"_id":data3._id},{$set:{"availableStock":data3.availableStock,"sold":data3.sold}}).then((result)=>{
                                       return res.status(200).json({"success":true,"message":"Updated"}); 
                                }).catch((err)=>{
                                    return res.status(404).json({"success":false,"message":err});
                                }) 
                            }).catch((err)=>{
                                return res.status(404).json({"success":false,"message":"dsafvd"});
                            }) 
                            
                        }
                            
                        else
                        {
                            return res.status(202).json({"success":false,"message":"Out of Stock."})
                        }
                      }
                      else
                      {
                        return res.status(202).json({"success":false,"message":"Product unavailable."})
                      }
                    })
                }
                else
                {
                    return res.status(202).json({"success":false,"message":"Your editing permission have been closed. Permission valids for 2 days after booking."})
                }
            })
        }
    })
})


module.exports = router;