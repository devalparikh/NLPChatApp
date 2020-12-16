import { send } from 'process';
import React from 'react';
import './Chatbox.css';

interface Props {
    YourID: any;
    messages: Array<any>;
    message: string;
    setMessage: (message: string) => void;
    sendMessage: (any) => void;
};

export function Chatbox(props: Props) {

    const { YourID, messages, message, setMessage, sendMessage } = props

    return (



        <div className="chat-card card">

            {/* Chat log */}
            <h2 className="invert-color">Chat</h2>
            <div className="scrollable chat-box">
                {
                    messages.length > 0

                        ?

                        messages.map((cur_message, index) => {

                            if (cur_message.id === YourID) {
                                return (
                                    <div key={index} className="message me">
                                        {cur_message.body}
                                        {cur_message.tone !== '' ? <div className="tone-bubble">{cur_message.tone}</div> : <div></div>}
                                    </div>
                                );
                            } else {
                                return (
                                    <div key={index} className="message you">
                                        {cur_message.username}: {cur_message.body}
                                        {cur_message.tone !== '' ? <div className="tone-bubble">{cur_message.tone}</div> : <div></div>}
                                    </div>
                                );
                            }

                        })

                        :

                        <div>No messages yet.</div>

                }

            </div>

            {/* New chat message */}
            <div>
                <form className="invert-color">
                    <input className="chat-input" placeholder="Enter chat message here" value={message} onChange={event => setMessage(event.target.value)}></input>
                    <button className="submit-button" onClick={event => sendMessage(event)}>Send</button>
                </form>
            </div>
        </div>
    );
}