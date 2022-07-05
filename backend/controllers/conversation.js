const conversationmodel = require('../models/conversation');
const messagemodel = require('../models/message');
const usermodel = require('../models/user');
const Redis = require('ioredis')
const redisClient = new Redis()
const crypto = require('node:crypto');

exports.startConversation = async (req, res) => {
    const userId = req.userData.userId;
    let partner = req.body.partner;
    let partnerData;
    let error;

    if (!partner || !userId) {
        error = true;
        return res.status(400).json({
            message: 'Invalid request ' + partner + ' ' + userId + ' ' + req.body.toString()
        });
    }

    if (partner.split(' ').length > 1) {
        partnerData = []
        let friends;
        partner = partner.split(' ');
        for (let i = 0; i < partner.length; i++) {
            partner[i] = partner[i].trim();

            await usermodel.findOne({ username: partner[i] }).lean().exec(async (err, user) => {
                if (err) {
                    error = true;
                    return res.status(500).json({
                        message: 'Server error'
                    });
                }
                if (!user) {
                    error = true;
                    return res.status(404).json({
                        message: 'User not found'
                    });
                }
                partnerData.push(await user);


                if (partnerData[i]._id == userId) {
                    error = true;
                    return res.status(400).json({
                        message: 'You can\'t start a conversation with yourself'
                    });
                }
            })
        }

        let participantsIds = [];
        for (let i = 0; i < partnerData.length; i++) {
            participantsIds[i] = partnerData[i]._id;
        }

        let salt = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
        for (counter = 0; counter < 256; counter++) {
            var randomNum = 0 + parseInt(Math.random() * 127);
            if (randomNum > 100) {
                salt += String.fromCharCode(randomNum);
            } else {
                salt += crypto.createHmac('sha512', crypto.randomBytes(128).toString('base64')).digest('hex').substring(0, 2);
                counter--;
            }
        }

        if (error) {
            return
        }

        await conversationmodel.find({ participants: [userId].concat(participantsIds) }, async (err, existingConversation) => {
            if (err) {
                return res.status(500).json({
                    message: 'Server error'
                });
            }

            if (existingConversation.length > 0) {
                if (error) {
                    return
                }
                return res.status(400).json({
                    message: 'You already have a conversation with these users'
                });
            }

            const conversation = new conversationmodel({
                salt: salt,
                participants: [userId].concat(await partnerData.map(p => p._id))
            });

            await conversation.save((err, conversation) => {
                if (err) {
                    return res.status(500).json({
                        message: 'Server error'
                    });
                }

                return res.status(200).json({
                    conversation
                });
            });
        }).clone()
    } else {
        await usermodel.find({ username: partner }, async (err, partnerinfo) => {
            if (err) {
                return res.status(500).json({
                    message: "Error while finding partner"
                })
            }

            partnerData = partnerinfo[0];
        }).clone(); // super hacky but works
        if (!partnerData) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        if (userId == partnerData._id) {
            return res.status(400).json({
                message: "You can't start conversation with yourself. Did you buy that board game to see what it felt like to have a life?"
            });
        }

        await usermodel.findById({ _id: userId }, '-password', async (err, user) => {
            if (err) {
                res.status(500).send({ message: err });
                return;
            }

            let salt = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
            for (counter = 0; counter < 256; counter++) {
                var randomNum = 0 + parseInt(Math.random() * 127);
                if (randomNum > 100) {
                    salt += String.fromCharCode(randomNum);
                } else {
                    salt += crypto.createHmac('sha512', crypto.randomBytes(128).toString('base64')).digest('hex').substring(0, 2);
                    counter--;
                }
            }

            const conversation = new conversationmodel({
                salt: salt,
                participants: [userId, partnerData._id],
            });

            await conversationmodel.findOne({ participants: [userId, partnerData._id] }, async (err, existingConversation) => {
                if (err) {
                    res.status(500).send({ message: err });
                    return;
                }

                if (existingConversation) {
                    res.status(500).send({ message: "conversation already exists" });
                    return;
                }

                await conversation.save((err, conversation) => {
                    if (err) {
                        res.status(500).send({ message: err });
                        return;
                    }

                    res.status(200).send({ conversation });
                });
            }).clone()
        }).clone()
    }
}

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

