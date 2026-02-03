import React from 'react'
import { Rnd } from 'react-rnd'
import "./MacWindow.scss"
const MacWindow = ({ children, width= "40vw" , height= "40vh" , x = "100" , y= "200" }) => {
    return (
        <Rnd
            default={{
                width,
                height,
                x,
                y
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
