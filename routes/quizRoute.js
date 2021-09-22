const express = require('express');
const router = express.Router();
const Quiz = require('../models/quizModel');
const auth = require('../middleware/auth');
const {check,validationResult} = require('express-validator')
const {getCustomizedError,checkTime,filterDateWithMarker,getFormattedTime,getFormattedToday,getManagedIndex,getRandomList} = require('../utils/utils')


router.post('/addQuiz',[
    check('paragraph','Please provide paragraph.').not().isEmpty(),
    check('questions','Provide questions for paragraph.').not().isEmpty(),
    check('answers','Provide answers for questions.').not().isEmpty(),
    check('realAnswer','Provide correct answer for questions.').not().isEmpty(),
    check('startAt','Please provide start date.').not().isEmpty(),
    check('startTime','Please provide start time.').not().isEmpty(),
    check('endTime','Please provide end time.').not().isEmpty(),
    check('chance','Please provide chance for question.').not().isEmpty(),
    check('paragraph','Paragraph should have atleast 30 characters.').isLength({"min":30}),
    check('chance','Chance should be in numeric format.').isNumeric(),
],async(req,res)=>{
    try
    {
        let errors = validationResult(req);
        if(errors.isEmpty())
        {
            console.log(req.body)
            let paragraph = req.body['paragraph'].trim();
            let questions = req.body['questions'];
            let answers = req.body['answers'];
            let realAnswer = req.body['realAnswer'];
            let startAt = req.body['startAt'];
            let startTime = req.body['startTime'];
            let endTime = req.body['endTime'];
            let chance = parseInt(req.body['chance']);

            

            let errorBox = {};

            //error handling
            if(questions.length < answers.length)
            {
                errorBox['questions'] = "Please provide questions for every answer options."
            }
            if(answers.length < questions.length)
            {
                errorBox['answers'] = "Please provide answers for every questions."
            }
            if(realAnswer.length < questions.length)
            {
                errorBox['realAnswer'] = "Please provide correct answers for every questions."
            }
            if(questions.length < realAnswer.length)
            {
                errorBox['realAnswer'] = "Answers are more than questions:( Manage it."
            }

            
            //working for time

            let startTimeSplit = startTime.split(":");
            let endTimeSplit = endTime.split(":");
            
            let startHour = parseInt(startTimeSplit[0]);
            let startMinute = parseInt(startTimeSplit[1]);

            let endHour = parseInt(endTimeSplit[0]);
            let endMinute = parseInt(endTimeSplit[1]);

            if(startMinute % 5 != 0)
            {
                startMinute = (startMinute - (startMinute % 5))  + 5;
            } 

            if(endMinute % 5 != 0)
            {
                endMinute = (endMinute - (endMinute % 5)) + 5;
            }

            let startPoint = new Date(startAt);
            let endPoint = new Date(startAt);

            startPoint.setHours(startHour,startMinute,0);
            endPoint.setHours(endHour,endMinute,0);
            
            let startChecking = checkTime(startPoint);
            let endChecking = checkTime(endPoint);

            if(startChecking != true)
            {
                errorBox['startTime'] = startChecking;
            }
            if(endChecking != true)
            {
                errorBox['endTime'] = endChecking;
            }

            //marker checking
            let newDateBox = filterDateWithMarker(startPoint,endPoint,['Saturday','Sunday']);
            if(newDateBox.length <= 0)
            {
                errorBox['startAt'] = "Cannot add quiz for Saturday and Sunday."
            }

            //time limitation checking
            let timeFromTime = parseInt((endPoint.getTime() - startPoint.getTime()) / (1000 * 60));
            
            if(timeFromTime < 5)
            {
                if(!Object.keys(errorBox).includes('endTime'))
                {
                    errorBox['endTime'] = "Time limitation should have atleast 5 minutes."
                }       
            }

     



            if(Object.keys(errorBox).length > 0)
            {
                return res.status(202).json({"success":false,"message":"Certain errors found.","error":errorBox});
            }
            else
            {
                 //time formatting
                 let formatStart = getFormattedTime(startPoint);
                 let formatEnd = getFormattedTime(endPoint);
                 
                 questions = questions.map((val)=>{return val.trim()});
                 answers = answers.map((val)=>{
                     return( val.map((val2)=>{return val2.trim()}) )
                 })
                 realAnswer = realAnswer.map((val)=>{
                     return (
                         val.map((val2)=>{
                             return val2.trim()
                         })
                     )
                 })
       
                //checking the real Answer with answers box
                let questionNos = "";
                for(var i=0; i<answers.length; i++)
                {
                    
                    if(realAnswer[i].length > 0)
                    {
                        for(var j of realAnswer[i])
                        {
                            if(!answers[i].includes(j))
                            {
                                questionNos+=`${i+1}, `;
                                break;
                            }
                        }
                    }
                    else
                    {
                        questionNos+=`${i+1}, `; 
                    }
                }
               
                if(questionNos.length > 0)
                {
                    questionNos = "Question Number "+questionNos.slice(0,questionNos.length-1)+" doesnot contain valid real answer which match with answer options."
                    return res.status(202).json({'success':false,"message":"Certain errors found.","error":{"random":questionNos}})
                }
                else
                { 
                 const quizObj = new Quiz({
                        "paragraph":paragraph,
                        'questions':questions,
                        'answers':answers,
                        'realAnswer':realAnswer,
                        'startAt':startAt,
                        'timeLimit':timeFromTime,
                        'startTime':[startPoint.getHours(),startPoint.getMinutes()],
                        "endTime":[endPoint.getHours(),endPoint.getMinutes()],
                        'startTime1':formatStart,
                        'endTime1':formatEnd,
                        "chance":chance
                    })
    
                    quizObj.save()
                    .then((data)=>{
                        return res.status(200).json({"success":true,"message":"Quiz Added!!"})
                    })
                    .catch((err)=>{
                        return res.status(404).json({"success":false,"message":err});
                    })
                }
               

            }

        }
        else
        {
            let customizedError = getCustomizedError(errors.array());
            return res.status(202).json({"success":false,"message":"Certain errors found.","error":customizedError});
        }
    }
    catch(err)
    {
        console.log(err)
        return res.status(404).json({"success":false,"message":err});
    }
})


