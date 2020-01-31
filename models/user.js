const mongoose = require("mongoose");
const passportMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
    username:  String,
    password : String,
    isAdmin: {
        type: Boolean,
        default: false
    }
    // facebook: {
    //     id: String,
    //     email: String
    // }
});

userSchema.plugin(passportMongoose);

module.exports = mongoose.model("User", userSchema);