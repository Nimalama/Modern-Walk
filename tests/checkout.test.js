const User = require('../models/registration');
const mongoose = require("mongoose");
const Checkout = require("../models/checkoutModel")
const Booking = require("../models/bookingModel");

const url = 'mongodb://127.0.0.1:27017/ClothingStore';

beforeAll(async () => {
    await mongoose.connect(url, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true
    })
})

afterAll(async () => {

    await mongoose.connection.close();
})

describe("User Schema Test", () => {
    //    insert testing
   
    it('Checkout Product', async() => {
        let cart = await Booking.find({}).sort({"booked_At":-1});
        const checkout = {
            "booking_id":cart[0]._id,
            "quantity":2,
            "price":100,
            "booked_at":"2021-03-02",
            "timeHour":[9,25],
            "address":"Swyambhu",
            "phoneNo":"9803609163",
            "phoneNo2":"9803609162",
            "bookingCode":"123456",
            "dateTime":new Date(),
            "unreceivedIncrement":"23"
        };
        return Checkout.create(checkout)
            .then((res) => {
                expect(res.phoneNo).toEqual('9803609163');
            })
    })
   

    it("Update Checkout", async () => {
        let checkout = await Checkout.find({});
        const status = await Checkout.updateOne({
            "_id": checkout[0]._id
        }, { $set: { "bookingCode": "123578" } });

        expect(status.ok).toBe(1)

    })
    it("Delete Product", async () => {
        let checkout = await Checkout.find({});
        const status = await Checkout.deleteOne({ id: checkout[0]._id })

        expect(status.ok).toBe(1)
    })




})