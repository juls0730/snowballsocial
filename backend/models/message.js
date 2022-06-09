const mongoose = require("mongoose");
const Message = mongoose.model(
  "Message",
  new mongoose.Schema({
    content: String,
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation"
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    sent: Date,
  })
);
module.exports = Message;