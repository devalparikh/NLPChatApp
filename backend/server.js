const http = require("http");
const express = require("express");
const socket = require("socket.io");
var cors = require('cors')
const path = require('path');

// Configure env vars in env file
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10kb' })); // Parse JSON

const port = process.env.PORT || 8000;
const server = http.createServer(app);
const io = socket(server);

users = []
ids = []
connections = []

io.on("connection", socket => {

    connections.push(socket);
    console.log('Connected: %s sockets connected', connections.length)


    // Send client their id
    socket.emit("your id", socket.id);
    ids.push(socket.id);

    // New user
    socket.on('new user', body => {
        socket.username = body.Username;
        users.push(socket.username);
        updateUsernames();
    });

    // Client send message, emit server
    socket.on("send message", body => {

        // Send to all clients (using io, not socket)
        io.emit("message", body);
    });

    // Client disconnect
    socket.on('disconnect', body => {
        users.splice(users.indexOf(socket.username), 1);
        updateUsernames();
        connections.splice(connections.indexOf(socket), 1);
        console.log('Disconnected: %s sockets connected', connections.length);
    });

    // Update list of users
    function updateUsernames() {
        io.sockets.emit('get users', users);
    }

});

app.use(express.static('../nlp-chat-client/build'));
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../nlp-chat-client/build', 'index.html'));
})

// Serve static assets in production (client)
if (process.env.NODE_ENV === 'production') {
    // Set static folder
    app.use(express.static('../nlp-chat-client/build'));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../nlp-chat-client/build', 'index.html'));
    })
}

server.listen(port, () => console.log(`server is running on port ${port}`));