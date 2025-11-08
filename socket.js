// api/socket.js
import { Server } from "socket.io";

let io; // memoized instance

export default function handler(req, res) {
  if (!io) {
    io = new Server(res.socket.server, {
      path: "/api/socket",
      cors: { origin: "*" } // allow all origins during testing
    });

    console.log("Socket.IO server initialized");

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      // Listen for messages from clients
      socket.on("message", (msg) => {
        console.log("Received:", msg);
        io.emit("message", msg); // broadcast to all clients
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });
  }
  res.end();
}