exports.message = async (req, res) => {
    const conversationId = req.params.id;
    let messageContent = req.body.content;
    const userId = req.userData.userId;
    let salt
    let decryptedMessage;
    let error;

    await conversationmodel.findById(conversationId, async (err, conversation) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }

        if (!conversation) {
            res.status(404).send({ message: "Conversation not found" });
            return;
        }

        salt = conversation.salt;

        decryptedMessage = decrypt(salt, messageContent);
        decryptedMessage = decryptedMessage.trim();

        // TODO: fix this because the length is not correct, length is 2017 but its actually 1983 so idk how the fuck to fix this it doesnt make any fucking sense
        if (decryptedMessage.length > 2000) {
            error = true;
            return res.status(400).json({
                message: "Message content can't be longer than 2000 characters"
            });
        }

        if (!decryptedMessage) {
            error = true;
            return res.status(400).json({
                message: "Message content can't be empty"
            });
        }

        let strippedMessageContent = decryptedMessage.replace(/ /gm, '');

        if (!strippedMessageContent) {
            error = true;
            return res.status(400).json({
                message: "Message content can't be empty"
            });
        }
    }).clone() // god i hate this




    if (!conversationId || !userId) {
        error = true;
        return res.status(400).json({
            message: "Invalid request"
        });
    }

    await conversationmodel.findById({ _id: conversationId }, async (err, conversation) => {
        if (err) {
            error = true;
            res.status(500).send({ message: err });
            return;
        }

        if (error) {
            return;
        }

        if (conversation.participants.indexOf(userId) == -1) {
            res.status(401).send({ message: "You are not a participant of this conversation." });
            return;
        }

        const message = await new messagemodel({
            conversation: conversationId,
            creator: userId,
            content: messageContent,
            sent: new Date(),
        });

        message.save(async (err, result) => {
            let user;
            await redisClient.get('cache-user-' + req.userData.userId, (err, reply) => {
                if (reply == null || err) {
                    usermodel.findById(req.userData.userId, '-password -__v -email', async function (err, user) {
                        if (err) {
                            return res.status(500).json({
                                message: "Fetching posts failed"
                            });
                        }

                        user = user;
                        redisClient.set('cache-user-' + req.userData.userId, JSON.stringify(user))
                    })
                } else {
                    user = JSON.parse(reply)
                }
            })
            return res.status(201).json({
                message: "Post created",
                message: {
                    ...result._doc,
                    creator: await user
                },
                totalMessages: await messagemodel.countDocuments({ conversation: conversationId })
            });
        });
    }).clone()
}

exports.getConversation = (req, res) => {
    const conversationId = req.params.id;
    const userId = req.userData.userId;

    conversationmodel.findById({ _id: conversationId }, (err, conversation) => {
        if (err) {
            res.status(500).json({
                message: "Fetching conversation failed"
            });
            return;
        }

        if (conversation == null) {
            res.status(404).json({
                message: "Conversation not found"
            });
            return;
        }

        if (conversation.participants.indexOf(userId) == -1) {
            res.status(401).json({
                message: "You are not a participant of this conversation."
            });
            return;
        }

        let salt = conversation.salt;
        let totalMessages;
        const CurentPage = +req.query.currentpage;
        const messagequery = messagemodel.find({ conversation: conversationId }, '-__v').sort({ sent: -1 });
        if (CurentPage) {
            messagequery.skip(50 * (CurentPage - 1))
                .limit(50);
        } else {
            return res.status(400).json({
                message: "Currentpage not defined"
            })
        }


        messagequery.lean().exec(async (err, messages) => {
            if (err) {
                res.status(500).json({ message: err });
                return;
            }

            totalMessages = await messagemodel.countDocuments({ conversation: conversationId });

            let conversationdata = conversation;
            conversationdata.salt = undefined;
            var participants = [];

            if (totalMessages === 0) {
                conversationmodel.findById(conversationId, '-salt', async (err, conversationdata) => {
                    if (err) {
                        res.status(500).json({ message: err });
                        return;
                    }

                    for (let j = 0; j < conversationdata.participants.length; j++) {
                        await redisClient.get('cache-user-' + conversationdata.participants[j], (err, reply) => {
                            if (reply == null || err) {
                                usermodel.findById(conversationdata.participants[j], '-password -__v -email', async function (err, user) {
                                    if (err) {
                                        return res.status(500).json({
                                            message: "Fetching posts failed"
                                        });
                                    }

                                    participants[j] = user;
                                    redisClient.set('cache-user-' + participants[j]._id, JSON.stringify(user))
                                })
                            } else {
                                participants[j] = JSON.parse(reply)
                            }
                        })
                        if (j === conversationdata.participants.length - 1) {
                            return res.status(200).json({
                                message: "Messages fetched successfully",
                                messages: [],
                                conversation: {
                                    ...conversationdata._doc,
                                    participants: await participants
                                },
                                totalMessages: totalMessages,
                                salt: salt
                            });
                        }
                    }
                })
                return
            }

            if (!((messages.length / 15) > 0)) {
                return res.status(406).json({
                    message: "Not enough posts to fill that many pages"
                })
            }

            for (let j = 0; j < conversationdata.participants.length; j++) {
                await redisClient.get('cache-user-' + conversationdata.participants[j], (err, reply) => {
                    if (reply == null || err) {
                        usermodel.findById(conversationdata.participants[j], '-password -__v -email', async function (err, user) {
                            if (err) {
                                return res.status(500).json({
                                    message: "Fetching posts failed"
                                });
                            }

                            participants[j] = user;
                            redisClient.set('cache-user-' + participants[j]._id, JSON.stringify(user))
                        })
                    } else {
                        participants[j] = JSON.parse(reply)
                    }
                })

                if (j === conversationdata.participants.length - 1) {
                    for (let i = 0; i < messages.length; i++) {
                        await redisClient.get('cache-user-' + messages[i].creator, (err, reply) => {
                            if (reply == null || err) {
                                usermodel.findById(messages[i].creator, '-password -__v -email', async function (err, user) {
                                    if (err) {
                                        return res.status(500).json({
                                            message: "Fetching posts failed"
                                        });
                                    }

                                    messages[i].creator = user;
                                    redisClient.set('cache-user-' + messages[i].creator._id, JSON.stringify(user))
                                })
                            } else {
                                messages[i].creator = JSON.parse(reply)
                            }
                        })
                        if (i === messages.length - 1) {
                            return res.status(200).json({
                                message: "Messages fetched successfully",
                                messages: await messages,
                                conversation: {
                                    ...conversationdata._doc,
                                    participants: await participants
                                },
                                totalMessages: totalMessages,
                                salt: salt
                            });
                        }
                    }
                }
            }
        });
    });
}

