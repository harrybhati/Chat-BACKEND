require("dotenv").config();
const express = require("express");
const app = express();
const connectDb = require("./DB/Config");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const Chat = require("./DB/UserSchema");
const chatMessage = require("./DB/ChatSch");

// ✅ CORS (local + Vercel frontend)
app.use(cors({
  origin: "https://chat-front-end-puce.vercel.app", // frontend domain
  credentials: true, // allow cookies
}));

app.use(express.json());
app.use(cookieParser());

// ✅ CONNECT DB ONCE (serverless-safe because of caching)
connectDb();

// ================= Root =================
app.get("/", (req, resp) => {
  resp.send("hello jai shree ram");
});

// ================= JWT Middleware =================
const tokenMiddleware = (req, resp, next) => {
  const token = req.cookies.token;
  if (!token) {
    return resp.status(401).json({ message: "No token found" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    return resp.status(401).json({ message: "Invalid token" });
  }
};

// ================= Register =================
app.post("/signup", async (req, res) => {
  try {
    let { name, email, password } = req.body;
    email = email.toLowerCase();

    const userExist = await Chat.findOne({ email });
    if (userExist)
      return res.status(400).json({ message: "User already registered" });

    const hashedPassword = await bcrypt.hash(password.toString(), 10);

    const newUser = new Chat({ name, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.status(201).json({
      message: "User created",
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ================= Login =================
app.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.toLowerCase();

    const user = await Chat.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password.toString(), user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.status(200).json({
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ================= Check Auth =================
app.get("/checkAuth", tokenMiddleware, async (req, res) => {
  try {
    const user = await Chat.findById(req.userId);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      message: "Token is valid",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("CheckAuth error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ================= Send Message =================
app.post("/sendMessage", tokenMiddleware, async (req, res) => {
  try {
    const { receiverId, receiverName, message } = req.body;
    const senderId = req.userId;

    const sender = await Chat.findById(senderId);
    if (!sender)
      return res.status(404).json({ message: "Sender not found" });

    const newMessage = new chatMessage({
      senderId,
      senderName: sender.name,
      receiverId,
      receiverName,
      message,
    });

    await newMessage.save();
    res.status(200).json({ message: "Message sent successfully" });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ================= Get Messages =================
app.get("/getMessage/:userId", tokenMiddleware, async (req, res) => {
  try {
    const messages = await chatMessage
      .find({
        $or: [
          { senderId: req.userId, receiverId: req.params.userId },
          { senderId: req.params.userId, receiverId: req.userId },
        ],
      })
      .sort({ timestamp: 1 });

    res.status(200).json({ messages });
  } catch (err) {
    console.error("Get message error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ================= Chat History Users =================
app.get("/chat-history-users", tokenMiddleware, async (req, res) => {
  try {
    const currentUserId = req.userId;
    const messages = await chatMessage.find({
      $or: [{ senderId: currentUserId }, { receiverId: currentUserId }],
    });

    const userMap = {};
    messages.forEach((msg) => {
      if (msg.senderId !== currentUserId)
        userMap[msg.senderId] = msg.senderName;
      if (msg.receiverId !== currentUserId)
        userMap[msg.receiverId] = msg.receiverName;
    });

    const users = Object.keys(userMap).map((id) => ({
      _id: id,
      name: userMap[id],
    }));

    res.status(200).json({ users });
  } catch (err) {
    console.error("Chat history error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ================= User Search =================
app.get("/user-search/:key", tokenMiddleware, async (req, res) => {
  try {
    const users = await Chat.find({
      _id: { $ne: req.userId },
      $or: [
        { name: { $regex: req.params.key, $options: "i" } },
        { email: { $regex: req.params.key, $options: "i" } },
      ],
    });

    res.status(200).json({ users });
  } catch (err) {
    console.error("User search error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ================= Logout =================
app.delete("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  res.status(200).json({ message: "Logged out successfully" });
});

// ✅ REQUIRED FOR VERCEL
module.exports = app;
