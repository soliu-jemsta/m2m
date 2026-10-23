import * as React from "react";
import ClientButton from "../../../../Global/ClientButton";

require("newclient");

/**
 * Client intake — basic information only.
 * Advanced (employment / financial / protection) is hidden for now.
 */
export default class NewClient extends React.Component<{}, {}> {
  public render(): React.ReactElement {
    return (
      <>
        <div className="form-page client-intake-page">
          <div className="page-header">
            <div>
              <h1>Add client</h1>
              <p>Capture basic client details</p>
            </div>
          </div>

          <div className="form-container">
            <div className="form-section" id="basicInfoSection">
              <div className="form-section-title">Basic information</div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cl_firstName">
                    First name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="cl_firstName"
                    placeholder="e.g. Jane"
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
                    placeholder="e.g. Smith"
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
                    placeholder="name@example.com"
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
                    placeholder="07xxx xxxxxx"
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
                  <input
                    type="date"
                    id="cl_dob"
                    speed-bind="DOB"
                    data-validate="dob"
                  />
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
                  <label htmlFor="cl_residentialAddress">
                    Residential address
                  </label>
                  <input
                    type="text"
                    id="cl_residentialAddress"
                    speed-bind="ResidentialAddress"
                    data-validate="text"
                    placeholder="Start typing an address…"
                    maxLength={250}
                    autoComplete="off"
                  />
                  <div
                    id="residentialAddressSuggestions"
                    className="address-suggestions"
                  />
                  <span className="field-hint">
                    Suggestions use OpenStreetMap (free). Pick one or type freely.
                  </span>
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
                    data-validate="text"
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

            {/* Advanced sections kept in DOM but hidden — for later */}
            <div id="advancedInfoSection" style={{ display: "none" }} aria-hidden="true">
              <input type="hidden" id="cl_niNumber" speed-bind="NIN" />
            </div>

            <div className="form-footer">
              <a href="#/clients" className="btn btn-secondary">
                Cancel
              </a>
              <ClientButton
                clax="btn btn-primary"
                func="NewClientComponent.confirmSubmit"
                prop="NewClient"
              >
                Save client
              </ClientButton>
            </div>
          </div>
        </div>
      </>
    );
  }

  public componentDidMount(): void {
    (window as any).loadNewClientComponent();
  }
}