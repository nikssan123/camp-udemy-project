const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
    rating: {
        type: Number,
        min: 0,
        max: 5,
        validate: {
            validator: Number.isInteger,
            message: "You must provide an integer value!"
        },
        required: "Please provide a rating (0-5)"
    },
    text: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String,
        profilePic: {
            type: String,
            default: "https://res.cloudinary.com/nikssan123/image/upload/v1580680721/profile_ir66l2.jpg"
        }
    },
    campground: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Campground"
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Review", ratingSchema);