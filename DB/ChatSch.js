const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  receiverId: {
    type: String,
    required: true,
  },
  receiverName: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
}, { collection: 'Message' });

// ✅ Use mongoose.models to avoid OverwriteModelError on serverless
const chatMessage = mongoose.models.Message || mongoose.model('Message', messageSchema);

module.exports = chatMessage;
