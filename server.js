// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// create http server and socket.io server
const server = http.createServer(app);

// allow all origins or narrow to your frontend later
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // when a client sends a note, broadcast to everyone else
  socket.on("send_note", (note) => {
    // broadcast to all connected clients (including sender if you want)
    io.emit("receive_note", note);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// simple health check
app.get("/", (req, res) => res.send({ ok: true }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
