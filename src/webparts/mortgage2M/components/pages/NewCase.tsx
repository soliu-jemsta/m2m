import * as React from "react";
import ClientButton from "../../../../Global/ClientButton";

require("newcase");
require("newclient"); // ClientFormUtils, nationality, address helpers

/**
 * Create Case
 * 1) Select one or more clients → editable basic info per client
 * 2) Category → Type
 * 3) Type-specific fields (placeholder until defined)
 */
export default class NewCase extends React.Component<{}, {}> {
  public render(): React.ReactElement {
    return (
      <>
        <div className="form-page client-intake-page create-case-page">
          <div className="page-header">
            <div>
              <h1>Create case</h1>
              <p>
                Select one or more clients, confirm their details, then choose
                category and type
              </p>
            </div>
          </div>

          <div className="form-container">
            {/* ── Client selection ── */}
            <div className="form-section">
              <div className="form-section-title">Clients</div>
              <p className="client-type-hint">
                Add one or more clients (e.g. joint applicants). Each person&apos;s
                basic details can be reviewed and updated below.
              </p>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="caseClientSearch">
                    Search by name or email <span className="req">*</span>
                  </label>
                  <input
                    type="search"
                    id="caseClientSearch"
                    placeholder="Start typing name or email…"
                    autoComplete="off"
                  />
                  <div id="caseClientResults" className="client-search-results" />
                </div>
                <div className="form-group">
                  <label htmlFor="caseClientSelect">Or select from list</label>
                  <select id="caseClientSelect">
                    <option value="">Select a client to add…</option>
                  </select>
                </div>
              </div>

              <div id="selectedClientChips" className="selected-client-chips" />
              <p id="caseClientStatus" className="field-hint" />
            </div>

            {/* ── Per-client basic info cards (filled by JS) ── */}
            <div id="selectedClientsForms" />

            {/* ── Case setup ── */}
            <div
              className="form-section"
              id="caseSetupSection"
              style={{ display: "none" }}
            >
              <div className="form-section-title">Case setup</div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="case_adviser">
                    Adviser <span className="req">*</span>
                  </label>
                  <select id="case_adviser">
                    <option value="">Select adviser…</option>
                  </select>
                  <span className="field-error" data-error-for="case_adviser" />
                </div>
                <div className="form-group">
                  <label htmlFor="case_priority">Priority</label>
                  <select id="case_priority" speed-bind="CasePriority">
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="case_category">
                    Category <span className="req">*</span>
                  </label>
                  <select id="case_category">
                    <option value="">Select category…</option>
                    <option value="MORTGAGE">Mortgage</option>
                    <option value="P4L">P4L (Protection for Life)</option>
                    <option value="GI">General Insurance</option>
                  </select>
                  <span className="field-error" data-error-for="case_category" />
                </div>
                <div className="form-group">
                  <label htmlFor="case_type">
                    Type <span className="req">*</span>
                  </label>
                  <select id="case_type" disabled>
                    <option value="">Select category first…</option>
                  </select>
                  <span className="field-error" data-error-for="case_type" />
                </div>
              </div>
            </div>

            {/* ── Type-specific fields (placeholder) ── */}
            <div
              className="form-section"
              id="caseTypeDetailSection"
              style={{ display: "none" }}
            >
              <div className="form-section-title" id="caseTypeDetailTitle">
                Case details
              </div>
              <div className="case-type-placeholder" id="caseTypeDetailBody">
                <p>
                  Fields for the selected category and type will appear here once
                  they are defined. Nothing is assumed yet.
                </p>
              </div>
            </div>

            <div className="form-footer">
              <a href="#/cases" className="btn btn-secondary">
                Cancel
              </a>
              <ClientButton
                clax="btn btn-primary"
                func="NewCaseComponent.confirmSubmit"
                prop="NewCase"
              >
                Create case
              </ClientButton>
            </div>
          </div>
        </div>
      </>
    );
  }

  public componentDidMount(): void {
    (window as any).loadNewCaseComponent();
  }
}