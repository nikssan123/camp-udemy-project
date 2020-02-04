const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
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
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Comment", commentSchema);