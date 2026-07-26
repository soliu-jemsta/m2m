import * as React from "react";
import { useLocation } from "react-router-dom";

interface GlobalTopNavProps {
    openSidebar: () => void;
    openNewCaseModal?: () => void;
    showApprovals?: () => void;
}

const GlobalTopNav: React.FC<GlobalTopNavProps> = ({
    openSidebar,
    openNewCaseModal,
    showApprovals,
}) => {
    const location = useLocation();

    const getPageTitle = () => {
        switch (location.pathname) {
            case "/":
                return {
                    title: "Dashboard",
                    subtitle: "Overview",
                };
            case "/pipeline":
                return {
                    title: "Pipeline",
                    subtitle: "Mortgage Applications",
                };
            case "/cases":
                return {
                    title: "Cases",
                    subtitle: "Manage Cases",
                };
            case "/clients":
                return {
                    title: "Clients",
                    subtitle: "Customer Directory",
                };
            case "/approvals":
                return {
                    title: "Approvals",
                    subtitle: "Pending Reviews",
                };
            case "/documents":
                return {
                    title: "Documents",
                    subtitle: "File Repository",
                };
            case "/reporting":
                return {
                    title: "Reporting",
                    subtitle: "Analytics",
                };
            case "/portal":
                return {
                    title: "Client Portal",
                    subtitle: "Portal Management",
                };
            case "/settings":
                return {
                    title: "Settings",
                    subtitle: "System Configuration",
                };
            default:
                return {
                    title: "Dashboard",
                    subtitle: "Overview",
                };
        }
    };

    const { title, subtitle } = getPageTitle();

    return (
        <header className="topbar">
            <button
                className="menu-btn"
                onClick={openSidebar}
                aria-label="Open Sidebar"
            >
                ☰
            </button>

            <div className="topbar-title">
                {title} <span>{subtitle}</span>
            </div>

            <div className="search-box">
                <span
                    style={{
                        color: "var(--muted)",
                        fontSize: "13px",
                    }}
                >
                    🔍
                </span>

                <input
                    id="searchbar"
                    type="text"
                    placeholder="Search cases, clients…"
                />
            </div>

            <button
                className="topbar-btn hidden"
                onClick={showApprovals}
            >
                ✅
                <div
                    className="notif-dot"
                    id="approvalDot"
                ></div>
            </button>

            <button className="topbar-btn hidden">
                🔔
                <div className="notif-dot"></div>
            </button>

            <button
                className="new-case-btn hidden"
                onClick={openNewCaseModal}
            >
                ＋ <span className="btn-text">New Case</span>
            </button>
        </header>
    );
};

export default GlobalTopNav;