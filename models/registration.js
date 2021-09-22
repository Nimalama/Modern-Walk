const mongoose = require('mongoose');

const User = mongoose.model('Users', {
    profileImg:{
        type:String,
        default:"no-img.jpg",
        "required":true
    },
    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
        required: true
    },
    Dob: {
        type: String
    },
    Gender: {
        type: String
    },
    Address: {
        type: String,
        required: true
    },
    Phoneno: {
        type: Number,
        required: true

    },

    Nationality: {
        type: String
    },
    Username: {
        type: String,
        required: true,
        unique: true

    },
    Email: {
        type: String,
        required: true,
        unique: true
    },
    Password: {
        type: String,
        required: true
    },
    UserType: {
        type: String,
        enum: ['Admin', 'Buyer', 'Seller','Doctor']
    },
    dots:{
        "type": Number,
        "required":true,
        "default":0
    },
    satisfactionPoint:{
        "type":Number,
        "required":true,
        "default":0
    }
})
module.exports = User