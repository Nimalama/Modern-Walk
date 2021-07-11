const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');

const isEqualHelperHandlerbar = function(a, b, opts) {
    if (a == b) {
        return opts.fn(this) 
    } else { 
        return opts.inverse(this) 
    } 
}


const emailTransporter = ()=>{
    const transporter = nodemailer.createTransport({
        service:"gmail",
        host: "smtp.gmail.com",
        port:587,
        secure:true,
        auth:{
            user:process.env.EMAIL,
            pass:process.env.PASSWORD
        }
    });
    const handleBarOptions = {
        viewEngine:{
            extName:'.hbs',
            partialsDir:'views',
            layoutsDir:'views',
            defaultLayout:'',
            helpers:{
                if_equal:isEqualHelperHandlerbar
            }
            
        },
        viewPath:'views',
        extName:'.hbs'
    }
    transporter.use('compile',hbs(handleBarOptions));
    return transporter;
}

const sendMessage = (messageContent)=>{
   
    emailTransporter().sendMail(messageContent,(err,data)=>{
        if(err)
        {
            console.log(err);
        }
        else
        {
            console.log("Message Sent!!");
        }
    })
    
}

const sendMailMessage = (subject,email,content) =>{
   
    let emailMessage = {
        "from":process.env.EMAIL,
        "to":email,
        "subject":subject,
        "template":'template',
        "context":content
        
    } ;
    sendMessage(emailMessage);
    
}

module.exports = {sendMailMessage};