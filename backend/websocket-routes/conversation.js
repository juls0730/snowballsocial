const conversation = require("../models/conversation");
const messagemodel = require("../models/message");
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const usermodel = require('../models/user');
const Redis = require('ioredis')
const redisClient = new Redis()

function decrypt(salt, encoded) {
    const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
    const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code);
    return encoded
        .match(/.{1,2}/g)
        .map((hex) => parseInt(hex, 16))
        .map(applySaltToChar)
        .map((charCode) => String.fromCharCode(charCode))
        .join("");
};

module.exports = function (io) {
    io.on("connection", (socket) => {
        let salt
        let decryptedMessage;
        socket.isAlive = true;
        socket.on("message", (data) => {

            if (!data.conversationId) {
                return;
            }

            if (!data.content) {
                return;
            }

            if (!data.creator) {
                return;
            }

            if (!data.creator) {
                return "No token provided!";
            }

            let userId;
            jwt.verify(data.creator, config.jwtSecret, (err, decoded) => {
                if (err) {
                    return "Unauthorized!";
                }


                userId = decoded.userId;
            });

            conversation.findById({ _id: data.conversationId }, async (err, conversation) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (!conversation) {
                    return;
                }

                if (!userId) {
                    return;
                }

                if (conversation.participants.indexOf(userId.toString()) == -1) {
                    return;
                }

                salt = conversation.salt;

                decryptedMessage = decrypt(salt, data.content);
                decryptedMessage = decryptedMessage.trim();

                // TODO: fix this because the length is not correct, length is 2017 but its actually 1983 so idk how the fuck to fix this it doesnt make any fucking sense
                if (decryptedMessage.length > 2000) {
                    return;
                }

                if (!decryptedMessage) {
                    return;
                }

                let strippedMessageContent = decryptedMessage.replace(/ /gm, '');

                if (!strippedMessageContent) {
                    return;
                }

                let user;
                await redisClient.get('cache-user-' + userId, (err, reply) => {
                    if (reply == null || err) {
                        usermodel.findById(userId, '-password -__v -email', async function (err, userreply) {
                            if (err) {
                                return res.status(500).json({
                                    message: "Fetching posts failed"
                                });
                            }

                            user = userreply;
                            redisClient.set('cache-user-' + userId, JSON.stringify(user))
                        })
                    } else {
                        user = JSON.parse(reply)
                    }
                })

                const message = await new messagemodel({
                    content: data.content,
                    conversation: data.conversationId,
                    creator: user,
                    sent: new Date(),
                });


                if (err) {
                    return;
                }

                io.emit("channel-" + data.conversationId, {
                    message: {
                        ...message._doc,
                        creator: user
                    }
                });
            });
        });
        socket.on("typing", async (data) => {
            let userId;
            jwt.verify(data.creator, config.jwtSecret, (err, decoded) => {
                if (err) {
                    return "Unauthorized!";
                }


                userId = decoded.userId;
            });

            let user;
            await redisClient.get('cache-user-' + userId, (err, reply) => {
                if (reply == null || err) {
                    usermodel.findById(userId, '-password -__v -email', async function (err, userreply) {
                        if (err) {
                            return;
                        }

                        user = userreply;
                        redisClient.set('cache-user-' + userId, JSON.stringify(user))
                    })
                } else {
                    user = JSON.parse(reply)
                }
            })

            socket.emit("typing-" + data.conversationId, {
                user: user
            });

            console.log("typing-" + data.conversationId, {
                user: user
            });
        });

        socket.on("nottyping", async (data) => {
            let userId;
            jwt.verify(data.creator, config.jwtSecret, (err, decoded) => {
                if (err) {
                    return "Unauthorized!";
                }


                userId = decoded.userId;
            });

            let user;
            await redisClient.get('cache-user-' + userId, (err, reply) => {
                if (reply == null || err) {
                    usermodel.findById(userId, '-password -__v -email', async function (err, userreply) {
                        if (err) {
                            return;
                        }

                        user = userreply;
                        redisClient.set('cache-user-' + userId, JSON.stringify(user))
                    })
                } else {
                    user = JSON.parse(reply)
                }
            })

            socket.emit("nottyping-" + data.conversationId, {
                user: user
            });
            socket.emit('sanity-check');
            console.log("nottyping-" + data.conversationId, {
                user: user
            })
        })
    })
}