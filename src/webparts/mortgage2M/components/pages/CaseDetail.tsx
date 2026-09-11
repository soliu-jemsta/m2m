import * as React from "react";
import ClientButton from "../../../../Global/ClientButton";

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
              <span id="caseHeaderClient" /> · Stage: <span id="caseHeaderStage" />
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select id="case_next_stage" />
            <ClientButton clax="btn btn-primary btn-sm" func="CaseDetailComponent.advanceStage">
              Advance Stage
            </ClientButton>
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
    window.loadCaseDetailComponent();
  }
}