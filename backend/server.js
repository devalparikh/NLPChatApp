const http = require("http");
const express = require("express");
const socket = require("socket.io");
var cors = require('cors')
const path = require('path');
// Configure env vars in env file
require('dotenv').config();

// IBM Cloud
const ToneAnalyzerV3 = require('ibm-watson/tone-analyzer/v3');
const { IamAuthenticator } = require('ibm-watson/auth');

const toneAnalyzer = new ToneAnalyzerV3({
    version: '2017-09-21',
    authenticator: new IamAuthenticator({
        apikey: process.env.IBM_APIKEY,
    }),
    serviceUrl: process.env.IBM_URL,
});

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
    socket.on("send message", message => {
        getSentiment(message.body)
            .then(tone => {
                message.tone = tone;

                // Send to all clients (using io, not socket)
                io.emit("message", message);
            });
            // FUTURE: Could asyncronously send message and make ML prediction, 
            // then tag along predicted tone using UUID mapping of message
    });

    // Client disconnect
    socket.on('disconnect', body => {
        users.splice(users.indexOf(socket.username), 1);
        updateUsernames();
        connections.splice(connections.indexOf(socket), 1);
        console.log('Disconnected: %s sockets connected', connections.length);
    });

    // Update list of users
    let updateUsernames = async () => {
        io.sockets.emit('get users', users);
    }

    let getSentiment = async (input_text) => {
        let tone = '';

        // Get sentiment using IBM Cloud Tone Analyzer API  
        const toneParams = {
            toneInput: { 'text': input_text },
            contentType: 'application/json',
        };

        await toneAnalyzer.tone(toneParams)
            .then(toneAnalysis => {
                console.log(JSON.stringify(toneAnalysis, null, 2));
                tone = toneAnalysis.result.document_tone.tones[0].tone_name || '';
            })
            .catch(err => {
                console.log('error:', err);
            });
        return tone;
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

