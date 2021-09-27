//third party modules
const express = require('express');
const router = express.Router();
const {check,validationResult} = require('express-validator');
const validator = require('validator');

//models
const HotelMenu = require('../models/hotelMenu');
const HotelFoodModel = require('../models/hotelFoodModel');

//local modules
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const {getCustomizedError,replaceAll} = require('../utils/utils');


//API: To add a new food for a menu of a hotel.
router.post('/addAItem',upload.fields([{'name':'foodPictures','maxCount':5}]),auth.verifyUser,[
    check('category','Category cannot be left empty.').not().isEmpty(),
    check('foodName','Foodname cannot be left empty.').not().isEmpty(),
    check('flavor','Flavor cannot be left empty.').not().isEmpty(),
    check('description','Description cannot be left empty.').not().isEmpty(),
    check('price','Price cannot be left empty.').not().isEmpty(),
    check('discountPercent','Discount Percent cannot be left empty.').not().isEmpty(),
    check('status','Please choose status.').not().isEmpty(),
    check('price','Price should be in numeric form.').isNumeric(),
    check('discountPercent','Discount Percent should be in numeric form.').isNumeric()
],async(req,res)=>{
    try{
      let errorBox = {};
      if(req.files['foodPictures'] == undefined)
      {
          errorBox['foodPictures'] = "Inappropriate file format.";
      }
      

      let errors = validationResult(req);
      if(errors.isEmpty() && Object.keys(errorBox).length <= 0)
      {
          let category = req.body['category'].trim().toUpperCase();
          let foodName = req.body['foodName'].trim();
          let flavor = req.body['flavor'].trim();
          let description = req.body['description'].trim();
          let price = parseInt(req.body['price']);
          let discountPercent = parseInt(req.body['discountPercent']);
          let status = req.body['status'];

          let newPrice =  discountPercent > 0 ? parseInt(price - ((discountPercent / 100) * price)) : price;

          let hotelMenu = await HotelMenu.findOne({'category': category}); //hotel id too in future purpose.
          let hotelFood = await HotelFoodModel.find({})//hotel id too in future purpose.
          .populate({
              "path":"hotelMenuId"
              
          })
            let foodsAndFlavors = hotelFood.map((val)=>{return replaceAll(val.foodName.toLowerCase()," ","")+"-"+replaceAll(val.flavor.toLowerCase()," ","")});
          let checkFood = "";
          if(foodsAndFlavors.includes(replaceAll(foodName.toLowerCase()," ","")+"-"+replaceAll(flavor.toLowerCase()," ","")))
          {
              checkFood = Array.from(new Set(hotelFood.filter((val)=>{return (replaceAll(val.foodName.toLowerCase()," ","")+"-"+replaceAll(val.flavor.toLowerCase()," ","")) == (replaceAll(foodName.toLowerCase()," ","")+"-"+replaceAll(flavor.toLowerCase()," ",""))}).map((val)=>{return val.hotelMenuId.category}))).join(",");
              
          }  
         
          if(hotelMenu != null)
          {
            
                if(checkFood.length <= 0)
               {
                const menuObj = new HotelFoodModel({
                    "hotelMenuId":hotelMenu._id,
                    'foodName':foodName,
                    'flavor':flavor,
                    'description':description,
                    'price':price,
                    'discountPercent':discountPercent,
                    'newPrice':newPrice,
                    'status':status,
                    'foodPictures':req.files.foodPictures.map((val)=>{return val.path})
                })
    
                menuObj.save()
                .then((data2)=>{
                    return res.status(200).json({'success':true,'message':"Added"});
                })
                .catch((err)=>{
                   return res.status(404).json({'success':false,'message':err});  
                })   
            }
            else
            {
                return res.status(202).json({"succes":false,'message':"Error",'error':{'random':`Food with same flavor already exists in ${checkFood} categories.`}});
            }
            
           
          }
          else
          {
              if(checkFood.length <= 0)
              {
              let totalOrder = await HotelMenu.countDocuments({}); //hotelId filtration 
              let hotelObj = new HotelMenu({
                  "category":category,
                  "order":totalOrder+1
              })

              hotelObj.save()
              .then((data)=>{
                 const menuObj = new HotelFoodModel({
                     "hotelMenuId":data._id,
                     'foodName':foodName,
                     'flavor':flavor,
                     'description':description,
                     'price':price,
                     'discountPercent':discountPercent,
                     'newPrice':newPrice,
                     'status':status,
                     'foodPictures':req.files.foodPictures.map((val)=>{return val.path})
                 })

                 menuObj.save()
                 .then((data2)=>{
                     return res.status(200).json({'success':true,'message':"Added"});
                 })
                 .catch((err)=>{
                    return res.status(404).json({'success':false,'message':err});  
                 })
              })
              .catch((err)=>{
                  return res.status(404).json({'success':false,'message':err});
              })
            }
            else
            {
                return res.status(202).json({"succes":false,'message':"Error",'error':{'random':`Food with same flavor already exists in ${checkFood} categories.`}});
            }
          }

      }
      else
      {
         let customizedError = getCustomizedError(errors.array());
         for(var i in errorBox)
         {
             customizedError[i] = errorBox[i];
         }
         return res.status(202).json({'success':false,'message':"Error found.",'error':customizedError});

      }
      
    }
    catch(err)
    {
        console.log(err);
        return res.status(404).json({'success':false,'message':err});
    }
})


