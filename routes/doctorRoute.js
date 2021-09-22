//third-party modules
const express = require('express');
const router = express.Router();
const {check,validationResult} = require('express-validator');
const validator = require('validator');
const bcryptjs = require('bcryptjs')

//models
const Doctor = require('../models/doctorModel');
const User = require('../models/registration');

//local modules
const {getCustomizedError,replaceAll,genPinCode,parentPinGeneration,getFormattedToday,days} = require('../utils/utils')
const upload = require('../middleware/upload');
const {sendMailMessage} = require('../utils/mail')
const auth = require('../middleware/auth');

//API: To register a doctor.
router.post('/registerADoctor',upload.single('doctorImg'),auth.verifyUser,auth.verifyAdmin,[
    check('firstName','Firstname cannot be left empty.').not().isEmpty(),
    check('lastName','Lastname cannot be left empty.').not().isEmpty(),
    check('email','Email cannot be left empty.').not().isEmpty(),
    check('phoneNumber','Phone number cannot be left empty.').not().isEmpty(),
    check('onlineTime','Please provide an online time.').not().isEmpty(),
    check('offlineTime','Please provide an offline time.').not().isEmpty(),
    check('gender','Please select your gender.').not().isEmpty(),
    check('breaks','Holidays not mentioned.').not().isEmpty(),
    check('speciality',"Please mention doctor's speciality").not().isEmpty(),
    check('location','Location cannot be left empty.').not().isEmpty(),
    check('email','Inappropriate email address.').isEmail(),
    check('phoneNumber','Invalid phone number format.').isNumeric(),
    check('phoneNumber','Inappropriate phone number length.').isLength({'min':10,'max':10}),
    
],async(req,res)=>{
    try
    {
       let errors = validationResult(req);
       if(errors.isEmpty())
       {
           let firstName = req.body['firstName'].trim();
           let lastName = req.body['lastName'].trim();
           let email = req.body['email'].trim();
           let phoneNumber = req.body['phoneNumber'].trim();
           let onlineTime = req.body['onlineTime'];
           let offlineTime = req.body['offlineTime'];
           let gender = req.body['gender'];
           let location = req.body['location'].trim();
           let breaks = req.body['breaks'];
           let speciality = req.body['speciality'];

           firstName = firstName.slice(0,1).toUpperCase() + firstName.slice(1,firstName.length).toLowerCase();
           lastName = lastName.slice(0,1).toUpperCase() + lastName.slice(1,lastName.length).toLowerCase();
           location = location.slice(0,1).toUpperCase() + location.slice(1,location.length).toLowerCase();
           
           let breakTimes = breaks.split(",").map((val)=>{return val.trim()});
           let specialityBox = speciality.split(",").map((val)=>{return val.trim()});

           let onlineTimeSplit = onlineTime.split(":");
           let offlineTimeSplit = offlineTime.split(":");

           let onlineHour = parseInt(onlineTimeSplit[0]);
           let onlineMinute = parseInt(onlineTimeSplit[1]) % 5 != 0? (parseInt(onlineTimeSplit[1]) - (parseInt(onlineTimeSplit[1]) % 5)) + 5 :  parseInt(onlineTimeSplit[1]);

           let offlineHour = parseInt(offlineTimeSplit[0]);
           let offlineMinute =  parseInt(offlineTimeSplit[1]) % 5 != 0? (parseInt(offlineTimeSplit[1]) - (parseInt(offlineTimeSplit[1]) % 5)) + 5 :  parseInt(offlineTimeSplit[1]);
           
           let onlinePoint = new Date();
           onlinePoint.setHours(onlineHour,onlineMinute,0);
          
           let offlinePoint = new Date();
           offlinePoint.setHours(offlineHour,offlineMinute,0);

           let users = await User.find({});
           let doctors = await Doctor.find({});
           
           let userNameContainer = users.map((val)=>{return val.Username}); 
           let emailContainer = users.map((val)=>{return val.Email});
           let doctorEmail = doctors.map((val)=>{return val.email});
           emailContainer.push(...doctorEmail.filter((val)=>{return !emailContainer.includes(val)}));
           let phoneNumbers = doctors.map((val)=>{return val.phoneNumber});


           let errorBox = {};
           
           if(!validator.isAlpha(replaceAll(firstName," ","")))
           {
               errorBox['firstName'] = "Firstname should not contain any numeric characters."
           }
           if(!validator.isAlpha(replaceAll(lastName," ","")))
           {
               errorBox['lastName'] = "Lastname should not contain any numeric characters."
           }
           if(!phoneNumber.startsWith("98"))
           {
               errorBox['phoneNumber'] = "Phone number need to have nepali codec."
           }

           if(onlinePoint.getHours() <= 5 || onlinePoint.getHours() > 21)
           {
               errorBox['onlineTime'] = "Doctors can get online within the range of 6:00 AM - 9:59 PM";
           }
           if(offlinePoint.getHours() <= 6 || offlinePoint.getHours() > 21)
           {
               errorBox['onlineTime'] = "Doctors can get offline within the range of 7:00 AM - 9:59 PM";
           }

           if(emailContainer.includes(email))
           {
               errorBox['email'] = "Email address already exists."
           }
           if(phoneNumbers.includes(phoneNumber))
           {
               errorBox['phoneNumber'] = "Phone number already exists.";
           }
           
           if(Object.keys(errorBox).length > 0)
           {
             return res.status(202).json({'success':false,'message':'Error',"error":errorBox});
           }
           else
           {
              let start = getFormattedToday(new Date())
              let startReplace = replaceAll(start,"-","");
              let userName = parentPinGeneration('numeric',4,userNameContainer,`${startReplace.slice(0,startReplace.length-2)}`,true);
              let password = genPinCode('alphanumeric',6);

               bcryptjs.hash(password,10,(err,hash)=>{
                const doctorObj = new Doctor({
                    "firstName":firstName,
                    "lastName":lastName,
                    "userName":userName,
                    "email":email, 
                    "phoneNumber":phoneNumber,
                    "onlineTime":[onlineHour,onlineMinute],
                    "offlineTime":[offlineHour,offlineMinute],
                    "breaks":breakTimes,
                    "speciality":specialityBox,
                    "gender":gender,
                    "location":location,
                    "password":hash,
                    "createdAt":getFormattedToday(new Date()),
                    'onlineTime1':onlineTime,
                    'offlineTime1':offlineTime
                })
                
              doctorObj.save()
              .then((data)=>{
                 const userObj = new User({
                     "fname":firstName,
                     "lname":lastName,
                     "Dob":"1999-01-01",
                     "gender":gender,
                     "Address":location,
                     "Phoneno":phoneNumber,
                     "Username":userName,
                     "Email":email, 
                     "Password":hash,
                     "UserType":"Doctor"
                 })

                 userObj.save()
                 .then((data2)=>{
                     let content = {
                         "greeting":"Hello!!",
                         "heading":"Doctor Registered Successfully!!",
                         "message":`${firstName} ${lastName} is doctor for the server.`,
                         "userName":userName,
                         "password":password,
                         "message2":"Use these credentials to login and change password.",
                         "task":"DoctorRegistration"
                     }

                     sendMailMessage("Doctor Registration",email,content);
                     return res.status(200).json({"success":true,'message':"Doctor Registered!!!"});
                 })
                 .catch((err)=>{
                     console.log(err);
                    return res.status(404).json({'success':false,'message':err});
                 })
              })
              .catch((err)=>{
                console.log(err);
                  return res.status(404).json({'success':false,'message':err});
              })


               }) 

              


           }
            
       }
       else
       {
          
           let customizedError = getCustomizedError(errors.array());
           return res.status(202).json({'success':false,'message':"Errors found!!","error":customizedError});
       }
    }
    catch(err)
    {
        console.log(err);
        return res.status(404).json({'success':false,'message':err});
    }
})


//API:Fetch doctors who are not in a break.
router.get('/fetchDoctors',async(req,res)=>{
    try
    {
       //requires online and offline indicating function in the running server for brilliant use of the API.
       let doctors = await Doctor.find({'breaks':{$ne:days[new Date().getDay()]}},{'password':0});
       if(doctors.length > 0)
       {
         return res.status(200).json({'success':true,'messasge':`${doctors.length} records found!!`,'data':doctors});  
       }
       else
       {
           return res.status(202).json({'success':false,'message':"0 Records found!!"});
       }
    }
    catch(err)
    {
        return res.status(404).json({"success":false,'message':err});
    }
})

module.exports = router;