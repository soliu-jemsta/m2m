import * as React from "react";
import { Link, useLocation } from "react-router-dom";

interface GlobalSideNavProps {
    closeSidebar: () => void;
}

const GlobalSideNav: React.FC<GlobalSideNavProps> = ({ closeSidebar }) => {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;
    const navClass = (path: string) =>
        isActive(path) ? "nav-item active" : "nav-item";

    return (
        <aside className="sidebar" id="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">MD</div>

                <div>
                    <div className="logo-text">MortgageDesk</div>
                    <div className="logo-sub">CRM Platform</div>
                </div>
            </div>

            {/* Main */}
            <div className="sidebar-section-label">Main</div>

            <Link
                to="/"
                className={navClass("/")}
                onClick={closeSidebar}
            >
                <span className="nav-icon">⊞</span>
                Dashboard
            </Link>

            <Link
                to="/clients"
                className={navClass("/clients")}
                onClick={closeSidebar}
            >
                <span className="nav-icon">👤</span>
                Clients
            </Link>

            <Link
                to="/new-client"
                className={navClass("/new-client")}
                onClick={closeSidebar}
            >
                <span className="nav-icon">＋</span>
                Add Client
            </Link>

            <Link
                to="/cases"
                className={navClass("/cases")}
                onClick={closeSidebar}
            >
                <span className="nav-icon">📁</span>
                Cases
                <span className="nav-badge" id="caseBadge">
                    0
                </span>
            </Link>

            <Link
                to="/new-case"
                className={navClass("/new-case")}
                onClick={closeSidebar}
            >
                <span className="nav-icon">📝</span>
                Create Case
            </Link>

            {/* Tools */}
            <div className="sidebar-section-label">Tools</div>

            <Link
                to="/report"
                className={navClass("/report")}
                onClick={closeSidebar}
            >
                <span className="nav-icon">🌐</span>
                Report
            </Link>

            {/* System */}
            <div className="sidebar-section-label">System</div>

            <Link
                to="/settings"
                className={navClass("/settings")}
                onClick={closeSidebar}
            >
                <span className="nav-icon">⚙</span>
                Settings
            </Link>

            <div className="sidebar-footer">
                <div className="user-widget">
                    <img
                        className="avatar"
                        src=""
                        alt="Profile"
                    />

                    <div>
                        <div className="user-name" id="shortname"></div>
                        <div className="user-role" id="user-role"></div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default GlobalSideNav;