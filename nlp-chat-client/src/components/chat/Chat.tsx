import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import './Chat.css';
import { Chatbox } from './chatbox/Chatbox';
import { Userslist } from './userslist/Userslist';
import { Sentiment } from './sentiment/Sentiment';


interface Props {

};

export function Chat(props: Props) {
    const [Username, setUsername] = useState("");
    const [EnteredUsername, setEnteredUsername] = useState(0);



    return (
        <div className="main-section">


            {
                EnteredUsername ?
                    <Container>
                        <h3>Welcome, {Username}!</h3>
                        <Row md={2}>
                            <Col>
                                <Userslist />
                            </Col>
                            <Col>
                                <Sentiment />
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Chatbox />
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