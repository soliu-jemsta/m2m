import * as React from "react";
import CustomPeoplePicker from "../../../../Global/CustomPeoplePicker";
// import { Link } from "react-router-dom";
// import { NewLoader } from "../../../../Global/NewLoader";
// import { Link } from "react-router-dom";
// import ClientButton from "../../../../Global/ClientButton";
// // import { NewLoader } from "../../../../Global/NewLoader";
// import IdeaFormSkeleton from "../../../../Global/IdeaFormSkeleton";
import ClientButton from "../../../../Global/ClientButton";

require("newcase");
require('dynamicrenderer');

export default class NewCase extends React.Component<{}, {}> {
  public render(): React.ReactElement {
    return (
      <>
        <div className="form-page">
          <div className="page-header">
            <div>
              <h1>Create New Case</h1>
              <p>Complete all required fields to open a new mortgage case</p>
            </div>
          </div>

          <div className="form-container">
            {/* Client Information */}
            <div className="form-section">
              <div className="form-section-title">Client Information</div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    Client <span className="req">*</span>
                  </label>
                  <CustomPeoplePicker 
                    validate-control="true"
                    custom-people="Client"
                    validation-msg="Please select a client"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Adviser <span className="req">*</span>
                  </label>
                  <CustomPeoplePicker 
                    validate-control="true"
                    custom-people="Adviser"
                    validation-msg="Please select an Adviser"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Case Priority</label>
                  <select id="case_priority" speed-bind-validate="CasePriority">
                    <option value="">Select...</option>
                    <option>Normal</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" id="case_startDate" speed-bind-validate="StartDate"/>
                </div>
              </div>
            </div>

            {/* Mortgage Details */}
            <div className="form-section">
              <div className="form-section-title">Mortgage Requirements</div>

              <div className="form-row">
                <div className="form-group">
                  <label>Application Type</label>
                  <select id="application_type"  speed-bind-validate="ApplicationType" />
                </div>

                <div className="form-group hidden" id="mortgage_type_group">
                  <label>Mortgage Type</label>
                  <select id="mortgage_type" speed-bind="MortgageType" />
                </div>

                <div className="form-group hidden" id="p4l_type_group">
                  <label>Protection Type</label>
                  <select id="p4l_type" speed-bind="P4LType" />
                </div>

                <div className="form-group hidden" id="gi_type_group">
                  <label>Insurance Type</label>
                  <select id="gi_type" speed-bind="GIType" />
                </div>
              </div>
            </div>

            {/* Property Details */}
            {/* <div className="form-section" id="form_section">
              <div className="form-section-title">Property Details</div>

              <div className="form-row single">
                <div className="form-group">
                  <label>Security Address</label>
                  <textarea rows={3} id="case_securityAddress" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Property Information</label>
                  <textarea rows={3} id="case_propertyInfo" />
                </div>

                <div className="form-group">
                  <label>Selling Agent Information</label>
                  <textarea rows={3} id="case_sellingAgent" />
                </div>
              </div>
            </div> */}

              <div className="form-section" id="dynamic-fields-container"></div>
            {/* Action Buttons */}
            <div className="form-footer">
              <a href="#/cases" className="btn btn-secondary">
                Back
              </a>
              <ClientButton
                clax="btn btn-primary"
                func="NewCaseComponent.confirmSubmit"
                prop="NewCase"
                >
                Create Case →
              </ClientButton>
            </div>
          </div>
        </div>
      </>
    );
  }

  public componentDidMount(): void {
    window.loadNewCaseComponent();
  }
}
