//third party modules
const express = require('express');
const router = express.Router();
const {check,validationResult} = require('express-validator');
const validator = require('validator');

//models
const MultiImages = require('../models/multiImages');

//local modules
const upload = require('../middleware/upload.js');
const {getFormattedToday} = require('../utils/utils');


//API: To post multiple images in a database
router.post('/addImageList',upload.fields([{'name':'image1','maxCount':3},{'name':'image2','maxCount':3},{'name':'image3','maxCount':3}]),async(req,res)=>{
    try{
      let errorBox = {}
      if(req.files['image1'] == undefined)
      {
         errorBox['image1'] = "Inappropriate file for image1";
      }
      if(req.files['image2'] == undefined)
      {
         errorBox['image2'] = "Inappropriate file for image2";
      }
      if(req.files['image3'] == undefined)
      {
         errorBox['image3'] = "Inappropriate file for image3";
      }


      let addedBy = req.body['addedBy'].trim();

      if(Object.keys(errorBox).length > 0)
      {
          return res.status(202).json({'success':false,'message':'Error','error':errorBox});
      }
      else
      {
        const mObj = new MultiImages({
            "addedAt":getFormattedToday(new Date()),
            "addedBy":addedBy,
            "image1":req.files.image1.map((val)=>{return val.path}),
            "image2":req.files.image2.map((val)=>{return val.path}),
            "image3":req.files.image3.map((val)=>{return val.path})
        })

        mObj.save()
        .then((data)=>{
            return res.status(200).json({'success':true,'message':"Added to db"});
        })
        .catch((err)=>{
            return res.status(404).json({'success':false,'message':err});
        })
      }
     

    }
    catch(err)
    {
        console.log(err);
        return res.status(404).json({'success':true,'message':err});
    }
})


module.exports = router;