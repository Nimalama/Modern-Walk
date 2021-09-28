const mongoose = require('mongoose');

const Quiz = mongoose.model('Quiz',{
    "paragraph":{"type":String,"required":true},
    "questions":{"type":[String],"required":true},
    "answers":{"type":[[String]],"required":true},
    "realAnswer":{"type":[[String]],"required":true},
    "startAt":{"type":String,"required":true},
    "timeLimit":{"type":Number,"required":true},
    "startTime":{"type":[Number],"required":true},
    "endTime":{"type":[Number],"required":true},
    "startTime1":{"type":String,"required":true},
    "endTime1":{"type":String,"required":true},
    "status":{"type":String,"required":true,"enum":['Pending','Running','Expired'],'default':"Pending"},
    'chance':{"type":Number,"required":true}
})


module.exports = Quiz;