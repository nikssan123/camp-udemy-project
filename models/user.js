const mongoose = require("mongoose");
const passportMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
    username:  {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password : String,
    isAdmin: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
    // facebook: {
    //     id: String,
    //     email: String
    // }
});

userSchema.plugin(passportMongoose);

module.exports = mongoose.model("User", userSchema);