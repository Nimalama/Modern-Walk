let days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
let months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"];
const getProductCode = (data)=>{
    let overallCode = data.map((val)=>{return val['productCode']});
    let alpha = "abcdefghijklmnopqrstuvwxyz";
    let overall = alpha+alpha.toUpperCase()+"0123456789";
    let code = "";
    while(code.length < 6)
    {
        let index = parseInt(Math.random()*overall.length);
        code+=overall[index];
        if(code.length == 6)
        {
            if(overallCode.includes(code))
            {
                code="";
            }
        }
    }
    return code;
}

const parseDate = (time)=>{
    if(time < 10)
    {
        time = "0"+time;
    }
    return time;
}
 
const todayDate = (date)=>{
    return `${date.getFullYear()}-${parseDate(date.getMonth()+1)}-${parseDate(date.getDate())}`
}
 
const bookingData = (data)=>{
    let bookCode = data.map((val)=>{return val['bookingCode']});
    let code = "";
    let letters = "abcdefghijklmnopqrstuvwxyz";
    let overall = letters+letters.toUpperCase()+"0123456789";
    while(code.length < 6)
    {
        let index = parseInt(Math.random()*overall.length);
        code+=overall[index];
        if(code.length == 6)
        {
            if(bookCode.includes(code))
            {
                code = ""
            }
            else
            {
                break;
            }
        }
 
        
    }
    return code;
}
const getGiveAwayCode = (data)=>{
    let codes = data.map((val)=>{return (val.giveAwayCode)});
    let giveAwayCode = "";
    let upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let overall = upperCase+upperCase.toLowerCase()+"0123456789";
    while(giveAwayCode.length != 6)
    {
        var randomIndex = parseInt(Math.random()*overall.length);
        giveAwayCode+=overall[randomIndex];
        if(giveAwayCode.length == 6)
        {
            if(codes.includes(giveAwayCode))
            {
                giveAwayCode = "";
            }
            else
            {
                break
            }
        }
    }
    return giveAwayCode;
}
    const getFormattedToday = (today)=>{
        let formatted = `${today.getFullYear()}-${monthAndDateFormatter(today.getMonth()+1)}-${monthAndDateFormatter(today.getDate())}`;
        return formatted;
    }
    const getTimeValue = ()=>
{
    let currentTime = new Date();
    let hour = currentTime.getHours();
    let greet;
    if(hour < 12)
    {
        greet = "Good Morning";
    }
    else if(hour <= 16 && hour >= 12)
    {
        greet = "Good Afternoon";
    }
    else
    {
        greet = "Good Evening";
    }
    return greet;
}


const getFancyDate =(date)=>{
    var today = new Date(date);
    var formattedDate = `${today.getDate()}${months[today.getMonth()]},${today.getFullYear()}-${days[today.getDay()]}`;
    return formattedDate;
}

const monthAndDateFormatter = (data)=>{
    let detail = data;
    if(detail<10)
    {
        detail = `0${detail}`;
    }
    return detail;
}

const filterDate = (latestDate)=>{
    let difference = parseInt((new Date().getTime() - new Date(latestDate).getTime())/(1000*60*60*24));
    let dateContainer = [];
    let latest = new Date(latestDate);
    latest.setDate(latest.getDate());

    while(dateContainer.length != difference)
    {
        let formatted = getFormattedToday(latest);
        dateContainer.push(formatted);
        latest.setDate(latest.getDate()+1);
    }

    return dateContainer;
}



module.exports = {getProductCode,bookingData,todayDate,getFancyDate,getFormattedToday,getTimeValue,getGiveAwayCode,monthAndDateFormatter,filterDate,days};
