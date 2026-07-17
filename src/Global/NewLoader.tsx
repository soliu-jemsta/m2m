import * as React from "react";


export const NewLoader = ({ text = "Please wait..." }) => {
    return (
        <div id="loader-overlay">
            <div className="loader-box">
                <div className="spinner"></div>
                <p>{text}</p>
            </div>
        </div>
    );
};