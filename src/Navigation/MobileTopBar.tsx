import * as React from "react";

interface MobileTopBarProps {
    openSidebar: () => void;
}

const MobileTopBar: React.FC<MobileTopBarProps> = ({ openSidebar }) => {

    return (
            <div className="topbar">
                <button onClick={openSidebar} className="burger" aria-label="Toggle menu">
                    <span /><span /><span />
                </button>
                <span className="topbar-logo">Jemsta Staff Hub</span>
                {/* <div className="topbar-avatar">JD</div> */}
                <img className="topbar-avatar" src="" alt="pp" />
            </div>

    );
};

export default MobileTopBar;