const mongoose = require('mongoose');
require('dotenv').config();


exports.connectDB = () => {
    mongoose.connect(process.env.MONGODB_URL)
        .then(() => {
            console.log("Database is connected successfully");
        }).catch((error) => {
            console.log("DB connection fail", error);
        })
}