var mongoose = require('mongoose');

const replySchema = mongoose.Schema({
    content: { type: String, required: true },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    imagePath: { type: String, required: false },
    createdAt: { type: Date, default: Date.now() },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
});

module.exports = mongoose.model('Reply', replySchema);  