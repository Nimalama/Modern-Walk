const TimeHalt = require('../models/timehalt');
const { getFormattedToday,getTimeValue,getFancyDate } = require('./utils');
const Participants = require('../models/giveawayparticipants');
const Giveaway = require('../models/giveawayModel');
const Registrations = require('../models/registration');
const ClothingBooking = require('../models/bookingModel');
const GiveawayWinner= require('../models/giveawaywinnerModel')



const announcement = (req, res, winners, futsalName, gId) => {
    let winnerAnnounce = "";

    for (var j in winners) {
        winnerAnnounce += `[${j}:(${winners[j].join(",")})] `;
    }


    Registrations.find({})
        .then((data2) => {
            if (data2.length > 0) {
                for (var l of data2) {
                    let content = {
                        "heading": "Giveaway Result",
                        "greeting": getTimeValue() + " " + l.fname + " " + l.lname + ",",
                        "message": `Winners of giveaway are:`,
                        "message3": winnerAnnounce,
                        "message2": "Don't loose your hope if your name is not in the list. There are more giveaways coming in future.",
                        "task": "Giveaway2"
                    }

                    sendMailMessage("Modern Walk", l.Email, content);
                }

            }
        })
        .catch((err) => {
            return res.status(404).json({ "success": false, "message": err })
        })


    let giveawayWinners = Object.values(winners);
    let combined = [];

    for (var i = 0; i < giveawayWinners.length; i++) {
        for (var j = 0; j < giveawayWinners[i].length; j++) {
            combined.push(giveawayWinners[i][j]);
        }
    }

    combined = Array.from(new Set(combined));

    let restrictionUsername = [];
    var reward = {};
    for (i of combined) {
        if (!restrictionUsername.includes(i)) {
            var myReward = "";
            for (var k in winners) {
                if (winners[k].includes(i)) {
                    myReward += k + ","
                }
            }
            reward[i] = myReward.slice(0, myReward.length - 1);
            restrictionUsername.push(i);
        }

    }

    for (var i in reward) {

        Registrations.findOne({ "userName": i })
            .then((data) => {
                if (data != null) {

                    let content = {
                        "heading": "Giveaway Result",
                        "greeting": getTimeValue() + " " + data.fname + " " + data.lname + ",",
                        
                        "message": reward[data.Username],

                        "task": "Giveaway3"
                    }

                    sendMailMessage("Futsal Arena", data.Email, content);
                }
            })
            .catch((err) => {
                return res.status(404).json({ "success": false, "message": err });
            })
    }

    const gvWinner = new GiveawayWinner({ "giveaway_id": gId, "winners": combined.join(","), "resultGeneratedAt": getFancyDate(new Date()), "resultTime": new Date().toLocaleTimeString() });
    gvWinner.save()
        .then((result) => { })
        .catch((err) => {
            return res.status(404).json({ "success": false, "message": err });
        })
}


