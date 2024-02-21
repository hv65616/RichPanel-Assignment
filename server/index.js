const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors"); // Import cors package
const authRoutes = require("./routes/authRoutes");
const path = require("path");

const WebSocket = require("ws"); // Import WebSocket package

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/userAuthDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

const __dirname = path.resolve();

app.use(bodyParser.json());
app.use(cors());
app.use(authRoutes);
app.use(express.static(path.join(__dirname + "/client/dist")));
app.get("*",(req,res)=>{
  res.sendFile(path.join(__dirname,'client','dist','index.html'))
})

// Create a WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  // Handle incoming messages
  ws.on("message", (message) => {
    console.log("Received message:", message);
    // Broadcast the message to all clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

// Upgrade HTTP server to handle WebSocket requests
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Attach WebSocket server to the HTTP server
server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