//API: To update food details.
router.put('/updateFood',auth.verifyUser,[
    check('foodName','Foodname cannot be left empty.').not().isEmpty(),
    check('flavor','Flavor cannot be left empty.').not().isEmpty(),
    check('description','Description cannot be left empty.').not().isEmpty(),
    check('price','Price cannot be left empty.').not().isEmpty(),
    check('discountPercent','Discount Percent cannot be left empty.').not().isEmpty(),
    check('status','Please choose status.').not().isEmpty(),
    check('price','Price should be in numeric form.').isNumeric(),
    check('discountPercent','Discount Percent should be in numeric form.').isNumeric()
],async(req,res)=>{
    try
    {
        let errors = validationResult(req);
        if(errors.isEmpty())
        {
            let foodName = req.body['foodName'].trim();
            let flavor = req.body['flavor'].trim();
            let description = req.body['description'].trim();
            let price = parseInt(req.body['price']);
            let discountPercent = parseInt(req.body['discountPercent']);
            let status = req.body['status'].trim();
            let foodId = req.body['foodId'];

            let newPrice =  discountPercent > 0 ? parseInt(price - ((discountPercent / 100) * price)) : price;



            let foodDetail = await HotelFoodModel.findOne({'_id':foodId});
            if(foodDetail != null)
            {
                let foods = await HotelFoodModel.find({'_id':{$ne:foodDetail._id}})
                .populate({
                    'path':"hotelMenuId"
                })  //use hotelID for more precision.
                let foodsAndFlavors = foods.map((val)=>{return replaceAll(val.foodName.toLowerCase()," ","")+"-"+replaceAll(val.flavor.toLowerCase()," ","")});

                if(!foodsAndFlavors.includes(replaceAll(foodName.toLowerCase()," ","")+"-"+replaceAll(flavor.toLowerCase()," ","")))
                {
                    HotelFoodModel.updateOne({
                        "_id":foodId
                    },{
                        $set:{
                            "foodName":foodName,
                            "flavor":flavor,
                            "description":description,
                            'price':price,
                            'discountPercent':discountPercent,
                            'status':status,
                            'newPrice':newPrice
                        }
                    }) 
                    .then((result)=>{
                        return res.status(200).json({'success':true,'message':"Updated!!"});
                    })
                    .catch((err)=>{
                        return res.status(404).json({'success':false,'message':err});
                    })
                }
                else
                {
                    let occurenceFiltration = Array.from(new Set(foods.filter((val)=>{return replaceAll(val.foodName.toLowerCase()," ","")+"-"+replaceAll(val.flavor.toLowerCase()," ","") == replaceAll(foodName.toLowerCase()," ","")+"-"+replaceAll(flavor.toLowerCase()," ","")}).map((val)=>{return val.hotelMenuId.category})));
                    return res.status(202).json({'success':false,'message':'Error','error':{'random':`Food with same flavor already exists in ${occurenceFiltration.join(",")} categories.`}});
                }
            }
            else
            {
            
                return res.status(202).json({'success':false,'message':'Error','error':{'random':"Menu with given food unavailable."}});
            }
        }
        else
        {
            let customizedError = getCustomizedError(errors.array());
            return res.status(202).json({'success':false,'message':'Error','error':customizedError});
        }
    }
    catch(err)
    {
        return res.status(404).json({'success':false,'message':err});
    }
})

//API: Manage the order (swapping: if possible)


module.exports = router;



