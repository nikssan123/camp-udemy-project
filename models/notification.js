const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    // campgroundID: String,
    isRead: {
        type: Boolean,
        default: false
    },
    link: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("Notification", notificationSchema);