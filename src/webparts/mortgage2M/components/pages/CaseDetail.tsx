import * as React from "react";

require("casedetail");
require("caseTaskService");
require("caseStageUI");
require("taskTemplate");

export default class CaseDetail extends React.Component<{}, {}> {
  public render(): React.ReactElement {
    return (
      <div
        id="caseDetailRoot"
        data-case-id=""
        data-case-list-id=""
        data-app-type=""
        data-client=""
        data-adviser=""
        data-current-stage=""
        data-completed-stages=""
      >
        <div className="section-hdr" style={{ marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 16 }}>
              <span id="caseHeaderRef" className="case-ref" />
            </h2>
            <p style={{ fontSize: 12.5, color: "var(--muted)" }}>
              <span id="caseHeaderClient" /> · Stage:{" "}
              <span id="caseHeaderStage" />
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <a href="#/cases" className="btn btn-secondary btn-sm">
              Back to Cases
            </a>
          </div>
        </div>

        <div className="case-lifecycle-panel">
          <div className="lifecycle-header">
            <div>
              <h3 className="stage-checklist-title">Case lifecycle</h3>
              <p className="stage-checklist-hint">
                Mark any stage as complete. Once checked, it stays done.
              </p>
            </div>
            <div className="lifecycle-progress-meta">
              <span id="lifecycleProgressLabel" className="lifecycle-progress-label">—</span>
            </div>
          </div>
          <div className="lifecycle-progress-track" aria-hidden="true">
            <div id="lifecycleProgressBar" className="lifecycle-progress-bar" style={{ width: "0%" }} />
          </div>
          <div id="caseKanbanBoard" className="stage-checklist" />
        </div>
      </div>
    );
  }

  public componentDidMount(): void {
    (window as any).loadCaseDetailComponent();
  }
}