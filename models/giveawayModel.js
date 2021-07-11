const mongoose = require('mongoose');

 
const Giveaway = mongoose.model("Giveaway",{
    "sponsor":{"type":String,"require":true},
    "item":{"type":String,"require":true},
     "quantity":{"type":Number,"require":true},
     "giveAwayCode":{"type":String,"require":true},
     "startingFrom":{"type":String,"require":true},
     "endAt":{"type":String,"require":true},
     "status":{"type":String,"require":true,enum:["Starting Soon","Ongoing","Finished","Result Out"]},
     "resultAt":{"type":String,"require":true},
     "notificationSent":{"type":Boolean,"default":false},
     "image":{"type":String,"require":false},
     "mergedItem":{"type":String,"require":true},
     "mergedQuantity":{"type":String,"require":true}
})


 
module.exports = Giveaway;