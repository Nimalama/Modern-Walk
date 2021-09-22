let days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
let months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"];
let timeBox = {
    "13":1,
    "14":2,
    "15":3,
    "16":4,
    "17":5,
    "18":6,
    "19":7,
    "20":8,
    "21":9,
    "22":10,
    "23":11,
    "0":12
};

let numericCharacters = "0123456789";
let lowerCaseCharacters = "abcdefghijklmnopqrstuvwxyz";
let alphaCharacters = lowerCaseCharacters.trim()+lowerCaseCharacters.toUpperCase().trim();
let overallCharacters = alphaCharacters+numericCharacters.trim();

let characterBox = {
    "numeric":numericCharacters,
    "alpha":alphaCharacters,
    "alphanumeric":overallCharacters
}

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


const getCustomizedError = (data)=>{
    let errorBox = {};
    for(var i of data)
    {
        if(!Object.keys(errorBox).includes(i.param))
        {
          errorBox[i.param] = i.msg
        }
    }

    return errorBox;
}


const checkTime = (time)=>{
    let timeSet = time.getHours() >= 12? "PM":"AM";
    if(timeSet == "PM" && time.getHours() >= 19)
    {
        return "Time cannot lie within the range of 5 minutes to or more than 7 PM."
    }

    else if(timeSet == "AM" && time.getHours() <= 5)
    {
        return "Time cannot be less than or equal to 5 AM."
    }

    else{
        return true
    }
}

const filterDateWithMarker = (start,end,markers)=>{
    let startP = new Date(getFormattedToday(start));
    let endP = new Date(getFormattedToday(end));
    let difference = parseInt((endP.getTime() - startP.getTime()) / (1000*60*60*24)) + 1;
    let dateContainer = [];
    while(dateContainer.length != difference)
    {
        let formattedDate = getFormattedToday(startP);
        dateContainer.push(formattedDate);
        startP.setDate(start.getDate()+1);
    }

    let daysBox = dateContainer.map((val)=>{return days[new Date(val).getDay()]}); 

    for(var i of markers)
    {
        let dayFilter = daysBox.filter((val)=>{return val == i});
        let markerCount = dayFilter.length;
        let count = 0;
        while(count < markerCount)
        {
            let index = daysBox.indexOf(i);
            dateContainer.splice(index,1);
            daysBox.splice(index,1);
            count+=1
        }
    }

    return dateContainer;

}


const getFormattedTime = (time)=>{
    let timeValue = time.getHours() >=12 ? "PM":"AM";
    let time2 = `${time.getHours()}:${monthAndDateFormatter(time.getMinutes())} ${timeValue}`;
    if(time.getHours() > 12 || time.getHours() == 0)
    {
        time2 = `${timeBox[time.getHours().toString()]}:${monthAndDateFormatter(time.getMinutes())} ${timeValue}`;
    }
    return time2;
}

const replaceAll = (sentence,to,by)=>{
    let word = sentence;
    let data = word.split(to);
    let count = 0;
    while(count != data.length)
    {
        word = word.replace(to,by);
        count+=1;
    }
    return word
}



const genPinCode = (character,characterCount)=>{
    let userCharacter = character.trim().toLowerCase();
    if(Object.keys(characterBox).includes(userCharacter))
    {
	let pinCharacter = characterBox[userCharacter];
        let pinCode = "";
        while(pinCode.length != characterCount)
        {
           let index = parseInt(Math.random() * pinCharacter.length);
           pinCode+=pinCharacter[index];   
        }
        return pinCode;
    }
    else
    {
       genPinCode('alphanumeric',6);
    }
}

const parentPinGeneration = (character,characterCount,dataBox,word,attachment)=>{
   let newPinCode = "";
   if(attachment == true)
   {
     newPinCode+=word;
   }

   newPinCode+=genPinCode(character,characterCount);
   if(dataBox.includes(newPinCode))
   {
      parentPinGeneration(character,characterCount,dataBox,word,attachment)
   }
   else
   {
     return newPinCode;
   }
}

const getRandomList = (list)=>{
    let collection = list.map((val)=>{return val});
    let questionsBox = [];
    let indexPoint = [];
    while(questionsBox.length != list.length)
    {
       let index = parseInt(Math.random() * collection.length);
       questionsBox.push(collection[index]);
       indexPoint.push(list.indexOf(collection[index]));
       collection.splice(index,1);
    }
 
    return [questionsBox,indexPoint];
 }

 const getManagedIndex = (list,indexes)=>{
    let clone = list.map((val)=>{return val});
    let indexClone = indexes.map((val)=>{return val});
    let managedList = [];
    
    indexClone.map((val)=>{return managedList.push(clone[val])});
    return managedList;
 }
 

module.exports = {getProductCode,bookingData,todayDate,getFancyDate,getFormattedToday,getTimeValue,getGiveAwayCode,monthAndDateFormatter,filterDate,days,getCustomizedError,checkTime,filterDateWithMarker,getFormattedTime,replaceAll,genPinCode,parentPinGeneration,getRandomList,getManagedIndex};
