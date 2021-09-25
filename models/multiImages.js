const mongoose = require('mongoose');


const MultiImages = mongoose.model('MultiImages',{
   'addedAt':{'type':String,'required':true},
   'addedBy':{'type':String,'required':true},
   "image1":{'type':[String],'required':true},
   'image2':{'type':[String],'required':true},
   'image3':{'type':[String],'required':true}
})


module.exports = MultiImages;