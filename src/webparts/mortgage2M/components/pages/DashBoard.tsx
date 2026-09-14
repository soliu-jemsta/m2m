import * as React from "react";
import { Link } from "react-router-dom";

require("dashboard");

export default class DashBoard extends React.Component<{}, {}> {
  public render(): React.ReactElement {
    return (
      <>
        <div className="view active" id="view-dashboard">
          <div className="stat-row">
            <div className="stat-card">
              <div className="stat-top">
                <span className="stat-label">Active Cases</span>
                <div className="stat-icon" style={{ background: "#eff6ff" }}>
                  📁
                </div>
              </div>
              <div className="stat-value" id="dash-active">
                —
              </div>
              {/* <div className="stat-sub">
                <span className="stat-delta" id="dash-active-delta">
                  Status = Open
                </span>
              </div> */}
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span className="stat-label">Completed</span>
                <div className="stat-icon" style={{ background: "#f0fdf4" }}>
                  ✅
                </div>
              </div>
              <div className="stat-value" id="dash-completed">
                —
              </div>
              {/* <div className="stat-sub">
                <span className="stat-delta">Status = Completed</span>
              </div> */}
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span className="stat-label">Closed Cases</span>
                <div className="stat-icon" style={{ background: "#fef2f2" }}>
                  🔒
                </div>
              </div>
              <div className="stat-value" id="dash-closed">
                —
              </div>
              {/* <div className="stat-sub">
                <span className="stat-delta">Status = Case Closed</span>
              </div> */}
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span className="stat-label">Pending Tasks</span>
                <div className="stat-icon" style={{ background: "#fffbeb" }}>
                  ⏳
                </div>
              </div>
              <div className="stat-value" id="dash-pending-tasks">
                —
              </div>
              <div className="stat-sub">
                <span
                  className="stat-delta delta-up"
                  id="dash-pending-badge"
                  style={{ color: "var(--red, #dc2626)" }}
                />
              </div>
            </div>
          </div>

          {/* Original layout class: Recent Cases | Activity Feed side-by-side */}
          <div className="two-col">
            <div>
              <div className="section-hdr">
                <h2>Recent Cases</h2>
                <Link to="/cases" className="link-btn">
                  View all →
                </Link>
              </div>
              <div className="card">
                <p
                  className="norequest"
                  style={{ display: "none", padding: 16 }}
                >
                  No cases found.
                </p>
                <div className="threport table-scroll">
                  <table className="data-table" id="tasktable">
                    <thead>
                      <tr>
                        <th>S/N</th>
                        <th>Reference</th>
                        <th>Client(s)</th>
                        <th>Adviser</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody id="speed-data-table" />
                  </table>
                </div>
              </div>
            </div>

            <div>
              <div className="section-hdr">
                <h2>Activity Feed</h2>
              </div>
              <div className="card" id="dash-activity-feed">
                <div className="act-item">
                  <div className="act-text" style={{ color: "var(--muted)" }}>
                    Loading activity…
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  public componentDidMount(): void {
    (window as any).loadDashBoardComponent();
  }
}