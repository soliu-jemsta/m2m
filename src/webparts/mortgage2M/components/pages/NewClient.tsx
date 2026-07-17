import * as React from "react";
import ClientButton from "../../../../Global/ClientButton";
// import { NewLoader } from "../../../../Global/NewLoader";
// import { Link } from "react-router-dom";
// import ClientButton from "../../../../Global/ClientButton";
// // import { NewLoader } from "../../../../Global/NewLoader";
// import IdeaFormSkeleton from "../../../../Global/IdeaFormSkeleton";

require("newclient");

export default class NewClient extends React.Component<{}, {}> {
  public render(): React.ReactElement {
    return (
      <>
        <div className="form-page">
          <div className="page-header">
            <div>
              <h1>Add New Client</h1>
              <p>Register a new client in the CRM</p>
            </div>
          </div>

          <div className="form-container">
            {/* Personal Information */}
            <div className="form-section">
              <div className="form-section-title">Personal Details</div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    First Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="cl_firstName"
                    placeholder="Enter first name!"
                    speed-bind="FirstName"
                  />
                </div>

                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text"
                    id="cl_dob"
                    speed-bind="LastName"
                    placeholder="Enter Last Name!"
                    />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" id="cl_dob"
                    speed-bind="DOB"
                  />
                </div>
                <div className="form-group">
                  <label>National Insurance Number</label>
                  <input
                    type="text"
                    id="cl_niNumber"
                    placeholder="Encrypted NI Number"
                    speed-bind="NIN"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nationality</label>
                  <input type="text" id="cl_nationality"
                    speed-bind="Nationality"
                    placeholder="Enter text here"
                  />
                </div>

                <div className="form-group">
                  <label>Marital Status</label>
                  <select id="cl_maritalStatus" speed-bind="MaritalStatus">
                    <option value="">Select...</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Civil Partnership">Civil Partnership</option>
                  </select>
                </div>
              </div>

              <div className="form-row">

                <div className="form-group">
                  <label>Contact Preference</label>
                  <select id="cl_contactPreference" speed-bind="ContactPreference">
                    <option value="">Select...</option>
                    <option value="Email">Email</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Phone">Phone</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="form-section">
              <div className="form-section-title">Contact Information</div>

              <div className="form-row">
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input type="tel" id="cl_mobile"
                    speed-bind="MobileNumber"
                    placeholder="Enter value here"
                  />
                </div>

                <div className="form-group">
                  <label>Home Number</label>
                  <input type="tel" id="cl_homePhone"
                    speed-bind="HomePhone"
                    placeholder="Enter value here"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Work Number</label>
                  <input type="tel" id="cl_workPhone"
                    speed-bind="WorkNumber"
                    placeholder="Enter value here"
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" id="cl_email"
                    speed-bind="EmailAddress"
                    placeholder="eg. name@mail.com"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Residential Address</label>
                  <input type="text" id="cl_residentialAddress"
                    speed-bind="ResidentialAddress"
                    placeholder="Enter text here"
                  />
                </div>

                <div className="form-group">
                  <label>Correspondence Address</label>
                  <input type="text" id="cl_correspondenceAddress"
                    speed-bind="CorrespondenceAddress"
                    placeholder="Enter text here"
                  />
                </div>
              </div>
            </div>

            {/* Employment Information */}

            <div className="form-section">
              <div className="form-section-title">Employment Information</div>

              <div className="form-row">
                <div className="form-group">
                  <label>Employment Status</label>
                  <select id="cl_employmentStatus" speed-bind="EmploymentStatus">
                    <option value="">Select...</option>
                    <option value="Employed">Employed</option>
                    <option value="Self-Employed">Self-Employed</option>
                    <option value="Unemployed">Unemployed</option>
                    <option value="Retired">Retired</option>
                    <option value="Student">Student</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Employer Details</label>
                  <input type="text" id="cl_employer" 
                    speed-bind="EmployerDetails"
                    placeholder="Enter text here"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Job Title</label>
                  <input type="text" id="cl_jobTitle"
                    speed-bind="JobTitle"
                    placeholder="Enter text here"
                  />
                </div>

                <div className="form-group">
                  <label>Annual Income</label>
                  <input type="number" id="cl_annualIncome" 
                    speed-bind="AnnualIncome"
                    placeholder="Enter value here"
                  />
                </div>
              </div>

              <div className="form-row single">
                <div className="form-group">
                  <label>Additional Income</label>
                  <input type="number" id="cl_additionalIncome"
                    speed-bind="AdditionalIncome"
                    placeholder="Enter value here"
                  />
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="form-section">
              <div className="form-section-title">Financial Information</div>

              <div className="form-row">
                <div className="form-group">
                  <label>Credit Profile Indicators</label>
                  <textarea id="cl_creditProfile" rows={3}
                    speed-bind="CreditProfileIndicator"
                    placeholder="Enter text here"
                  />
                </div>

                <div className="form-group">
                  <label>Existing Mortgages</label>
                  <input type="text" id="cl_existingMortgages"
                    speed-bind="ExistingMortgages"
                    placeholder="Enter text here"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Loans</label>
                  <input type="text" id="cl_loans"
                    speed-bind="Loans"
                    placeholder="Enter text here"
                  />
                </div>

                <div className="form-group">
                  <label>Credit Commitments</label>
                  <input type="number" id="cl_creditCommitments"
                    speed-bind="CreditCommitments"
                    placeholder="Enter value here"
                  />
                </div>
              </div>

              <div className="form-row single">
                <div className="form-group">
                  <label>Monthly Expenditure</label>
                  <input type="number" id="cl_monthlyExpenditure"
                    speed-bind="MonthlyExpenditure"
                    placeholder="Enter value here"
                  />
                </div>
              </div>
            </div>

            {/* Protection Information */}
            <div className="form-section">
              <div className="form-section-title">Protection Information</div>

              <div className="form-row">
                <div className="form-group">
                  <label>Existing Life Insurance</label>
                  <select id="cl_lifeInsurance" speed-bind="ExistingLifeInsurance">
                    <option value="">Select...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Critical Illness Cover</label>
                  <select id="cl_criticalIllness" speed-bind="CriticalIllnessCover">
                    <option value="">Select...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Income Protection</label>
                  <select id="cl_incomeProtection" speed-bind="IncomeProtection">
                    <option value="">Select...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Family Protection Arrangements</label>
                  <textarea id="cl_familyProtection" rows={3}
                    placeholder="Enter text here"
                    speed-bind="FamilyProtectionArrangements"
                  />
                </div>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="form-footer">
              <a href="#/clients" className="btn btn-secondary">
                Back
              </a>
              {/* <button className="btn btn-primary">Create Case →</button> */}
              <ClientButton
                clax="btn btn-primary"
                func="NewClientComponent.confirmSubmit"
                prop="NewClient"
                >
                Create Client →
              </ClientButton>
            </div>
          </div>
        </div>
      </>
    );
  }

  public componentDidMount(): void {
    window.loadNewClientComponent();
  }
}
