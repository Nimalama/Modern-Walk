const User = require('../models/registration');
const mongoose = require("mongoose");
const Product = require("../models/productModel");
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
    it('Add user', () => {
        const user = {
            'fname': 'Nabin',
            'lname': 'Kutu',
            'Dob': '12-05-1999',
            'Gender': 'Male',
            'Nationality': 'Nepali',
            'Address': 'Bhaktapur',
            'Phoneno': '98111000001',
            'Email': "kutunabin1@gmail.com",
            'Username': "kutunabin12",
            'Password': '123456'
        };
        return User.create(user)
            .then((res) => {
                expect(res.fname).toEqual('Nabin');
            })
    })
    it('Update', async () => {
        const reg = {
            'Username': 'nima'
        };
        const status = await User.updateOne({ _id: Object('602f33e5c79035ea8c94c091') },
            { $set: reg });
        expect(status.ok).toBe(1);
    });

    it("Add Product", () => {
        const product = {
            pname: "Tshirt",
            pprice: 5000,
            pdesc: "This is nice product",
            pimage: "myImg.jpg",
            availableStock: 10,
            sold: 0,
            productCode: "dsrQet",
            pBrand: "Addidas",
            discount: 50,
            newPrice: 2500,
            discountedAmount: 2500,
            onSale: false,
            category: "Male"
        }

        return Product.create(product).then((res) => {
            expect(res.pname).toEqual("Tshirt")
        })


    })
    it("Update Product", async () => {
        const status = await Product.updateOne({
            "_id": "6066c16b5f5ee306fc5b7766"
        }, { $set: { "availableStock": 25 } });

        expect(status.ok).toBe(1)

    })
    it("Delete Product", async () => {
        const status = await Product.deleteOne({ id: "6066c16b5f5ee306fc5b7766" })

        expect(status.ok).toBe(1)
    })
    it("Book Product", () => {
        const bookingRecord = {
            "user_id": "6018cd035d18602354e3377f",
            "product_id": "6066c1175f5ee306fc5b7765",
            "quantity": 3,
            "price": 1200,
            "booked_At": "2021-01-01",
            "delivery_address": "Swyambhu",
            "delivery_number": "9803609163",
            "deliveryStarts": "2021-01-01",
            "bookingCode": "werhfd",
            "bookedDate": new Date()
        }

        return Booking.create(bookingRecord).then((res) => {
            expect(res.quantity).toEqual(3)
        })
    })
    it("Update Booking", async () => {
        let status = await Booking.updateOne({
            "_id": "607bdb1a540c7e1990424528"
        }, {
            $set: { "quantity": 2 }
        })

        expect(status.ok).toBe(1);
    })
    it("Delete Booking", async () => {
        let status = await Booking.deleteOne({
            "_id": "607bdb1a540c7e1990424528"
        })

        expect(status.ok).toBe(1)
    })





})