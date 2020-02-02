const mongoose = require("mongoose");

//MongoDB Schema setup -> campgrounds
const campgroundSchema = new mongoose.Schema({
    name: String,
    price: String,
    image: {
        type: String,
        required: true
    },
    imageID: String,
    description: String,
    location: String,
    lat: Number,
    lng: Number,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    date: {
        type: Date,
        default: Date.now
    }
});

//compile it into a model
module.exports = mongoose.model("Campground", campgroundSchema);
