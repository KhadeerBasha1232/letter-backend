require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const letterRoutes = require("./routes/letterRoutes");
const Letter = require("./models/Letter");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/letters", letterRoutes);

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("joinLetter", async (letterId) => {
    socket.join(letterId);
    console.log(`User joined letter: ${letterId}`);

    const letter = await Letter.findById(letterId);
    if (letter) {
      socket.emit("latestContent", letter.content);
    }
  });

  socket.on("requestLatestContent", async (letterId) => {
    const letter = await Letter.findById(letterId);
    if (letter) {
      socket.emit("latestContent", letter.content);
    }
  });

  socket.on("updateLetter", async ({ letterId, content }) => {
    await Letter.findByIdAndUpdate(letterId, { content });

    io.to(letterId).emit("receiveUpdate", content);
  });

  socket.on("leaveLetter", (letterId) => {
    socket.leave(letterId);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
