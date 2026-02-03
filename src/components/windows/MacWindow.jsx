import React from 'react'
import { Rnd } from 'react-rnd'
import "./MacWindow.scss"
const MacWindow = ({ children }) => {
    return (
        <Rnd
            default={{
                width: "40vw",
                height: "50vh",
                x: 100,
                y: 200
            }}
        >
            <div className="window">
                <div className="nav">
                    <div className="dots">
                        <div className="dot red"></div>
                        <div className="dot yellow"></div>
                        <div className="dot green"></div>
                    </div>
                    <div className="tittle">
                        <p>DakshChauhan</p>
                    </div>
                </div>
                <div className="main-content">
                    {children}
                </div>
            </div>
        </Rnd>
    )
}

export default MacWindow
