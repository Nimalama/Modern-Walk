const {giveawayResult}=require('./giveawayUtils');

var serverStarted=false;
var serverInterval;
//server activities toggle
const serverActivity = (req, res) => {
    if (serverStarted == true) {
        stopServer(req, res);
    }
    else {
        startServer(req, res);
    }
}

//start server

const startServer = (req, res) => {
    if (serverStarted == false) {
        serverStarted = true;
        console.log("Server Started");
        var time2 = new Date();
        time2.setHours(23, 0, 0);
        var currentTime = new Date();
        currentTime.setHours(5, 0, 0);
        var currentHour = currentTime.getHours();
        

        if (time2 > new Date()) {

            serverInterval = setInterval(() => {
                if (serverStarted == true) {
                    var currentInstance = new Date();
                    var instanceHour = currentInstance.getHours();

                    if (currentHour != instanceHour) {
                        var forCheck = new Date();
                        forCheck.setHours(instanceHour, 0, 0);
                        if (forCheck < new Date()) {

                            currentHour = instanceHour;
                        }

                    }
                    
                    
                    giveawayResult(req, res);
                    
                    console.log("Server running")
                }

                else {
                    return;
                }
            }, 60000)
        }
    }
}

//stop server
const stopServer = (req, res) => {

    serverStarted = false;
    clearInterval(serverInterval);
    return res.status(200).json({ "success": true, "message": "Server Closed" });


}

module.exports =serverActivity;