const giveawayResult = (req, res) => {
    TimeHalt.findOne({"_id":"60e969ee7bebe030dd8b92d5", "updated_at": {$ne: getFormattedToday(new Date()) } })
        .then((halt) => {
            if (halt != null) {
                TimeHalt.updateOne({"_id":"60e969ee7bebe030dd8b92d5"}, { $set: {"updated_at": getFormattedToday(new Date()) } })
                    .then((result) => {
                        console.log("Giveaway Checked")
                    })
                    Giveaway.updateMany({"endAt":{$lte:getFormattedToday(new Date())},$or:[{"status":"Starting Soon"},{"status":"Ongoing"}]},{$set:{"status":"Finished"}}).then((result2)=>{}).catch((err)=>{console.log("Error shown: "+err)});
                let query = Giveaway.distinct("giveAwayCode", { "resultAt": { $lte: getFormattedToday(new Date()) }, "status": { $ne: "Result Out" } });
                query.then((data) => {

                    if (data.length > 0) {
                        for (var i of data) {
                            let query2 = Giveaway.find({ "giveAwayCode": i })


                            query2.then((data2) => {
                                if (data2.length > 0) {
                                    //to fetch participants
                                    let giveAwayId = data2[0]._id;
                                    let giveAwayItems = {};

                                    //giveaway items
                                    for (j of data2) {
                                        giveAwayItems[j.item] = j.quantity
                                    }

                                    //participants
                                    let query3 = Participants.find({ "giveaway_id": giveAwayId })
                                        .populate({
                                            "path": "user_id",
                                            "select": ['Username']
                                        });

                                    query3.then((data3) => {
                                        let extra = {};
                                        let forGiveaway = {};
                                        let participants = data3.length;

                                        for (var k in giveAwayItems) {
                                            if (giveAwayItems[k] > participants) {
                                                let extraItems = giveAwayItems[k] - participants;
                                                extra[k] = extraItems;
                                                forGiveaway[k] = participants;
                                            }
                                            else {
                                                forGiveaway[k] = giveAwayItems[k];
                                            }
                                        }

                                        //categorize participants into regular and supporter
                                        var categorization = {
                                            "supporter": [],
                                            "regular": []
                                        }


                                        for (l of data3) {
                                            Registrations.findOne({ "_id": l.user_id._id })
                                                .then((reg_user) => {

                                                    if (reg_user != null) {
                                                        let query4 = ClothingBooking.find({ "user_id": l.user_id._id }).countDocuments({});
                                                        query4.then((count) => {

                                                            if (count >= 15) {
                                                                categorization["regular"].push(reg_user.Userame)
                                                            }
                                                            else {
                                                                categorization["supporter"].push(reg_user.Username)
                                                            }

                                                        })
                                                            .catch((err) => {
                                                                return res.status(404).json({ "success": false, "message": err });
                                                            })
                                                    }

                                                })
                                                .catch((err) => {
                                                    return res.status(404).json({ "success": false, "message": err });
                                                })


                                        }

                                        //get Winner according to categorization

                                        setTimeout(() => {

                                            let winners = {};
                                            for (var o in forGiveaway) {
                                                let regular = categorization["regular"].map((val) => { return val });
                                                let supporter = categorization["supporter"].map((val) => { return val });
                                                
                                                winners[o] = [];
                                                for (var n = 1; n <= forGiveaway[o]; n++) {
                                                    let winPoints = parseInt(Math.random() * 101);

                                                    if (winPoints > 20) {
                                                        //go for regular
                                                        if (regular.length > 0) {
                                                            let regIndex = parseInt(Math.random() * regular.length);
                                                            winners[o].push(regular[regIndex]);
                                                            regular.splice(regIndex, 1);
                                                            // console.log(regular)
                                                        }
                                                        else {
                                                            let supporterIndex = parseInt(Math.random() * supporter.length);
                                                            winners[o].push(supporter[supporterIndex]);
                                                            supporter.splice(supporterIndex, 1);
                                                            // console.log(supporter)
                                                        }
                                                    }
                                                    else {
                                                        //go for supporter

                                                        if (supporter.length > 0) {
                                                            let supporterIndex = parseInt(Math.random() * supporter.length);
                                                            winners[o].push(supporter[supporterIndex]);
                                                            supporter.splice(supporterIndex, 1);
                                                        }
                                                        else {
                                                            let regIndex = parseInt(Math.random() * regular.length);
                                                            winners[o].push(regular[regIndex]);
                                                            regular.splice(regIndex, 1);
                                                        }


                                                    }
                                                }

                                            }


                                            announcement(req, res, winners,"", data2[0]._id)


                                            Giveaway.updateMany({ "giveAwayCode": i }, { $set: { "status": "Result Out" } })
                                                .then((result2) => { }).catch((err) => { return res.status(404).json({ "success": false, "message": err }) })

                                        }, 2000)





                                    })

                                }
                                else {
                                    return res.status(202).json({ "success": false, "message": "No giveaway." });
                                }
                            })
                                .catch((err) => {
                                    return res.status(404).json({ "success": false, "message": err });
                                })
                        }
                    }
                    else {

                        console.log("Not a result time")
                    }

                })
                    .catch((err) => {
                        console.log(err);
                        return res.status(404).json({ "success": false, "message": err });
                    })
            }
            else {
                console.log("Giveaway result already mapped!!");
                // return res.status(202).json({"success":false,"message":"Giveaway result already mapped!!"})
            }
        })

}
module.exports = { giveawayResult };