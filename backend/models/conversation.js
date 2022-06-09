const mongoose = require("mongoose");
const Conversation = mongoose.model(
  "Conversation",
  new mongoose.Schema({
    salt: String,
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
    ],
    name: {
        type: String,
        required: false,
    },
  })
);
module.exports = Conversation;