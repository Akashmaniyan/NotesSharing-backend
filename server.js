import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const NOTES_FILE = "./notes.json";

// Helper functions
function readNotes() {
  try {
    const data = fs.readFileSync(NOTES_FILE, "utf8");
    return JSON.parse(data || "{}");
  } catch {
    return {};
  }
}

function saveNotes(data) {
  fs.writeFileSync(NOTES_FILE, JSON.stringify(data, null, 2));
}

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);

    const notesData = readNotes();
    socket.emit("existing_notes", notesData[roomId] || []);
  });

  socket.on("send_note", ({ roomId, note }) => {
    const notesData = readNotes();
    if (!notesData[roomId]) notesData[roomId] = [];
    notesData[roomId].push(note);
    saveNotes(notesData);

    io.to(roomId).emit("receive_note", note);
  });

  socket.on("delete_note", ({ roomId, index }) => {
    const notesData = readNotes();
    if (!notesData[roomId]) return;

    notesData[roomId].splice(index, 1);
    saveNotes(notesData);

    io.to(roomId).emit("update_notes", notesData[roomId]);
  });

  socket.on("clear_notes", (roomId) => {
    const notesData = readNotes();
    notesData[roomId] = [];
    saveNotes(notesData);
    io.to(roomId).emit("update_notes", []);
  });

  socket.on("disconnect", () => console.log("Socket disconnected:", socket.id));
});

app.get("/", (req, res) => res.send({ ok: true }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
