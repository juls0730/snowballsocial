var mongoose = require('mongoose');

var postSchema = mongoose.Schema({
    content: { type: String, required: true },
    imagePath: { type: String, required: false },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    createdAt: { type: Date, default: Date.now() },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reply"
    }]
});

module.exports = mongoose.model('Post', postSchema);  