const express = require('express');
const bodyparser = require('body-parser');
const db = require('./database/db');
const schedule = require('./schedule/schedule')
const dotenv= require('dotenv');
dotenv.config({"path":'./.env'})
const route = require('./routes/routes')
const productRoute = require('./routes/productRoute');
const bookRoute = require('./routes/bookingRoute');
const giveAwayRoute = require('./routes/giveawayRoute');
const checkoutRoute = require('./routes/checkoutRoute')
const quizRoute = require('./routes/quizRoute')
const doctorRoute = require('./routes/doctorRoute')
const multiImagesRoute = require('./routes/multiImagesRoute');
const cors=require('cors');
const path = require('path');
const morgan = require('morgan')

const app = express();


app.use(cors());
app.use(bodyparser.urlencoded({ extended: false }))
app.use('/images',express.static(path.join(__dirname,'/images')))
app.use(express.json());

app.use(route);
app.use(productRoute);
app.use(bookRoute);
app.use(giveAwayRoute);
app.use(checkoutRoute);
app.use(doctorRoute);
app.use(quizRoute);
app.use(multiImagesRoute);


app.listen(90)