import React from 'react';

interface Props {
    sentiment: number;
};

export function Sentiment(props: Props) {

    const { sentiment } = props

    return (
        <div className="card">
            <h2 className="invert-color">Sentiment</h2>
            <div>
                <div className="invert-color">{sentiment.toFixed(2)}</div>
            </div>
        </div>
    );
}