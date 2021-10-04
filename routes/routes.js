const express = require('express');
const router = express.Router();
const User = require('../models/registration');
const { check, validationResult } = require('express-validator');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth= require('../middleware/auth');
const upload = require('../middleware/upload');
const {sendMailMessage} = require('../utils/mail')
const {OAuth2Client} = require('google-auth-library');
const {genPinCode,parentPinGeneration,getFormattedToday} = require('../utils/utils')

const client = new OAuth2Client("152506000566-5ai7d5st3ufv6amebke7fel88hug8ihf.apps.googleusercontent.com")

router.post('/users/insert', [
    check('fname', "First Name is required!!!").not().isEmpty(),
    check('lname', "Last Name is required!!!").not().isEmpty(),
   
    check('Address', "Address is required!!!").not().isEmpty(),
    check('Username', "UserName is required!!!").not().isEmpty(),
    check('Phoneno', "Phone number is required!!!").not().isEmpty(),
    check('Email', "Email is required!!!").not().isEmpty(),
    check('Email', " Invalid email!!!").isEmail(),
    check('Password', "Password is required!!!").not().isEmpty()

], function (req, res) {
    const errors = validationResult(req);
    //res.send(errors.array());
    if (errors.isEmpty()) {
        //valid
        const First_Name = req.body.fname;
        const Last_Name = req.body.lname;
        const Gender = req.body.Gender;
        let DOB = req.body.Dob;
        const Nationality = req.body.Nationality;
        const Address = req.body.Address;
        const Phoneno = req.body.Phoneno;
        const Username = req.body.Username;
        const Email = req.body.Email;
        const Password = req.body.Password; //fetch from cilent
        const UserType = "Buyer"
        bcryptjs.hash(Password, 10, function (err, hash1) {
            // DOB = new Date(DOB);
            const data = new User({
                fname: First_Name,
                lname: Last_Name,
                Gender: Gender,
                Dob: DOB,
                Phoneno: Phoneno,
                Nationality: Nationality,
                Address: Address,
                Username: Username,
                Email: Email,
                Password: hash1,
                UserType: UserType,
                createdAt:getFormattedToday(new Date())
            })

            data.save().then(function (result) {
                //success message with status code
                return res.status(201).json({ success: true, message: "Register!!!" })
            })
                .catch(function (error1) {
                    console.log(error1)
                    return res.status(500).json({ success: false, message: error1 })
                })
        })

    } else {
        //invalid dara from cilent
        res.status(400).json({ success: false, message: errors.array() });
    }
})

router.get('/test', function (req, res) {
    console.log("this is test request!!")
})





//lets create a login system
router.post('/users/login', function (req, res) {
    const Username = req.body.Username
    const Password = req.body.Password
    User.findOne({ Username: Username })
        .then(function (userData) {
            if (userData === null) {
                //this is not found
                return res.status(401).json({ success: false, message: "UserName doesn't exists" })
            }
            //lets now campare the password
            bcryptjs.compare(Password, userData.Password, function (error, result) {
                if (result === false) {
                    //username correct/ password incorrect
                    return res.status(401).json({ success: false, message: "Password doesn't exists" })
                }
                //now lets generate token
                //res.send(userData)
                const token = jwt.sign({ userId: userData._id }, 'secretkey');
                res.status(200).json({ success: true, token: token, message: "Authorized access!!!",data:userData })
                
            })
        })

        .catch(function (e) {
            res.status(500).json({ error: e })
        })

})
router.post('/update/details',auth.verifyUser,(req,res)=>{  
    let fn = req.body['fname'].trim();
    let ln = req.body['lname'].trim();
    let address = req.body['Address'].trim();  
    let username=req.body['Username'].trim();
    let email=req.body['Email'].trim();

     let query1 = User.findOneAndUpdate({"_id":req.user._id},{
                $set:{
                    "fname":fn,
                    "lname":ln,
                    "Address":address, 
                    "Username":username,
                    "Email":email
                }
            });
            query1.then((result)=>{
                User.findOne({"_id":result._id})
                .then((data2)=>{
                    return res.status(200).json({"success":true,"message":"Account Details Updated Successfully!!","data":data2});   
                })
               
            }).catch((err)=>{
                return res.status(404).json({"success":false,"message":err});
            })
        }
)
router.put('/change/updateprofile',upload.single('profileImg'),auth.verifyUser,(req,res)=>{
    let imgPath = req.file['path'];
    User.findOneAndUpdate({"_id":req.user._id},{$set:{"profileImg":imgPath}}).then((result)=>{
        User.findOne({"_id":result._id})
        .then((data)=>{
            return res.status(200).json({"success":true,"message":"Profile Picture changed!!","data":data});
        })
        
    }).catch((err)=>{
        return res.status(202).json({"success":false,"message":err});
    })
});


