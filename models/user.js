const mongoose = require("mongoose");
const passportMongoose = require("passport-local-mongoose");
const Notification = require("../models/notification");

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
    profilePic: {
        type: String,
        default: "https://res.cloudinary.com/nikssan123/image/upload/v1580680721/profile_ir66l2.jpg"
    },
    imageID: String,
    password : String,
    isAdmin: {
        type: Boolean,
        default: false
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    notifications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification"
    }], 
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    facebook: {
        id: String,
        email: String
    }
});

userSchema.plugin(passportMongoose);

module.exports = mongoose.model("User", userSchema);