import * as React from "react";
import ClientButton from "../Global/ClientButton";
export default class Modal extends React.Component<{}, {}> {
  public render(): React.ReactElement {
    return (
      <>
        {/* delete modal */}
        <div
          className="modal fade"
          id="deleteModal"
          tabIndex={-1}
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <div className="icon">
                  <img src={require("../Assets/img/delete-icon.png")} />
                </div>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <h4 className="title">Delete data</h4>
                <p>Are you sure you want to delete this data?</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  data-bs-dismiss="modal"
                >
                  Close
                </button>
                <ClientButton 
                clax="del-btn btn"
                func="DashboardComponent.deleteCode">
                  Delete
                </ClientButton>
              </div>
            </div>
          </div>
        </div>
        {/* success modal*/}
        <div
          className="modal fade"
          id="successModal"
          tabIndex={-1}
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <div className="icon">
                  <img src={require("../Assets/img/success-icon.png")} />
                </div>
              </div>
              <div className="modal-body">
                <h4 className="title">Action Successful</h4>
                <p id="successmodaltext"></p>
              </div>
            </div>
          </div>
        </div>

        {/* error modal*/}
        <div
          className="modal fade"
          id="criticalModal"
          tabIndex={-1}
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <div className="icon">
                  <img src={require("../Assets/img/error.png")} />
                </div>
              </div>
              <div className="modal-body">
                <h4 className="title">So Sorry, Something Went Wrong</h4>
                <p id="criticalerrortext"></p>
              </div>
            </div>
          </div>
        </div>

        {/* confirm modal*/}
        <div
          className="modal fade"
          id="confirmModal"
          tabIndex={-1}
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <div className="icon">
                  {/* <img src={require("../Assets/img/confirm-icon.png")} /> */}
                </div>
              </div>
              <div className="modal-body">
                <h4 className="title">
                  Are you sure you want to take this action?
                </h4>
                {/* <p>You just added a user to this card</p> */}
              </div>
              <div className="modal-footer">
                <ClientButton
                  func="confirmAction"
                  clax="btn btn-primary"
                  prop=""
                  attr=""
                >
                  Yes
                </ClientButton>
                <button
                  type="button"
                  className="btn btn-ghost"
                  data-bs-dismiss="modal"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* page modal*/}
        <div
          className="modal fade"
          id="erploader"
          tabIndex={-1}
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content"
              style={{ backgroundColor: "transparent", border: "none" }}
            >
              <div className="modal-body">
                {/* <img className="animated-image" src={require("../Assets/img/rslogo_colored.png")} style={{ display: "block", margin: "0 auto" }} /> */}
                <h3
                  id="loadertext"
                  style={{ textAlign: "center", color: "white" }}
                >
                  Loading...
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* reroute  modal*/}
        <div
          className="modal fade"
          id="rerouteModal"
          tabIndex={-1}
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <div className="create_task_icon">
                  <img src={require("../Assets/img/flag.png")} />
                </div>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                />
              </div>
              <div className="form_container px-4 py-3">
                <div className="header_box">
                  <h4>
                    Reroute <span id="routerequesttitle"></span>
                  </h4>
                  <p>
                    Change the stage of the request based on the stage available
                    in the workflow
                  </p>
                </div>
                <div className="form_body">
                  <div className="form-group row">
                    <div className="col-12 col-lg-12">
                      <label>
                        Stage<span className="required">*</span>
                      </label>
                      <select
                        id="rerouteselect"
                        className="form-select"
                      ></select>
                    </div>
                  </div>
                  <div className="form-group d-flex justify-content-end gap-3">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                    >
                      Back
                    </button>
                    <ClientButton
                      func={"MainApplication.ReportComponent.updateRoute"}
                      clax={"btn btn-primary"}
                      prop=""
                      attr=""
                    >
                      Update
                    </ClientButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="modal fade profile-modal"
          id="employeeProfileModal"
          tabIndex={-1}
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <div className="icon">
                  <img src={require("../Assets/img/flag.png")} />
                </div>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <h4 className="title">Profile details</h4>
                <div className="profile-block">
                  <div className="primary_details d-flex gap-2">
                    <div className="img-block circle-div">
                      <img
                        id="viewuserpicmodal"
                        src={require("../Assets/img/avatar.png")}
                        className="img-fluid"
                      />
                    </div>
                    <div>
                      <h3 id="_Title">
                        {" "}
                        <span>
                          <img src={require("../Assets/img/verify.png")} />
                        </span>
                      </h3>
                      <p id="_PhoneNumber" className="mb-2"></p>
                      <p id="_Email" className="mb-2"></p>
                      <p id="_LinkedIn" className="mb-2"></p>{" "}
                      {/* Added LinkedIn */}
                    </div>
                  </div>
                  <div>
                    {" "}
                    {/* Added Short Bio section */}
                    <h5>About</h5>
                    <p id="_ShortBio" className="mb-2"></p>
                  </div>
                  <div className="details mt-4">
                    <h5>Here are the full details</h5>
                    <div className="d-flex justify-content-between mb-2">
                      <p>Role</p>
                      <p id="_JobRole"></p>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <p>Supervisor</p>
                      <p id="_Supervisor"></p>
                    </div>

                    <div id="_organogramviewmodal"></div>

                    <div className="d-flex justify-content-between mb-2">
                      <p>Account status</p>
                      <button
                        id="viewprofilestatusmodal"
                        type="button"
                        className="btn profile-active"
                      >
                        Active
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="modal fade profile-modal"
          id="storeitemModal"
          tabIndex={-1}
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <div className="icon">
                  <img src={require("../Assets/img/flag.png")} />
                </div>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <h4 className="title">Item details</h4>
                <div className="profile-block">
                  <div className="primary_details d-flex gap-2">
                    <div className="img-block circle-div">
                      <img
                        id="itempicmodal"
                        src={require("../Assets/img/avatar.png")}
                        className="img-fluid"
                      />
                    </div>
                    <div>
                      <h3 id="Inv_Title">
                        {" "}
                        <span>
                          <img src={require("../Assets/img/verify.png")} />
                        </span>
                      </h3>
                      <p id="Inv_Category" className="mb-2"></p>
                    </div>
                  </div>
                  <div>
                    <h5>Description</h5>
                    <p id="Inv_Description" className="mb-2"></p>
                  </div>
                  <div className="details mt-4">
                    <h5>Here are the full details</h5>
                    <div className="d-flex justify-content-between mb-2">
                      <p>Unit Of Measurement</p>
                      <p id="Inv_UoM"></p>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <p>Warehouse</p>
                      <p id="Inv_Warehouse"></p>
                    </div>

                    <div className="d-flex justify-content-between mb-2">
                      <p>Cost Price</p>
                      <p id="Inv_CPPU"></p>
                    </div>

                    <div className="d-flex justify-content-between mb-2">
                      <p>Available Stock</p>
                      <p id="Inv_AvailableStock"></p>
                    </div>

                    {/* <div className="d-flex justify-content-between mb-2">
                                            <p>Account status</p>
                                            <button id="viewprofilestatusmodal" type="button" className="btn profile-active">
                                                Active
                                            </button>
                                        </div> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Modal */}
        <div
          className="modal fade profile-modal"
          id="newSuccessModal"
          tabIndex={-1}
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="success-bar">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div className="success-ico">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div className="success-title">Survey Sent Successfully!</div>
                  <div className="success-msg" id="success-msg">
                    Data recorded and reflected in analytics.
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    data-bs-dismiss="modal"
                    style={{ marginLeft: "auto" }}
                  >
                    💡 Submit Another Idea
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}
