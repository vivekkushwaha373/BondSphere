// const User = require('../models/userModel')
const Message = require('../models/messageModel');
const Conversation = require('../models/conversationModel');
const { getRecieverSocketId, io } = require('../socket/socket');
const User = require('../models/userModel');
// const Comment = require('../models/commentModel');
// const Post = require('../models/postModel');

exports.sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const receiverId = req.params.id;
        const { textMessage: message } = req.body;

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId]
            })
        };

        const newMessage = await Message.create({
            senderId,
            receiverId,
            message
        });

        if (newMessage) {
            conversation.messages.push(newMessage._id);
        }

        await Promise.all([
            conversation.save(),
        ])
        
        const user = await User.findById(senderId).select('username profilePicture'); 

        const notification = {
            type: 'message',
            userId: senderId,
            userDetails: user,
           
            message: `messaged you: ${message}`
        }
        
        const receiverSocketId = getRecieverSocketId(receiverId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit('newMessage', newMessage);
            io.to(receiverSocketId).emit('notification', notification);
        }

        return res.status(201).json({
            success: true,
            newMessage
        })
    }
    catch (error) {
      
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

exports.getMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const receiverId = req.params.id;
        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        }).populate('messages');

        if (!conversation) {
            return res.status(200).json({
                success: true,
                message: []
            })
        };

        return res.status(200).json({
            success: true,
            messages: conversation?.messages
        })
    }

    catch (error) {
        
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}