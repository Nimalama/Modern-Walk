const mongoose = require('mongoose');


const TimeHalt = mongoose.model('TimeHalt',{
    "updated_at":{"type":String,'required':true},
    "work":{"type":String,'required':true}
})
module.exports=TimeHalt;