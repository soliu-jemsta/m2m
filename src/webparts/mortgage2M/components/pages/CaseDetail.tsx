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
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                const root = document.getElementById("caseDetailRoot");
                const caseId = root && root.getAttribute("data-case-id");
                const stage =
                  (root && root.getAttribute("data-current-stage")) || "Lead";
                if (caseId && (window as any).CaseStageUI) {
                  (window as any).CaseStageUI.openNewTaskModal(caseId, stage);
                }
              }}
            >
              + New Task
            </button>
            <a href="#/cases" className="btn btn-secondary btn-sm">
              Back to Cases
            </a>
          </div>
        </div>

        <div id="caseKanbanBoard" className="kanban-board" />
      </div>
    );
  }

  public componentDidMount(): void {
    (window as any).loadCaseDetailComponent();
  }
}
