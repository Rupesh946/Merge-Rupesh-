const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");

let io;
let onlineUsers = [];

const addNewUser = (userId, socketId) => {
  if (!onlineUsers.some((user) => user.userId === userId)) {
    onlineUsers.push({ userId, socketId });
    console.log(`User ${userId} added to online users`);
  }
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
  console.log(`User with socket ${socketId} removed from online users`);
};

const getUser = (userId) => {
  return onlineUsers.find((user) => user.userId === userId);
};

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const cookies = socket.handshake.headers.cookie;
    if (cookies) {
      const parsedCookies = cookie.parse(cookies);
      const token = parsedCookies.auth_token;
      if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
          if (err) {
            console.error("Socket authentication error:", err.message);
            return next(new Error("Authentication error"));
          }
          socket.user = user;
          console.log(`Socket authenticated for user ${user.userId}`);
          next();
        });
      } else {
        console.error("Socket authentication error: auth_token not found");
        next(new Error("Authentication error"));
      }
    } else {
      console.error("Socket authentication error: no cookies found");
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`A user connected with socket id ${socket.id}`);
    if (socket.user) {
      addNewUser(socket.user.userId, socket.id);
    }

    socket.on("disconnect", () => {
      console.log(`User with socket id ${socket.id} disconnected`);
      removeUser(socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}

module.exports = { initSocket, getIO, getUser };
