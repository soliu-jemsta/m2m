import * as React from "react";
import ClientButton from "../../../../Global/ClientButton";

require("newcase");
require("newclient"); // ClientFormUtils, nationality, address helpers

/**
 * Create Case
 * 1) Select one or more clients → editable basic info per client
 * 2) Category → Type + Adviser / Mortgage Admin
 * 3) Mortgage: compact document checklist (for client email)
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
                Select clients, assign adviser &amp; admin, choose category and
                type, then confirm document requirements
              </p>
            </div>
          </div>

          <div className="form-container">
            {/* ── Client selection ── */}
            <div className="form-section">
              <div className="form-section-title">Clients</div>
              <p className="client-type-hint">
                Add up to <strong id="caseClientMaxHint">2</strong> clients
                (e.g. joint applicants). Each person&apos;s basic details can be
                reviewed and updated below.
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
                  <label htmlFor="case_mortgageAdmin">
                    Mortgage Admin <span className="req">*</span>
                  </label>
                  <select id="case_mortgageAdmin">
                    <option value="">Select mortgage admin…</option>
                  </select>
                  <span
                    className="field-error"
                    data-error-for="case_mortgageAdmin"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="case_priority">Priority</label>
                  <select id="case_priority" speed-bind="CasePriority">
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div className="form-group" />
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

            {/* ── Document requirements (all categories, once type selected) ── */}
            <div
              className="form-section"
              id="docChecklistSection"
              style={{ display: "none" }}
            >
              <div className="form-section-title">
                Document requirements
                <span className="section-title-hint">
                  {" "}
                  · select what to request in the client email
                </span>
              </div>
              <p className="client-type-hint">
                Compact checklist based on the initial client email template.
                Expand a row for acceptable documents and remarks.
              </p>
              <div id="docChecklistRoot" className="doc-checklist" />
              <div className="doc-checklist-preview">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  id="docChecklistPreviewBtn"
                >
                  Preview email text
                </button>
                <pre id="docChecklistPreview" className="doc-checklist-preview-box" />
              </div>
            </div>

            {/* ── Non-mortgage type placeholder ── */}
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
                  they are defined.
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