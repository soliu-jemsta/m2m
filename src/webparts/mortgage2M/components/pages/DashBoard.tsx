import * as React from "react";
import { Link } from "react-router-dom";
// import { NewLoader } from "../../../../Global/NewLoader";
// import { Link } from "react-router-dom";
// import ClientButton from "../../../../Global/ClientButton";
// // import { NewLoader } from "../../../../Global/NewLoader";
// import IdeaFormSkeleton from "../../../../Global/IdeaFormSkeleton";

require("dashboard");

export default class DashBoard extends React.Component<{}, {}> {
  public render(): React.ReactElement {
    return (
      <>
        {/* <NewLoader /> */}
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
                24
              </div>
              <div className="stat-sub">
                <span className="stat-delta delta-up">+3</span> this week
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                <span className="stat-label">Pipeline Value</span>
                <div className="stat-icon" style={{ background: "#f0fdfa" }}>
                  💷
                </div>
              </div>
              <div className="stat-value">£8.4M</div>
              <div className="stat-sub">
                <span className="stat-delta delta-up">+12%</span> vs last month
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                <span className="stat-label">Completions (Jun)</span>
                <div className="stat-icon" style={{ background: "#f0fdf4" }}>
                  ✅
                </div>
              </div>
              <div className="stat-value">7</div>
              <div className="stat-sub">
                <span className="stat-delta delta-up">+2</span> ahead of target
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                <span className="stat-label">Pending Approvals</span>
                <div className="stat-icon" style={{ background: "#fef2f2" }}>
                  ⏳
                </div>
              </div>
              <div className="stat-value" id="dash-approvals">
                3
              </div>
              <div className="stat-sub">
                <span className="stat-delta delta-down">Needs action</span>
              </div>
            </div>
          </div>
          <div className="two-col">
            <div>
              <div className="section-hdr">
                <h2>Recent Cases</h2>
                <Link to="cases" className="link-btn">
                  View all →
                </Link>
              </div>
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Reference</th>
                        <th>Client</th>
                        <th>Stage</th>
                        <th>Value</th>
                        <th>Approval</th>
                      </tr>
                    </thead>
                    <tbody id="dashCaseTable"></tbody>
                  </table>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div className="section-hdr">
                  <h2>Activity Feed</h2>
                </div>
                <div className="card">
                  <div className="activity-feed">
                    <div className="act-item">
                      <div
                        className="act-dot"
                        style={{ background: "#eff6ff" }}
                      >
                        📤
                      </div>
                      <div>
                        <div className="act-text">
                          <strong>James Harrington</strong> uploaded payslips
                          via portal
                        </div>
                        <div className="act-time">
                          MB-2026-000024 · 14 mins ago
                        </div>
                      </div>
                    </div>
                    <div className="act-item">
                      <div
                        className="act-dot"
                        style={{ background: "#f0fdf4" }}
                      >
                        ✅
                      </div>
                      <div>
                        <div className="act-text">
                          Mortgage offer issued —{" "}
                          <strong>NatWest · 5yr fixed 4.49%</strong>
                        </div>
                        <div className="act-time">
                          MB-2026-000023 · 1 hour ago
                        </div>
                      </div>
                    </div>
                    <div className="act-item">
                      <div
                        className="act-dot"
                        style={{ background: "#fffbeb" }}
                      >
                        ⚠️
                      </div>
                      <div>
                        <div className="act-text">
                          Outstanding bank statements —{" "}
                          <strong>chase client</strong>
                        </div>
                        <div className="act-time">
                          MB-2026-000022 · 3 hours ago
                        </div>
                      </div>
                    </div>
                    <div className="act-item">
                      <div
                        className="act-dot"
                        style={{ background: "#fdf4ff" }}
                      >
                        🏠
                      </div>
                      <div>
                        <div className="act-text">
                          Exchange confirmed — completion{" "}
                          <strong>27 Jun 2026</strong>
                        </div>
                        <div className="act-time">MB-2026-000021 · 9:15 AM</div>
                      </div>
                    </div>
                    <div className="act-item">
                      <div
                        className="act-dot"
                        style={{ background: "#f0fdfa" }}
                      >
                        🔔
                      </div>
                      <div>
                        <div className="act-text">
                          <strong>3 cases</strong> awaiting approval action
                        </div>
                        <div className="act-time">Compliance Team · Today</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden">
                <div className="section-hdr">
                  <h2>Completions — 2026</h2>
                </div>
                <div className="card">
                  <div className="bar-chart">
                    <div className="bar-wrap">
                      <div
                        className="bar"
                        style={{ background: "var(--accent)", height: "35%" }}
                      />
                      <div className="bar-label">Jan</div>
                    </div>
                    <div className="bar-wrap">
                      <div
                        className="bar"
                        style={{ background: "var(--accent)", height: "50%" }}
                      />
                      <div className="bar-label">Feb</div>
                    </div>
                    <div className="bar-wrap">
                      <div
                        className="bar"
                        style={{ background: "var(--accent)", height: "40%" }}
                      />
                      <div className="bar-label">Mar</div>
                    </div>
                    <div className="bar-wrap">
                      <div
                        className="bar"
                        style={{ background: "var(--accent)", height: "65%" }}
                      />
                      <div className="bar-label">Apr</div>
                    </div>
                    <div className="bar-wrap">
                      <div
                        className="bar"
                        style={{ background: "var(--accent)", height: "80%" }}
                      />
                      <div className="bar-label">May</div>
                    </div>
                    <div className="bar-wrap">
                      <div
                        className="bar"
                        style={{
                          background: "linear-gradient(180deg,#0ea5e9,#2563eb)",
                          height: "58%",
                          boxShadow: "0 4px 12px rgba(37,99,235,0.4)",
                        }}
                      />
                      <div
                        className="bar-label"
                        style={{ color: "var(--accent)", fontWeight: 700 }}
                      >
                        Jun
                      </div>
                    </div>
                    <div className="bar-wrap">
                      <div
                        className="bar"
                        style={{ background: "var(--border)", height: "20%" }}
                      />
                      <div className="bar-label">Jul</div>
                    </div>
                    <div className="bar-wrap">
                      <div
                        className="bar"
                        style={{ background: "var(--border)", height: "20%" }}
                      />
                      <div className="bar-label">Aug</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="section-hdr">
            <h2>Tasks Due Today</h2>
            <button className="link-btn">
              View all →
            </button>
          </div>
          <div className="card" id="dashTasks" />
        </div>
      </>
    );
  }

  public componentDidMount(): void {
    window.loadDashBoardComponent();
  }
}