//forgot password through link method
router.post('/askEmail',async(req,res)=>{
    try{
        let email = req.body['email'].trim();
        let user = await User.findOne({"email":email});
        if(user != null)
        {
            let token = jwt.sign({"email":email},'resetKey',{expiresIn:'1h'})
            let content = {
                "heading": "Password Reset Link!!",
                "resetPasswordLink":`http://localhost:3000/resetPassword/${token}`,
                "task": "Reset Password"
            }
            sendMailMessage("Modern Walk", email, content);
            return res.status(200).json({"success":true,"message":"Renew password email has been sent to you."})
        }
        else
        {
            return res.status(202).json({"success":false,"message":"Please provide registered email address."})
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(404).json({"success":false,"message":err});
    }
})


//reset the password.
router.post('/resetPassword',[
    check('resetPassword','Password should be in the range of 8-13.').isLength({"min":8,"max":13})
],async(req,res)=>{
    try
    {
        let errors = validationResult(req);
        if(errors.isEmpty())
        {
            let resetPassword = req.body['resetPassword'];
            let confirmPassword = req.body['confirmPassword'];
            let token = req.body['token'];
            if(resetPassword != confirmPassword)
            {
                return res.status(202).json({"success":false,"message":"Password Mismatch."})
            }
            else
            {
                let tokenVerification = jwt.verify(token,'resetKey');
                try
                {
                   bcryptjs.hash(resetPassword,10,(err,hash)=>{
                       User.updateOne({"Email":tokenVerification.email},{$set:{"Password":resetPassword}})
                       .then((result)=>{
                           return res.status(200).json({"success":true,"message":"Password reset done."})
                       })
                       .catch((err)=>{
                           return res.status(404).json({"success":false,"message":err})
                       })
                   })
                }
                catch(error)
                {
                    return res.status(202).json({"success":false,"message":"Token has been expired."})
                }
            }
        }
        else
        {
            return res.status(202).json({"success":false,"message":errors.array()[0].msg});
        }
    }
    catch(err)
    {
       
        return res.status(404).json({"success":false,"message":err})
    }
})


router.post('/googleLogin',async(req,res)=>{
    try{
      let tokenId = req.body['tokenId'];
      client.verifyIdToken({idToken:tokenId,audience:"152506000566-5ai7d5st3ufv6amebke7fel88hug8ihf.apps.googleusercontent.com"})
      .then(async(data)=>{
         const {email_verified,name,email,given_name,family_name} = data.payload;

         //checking the database
         if(email_verified == true)
         {
            let user = await User.findOne({'Email':email});
            let users = await User.find({});
            let userNameContainer = users.map((val)=>{return val.Username});
            let phoneNumberContaienr = users.map((val)=>{return val.Phoneno});
            if(user != null)
            {
               let token = jwt.sign({'userId':user._id,'userType':user.UserType},'secretkey',{'expiresIn':"20h"});
               let userData = await User.findOne({'_id':user._id},{'_id':0,'Password':0});
               return res.status(200).json({'success':true,'message':"Logged in",'data':userData,'token':token});
            }
            else
            {
               let password = genPinCode("alphanumeric",8);
               let userName = parentPinGeneration("numeric",4,userNameContainer,given_name,true);
               let phoneNumber = parentPinGeneration("numeric",8,phoneNumberContaienr,"98",true);

               bcryptjs.hash(password,10,(err,hash)=>{
                const userObj = new User({
                    "fname":given_name,
                    "lname":family_name,
                    "Dob":"1999-01-01",
                    "Gender":"Male",
                    "Address":"HeadQuarter",
                    "Phoneno":phoneNumber,
                    "Nationality":"Nepal",
                    "Username":userName,
                    "Email":email,
                    "Password":hash,
                    'createdAt':getFormattedToday(new Date())
                })
    
                userObj.save()
                .then(async (data)=>{
                 let token = jwt.sign({'userId':data._id,'userType':data.UserType},'loginKey',{'expiresIn':"20h"});
                 let userData = await User.findOne({'_id':data._id},{'_id':0,'Password':0});
                 return res.status(200).json({'success':true,'message':"Logged in",'data':userData,'token':token});
                })
                .catch((err)=>{
                    return res.status(404).json({'success':false,'message':err});
                })
               })
   
               
            }
         }
         
         
      })
    }
    catch(err)
    {
        return res.status(404).json({'success':false,'message':err});
    }
})

module.exports = router;