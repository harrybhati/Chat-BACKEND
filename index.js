const mongoose = require("mongoose");
const express = require("express");
const app = express();
require("./Config");
const Sing = require("./SingInSch");
const cors = require("cors");
const Message = require("./ChatSch");

app.use(cors(
    {
    origin:["https://chat-backend-seven-dusky.vercel.app"],
    methods:["POST","GET","PUT","DELETE"),
       credentials:true
             });
app.use(express.json());

app.get("/",(req,resp)=>{
    resp.send("hello")});

// Register Api
app.post("/register", async (req, resp) => {
    try{
        const ExistUser = await Sing.findOne({email:req.body.email});
        if (ExistUser){
            return resp.status(400).send("User already registered");
        }
            const db = await Sing(req.body);
            const data = await db.save();
            console.log(data);
            resp.send(data);
        
    }catch(err){
        resp.send(err);
    }
 
});

// Login Api
app.post("/user", async (req, resp) => {
  // this is used for when user enter these deatils then move forward otherwise not
  if (req.body.email && req.body.password) {
    const UserFound = await Sing.findOne(req.body);
    if (UserFound) {
      resp.send(UserFound);
    } else {
      resp.send("User not found  ");
    }
  } else {
    resp.send("User Not Found");
  }
});

// search Api

app.get("/user-search/:key", async (req, resp) => {
  const key = req.params.key;
   const result = await Sing.find({
    $or: [
      // or is used to get value by any one of the like by name or by email
      {
        name: { $regex: key, $options: "i" },
      },
      {
        email: { $regex: key, $options: "i" }, // $option:'i' This option makes the regex search case-insensitive,
        //  meaning it will match regardless of whether the characters are upper or lower case.
      },
    ],
  });
  resp.send(result);
});

// Route to send a message
app.post("/ChatMess", async (req, res) => {
  const { senderId, senderName, receiverId, receiverName, message } = req.body;

  try {
    const newMessage = new Message({senderId,senderName,receiverId,receiverName,message});
    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (err) {
    console.error(err);
  }
});
//routr to get the chat history between users 
app.get("/ChatHistory/:senderId/:receiverId", async (req, res) => {
  const { senderId, receiverId } = req.params;
  try {
    // Fetch messages between the two users, sorting them by timestamp in ascending order
    const messages = await Message.find({
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ timestamp: 1 }); //Sorting messages by timestamp in ascending order
    res.json(messages);
  } catch (err) {
    console.error(err);
  }
});





app.get('/chatlive/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
  
      // Fetch messages where the current user is either the sender or receiver
      const messages = await Message.find({
        $or: [{ senderId: userId }, { receiverId: userId }]
      });
  
      if (!messages.length) {
        return res.status(404).json({ error: 'No messages found' });
      }
  
      // Extract unique user IDs from the messages
      const interactedUserIds = [
        ...new Set(
          messages.map((message) =>
            message.senderId === userId ? message.receiverId : message.senderId
          )
        ),
      ];
  
      // Fetch the user details for the interacted user IDs
      const interactedUsers = await Sing.find({ _id: { $in: interactedUserIds } });
  
      if (!interactedUsers.length) {
        return res.status(404).json({ error: 'No interacted users found' });
      }
  
      // Return the interacted users as the response
      res.json(interactedUsers);
    } catch (err) {
      console.error('Error fetching interacted users:', err);
      res.status(500).json({ error: 'Failed to fetch interacted users' });
    }
  });
  





app.listen(1000, () => {
  console.log("Connected");
});
