import * as React from "react";
import { Link } from "react-router-dom";
// import { NewLoader } from "../../../../Global/NewLoader";
// import { Link } from "react-router-dom";
// import ClientButton from "../../../../Global/ClientButton";
// // import { NewLoader } from "../../../../Global/NewLoader";
// import IdeaFormSkeleton from "../../../../Global/IdeaFormSkeleton";

require("clients");

export default class Clients extends React.Component<{}, {}> {
  public render(): React.ReactElement {
    return (
      <>
        <div className="" id="view-clients">
          <div className="section-hdr" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16 }}>Client Database</h2>
            <Link to="/new-client"
              className="btn btn-primary btn-sm"
              id="addNewClientBtn"
            >
              ＋ Add Client
            </Link>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>S/N</th>
                    <th speed-table-data="Title">Name</th>
                    <th speed-table-data="EmailAddress">Email</th>
                    <th speed-table-data="MobileNumber">Phone</th>
                    <th speed-table-data="EmploymentStatus">Employment</th>
                    <th speed-table-data="Modified">Action</th>
                    <th />
                  </tr>
                </thead>
                <tbody id="speed-data-table" />
              </table>
            </div>
          </div>
          <div id="myrequestpagination" className="pagination" />
        </div>
      </>
    );
  }

  public componentDidMount(): void {
    window.loadClientsComponent();
  }
}
