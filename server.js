// server.js
import express from "express";
import { Server } from "socket.io";
import http from "http";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // allow all origins for testing
});

// Serve a simple landing page (optional)
app.get("/", (req, res) => {
  res.send("Neurotap Socket.IO server running...");
});

// Handle connections
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Listen for messages
  socket.on("message", (msg) => {
    console.log("Received:", msg);
    // Broadcast to all clients
    io.emit("message", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
