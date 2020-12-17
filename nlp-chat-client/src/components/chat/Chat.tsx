import React, { useEffect, useState, useRef } from 'react';
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import './Chat.css';
import { Chatbox } from './chatbox/Chatbox';
import { Userslist } from './userslist/Userslist';
import { Sentiment } from './sentiment/Sentiment';

import io from "socket.io-client";

const PORT = process.env.PORT || 8000;
const URL = process.env.NODE_ENV === 'production' ? 'https://nlp-chat.herokuapp.com/' : 'http://localhost:'
// const ENDPOINT = `${URL}${PORT}`;
const ENDPOINT = process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:8000/';
console.log(ENDPOINT);

interface Props {

};

export function Chat(props: Props) {
    const [Username, setUsername] = useState("");
    const [EnteredUsername, setEnteredUsername] = useState(0);

    const [YourID, setYourID] = useState("");
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [users, setUsers] = useState([]);
    const [sentiment, setSentiment] = useState(0.5);

    const socketRef = useRef();

    useEffect(() => {

        // Make socket connection
        // @ts-ignore
        socketRef.current = io.connect(ENDPOINT, { transports: ['websocket'] });


        // Get id from server
        // @ts-ignore
        socketRef.current.on('your id', id => {
            // Get current socket connection id
            setYourID(id);
        });

        // Get messages from server
        // @ts-ignore
        socketRef.current.on('message', (message) => {
            recievedMessage(message);
        });

        // Get online users from server
        // @ts-ignore
        socketRef.current.on('get users', (users) => {
            console.log(users);
            setUsers(users);
        });

        // Get updated sentiment from server
        // @ts-ignore
        socketRef.current.on('get sentiment', (sentiment) => {
            setSentiment(sentiment);
        });

    }, []);

    useEffect(() => {

        // Once user enters the room
        if (EnteredUsername) {
            // Tell server about me
            // @ts-ignore
            socketRef.current.emit('new user', { Username: Username });
        }

    }, [EnteredUsername, Username]);

    function recievedMessage(message) {
        setMessages(oldMessages => [...oldMessages, message]);
    }

    function sendMessage(event) {
        console.log("here")
        event.preventDefault();
        const messageObject = {
            body: message,
            id: YourID,
            username: Username
        };
        setMessage("");

        // Send new chat message to server
        // @ts-ignore
        socketRef.current.emit("send message", messageObject)
    }

    return (
        <div className="main-section">


            {
                EnteredUsername

                    ?

                    <Container>
                        <h3>Welcome, {Username}!</h3>
                        <Row md={2}>
                            <Col>
                                <Userslist users={users} />
                            </Col>
                            <Col>
                                <Sentiment sentiment={sentiment} />
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Chatbox YourID={YourID} messages={messages} message={message} setMessage={setMessage} sendMessage={sendMessage} />
                            </Col>
                        </Row>
                    </Container>

                    :

                    <Container>
                        <form>
                            <Row>
                                <Col>
                                    Enter Username:
                            </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <input className="username-input" type="text" name="name" onChange={e => setUsername(e.target.value)} />
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <button className="submit-button" onClick={e => setEnteredUsername(1)}>Submit</button>
                                </Col>
                            </Row>
                        </form>
                    </Container>
            }


        </div>
    );
}