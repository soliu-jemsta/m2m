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

            {/* Tools */}
            <div className="sidebar-section-label">Tools</div>

            {/* <Link
                to="/approvals"
                className={navClass("/approvals")}
                onClick={closeSidebar}
            >
                <span className="nav-icon">✅</span>
                Approvals
                <span className="nav-badge warn" id="approvalBadge">
                    3
                </span>
            </Link>

            <Link
                to="/documents"
                className={navClass("/documents")}
                onClick={closeSidebar}
            >
                <span className="nav-icon">📄</span>
                Documents
            </Link>

            <Link
                to="/reporting"
                className={navClass("/reporting")}
                onClick={closeSidebar}
            >
                <span className="nav-icon">📊</span>
                Reporting
            </Link> */}

            <Link
                to="/report"
                className={navClass("/portal")}
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
                    {/* Replace with your existing avatar if desired */}
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