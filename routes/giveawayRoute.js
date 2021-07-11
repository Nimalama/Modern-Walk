const express = require('express');
const router = express.Router();

const Giveaway = require('../models/giveawayModel');
const User = require('../models/registration');
const Participants = require('../models/giveawayparticipants');
const GiveawayWinner = require('../models/giveawaywinnerModel')
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { check, validationResult } = require('express-validator');
const { getGiveAwayCode, getFormattedToday, getTimeValue, getFancyDate } = require('../utils/utils');
const async = require('async');
const {sendMailMessage} = require('../utils/mail');
const serverActivity = require('../utils/modernwalk');

router.post('/addGiveAway', upload.array("giveawayItems"), auth.verifyUser, auth.verifyAdmin,
    [
        check("item", "Please insert Items").not().isEmpty(),
        check("quantity", "Please insert quantity").not().isEmpty(),
        check("startingFrom", "Please insert starting date").not().isEmpty(),
        check("endAt", "Please insert end date").not().isEmpty(),
        check("sponsor", "Please provide sponsor").not().isEmpty()


    ]
    , (req, res) => {
        let errors = validationResult(req);
        let item = req.body['item'].trim();
        let quantity = req.body['quantity'];
        let startingFrom = req.body['startingFrom'];
        let endAt = req.body['endAt'];
        let sponsor = req.body['sponsor'];
        let photoes = req.files;
        let resultDate = new Date(endAt);
        resultDate.setDate(resultDate.getDate() + 2);
        if (req.files == undefined) {
            return res.status(202).json({ "success": false, "message": "Inappropriate file format!!" });
        }
        else {
            if (errors.isEmpty()) {

                let query = Giveaway.find({});
                query.then((data) => {
                    let giveawayCode = getGiveAwayCode(data);
                    let items = item.split(",");
                    let qty = quantity.split(",");
                    let count = 0;

                    for (var i = 0; i < items.length; i++) {
                        let giveObj = new Giveaway({
                            "sponsor": sponsor,
                            "item": items[i],
                            "quantity": parseInt(qty[i]),
                            "giveAwayCode": giveawayCode,
                            "startingFrom": getFormattedToday(new Date(startingFrom)),
                            "endAt": getFormattedToday(new Date(endAt)),
                            "status": "Starting Soon",
                            "resultAt": getFormattedToday(new Date(resultDate)),
                            "image": photoes[i].path,
                            "mergedItem": item,
                            "mergedQuantity": quantity
                        })
                        count += 1;

                        giveObj.save()
                            .then((result) => {

                            })
                            .catch((err) => {
                                return res.status(404).json({ "success": false, "message": err });
                            })
                    }

                    if (count == items.length) {
                        return res.status(200).json({ "success": true, "message": "GiveAway Added!!" })
                    }

                })
                    .catch((err) => {
                        return res.status(404).json({ "success": false, "message": err });
                    })
            }


            else {
                return res.status(404).json({ "success": false, "message": errors.array()[0].msg });
            }
        }
    })

router.get("/giveAwayDistinct", (req, res) => {
    let query = Giveaway.distinct("giveAwayCode", { "resultAt": { $gte: getFormattedToday(new Date()) } })
    query.then((data) => {
        return res.status(200).json({ "success": true, "message": `${data.length} records found!!`, "data": data })
    })
        .catch((err) => {
            return res.status(404).json({ "success": false, "message": err });
        })
})


router.get('/giveawayInstances', (req, res) => {
    let query = Giveaway.find({
        "resultAt": { $gte: getFormattedToday(new Date()) }
    })

        .sort({ "startingFrom": 1 })

    query.then((data) => {
        if (data.length > 0) {
            return res.status(200).json({ "success": true, "message": `${data.length} records found!!`, "data": data })
        }
        else {
            return res.status(202).json({ "success": false, "message": "No Giveaway in progress!!" })
        }
    })
        .catch((err) => {
            return res.status(404).json({ "success": false, "message": err });
        })
})


