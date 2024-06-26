import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import { getRecipientSocketId } from "../socket/socket.js";

const sendMessage = async (req, res) => {
    try {
        const { recipientId, message } = req.body;
        const senderId = req.user._id;

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, recipientId] },
        });

        // Conversation between recipient and sender is not yet started
        if (!conversation) {
            conversation = new Conversation({
                participants: [senderId, recipientId],
                lastMessage: {
                    text: message,
                    sender: senderId
                }
            })
            // save in the database
            await conversation.save()
        }

        // if conversation is already present, we create a new message 
        const newMessage = new Message({
            conversationId: conversation._id,
            sender: senderId,
            text: message
        });

        // afer creating new message with do two things, first is to save the message in the database and other is to update the last message
        await Promise.all([
            newMessage.save(),
            conversation.updateOne({
                lastMessage: {
                    text: message,
                    sender: senderId,
                }
            })
        ])

        const recipientSocketId = getRecipientSocketId(recipientId)
        if(recipientSocketId){
            io.to(recipientSocketId).emit("newMessage", newMessage)
        }


        res.status(201).json(newMessage)


    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const getMessages = async (req, res) => {
    const { otherUserId } = req.params;
    const userId = req.user._id
    try {
        const conversation = await Conversation.findOne({
            participants: { $all: [userId, otherUserId] }
        })

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" })
        }

        const messages = await Message.find({
            conversationId: conversation._id
        }).sort({ createdAt: 1 })

        res.status(200).json(messages);

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

async function getConversations(req, res) {
    const userId = req.user._id;
    try {
        const conversations = await Conversation.find({ participants: userId }).populate({
            path: "participants",
            select: "username profilePic"
        })
        // remove the current user from the participants array
        conversations.forEach(conversation => {
            conversation.participants = conversation.participants.filter(
                participants => participants._id.toString() !== userId.toString()
            );
        });
        res.status(200).json(conversations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export { sendMessage, getMessages, getConversations }