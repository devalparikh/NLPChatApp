const http = require("http");
const express = require("express");
const socket = require("socket.io");
var cors = require('cors')
const path = require('path');
const fetch = require("node-fetch");

// Configure env vars in env file
require('dotenv').config();


/////////////////////
//    IBM Cloud    //
/////////////////////

const ToneAnalyzerV3 = require('ibm-watson/tone-analyzer/v3');
const { IamAuthenticator } = require('ibm-watson/auth');

const toneAnalyzer = new ToneAnalyzerV3({
    version: '2017-09-21',
    authenticator: new IamAuthenticator({
        apikey: process.env.IBM_APIKEY,
    }),
    serviceUrl: process.env.IBM_URL,
});


//////////////////////////////
//    Tensorflow-js Node    //
//////////////////////////////

const tf = require("@tensorflow/tfjs");

const getMetaData = async () => {
    const metadata = await fetch('https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/metadata.json');
    return metadata.json();
};

const padSequences = (sequences, metadata) => {
    return sequences.map(seq => {
        if (seq.length > metadata.max_len) {
            seq.splice(0, seq.length - metadata.max_len);
        }
        if (seq.length < metadata.max_len) {
            const pad = [];
            for (let i = 0; i < metadata.max_len - seq.length; ++i) {
                pad.push(0);
            }
            seq = pad.concat(seq);
        }
        return seq;
    });
};

const loadModel = async () => {
    const url = `https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/model.json`;
    const model = await tf.loadLayersModel(url);
    return model;
};

const predict = async (text) => {
    const model = await loadModel();
    const metadata = await getMetaData();

    const trimmed = text.trim().toLowerCase().replace(/(\.|\,|\!)/g, '').split(' ');
    const sequence = trimmed.map(word => {

        const wordIndex = metadata.word_index[word];
        if (typeof wordIndex === 'undefined') {
            return 2; //oov_index
        }

        return wordIndex + metadata.index_from;
    });
    const paddedSequence = padSequences([sequence], metadata);
    const input = tf.tensor2d(paddedSequence, [1, metadata.max_len]);

    const predictOut = model.predict(input);
    const score = predictOut.dataSync()[0];
    predictOut.dispose();
    return score;
};

//////////////////
//    Socket    //
//////////////////

const app = express();

app.use(cors());
app.use(express.json({ limit: '10kb' })); // Parse JSON

const port = process.env.PORT || 8000;
const server = http.createServer(app);
const io = socket(server);

users = [];
ids = [];
connections = [];
total_sentiment_score = 0;
message_count = 0;

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
        getTone(message.body)
            .then(tone => {
                message.tone = tone;
                // Send to all clients (using io, not socket)
                io.emit("message", message);
            });

        // FUTURE: Could asyncronously send message and make ML prediction, 
        // then tag along predicted tone using UUID mapping of message

        updateSentiment(message.body);
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

    // Get tone of message
    let getTone = async (input_text) => {
        let tone = '';

        // Get tone using IBM Cloud Tone Analyzer API  
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

    // Get sentiment of message
    let updateSentiment = async (input_text) => {
        message_count++;
        predict(input_text)
            .then(sentiment => {
                total_sentiment_score += sentiment;
                console.log('total sentiment:', total_sentiment_score / message_count);
                io.sockets.emit('get sentiment', total_sentiment_score / message_count);
            })
            .catch(err => {
                console.log('error:', err);
            });
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