router.post("/map/giveAway", auth.verifyUser, auth.verifyAdmin, (req, res) => {
    let query = Giveaway.find({ "startingFrom": getFormattedToday(new Date()), "status": "Starting Soon", "notificationSent": false });
    query.then((data) => {
        if (data.length > 0) {
            let codeContainer = [];
            for (i of data) {

                if (!codeContainer.includes(i.giveAwayCode)) {
                    let query2 = Giveaway.updateMany(
                        {
                            "giveAwayCode": i.giveAwayCode
                        },
                        {
                            $set:
                            {
                                "notificationSent": true,
                                "status": "Ongoing"
                            }
                        }
                    );

                    query2.then((result) => {
                        let query3 = User.find({})
                        query3.then((data3) => {
                            let query4 = Giveaway.find({ "giveAwayCode": i.giveAwayCode });
                            query4.then((data4) => {

                                var stringItems = "";
                                if (data4.length > 0) {
                                    var totalItems = {};

                                    for (var r of data4) {
                                        totalItems[r.item] = r.quantity
                                    }

                                    for (var k of Object.keys(totalItems)) {
                                        stringItems += `${k}​​​​​​​​: ${totalItems[k]}​​​​​​​​ qty\n`
                                    }

                                }



                                if (data3.length > 0) {
                                    async.forEach(data3, (k) => {
                                        let content = {
                                            "heading": "Giveaway alert!!",
                                            "greeting": getTimeValue() + " " + k.fname + " " + k.lname + ",",
                                            "message": `Giveaway of ${stringItems}​​​​​​​​​ has started from today(${getFancyDate(new Date())}​​​​​​​​​).`,
                                            "message2": "Participate before the date ends.",
                                            "task": "Giveaway"
                                        }
                                        sendMailMessage("Modern Walk", k.Email, content);
                                    })
                                }


                            })

                        })

                    })
                        .catch((err) => {
                            return res.status(404).json({ "success": false, "message": err });
                        })
                    codeContainer.push(i.giveAwayCode);
                }
            }

            return res.status(200).json({ "success": true, "message": "Giveaway mapped!!" })
        }
        else {
            return res.status(202).json({ "success": false, "message": "No records" })
        }
    })
        .catch((err) => {
            console.log(err)
            return res.status(404).json({ "success": false, "message": err });
        })
})




router.post('/participateGiveaway/:giveCode', auth.verifyUser, (req, res) => {
    let giveawayCode = req.params.giveCode;
    
    let query = Giveaway.find({ "giveAwayCode": giveawayCode })
    query.then((data) => {
        if (data.length > 0) {
            let query2 = Participants.findOne({ "user_id": req.user._id, "participatedCode": data[0].giveAwayCode });
            query2.then((data2) => {
                if (data2 != null) {
                    return res.status(200).json({ "success": true, "message": "Participated in giveaway!!" });
                }
                else {
                    console.log(data)
                    let participate = new Participants({
                        "user_id": req.user._id,
                        "giveaway_id": data[0]._id,
                        "participated_at": getFancyDate(new Date()),
                        "participation_time": new Date().toLocaleTimeString(),
                        "participatedCode": data[0].giveAwayCode
                    });
                    participate.save()
                        .then((result) => {
                            return res.status(200).json({ "success": true, "message": "Participated in giveaway!!" });
                        })
                        .catch((err) => {
                            console.log(err)
                            return res.status(404).json({ "success": false, "message": err });
                        })
                }
            })
        }
    })
        .catch((err) => {
            console.log(err)
            return res.status(404).json({ "success": false, "message": err });
        })
})


router.get("/getOngoingCount", (req, res) => {
    Giveaway.distinct("giveAwayCode", { "status": "Ongoing" })
        .then((data) => {
            return res.status(200).json({ "success": true, "message": "Data fetched", "data": data.length })
        })
        .catch((err) => {
            return res.status(404).json({ "success": false, "message": err })
        })
})


router.get("/getWinners", (req, res) => {
    GiveawayWinner.find({})
        .sort({ "resultGeneratedAt": -1 })
        .populate({
            "path": "giveaway_id",
            
        })
        .then((data) => {

            return res.status(200).json({ "success": true, "message": "Found", "data": data })
        })
        .catch((err) => {
            return res.status(404).json({ "success": false, "message": err })
        })
})

router.get("/myParticipantRecord", auth.verifyUser, (req, res) => {
    Participants.find({ "user_id": req.user._id })
        .then((data) => {
            if (data.length > 0) {
                let myParticipantId = data.map((val) => { return val.participatedCode })
                return res.status(200).json({ "success": true, "message": `${data.length} records found`, "data": myParticipantId })
            }
            else {
                return res.status(202).json({ "success": false, "message": "Have not participated in any giveaway!!" })
            }
        })
        .catch((err) => {
            return res.status(404).json({ "success": false, "message": err });
        })
})
router.get("/serverToggle",auth.verifyUser,(req,res)=>{
    serverActivity(req, res)
})

module.exports = router;