exports.getUsersConversations = (req, res) => {
    const userId = req.userData.userId;

    conversationmodel.find({ participants: userId }, '-salt').lean().exec(async (err, conversations) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }

        if (conversations.length == 0) {
            return res.status(200).json({
                message: "No conversations found",
                conversations: []
            });
        }

        for (let i = 0; i < conversations.length; i++) {
            for (let j = 0; j < conversations[i].participants.length; j++) {
                await redisClient.get('cache-user-' + conversations[i].participants[j], (err, reply) => {
                    if (reply == null || err) {
                        usermodel.findById(conversations[i].participants[j], '-password -__v -email', async function (err, user) {
                            if (err) {
                                return res.status(500).json({
                                    message: "Fetching posts failed"
                                });
                            }

                            conversations[i].participants[j] = user;
                            redisClient.set('cache-user-' + conversations[i].participants[j]._id, JSON.stringify(user))
                        })
                    } else {
                        conversations[i].participants[j] = JSON.parse(reply)
                    }
                })
            }
        }

        res.status(200).send({ conversations });
    });
}

exports.updateConversation = (req, res) => {
    const conversationId = req.params.id;
    const userId = req.userData.userId;

    if (!userId) {
        return res.status(401).json({
            message: "Auth failed"
        });
    }

    if (!conversationId) {
        return res.status(400).json({
            message: "Conversation id not defined"
        });
    }

    conversationmodel.findById(conversationId, async (err, conversation) => {
        if (err) {
            return res.statu(500).json({
                message: "Internal server error"
            })
        }


        if (conversation.participants.indexOf(userId) == -1) {
            res.status(401).json({
                message: "You are not a participant of this conversation."
            });
            return;
        }

        if (conversation.participants.length == 2) {
            return res.status(400).json({
                message: "You cannot edit a conversation with only two participants."
            })
        }
    })

    if (req.body.salt || req.body.messages || req.body._id) {
        return res.status(400).json({
            message: "Invalid request"
        });
    }

    conversationmodel.findByIdAndUpdate({ _id: conversationId }, { $set: req.body }, { new: true }, (err, conversation) => {
        if (err) {
            res.status(500).json({
                message: "Updating conversation failed"
            });
            return;
        }

        if (conversation == null) {
            res.status(404).json({
                message: "Conversation not found"
            });
            return;
        }

        if (conversation.participants.indexOf(userId) == -1) {
            res.status(401).json({
                message: "You are not a participant of this conversation."
            });
            return;
        }

        res.status(200).json({
            message: "Conversation updated",
            conversation: {
                ...conversation._doc,
                salt: undefined,
                __v: undefined
            }
        });
    })
}

exports.deleteConversation = (req, res) => {
    const conversationId = req.params.id;
    const userId = req.userData.userId;

    if (!userId) {
        return res.status(401).json({
            message: "Auth failed"
        });
    }

    if (!conversationId) {
        return res.status(400).json({
            message: "Conversation id not defined"
        });
    }

    conversationmodel.findById(conversationId, async (err, conversation) => {
        if (err) {
            return res.statu(500).json({
                message: "Internal server error"
            })
        }

        if (conversation == null) {
            req.status(404).json({
                message: "Conversation not found"
            })
        }

        if (conversation.participants.indexOf(userId) == -1) {
            res.status(401).json({
                message: "You are not a participant of this conversation."
            });
            return;
        }

        if (conversation.participants.length > 2) {
            if (conversation.participants.indexOf(userId) == 0) {
                // user is the creator  of the conversation
                conversationmodel.findByIdAndDelete(conversationId, (err, conversationdata) => {
                    if (err) {
                        res.status(500).json({
                            message: "Deleting conversation failed"
                        });
                        return;
                    }

                    return res.status(200).json({
                        message: "Conversation deleted"
                    });
                })
            }
        }

        if (conversation.participants.length == 2) {
            conversationmodel.findByIdAndDelete(conversationId, (err, conversationdata) => {
                if (err) {
                    res.status(500).json({
                        message: "Deleting conversation failed"
                    });
                    return;
                }

                return res.status(200).json({
                    message: "Conversation deleted"
                });
            })
        }
    })
}