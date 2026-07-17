import * as React from "react";
import { Link } from "react-router-dom";
// import { NewLoader } from "../../../../Global/NewLoader";
// import { Link } from "react-router-dom";
// import ClientButton from "../../../../Global/ClientButton";
// // import { NewLoader } from "../../../../Global/NewLoader";
// import IdeaFormSkeleton from "../../../../Global/IdeaFormSkeleton";

require("cases");

export default class Cases extends React.Component<{}, {}> {
  public render(): React.ReactElement {
    return (
      <>
        <div className="" id="view-cases">
          <div className="section-hdr" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16 }}>All Cases</h2>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div className="filter-tabs">
                <div className="ft active">
                  All
                </div>
                <div className="ft">
                  Active
                </div>
                <div className="ft">
                  Pending Approval
                </div>
              </div>
              <Link to='/new-case'
                className="btn btn-primary btn-sm"
              >
                ＋ New Case
              </Link>
            </div>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Client(s)</th>
                    <th>Adviser</th>
                    <th>Lender</th>
                    <th>Loan</th>
                    <th>Stage</th>
                    <th>Approval</th>
                    <th />
                  </tr>
                </thead>
                <tbody id="casesTable" />
              </table>
            </div>
          </div>
        </div>
      </>
    );
  }

  public componentDidMount(): void {
    window.loadCasesComponent();
  }
}
