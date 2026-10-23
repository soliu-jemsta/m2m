import * as React from "react";
import ClientButton from "../../../../Global/ClientButton";

require("newcase");
require("newclient"); // ClientFormUtils, nationality, address helpers

/**
 * Create Case
 * 1) Select client → show editable basic info (same fields as Add Client)
 * 2) Select one or more case types
 * 3) Type-specific fields render in placeholder panels (content TBD — not assumed)
 */
export default class NewCase extends React.Component<{}, {}> {
  public render(): React.ReactElement {
    return (
      <>
        <div className="form-page client-intake-page create-case-page">
          <div className="page-header">
            <div>
              <h1>Create case</h1>
              <p>Select a client, confirm their details, then choose case type(s)</p>
            </div>
          </div>

          <div className="form-container">
            {/* ── Client selection ── */}
            <div className="form-section">
              <div className="form-section-title">Client</div>
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
                    <option value="">Select a client…</option>
                  </select>
                </div>
              </div>
              <p id="caseClientStatus" className="field-hint" />
            </div>

            {/* ── Basic client info (shown after selection) ── */}
            <div
              className="form-section"
              id="caseClientBasicSection"
              style={{ display: "none" }}
            >
              <div className="form-section-title">Client basic information</div>
              <p className="client-type-hint">
                Review and update if needed. Changes are saved to the client record when you create the case.
              </p>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cl_firstName">
                    First name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="cl_firstName"
                    speed-bind-validate="FirstName"
                    data-validate="required|name"
                    maxLength={80}
                  />
                  <span className="field-error" data-error-for="cl_firstName" />
                </div>
                <div className="form-group">
                  <label htmlFor="cl_lastName">
                    Last name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="cl_lastName"
                    speed-bind-validate="LastName"
                    data-validate="required|name"
                    maxLength={80}
                  />
                  <span className="field-error" data-error-for="cl_lastName" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cl_email">
                    Email address <span className="req">*</span>
                  </label>
                  <input
                    type="email"
                    id="cl_email"
                    speed-bind-validate="EmailAddress"
                    data-validate="required|email"
                    maxLength={254}
                  />
                  <span className="field-error" data-error-for="cl_email" />
                </div>
                <div className="form-group">
                  <label htmlFor="cl_mobile">
                    Mobile number <span className="req">*</span>
                  </label>
                  <input
                    type="tel"
                    id="cl_mobile"
                    speed-bind-validate="MobileNumber"
                    data-validate="required|phone"
                    maxLength={20}
                  />
                  <span className="field-error" data-error-for="cl_mobile" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cl_dob">Date of birth</label>
                  <input type="date" id="cl_dob" speed-bind="DOB" data-validate="dob" />
                  <span className="field-error" data-error-for="cl_dob" />
                </div>
                <div className="form-group">
                  <label htmlFor="cl_nationality">Nationality</label>
                  <select id="cl_nationality" speed-bind="Nationality">
                    <option value="">Select country…</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cl_maritalStatus">Marital status</label>
                  <select id="cl_maritalStatus" speed-bind="MaritalStatus">
                    <option value="">Select…</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Civil Partnership">Civil Partnership</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="cl_contactPreference">Contact preference</label>
                  <select id="cl_contactPreference" speed-bind="ContactPreference">
                    <option value="">Select…</option>
                    <option value="Email">Email</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Phone">Phone</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>
              </div>

              <div className="form-row single">
                <div className="form-group address-autocomplete-group">
                  <label htmlFor="cl_residentialAddress">Residential address</label>
                  <input
                    type="text"
                    id="cl_residentialAddress"
                    speed-bind="ResidentialAddress"
                    placeholder="Start typing an address…"
                    maxLength={250}
                    autoComplete="off"
                  />
                  <div
                    id="residentialAddressSuggestions"
                    className="address-suggestions"
                  />
                </div>
              </div>

              <div className="form-row single">
                <div className="form-group">
                  <label className="checkbox-label" htmlFor="cl_sameAddress">
                    <input type="checkbox" id="cl_sameAddress" />
                    <span>Correspondence address is the same as residential</span>
                  </label>
                </div>
              </div>

              <div className="form-row single" id="correspondenceAddressRow">
                <div className="form-group address-autocomplete-group">
                  <label htmlFor="cl_correspondenceAddress">
                    Correspondence address
                  </label>
                  <input
                    type="text"
                    id="cl_correspondenceAddress"
                    speed-bind="CorrespondenceAddress"
                    placeholder="Start typing an address…"
                    maxLength={250}
                    autoComplete="off"
                  />
                  <div
                    id="correspondenceAddressSuggestions"
                    className="address-suggestions"
                  />
                </div>
              </div>
            </div>

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

              <div className="form-row single">
                <div className="form-group">
                  <label>
                    Case type(s) <span className="req">*</span>
                  </label>
                  <p className="client-type-hint">
                    Select one or more. Each type can open its own set of fields below when those are defined.
                  </p>
                  <div className="case-type-grid" id="caseTypeGrid" role="group" aria-label="Case types">
                    <label className="case-type-chip">
                      <input type="checkbox" name="caseType" value="MORTGAGE" data-label="Mortgage" />
                      <span>Mortgage</span>
                    </label>
                    <label className="case-type-chip">
                      <input type="checkbox" name="caseType" value="P4L" data-label="Protection for Life" />
                      <span>Protection for Life (P4L)</span>
                    </label>
                    <label className="case-type-chip">
                      <input type="checkbox" name="caseType" value="GI" data-label="General Insurance" />
                      <span>General Insurance</span>
                    </label>
                  </div>
                  <span className="field-error" data-error-for="caseTypeGrid" />
                </div>
              </div>
            </div>

            {/* ── Type-specific panels (placeholders — no assumed fields) ── */}
            <div id="caseTypePanels">
              <div
                className="form-section case-type-panel"
                id="panel_MORTGAGE"
                data-case-type="MORTGAGE"
                style={{ display: "none" }}
              >
                <div className="form-section-title">Mortgage details</div>
                <div className="case-type-placeholder">
                  <p>
                    Fields for this case type will appear here once they are defined.
                    Nothing is assumed yet.
                  </p>
                </div>
              </div>

              <div
                className="form-section case-type-panel"
                id="panel_P4L"
                data-case-type="P4L"
                style={{ display: "none" }}
              >
                <div className="form-section-title">Protection for Life details</div>
                <div className="case-type-placeholder">
                  <p>
                    Fields for this case type will appear here once they are defined.
                    Nothing is assumed yet.
                  </p>
                </div>
              </div>

              <div
                className="form-section case-type-panel"
                id="panel_GI"
                data-case-type="GI"
                style={{ display: "none" }}
              >
                <div className="form-section-title">General Insurance details</div>
                <div className="case-type-placeholder">
                  <p>
                    Fields for this case type will appear here once they are defined.
                    Nothing is assumed yet.
                  </p>
                </div>
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