import * as React from "react";
// import { Link } from "react-router-dom";
// import { NewLoader } from "../../../../Global/NewLoader";
// import { Link } from "react-router-dom";
// import ClientButton from "../../../../Global/ClientButton";
// // import { NewLoader } from "../../../../Global/NewLoader";
// import IdeaFormSkeleton from "../../../../Global/IdeaFormSkeleton";

require("report");

export default class Report extends React.Component<{}, {}> {
  public render(): React.ReactElement {
    return (
      <>
        <div className="view active" id="view-reporting">
          <div className="section-hdr" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16 }}>Reporting &amp; Analytics</h2>
            <div className="filter-tabs">
              <div className="ft active">June 2026</div>
              <div className="ft">Q2</div>
              <div className="ft">YTD</div>
            </div>
          </div>
          <div className="report-grid">
            <div className="metric-card">
              <div className="mc-label">Total Pipeline Value</div>
              <div className="mc-value">£8.4M</div>
              <div className="mc-bar-wrap">
                <div
                  className="mc-bar"
                  style={{ background: "var(--accent)", width: "70%" }}
                />
              </div>
              <div className="mc-foot">70% of monthly target (£12M)</div>
            </div>
            <div className="metric-card">
              <div className="mc-label">Conversion Rate</div>
              <div className="mc-value">68%</div>
              <div className="mc-bar-wrap">
                <div
                  className="mc-bar"
                  style={{ background: "var(--teal)", width: "68%" }}
                />
              </div>
              <div className="mc-foot">+5% vs May 2026</div>
            </div>
            <div className="metric-card">
              <div className="mc-label">Avg. Completion Time</div>
              <div className="mc-value">74 days</div>
              <div className="mc-bar-wrap">
                <div
                  className="mc-bar"
                  style={{ background: "var(--amber)", width: "55%" }}
                />
              </div>
              <div className="mc-foot">Target: 65 days</div>
            </div>
          </div>
          <div className="section-hdr" style={{ marginBottom: 12 }}>
            <h2>Adviser Performance</h2>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Adviser</th>
                    <th>Active Cases</th>
                    <th>Completions</th>
                    <th>Pipeline Value</th>
                    <th>Conversion</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        className="av-avatar"
                        style={{
                          background: "linear-gradient(135deg,#2563eb,#7c3aed)",
                        }}
                      >
                        SA
                      </div>
                      S. Atkins
                    </td>
                    <td>9</td>
                    <td>3</td>
                    <td>£3.2M</td>
                    <td>72%</td>
                    <td>
                      <div className="progress-mini">
                        <div
                          className="progress-mini-bar"
                          style={{ width: "72%" }}
                        />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        className="av-avatar"
                        style={{
                          background: "linear-gradient(135deg,#0d9488,#0ea5e9)",
                        }}
                      >
                        DC
                      </div>
                      D. Chen
                    </td>
                    <td>8</td>
                    <td>2</td>
                    <td>£2.8M</td>
                    <td>65%</td>
                    <td>
                      <div className="progress-mini">
                        <div
                          className="progress-mini-bar"
                          style={{ width: "65%" }}
                        />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        className="av-avatar"
                        style={{
                          background: "linear-gradient(135deg,#d97706,#dc2626)",
                        }}
                      >
                        PO
                      </div>
                      P. Okafor
                    </td>
                    <td>7</td>
                    <td>2</td>
                    <td>£2.4M</td>
                    <td>68%</td>
                    <td>
                      <div className="progress-mini">
                        <div
                          className="progress-mini-bar"
                          style={{ width: "68%" }}
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
    );
  }

  public componentDidMount(): void {
    window.loadReportComponent();
  }
}
