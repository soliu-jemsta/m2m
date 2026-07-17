import * as React from "react";
// import { Link } from "react-router-dom";
// import { NewLoader } from "../../../../Global/NewLoader";
// import { Link } from "react-router-dom";
// import ClientButton from "../../../../Global/ClientButton";
// // import { NewLoader } from "../../../../Global/NewLoader";
// import IdeaFormSkeleton from "../../../../Global/IdeaFormSkeleton";

require("caseapproval");

export default class CaseApproval extends React.Component<{}, {}> {
  public render(): React.ReactElement {
    return (
      <>
        <div className="view active" id="view-casedetail">
          <a href="#/cases"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
              cursor: "pointer",
              color: "var(--muted)",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            ← Back to Cases
          </a>
          <div id="caseDetailContent">
            <div className="case-detail-header">
              <div className="cdh-top">
                <div>
                  <div className="cdh-ref">MB-2026-000018</div>
                  <div className="cdh-name">Karl &amp; Beth Moore</div>
                  <div className="cdh-sub">
                    11 Poplar Lane, Edinburgh, EH1 1BB
                  </div>
                </div>
                <div className="cdh-actions">
                  <span className="pill pill-aip">AIP</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 9px",
                      borderRadius: 10,
                      background: "#fef2f2",
                      color: "#dc2626",
                    }}
                  >
                    ❌Rejected
                  </span>
                  <button
                    className="btn btn-primary btn-sm"
                  >
                    Take Action
                  </button>
                </div>
              </div>
              <div className="cdh-meta">
                <div className="cdh-field">
                  <span className="lbl">Lender</span>
                  <span className="val">Barclays</span>
                </div>
                <div className="cdh-field">
                  <span className="lbl">Loan Amount</span>
                  <span className="val">£364,000</span>
                </div>
                <div className="cdh-field">
                  <span className="lbl">Purchase Price</span>
                  <span className="val">£520,000</span>
                </div>
                <div className="cdh-field">
                  <span className="lbl">LTV</span>
                  <span className="val">70%</span>
                </div>
                <div className="cdh-field">
                  <span className="lbl">Product</span>
                  <span className="val">TBD</span>
                </div>
                <div className="cdh-field">
                  <span className="lbl">Adviser</span>
                  <span className="val">P. Okafor</span>
                </div>
                <div className="cdh-field">
                  <span className="lbl">Case Manager</span>
                  <span className="val">P. Okafor</span>
                </div>
              </div>
            </div>
            <div className="section-hdr" style={{ marginBottom: 12 }}>
              <h2>Approval Track</h2>
              <button
                className="btn btn-primary btn-sm"
              >
                Action Approval →
              </button>
            </div>
            <div
              className="card"
              style={{ marginBottom: 16, padding: "18px 20px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    AIP Review
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginTop: 2,
                    }}
                  >
                    Barclays · £364,000 · LTV 70%
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 9px",
                    borderRadius: 10,
                    background: "#fef2f2",
                    color: "#dc2626",
                  }}
                >
                  ❌Rejected
                </span>
              </div>
              <div className="approval-steps">
                <div className="appr-step">
                  <div className="appr-circle approved">✓</div>
                  <div className="appr-label done-label">Adviser</div>
                  <div className="appr-by">P. Okafor</div>
                  <div className="appr-by">30 May</div>
                </div>
                <div className="appr-line done" />
                <div className="appr-step">
                  <div className="appr-circle rejected">✕</div>
                  <div className="appr-label ">Compliance</div>
                  <div className="appr-by">—</div>
                  <div className="appr-by">01 Jun</div>
                </div>
                <div className="appr-line " />
                <div className="appr-step">
                  <div className="appr-circle waiting">3</div>
                  <div className="appr-label ">Case Mgr</div>
                  <div className="appr-by">—</div>
                </div>
                <div className="appr-line " />
                <div className="appr-step">
                  <div className="appr-circle waiting">4</div>
                  <div className="appr-label ">Management</div>
                  <div className="appr-by">—</div>
                </div>
              </div>
            </div>
            <div className="two-col">
              <div>
                <div className="section-hdr">
                  <h2>Case Timeline</h2>
                </div>
                <div className="card">
                  <div className="timeline">
                    <div className="tl-item">
                      <div className="tl-dot" style={{ background: "#f0fdf4" }}>
                        ✅
                      </div>
                      <div>
                        <div className="tl-title">Fact Find Completed</div>
                        <div className="tl-sub">
                          Full fact find completed with all applicants. Income
                          and employment verified.
                        </div>
                        <div className="tl-time">14 May 2026 · S. Atkins</div>
                      </div>
                    </div>
                    <div className="tl-item">
                      <div className="tl-dot" style={{ background: "#eff6ff" }}>
                        🏦
                      </div>
                      <div>
                        <div className="tl-title">
                          Agreement in Principle Obtained
                        </div>
                        <div className="tl-sub">
                          AIP issued by Barclays. Valid for 90 days.
                        </div>
                        <div className="tl-time">17 May 2026 · P. Okafor</div>
                      </div>
                    </div>
                    <div className="tl-item">
                      <div className="tl-dot" style={{ background: "#f0fdf4" }}>
                        📋
                      </div>
                      <div>
                        <div className="tl-title">
                          Full Application Submitted
                        </div>
                        <div className="tl-sub">
                          Application submitted to Barclays with all supporting
                          documents.
                        </div>
                        <div className="tl-time">26 May 2026 · P. Okafor</div>
                      </div>
                    </div>
                    <div className="tl-item">
                      <div className="tl-dot" style={{ background: "#fffbeb" }}>
                        🔍
                      </div>
                      <div>
                        <div className="tl-title">Valuation Instructed</div>
                        <div className="tl-sub">
                          Barclays instructed valuer. Desktop valuation
                          requested.
                        </div>
                        <div className="tl-time">29 May 2026 · P. Okafor</div>
                      </div>
                    </div>
                    <div className="tl-item">
                      <div className="tl-dot" style={{ background: "#fffbeb" }}>
                        ⏳
                      </div>
                      <div>
                        <div className="tl-title">Underwriting In Progress</div>
                        <div className="tl-sub">
                          Case assigned to underwriting team. Awaiting decision.
                        </div>
                        <div className="tl-time">03 Jun 2026 · Auto</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div>
                  <div className="section-hdr">
                    <h2>Open Tasks</h2>
                  </div>
                  <div className="card">
                    <div className="task-item">
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>
                        No tasks for this case.
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="section-hdr">
                    <h2>Messages</h2>
                  </div>
                  <div className="card" style={{ padding: 0 }}>
                    <div className="msg-area">
                      <div className="msg-bubble">
                        <div className="msg-text">
                          Hi, checking on the valuation — any news?
                        </div>
                        <div className="msg-time">James H. · 10:42 AM</div>
                      </div>
                      <div className="msg-bubble sent">
                        <div className="msg-text">
                          Valuation instructed — expected within 5 working days
                          😊
                        </div>
                        <div className="msg-time">S. Atkins · 11:08 AM</div>
                      </div>
                    </div>
                    <div className="msg-input-row">
                      <input
                        className="msg-input"
                        id="detailMsg"
                        placeholder="Type a message…"
                      />
                      <button
                        className="msg-send"
                      >
                        Send
                      </button>
                    </div>
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
    window.loadCaseApprovalComponent();
  }
}
