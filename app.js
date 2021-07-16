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


const cors=require('cors');
const path = require('path');



const app = express();
app.use(cors());
app.use(bodyparser.urlencoded({ extended: false }))
app.use('/images',express.static(path.join(__dirname,'/images')))
app.use(express.json());

app.use(route);
app.use(productRoute);
app.use(bookRoute);

app.use(giveAwayRoute);


app.listen(90)