//fetch ongoing quiz for today or future.
router.get('/fetchAllFutureQuiz',auth.verifyUser,async(req,res)=>{
    try
    {
        let quizDetails = await Quiz.find({
            
            $or:[
                {
                    "status":"Pending"
                },
                {
                    "status":"Running"
                }
            ]
        })
        .sort({
            "startAt":1,
            "startTime.0":1
        })

        let quizFilter = quizDetails.filter((val)=>{return val.status == "Running"});
        let quizIdContainer = quizFilter.map((val)=>{return val._id});

        if(quizDetails.length > 0)
        {
            return res.status(200).json({"success":true,"message":`${quizDetails.length} records found.`, "data":quizDetails,"quizContainer":quizIdContainer});
        }
        else
        {
            return res.status(202).json({"success":false,"message":`${quizDetails.length} records found.`});
        }
    }
    catch(err)
    {
        return res.status(404).json({"success":false,"message":err});
    }
})


//fetch single quiz.
router.get('/fetchSingleQuiz/:quizId',auth.verifyUser,async(req,res)=>{
    try
    {
        let quizId = req.params.quizId;
        let quiz = await Quiz.findOne({"_id":quizId,"startAt":getFormattedToday(new Date()),
            "status":"Running"})
        if(quiz != null)
        {
            let endTime = new Date();
            endTime.setHours(quiz.endTime[0],quiz.endTime[1],0);
            let secondTimer = parseInt(( endTime.getTime() - new Date().getTime() ) / (1000));
            
            return res.status(200).json({"success":true,"message":"Quiz found.","data":quiz,"quizTime":secondTimer});
        }
        else
        {
            return res.status(202).json({"success":false,"message":"You have selected a quiz, which does not match the current timing."})
        }
    }
    catch(err)
    {
        return res.status(404).json({"success":false,"message":err});
    }
})


//API: To fetch single running quiz
router.get('/fetchQuiz/:quizId',async(req,res)=>{
    try{
       let singleQuiz = await Quiz.findOne({'_id':req.params.quizId,'status':"Running",'startAt':getFormattedToday(new Date())});
       if(singleQuiz != null)
       {
          let date = new Date();
          date.setHours(singleQuiz.endTime[0],singleQuiz.endTime[1],0);
          let timeRemain = parseInt((date.getTime() - new Date().getTime()) / 1000); 

          let questions = singleQuiz.questions.map((val)=>{return val});
          let options =   singleQuiz.answers.map((val)=>{return val});
          let answers =   singleQuiz.realAnswer.map((val)=>{return val});
        
          let randomize =  getRandomList(questions);  
          let randomQuestions = randomize[0];
          let indexOptions = getManagedIndex(options,randomize[1]); 
          let indexAnswers = getManagedIndex(answers,randomize[1]);

          return res.status(200).json({'success':true,'message':'Single Quiz Fetched.','data':singleQuiz,'questions':randomQuestions,'options':indexOptions,'answers':indexAnswers,'quizTime':timeRemain});
       }
       else
       {
          return res.status(202).json({'success':false,'message':'Quiz Unavailabe'})
       } 
    }
   catch(err)
   {
     return res.status(404).json({'success':false,'message':err});
   } 
  })


module.exports = router;