const mongoose = require('mongoose');
const {ObjectId} = require('bson');


const Doctor = mongoose.model('Doctor',{
    "firstName":{'type':String,'required':true},
    "lastName":{'type':String,'required':true},
    "userName":{'type':String,'required':true,'unique':true},
    "email":{'type':String,'required':true,'unique':true},
    'phoneNumber':{'type':String,'required':true,'unique':true},
    "onlineTime":{'type':[Number],'required':true},
    "offlineTime":{'type':[Number],'required':true},
    "onlineTime1":{'type':String,'required':true},
    "offlineTime1":{'type':String,'required':true},
    "breaks":{'type':[String],'required':true},
    // "workingHospitals":[{'type':ObjectId,'required':true,'ref':Hospital}]
    "rating":{'type':Number,'required':true,'default':0},
    "gender":{'type':String,'required':true,'enum':["Male","Female","Others"]},
    "speciality":{'type':[String],'required':true,'default':[]},
    "location":{'type':String,'required':true},
    "password":{'type':String,'required':true}, 
    // "locationPoint":{
    //     "type":{
    //          "type":String,
    //          "required":true,
    //         "default":"Point" 
    //     },
    //     "coordinates":{
    //         "type":[Number],
    //         "required":true,
    //         "default":[],
    //         'index':'2dSphere'
    //     } 
    // },
    "onlineStatus":{'type':Boolean,'required':true,'default':false},
    "doctorImage":{'type':String,'required':true,'default':"no-img.jpg"},
    'createdAt':{'type':String,'required':true}
})

module.exports = Doctor;

