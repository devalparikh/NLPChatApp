import React from 'react';

interface Props {
    users: Array<any>;
};

export function Userslist(props: Props) {

    const { users } = props;
    return (
        <div className="card">
            <h2 className="invert-color">Users</h2>
            <div className="scrollable">
                {users.map((cur_user, index) => {
                    return (<div key={index} className="invert-color">{cur_user}</div>);
                })}
            </div>
        </div>
    );
}